import { initializeApp } from "firebase/app";
import {
  getAuth,
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
  query,
  where
} from "firebase/firestore";
import { normalizeProgression, type PlayerProgression } from './data/progression';
import { CONTENT_VERSION } from './data/contentVersion';
import { AVATARS, DEFAULT_AVATAR_ID, getAvatarById, type AvatarId } from './data/avatars';

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

export const signInWithGoogle = async () => {
  const result =
    await signInWithPopup(
      auth,
      googleProvider
    );

  const userRef = doc(
    db,
    "users",
    result.user.uid
  );

  const userSnap =
    await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      username:
        result.user.displayName,
      email:
        result.user.email,
      createdAt:
        new Date().toISOString(),
      scores: {},
      completedMissions: []
    });
  }

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

  await setDoc(
    doc(
      db,
      "users",
      result.user.uid
    ),
    {
      username,
      email,
      createdAt:
        new Date().toISOString(),
      scores: {},
      completedMissions: []
    }
  );

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
      avatarId: DEFAULT_AVATAR_ID
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
    avatarId: getAvatarById(data.avatarId).id
  };
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
  total: number
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
      timestamp: new Date().toISOString()
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
  preTestTotal: number
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
      timestamp: new Date().toISOString()
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

// Store attempts in a subcollection so this additive telemetry never overwrites
// existing score or completedMissions fields on users/{uid}.
export const saveMissionAttempt = async (userId: string, attempt: MissionAttemptRecord) => {
  await addDoc(collection(db, 'users', userId, 'missionAttempts'), attempt);

  if (attempt.outcome !== 'completed' || attempt.dailyChallengeType !== 'timeAttack' || !attempt.dailyChallengeDate) return;

  try {
    await setDoc(doc(db, 'dailyTimeAttackEntries', `${userId}_${attempt.dailyChallengeDate}`), {
      uid: userId,
      nickname: 'Operator',
      challengeDate: attempt.dailyChallengeDate,
      missionId: attempt.missionId,
      missionTitle: attempt.missionTitle,
      clearTimeSeconds: attempt.totalTimeSeconds,
      completedAt: attempt.completedAt
    });
  } catch (error) {
    // Keep the training attempt even when leaderboard permissions are not configured yet.
    console.warn('Time-attack attempt saved, but leaderboard entry could not be updated:', error);
  }
};

export interface LeaderboardEntry {
  uid: string;
  nickname: string;
  challengeDate: string;
  missionId: string;
  missionTitle: string;
  clearTimeSeconds: number;
  completedAt: string;
}

export const getDailyTimeAttackEntries = async (challengeDate: string): Promise<LeaderboardEntry[]> => {
  const dailyEntriesQuery = query(
    collection(db, 'dailyTimeAttackEntries'),
    where('challengeDate', '==', challengeDate)
  );
  const snapshot = await getDocs(dailyEntriesQuery);
  return snapshot.docs
    .map(item => ({ uid: item.id, ...item.data() } as LeaderboardEntry))
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
