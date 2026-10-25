import { useState, useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
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
  saveMissionAttempt
} from './Firebase';

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

const getDailyTrialDetails = () => {
  const date = new Date();
  const day = date.getDate();
  const mission = TUTORIAL_MISSIONS[(day - 1) % TUTORIAL_MISSIONS.length];
  return {
    dateKey: getLocalDateKey(),
    type: day % 2 === 0 ? 'timeAttack' as const : 'accuracy' as const,
    missionTitle: mission.title.replace(/^(Tutorial|Practice):?\s*/i, '')
  };
};

const hasUsedDailyTrial = (uid: string) => {
  try {
    return localStorage.getItem(`sandbox-secure-daily-trial-${uid}-${getLocalDateKey()}`) === 'used';
  } catch {
    return false;
  }
};

type SavedScoreData = {
  score?: number;
  total?: number;
  preTestScore?: number;
  preTestTotal?: number;
  finalScore?: number;
  finalTotal?: number;
};

export interface TierScore {
  score: number;
  total: number;
  preTestScore?: number;
  preTestTotal?: number;
  finalScore?: number;
  finalTotal?: number;
};

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return localStorage.getItem('sandbox-secure-theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

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

  const [isFakeAdmin, setIsFakeAdmin] =
    useState(false);

  const [user, setUser] =
    useState<FirebaseUser | null>(null);

  const [userScores, setUserScores] =
    useState<Record<string, TierScore>>({});

  const [isLoadingAuth, setIsLoadingAuth] =
    useState(true);

  const [completedMissions, setCompletedMissions] =
    useState<string[]>([]);

  const [activeTier, setActiveTier] =
    useState<Tier | null>(null);

  const [activeMission, setActiveMission] =
    useState<Mission | null>(null);

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
    useState(false);
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

  const [showBriefing, setShowBriefing] =
    useState(false);

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
    localStorage.setItem('sandbox-secure-music', musicEnabled ? 'on' : 'off');
    localStorage.setItem('sandbox-secure-volume', String(audioVolume));
  }, [musicEnabled, audioVolume]);

  const sendSysMsg = (
    text: string
  ) => {
    setMsg(text);
    setSysNonce(
      n => n + 1
    );
  };

  const persistMissionAttempt = useCallback((outcome: 'completed' | 'timed_out') => {
    if (!activeMission || attemptSavedRef.current) return;
    const completedAt = Date.now();
    const startedAt = attemptStartedAtRef.current || completedAt;
    const activeStep = Math.min(questStep, activeMission.steps.length - 1);
    const timePerStepSeconds = { ...attemptTelemetryRef.current.timePerStepSeconds };
    if (outcome === 'timed_out' && stepStartedAtRef.current && questStep < activeMission.steps.length) {
      timePerStepSeconds[String(activeStep)] = Math.max(0, Math.round((completedAt - stepStartedAtRef.current) / 1000));
    }
    attemptSavedRef.current = true;
    if (!user || isFakeAdmin) return;
    void saveMissionAttempt(user.uid, {
      missionId: activeMission.id,
      missionTitle: activeMission.title,
      tier: activeMission.tier,
      concept: activeMission.briefing.concept,
      outcome,
      challengeMode: attemptWasTimedRef.current,
      dailyChallengeDate: dailyTrialRef.current?.date,
      dailyChallengeType: dailyTrialRef.current?.type,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
      totalTimeSeconds: Math.max(0, Math.round((completedAt - startedAt) / 1000)),
      ...attemptTelemetryRef.current,
      timePerStepSeconds
    }).catch(error => console.error('Error saving mission attempt telemetry:', error));
  }, [activeMission, questStep, user, isFakeAdmin]);

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
    } else if (bootStage === 'authenticated') {
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
      if (
        localStorage.getItem(
          key
        ) === 'true'
      ) {
        return;
      }

      localStorage.setItem(
        key,
        'true'
      );
    } catch {
  console.error('An error occurred.');
}

    setShowOnboarding(true);
  };

  useEffect(() => {
    const unsub =
      onAuthStateChanged(
        auth,
        async currentUser => {
          if (
            !currentUser &&
            isFakeAdmin
          ) {
            setIsLoadingAuth(
              false
            );

            return;
          }

          setUser(
            currentUser
          );

          if (currentUser) {
            try {
              const progress =
                await getUserProgress(
                  currentUser.uid
                );

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
                        : undefined
                  };
                }
              );

              setUserScores(
                normalizedScores
              );

              setCompletedMissions(
                progress.completedMissions
              );

              try {
                const checkpoint = JSON.parse(localStorage.getItem(`sandbox-secure-mission-checkpoint-${currentUser.uid}`) ?? 'null') as {
                  missionId?: string; questStep?: number; timeLeft?: number; isThreatActive?: boolean;
                  missionOrigin?: 'academy' | 'missions'; containedTarget?: string; disabledService?: string;
                  removedPersistence?: string[]; caseNotes?: string[]; caseConfidence?: string; currentPath?: string;
                } | null;
                const savedMission = [...MISSIONS, ...BRIDGE_MISSIONS, ...TUTORIAL_MISSIONS].find(mission => mission.id === checkpoint?.missionId);
                if (savedMission) {
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
              } catch {
                // Ignore malformed or unavailable local checkpoints.
              }
            } catch (
              error
            ) {
              console.error(
                'Error loading user progress:',
                error
              );

              setUserScores({});
              setCompletedMissions([]);
            }
          } else {
            setUserScores({});
            setCompletedMissions([]);
            setActiveMission(null);
            setIsFakeAdmin(false);
          }

          setIsLoadingAuth(
            false
          );
        }
      );

    return () =>
      unsub();
  }, [isFakeAdmin]);

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

            setIsLoadingAuth(
              false
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
      screen !== 'terminal' ||
      timeLeft <= 0
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

      if (
        regEmail ===
          'admin@sandbox.secure' &&
        regPassword ===
          'admin123'
      ) {
        setIsFakeAdmin(
          true
        );

        setUser({
          uid: 'default-admin-001',
          email:
            'admin@sandbox.secure',
          displayName:
            'System Administrator'
        } as FirebaseUser);

        setBootStage(
          'authenticated'
        );

        maybeShowOnboarding(
          'default-admin-001'
        );

        return;
      }

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
      setUserScores({});
      setCompletedMissions([]);
      setActiveMission(null);

      setIsFakeAdmin(
        false
      );

      setShowOnboarding(
        false
      );

      setShowMissionToolGuide(false);
    };

  const startMission = (
    mission: Mission
  ) => {
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

  const startDailyTrial = () => {
    if (!user || hasUsedDailyTrial(user.uid)) return;
    const daily = getDailyTrialDetails();
    const isTimeAttack = daily.type === 'timeAttack';
    const practiceMission = TUTORIAL_MISSIONS[(new Date().getDate() - 1) % TUTORIAL_MISSIONS.length];
    const dailyMission: Mission = {
      ...practiceMission,
      id: `daily-${daily.dateKey}`,
      title: `Daily ${isTimeAttack ? 'Time Attack' : 'Accuracy Trial'}: ${daily.missionTitle}`,
      intro: isTimeAttack
        ? 'HANDLER: Daily time attack. Work through the familiar training case carefully before the timer ends. Speed helps only when your steps are correct.'
        : 'HANDLER: Daily accuracy trial. There is no timer. Choose commands deliberately and use the evidence to reach the supported conclusion.',
      scenario: `${practiceMission.scenario} This is today’s one-attempt ${isTimeAttack ? 'timed' : 'accuracy'} trial.`,
      timerLimit: isTimeAttack ? 180 : 0,
      difficulty: 'standard'
    };
    try {
      localStorage.setItem(`sandbox-secure-daily-trial-${user.uid}-${daily.dateKey}`, 'used');
    } catch {
      // The attempt can still be played if browser storage is unavailable.
    }
    startMission(dailyMission);
    dailyTrialRef.current = { date: daily.dateKey, type: daily.type };
  };

  const confirmStartMission =
    (untimed = false) => {
      if (
        !pendingMission
      ) {
        return;
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
      attemptStartedAtRef.current = Date.now();
      stepStartedAtRef.current = Date.now();
      attemptSavedRef.current = false;
      verifiedCommandsByStepRef.current = {};
      attemptTelemetryRef.current = { hintsOpened: 0, hintLevelsShown: [], timePerStepSeconds: {}, wrongCommandsByStep: {}, wrongDecisionCount: 0 };
      setMissionRunNumber(previous => previous + 1);

      setIsThreatActive(
        !untimed && pendingMission.timerLimit > 0
      );
      attemptWasTimedRef.current = !untimed && pendingMission.timerLimit > 0;

      setTimeLeft(
        pendingMission.timerLimit ||
          300
      );

      setScreen(
        'terminal'
      );

      setShowBriefing(
        false
      );

      sendSysMsg(
        pendingMission.intro
      );

      if (pendingMission.id === 'm1') {
        const guideKey = `sandboxSecureMissionGuideCompleted-${user?.uid ?? 'guest'}`;
        try {
          if (localStorage.getItem(guideKey) !== 'true') {
            localStorage.setItem(guideKey, 'true');
            setShowMissionToolGuide(true);
          }
        } catch {
          setShowMissionToolGuide(true);
        }
      }
    };

  const handleCommand = (
    cmd: string
  ) => {
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

      const isLastStep =
        questStep ===
        activeMission.steps.length -
          1;

      if (isLastStep) {
        if (checkpointKey) localStorage.removeItem(checkpointKey);
        playSound('levelComplete');
        persistMissionAttempt('completed');
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

        if (
          user &&
          !isFakeAdmin
        ) {
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
      isPreTest: boolean = false
    ) => {
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

      if (
        user &&
        !isFakeAdmin
      ) {
        try {
          if (isPreTest) {
            await savePreTestScore(
              user.uid,
              tier,
              safeScore,
              safeTotal
            );
          } else {
            await saveUserScore(
              user.uid,
              tier,
              safeScore,
              safeTotal
            );
          }

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
                    : undefined
              };
            }
          );

          setUserScores(
            normalizedScores
          );

          setCompletedMissions(
            progress.completedMissions
          );
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
      />
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

          <div className="col-span-2 row-start-2 flex min-w-0 gap-1 overflow-x-auto scrollbar-hide text-xs font-bold uppercase sm:w-auto sm:gap-1.5 lg:gap-3 lg:text-sm">

            <button
              onClick={() =>
                setScreen(
                  'dashboard'
                )
              }
              className={`px-3 lg:px-4 py-2 border transition-colors ${
                screen ===
                'dashboard'
                  ? 'border-green-500 bg-green-500/5 text-green-300'
                  : 'border-transparent text-green-800 hover:border-green-900 hover:text-green-300'
              }`}
              aria-current={screen === 'dashboard' ? 'page' : undefined}
              aria-label="Dashboard"
            >
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
              className={`px-3 lg:px-4 py-2 border transition-colors ${
                screen ===
                'academy'
                  ? 'border-green-500 bg-green-500/5 text-green-300'
                  : 'border-transparent text-green-800 hover:border-green-900 hover:text-green-300'
              }`}
              aria-current={screen === 'academy' ? 'page' : undefined}
              aria-label="Academy"
            >
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
              className={`px-3 lg:px-4 py-2 border transition-colors ${
                screen ===
                'missions'
                  ? 'border-green-500 bg-green-500/5 text-green-300'
                  : 'border-transparent text-green-800 hover:border-green-900 hover:text-green-300'
              }`}
              aria-current={screen === 'missions' ? 'page' : undefined}
              aria-label="Missions"
            >
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
              className={`px-3 lg:px-4 py-2 border transition-colors ${
                screen ===
                'profile'
                  ? 'border-green-500 bg-green-500/5 text-green-300'
                  : 'border-transparent text-green-800 hover:border-green-900 hover:text-green-300'
              }`}
              aria-current={screen === 'profile' ? 'page' : undefined}
              aria-label="Profile"
            >
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

      <main id="main-content" className="flex-1 overflow-y-auto bg-[#050807]">

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
            onStartDailyTrial={startDailyTrial}
            dailyTrialPlayed={user ? hasUsedDailyTrial(user.uid) : false}
            dailyTrialDate={getDailyTrialDetails().dateKey}
            dailyTrialType={getDailyTrialDetails().type}
            dailyTrialMissionTitle={getDailyTrialDetails().missionTitle}
          />
        )}

        {(screen === 'academy' || activeTier !== null) && (
          <div className={screen === 'academy' ? 'block h-full' : 'hidden'}>
          <AcademyScreen
            progressScope={user?.uid ?? 'guest'}
            activeTier={
              activeTier
            }
            setActiveTier={
              setActiveTier
            }
            userScores={
              userScores
            }
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
            <label className="flex items-center justify-between gap-4"><span><span className="block text-sm font-bold text-white">Background music</span><span className="text-xs text-gray-400">Play music across game tabs.</span></span><input type="checkbox" checked={musicEnabled} onChange={event => setMusicEnabled(event.target.checked)} className="h-5 w-5 accent-cyan-500" /></label>
            <label className="block"><span className="block text-sm font-bold text-white">Music and effect volume · {Math.round(audioVolume * 100)}%</span><input type="range" min="0" max="1" step="0.01" value={audioVolume} onChange={event => setAudioVolume(Number(event.target.value))} className="mt-3 w-full accent-cyan-500" /></label>
            <label className="flex items-center justify-between gap-4"><span><span className="block text-sm font-bold text-white">Sound effects</span><span className="text-xs text-gray-400">Command errors and mission completion sounds.</span></span><input type="checkbox" checked={!isMuted} onChange={event => setIsMuted(!event.target.checked)} className="h-5 w-5 accent-cyan-500" /></label>
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

          setActiveMission(null);

          setScreen(
            missionOrigin
          );
        }}
        mission={activeMission}
        caseNotes={caseNotes}
        confidence={caseConfidence}
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

      {showOnboarding && (
        <OnboardingGuide
          onComplete={() =>
            setShowOnboarding(
              false
            )
          }
        />
      )}

      {showMissionToolGuide && (
        <MissionToolGuide onComplete={() => setShowMissionToolGuide(false)} />
      )}

    </div>
  );
}

export default App;
