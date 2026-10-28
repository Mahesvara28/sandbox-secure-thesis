import { useState, useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { motion } from 'framer-motion';
import type { User as FirebaseUser } from 'firebase/auth';
import errorSound from './assets/error.mp3';
import levelCompleteSound from './assets/level complete.mp3';
import missionMusicOne from './assets/Main sound.mp3';
import missionMusicTwo from './assets/Main sound2.mp3';

import {
  auth,
  signInWithGoogle,
  logOut,
  saveUserScore,
  registerWithEmail,
  loginWithEmail,
  saveCompletedMissions,
  savePreTestScore,
  getUserProgress,
  saveMissionAttempt,
  saveProgression,
  saveAvatarChoice,
  ensureUserProfile,
  getActiveSession,
  startMissionSession,
  saveMissionSessionProgress,
  completeMissionSession,
  syncActiveSessionClock,
  saveUserPreference,
  markDailyTrialUsed,
  getBrowserSessionId,
  takeOverActiveSession,
  saveLeaderboardProfile,
  abandonMissionSession,
  saveUserCertificate
} from './Firebase';
import type { UserCertificate } from './Firebase';
import { getMissionXp, normalizeProgression, rankProgress, type PlayerProgression } from './data/progression';
import { CONTENT_VERSION } from './data/contentVersion';
import { ASSESSMENT_TIME_LIMIT_SECONDS } from './data/assessmentTiming';
import { DEFAULT_AVATAR_ID, getAvatarById, type AvatarId } from './data/avatars';

import {
  BootScreen,
  AuthScreen,
  DashboardScreen,
  AcademyScreen,
  MissionsScreen,
  TerminalScreen,
  ProfileScreen
} from './components/Screens';

import OnboardingGuide from './components/OnboardingGuide';
import MissionToolGuide from './components/MissionToolGuide';
import { RewardDialog, type RewardDialogItem } from './components/RewardDialog';
import { CertificateDialog } from './components/CertificateDialog';

import {
  NetworkMapModal,
  HintModal,
  BriefingModal,
  CheatSheetModal,
  VictoryModal,
  MissionFailedModal
} from './components/Modals';

import type {
  Tier,
  Mission
} from './data/gameData';

import {
  MISSIONS,
  BRIDGE_MISSIONS,
  TUTORIAL_MISSIONS,
  TERMINAL_HELP_TEXT
} from './data/gameData';

import {
  LayoutDashboard,
  GraduationCap,
  Target,
  ClipboardCheck,
  LogOut,
  Settings,
  Play
} from 'lucide-react';

type Screen =
  | 'dashboard'
  | 'academy'
  | 'missions'
  | 'terminal'
  | 'profile';

type BootStage =
  | 'booting'
  | 'login'
  | 'authenticated';

type AuthMode =
  | 'login'
  | 'register';

const getLocalDateKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const getDailyTrialDetails = (type: 'timeAttack' | 'accuracy') => {
  const date = new Date();
  const day = date.getDate();
  const missionIndex = (day - 1 + (type === 'accuracy' ? 1 : 0)) % TUTORIAL_MISSIONS.length;
  const mission = TUTORIAL_MISSIONS[missionIndex];
  return {
    dateKey: getLocalDateKey(),
    type,
    missionIndex,
    missionTitle: mission.title.replace(/^(Tutorial|Practice):?\s*/i, '')
  };
};

const AUTH_LOADING_MIN_VISIBLE_MS = 1100;

const hasUsedDailyTrial = (uid: string, type: 'timeAttack' | 'accuracy', remoteUses: string[] = []) => {
  try {
    const dateKey = getLocalDateKey();
    if (remoteUses.includes(`${type}:${dateKey}`)) return true;
    const typedKey = `sandbox-secure-daily-trial-${uid}-${type}-${dateKey}`;
    if (localStorage.getItem(typedKey) === 'used') return true;
    // Honor the single daily-trial marker created by older builds for its original challenge type.
    const legacyKey = `sandbox-secure-daily-trial-${uid}-${dateKey}`;
    const legacyType = new Date().getDate() % 2 === 0 ? 'timeAttack' : 'accuracy';
    return type === legacyType && localStorage.getItem(legacyKey) === 'used';
  } catch {
    return false;
  }
};

type SavedScoreData = {
  score?: number;
  total?: number;
  preTestScore?: number;
  preTestTotal?: number;
  preTestFirstScore?: number;
  preTestFirstTotal?: number;
  finalScore?: number;
  finalTotal?: number;
  firstFinalScore?: number;
  firstFinalTotal?: number;
};

export interface TierScore {
  score: number;
  total: number;
  preTestScore?: number;
  preTestTotal?: number;
  preTestFirstScore?: number;
  preTestFirstTotal?: number;
  finalScore?: number;
  finalTotal?: number;
  firstFinalScore?: number;
  firstFinalTotal?: number;
};

function App() {
  const [tabSessionId] = useState(getBrowserSessionId);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return localStorage.getItem('sandbox-secure-theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  const [textScale, setTextScale] = useState(() => {
    try { return Math.min(1.25, Math.max(0.9, Number(localStorage.getItem('sandbox-secure-text-scale') ?? 1))); }
    catch { return 1; }
  });

  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * textScale}px`;
    try { localStorage.setItem('sandbox-secure-text-scale', String(textScale)); } catch { /* The size control remains available for this session. */ }
    return () => { document.documentElement.style.fontSize = ''; };
  }, [textScale]);

  useEffect(() => {
    document.body.dataset.theme = theme;
    try {
      localStorage.setItem('sandbox-secure-theme', theme);
    } catch {
      // The theme still applies for this session if storage is unavailable.
    }
  }, [theme]);

  const [screen, setScreen] =
    useState<Screen>('dashboard');

  const [bootStage, setBootStage] =
    useState<BootStage>('booting');

  const [bootText, setBootText] =
    useState<string[]>([]);

  const [authMode, setAuthMode] =
    useState<AuthMode>('login');

  const [regUsername, setRegUsername] =
    useState('');

  const [regEmail, setRegEmail] =
    useState('');

  const [regPassword, setRegPassword] =
    useState('');

  const [authError, setAuthError] =
    useState('');

  const [authSuccess, setAuthSuccess] =
    useState(false);

  const [user, setUser] =
    useState<FirebaseUser | null>(null);

  const [userScores, setUserScores] =
    useState<Record<string, TierScore>>({});

  const [isLoadingAuth, setIsLoadingAuth] =
    useState(true);
  const authLoadingStartedAtRef = useRef(0);
  const [progressLoadFailed, setProgressLoadFailed] = useState(false);
  const progressLoadFailedRef = useRef(false);
  const [progressLoadRetryCount, setProgressLoadRetryCount] = useState(0);

  const [completedMissions, setCompletedMissions] =
    useState<string[]>([]);
  const [userPreferences, setUserPreferences] = useState<Record<string, unknown>>({});
  const userPreferencesRef = useRef<Record<string, unknown>>({});
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(false);
  const [leaderboardAlias, setLeaderboardAlias] = useState('');
  const [avatarId, setAvatarId] = useState<AvatarId>(DEFAULT_AVATAR_ID);
  const [certificates, setCertificates] = useState<UserCertificate[]>([]);
  const [certificateToShow, setCertificateToShow] = useState<UserCertificate | null>(null);

  const [playerProgression, setPlayerProgression] = useState<PlayerProgression>(() => normalizeProgression(null));
  const playerProgressionRef = useRef<PlayerProgression>(playerProgression);
  const [rewardQueue, setRewardQueue] = useState<RewardDialogItem[]>([]);
  const [rewardsReady, setRewardsReady] = useState(false);
  const [missionReport, setMissionReport] = useState<{
    evidence: number; accuracy: number; verification: number; independence: number;
    xpEarned: number; rankBefore: string; rankAfter: string; newBadges: string[];
    evidenceFirst: boolean; verifiedAll: boolean; calibratedReport: boolean; hintsUsed: number;
    elapsedSeconds: number; timed: boolean; softTimeTarget?: number; exceededSoftTarget?: boolean;
  } | null>(null);

  const [activeTier, setActiveTier] =
    useState<Tier | null>(null);

  const [activeMission, setActiveMission] =
    useState<Mission | null>(null);
  const [activeSession, setActiveSession] = useState<Record<string, unknown> | null>(null);
  const [sessionConflict, setSessionConflict] = useState<Record<string, unknown> | null>(null);
  const [clockNowMs, setClockNowMs] = useState(0);
  const missionSessionIdRef = useRef<string | null>(null);
  const missionSessionRevisionRef = useRef(0);

  const [questStep, setQuestStep] =
    useState(0);

  const [msg, setMsg] =
    useState('');

  const [sysNonce, setSysNonce] =
    useState(0);

  const [isThreatActive, setIsThreatActive] =
    useState(false);

  const [timeLeft, setTimeLeft] =
    useState(300);
  const [missionElapsedSeconds, setMissionElapsedSeconds] = useState(0);
  const handleAssessmentSessionReady = useCallback((session: Record<string, unknown>) => setActiveSession(session), []);

  useEffect(() => {
    const timer = window.setInterval(() => setClockNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const [showVictory, setShowVictory] =
    useState(false);

  const [showMissionFailed, setShowMissionFailed] =
    useState(false);

  const [failedAtStep, setFailedAtStep] = useState(0);
  const [missionRunNumber, setMissionRunNumber] = useState(0);
  const attemptStartedAtRef = useRef(0);
  const stepStartedAtRef = useRef(0);
  const attemptSavedRef = useRef(false);
  const attemptWasTimedRef = useRef(false);
  const evidenceBeforeResponseRef = useRef(false);
  const responseActionsRef = useRef(0);
  const verifiedActionsRef = useRef(0);
  const calibratedReportRef = useRef(false);
  const dailyTrialRef = useRef<{ date: string; type: 'timeAttack' | 'accuracy' } | null>(null);
  const verifiedCommandsByStepRef = useRef<Record<string, string[]>>({});
  const attemptTelemetryRef = useRef({ hintsOpened: 0, hintLevelsShown: [] as number[], timePerStepSeconds: {} as Record<string, number>, wrongCommandsByStep: {} as Record<string, number>, wrongDecisionCount: 0 });

  const [currentPath, setCurrentPath] =
    useState('/home/operator');

  const [mapAction, setMapAction] =
    useState<
      'scan' | 'block' | 'none'
    >('none');

  const [isMuted, setIsMuted] =
    useState(() => localStorage.getItem('sandbox-secure-sfx') !== 'on');
  const [musicEnabled, setMusicEnabled] = useState(() => localStorage.getItem('sandbox-secure-music') !== 'off');
  const [audioVolume, setAudioVolume] = useState(() => Number(localStorage.getItem('sandbox-secure-volume') ?? 0.22));
  const [showSettings, setShowSettings] = useState(false);

  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const backgroundTrackRef = useRef<string | null>(null);
  const backgroundRoleRef = useRef<'app' | 'mission' | null>(null);

  const [missionOrigin, setMissionOrigin] =
    useState<
      'academy' | 'missions'
    >('missions');

  const checkpointKey = user ? `sandbox-secure-mission-checkpoint-${user.uid}` : null;

  const syncProgression = (next: PlayerProgression) => {
    playerProgressionRef.current = next;
    setPlayerProgression(next);
  };

  const awardMissionProgression = (mission: Mission, caseRecord: string[], confidence: string) => {
    if (progressLoadFailedRef.current) return null;
    const current = playerProgressionRef.current;
    const isOptionalDailyChallenge = mission.id.startsWith('daily-');
    const previousStats = current.missionStats[mission.id] ?? { completions: 0 };
    const firstCompletion = previousStats.completions === 0;
    const evidenceFirst = evidenceBeforeResponseRef.current && responseActionsRef.current > 0;
    const verifiedAll = responseActionsRef.current > 0 && verifiedActionsRef.current >= responseActionsRef.current;
    const calibratedReport = calibratedReportRef.current && Boolean(confidence) && caseRecord.length > 0;
    const hintsUsed = attemptTelemetryRef.current.hintsOpened;
    const wrongCommands = Object.values(attemptTelemetryRef.current.wrongCommandsByStep).reduce((sum, count) => sum + count, 0);
    const evidenceGrade = evidenceFirst ? 3 : caseRecord.length > 0 ? 2 : 0;
    const accuracyGrade = wrongCommands === 0 && attemptTelemetryRef.current.wrongDecisionCount === 0 ? 3 : wrongCommands + attemptTelemetryRef.current.wrongDecisionCount <= 2 ? 2 : 1;
    const verificationGrade = responseActionsRef.current === 0 ? 2 : verifiedAll ? 3 : 1;
    const independenceGrade = hintsUsed === 0 ? 3 : hintsUsed <= 2 ? 2 : 1;
    const grade = [evidenceGrade, accuracyGrade, verificationGrade, independenceGrade].reduce((sum, value) => sum + value, 0) / 4;
    const newBadges = [
      evidenceFirst && 'evidence-first',
      calibratedReport && 'measured-words',
      verifiedAll && 'trust-verify',
      hintsUsed === 0 && 'independent'
    ].filter((badge): badge is string => typeof badge === 'string' && !current.badges.includes(badge));
    const baseXp = firstCompletion && !isOptionalDailyChallenge ? getMissionXp(mission.tier) : 0;
    const skillXp = firstCompletion && !isOptionalDailyChallenge ? [evidenceFirst, calibratedReport, verifiedAll, hintsUsed === 0].filter(Boolean).length * 10 : 0;
    const xpEarned = baseXp + skillXp;
    const xp = current.xp + xpEarned;
    const rankAfter = rankProgress(xp).current.name;
    const today = getLocalDateKey();
    const priorDate = current.streak.lastActiveDate;
    const daysSince = priorDate ? Math.floor((new Date(`${today}T00:00:00`).getTime() - new Date(`${priorDate}T00:00:00`).getTime()) / 86400000) : 0;
    const streakCurrent = !priorDate || daysSince > 2 ? 1 : daysSince <= 0 ? current.streak.current : current.streak.current + 1;
    const nextBadges = isOptionalDailyChallenge ? current.badges : [...new Set([...current.badges, ...newBadges])];
    const next = normalizeProgression({
      ...current,
      xp: isOptionalDailyChallenge ? current.xp : xp,
      badges: nextBadges,
      streak: { current: streakCurrent, longest: Math.max(current.streak.longest, streakCurrent), lastActiveDate: today },
      missionStats: isOptionalDailyChallenge ? current.missionStats : {
        ...current.missionStats,
        [mission.id]: { completions: previousStats.completions + 1, bestGrade: Math.max(Number(previousStats.bestGrade ?? 0), grade).toFixed(2), hintsUsed, lastCompletedAt: new Date().toISOString() }
      }
    });
    syncProgression(next);
    const earnedRewards: RewardDialogItem[] = [];
    if (!isOptionalDailyChallenge && current.rank !== rankAfter) earnedRewards.push({ id: `rank-${rankAfter}-${xp}`, kind: 'rank', previousRank: current.rank, rank: rankAfter, xp });
    if (!isOptionalDailyChallenge) newBadges.forEach(badgeId => earnedRewards.push({ id: `badge-${badgeId}-${Date.now()}`, kind: 'badge', badgeId }));
    if (earnedRewards.length) {
      setRewardsReady(false);
      setRewardQueue(queue => [...queue, ...earnedRewards]);
    }
    if (user) void saveProgression(user.uid, next).catch(error => console.error('Could not save player progression:', error));
    const elapsedSeconds = Math.max(0, Math.round((Date.now() - attemptStartedAtRef.current) / 1000));
    const softTimeTarget = mission.softTimeTarget;
    return { evidence: evidenceGrade, accuracy: accuracyGrade, verification: verificationGrade, independence: independenceGrade, xpEarned, rankBefore: current.rank, rankAfter: isOptionalDailyChallenge ? current.rank : rankAfter, newBadges: isOptionalDailyChallenge ? [] : newBadges, evidenceFirst, verifiedAll, calibratedReport, hintsUsed, elapsedSeconds, timed: Boolean(mission.timerLimit), softTimeTarget, exceededSoftTarget: softTimeTarget !== undefined && elapsedSeconds > softTimeTarget };
  };

  const [showBriefing, setShowBriefing] =
    useState(false);
  const [missionStartError, setMissionStartError] = useState('');
  const [startingMission, setStartingMission] = useState(false);
  const [showAbandonConfirmation, setShowAbandonConfirmation] = useState(false);
  const [abandoningMission, setAbandoningMission] = useState(false);
  const [abandonMissionError, setAbandonMissionError] = useState('');

  const [showHint, setShowHint] =
    useState(false);

  const [showMap, setShowMap] =
    useState(false);

  const [showCheat, setShowCheat] =
    useState(false);

  const [hintText, setHintText] =
    useState<string | string[]>([]);

  const [containedTarget, setContainedTarget] = useState('');
  const [disabledService, setDisabledService] = useState('');
  const [removedPersistence, setRemovedPersistence] = useState<string[]>([]);

  const [pendingMission, setPendingMission] =
    useState<Mission | null>(null);

  const [showOnboarding, setShowOnboarding] =
    useState(false);

  const [showMissionToolGuide, setShowMissionToolGuide] =
    useState(false);

  const [caseNotes, setCaseNotes] = useState<string[]>([]);
  const [caseConfidence, setCaseConfidence] = useState('');

  useEffect(() => {
    if (!checkpointKey || !activeMission || questStep >= activeMission.steps.length) return;
    try {
      localStorage.setItem(checkpointKey, JSON.stringify({
        missionId: activeMission.id,
        questStep,
        timeLeft,
        isThreatActive,
        missionOrigin,
        containedTarget,
        disabledService,
        removedPersistence,
        caseNotes,
        caseConfidence,
        currentPath
      }));
    } catch {
      // The in-memory checkpoint remains available for this session.
    }
  }, [checkpointKey, activeMission, questStep, timeLeft, isThreatActive, missionOrigin, containedTarget, disabledService, removedPersistence, caseNotes, caseConfidence, currentPath]);

  useEffect(() => {
    if (!activeMission || !attemptStartedAtRef.current) return;
    const updateElapsed = () => setMissionElapsedSeconds(Math.max(0, Math.floor((Date.now() - attemptStartedAtRef.current) / 1000)));
    updateElapsed();
    const timer = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(timer);
  }, [activeMission, missionRunNumber]);

  useEffect(() => {
    if (!user || progressLoadFailedRef.current || !activeMission || questStep >= activeMission.steps.length || !missionSessionIdRef.current) return;
    const sessionId = missionSessionIdRef.current;
    const revision = ++missionSessionRevisionRef.current;
    const timer = window.setTimeout(() => {
      void saveMissionSessionProgress(user.uid, sessionId, tabSessionId, revision, {
        stepIndex: questStep,
        hintsUsed: attemptTelemetryRef.current.hintsOpened,
        wrongCommandCounts: { ...attemptTelemetryRef.current.wrongCommandsByStep },
        decisions: { caseConfidence, wrongDecisionCount: attemptTelemetryRef.current.wrongDecisionCount },
        containmentState: { containedTarget, disabledService, removedPersistence },
        evidenceNotes: [...caseNotes]
      }).catch(error => console.error('Could not save mission resume state:', error));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [user, activeMission, questStep, caseConfidence, containedTarget, disabledService, removedPersistence, caseNotes, sysNonce, showHint, tabSessionId]);

  useEffect(() => {
    localStorage.setItem('sandbox-secure-music', musicEnabled ? 'on' : 'off');
    localStorage.setItem('sandbox-secure-volume', String(audioVolume));
  }, [musicEnabled, audioVolume]);

  useEffect(() => {
    localStorage.setItem('sandbox-secure-sfx', isMuted ? 'off' : 'on');
  }, [isMuted]);

  const sendSysMsg = (
    text: string
  ) => {
    setMsg(text);
    setSysNonce(
      n => n + 1
    );
  };

  const persistMissionAttempt = useCallback((outcome: 'completed' | 'timed_out', report?: { xpEarned: number; evidenceFirst: boolean; verifiedAll: boolean; calibratedReport: boolean; hintsUsed: number; softTimeTarget?: number; exceededSoftTarget?: boolean }) => {
    if (progressLoadFailedRef.current || !activeMission || attemptSavedRef.current) return;
    const completedAt = Date.now();
    const startedAt = attemptStartedAtRef.current || completedAt;
    const activeStep = Math.min(questStep, activeMission.steps.length - 1);
    const timePerStepSeconds = { ...attemptTelemetryRef.current.timePerStepSeconds };
    if (outcome === 'timed_out' && stepStartedAtRef.current && questStep < activeMission.steps.length) {
      timePerStepSeconds[String(activeStep)] = Math.max(0, Math.round((completedAt - stepStartedAtRef.current) / 1000));
    }
    attemptSavedRef.current = true;
    if (!user) return;
    void saveMissionAttempt(user.uid, {
      contentVersion: CONTENT_VERSION,
      missionId: activeMission.id,
      missionTitle: activeMission.title,
      tier: activeMission.tier,
      concept: activeMission.briefing.concept,
      outcome,
      challengeMode: attemptWasTimedRef.current,
      dailyChallengeDate: dailyTrialRef.current?.date,
      dailyChallengeType: dailyTrialRef.current?.type,
      skillSignals: report ? { evidenceFirst: report.evidenceFirst, responseActions: responseActionsRef.current, verifiedActions: verifiedActionsRef.current, verifiedAll: report.verifiedAll, calibratedReport: report.calibratedReport, hintsUsed: report.hintsUsed } : undefined,
      xpAwarded: report?.xpEarned,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
      totalTimeSeconds: Math.max(0, Math.round((completedAt - startedAt) / 1000)),
      softTimeTarget: report?.softTimeTarget,
      exceededSoftTarget: report?.exceededSoftTarget,
      ...attemptTelemetryRef.current,
      timePerStepSeconds
    }).catch(error => console.error('Error saving mission attempt telemetry:', error));
  }, [activeMission, questStep, user]);

  const playSound = (
    type:
      | 'keystroke'
      | 'success'
      | 'error'
      | 'scan'
      | 'levelComplete'
  ) => {
    if (isMuted) return;
    const source = type === 'error'
      ? errorSound
      : type === 'levelComplete'
      ? levelCompleteSound
      : null;
    if (!source) return;

    const audio = new Audio(source);
    audio.volume = Math.min(1, audioVolume * (type === 'levelComplete' ? 2.5 : 1.8));
    void audio.play().catch(() => {});
  };

  useEffect(() => {
    const activeMissionId = activeMission?.id;
    const isPlayingMission = Boolean(activeMissionId) && screen === 'terminal' && !showVictory && !showMissionFailed;
    const missionTracks = [missionMusicOne, missionMusicTwo];
    let nextTrack: string | null = null;
    let nextRole: 'app' | 'mission' | null = null;

    if (bootStage === 'authenticated' && isPlayingMission) {
      nextRole = 'mission';
      if (backgroundRoleRef.current === 'mission' && missionTracks.includes(backgroundTrackRef.current ?? '')) {
        nextTrack = backgroundTrackRef.current;
      } else {
        // The app soundtrack is Main sound2, so choose a different track when
        // entering a mission to make the scene change immediately audible.
        const availableTracks = missionTracks.filter(track => track !== backgroundTrackRef.current);
        nextTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];
      }
    } else if (bootStage !== 'booting') {
      nextRole = 'app';
      nextTrack = missionMusicTwo;
    }

    if (nextTrack !== backgroundTrackRef.current) {
      backgroundAudioRef.current?.pause();
      backgroundAudioRef.current = null;
      backgroundTrackRef.current = nextTrack;
      if (nextTrack) {
        const nextAudio = new Audio(nextTrack);
        nextAudio.loop = true;
        nextAudio.volume = audioVolume;
        backgroundAudioRef.current = nextAudio;
      }
    }
    backgroundRoleRef.current = nextRole;

    const audio = backgroundAudioRef.current;
    if (!audio) return;
    if (isMuted || !musicEnabled) {
      audio.pause();
    } else {
      audio.loop = true;
      audio.volume = audioVolume;
      void audio.play().catch(() => {});
    }
  }, [bootStage, screen, activeMission?.id, showVictory, showMissionFailed, isMuted, musicEnabled, audioVolume]);

  useEffect(() => () => {
    backgroundAudioRef.current?.pause();
    backgroundAudioRef.current = null;
    backgroundTrackRef.current = null;
    backgroundRoleRef.current = null;
  }, []);

  useEffect(() => {
    const resumeBackgroundAudio = () => {
      if (!isMuted && musicEnabled && backgroundAudioRef.current?.paused) {
        void backgroundAudioRef.current.play().catch(() => {});
      }
    };
    window.addEventListener('pointerdown', resumeBackgroundAudio, { passive: true });
    window.addEventListener('keydown', resumeBackgroundAudio);
    return () => {
      window.removeEventListener('pointerdown', resumeBackgroundAudio);
      window.removeEventListener('keydown', resumeBackgroundAudio);
    };
  }, [isMuted, musicEnabled]);

  const maybeShowOnboarding = (
    uid: string
  ) => {
    const key =
      `sandboxSecureOnboardingCompleted-${uid}`;

    try {
      if (userPreferencesRef.current.onboardingCompleted === true || localStorage.getItem(key) === 'true') {
        return;
      }

    } catch {
      // Local storage is optional; cloud preferences are authoritative.
}

    setShowOnboarding(true);
  };

  useEffect(() => {
    let cancelled = false;
    const unsub =
      onAuthStateChanged(
        auth,
        async currentUser => {
          if (cancelled) return;
          setUser(
            currentUser
          );

          if (currentUser) {
            setBootStage('authenticated');
            authLoadingStartedAtRef.current = Date.now();
            progressLoadFailedRef.current = true;
            setIsLoadingAuth(true);
            try {
              await ensureUserProfile(currentUser);
              const [progress, savedSession] = await Promise.all([
                getUserProgress(currentUser.uid),
                getActiveSession(currentUser.uid)
              ]);
              if (cancelled) return;
              let sessionClockOffset = Number(savedSession?.clockOffsetMs ?? 0);
              let refreshedSession = savedSession;
              if (savedSession?.status === 'in_progress' && savedSession.kind === 'mission') {
                sessionClockOffset = await syncActiveSessionClock(currentUser.uid);
                refreshedSession = await getActiveSession(currentUser.uid);
              }
              setActiveSession(refreshedSession);
              const conflictingSession = refreshedSession?.status === 'in_progress' && refreshedSession.clientId && refreshedSession.clientId !== tabSessionId;
              setSessionConflict(conflictingSession ? refreshedSession : null);

              const savedScores =
                progress.scores;

              const normalizedScores:
                Record<
                  string,
                  TierScore
                > = {};

              Object.entries(
                savedScores
              ).forEach(
                ([tier, value]) => {
                  const scoreData =
                    value as SavedScoreData;

                  normalizedScores[
                    tier
                  ] = {
                    score:
                      Number(
                        scoreData.score ??
                          scoreData.finalScore ??
                          0
                      ),

                    total:
                      Number(
                        scoreData.total ??
                          scoreData.finalTotal ??
                          0
                      ),

                    preTestScore:
                      scoreData.preTestScore !==
                      undefined
                        ? Number(
                            scoreData.preTestScore
                          )
                        : undefined,

                    preTestTotal:
                      scoreData.preTestTotal !==
                      undefined
                        ? Number(
                            scoreData.preTestTotal
                          )
                        : undefined,

                    preTestFirstScore: scoreData.preTestFirstScore !== undefined ? Number(scoreData.preTestFirstScore) : undefined,
                    preTestFirstTotal: scoreData.preTestFirstTotal !== undefined ? Number(scoreData.preTestFirstTotal) : undefined,

                    finalScore:
                      scoreData.finalScore !==
                      undefined
                        ? Number(
                            scoreData.finalScore
                          )
                        : undefined,

                    finalTotal:
                      scoreData.finalTotal !==
                      undefined
                        ? Number(
                            scoreData.finalTotal
                          )
                        : undefined,
                    firstFinalScore: scoreData.firstFinalScore !== undefined ? Number(scoreData.firstFinalScore) : undefined,
                    firstFinalTotal: scoreData.firstFinalTotal !== undefined ? Number(scoreData.firstFinalTotal) : undefined
                  };
                }
              );

              setUserScores(
                normalizedScores
              );

              setCompletedMissions(
                progress.completedMissions
              );
              userPreferencesRef.current = progress.preferences;
              setUserPreferences(progress.preferences);
              setLeaderboardOptIn(progress.leaderboardOptIn);
              setLeaderboardAlias(progress.leaderboardAlias);
              setAvatarId(progress.avatarId);
              setCertificates(progress.certificates);
              syncProgression(normalizeProgression(progress.progression));

              try {
                const checkpoint = JSON.parse(localStorage.getItem(`sandbox-secure-mission-checkpoint-${currentUser.uid}`) ?? 'null') as {
                  missionId?: string; questStep?: number; timeLeft?: number; isThreatActive?: boolean;
                  missionOrigin?: 'academy' | 'missions'; containedTarget?: string; disabledService?: string;
                  removedPersistence?: string[]; caseNotes?: string[]; caseConfidence?: string; currentPath?: string;
                } | null;
                const remoteMissionId = !conflictingSession && refreshedSession?.kind === 'mission' && refreshedSession.status === 'in_progress' ? String(refreshedSession.missionId ?? '') : '';
                const missionId = conflictingSession ? undefined : remoteMissionId || checkpoint?.missionId;
                const savedMission = [...MISSIONS, ...BRIDGE_MISSIONS, ...TUTORIAL_MISSIONS].find(mission => mission.id === missionId);
                if (savedMission && remoteMissionId) {
                  missionSessionIdRef.current = String(refreshedSession?.sessionId ?? '');
                  missionSessionRevisionRef.current = Number(refreshedSession?.revision ?? 0);
                  setActiveMission(savedMission);
                  setQuestStep(Math.min(Math.max(Number(refreshedSession?.stepIndex ?? 0), 0), savedMission.steps.length - 1));
                  const startTime = refreshedSession?.startedAt as { toMillis?: () => number } | undefined;
                  const startedAt = typeof startTime?.toMillis === 'function' ? startTime.toMillis() : Date.now();
                  attemptStartedAtRef.current = startedAt - sessionClockOffset;
                  setTimeLeft(savedMission.timerLimit > 0 ? Math.max(0, Math.ceil(savedMission.timerLimit - (Date.now() + sessionClockOffset - startedAt) / 1000)) : 0);
                  setIsThreatActive(Boolean(savedMission.timerLimit));
                  setMissionOrigin(refreshedSession?.missionOrigin === 'missions' ? 'missions' : 'academy');
                  const containment = refreshedSession?.containmentState as Record<string, unknown> | undefined;
                  setContainedTarget(typeof containment?.containedTarget === 'string' ? containment.containedTarget : '');
                  setDisabledService(typeof containment?.disabledService === 'string' ? containment.disabledService : '');
                  setRemovedPersistence(Array.isArray(containment?.removedPersistence) ? containment.removedPersistence.filter((value): value is string => typeof value === 'string') : []);
                  setCaseNotes(Array.isArray(refreshedSession?.evidenceNotes) ? refreshedSession.evidenceNotes.filter((value): value is string => typeof value === 'string') : []);
                  setCurrentPath('/home/operator');
                  const wrongCounts = refreshedSession?.wrongCommandCounts as Record<string, number> | undefined;
                  const decisions = refreshedSession?.decisions as Record<string, unknown> | undefined;
                  attemptTelemetryRef.current = { ...attemptTelemetryRef.current, hintsOpened: Number(refreshedSession?.hintsUsed ?? 0), wrongCommandsByStep: wrongCounts ?? {}, wrongDecisionCount: Number(decisions?.wrongDecisionCount ?? 0) };
                  setCaseConfidence(typeof decisions?.caseConfidence === 'string' ? decisions.caseConfidence : '');
                  dailyTrialRef.current = refreshedSession?.dailyChallengeDate && (refreshedSession.dailyChallengeType === 'timeAttack' || refreshedSession.dailyChallengeType === 'accuracy')
                    ? { date: String(refreshedSession.dailyChallengeDate), type: refreshedSession.dailyChallengeType }
                    : null;
                  setActiveTier(null);
                  setScreen('terminal');
                  sendSysMsg(`[SESSION RESTORED]: Mission progress rebuilt at step ${Math.min(Math.max(Number(refreshedSession?.stepIndex ?? 0), 0), savedMission.steps.length - 1) + 1}. Previous terminal output was not stored.`);
                } else if (savedMission) {
                  missionSessionIdRef.current = null;
                  setActiveMission(savedMission);
                  setQuestStep(Math.min(Math.max(checkpoint?.questStep ?? 0, 0), savedMission.steps.length - 1));
                  setTimeLeft(Math.max(0, checkpoint?.timeLeft ?? savedMission.timerLimit ?? 300));
                  setIsThreatActive(Boolean(checkpoint?.isThreatActive));
                  setMissionOrigin(checkpoint?.missionOrigin ?? 'academy');
                  setContainedTarget(checkpoint?.containedTarget ?? '');
                  setDisabledService(checkpoint?.disabledService ?? '');
                  setRemovedPersistence(checkpoint?.removedPersistence ?? []);
                  setCaseNotes(checkpoint?.caseNotes ?? []);
                  setCaseConfidence(checkpoint?.caseConfidence ?? '');
                  setCurrentPath(checkpoint?.currentPath ?? '/home/operator');
                }
                if (!conflictingSession && refreshedSession?.kind === 'test' && refreshedSession.status === 'in_progress') {
                  const tier = String(refreshedSession.tier ?? '') as Tier;
                  if (['BEGINNER', 'INTERMEDIATE', 'EXPERT'].includes(tier)) {
                    setActiveTier(tier);
                    setScreen('academy');
                  }
                }
              } catch {
                // Ignore malformed or unavailable local checkpoints.
              }
              progressLoadFailedRef.current = false;
              setProgressLoadFailed(false);
            } catch (
              error
            ) {
              if (cancelled) return;
              console.error(
                'Error loading user progress:',
                error
              );

              progressLoadFailedRef.current = true;
              setProgressLoadFailed(true);
            }
          } else {
            progressLoadFailedRef.current = false;
            setProgressLoadFailed(false);
            setUserScores({});
            setCompletedMissions([]);
            userPreferencesRef.current = {};
            setUserPreferences({});
            setLeaderboardOptIn(false);
            setLeaderboardAlias('');
            setAvatarId(DEFAULT_AVATAR_ID);
            setCertificates([]);
            setCertificateToShow(null);
            setActiveMission(null);
            setActiveSession(null);
            setSessionConflict(null);
            missionSessionIdRef.current = null;
            syncProgression(normalizeProgression(null));
          }

          const loadingVisibleFor = Date.now() - authLoadingStartedAtRef.current;
          const remainingVisibleTime = AUTH_LOADING_MIN_VISIBLE_MS - loadingVisibleFor;
          if (currentUser && remainingVisibleTime > 0) {
            await new Promise(resolve => window.setTimeout(resolve, remainingVisibleTime));
          }
          if (!cancelled) setIsLoadingAuth(false);
        }
      );

    return () => {
      cancelled = true;
      unsub();
    };
  }, [progressLoadRetryCount, tabSessionId]);

  useEffect(() => {
    const bootLines = [
      'BIOS DATE 01/15/2026 VER 2.4.1',
      'CPU: SANDBOX_VIRTUAL_PROCESSOR_9000',
      'CHECKING NVRAM ... OK',
      'LOADING KERNEL ...',
      'WARNING: AUTHORIZED ACCESS ONLY',
      'ALL ACTIVITIES ARE MONITORED',
      ''
    ];

    let currentLine = 0;

    const interval =
      setInterval(() => {
        if (
          currentLine <
          bootLines.length
        ) {
          setBootText(
            prev => [
              ...prev,
              bootLines[
                currentLine
              ]
            ]
          );

          currentLine++;
        } else {
          clearInterval(
            interval
          );

          setTimeout(() => {
            setBootStage(
              'login'
            );
          }, 800);
        }
      }, 100);

    return () =>
      clearInterval(
        interval
      );
  }, []);

  useEffect(() => {
    if (
      !isThreatActive ||
      screen !== 'terminal'
    ) {
      return;
    }

    const timer = setInterval(() => {
      if (timeLeft <= 1) {
        setTimeLeft(0);
        setIsThreatActive(false);
        setFailedAtStep(questStep);
        setMsg('[MISSION FAILED]: The optional challenge timer ended. Your practice progress is not a failure.');
        setSysNonce(previous => previous + 1);
        persistMissionAttempt('timed_out');
        setShowMissionFailed(true);
      } else {
        setTimeLeft(previous => Math.max(0, previous - 1));
      }
    }, 1000);

    return () =>
      clearInterval(
        timer
      );
  }, [
    isThreatActive,
    screen,
    timeLeft,
    questStep,
    persistMissionAttempt
  ]);

  const handleLogin =
    async () => {
      setAuthError('');

      try {
        const loggedIn =
          await loginWithEmail(
            regEmail,
            regPassword
          );

        setBootStage(
          'authenticated'
        );

        maybeShowOnboarding(
          loggedIn.uid
        );
      } catch (
        error: unknown
      ) {
        setAuthError(
          error instanceof Error
            ? error.message
            : 'Login failed.'
        );
      }
    };

  const handleRegister =
    async () => {
      setAuthError('');
      setAuthSuccess(false);

      if (
        !regUsername ||
        !regEmail ||
        !regPassword
      ) {
        setAuthError(
          'All fields are required.'
        );

        return;
      }

      if (
        regPassword.length <
        6
      ) {
        setAuthError(
          'Password must be at least 6 characters.'
        );

        return;
      }

      if (
        !regEmail.includes(
          '@'
        )
      ) {
        setAuthError(
          'Please enter a valid email address.'
        );

        return;
      }

      try {
        const created =
          await registerWithEmail(
            regEmail,
            regPassword,
            regUsername
          );

        setAuthSuccess(
          true
        );

        setTimeout(() => {
          setBootStage(
            'authenticated'
          );

          maybeShowOnboarding(
            created.uid
          );
        }, 1500);
      } catch (
        error: unknown
      ) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Registration failed';

        if (
          errorMessage.includes(
            'email-already-in-use'
          )
        ) {
          setAuthError(
            'This email is already registered.'
          );
        } else if (
          errorMessage.includes(
            'weak-password'
          )
        ) {
          setAuthError(
            'Password is too weak.'
          );
        } else {
          setAuthError(
            errorMessage
          );
        }
      }
    };

  const handleGoogleLogin =
    async () => {
      setAuthError('');

      try {
        const googleUser =
          await signInWithGoogle();

        setBootStage(
          'authenticated'
        );

        maybeShowOnboarding(
          googleUser.uid
        );
      } catch (
        error: unknown
      ) {
        setAuthError(
          error instanceof Error
            ? error.message
            : 'Google login failed.'
        );
      }
    };

  const handleLogout =
    async () => {
      await logOut();

      setBootStage(
        'login'
      );

      setScreen(
        'dashboard'
      );

      setRegEmail('');
      setRegPassword('');
      setRegUsername('');

      setUser(null);
      userPreferencesRef.current = {};
      setUserPreferences({});
      setActiveSession(null);
      setSessionConflict(null);
      missionSessionIdRef.current = null;
      setUserScores({});
      setCompletedMissions([]);
      setActiveMission(null);

      setShowOnboarding(
        false
      );

      setShowMissionToolGuide(false);
    };

  const startMission = (
    mission: Mission
  ) => {
    if (progressLoadFailedRef.current) return;
    setMissionStartError('');
    dailyTrialRef.current = null;
    setMissionOrigin(
      'missions'
    );

    setPendingMission(
      mission
    );

    setShowBriefing(
      true
    );
  };

  const startMissionById = (
    missionId: string
  ) => {
    if (progressLoadFailedRef.current) return;
    setMissionStartError('');
    dailyTrialRef.current = null;
    const allMissions = [
      ...MISSIONS,
      ...BRIDGE_MISSIONS,
      ...TUTORIAL_MISSIONS
    ];

    const mission =
      allMissions.find(
        m =>
          m.id ===
          missionId
      );

    if (mission) {
      setMissionOrigin(
        'academy'
      );

      setPendingMission(
        mission
      );

      setShowBriefing(
        true
      );
    }
  };

  const startDailyTrial = async (type: 'timeAttack' | 'accuracy') => {
    const remoteUses = Array.isArray(userPreferencesRef.current.dailyTrialUses) ? userPreferencesRef.current.dailyTrialUses.filter((value): value is string => typeof value === 'string') : [];
    if (progressLoadFailedRef.current || !user || hasUsedDailyTrial(user.uid, type, remoteUses)) return;
    const eligibleTier = (['BEGINNER', 'INTERMEDIATE', 'EXPERT'] as const).find(tier => {
      const score = userScores[tier];
      return score?.preTestScore === undefined || !score?.finalTotal || (score.finalScore ?? 0) / score.finalTotal < 0.7;
    }) ?? 'EXPERT';
    const tierMissions = [...(eligibleTier === 'INTERMEDIATE' ? BRIDGE_MISSIONS : []), ...MISSIONS.filter(mission => mission.tier === eligibleTier)];
    const allMissionsComplete = tierMissions.length > 0 && tierMissions.every(mission => completedMissions.includes(mission.id));
    const anyPostTestTaken = Object.values(userScores).some(score => score.finalScore !== undefined);
    if (!allMissionsComplete && !anyPostTestTaken) return;
    const daily = getDailyTrialDetails(type);
    const isTimeAttack = type === 'timeAttack';
    const practiceMission = TUTORIAL_MISSIONS[daily.missionIndex];
    const dailyMission: Mission = {
      ...practiceMission,
      id: `daily-${type}-${daily.dateKey}`,
      title: `Daily ${isTimeAttack ? 'Time Attack' : 'Accuracy Trial'}: ${daily.missionTitle}`,
      intro: isTimeAttack
        ? 'HANDLER: Daily time attack. Work through the familiar training case carefully before the timer ends. Speed helps only when your steps are correct.'
        : 'HANDLER: Daily accuracy trial. There is no timer. Choose commands deliberately and use the evidence to reach the supported conclusion.',
      scenario: `${practiceMission.scenario} This is today’s one-attempt ${isTimeAttack ? 'timed' : 'accuracy'} trial.`,
      timerLimit: isTimeAttack ? 180 : 0,
      difficulty: 'standard'
    };
    try {
      const trialKey = `${type}:${daily.dateKey}`;
      const marked = await markDailyTrialUsed(user.uid, trialKey);
      if (!marked) return;
      const nextUses = [...remoteUses, trialKey];
      userPreferencesRef.current = { ...userPreferencesRef.current, dailyTrialUses: nextUses };
      setUserPreferences(userPreferencesRef.current);
    } catch {
      return;
    }
    try { localStorage.setItem(`sandbox-secure-daily-trial-${user.uid}-${type}-${daily.dateKey}`, 'used'); } catch { /* Cloud record is authoritative. */ }
    startMission(dailyMission);
    dailyTrialRef.current = { date: daily.dateKey, type: daily.type };
  };

  const updateLeaderboardOptIn = async (enabled: boolean) => {
    if (!user || progressLoadFailedRef.current) throw new Error('Saved profile settings are unavailable.');
    const words = ['Cedar', 'Harbor', 'Silver', 'Moss', 'Amber', 'Quiet', 'River', 'North', 'Copper', 'Blue'];
    const animals = ['Fox', 'Heron', 'Finch', 'Otter', 'Pine', 'Comet', 'Badger', 'Kite', 'Maple', 'Marten'];
    const suffix = Math.floor(Math.random() * 900 + 100);
    const alias = leaderboardAlias || `${words[Math.floor(Math.random() * words.length)]} ${animals[Math.floor(Math.random() * animals.length)]} ${suffix}`;
    const safeAlias = await saveLeaderboardProfile(user.uid, enabled, alias);
    setLeaderboardAlias(safeAlias);
    setLeaderboardOptIn(enabled);
  };

  const confirmStartMission =
    async (untimed = false) => {
      if (progressLoadFailedRef.current) return;
      if (
        !pendingMission
      ) {
        return;
      }

      setMissionStartError('');
      setStartingMission(true);

      let missionStartMs = Date.now();
      let missionClockOffsetMs = 0;
      if (user) {
        try {
          const proposedId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const started = await startMissionSession(user.uid, proposedId, tabSessionId, pendingMission.id, pendingMission.tier, missionOrigin, dailyTrialRef.current ?? undefined);
          missionSessionIdRef.current = started.sessionId;
          missionStartMs = started.startedAtMs;
          missionClockOffsetMs = started.serverOffsetMs;
          missionSessionRevisionRef.current = 0;
          const currentSession = await getActiveSession(user.uid);
          setActiveSession(currentSession);
        } catch (error) {
          const currentSession = await getActiveSession(user.uid).catch(() => null);
          if (currentSession?.status === 'in_progress') {
            setShowBriefing(false);
            setSessionConflict(currentSession);
          } else {
            setMissionStartError(error instanceof Error ? error.message : 'Could not start mission session. Check your connection and try again.');
          }
          setStartingMission(false);
          return;
        }
      }

      setActiveMission(
        pendingMission
      );

      setCurrentPath('/home/operator');
      setContainedTarget('');
      setDisabledService('');
      setRemovedPersistence([]);
      setCaseNotes([]);
      setCaseConfidence('');
      setQuestStep(0);
      attemptStartedAtRef.current = missionStartMs - missionClockOffsetMs;
      stepStartedAtRef.current = Date.now();
      attemptSavedRef.current = false;
      evidenceBeforeResponseRef.current = false;
      responseActionsRef.current = 0;
      verifiedActionsRef.current = 0;
      calibratedReportRef.current = false;
      setMissionReport(null);
      verifiedCommandsByStepRef.current = {};
      attemptTelemetryRef.current = { hintsOpened: 0, hintLevelsShown: [], timePerStepSeconds: {}, wrongCommandsByStep: {}, wrongDecisionCount: 0 };
      setMissionRunNumber(previous => previous + 1);

      setIsThreatActive(
        !untimed && pendingMission.timerLimit > 0
      );
      attemptWasTimedRef.current = !untimed && pendingMission.timerLimit > 0;

      setTimeLeft(pendingMission.timerLimit > 0
        ? Math.max(0, Math.ceil(pendingMission.timerLimit - (Date.now() + missionClockOffsetMs - missionStartMs) / 1000))
        : 300);
      setMissionElapsedSeconds(0);

      setScreen(
        'terminal'
      );

      setShowBriefing(
        false
      );
      setStartingMission(false);

      sendSysMsg(
        pendingMission.intro
      );

      if (pendingMission.id === 'm1') {
        const guideKey = `sandboxSecureMissionGuideCompleted-${user?.uid ?? 'guest'}`;
        try {
          if (userPreferencesRef.current.missionGuideCompleted !== true && localStorage.getItem(guideKey) !== 'true') {
            setShowMissionToolGuide(true);
          }
        } catch {
          setShowMissionToolGuide(true);
        }
      }
    };

  const confirmAbandonMission = async () => {
    if (!activeMission || abandoningMission) return;
    setAbandoningMission(true);
    setAbandonMissionError('');
    try {
      const sessionId = missionSessionIdRef.current;
      if (user && sessionId) {
        const abandoned = await abandonMissionSession(user.uid, sessionId, tabSessionId);
        if (!abandoned) throw new Error('This mission session changed or is active in another tab. Reload progress before abandoning it.');
      }
      if (checkpointKey) {
        try { localStorage.removeItem(checkpointKey); } catch { /* Browser storage is optional. */ }
      }
      missionSessionIdRef.current = null;
      missionSessionRevisionRef.current = 0;
      attemptSavedRef.current = true;
      dailyTrialRef.current = null;
      setActiveMission(null);
      setActiveSession(null);
      setPendingMission(null);
      setQuestStep(0);
      setIsThreatActive(false);
      setTimeLeft(0);
      setMissionElapsedSeconds(0);
      setMissionReport(null);
      setShowVictory(false);
      setShowMissionFailed(false);
      setShowAbandonConfirmation(false);
      setScreen(missionOrigin);
    } catch (error) {
      setAbandonMissionError(error instanceof Error ? error.message : 'Could not abandon this mission. Try again.');
    } finally {
      setAbandoningMission(false);
    }
  };

  const handleCommand = (
    cmd: string
  ) => {
    if (progressLoadFailedRef.current) return;
    if (
      !activeMission
    ) {
      return;
    }

    const input =
      cmd.trim();

    if (input.toLowerCase() === 'help') {
      sendSysMsg(TERMINAL_HELP_TEXT);
      return;
    }

    if (
      questStep >=
      activeMission.steps.length
    ) {
      sendSysMsg(
        '[SYSTEM]: Mission complete.'
      );

      return;
    }

    const currentStep =
      activeMission.steps[
        questStep
      ];

    const normalizeCommand = (value: string) => value
      .toLowerCase()
      .replace(/["']/g, '')
      .trim()
      .replace(/\s+/g, ' ');
    const normalizedInput = normalizeCommand(input);
    const commandName = normalizedInput.split(' ')[0];
    if (responseActionsRef.current > verifiedActionsRef.current && ['status', 'ps', 'ss', 'netstat', 'crontab', 'cat'].includes(commandName)) {
      verifiedActionsRef.current += 1;
    }
    const acceptedCommands = (currentStep.requiredCommands ? (currentStep.alternates ?? []) : [currentStep.cmd, ...(currentStep.alternates ?? [])])
      .map(normalizeCommand);
    if (/^ls(?:\s|$)/i.test(currentStep.cmd)) {
      acceptedCommands.push('ls', 'ls -la', 'ls -l', currentStep.cmd);
    }
    if (currentStep.cmd === 'netstat -tuln' || currentStep.cmd === 'ss -tuln') {
      acceptedCommands.push('netstat -tuln', 'ss -tuln');
    }
    const chosenDecision = normalizedInput.startsWith('choose ')
      ? normalizedInput.slice('choose '.length)
      : '';
    const isCorrectDecision = Boolean(currentStep.decision && chosenDecision === currentStep.decision.correctId);
    const requiredCommand = currentStep.requiredCommands?.find(command => {
      const normalizedRequired = normalizeCommand(command);
      return normalizedRequired === normalizedInput
        || (normalizedRequired === 'netstat -tuln' && normalizedInput === 'ss -tuln')
        || (normalizedRequired === 'ss -tuln' && normalizedInput === 'netstat -tuln');
    });
    const previouslyVerified = verifiedCommandsByStepRef.current[String(questStep)] ?? [];
    const verifiedNow = requiredCommand && !previouslyVerified.includes(requiredCommand)
      ? [...previouslyVerified, requiredCommand]
      : previouslyVerified;
    const isRequiredCheckComplete = Boolean(currentStep.requiredCommands?.length && verifiedNow.length === currentStep.requiredCommands.length);
    const isRequiredCheck = Boolean(requiredCommand);
    const isEquivalentDirectoryList = /^ls(?:\s+.+)?$/.test(normalizedInput) && /^ls(?:\s|$)/i.test(currentStep.cmd);

    if (isRequiredCheck && !isRequiredCheckComplete) {
      verifiedCommandsByStepRef.current[String(questStep)] = verifiedNow;
      const stepKey = String(questStep);
      attemptTelemetryRef.current.timePerStepSeconds[stepKey] = (attemptTelemetryRef.current.timePerStepSeconds[stepKey] ?? 0) + Math.max(0, Math.round((Date.now() - stepStartedAtRef.current) / 1000));
      stepStartedAtRef.current = Date.now();
      sendSysMsg(`[VERIFICATION]: ${verifiedNow.length}/${currentStep.requiredCommands?.length} checks recorded. Continue in any order.`);
      return;
    }

    if (
      acceptedCommands.includes(normalizedInput) || isEquivalentDirectoryList || isCorrectDecision || isRequiredCheckComplete
    ) {
      const stepKey = String(questStep);
      attemptTelemetryRef.current.timePerStepSeconds[stepKey] = (attemptTelemetryRef.current.timePerStepSeconds[stepKey] ?? 0) + Math.max(0, Math.round((Date.now() - stepStartedAtRef.current) / 1000));
      stepStartedAtRef.current = Date.now();
      if (
        currentStep.cmd ===
          'block' &&
        !input.includes(
          activeMission.target
        )
      ) {
        sendSysMsg(
          '[ERROR]: Wrong target IP.'
        );

        return;
      }

      if (input.startsWith('cd ')) {
        const destination = input.slice(3).trim();
        setCurrentPath(destination === '~' || destination === '~/'
          ? '/home/operator'
          : destination.startsWith('/')
            ? destination
            : `${currentPath.replace(/\/$/, '')}/${destination}`);
      }

      if (input.startsWith('block ')) {
        setContainedTarget(input.slice('block '.length).trim());
      } else if (input.startsWith('disable-service ')) {
        setDisabledService(input.slice('disable-service '.length).trim());
      } else if (input.startsWith('remove-persistence ')) {
        const removed = input.slice('remove-persistence '.length).trim();
        setRemovedPersistence(previous => previous.includes(removed) ? previous : [...previous, removed]);
      }
      if (/^(block|disable-service|kill|remove-persistence)\s/i.test(input)) responseActionsRef.current += 1;

      const isLastStep =
        questStep ===
        activeMission.steps.length -
          1;

      if (isLastStep) {
        if (checkpointKey) localStorage.removeItem(checkpointKey);
        playSound('levelComplete');
        const report = awardMissionProgression(activeMission, caseNotes, caseConfidence);
        setMissionReport(report);
        persistMissionAttempt('completed', report ?? undefined);
        if (user && missionSessionIdRef.current) {
          void completeMissionSession(user.uid, missionSessionIdRef.current).catch(error => console.error('Could not complete mission session:', error));
          missionSessionIdRef.current = null;
        }
        setQuestStep(activeMission.steps.length);
        setIsThreatActive(
          false
        );

        sendSysMsg(
          '[SUCCESS]: Mission objectives complete.'
        );

        const missionId =
          activeMission.id;

        setCompletedMissions(
          prev => {
            if (
              prev.includes(
                missionId
              )
            ) {
              return prev;
            }

            return [
              ...prev,
              missionId
            ];
          }
        );

        if (user) {
          const updatedMissions =
            completedMissions.includes(
              missionId
            )
              ? completedMissions
              : [
                  ...completedMissions,
                  missionId
                ];

          saveCompletedMissions(
            user.uid,
            updatedMissions
          ).catch(
            error => {
              console.error(
                'Error saving mission progress:',
                error
              );
            }
          );
        }

        setTimeout(() => {
          setShowVictory(
            true
          );
        }, 1000);
      } else {
        setQuestStep(
          prev =>
            prev + 1
        );

        sendSysMsg(
          `[OK]: ${input.toUpperCase()} accepted.`
        );
      }
    } else {
      if (currentStep.decision && chosenDecision) {
        const selected = currentStep.decision.choices.find(choice => choice.id === chosenDecision);
        const explanation = selected?.feedback ?? 'That choice is not supported by the evidence shown. Review the clues and try again.';
        attemptTelemetryRef.current.wrongDecisionCount += 1;
        const stepKey = String(questStep);
        attemptTelemetryRef.current.wrongCommandsByStep[stepKey] = (attemptTelemetryRef.current.wrongCommandsByStep[stepKey] ?? 0) + 1;
        sendSysMsg(`[DECISION NOT SUPPORTED]: ${explanation}`);
        return;
      }
      const readOnlyCommands = new Set(['ls', 'pwd', 'cat', 'ps', 'netstat', 'ss', 'status', 'whoami', 'grep', 'find', 'stat', 'journalctl', 'crontab', 'nmap', 'ping', 'inspect']);
      const enteredCommand = input.split(/\s+/)[0]?.toLowerCase() ?? '';
      if (readOnlyCommands.has(enteredCommand)) {
        // Read-only exploration is allowed at any point and does not consume an objective.
        return;
      }
      const stepKey = String(questStep);
      attemptTelemetryRef.current.wrongCommandsByStep[stepKey] = (attemptTelemetryRef.current.wrongCommandsByStep[stepKey] ?? 0) + 1;
      const expectedCommand = currentStep.cmd.split(/\s+/)[0];
      const correction = enteredCommand.toLowerCase() === expectedCommand.toLowerCase()
        ? `The command is right, but its arguments do not match this step. Expected format: ${currentStep.cmd}`
        : `This objective needs the ${expectedCommand} tool. The current objective is: ${currentStep.desc} Use Hint or the Command Field Guide if you need help.`;
      sendSysMsg(`[NOT THE CURRENT OBJECTIVE]: ${correction}`);
    }
  };

  const retryMissionUntimed = () => {
    setShowMissionFailed(false);
    setQuestStep(0);
    setCurrentPath('/home/operator');
    setContainedTarget('');
    setDisabledService('');
    setRemovedPersistence([]);
    setCaseNotes([]);
    setCaseConfidence('');
    attemptStartedAtRef.current = Date.now();
    stepStartedAtRef.current = Date.now();
    attemptSavedRef.current = false;
    evidenceBeforeResponseRef.current = false;
    responseActionsRef.current = 0;
    verifiedActionsRef.current = 0;
    calibratedReportRef.current = false;
    setMissionReport(null);
    verifiedCommandsByStepRef.current = {};
    attemptTelemetryRef.current = { hintsOpened: 0, hintLevelsShown: [], timePerStepSeconds: {}, wrongCommandsByStep: {}, wrongDecisionCount: 0 };
    setTimeLeft(0);
    setIsThreatActive(false);
    setMissionRunNumber(previous => previous + 1);
    setScreen('terminal');
    if (activeMission) sendSysMsg(`${activeMission.intro}\n[TRAINING MODE]: Untimed retry. Use the objective, hints, and glossary to work through the case.`);
  };

  const handleQuizComplete =
    async (
      tier: Tier,
      quizScore: number,
      total: number,
      isPreTest: boolean = false,
      attemptMeta?: { startedAt?: string; timedOut: boolean; answeredCount: number }
    ) => {
      if (progressLoadFailedRef.current) return;
      const safeTotal =
        Math.max(
          0,
          total
        );

      const safeScore =
        Math.min(
          Math.max(
            0,
            quizScore
          ),
          safeTotal
        );

      setUserScores(
        prev => {
          const existing =
            prev[tier] || {
              score: 0,
              total: 0
            };

          const updated:
            TierScore =
            isPreTest
              ? {
                  ...existing,
                  preTestScore:
                    safeScore,
                  preTestTotal:
                    safeTotal
                }
              : {
                  ...existing,
                  score:
                    Math.max(
                      existing.score,
                      safeScore
                    ),
                  total:
                    safeTotal,
                  finalScore:
                    Math.max(
                      existing.finalScore ??
                        0,
                      safeScore
                    ),
                  finalTotal:
                    safeTotal
                };

          return {
            ...prev,
            [tier]: updated
          };
        }
      );

      if (user) {
        try {
          if (isPreTest) {
            await savePreTestScore(
              user.uid,
              tier,
              safeScore,
              safeTotal,
              attemptMeta
            );
          } else {
            await saveUserScore(
              user.uid,
              tier,
              safeScore,
              safeTotal,
              attemptMeta
            );

            const requiredMissionIds = [
              ...(tier === 'INTERMEDIATE' ? BRIDGE_MISSIONS : []),
              ...MISSIONS.filter(mission => mission.tier === tier)
            ].map(mission => mission.id);
            const certificationComplete = safeTotal > 0
              && safeScore / safeTotal >= 0.7
              && requiredMissionIds.length > 0
              && requiredMissionIds.every(missionId => completedMissions.includes(missionId));
            if (certificationComplete) {
              try {
                const result = await saveUserCertificate(user.uid, {
                  tier,
                  recipientName: user.displayName?.trim() || user.email?.split('@')[0] || 'Operator',
                  score: safeScore,
                  total: safeTotal
                });
                setCertificates(previous => previous.some(item => item.tier === result.certificate.tier)
                  ? previous
                  : [...previous, result.certificate]);
                if (result.created) setCertificateToShow(result.certificate);
              } catch (error) {
                console.error('Assessment passed, but the certificate could not be saved:', error);
              }
            }
          }

          setActiveSession(await getActiveSession(user.uid));

          const progress =
            await getUserProgress(
              user.uid
            );

          const normalizedScores:
            Record<
              string,
              TierScore
            > = {};

          Object.entries(
            progress.scores
          ).forEach(
            ([tierName, value]) => {
              const scoreData =
                value as SavedScoreData;

              normalizedScores[
                tierName
              ] = {
                score:
                  Number(
                    scoreData.score ??
                      scoreData.finalScore ??
                      0
                  ),
                total:
                  Number(
                    scoreData.total ??
                      scoreData.finalTotal ??
                      0
                  ),
                preTestScore:
                  scoreData.preTestScore !==
                  undefined
                    ? Number(
                        scoreData.preTestScore
                      )
                    : undefined,
                preTestTotal:
                  scoreData.preTestTotal !==
                  undefined
                    ? Number(
                        scoreData.preTestTotal
                      )
                    : undefined,
                preTestFirstScore: scoreData.preTestFirstScore !== undefined ? Number(scoreData.preTestFirstScore) : undefined,
                preTestFirstTotal: scoreData.preTestFirstTotal !== undefined ? Number(scoreData.preTestFirstTotal) : undefined,
                finalScore:
                  scoreData.finalScore !==
                  undefined
                    ? Number(
                        scoreData.finalScore
                      )
                    : undefined,
                finalTotal:
                  scoreData.finalTotal !==
                  undefined
                    ? Number(
                        scoreData.finalTotal
                      )
                    : undefined,
                firstFinalScore: scoreData.firstFinalScore !== undefined ? Number(scoreData.firstFinalScore) : undefined,
                firstFinalTotal: scoreData.firstFinalTotal !== undefined ? Number(scoreData.firstFinalTotal) : undefined
              };
            }
          );

          setUserScores(
            normalizedScores
          );

          setCompletedMissions(
            progress.completedMissions
          );
          syncProgression(normalizeProgression(progress.progression));
        } catch (
          error
        ) {
          console.error(
            'Error saving quiz score:',
            error
          );
        }
      }
    };

  if (
    isLoadingAuth ||
    bootStage ===
      'booting'
  ) {
    return (
      <BootScreen
        bootText={
          bootText
        }
        status={user ? 'LOADING SAVED PROGRESS' : 'SYSTEM BOOT'}
      />
    );
  }

  if (progressLoadFailed && user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--game-bg)] p-5 text-[var(--game-text)]" role="alert">
        <section className="game-card w-full max-w-lg space-y-4 p-6 sm:p-8">
          <h1 className="text-xl font-bold">Saved progress unavailable</h1>
          <p className="text-sm leading-6 text-[var(--game-muted)]">We couldn’t load your saved progress.</p>
          <p className="text-sm leading-6 text-[var(--game-muted)]">Check your internet connection. If you use an ad blocker or privacy extension, turn it off for this site, then retry.</p>
          <button type="button" disabled={isLoadingAuth} onClick={() => {
            setIsLoadingAuth(true);
            setProgressLoadRetryCount(count => count + 1);
          }} className="min-h-11 rounded-md bg-[var(--game-green)] px-5 py-2 font-semibold text-black disabled:cursor-wait disabled:opacity-60">
            {isLoadingAuth ? 'Retrying…' : 'Retry'}
          </button>
        </section>
      </div>
    );
  }

  if (
    bootStage ===
      'login' ||
    !user
  ) {
    return (
      <AuthScreen
        authMode={
          authMode
        }
        setAuthMode={
          setAuthMode
        }
        regUsername={
          regUsername
        }
        setRegUsername={
          setRegUsername
        }
        regEmail={
          regEmail
        }
        setRegEmail={
          setRegEmail
        }
        regPassword={
          regPassword
        }
        setRegPassword={
          setRegPassword
        }
        authError={
          authError
        }
        authSuccess={
          authSuccess
        }
        theme={theme}
        onToggleTheme={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
        handleLogin={
          handleLogin
        }
        handleRegister={
          handleRegister
        }
        handleGoogleLogin={
          handleGoogleLogin
        }
      />
    );
  }

  return (
    <div data-theme={theme} className="h-screen w-screen bg-black text-[#4ade80] font-mono overflow-hidden flex flex-col relative">

      <a href="#main-content" className="sr-only z-[100] bg-black p-3 text-green-300 focus:not-sr-only focus:absolute focus:left-3 focus:top-3">
        Skip to main content
      </a>

      <nav aria-label="Main navigation" className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 border-b border-green-900 px-4 py-2 bg-black/90 z-40 shrink-0 sm:flex sm:justify-between sm:gap-3 lg:px-6">

        <div className="contents sm:flex sm:items-center sm:gap-5 lg:gap-8">

          <h1 className="text-xl font-black italic text-white glow">
            SANDBOX
            <span className="text-green-500">
              _SECURE
            </span>
          </h1>

          <div role="tablist" aria-label="Main sections" onKeyDown={event => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
            const index = tabs.indexOf(document.activeElement as HTMLButtonElement);
            const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
            tabs[nextIndex]?.focus();
            tabs[nextIndex]?.click();
          }} className={`${screen === 'terminal' ? 'col-span-2 row-start-2 flex min-w-0 gap-1 overflow-x-auto sm:w-auto sm:gap-1.5 lg:gap-3' : 'fixed inset-x-0 bottom-0 z-50 flex h-16 justify-around border-t border-green-900 bg-black/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1 shadow-xl sm:static sm:z-auto sm:h-auto sm:justify-start sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:w-auto sm:gap-1.5 lg:gap-3'} scrollbar-hide text-xs font-bold uppercase lg:text-sm`}>

            <button
              onClick={() =>
                setScreen(
                  'dashboard'
                )
              }
              role="tab"
              aria-selected={screen === 'dashboard'}
              className={`relative px-3 lg:px-4 py-2 border transition-colors ${
                screen ===
                'dashboard'
                  ? 'border-green-500 bg-green-500/5 text-green-300'
                  : 'border-transparent text-green-800 hover:border-green-900 hover:text-green-300'
              }`}
              aria-current={screen === 'dashboard' ? 'page' : undefined}
              aria-label="Dashboard"
            >
              {screen === 'dashboard' && <motion.span layoutId="main-nav-indicator" className="absolute inset-x-2 bottom-0 h-0.5 bg-green-400" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
              <LayoutDashboard
                size={14}
                className="inline mr-2"
              />
              <span className="hidden md:inline">Dashboard</span>
            </button>

            <button
              onClick={() =>
                setScreen(
                  'academy'
                )
              }
              role="tab"
              aria-selected={screen === 'academy'}
              className={`relative px-3 lg:px-4 py-2 border transition-colors ${
                screen ===
                'academy'
                  ? 'border-green-500 bg-green-500/5 text-green-300'
                  : 'border-transparent text-green-800 hover:border-green-900 hover:text-green-300'
              }`}
              aria-current={screen === 'academy' ? 'page' : undefined}
              aria-label="Academy"
            >
              {screen === 'academy' && <motion.span layoutId="main-nav-indicator" className="absolute inset-x-2 bottom-0 h-0.5 bg-green-400" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
              <GraduationCap
                size={14}
                className="inline mr-2"
              />
              <span className="hidden md:inline">Academy</span>
            </button>

            <button
              onClick={() =>
                setScreen(
                  'missions'
                )
              }
              role="tab"
              aria-selected={screen === 'missions'}
              className={`relative px-3 lg:px-4 py-2 border transition-colors ${
                screen ===
                'missions'
                  ? 'border-green-500 bg-green-500/5 text-green-300'
                  : 'border-transparent text-green-800 hover:border-green-900 hover:text-green-300'
              }`}
              aria-current={screen === 'missions' ? 'page' : undefined}
              aria-label="Missions"
            >
              {screen === 'missions' && <motion.span layoutId="main-nav-indicator" className="absolute inset-x-2 bottom-0 h-0.5 bg-green-400" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
              <Target
                size={14}
                className="inline mr-2"
              />
              <span className="hidden md:inline">Missions</span>
            </button>

            <button
              onClick={() =>
                setScreen(
                  'profile'
                )
              }
              role="tab"
              aria-selected={screen === 'profile'}
              className={`relative px-3 lg:px-4 py-2 border transition-colors ${
                screen ===
                'profile'
                  ? 'border-green-500 bg-green-500/5 text-green-300'
                  : 'border-transparent text-green-800 hover:border-green-900 hover:text-green-300'
              }`}
              aria-current={screen === 'profile' ? 'page' : undefined}
              aria-label="Profile"
            >
              {screen === 'profile' && <motion.span layoutId="main-nav-indicator" className="absolute inset-x-2 bottom-0 h-0.5 bg-green-400" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
              <ClipboardCheck
                size={14}
                className="inline mr-2"
              />
              <span className="hidden md:inline">Profile</span>
            </button>

          </div>
        </div>

        <div className="col-start-2 row-start-1 flex items-center justify-end gap-2 text-xs sm:ml-auto sm:gap-4">

          {activeMission && !showVictory && !showMissionFailed && <button
            type="button"
            onClick={() => setScreen(screen === 'terminal' ? missionOrigin === 'academy' ? 'academy' : 'missions' : 'terminal')}
            className="border border-cyan-700 px-2 py-1 font-bold text-cyan-300 hover:border-cyan-400"
          >
            {screen === 'terminal' ? 'SAVE & PAUSE' : <><Play size={12} className="mr-1 inline" />RESUME MISSION</>}
          </button>}
          {activeMission && !showVictory && !showMissionFailed && <button type="button" onClick={() => { setAbandonMissionError(''); setShowAbandonConfirmation(true); }} className="border border-red-800 px-2 py-1 font-bold text-red-300 hover:border-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">ABANDON</button>}

          <div className="text-right">

            <p className="text-green-900 text-[10px]">
              OPERATOR
            </p>

            <p className="text-white truncate max-w-[150px]">
              {user?.displayName ||
                'Unknown'}
            </p>

          </div>

          <button
            onClick={() =>
              setIsMuted(
                !isMuted
              )
            }
            className="border border-green-900 text-green-500 px-2 py-1 hover:bg-green-900/20"
          >
            {isMuted
              ? '🔇'
              : '🔊'}
          </button>

          <button type="button" onClick={() => setShowSettings(true)} aria-label="Open settings" title="Settings" className="border border-green-900 p-2 text-green-400 hover:border-green-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400">
            <Settings size={16} />
          </button>

          <button
            onClick={
              handleLogout
            }
            className="border border-red-900 text-red-500 px-3 py-1 hover:bg-red-900/20 flex items-center gap-1"
          >
            <LogOut
              size={12}
            />
            Logout
          </button>

        </div>

      </nav>

      <main id="main-content" className={`flex-1 overflow-y-auto ${screen === 'terminal' ? 'terminal-screen bg-[#050807]' : 'app-atmosphere pb-20 font-sans sm:pb-0'}`}>

        {screen ===
          'dashboard' && (
          <DashboardScreen
            user={user}
            userScores={
              userScores
            }
            setScreen={
              setScreen
            }
            onShowGuide={() =>
              setShowOnboarding(
                true
              )
            }
            resumeActivityLabel={activeSession?.kind === 'test' && activeSession.status === 'in_progress'
              ? `Resume ${activeSession.testType === 'post' ? 'post-test' : 'pre-test'}${clockNowMs > 0 && activeSession.startedAt && typeof (activeSession.startedAt as { toMillis?: () => number }).toMillis === 'function' ? ` · ${Math.max(0, Math.ceil(ASSESSMENT_TIME_LIMIT_SECONDS - (clockNowMs + Number(activeSession.clockOffsetMs ?? 0) - (activeSession.startedAt as { toMillis: () => number }).toMillis()) / 1000))} sec left` : ''}`
              : activeMission ? 'Resume mission' : undefined}
            onContinue={() => {
              if (activeMission) {
                setScreen('terminal');
                return;
              }
              if (activeSession?.kind === 'test' && activeSession.status === 'in_progress') {
                setActiveTier(String(activeSession.tier) as Tier);
                setScreen('academy');
                return;
              }
              const nextTier = (['BEGINNER', 'INTERMEDIATE', 'EXPERT'] as const).find(tier => {
                const score = userScores[tier];
                return score?.preTestScore === undefined || !score.finalTotal || (score.finalScore ?? 0) / score.finalTotal < 0.7;
              }) ?? 'EXPERT';
              setActiveTier(nextTier);
              setScreen('academy');
            }}
            onStartDailyTrial={startDailyTrial}
            dailyTimeAttackPlayed={user ? hasUsedDailyTrial(user.uid, 'timeAttack', Array.isArray(userPreferences.dailyTrialUses) ? userPreferences.dailyTrialUses.filter((value): value is string => typeof value === 'string') : []) : false}
            dailyAccuracyPlayed={user ? hasUsedDailyTrial(user.uid, 'accuracy', Array.isArray(userPreferences.dailyTrialUses) ? userPreferences.dailyTrialUses.filter((value): value is string => typeof value === 'string') : []) : false}
            dailyTrialDate={getLocalDateKey()}
            dailyTimeAttackMissionTitle={getDailyTrialDetails('timeAttack').missionTitle}
            dailyAccuracyMissionTitle={getDailyTrialDetails('accuracy').missionTitle}
            leaderboardOptIn={leaderboardOptIn}
            progression={playerProgression}
            completedMissions={completedMissions}
            isLoadingProgress={isLoadingAuth}
            progressLoadFailed={progressLoadFailed}
            onProgressionChange={syncProgression}
          />
        )}

        {(screen === 'academy' || activeTier !== null) && (
          <div className={screen === 'academy' ? 'block h-full' : 'hidden'}>
          <AcademyScreen
            activeTier={
              activeTier
            }
            setActiveTier={
              setActiveTier
            }
            userScores={
              userScores
            }
            activeSession={activeSession}
            onSessionReady={handleAssessmentSessionReady}
            handleQuizComplete={
              handleQuizComplete
            }
            onStartMission={
              startMissionById
            }
            completedMissions={
              completedMissions
            }
          />
          </div>
        )}

        {screen ===
          'missions' && (
          <MissionsScreen
            startMission={
              startMission
            }
            completedMissions={
              completedMissions
            }
          />
        )}

        {activeMission && (
          <div className={screen === 'terminal' ? 'block h-full' : 'hidden'}>
            <TerminalScreen
              key={`${activeMission.id}-${missionRunNumber}`}
              activeMission={
                activeMission
              }
              handleCommand={
                handleCommand
              }
              isThreatActive={
                isThreatActive
              }
              timeLeft={
                timeLeft
              }
              elapsedSeconds={missionElapsedSeconds}
              questStep={
                questStep
              }
              msg={msg}
              sysNonce={
                sysNonce
              }
              setShowHint={
                setShowHint
              }
              setShowMap={
                setShowMap
              }
              setHintText={setHintText}
              onHintLevelShown={level => {
                if (level === 1) attemptTelemetryRef.current.hintsOpened += 1;
                attemptTelemetryRef.current.hintLevelsShown.push(level);
              }}
              currentPath={
                currentPath
              }
              setCurrentPath={
                setCurrentPath
              }
              onMapAction={
                setMapAction
              }
              containedTarget={containedTarget}
              disabledService={disabledService}
              removedPersistence={removedPersistence}
              onCaseNotesChange={setCaseNotes}
              onCaseConfidenceChange={setCaseConfidence}
              onSkillSignal={signal => {
                if (signal === 'evidence' && responseActionsRef.current === 0) evidenceBeforeResponseRef.current = true;
                if (signal === 'calibrated-report') calibratedReportRef.current = true;
              }}
              onShowMissionGuide={() => setShowMissionToolGuide(true)}
              playSound={
                playSound
              }
            />
          </div>
        )}

        {screen ===
          'profile' && (
          <ProfileScreen
            user={user}
            userScores={
              userScores
            }
            progression={playerProgression}
            completedMissions={completedMissions}
            onProgressionChange={syncProgression}
            avatarId={avatarId}
            leaderboardOptIn={leaderboardOptIn}
            leaderboardAlias={leaderboardAlias}
            progressLoadFailed={progressLoadFailed}
            certificates={certificates}
            onViewCertificate={setCertificateToShow}
            onSaveAvatarChoice={async nextAvatarId => {
              if (!user || progressLoadFailedRef.current) throw new Error('Saved progress is unavailable.');
              await saveAvatarChoice(user.uid, nextAvatarId);
              setAvatarId(getAvatarById(nextAvatarId).id);
            }}
            onSaveLeaderboardOptIn={updateLeaderboardOptIn}
          />
        )}

      </main>

      {showSettings && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={() => setShowSettings(false)}>
        <section className="w-full max-w-lg border border-cyan-700 bg-[#071014] p-5 shadow-2xl sm:p-7" onClick={event => event.stopPropagation()}>
          <div className="flex items-start justify-between gap-4 border-b border-cyan-900 pb-4">
            <div><p className="text-[10px] uppercase tracking-[0.25em] text-cyan-500">Player preferences</p><h2 id="settings-title" className="mt-1 text-2xl font-black text-cyan-200">Settings</h2></div>
            <button onClick={() => setShowSettings(false)} className="border border-cyan-800 px-3 py-2 text-xs font-bold text-cyan-200">CLOSE</button>
          </div>
          <div className="mt-5 space-y-5">
            <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-bold text-white">Appearance</p><p className="text-xs text-gray-400">Choose the screen theme.</p></div><button onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')} className="border border-green-700 px-3 py-2 text-xs font-bold text-green-300">{theme === 'dark' ? 'LIGHT MODE' : 'DARK MODE'}</button></div>
            <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-bold text-white">Text size</p><p className="text-xs text-gray-400">Saved in this browser · {Math.round(textScale * 100)}%</p></div><div className="flex gap-2"><button type="button" aria-label="Decrease text size" disabled={textScale <= 0.9} onClick={() => setTextScale(value => Math.max(0.9, Math.round((value - 0.1) * 10) / 10))} className="min-h-10 min-w-10 rounded border border-[var(--game-border)] px-3 font-bold text-[var(--game-text)] disabled:cursor-not-allowed disabled:opacity-45">A−</button><button type="button" aria-label="Increase text size" disabled={textScale >= 1.25} onClick={() => setTextScale(value => Math.min(1.25, Math.round((value + 0.1) * 10) / 10))} className="min-h-10 min-w-10 rounded border border-[var(--game-border)] px-3 font-bold text-[var(--game-text)] disabled:cursor-not-allowed disabled:opacity-45">A+</button></div></div>
            <label className="flex items-center justify-between gap-4"><span><span className="block text-sm font-bold text-white">Background music</span><span className="text-xs text-gray-400">Play music across game tabs.</span></span><input type="checkbox" checked={musicEnabled} onChange={event => setMusicEnabled(event.target.checked)} className="h-5 w-5 accent-cyan-500" /></label>
            <label className="block"><span className="block text-sm font-bold text-white">Music and effect volume · {Math.round(audioVolume * 100)}%</span><input type="range" min="0" max="1" step="0.01" value={audioVolume} onChange={event => setAudioVolume(Number(event.target.value))} className="mt-3 w-full accent-cyan-500" /></label>
            <label className="flex items-center justify-between gap-4"><span><span className="block text-sm font-bold text-white">Sound effects</span><span className="text-xs text-gray-400">Command errors and mission completion sounds.</span></span><input type="checkbox" checked={!isMuted} onChange={event => setIsMuted(!event.target.checked)} className="h-5 w-5 accent-cyan-500" /></label>
          </div>
        </section>
      </div>}

      {showAbandonConfirmation && activeMission && <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4" role="presentation" onClick={() => { if (!abandoningMission) setShowAbandonConfirmation(false); }}>
        <section role="alertdialog" aria-modal="true" aria-labelledby="abandon-mission-title" aria-describedby="abandon-mission-description" className="w-full max-w-lg rounded-lg border border-red-700 bg-[var(--game-surface)] p-6 text-[var(--game-text)] shadow-2xl" onClick={event => event.stopPropagation()}>
          <p className="text-xs font-bold uppercase tracking-widest text-red-300">End mission run</p>
          <h2 id="abandon-mission-title" className="mt-2 text-xl font-black">Abandon {activeMission.title}?</h2>
          <p id="abandon-mission-description" className="mt-3 text-sm leading-6 text-[var(--game-muted)]">This ends the mission and discards its saved in-progress state. It will not count as completed and will not award XP. You can start it again later.{activeMission.id.startsWith('daily-') ? ' Today’s daily challenge attempt will remain used, and no leaderboard result will be submitted.' : ''}</p>
          {abandonMissionError && <p role="alert" className="mt-3 rounded border border-red-600 bg-red-950/30 p-3 text-sm text-red-200">{abandonMissionError}</p>}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" disabled={abandoningMission} onClick={() => setShowAbandonConfirmation(false)} className="min-h-11 rounded-md border border-[var(--game-border)] px-4 py-2 font-semibold disabled:opacity-60">Keep mission</button>
            <button type="button" disabled={abandoningMission} onClick={() => void confirmAbandonMission()} className="min-h-11 rounded-md bg-red-700 px-4 py-2 font-bold text-white hover:bg-red-600 disabled:cursor-wait disabled:opacity-60">{abandoningMission ? 'Abandoning…' : 'Abandon mission'}</button>
          </div>
        </section>
      </div>}

      <BriefingModal
        show={
          showBriefing
        }
        mission={
          pendingMission
        }
        onStart={() => confirmStartMission(false)}
        onStartUntimed={() => confirmStartMission(true)}
        isStarting={startingMission}
        error={missionStartError}
        onAbort={() =>
          setShowBriefing(
            false
          )
        }
      />

      <HintModal
        key={`${showHint}-${JSON.stringify(hintText)}`}
        show={
          showHint
        }
        onClose={() =>
          setShowHint(
            false
          )
        }
        hints={
          hintText
        }
        onLevelShown={level => attemptTelemetryRef.current.hintLevelsShown.push(level)}
      />

      <NetworkMapModal
        show={
          showMap
        }
        onClose={() =>
          setShowMap(
            false
          )
        }
        activeMission={
          activeMission
        }
        mapAction={
          mapAction
        }
        containedTarget={containedTarget}
        disabledService={disabledService}
        removedPersistence={removedPersistence}
      />

      <CheatSheetModal
        show={
          showCheat
        }
        onClose={() =>
          setShowCheat(
            false
          )
        }
      />

      <VictoryModal
        show={
          showVictory
        }
        onClose={() => {
          setShowVictory(
            false
          );

          setRewardsReady(true);

          setActiveMission(null);

          setScreen(
            missionOrigin
          );
        }}
        mission={activeMission}
        caseNotes={caseNotes}
        confidence={caseConfidence}
        report={missionReport}
      />

      <MissionFailedModal
        show={
          showMissionFailed
        }
        onClose={() => {
          setShowMissionFailed(
            false
          );

          setScreen(
            missionOrigin
          );
        }}
        missionTitle={
          activeMission?.title ||
          'Unknown'
        }
        reachedStep={failedAtStep + 1}
        totalSteps={activeMission?.steps.length ?? 0}
        stepDescription={activeMission?.steps[failedAtStep]?.desc ?? 'Review the mission objective.'}
        concept={activeMission?.briefing.concept ?? 'Mission investigation'}
        onRetryUntimed={retryMissionUntimed}
      />

      <RewardDialog item={rewardsReady ? rewardQueue[0] ?? null : null} onContinue={() => {
        setRewardQueue(queue => queue.slice(1));
        if (rewardQueue.length <= 1) setRewardsReady(false);
      }} />

      <CertificateDialog certificate={certificateToShow} onClose={() => setCertificateToShow(null)} />

      {showOnboarding && (
        <OnboardingGuide
          onComplete={() => {
            setShowOnboarding(false);
            if (user && !progressLoadFailedRef.current) {
              try { localStorage.setItem(`sandboxSecureOnboardingCompleted-${user.uid}`, 'true'); } catch { /* Cloud preference is primary. */ }
              userPreferencesRef.current = { ...userPreferencesRef.current, onboardingCompleted: true };
              setUserPreferences(userPreferencesRef.current);
              void saveUserPreference(user.uid, 'onboardingCompleted', true).catch(error => console.error('Could not save onboarding completion:', error));
            }
          }}
        />
      )}

      {showMissionToolGuide && (
        <MissionToolGuide onComplete={() => {
          setShowMissionToolGuide(false);
          if (user && !progressLoadFailedRef.current) {
            userPreferencesRef.current = { ...userPreferencesRef.current, missionGuideCompleted: true };
            setUserPreferences(userPreferencesRef.current);
            try { localStorage.setItem(`sandboxSecureMissionGuideCompleted-${user.uid}`, 'true'); } catch { /* Cloud preference is primary. */ }
            void saveUserPreference(user.uid, 'missionGuideCompleted', true).catch(error => console.error('Could not save mission guide completion:', error));
          }
        }} />
      )}

      {sessionConflict && user && <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/80 p-4" role="dialog" aria-modal="true" aria-labelledby="session-conflict-title">
        <section className="w-full max-w-lg rounded-lg border border-amber-500 bg-slate-900 p-6 text-slate-100 shadow-2xl">
          <h2 id="session-conflict-title" className="text-xl font-bold">Progress is active elsewhere</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">This {sessionConflict.kind === 'test' ? `${sessionConflict.tier} ${sessionConflict.testType === 'post' ? 'post-test' : 'pre-test'}` : 'mission'} has another active tab or device. Choose where you want to continue. The other session will stop saving if you continue here.</p>
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={() => setSessionConflict(null)} className="rounded border border-slate-500 px-4 py-2 text-sm font-semibold hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Leave it there</button>
            <button type="button" onClick={async () => {
              try {
                await takeOverActiveSession(user.uid, String(sessionConflict.sessionId), tabSessionId);
                setSessionConflict(null);
                setProgressLoadRetryCount(count => count + 1);
              } catch (error) {
                console.error('Could not take over active session:', error);
                setAuthError(error instanceof Error ? error.message : 'Could not resume saved progress.');
              }
            }} className="rounded bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">Continue here</button>
          </div>
        </section>
      </div>}

    </div>
  );
}

export default App;
