import { initializeApp } from "firebase/app";
import {
  getAuth,
  type User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  getDocs,
  getDocsFromServer,
  query,
  where,
  serverTimestamp,
  runTransaction,
  Timestamp,
  updateDoc
} from "firebase/firestore";
import { normalizeProgression, type PlayerProgression } from './data/progression';
import { CONTENT_VERSION } from './data/contentVersion';
import { AVATARS, DEFAULT_AVATAR_ID, getAvatarById, type AvatarId } from './data/avatars';
import { ASSESSMENT_TIME_LIMIT_SECONDS } from './data/assessmentTiming';

const firebaseConfig = {
  apiKey: "AIzaSyA9loc7wpdtyRrKmwGago1S0so7j3KTj1c",
  authDomain: "sandbox-thesis.firebaseapp.com",
  databaseURL: "https://sandbox-thesis-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sandbox-thesis",
  storageBucket: "sandbox-thesis.firebasestorage.app",
  messagingSenderId: "543031512593",
  appId: "1:543031512593:web:e41386bd4bed13fe15abb0",
  measurementId: "G-TL3TW6CND0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider =
  new GoogleAuthProvider();

// Auth accounts and Firestore profiles are separate records. Repair a missing
// profile on the next authenticated session, while keeping existing profiles
// intact.
export const ensureUserProfile = async (user: User, preferredName?: string) => {
  const userRef = doc(db, 'users', user.uid);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(userRef);
    if (snapshot.exists()) return;
    const emailName = user.email?.split('@')[0]?.trim();
    const username = preferredName?.trim() || user.displayName?.trim() || emailName || 'Operator';
    transaction.set(userRef, {
      username,
      email: user.email ?? '',
      createdAt: new Date().toISOString(),
      scores: {},
      completedMissions: []
    });
  });
};

export const signInWithGoogle = async () => {
  const result =
    await signInWithPopup(
      auth,
      googleProvider
    );

  await ensureUserProfile(result.user);

  return result.user;
};

export const registerWithEmail = async (
  email: string,
  password: string,
  username: string
) => {
  const result =
    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

  await updateProfile(
    result.user,
    {
      displayName: username
    }
  );

  await ensureUserProfile(result.user, username);
  // The auth listener may have created the profile during account creation;
  // persist the chosen registration name in either ordering.
  await setDoc(doc(db, 'users', result.user.uid), { username, email: result.user.email ?? email }, { merge: true });

  return result.user;
};

export const loginWithEmail = async (
  email: string,
  password: string
) => {
  const result =
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  return result.user;
};

export const logOut = async () => {
  await signOut(auth);
};

export interface AssessmentSession {
  sessionId: string;
  clientId?: string;
  testKey: string;
  tier: string;
  testType: 'pre' | 'post';
  questionOrder: string[];
  answers: Record<string, string | null>;
  currentIndex: number;
  revision?: number;
  startedAt: Timestamp;
  clockSyncAt?: Timestamp;
  clockOffsetMs?: number;
  status: 'in_progress' | 'completed';
  timedOut?: boolean;
}

const activeSessionRef = (userId: string) => doc(db, 'users', userId, 'sessions', 'active');

let memorySessionId = '';
export const getBrowserSessionId = () => {
  const key = 'sandbox-secure-tab-session-id';
  try {
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    if (!memorySessionId) memorySessionId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return memorySessionId;
  }
};

export const takeOverActiveSession = async (userId: string, sessionId: string, clientId: string) => {
  const ref = activeSessionRef(userId);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    if (snapshot.data()?.sessionId !== sessionId || snapshot.data()?.status !== 'in_progress') throw new Error('The active session changed. Reload progress before resuming.');
    transaction.update(ref, { clientId, updatedAt: serverTimestamp() });
  });
};

export const getActiveSession = async (userId: string) => {
  const snapshot = await getDoc(activeSessionRef(userId));
  return snapshot.exists() ? snapshot.data() as Record<string, unknown> : null;
};

const activeClockSyncs = new Map<string, Promise<number>>();

const syncActiveSessionClockOnce = async (userId: string) => {
  const ref = activeSessionRef(userId);
  const before = Date.now();
  await updateDoc(ref, { clockSyncAt: serverTimestamp(), updatedAt: serverTimestamp() });
  const after = Date.now();
  const snapshot = await getDoc(ref);
  const clockSyncAt = snapshot.data()?.clockSyncAt as Timestamp | undefined;
  if (!clockSyncAt) throw new Error('Could not measure the Firestore server clock.');
  const offset = clockSyncAt.toMillis() - Math.round((before + after) / 2);
  await updateDoc(ref, { clockOffsetMs: offset });
  return offset;
};

export const syncActiveSessionClock = (userId: string) => {
  const pending = activeClockSyncs.get(userId);
  if (pending) return pending;
  const request = syncActiveSessionClockOnce(userId);
  activeClockSyncs.set(userId, request);
  void request.then(
    () => { if (activeClockSyncs.get(userId) === request) activeClockSyncs.delete(userId); },
    () => { if (activeClockSyncs.get(userId) === request) activeClockSyncs.delete(userId); }
  );
  return request;
};

export const startMissionSession = async (userId: string, sessionId: string, clientId: string, missionId: string, tier: string, missionOrigin: string, dailyChallenge?: { date?: string; type?: 'timeAttack' | 'accuracy' }) => {
  const ref = activeSessionRef(userId);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    const saved = snapshot.data();
    if (saved?.status === 'in_progress') {
      if (saved.clientId !== clientId) throw new Error('SESSION_OWNER_CONFLICT');
      if (saved.kind === 'mission' && saved.missionId === missionId) return saved.sessionId as string;
      throw new Error('Another activity is already in progress. Resume it before starting a new mission.');
    }
    transaction.set(ref, {
      kind: 'mission', sessionId, clientId, missionId, tier, missionOrigin,
      // Firestore rejects undefined values. Ordinary missions have no daily
      // challenge metadata, so omit those fields instead of writing undefined.
      ...(dailyChallenge?.date ? { dailyChallengeDate: dailyChallenge.date } : {}),
      ...(dailyChallenge?.type ? { dailyChallengeType: dailyChallenge.type } : {}),
      stepIndex: 0, hintsUsed: 0, wrongCommandCounts: {}, decisions: {},
      containmentState: {}, evidenceNotes: [], revision: 0,
      status: 'in_progress', startedAt: serverTimestamp(), updatedAt: serverTimestamp()
    });
    return sessionId;
  });
  const serverOffsetMs = await syncActiveSessionClock(userId);
  const savedSession = await getActiveSession(userId);
  if (!savedSession) throw new Error('Could not read the server-anchored mission start time.');
  const startTimestamp = savedSession.startedAt as Timestamp | undefined;
  if (!startTimestamp) throw new Error('Could not read the server-anchored mission start time.');
  return { sessionId: String(savedSession.sessionId), startedAtMs: startTimestamp.toMillis(), serverOffsetMs };
};

export const saveMissionSessionProgress = async (
  userId: string,
  sessionId: string,
  clientId: string,
  revision: number,
  progress: { stepIndex: number; hintsUsed: number; wrongCommandCounts: Record<string, number>; decisions: Record<string, unknown>; containmentState: Record<string, unknown>; evidenceNotes: string[] }
) => {
  const ref = activeSessionRef(userId);
  return runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    const saved = snapshot.data();
    if (saved?.sessionId !== sessionId || saved?.clientId !== clientId || saved?.kind !== 'mission' || saved?.status !== 'in_progress' || Number(saved.revision ?? -1) >= revision) return false;
    transaction.update(ref, { ...progress, revision, updatedAt: serverTimestamp() });
    return true;
  });
};

export const completeMissionSession = async (userId: string, sessionId: string) => {
  const ref = activeSessionRef(userId);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    if (snapshot.data()?.sessionId !== sessionId || snapshot.data()?.kind !== 'mission') return;
    transaction.update(ref, { status: 'completed', updatedAt: serverTimestamp() });
  });
};

export const abandonMissionSession = async (userId: string, sessionId: string, clientId: string) => {
  const ref = activeSessionRef(userId);
  return runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    const saved = snapshot.data();
    if (saved?.sessionId !== sessionId || saved?.clientId !== clientId || saved?.kind !== 'mission' || saved?.status !== 'in_progress') return false;
    transaction.update(ref, { status: 'abandoned', abandonedAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return true;
  });
};

const assessmentSessionStarts = new Map<string, Promise<{ session: AssessmentSession; serverOffsetMs: number }>>();

const startOrResumeAssessmentSessionOnce = async (
  userId: string,
  sessionId: string,
  clientId: string,
  testKey: string,
  tier: string,
  testType: 'pre' | 'post',
  questionOrder: string[]
): Promise<{ session: AssessmentSession; serverOffsetMs: number }> => {
  const ref = activeSessionRef(userId);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    const saved = snapshot.data() as Partial<AssessmentSession> | undefined;
    if (saved?.status === 'in_progress' && saved.clientId !== clientId) throw new Error('SESSION_OWNER_CONFLICT');
    if (saved?.status === 'in_progress' && saved.testKey === testKey && saved.startedAt) return;
    if (saved?.status === 'in_progress') throw new Error('Another activity is already in progress. Resume or finish it before starting this test.');
    transaction.set(ref, {
      sessionId, clientId, kind: 'test', testKey, tier, testType, questionOrder,
      answers: {}, currentIndex: 0, revision: 0, startedAt: serverTimestamp(),
      updatedAt: serverTimestamp(), status: 'in_progress'
    });
  });
  const serverOffsetMs = await syncActiveSessionClock(userId);
  const snapshot = await getDoc(ref);
  const session = snapshot.data() as AssessmentSession;
  if (!session?.startedAt || session.testKey !== testKey) throw new Error('The saved assessment session could not be loaded.');
  return { session, serverOffsetMs };
};

export const startOrResumeAssessmentSession = (
  userId: string,
  sessionId: string,
  clientId: string,
  testKey: string,
  tier: string,
  testType: 'pre' | 'post',
  questionOrder: string[]
): Promise<{ session: AssessmentSession; serverOffsetMs: number }> => {
  const key = JSON.stringify([userId, clientId, testKey]);
  const pending = assessmentSessionStarts.get(key);
  if (pending) return pending;
  const request = startOrResumeAssessmentSessionOnce(userId, sessionId, clientId, testKey, tier, testType, questionOrder);
  assessmentSessionStarts.set(key, request);
  void request.then(
    () => { if (assessmentSessionStarts.get(key) === request) assessmentSessionStarts.delete(key); },
    () => { if (assessmentSessionStarts.get(key) === request) assessmentSessionStarts.delete(key); }
  );
  return request;
};

export const saveAssessmentSessionProgress = async (
  userId: string,
  sessionId: string,
  clientId: string,
  revision: number,
  answers: Record<string, string | null>,
  currentIndex: number
) => {
  const ref = activeSessionRef(userId);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    const saved = snapshot.data();
    if (saved?.sessionId !== sessionId || saved?.clientId !== clientId || saved?.status !== 'in_progress' || Number(saved.revision ?? -1) >= revision) return;
    transaction.update(ref, { answers, currentIndex, revision, updatedAt: serverTimestamp() });
  });
};

export const finishAssessmentSession = async (userId: string, sessionId: string, clientId: string, timedOut: boolean) => {
  const ref = activeSessionRef(userId);
  return runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    if (snapshot.data()?.sessionId !== sessionId || snapshot.data()?.clientId !== clientId || snapshot.data()?.status !== 'in_progress') return false;
    transaction.update(ref, { status: 'completed', timedOut, completedAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return true;
  });
};

export const getUserProgress = async (
  userId: string
) => {
  const userSnap =
    await getDoc(
      doc(db, "users", userId)
    );

  if (!userSnap.exists()) {
    return {
      scores: {},
      completedMissions: [],
      progression: normalizeProgression(null),
      avatarId: DEFAULT_AVATAR_ID,
      preferences: {},
      leaderboardOptIn: false,
      leaderboardAlias: '',
      certificates: [] as UserCertificate[]
    };
  }

  const data =
    userSnap.data();

  return {
    scores:
      data.scores || {},
    completedMissions:
      Array.isArray(
        data.completedMissions
      )
        ? data.completedMissions
        : [],
    progression: normalizeProgression(data.progression),
    avatarId: getAvatarById(data.avatarId).id,
    preferences: data.preferences && typeof data.preferences === 'object' ? data.preferences as Record<string, unknown> : {},
    leaderboardOptIn: data.leaderboardOptIn === true,
    leaderboardAlias: typeof data.leaderboardAlias === 'string' ? data.leaderboardAlias : '',
    certificates: Array.isArray(data.certificates) ? data.certificates.filter(isUserCertificate) : []
  };
};

export interface UserCertificate {
  id: string;
  tier: string;
  recipientName: string;
  score: number;
  total: number;
  issuedAt: string;
}

const isUserCertificate = (value: unknown): value is UserCertificate => {
  if (!value || typeof value !== 'object') return false;
  const certificate = value as Partial<UserCertificate>;
  return typeof certificate.id === 'string'
    && typeof certificate.tier === 'string'
    && typeof certificate.recipientName === 'string'
    && Number.isFinite(certificate.score)
    && Number.isFinite(certificate.total)
    && typeof certificate.issuedAt === 'string';
};

export const saveUserCertificate = async (
  userId: string,
  certificate: Omit<UserCertificate, 'id' | 'issuedAt'>
): Promise<{ certificate: UserCertificate; created: boolean }> => {
  const userRef = doc(db, 'users', userId);
  return runTransaction(db, async transaction => {
    const snapshot = await transaction.get(userRef);
    const saved = snapshot.data()?.certificates;
    const certificates = Array.isArray(saved) ? saved.filter(isUserCertificate) : [];
    const existing = certificates.find(item => item.tier === certificate.tier);
    if (existing) return { certificate: existing, created: false };
    const created: UserCertificate = {
      ...certificate,
      id: `cert-${certificate.tier.toLowerCase()}`,
      issuedAt: new Date().toISOString()
    };
    transaction.set(userRef, { certificates: [...certificates, created] }, { merge: true });
    return { certificate: created, created: true };
  });
};

export const saveUserPreference = async (userId: string, key: string, value: unknown) => {
  await setDoc(doc(db, 'users', userId), { preferences: { [key]: value } }, { merge: true });
};

export const saveLeaderboardProfile = async (userId: string, optIn: boolean, alias: string) => {
  const safeAlias = normalizeLeaderboardNickname(alias);
  await setDoc(doc(db, 'users', userId), { leaderboardOptIn: optIn, leaderboardAlias: safeAlias }, { merge: true });
  return safeAlias;
};

export const markDailyTrialUsed = async (userId: string, key: string) => {
  const ref = doc(db, 'users', userId);
  return runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    const preferences = snapshot.data()?.preferences ?? {};
    const used = Array.isArray(preferences.dailyTrialUses) ? preferences.dailyTrialUses.filter((item: unknown): item is string => typeof item === 'string') : [];
    if (used.includes(key)) return false;
    transaction.set(ref, { preferences: { dailyTrialUses: [...used, key] } }, { merge: true });
    return true;
  });
};

export const saveAvatarChoice = async (userId: string, avatarId: string) => {
  if (!AVATARS.some(avatar => avatar.id === avatarId)) {
    throw new Error('Unknown avatar selection.');
  }
  await setDoc(doc(db, 'users', userId), { avatarId: avatarId as AvatarId }, { merge: true });
};

// Progression is additive. Existing assessment and mission fields remain intact.
export const saveProgression = async (userId: string, progression: PlayerProgression) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  const saved = normalizeProgression(userSnap.data()?.progression);
  const incoming = normalizeProgression(progression);
  const next = normalizeProgression({
    ...incoming,
    xp: Math.max(saved.xp, incoming.xp),
    badges: [...new Set([...saved.badges, ...incoming.badges])],
    tierRewards: [...new Set([...saved.tierRewards, ...incoming.tierRewards])],
    streak: { ...incoming.streak, longest: Math.max(saved.streak.longest, incoming.streak.longest) }
  });
  await setDoc(userRef, { progression: next }, { merge: true });
};

export const saveUserScore = async (
  userId: string,
  tier: string,
  score: number,
  total: number,
  attempt: { startedAt?: string; timedOut?: boolean; answeredCount?: number } = {}
) => {
  const safeTotal =
    Math.max(0, total);

  const safeScore =
    Math.min(
      Math.max(0, score),
      safeTotal
    );

  const userRef =
    doc(db, "users", userId);

  const userSnap =
    await getDoc(userRef);

  const previous =
    userSnap.exists()
      ? userSnap.data().scores?.[tier]
      : undefined;

  const previousFinalScore =
    previous &&
    typeof previous.finalScore ===
      "number"
      ? previous.finalScore
      : previous && typeof previous.score === "number"
        ? previous.score
      : undefined;

  const existingTierData =
    previous &&
    typeof previous === "object"
      ? previous
      : {};

  const attemptNumber = Number(existingTierData.finalAttemptCount ?? 0) + 1;
  try {
    await addDoc(collection(db, 'users', userId, 'assessmentAttempts'), {
      contentVersion: CONTENT_VERSION,
      tier,
      assessment: 'post',
      score: safeScore,
      total: safeTotal,
      attemptNumber,
      timestamp: new Date().toISOString(),
      timeLimitSeconds: ASSESSMENT_TIME_LIMIT_SECONDS,
      timedOut: Boolean(attempt.timedOut),
      answeredCount: Math.max(0, Math.min(safeTotal, attempt.answeredCount ?? safeTotal)),
      ...(attempt.startedAt ? { startedAt: attempt.startedAt } : {}),
      completedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Could not append post-test attempt record:', error);
  }

  await setDoc(
    userRef,
    {
      scores: {
        [tier]: {
          ...existingTierData,
          score: Math.max(previousFinalScore ?? 0, safeScore),
          total: safeTotal,
          finalScore: Math.max(previousFinalScore ?? 0, safeScore),
          finalTotal: safeTotal,
          firstFinalScore: existingTierData.firstFinalScore ?? previousFinalScore ?? safeScore,
          firstFinalTotal: existingTierData.firstFinalTotal ?? existingTierData.finalTotal ?? existingTierData.total ?? safeTotal,
          finalAttemptCount: attemptNumber,
          timestamp: new Date().toISOString()
        }
      }
    },
    { merge: true }
  );
};

export const savePreTestScore = async (
  userId: string,
  tier: string,
  preTestScore: number,
  preTestTotal: number,
  attempt: { startedAt?: string; timedOut?: boolean; answeredCount?: number } = {}
) => {
  const safeTotal =
    Math.max(0, preTestTotal);

  const safeScore =
    Math.min(
      Math.max(0, preTestScore),
      safeTotal
    );

  const userRef =
    doc(db, "users", userId);

  const userSnap =
    await getDoc(userRef);

  const previous =
    userSnap.exists()
      ? userSnap.data().scores?.[tier]
      : undefined;

  const existingTierData =
    previous &&
    typeof previous === "object"
      ? previous
      : {};

  const attemptNumber = Number(existingTierData.preTestAttemptCount ?? 0) + 1;
  try {
    await addDoc(collection(db, 'users', userId, 'assessmentAttempts'), {
      contentVersion: CONTENT_VERSION,
      tier,
      assessment: 'pre',
      score: safeScore,
      total: safeTotal,
      attemptNumber,
      timestamp: new Date().toISOString(),
      timeLimitSeconds: ASSESSMENT_TIME_LIMIT_SECONDS,
      timedOut: Boolean(attempt.timedOut),
      answeredCount: Math.max(0, Math.min(safeTotal, attempt.answeredCount ?? safeTotal)),
      ...(attempt.startedAt ? { startedAt: attempt.startedAt } : {}),
      completedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Could not append pre-test attempt record:', error);
  }

  await setDoc(
    userRef,
    {
      scores: {
        [tier]: {
          ...existingTierData,
          preTestScore:
            safeScore,
          preTestTotal:
            safeTotal,
          preTestFirstScore:
            existingTierData.preTestFirstScore ?? existingTierData.preTestScore ?? safeScore,
          preTestFirstTotal:
            existingTierData.preTestFirstTotal ?? existingTierData.preTestTotal ?? safeTotal,
          preTestAttemptCount:
            attemptNumber,
          preTestTimestamp:
            new Date().toISOString()
        }
      }
    },
    { merge: true }
  );
};

export const saveCompletedMissions = async (
  uid: string,
  missions: string[]
) => {
  try {
    const userRef = doc(db, "users", uid);
    const existingSnap = await getDoc(userRef);
    const existing = existingSnap.data()?.completedMissions;
    await setDoc(
      userRef,
      {
        completedMissions: [...new Set([
          ...(Array.isArray(existing) ? existing.filter((mission): mission is string => typeof mission === 'string') : []),
          ...missions
        ])]
      },
      { merge: true }
    );
  } catch (error) {
    console.error(
      "Error saving missions:",
      error
    );

    throw error;
  }
};

export interface MissionAttemptRecord {
  contentVersion?: string;
  missionId: string;
  missionTitle: string;
  tier: string;
  concept: string;
  outcome: 'completed' | 'timed_out';
  challengeMode?: boolean;
  dailyChallengeDate?: string;
  dailyChallengeType?: 'timeAttack' | 'accuracy';
  softTimeTarget?: number;
  exceededSoftTarget?: boolean;
  skillSignals?: { evidenceFirst: boolean; responseActions: number; verifiedActions: number; verifiedAll: boolean; calibratedReport: boolean; hintsUsed: number };
  xpAwarded?: number;
  startedAt: string;
  completedAt: string;
  totalTimeSeconds: number;
  hintsOpened: number;
  hintLevelsShown: number[];
  timePerStepSeconds: Record<string, number>;
  wrongCommandsByStep: Record<string, number>;
  wrongDecisionCount: number;
}

const normalizeLeaderboardNickname = (value: unknown) => {
  if (typeof value !== 'string') return 'Participant';
  const nickname = value.split('').filter(character => {
    const code = character.charCodeAt(0);
    return code > 31 && code !== 127;
  }).join('').trim().slice(0, 24).trim();
  return nickname || 'Participant';
};

// The participant prompt explicitly authorizes this named top-level leaderboard.
export const scoreDailyAccuracy = (wrongCommands: number, wrongDecisions: number, hintLevelsShown: number) =>
  Math.max(0, 100 - 5 * wrongCommands - 10 * wrongDecisions - 5 * hintLevelsShown);

export const TIME_ATTACK_WRONG_COMMAND_PENALTY_SECONDS = 5;

const isPresetAvatarId = (value: unknown): value is AvatarId =>
  typeof value === 'string' && AVATARS.some(avatar => avatar.id === value);

const createLeaderboardRecord = async (reference: ReturnType<typeof doc>, record: Record<string, unknown>) => {
  const existing = await getDoc(reference);
  if (existing.exists()) return false;
  try {
    await setDoc(reference, record);
    return true;
  } catch (error) {
    const afterWrite = await getDoc(reference).catch(() => null);
    if (afterWrite?.exists()) return false;
    throw error;
  }
};

const submitLeaderboardAttempt = async (userId: string, attempt: MissionAttemptRecord) => {
  if (attempt.outcome !== 'completed' || !attempt.dailyChallengeType || !attempt.dailyChallengeDate) return;
  const profileSnapshot = await getDoc(doc(db, 'users', userId));
  const profile = profileSnapshot.data();
  if (profile?.leaderboardOptIn !== true || typeof profile.leaderboardAlias !== 'string') return;
  const alias = normalizeLeaderboardNickname(profile.leaderboardAlias);
  if (alias !== profile.leaderboardAlias) await saveLeaderboardProfile(userId, true, alias);
  const avatar = isPresetAvatarId(profile.avatarId) ? { avatarId: profile.avatarId } : {};
  const wrongCommands = Object.values(attempt.wrongCommandsByStep ?? {}).reduce((total, count) => total + Math.max(0, Number(count) || 0), 0);
  if (attempt.dailyChallengeType === 'timeAttack') {
    const leaderboardRef = doc(db, 'dailyTimeAttackEntries', `${userId}_${attempt.dailyChallengeDate}`);
    const created = await createLeaderboardRecord(leaderboardRef, {
      uid: userId, nickname: alias, challengeDate: attempt.dailyChallengeDate,
      missionId: attempt.missionId, missionTitle: attempt.missionTitle,
      clearTimeSeconds: Math.min(3600, Math.max(5, Number(attempt.totalTimeSeconds) + wrongCommands * TIME_ATTACK_WRONG_COMMAND_PENALTY_SECONDS)),
      wrongCommandCount: wrongCommands, completedAt: attempt.completedAt, ...avatar
    });
    if (!created) console.info('Time Attack leaderboard entry already recorded for this user and date.');
  } else {
    const wrongDecisions = Math.max(0, Number(attempt.wrongDecisionCount) || 0);
    const hintCount = Array.isArray(attempt.hintLevelsShown) ? attempt.hintLevelsShown.length : 0;
    const accuracyScore = scoreDailyAccuracy(wrongCommands, wrongDecisions, hintCount);
    const leaderboardRef = doc(db, 'dailyAccuracyEntries', `${userId}_${attempt.dailyChallengeDate}`);
    const created = await createLeaderboardRecord(leaderboardRef, {
      uid: userId, nickname: alias, challengeDate: attempt.dailyChallengeDate,
      missionId: attempt.missionId, missionTitle: attempt.missionTitle,
      accuracyScore, wrongCommandCount: wrongCommands, wrongDecisionCount: wrongDecisions,
      hintLevelsShown: hintCount, completedAt: attempt.completedAt, ...avatar
    });
    if (!created) console.info('Daily Accuracy leaderboard entry already recorded for this user and date.');
  }
};

// Store attempts in a subcollection so this additive telemetry never overwrites
// existing score or completedMissions fields on users/{uid}.
export const saveMissionAttempt = async (userId: string, attempt: MissionAttemptRecord) => {
  // Optional telemetry fields are undefined when they do not apply. Firestore
  // rejects undefined values, so omit them before writing the attempt.
  const attemptRecord = Object.fromEntries(
    Object.entries(attempt).filter(([, value]) => value !== undefined)
  );
  try {
    await addDoc(collection(db, 'users', userId, 'missionAttempts'), attemptRecord);
  } catch (error) {
    // Keep a denied telemetry write from preventing the separate, opted-in
    // leaderboard write below from being attempted.
    console.warn('Mission completed, but its private attempt record could not be saved:', error);
  }

  try {
    await submitLeaderboardAttempt(userId, attempt);
  } catch (error) {
    console.warn('Attempt saved, but its opt-in leaderboard entry could not be created:', error);
  }
};

// A leaderboard write can be retried from the saved private attempt when the
// leaderboard panel is opened. The deterministic entry ID makes retries safe.
export const retryDailyLeaderboardEntry = async (userId: string, date: string, type: 'timeAttack' | 'accuracy') => {
  const profileSnapshot = await getDoc(doc(db, 'users', userId));
  if (profileSnapshot.data()?.leaderboardOptIn !== true) return 'opted-out' as const;
  const attempts = await getMissionAttempts(userId);
  const attempt = attempts.find(item => item.outcome === 'completed'
    && item.dailyChallengeDate === date
    && item.dailyChallengeType === type);
  if (!attempt) return 'no-saved-attempt' as const;
  await submitLeaderboardAttempt(userId, attempt);
  return 'submitted' as const;
};

export interface LeaderboardEntry {
  uid: string;
  nickname: string;
  avatarId?: AvatarId;
  challengeDate: string;
  missionId: string;
  missionTitle: string;
  clearTimeSeconds: number;
  completedAt: string;
}

export interface AccuracyLeaderboardEntry {
  uid: string;
  nickname: string;
  avatarId?: AvatarId;
  challengeDate: string;
  missionId: string;
  missionTitle: string;
  accuracyScore: number;
  completedAt: string;
}

// Reads only the leaderboard collection explicitly named in Task 9.
export const getDailyAccuracyEntries = async (challengeDate: string): Promise<AccuracyLeaderboardEntry[]> => {
  const dailyEntriesQuery = query(collection(db, 'dailyAccuracyEntries'), where('challengeDate', '==', challengeDate));
  const snapshot = await getDocsFromServer(dailyEntriesQuery);
  return snapshot.docs.map(item => {
    const data = item.data();
    return { uid: String(data.uid ?? ''), ...data, nickname: normalizeLeaderboardNickname(data.nickname), avatarId: isPresetAvatarId(data.avatarId) ? data.avatarId : undefined } as AccuracyLeaderboardEntry;
  }).sort((left, right) => right.accuracyScore - left.accuracyScore || left.completedAt.localeCompare(right.completedAt)).slice(0, 10);
};

export const getDailyTimeAttackEntries = async (challengeDate: string): Promise<LeaderboardEntry[]> => {
  const dailyEntriesQuery = query(
    collection(db, 'dailyTimeAttackEntries'),
    where('challengeDate', '==', challengeDate)
  );
  const snapshot = await getDocsFromServer(dailyEntriesQuery);
  const entries = snapshot.docs
    .map(item => {
      const data = item.data();
      return {
        uid: String(data.uid ?? ''),
        ...data,
        nickname: normalizeLeaderboardNickname(data.nickname),
        avatarId: isPresetAvatarId(data.avatarId) ? data.avatarId : undefined
      } as LeaderboardEntry;
    });

  return entries
    .sort((left, right) => left.clearTimeSeconds - right.clearTimeSeconds || left.completedAt.localeCompare(right.completedAt))
    .slice(0, 10);
};

export const getMissionAttempts = async (userId: string): Promise<MissionAttemptRecord[]> => {
  const snapshot = await getDocs(collection(db, 'users', userId, 'missionAttempts'));
  return snapshot.docs.map(item => item.data() as MissionAttemptRecord);
};

export interface AssessmentAttemptRecord {
  contentVersion?: string;
  tier: string;
  assessment: 'pre' | 'post';
  score: number;
  total: number;
  attemptNumber: number;
  timestamp: string;
}

export const getAssessmentAttempts = async (userId: string): Promise<AssessmentAttemptRecord[]> => {
  const snapshot = await getDocs(collection(db, 'users', userId, 'assessmentAttempts'));
  return snapshot.docs.map(item => item.data() as AssessmentAttemptRecord);
};
