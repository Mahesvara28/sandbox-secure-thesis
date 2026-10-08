import { useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';

import {
  Terminal,
  Shield,
  GraduationCap,
  Target,
  Play,
  CheckCircle2,
  Clock,
  User,
  Award,
  BookOpen,
  ChevronRight,
  Activity,
  Wifi,
  Database,
  Eye,
  BarChart3,
  HelpCircle,
  Lock
} from 'lucide-react';

import type {
  Tier,
  Mission
} from '../data/gameData';

import {
  MISSIONS,
  TUTORIAL_MISSIONS,
  TIERS
} from '../data/gameData';

import { TierDashboard } from './TierDashboard';

export type TierScoreLike = {
  score: number;
  total: number;
  preTestScore?: number;
  preTestTotal?: number;
  finalScore?: number;
  finalTotal?: number;
};

export const BootScreen = ({
  bootText = []
}: {
  bootText?: string[];
}) => {
  return (
    <div className="min-h-screen bg-black text-green-500 font-mono flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="border border-green-500/40 bg-black shadow-[0_0_40px_rgba(34,197,94,0.08)]">

          <div className="border-b border-green-500/30 px-4 py-3 flex items-center justify-between">

            <div className="flex items-center gap-2">
              <Terminal size={18} />
              <span className="text-sm tracking-widest">
                SANDBOX SECURE BIOS
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-green-500/60">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              SYSTEM BOOT
            </div>

          </div>

          <div className="p-6 min-h-[420px]">

            <div className="text-xs text-green-500/50 mb-6">
              SANDBOX SECURE TRAINING ENVIRONMENT v1.0
            </div>

            {bootText.map(
              (line, index) => (
                <div
                  key={`${line}-${index}`}
                  className="text-sm md:text-base leading-7"
                >
                  {line ||
                    '\u00A0'}
                </div>
              )
            )}

            <div className="mt-2 flex items-center gap-2">
              <span className="text-green-500">
                &gt;
              </span>

              <span className="w-2 h-4 bg-green-500 animate-pulse" />
            </div>

          </div>

          <div className="border-t border-green-500/20 px-4 py-3 text-xs text-green-500/40 flex justify-between">
            <span>
              SECURE BOOT
            </span>

            <span>
              TRAINING MODE
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

interface AuthScreenProps {
  authMode:
    | 'login'
    | 'register';

  setAuthMode: (
    mode:
      | 'login'
      | 'register'
  ) => void;

  authError: string;
  authSuccess: boolean;

  regUsername: string;

  setRegUsername: (
    value: string
  ) => void;

  regEmail: string;

  setRegEmail: (
    value: string
  ) => void;

  regPassword: string;

  setRegPassword: (
    value: string
  ) => void;

  handleLogin: () => Promise<void>;
  handleRegister: () => Promise<void>;
  handleGoogleLogin: () => Promise<void>;
}

export const AuthScreen = ({
  authMode,
  setAuthMode,
  authError,
  authSuccess,
  regUsername,
  setRegUsername,
  regEmail,
  setRegEmail,
  regPassword,
  setRegPassword,
  handleLogin,
  handleRegister,
  handleGoogleLogin
}: AuthScreenProps) => {
  return (
    <div className="min-h-screen bg-[#050807] text-green-400 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        <div className="border border-green-500/30 bg-[#08100c] shadow-[0_0_50px_rgba(34,197,94,0.06)]">

          <div className="border-b border-green-500/20 p-6 text-center">

            <div className="mx-auto w-16 h-16 border border-green-500/40 rounded-lg flex items-center justify-center mb-4">
              <Shield size={32} />
            </div>

            <h1 className="text-2xl font-bold tracking-[0.25em]">
              SANDBOX SECURE
            </h1>

            <p className="text-xs text-green-500/50 mt-2 tracking-widest">
              CYBERSECURITY TRAINING SIMULATION
            </p>

          </div>

          <div className="p-6">

            <div className="flex border-b border-green-500/20 mb-6">

              <button
                onClick={() =>
                  setAuthMode(
                    'login'
                  )
                }
                className={`flex-1 py-3 text-sm tracking-widest ${
                  authMode ===
                  'login'
                    ? 'text-green-400 border-b-2 border-green-400'
                    : 'text-green-500/40'
                }`}
              >
                LOGIN
              </button>

              <button
                onClick={() =>
                  setAuthMode(
                    'register'
                  )
                }
                className={`flex-1 py-3 text-sm tracking-widest ${
                  authMode ===
                  'register'
                    ? 'text-green-400 border-b-2 border-green-400'
                    : 'text-green-500/40'
                }`}
              >
                REGISTER
              </button>

            </div>

            {authMode ===
            'login' ? (
              <div className="space-y-4">

                <div>
                  <label className="block text-xs text-green-500/60 mb-2">
                    EMAIL
                  </label>

                  <input
                    value={
                      regEmail
                    }
                    onChange={e =>
                      setRegEmail(
                        e.target.value
                      )
                    }
                    onKeyDown={e => {
                      if (
                        e.key ===
                        'Enter'
                      ) {
                        handleLogin();
                      }
                    }}
                    type="email"
                    className="w-full bg-black border border-green-500/20 px-4 py-3 outline-none focus:border-green-500/60 text-green-300"
                    placeholder="operator@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs text-green-500/60 mb-2">
                    PASSWORD
                  </label>

                  <input
                    value={
                      regPassword
                    }
                    onChange={e =>
                      setRegPassword(
                        e.target.value
                      )
                    }
                    onKeyDown={e => {
                      if (
                        e.key ===
                        'Enter'
                      ) {
                        handleLogin();
                      }
                    }}
                    type="password"
                    className="w-full bg-black border border-green-500/20 px-4 py-3 outline-none focus:border-green-500/60 text-green-300"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  onClick={
                    handleLogin
                  }
                  className="w-full bg-green-500 text-black font-bold py-3 hover:bg-green-400"
                >
                  AUTHENTICATE
                </button>

                <div className="relative py-2">

                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-green-500/10" />
                  </div>

                  <div className="relative flex justify-center">
                    <span className="bg-[#08100c] px-3 text-xs text-green-500/30">
                      OR
                    </span>
                  </div>

                </div>

                <button
                  onClick={
                    handleGoogleLogin
                  }
                  className="w-full border border-green-500/20 py-3 text-sm hover:border-green-500/50"
                >
                  CONTINUE WITH GOOGLE
                </button>

              </div>
            ) : (
              <div className="space-y-4">

                <div>
                  <label className="block text-xs text-green-500/60 mb-2">
                    OPERATOR NAME
                  </label>

                  <input
                    value={
                      regUsername
                    }
                    onChange={e =>
                      setRegUsername(
                        e.target.value
                      )
                    }
                    className="w-full bg-black border border-green-500/20 px-4 py-3 outline-none focus:border-green-500/60 text-green-300"
                    placeholder="operator01"
                  />
                </div>

                <div>
                  <label className="block text-xs text-green-500/60 mb-2">
                    EMAIL
                  </label>

                  <input
                    value={
                      regEmail
                    }
                    onChange={e =>
                      setRegEmail(
                        e.target.value
                      )
                    }
                    type="email"
                    className="w-full bg-black border border-green-500/20 px-4 py-3 outline-none focus:border-green-500/60 text-green-300"
                    placeholder="operator@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs text-green-500/60 mb-2">
                    PASSWORD
                  </label>

                  <input
                    value={
                      regPassword
                    }
                    onChange={e =>
                      setRegPassword(
                        e.target.value
                      )
                    }
                    type="password"
                    className="w-full bg-black border border-green-500/20 px-4 py-3 outline-none focus:border-green-500/60 text-green-300"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  onClick={
                    handleRegister
                  }
                  className="w-full bg-green-500 text-black font-bold py-3 hover:bg-green-400"
                >
                  CREATE OPERATOR
                </button>

              </div>
            )}

            {authError && (
              <div className="mt-4 border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-400">
                {authError}
              </div>
            )}

            {authSuccess && (
              <div className="mt-4 border border-green-500/30 bg-green-500/5 p-3 text-xs text-green-400">
                ACCOUNT CREATED SUCCESSFULLY
              </div>
            )}

          </div>

          <div className="border-t border-green-500/10 p-4 text-center text-[10px] text-green-500/30 tracking-widest">
            AUTHORIZED TRAINING ENVIRONMENT ONLY
          </div>

        </div>

      </div>
    </div>
  );
};

interface DashboardScreenProps {
  user: FirebaseUser | null;

  userScores: Record<
    string,
    TierScoreLike
  >;

  setScreen: (
    screen:
      | 'dashboard'
      | 'academy'
      | 'missions'
      | 'terminal'
      | 'profile'
  ) => void;

  onShowGuide: () => void;
}

export const DashboardScreen = ({
  user,
  userScores,
  setScreen,
  onShowGuide
}: DashboardScreenProps) => {
  const scoreEntries =
    Object.values(
      userScores
    ).filter(
      item =>
        item.finalScore !==
          undefined &&
        item.finalTotal !==
          undefined
    );

  const totalScore =
    scoreEntries.reduce(
      (sum, item) =>
        sum +
        (item.finalScore ??
          0),
      0
    );

  const totalPossible =
    scoreEntries.reduce(
      (sum, item) =>
        sum +
        (item.finalTotal ??
          0),
      0
    );

  const percentage =
    totalPossible > 0
      ? Math.round(
          (totalScore /
            totalPossible) *
            100
        )
      : 0;

  return (
    <div className="space-y-6">

      <section className="border border-green-500/20 bg-[#08100c] p-6">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div>

            <div className="flex items-center gap-2 text-xs text-green-500/50 tracking-widest mb-3">
              <Activity size={14} />
              OPERATOR CONSOLE
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-green-300">
              Welcome,{' '}
              {user?.displayName ||
                'Operator'}
            </h1>

            <p className="text-green-500/50 mt-2 max-w-xl">
              Train your cybersecurity skills through safe simulated
              environments, guided missions, and incident-response scenarios.
            </p>

          </div>

          <button
            onClick={
              onShowGuide
            }
            className="flex items-center justify-center gap-2 border border-green-500/30 px-5 py-3 text-sm hover:bg-green-500/10"
          >
            <HelpCircle size={17} />
            HOW TO PLAY
          </button>

        </div>

      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="border border-green-500/20 bg-[#08100c] p-5">
          <p className="text-xs text-green-500/40 tracking-widest">
            TRAINING SCORE
          </p>

          <p className="text-3xl font-bold text-green-300 mt-2">
            {percentage}%
          </p>
        </div>

        <div className="border border-green-500/20 bg-[#08100c] p-5">
          <p className="text-xs text-green-500/40 tracking-widest">
            QUIZZES COMPLETED
          </p>

          <p className="text-3xl font-bold text-green-300 mt-2">
            {scoreEntries.length}
          </p>
        </div>

        <div className="border border-green-500/20 bg-[#08100c] p-5">
          <p className="text-xs text-green-500/40 tracking-widest">
            ACCESS LEVEL
          </p>

          <p className="text-3xl font-bold text-green-300 mt-2">
            OPERATOR
          </p>
        </div>

      </div>

      <section>

        <div className="flex items-center justify-between mb-4">

          <h2 className="text-lg font-bold tracking-widest text-green-300">
            TRAINING MODULES
          </h2>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <button
            onClick={() =>
              setScreen(
                'academy'
              )
            }
            className="text-left border border-green-500/20 bg-[#08100c] p-6 hover:border-green-500/50 transition"
          >
            <GraduationCap
              size={28}
              className="text-green-400 mb-4"
            />

            <h3 className="text-lg font-bold text-green-300">
              ACADEMY
            </h3>

            <p className="text-sm text-green-500/40 mt-2">
              Learn cybersecurity concepts and complete knowledge checks.
            </p>

            <div className="flex items-center gap-1 text-xs text-green-500/60 mt-5">
              ENTER ACADEMY
              <ChevronRight size={14} />
            </div>
          </button>

          <button
            onClick={() =>
              setScreen(
                'missions'
              )
            }
            className="text-left border border-green-500/20 bg-[#08100c] p-6 hover:border-green-500/50 transition"
          >
            <Target
              size={28}
              className="text-green-400 mb-4"
            />

            <h3 className="text-lg font-bold text-green-300">
              MISSIONS
            </h3>

            <p className="text-sm text-green-500/40 mt-2">
              Investigate simulated incidents and solve cybersecurity
              scenarios.
            </p>

            <div className="flex items-center gap-1 text-xs text-green-500/60 mt-5">
              VIEW MISSIONS
              <ChevronRight size={14} />
            </div>
          </button>

          <button
            onClick={
              onShowGuide
            }
            className="text-left border border-green-500/20 bg-[#08100c] p-6 hover:border-green-500/50 transition"
          >
            <BookOpen
              size={28}
              className="text-green-400 mb-4"
            />

            <h3 className="text-lg font-bold text-green-300">
              HOW TO PLAY
            </h3>

            <p className="text-sm text-green-500/40 mt-2">
              Learn how the terminal, missions, hints, maps, and objectives
              work.
            </p>

            <div className="flex items-center gap-1 text-xs text-green-500/60 mt-5">
              START GUIDE
              <ChevronRight size={14} />
            </div>
          </button>

        </div>

      </section>

    </div>
  );
};

const TIER_ORDER: Tier[] = [
  'BEGINNER',
  'INTERMEDIATE',
  'EXPERT'
];

const PASS_MARK = 70;

const isTierPassed = (
  scores: Record<
    string,
    TierScoreLike
  >,
  tier: Tier
): boolean => {
  const entry =
    scores[tier];

  return (
    !!entry &&
    entry.finalScore !==
      undefined &&
    !!entry.finalTotal &&
    (entry.finalScore /
      entry.finalTotal) *
      100 >=
      PASS_MARK
  );
};

const getLockedBy = (
  scores: Record<
    string,
    TierScoreLike
  >,
  tier: Tier
): Tier | null => {
  const index =
    TIER_ORDER.indexOf(
      tier
    );

  for (
    let i = 0;
    i < index;
    i++
  ) {
    if (
      !isTierPassed(
        scores,
        TIER_ORDER[i]
      )
    ) {
      return TIER_ORDER[i];
    }
  }

  return null;
};

interface AcademyScreenProps {
  activeTier: Tier | null;

  setActiveTier: (
    tier: Tier | null
  ) => void;

  userScores: Record<
    string,
    TierScoreLike
  >;

  handleQuizComplete: (
    tier: Tier,
    score: number,
    total: number,
    isPreTest?: boolean
  ) => Promise<void>;

  onStartMission: (
    missionId: string
  ) => void;

  completedMissions: string[];
}

export const AcademyScreen = ({
  activeTier,
  setActiveTier,
  userScores,
  handleQuizComplete,
  onStartMission,
  completedMissions
}: AcademyScreenProps) => {
  if (
    activeTier &&
    !getLockedBy(
      userScores,
      activeTier
    )
  ) {
    const tierData =
      TIERS.find(
        tier =>
          tier.id ===
          activeTier
      );

    if (!tierData) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">

            <h2 className="text-2xl font-black text-red-400">
              TIER DATA ERROR
            </h2>

            <p className="text-green-600 text-sm mt-2">
              The selected certification tier could not be loaded.
            </p>

            <button
              onClick={() =>
                setActiveTier(
                  null
                )
              }
              className="mt-5 border border-green-500 px-6 py-3 text-sm font-bold uppercase hover:bg-green-500 hover:text-black"
            >
              Return to Academy
            </button>

          </div>
        </div>
      );
    }

    return (
      <TierDashboard
        tierName={
          activeTier
        }
        preTestQuestions={
          tierData.preTest
        }
        postTestQuestions={
          tierData.postTest
        }
        onExit={() =>
          setActiveTier(
            null
          )
        }
        onComplete={(
          score,
          total,
          isPreTest
        ) =>
          handleQuizComplete(
            activeTier,
            score,
            total,
            isPreTest
          )
        }
        onStartMission={
          onStartMission
        }
        completedMissions={
          completedMissions
        }
        userScores={
          userScores
        }
      />
    );
  }

  const academyTiers: {
    id: Tier;
    number: string;
    title: string;
    description: string;
    color: string;
    border: string;
  }[] = [
    {
      id: 'BEGINNER',
      number: '01',
      title: 'BEGINNER',
      description:
        'Master Linux navigation, system orientation, authentication logs, and basic network investigation.',
      color: 'text-green-400',
      border:
        'border-green-500'
    },
    {
      id: 'INTERMEDIATE',
      number: '02',
      title: 'INTERMEDIATE',
      description:
        'Investigate processes, network services, logs, and simulated security incidents.',
      color: 'text-blue-400',
      border:
        'border-blue-500'
    },
    {
      id: 'EXPERT',
      number: '03',
      title: 'EXPERT',
      description:
        'Handle advanced incident response, persistence detection, forensics, and attack correlation.',
      color: 'text-red-400',
      border:
        'border-red-500'
    }
  ];

  return (
    <div className="h-full overflow-y-auto p-6 max-w-6xl mx-auto">

      <div className="mb-8">

        <div className="flex items-center gap-3 mb-2">

          <GraduationCap
            className="text-green-400"
            size={30}
          />

          <h1 className="text-3xl font-black text-white uppercase">
            Security Academy
          </h1>

        </div>

        <p className="text-green-700 text-sm">
          Complete each certification tier through assessment and practical
          terminal missions.
        </p>

      </div>

      <div className="grid gap-6">

        {academyTiers.map(
          tier => {
            const score =
              userScores[
                tier.id
              ];

            const lockedBy =
              getLockedBy(
                userScores,
                tier.id
              );

            const locked =
              lockedBy !==
              null;

            const passed =
              isTierPassed(
                userScores,
                tier.id
              );

            const tierMissions =
              MISSIONS.filter(
                mission =>
                  mission.tier ===
                  tier.id
              );

            const completedCount =
              tierMissions.filter(
                mission =>
                  completedMissions.includes(
                    mission.id
                  )
              ).length;

            return (
              <div
                key={
                  tier.id
                }
                className={`border ${tier.border} bg-black/60 p-6 ${
                  locked
                    ? 'opacity-60'
                    : ''
                }`}
              >

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                  <div className="flex gap-4">

                    <div
                      className={`w-14 h-14 border ${tier.border} flex items-center justify-center ${tier.color} font-black`}
                    >
                      {
                        tier.number
                      }
                    </div>

                    <div>

                      <h2
                        className={`text-2xl font-black ${tier.color}`}
                      >
                        {
                          tier.title
                        }{' '}
                        CERTIFICATION
                      </h2>

                      <p className="text-green-600 text-sm mt-1 max-w-2xl">
                        {
                          tier.description
                        }
                      </p>

                      {locked && (
                        <p className="text-xs text-yellow-500 mt-2">
                          Pass the{' '}
                          {
                            lockedBy
                          }{' '}
                          post-assessment (
                          {
                            PASS_MARK
                          }
                          %) to unlock this tier.
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 mt-4 text-xs">

                        <span className="text-green-700">
                          MISSIONS:{' '}
                          <span className="text-white">
                            {
                              completedCount
                            }
                            /
                            {
                              tierMissions.length
                            }
                          </span>
                        </span>

                        <span className="text-green-700">
                          PRE-TEST:{' '}
                          <span className="text-white">
                            {score &&
                            score.preTestScore !==
                              undefined
                              ? `${score.preTestScore}/${score.preTestTotal}`
                              : 'NOT TAKEN'}
                          </span>
                        </span>

                        <span className="text-green-700">
                          STATUS:{' '}
                          <span
                            className={
                              passed
                                ? 'text-green-400'
                                : locked
                                  ? 'text-yellow-500'
                                  : 'text-white'
                            }
                          >
                            {locked
                              ? 'LOCKED'
                              : passed
                                ? 'PASSED'
                                : 'OPEN'}
                          </span>
                        </span>

                      </div>

                    </div>

                  </div>

                  {locked ? (
                    <div className="border border-green-900 px-6 py-3 text-xs font-black uppercase text-green-800 whitespace-nowrap flex items-center gap-2 cursor-not-allowed">
                      <Lock
                        size={14}
                      />
                      Locked
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        setActiveTier(
                          tier.id
                        )
                      }
                      className={`border ${tier.border} px-6 py-3 text-xs font-black uppercase ${tier.color} hover:bg-white hover:text-black transition-colors whitespace-nowrap`}
                    >
                      {score
                        ? 'Continue Tier'
                        : 'Enter Tier'}{' '}
                      →
                    </button>
                  )}

                </div>

              </div>
            );
          }
        )}

      </div>

    </div>
  );
};

interface MissionsScreenProps {
  startMission: (
    mission: Mission
  ) => void;

  completedMissions?: string[];
}

export const MissionsScreen = ({
  startMission,
  completedMissions = []
}: MissionsScreenProps) => {
  const missions = [
    ...TUTORIAL_MISSIONS,
    ...MISSIONS
  ];

  return (
    <div className="space-y-6">

      <section className="border border-green-500/20 bg-[#08100c] p-6">

        <div className="flex items-center gap-3">

          <Target
            className="text-green-400"
            size={28}
          />

          <div>

            <h1 className="text-2xl font-bold text-green-300">
              OPERATIONS
            </h1>

            <p className="text-sm text-green-500/40 mt-1">
              Select a mission and investigate the simulated environment.
            </p>

          </div>

        </div>

      </section>

      <div className="space-y-4">

        {missions.map(
          (
            mission,
            index
          ) => {
            const completed =
              completedMissions.includes(
                mission.id
              );

            return (
              <div
                key={
                  mission.id
                }
                className={`border bg-[#08100c] p-5 ${
                  completed
                    ? 'border-green-500/40'
                    : 'border-green-500/20 hover:border-green-500/40'
                }`}
              >

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                  <div className="flex items-start gap-4">

                    <div className="w-10 h-10 shrink-0 border border-green-500/30 flex items-center justify-center text-green-400 font-mono">

                      {completed ? (
                        <CheckCircle2
                          size={20}
                        />
                      ) : (
                        String(
                          index +
                            1
                        ).padStart(
                          2,
                          '0'
                        )
                      )}

                    </div>

                    <div>

                      <h2 className="text-lg font-bold text-green-300">
                        {
                          mission.title
                        }
                      </h2>

                      <p className="text-xs text-green-500/40 mt-1">
                        {
                          mission.scenario
                        }
                      </p>

                      <p className="text-sm text-green-500/50 mt-3">
                        {
                          mission.intro
                        }
                      </p>

                      <div className="flex flex-wrap gap-4 mt-4 text-xs text-green-500/40">

                        <span className="flex items-center gap-1">
                          <Clock
                            size={13}
                          />

                          {Math.floor(
                            mission.timerLimit /
                              60
                          )}{' '}
                          MIN
                        </span>

                        <span className="flex items-center gap-1">
                          <Target
                            size={13}
                          />

                          {
                            mission.steps
                              .length
                          }{' '}
                          OBJECTIVES
                        </span>

                      </div>

                    </div>

                  </div>

                  <button
                    onClick={() =>
                      startMission(
                        mission
                      )
                    }
                    className="shrink-0 flex items-center justify-center gap-2 border border-green-500 px-5 py-2 text-xs font-bold uppercase hover:bg-green-500 hover:text-black"
                  >
                    <Play
                      size={13}
                    />

                    {completed
                      ? 'Replay'
                      : 'Deploy'}
                  </button>

                </div>

              </div>
            );
          }
        )}

      </div>

    </div>
  );
};

interface TerminalScreenProps {
  activeMission: Mission;

  handleCommand: (
    cmd: string
  ) => void;

  isThreatActive: boolean;
  timeLeft: number;
  questStep: number;
  msg: string;
  sysNonce: number;

  setShowHint: (
    value: boolean
  ) => void;

  setShowMap: (
    value: boolean
  ) => void;

  setHintText: (
    value: string
  ) => void;

  currentPath: string;

  setCurrentPath: (
    path: string
  ) => void;

  onMapAction: (
    action:
      | 'scan'
      | 'block'
      | 'none'
  ) => void;

  playSound: (
    type:
      | 'keystroke'
      | 'success'
      | 'error'
      | 'scan'
  ) => void;
}

export const TerminalScreen = ({
  activeMission,
  handleCommand,
  isThreatActive,
  timeLeft,
  questStep,
  msg,
  sysNonce,
  setShowHint,
  setShowMap,
  setHintText,
  currentPath,
  setCurrentPath,
  onMapAction,
  playSound
}: TerminalScreenProps) => {
  const [command, setCommand] =
    useState('');

  const [history, setHistory] =
    useState<string[]>([
      'SANDBOX SECURE TERMINAL',
      'Type commands to interact with the simulated environment.',
      ''
    ]);

  const currentStep =
    activeMission.steps[
      questStep
    ];

  const executeCommand =
    () => {
      const trimmed =
        command.trim();

      if (!trimmed) {
        return;
      }

      playSound(
        'keystroke'
      );

      setHistory(
        prev => [
          ...prev,
          `operator@secure:${currentPath}$ ${trimmed}`
        ]
      );

      handleCommand(
        trimmed
      );

      setCommand('');
    };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      event.key ===
      'Enter'
    ) {
      executeCommand();
    }
  };

  const showCurrentHint =
    () => {
      if (currentStep) {
        setHintText(
          currentStep.hint
        );

        setShowHint(
          true
        );
      }
    };

  return (
    <div className="space-y-4">

      <div className="border border-green-500/20 bg-[#08100c] p-4">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <div>

            <div className="text-xs text-green-500/40 tracking-widest">
              ACTIVE OPERATION
            </div>

            <h1 className="text-xl font-bold text-green-300 mt-1">
              {
                activeMission.title
              }
            </h1>

          </div>

          <div className="flex items-center gap-4">

            <div className="text-xs text-green-500/50">
              OBJECTIVE{' '}
              {questStep +
                1}
              /
              {
                activeMission.steps
                  .length
              }
            </div>

            <div
              className={`flex items-center gap-2 text-sm font-mono ${
                timeLeft <=
                30
                  ? 'text-red-400'
                  : 'text-green-400'
              }`}
            >

              <Clock size={16} />

              {Math.floor(
                timeLeft /
                  60
              )
                .toString()
                .padStart(
                  2,
                  '0'
                )}

              :

              {(
                timeLeft %
                60
              )
                .toString()
                .padStart(
                  2,
                  '0'
                )}

            </div>

          </div>

        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">

        <div className="border border-green-500/20 bg-black overflow-hidden">

          <div className="border-b border-green-500/20 bg-[#08100c] px-4 py-3 flex items-center justify-between">

            <div className="flex items-center gap-2 text-xs text-green-400">
              <Terminal size={15} />
              SECURE TERMINAL
            </div>

            <div className="flex items-center gap-2 text-[10px] text-green-500/40">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              ONLINE
            </div>

          </div>

          <div className="h-[520px] overflow-y-auto p-4 font-mono text-sm">

            {history.map(
              (
                line,
                index
              ) => (
                <div
                  key={`${line}-${index}`}
                  className="text-green-400/80 leading-6"
                >
                  {line ||
                    '\u00A0'}
                </div>
              )
            )}

            {msg && (
              <div className="mt-2 text-green-300 whitespace-pre-wrap">
                {
                  msg
                }
              </div>
            )}

            <div className="mt-3 flex items-center">

              <span className="text-green-500 mr-2">
                operator@secure:
                {
                  currentPath
                }$
              </span>

              <input
                value={
                  command
                }
                onChange={e =>
                  setCommand(
                    e.target.value
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                className="flex-1 bg-transparent outline-none text-green-300"
                autoFocus
              />

            </div>

          </div>

        </div>

        <div className="space-y-4">

          <div className="border border-green-500/20 bg-[#08100c] p-5">

            <div className="flex items-center gap-2 text-xs text-green-500/40 tracking-widest mb-3">
              <Target size={14} />
              CURRENT OBJECTIVE
            </div>

            <p className="text-sm text-green-300 leading-6">
              {
                currentStep?.desc ||
                'MISSION COMPLETE'
              }
            </p>

          </div>

          <div className="border border-green-500/20 bg-[#08100c] p-5">

            <div className="text-xs text-green-500/40 tracking-widest mb-3">
              REQUIRED COMMAND
            </div>

            <div className="border border-green-500/10 bg-black p-3 font-mono text-xs text-green-400 break-all">
              {
                currentStep?.cmd ||
                'MISSION COMPLETE'
              }
            </div>

          </div>

          <div className="grid grid-cols-2 gap-2">

            <button
              onClick={
                showCurrentHint
              }
              className="border border-green-500/20 bg-[#08100c] p-3 text-xs text-green-400 hover:border-green-500/50"
            >
              <HelpCircle
                size={16}
                className="mx-auto mb-1"
              />
              HINT
            </button>

            <button
              onClick={() =>
                setShowMap(
                  true
                )
              }
              className="border border-green-500/20 bg-[#08100c] p-3 text-xs text-green-400 hover:border-green-500/50"
            >
              <Wifi
                size={16}
                className="mx-auto mb-1"
              />
              MAP
            </button>

          </div>

          <div className="border border-green-500/20 bg-[#08100c] p-4">

            <div className="text-[10px] text-green-500/30 tracking-widest mb-3">
              SYSTEM STATUS
            </div>

            <div className="space-y-2 text-xs">

              <div className="flex justify-between">

                <span className="text-green-500/40">
                  THREAT STATUS
                </span>

                <span
                  className={
                    isThreatActive
                      ? 'text-red-400'
                      : 'text-green-400'
                  }
                >
                  {isThreatActive
                    ? 'ACTIVE'
                    : 'MONITORING'}
                </span>

              </div>

              <div className="flex justify-between">

                <span className="text-green-500/40">
                  CURRENT PATH
                </span>

                <span className="text-green-300 truncate ml-4">
                  {
                    currentPath
                  }
                </span>

              </div>

              <div className="flex justify-between">

                <span className="text-green-500/40">
                  SYSTEM CYCLE
                </span>

                <span className="text-green-300">
                  {
                    sysNonce
                  }
                </span>

              </div>

            </div>

          </div>

          <div className="hidden">

            <button
              onClick={() =>
                setCurrentPath(
                  '/home/operator'
                )
              }
            />

            <button
              onClick={() =>
                onMapAction(
                  'scan'
                )
              }
            />

            <button
              onClick={() =>
                onMapAction(
                  'block'
                )
              }
            />

            <button
              onClick={() =>
                onMapAction(
                  'none'
                )
              }
            />

          </div>

        </div>

      </div>

    </div>
  );
};

interface ProfileScreenProps {
  user: FirebaseUser | null;

  userScores: Record<
    string,
    TierScoreLike
  >;

  setShowEval?: (
    value: boolean
  ) => void;
}

export const ProfileScreen = ({
  user,
  userScores,
  setShowEval
}: ProfileScreenProps) => {
  const scoreEntries =
    Object.values(
      userScores
    ).filter(
      item =>
        item.finalScore !==
          undefined &&
        item.finalTotal !==
          undefined
    );

  const totalScore =
    scoreEntries.reduce(
      (sum, item) =>
        sum +
        (item.finalScore ??
          0),
      0
    );

  const totalPossible =
    scoreEntries.reduce(
      (sum, item) =>
        sum +
        (item.finalTotal ??
          0),
      0
    );

  const percentage =
    totalPossible > 0
      ? Math.round(
          (totalScore /
            totalPossible) *
            100
        )
      : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      <section className="border border-green-500/20 bg-[#08100c] p-6">

        <div className="flex flex-col md:flex-row items-center md:items-start gap-5">

          <div className="w-20 h-20 rounded-full border border-green-500/30 flex items-center justify-center bg-black">
            <User
              size={34}
              className="text-green-400"
            />
          </div>

          <div className="text-center md:text-left">

            <div className="text-xs text-green-500/40 tracking-widest">
              OPERATOR PROFILE
            </div>

            <h1 className="text-2xl font-bold text-green-300 mt-1">
              {
                user?.displayName ||
                'Operator'
              }
            </h1>

            <p className="text-sm text-green-500/40 mt-1">
              {
                user?.email ||
                'No email available'
              }
            </p>

          </div>

        </div>

      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="border border-green-500/20 bg-[#08100c] p-5">

          <div className="flex items-center gap-3">

            <Award
              className="text-green-400"
              size={20}
            />

            <span className="text-xs text-green-500/50">
              TOTAL SCORE
            </span>

          </div>

          <div className="text-3xl font-bold text-green-300 mt-3">
            {
              totalScore
            }
          </div>

        </div>

        <div className="border border-green-500/20 bg-[#08100c] p-5">

          <div className="flex items-center gap-3">

            <BarChart3
              className="text-green-400"
              size={20}
            />

            <span className="text-xs text-green-500/50">
              AVERAGE
            </span>

          </div>

          <div className="text-3xl font-bold text-green-300 mt-3">
            {
              percentage
            }%
          </div>

        </div>

        <div className="border border-green-500/20 bg-[#08100c] p-5">

          <div className="flex items-center gap-3">

            <Database
              className="text-green-400"
              size={20}
            />

            <span className="text-xs text-green-500/50">
              ASSESSMENTS
            </span>

          </div>

          <div className="text-3xl font-bold text-green-300 mt-3">
            {
              scoreEntries.length
            }
          </div>

        </div>

      </div>

      <section className="border border-green-500/20 bg-[#08100c] p-6">

        <div className="flex items-center gap-3 mb-5">

          <User
            size={20}
            className="text-green-400"
          />

          <h2 className="font-bold text-green-300 tracking-widest">
            ACCOUNT INFORMATION
          </h2>

        </div>

        <div className="space-y-3 text-sm">

          <div className="flex justify-between gap-4 border-b border-green-500/10 pb-3">

            <span className="text-green-500/40">
              EMAIL
            </span>

            <span className="text-green-300 text-right break-all">
              {
                user?.email ||
                'N/A'
              }
            </span>

          </div>

          <div className="flex justify-between gap-4 border-b border-green-500/10 pb-3">

            <span className="text-green-500/40">
              USER ID
            </span>

            <span className="text-green-300 text-right max-w-[60%] truncate">
              {
                user?.uid ||
                'N/A'
              }
            </span>

          </div>

          <div className="flex justify-between gap-4">

            <span className="text-green-500/40">
              ACCESS LEVEL
            </span>

            <span className="text-green-300">
              OPERATOR
            </span>

          </div>

        </div>

      </section>

      {setShowEval && (
        <section className="border border-green-500/20 bg-[#08100c] p-6">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>

              <div className="flex items-center gap-2">

                <Eye
                  size={18}
                  className="text-green-400"
                />

                <h2 className="font-bold text-green-300">
                  THESIS EVALUATION
                </h2>

              </div>

              <p className="text-sm text-green-500/40 mt-2">
                Evaluate the Sandbox Secure training experience.
              </p>

            </div>

            <button
              onClick={() =>
                setShowEval(
                  true
                )
              }
              className="border border-green-500/30 px-5 py-3 text-xs text-green-400 hover:bg-green-500/10"
            >
              OPEN EVALUATION
            </button>

          </div>

        </section>
      )}

    </div>
  );
};