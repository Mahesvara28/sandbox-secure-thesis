import { useEffect, useRef, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { getMissionAttempts, getAssessmentAttempts, getDailyTimeAttackEntries } from '../Firebase';
import type { LeaderboardEntry, MissionAttemptRecord } from '../Firebase';
import { uploadUserAvatar } from '../Firebase';

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
  BarChart3,
  HelpCircle,
  Lock,
  Eye,
  EyeOff,
  Upload
} from 'lucide-react';

import type {
  Tier,
  Mission
} from '../data/gameData';

import {
  MISSIONS,
  TUTORIAL_MISSIONS,
  TIERS,
  MOCK_FILES,
  MOCK_FILE_SYSTEM
} from '../data/gameData';

import { TierDashboard } from './TierDashboard';
import { CommandFieldGuide } from './CommandFieldGuide';

export type TierScoreLike = {
  score: number;
  total: number;
  preTestScore?: number;
  preTestTotal?: number;
  finalScore?: number;
  finalTotal?: number;
};

const splitTerminalArgs = (line: string) => line.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)?.map(value => value.replace(/^['"]|['"]$/g, '')) ?? [];

const TypewriterText = ({ text }: { text: string }) => {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let cursor = 0;
    const step = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? text.length : 8;
    const interval = setInterval(() => {
      cursor = Math.min(cursor + step, text.length);
      setShown(cursor);
      if (cursor >= text.length) clearInterval(interval);
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 16 : 12);
    return () => clearInterval(interval);
  }, [text]);

  return <span aria-label={text}>{text.slice(0, shown)}{shown < text.length && <span aria-hidden="true" className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-green-400 align-middle" />}</span>;
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
  theme: 'dark' | 'light';
  onToggleTheme: () => void;

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
  theme,
  onToggleTheme,
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
  const [showPassword, setShowPassword] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(true);

  return (
    <div className="min-h-screen bg-[#050807] text-green-400 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        <div className="mb-3 flex justify-end">
          <button type="button" onClick={onToggleTheme} className="border border-green-500/30 px-3 py-2 text-xs text-green-300 hover:border-green-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? 'LIGHT MODE' : 'DARK MODE'}
          </button>
        </div>

        <div className="border border-green-500/30 bg-[#08100c] shadow-[0_0_50px_rgba(34,197,94,0.06)]">

          <div className="border-b border-green-500/20 p-6 text-center">

            {logoLoaded ? <img src="/logo.png" alt="Sandbox Secure logo" onError={() => setLogoLoaded(false)} className="mx-auto mb-4 h-20 max-w-56 object-contain" /> : <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg border border-green-500/40"><Shield size={32} /></div>}

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

                  <div className="relative">
                    <input
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
                      type={showPassword ? 'text' : 'password'}
                      className="w-full bg-black border border-green-500/20 px-4 py-3 pr-12 outline-none focus:border-green-500/60 text-green-300"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className="absolute inset-y-0 right-1 inline-flex w-10 items-center justify-center text-green-400 hover:text-green-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
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

                  <div className="relative">
                    <input
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      type={showPassword ? 'text' : 'password'}
                      className="w-full bg-black border border-green-500/20 px-4 py-3 pr-12 outline-none focus:border-green-500/60 text-green-300"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className="absolute inset-y-0 right-1 inline-flex w-10 items-center justify-center text-green-400 hover:text-green-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
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
  onStartDailyTrial: () => void;
  dailyTrialPlayed: boolean;
  dailyTrialDate: string;
  dailyTrialType: 'timeAttack' | 'accuracy';
  dailyTrialMissionTitle: string;
}

export const DashboardScreen = ({
  user,
  userScores,
  setScreen,
  onShowGuide,
  onStartDailyTrial,
  dailyTrialPlayed,
  dailyTrialDate,
  dailyTrialType,
  dailyTrialMissionTitle
}: DashboardScreenProps) => {
  const [missionAttempts, setMissionAttempts] = useState<MissionAttemptRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardUnavailable, setLeaderboardUnavailable] = useState(false);
  const userId = user?.uid;

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => userId ? getMissionAttempts(userId) : []).then(attempts => {
      if (!cancelled) setMissionAttempts(attempts);
    }).catch(error => {
      console.error('Could not load dashboard mission history:', error);
    });
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    if (dailyTrialType !== 'timeAttack') {
      setLeaderboard([]);
      setLeaderboardUnavailable(false);
      return () => { cancelled = true; };
    }
    void getDailyTimeAttackEntries(dailyTrialDate).then(entries => {
      if (!cancelled) {
        setLeaderboard(entries);
        setLeaderboardUnavailable(false);
      }
    }).catch(error => {
      console.warn('Could not load the daily time-attack leaderboard. Check sign-in and Firestore rules for dailyTimeAttackEntries:', error);
      if (!cancelled) setLeaderboardUnavailable(true);
    });
    return () => { cancelled = true; };
  }, [userId, dailyTrialDate, dailyTrialType]);

  const bestMissionAttempts = new Map<string, { accuracy: number; points: number }>();
  missionAttempts.forEach(attempt => {
    if (attempt.outcome !== 'completed') return;
    const wrongCommands = Object.values(attempt.wrongCommandsByStep ?? {}).reduce((sum, count) => sum + count, 0);
    const accuracy = Math.max(0, 100 - wrongCommands * 6 - attempt.wrongDecisionCount * 15 - attempt.hintsOpened * 2);
    const timeBonus = attempt.challengeMode ? Math.max(0, Math.floor((2100 - attempt.totalTimeSeconds) / 30)) : 0;
    const points = accuracy + timeBonus;
    const currentBest = bestMissionAttempts.get(attempt.missionId);
    if (!currentBest || points > currentBest.points) bestMissionAttempts.set(attempt.missionId, { accuracy, points });
  });
  const missionPoints = [...bestMissionAttempts.values()].reduce((total, result) => total + result.points, 0);
  const missionAccuracy = bestMissionAttempts.size
    ? Math.round([...bestMissionAttempts.values()].reduce((total, result) => total + result.accuracy, 0) / bestMissionAttempts.size)
    : 0;
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
    <div className="mx-auto min-h-full w-full max-w-[1480px] space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">

      <section className="border border-green-500/20 bg-[#08100c] p-6">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div>

            {user?.photoURL && <img src={user.photoURL} alt="Your profile" className="mb-4 h-14 w-14 rounded-full border border-green-500/40 object-cover" />}

            <div className="flex items-center gap-2 text-xs text-green-500/50 tracking-widest mb-3">
              <Activity size={14} />
              OPERATOR CONSOLE
            </div>

            <h1 className="text-3xl font-black text-green-300 uppercase">
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
              className="flex items-center justify-center gap-2 border border-green-500/30 px-5 py-3 text-sm hover:bg-green-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <HelpCircle size={17} />
            HOW TO PLAY
          </button>

        </div>

      </section>

      <section className="flex flex-col gap-4 border border-cyan-700/50 bg-cyan-950/20 p-5 sm:flex-row sm:items-center sm:justify-between" aria-label="Recommended starting point">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">New to cybersecurity?</p>
          <h2 className="mt-1 text-lg font-bold text-white">Start in the Security Academy</h2>
          <p className="mt-1 text-sm text-gray-300">Begin with the Beginner certification. It explains the basics before asking you to investigate.</p>
        </div>
        <button type="button" onClick={() => setScreen('academy')} className="shrink-0 border border-cyan-400 bg-cyan-400 px-5 py-3 text-xs font-black uppercase text-black transition-colors hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
          Start learning →
        </button>
      </section>

      <section className="flex flex-col gap-4 border border-yellow-700/50 bg-yellow-950/10 p-5 sm:flex-row sm:items-center sm:justify-between" aria-label="Daily training trial">
        <div><p className="text-xs font-bold uppercase tracking-widest text-yellow-400">Daily training trial · one attempt</p><h2 className="mt-1 text-lg font-bold text-white">{dailyTrialType === 'timeAttack' ? 'Time Attack' : 'Accuracy Trial'}: {dailyTrialMissionTitle}</h2><p className="mt-1 text-sm text-gray-300">A short rotating practice scenario. Time Attack uses a countdown and competes for the fastest clear time; Accuracy Trial rewards careful command choices.</p><p className="mt-2 text-[10px] text-gray-500">Available once per calendar day in this browser profile.</p></div>
        <button type="button" disabled={dailyTrialPlayed} onClick={onStartDailyTrial} className="shrink-0 border border-yellow-500 px-5 py-3 text-xs font-black uppercase text-yellow-200 transition-colors hover:bg-yellow-500 hover:text-black disabled:cursor-not-allowed disabled:opacity-50">{dailyTrialPlayed ? 'Trial used today' : 'Start daily trial →'}</button>
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

      <section className="border border-cyan-700/40 bg-cyan-950/10 p-5 sm:p-6" aria-label="Personal training progress">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-500">Your training record</p>
            <h2 className="mt-1 text-xl font-black text-cyan-200">Progress, accuracy, and points</h2>
          </div>
          <p className="text-[10px] text-gray-400">Best completed run per mission · points reward careful, accurate work</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="border border-cyan-900/70 bg-black/30 p-4"><p className="text-[10px] uppercase tracking-widest text-gray-400">Mission points</p><p className="mt-1 text-3xl font-black text-cyan-200">{missionPoints}</p></div>
          <div className="border border-cyan-900/70 bg-black/30 p-4"><p className="text-[10px] uppercase tracking-widest text-gray-400">Best-run accuracy</p><p className="mt-1 text-3xl font-black text-cyan-200">{bestMissionAttempts.size ? `${missionAccuracy}%` : '—'}</p></div>
          <div className="border border-cyan-900/70 bg-black/30 p-4"><p className="text-[10px] uppercase tracking-widest text-gray-400">Missions completed</p><p className="mt-1 text-3xl font-black text-cyan-200">{bestMissionAttempts.size}</p></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Achievements">
          <span className="border border-green-800 bg-green-950/20 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-green-300">{bestMissionAttempts.size > 0 ? 'First case completed' : 'First case · ready to earn'}</span>
          <span className={`border px-3 py-2 text-[10px] font-bold uppercase tracking-wide ${missionAccuracy >= 90 ? 'border-cyan-600 bg-cyan-950/30 text-cyan-200' : 'border-gray-700 bg-black/20 text-gray-400'}`}>{missionAccuracy >= 90 ? 'Careful analyst · 90% accuracy' : 'Careful analyst · reach 90% accuracy'}</span>
          <span className={`border px-3 py-2 text-[10px] font-bold uppercase tracking-wide ${bestMissionAttempts.size >= 5 ? 'border-yellow-700 bg-yellow-950/20 text-yellow-200' : 'border-gray-700 bg-black/20 text-gray-400'}`}>{bestMissionAttempts.size >= 5 ? 'Field operator · 5 cases' : `Field operator · ${bestMissionAttempts.size}/5 cases`}</span>
        </div>
        <p className="mt-3 text-[10px] leading-4 text-gray-500">Accuracy is an estimate from recorded wrong commands, decision errors, and hint use. It is a learning progress indicator, not a formal certification score.</p>
      </section>

      <section className="border border-yellow-700/50 bg-yellow-950/10 p-5 sm:p-6" aria-label="Daily time attack leaderboard">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-yellow-500">Daily challenge · {dailyTrialDate}</p><h2 className="mt-1 text-xl font-black text-yellow-200">Time Attack leaderboard</h2><p className="mt-1 text-xs text-gray-300">Today’s mission: {dailyTrialMissionTitle}</p></div>
          <p className="text-[10px] text-gray-400">Fastest completed clear time · names are anonymous operator IDs</p>
        </div>
        {dailyTrialType !== 'timeAttack' ? <p className="mt-4 border border-yellow-900/50 bg-black/30 p-4 text-xs text-gray-300">Today is an Accuracy Trial, so there is no timed ranking today. The next Time Attack will use a different rotating mission.</p> : leaderboardUnavailable ? <p className="mt-4 border border-yellow-800/70 bg-black/30 p-4 text-xs leading-5 text-yellow-200">Could not load entries. Confirm you are signed in and that the Firestore `dailyTimeAttackEntries` read rule is published, then refresh.</p> : leaderboard.length === 0 ? <p className="mt-4 border border-yellow-900/50 bg-black/30 p-4 text-xs text-gray-400">No one has completed today’s Time Attack yet. Finish it to add a clear time.</p> : <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[420px] text-left text-xs"><thead className="text-[10px] uppercase tracking-widest text-gray-400"><tr><th className="pb-3 pr-3">Rank</th><th className="pb-3 pr-3">Operator</th><th className="pb-3">Clear time</th></tr></thead><tbody>{leaderboard.map((entry, index) => <tr key={entry.uid} className={`border-t border-yellow-900/40 ${entry.uid === userId ? 'bg-yellow-950/30 text-yellow-100' : 'text-gray-200'}`}><td className="py-3 pr-3 font-bold text-yellow-300">#{index + 1}</td><td className="py-3 pr-3">{entry.nickname}{entry.uid === userId ? ' · YOU' : ''}</td><td className="py-3 font-bold">{Math.floor(entry.clearTimeSeconds / 60)}:{String(entry.clearTimeSeconds % 60).padStart(2, '0')}</td></tr>)}</tbody></table></div>}
        <p className="mt-3 text-[10px] text-gray-500">For presentation only. Entries are submitted by the game client and are not tamper-proof.</p>
      </section>

      <section className="border border-green-500/20 bg-[#08100c] p-6">

        <h2 className="font-bold text-green-300 tracking-widest mb-4">
          CERTIFICATION ASSESSMENT SCORES
        </h2>

        <div className="space-y-3">
          {(['BEGINNER', 'INTERMEDIATE', 'EXPERT'] as const).map(tier => {
            const score = userScores[tier];
            return (
              <div key={tier} className="grid grid-cols-3 gap-3 border-b border-green-500/10 pb-3 text-xs">
                <span className="text-green-300">{tier}</span>
                <span className="text-green-500/60">PRE: {score?.preTestScore !== undefined ? `${score.preTestScore}/${score.preTestTotal ?? 0}` : 'NOT TAKEN'}</span>
                <span className="text-green-500/60">POST: {score?.finalScore !== undefined ? `${score.finalScore}/${score.finalTotal ?? 0}` : 'NOT TAKEN'}</span>
              </div>
            );
          })}
        </div>

      </section>

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
            className="text-left border border-green-500/20 bg-[#08100c] p-6 hover:border-green-500/50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
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
            className="text-left border border-green-500/20 bg-[#08100c] p-6 hover:border-green-500/50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
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
            className="text-left border border-green-500/20 bg-[#08100c] p-6 hover:border-green-500/50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
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
  progressScope?: string;

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
  completedMissions,
  progressScope = 'local'
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
        progressScope={progressScope}
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
    <div className="mx-auto min-h-full w-full max-w-[1480px] space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">

      <div className="mb-8">

        <div className="flex items-center gap-3 mb-2">

          <GraduationCap
            className="text-green-400"
            size={30}
          />

          <h1 className="text-3xl font-black text-green-300 uppercase">
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
                          POST-TEST:{' '}
                          <span className="text-white">
                            {score?.finalScore !== undefined
                              ? `${score.finalScore}/${score.finalTotal ?? 0}`
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
  const [missionFilter, setMissionFilter] = useState<'all' | 'files' | 'network' | 'logs'>(
    'all'
  );
  const missions = [
    ...TUTORIAL_MISSIONS
  ].filter(mission => missionFilter === 'all' || mission.category === missionFilter);
  const completedCount = missions.filter(mission => completedMissions.includes(mission.id)).length;

  return (
    <div className="mx-auto min-h-full w-full max-w-[1480px] space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">

      <section className="border border-green-500/20 bg-[#08100c] p-6">

        <div className="flex items-center gap-3">

          <Target
            className="text-green-400"
            size={28}
          />

          <div>

            <h1 className="text-3xl font-black text-green-300 uppercase">
              OPERATIONS
            </h1>

            <p className="text-sm text-green-500/40 mt-1">
              Practice with standalone missions. Certification training missions are kept in the Academy.
            </p>
            <p className="mt-3 text-xs text-green-400/60">{completedCount} of {missions.length} shown missions completed</p>

          </div>

        </div>

      </section>

      <div className="flex flex-wrap gap-2" aria-label="Filter practice missions">
        {([
          ['all', 'ALL PRACTICE'],
          ['files', 'FILES'],
          ['network', 'NETWORK'],
          ['logs', 'TIMELINES']
        ] as const).map(([filter, label]) => (
          <button
            key={filter}
            onClick={() => setMissionFilter(filter)}
            aria-pressed={missionFilter === filter}
            className={`border px-3 py-2 text-[10px] font-bold tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 ${missionFilter === filter ? 'border-green-400 bg-green-500/10 text-green-300' : 'border-green-900 text-green-700 hover:border-green-600 hover:text-green-400'}`}
          >
            {label}
          </button>
        ))}
      </div>

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
                        {mission.learningGoal}
                      </p>

                      <div className="flex flex-wrap gap-4 mt-4 text-xs text-green-500/40">

                        <span className="border border-green-900 px-2 py-1 uppercase tracking-wider">
                          {mission.category ?? 'practice'} · {mission.difficulty}
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock
                            size={13}
                          />

                          {mission.timerLimit > 0
                            ? `${Math.floor(mission.timerLimit / 60)} MIN CHALLENGE`
                            : 'UNTIMED PRACTICE'}
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
                    className="shrink-0 flex items-center justify-center gap-2 border border-green-500 px-5 py-2 text-xs font-bold uppercase hover:bg-green-500 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
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
    value: string | string[]
  ) => void;
  onHintLevelShown: (level: number) => void;

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

  containedTarget: string;
  disabledService: string;
  removedPersistence: string[];
  onCaseNotesChange: (update: (previous: string[]) => string[]) => void;
  onCaseConfidenceChange: (confidence: string) => void;
  onShowMissionGuide: () => void;

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
  onHintLevelShown,
  currentPath,
  setCurrentPath,
  onMapAction,
  containedTarget,
  disabledService,
  removedPersistence,
  onCaseNotesChange,
  onCaseConfidenceChange,
  onShowMissionGuide,
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

  const [inspectedEvidence, setInspectedEvidence] = useState<string[]>([]);
  const [evidenceNotes, setEvidenceNotes] = useState<string[]>([]);
  const [terminatedPids, setTerminatedPids] = useState<string[]>([]);
  const [showCommandGuide, setShowCommandGuide] = useState(false);
  const [showMissionPrimer, setShowMissionPrimer] = useState(false);

  const currentStep = activeMission.steps[Math.min(questStep, activeMission.steps.length - 1)];
  const isCertificationMission = activeMission.id.startsWith('m') || activeMission.id.startsWith('bridge-');

  const recordEvidenceNote = (note: string) => {
    setEvidenceNotes(previous => previous.includes(note) ? previous : [...previous, note]);
    onCaseNotesChange(previous => previous.includes(note) ? previous : [...previous, note]);
  };

  const inspectEvidence = (id: string) => {
    setInspectedEvidence(previous => previous.includes(id) ? previous : [...previous, id]);
    if (currentStep?.inspectEvidenceId === id) {
      const item = activeMission.evidence?.find(evidence => evidence.id === id);
      setHistory(previous => [...previous, `operator@secure:${currentPath}$ inspect ${item?.label ?? id}`]);
      playSound('keystroke');
      handleCommand(`inspect ${id}`);
    }
  };

  const showCommandHelp = () => {
    setHistory(previous => [...previous, `operator@secure:${currentPath}$ help`]);
    playSound('success');
    handleCommand('help');
  };

  const simulateCommand = (line: string): string => {
    const tokens = splitTerminalArgs(line.trim());
    const name = tokens[0]?.toLowerCase() ?? '';
    const args = tokens.slice(1);
    const resolveFile = (path: string) => path.startsWith('/') ? path : `${currentPath.replace(/\/$/, '')}/${path}`;
    const fileAt = (path: string) => MOCK_FILES[resolveFile(path)] ?? MOCK_FILES[path];
    const logTime = (row: string) => row.match(/(?:\d{2}:){2}\d{2}/)?.[0] ?? '';

    if (name === 'help') return '';
    if (name === 'choose') return '[DECISION] Choice submitted for evidence review.';
    if (name === 'inspect') {
      const requestedId = args.join(' ').toLowerCase();
      const evidence = activeMission.evidence?.find(item =>
        item.id.toLowerCase() === requestedId || item.label.toLowerCase() === requestedId
      );
      if (!evidence) {
        return `No evidence card named "${args.join(' ') || '(missing clue)'}" is available in this mission. Use the clue ID shown on the investigation board.`;
      }
      setInspectedEvidence(previous => previous.includes(evidence.id) ? previous : [...previous, evidence.id]);
      return `[EVIDENCE CARD] ${evidence.label} (${evidence.id})\n${evidence.value}\n${evidence.detail}${evidence.command ? `\nSuggested tool: ${evidence.command}` : ''}\nThis is simulated case evidence.`;
    }
    if (name === 'pwd') return currentPath;
    if (name === 'whoami') return 'operator (simulated training account; no real system access)';
    if (name === 'ls') {
      const path = args.find(arg => !arg.startsWith('-'));
      const target = path ? (path.startsWith('/') ? path : `${currentPath.replace(/\/$/, '')}/${path}`) : currentPath;
      const files = MOCK_FILE_SYSTEM[target];
      return files?.length ? files.join('    ') : 'total 0';
    }
    if (name === 'cd') {
      const dest = args[0] ?? '/home/operator';
      const target = dest === '~' || dest === '~/' ? '/home/operator' : dest.startsWith('/') ? dest : `${currentPath.replace(/\/$/, '')}/${dest}`;
      return MOCK_FILE_SYSTEM[target] ? `Directory changed to ${target}` : `cd: ${dest}: No such directory in this simulation`;
    }
    if (name === 'cat') {
      const path = args[0] ?? '';
      if (activeMission.id === 'bridge-web-log' && path.endsWith('access.log')) return MOCK_FILES['/var/log/apache2/bridge-access.log'];
      if (path === '~/.ssh/authorized_keys' || path === '/home/operator/.ssh/authorized_keys') {
        return removedPersistence.includes('ssh-key')
          ? 'ssh-ed25519 AAAA... operator@workstation\nssh-ed25519 AAAA... backup-admin@secure-host'
          : 'ssh-ed25519 AAAA... operator@workstation\nssh-ed25519 AAAA... backup-admin@secure-host\nssh-rsa AAAA... unknown@external-host';
      }
      return fileAt(path) ?? `cat: ${path || 'missing file'}: No such file in this simulation`;
    }
    if (name === 'grep') {
      let insensitive = false;
      let numbered = false;
      let ipFilter = '';
      let after = '';
      let before = '';
      const positional: string[] = [];
      for (let i = 0; i < args.length; i += 1) {
        const arg = args[i];
        if (arg === '-i') insensitive = true;
        else if (arg === '-n') numbered = true;
        else if (arg === '--ip') ipFilter = args[++i] ?? '';
        else if (arg === '--after') after = args[++i] ?? '';
        else if (arg === '--before') before = args[++i] ?? '';
        else positional.push(arg);
      }
      const hasFilter = Boolean(ipFilter || after || before);
      const pattern = positional.length > 1 || !hasFilter ? positional[0] : '';
      const file = positional[positional.length - 1] ?? '';
      const contents = fileAt(file);
      if (!contents) return `grep: ${file || 'missing file'}: No such file in this simulation`;
      if (!pattern && !hasFilter) return 'Usage: grep [-i] [-n] [--ip ADDRESS] [--after HH:MM:SS] [--before HH:MM:SS] PATTERN FILE';
      const needle = insensitive ? pattern.toLowerCase() : pattern;
      const matches = contents.split('\n').map((row, index) => ({ row, index })).filter(({ row }) => {
        const value = insensitive ? row.toLowerCase() : row;
        const time = logTime(row);
        return (!needle || value.includes(needle)) && (!ipFilter || row.includes(ipFilter)) && (!after || (time && time >= after)) && (!before || (time && time <= before));
      });
      if (!matches.length) return `No matches in ${file} for the supplied pattern and filters.`;
      return matches.map(({ row, index }) => `${numbered ? `${index + 1}:` : ''}${row}`).join('\n');
    }
    if (name === 'journalctl') {
      const contents = MOCK_FILES['/var/log/syslog'] ?? '';
      const sinceIndex = args.indexOf('--since');
      const untilIndex = args.indexOf('--until');
      const since = sinceIndex >= 0 ? args[sinceIndex + 1] ?? '' : '';
      const until = untilIndex >= 0 ? args[untilIndex + 1] ?? '' : '';
      const sshOnly = args.includes('-u') && args[args.indexOf('-u') + 1] === 'ssh';
      const rows = contents.split('\n').filter(row => {
        const time = logTime(row);
        return (!sshOnly || /ssh/i.test(row)) && (!since || (time && time >= since)) && (!until || (time && time <= until));
      });
      return `${rows.join('\n') || 'No journal entries matched.'}\n\nTraining simulation: journalctl reads the provided sample service journal only.`;
    }
    if (name === 'status') {
      const hasUnexpectedListener = ['m5', 'm9'].includes(activeMission.id);
      const connectionRecord = activeMission.id === 'm5' ? '\nNETFLOW: TCP 4444 peer 198.51.100.23 observed at 10:14 · source not yet verified' : '';
      return `=== SIMULATED NETWORK STATUS ===\nHost: sandbox-server · 192.168.1.10\nSSH 22/tcp: listening\nHTTP 80/tcp: listening\n${hasUnexpectedListener ? `Unknown 4444/tcp: ${disabledService === '4444' ? 'disabled' : 'listening (not in baseline)'}\n` : ''}Source ${containedTarget || '198.51.100.23'}: ${containedTarget ? 'contained in this scenario' : 'under review'}${connectionRecord}\nNo real network was contacted.`;
    }
    if (name === 'ping') return `PING ${args[0] ?? '127.0.0.1'} (simulated)\n3 packets transmitted, 3 received, 0% packet loss\nTraining result only; this does not contact a real host.`;
    if (name === 'nmap') {
      const target = args[0] ?? 'localhost';
      const isLocal = target === 'localhost' || target === '127.0.0.1';
      return `Simulated scan report for ${target}\nPORT     STATE     SERVICE\n22/tcp   open      ssh${isLocal ? '\n80/tcp   open      http' : ''}${isLocal && ['m5', 'm9'].includes(activeMission.id) ? `\n4444/tcp ${disabledService === '4444' ? 'closed' : 'open'}      unknown${disabledService === '4444' ? ' (disabled in simulation)' : ''}` : ''}\nNo packets were sent to a real host.`;
    }
    if (name === 'ps') {
      if (args[0] === '-p' && args[1] === '3110') return 'PID 3110 · backup-user · /usr/bin/backup · RUNNING · scheduled maintenance job (simulated)';
      if (args[0] === '-p') return terminatedPids.includes(args[1] ?? '') ? `PID ${args[1]}: no such process (stopped in simulation)` : `PID ${args[1] ?? 'unknown'} · root · /tmp/.cache/cryptominer.exe · RUNNING (simulated)`;
      if (activeMission.id === 'bridge-process') return `USER       PID   %CPU  COMMAND\nroot         1    0.0   /sbin/init\nroot       842    0.1   /usr/sbin/sshd\nbackup-user 3110   87.4   /usr/bin/backup --nightly (approved schedule)\n${terminatedPids.includes('2214') ? '' : 'root      2214   18.2   /tmp/.cache/worker'}`;
      if (activeMission.id === 'm4') return `USER       PID   %CPU  COMMAND\nroot         1    0.0   /sbin/init\nbackup-user 3110   87.4   /usr/bin/backup --nightly (approved schedule)\n${terminatedPids.includes('2214') ? '' : 'root      2214   18.2   /tmp/.cache/cryptominer.exe'}`;
      const approvedBackup = activeMission.id === 'm9' ? 'backup-user 3110   87.4   /usr/bin/backup --nightly (approved schedule)\n' : '';
      return `USER       PID   %CPU  COMMAND\nroot         1    0.0   /sbin/init\nroot       842    0.1   /usr/sbin/sshd\nroot      1477    0.3   /usr/sbin/apache2\n${approvedBackup}${terminatedPids.includes('2214') ? '' : 'root      2214   18.2   /tmp/.cache/cryptominer.exe'}`;
    }
    if (name === 'ss' || name === 'netstat') {
      if (activeMission.id === 'bridge-listener') return 'State  Local Address:Port  Process\nLISTEN 0.0.0.0:22       sshd\nLISTEN 0.0.0.0:443      https\nLISTEN 0.0.0.0:9443     unknown\nAll entries are simulated.';
      return `State  Local Address:Port  Process\nLISTEN 0.0.0.0:22       sshd\nLISTEN 0.0.0.0:80       apache2\n${disabledService === '4444' ? '' : 'LISTEN 0.0.0.0:4444     unknown (not in approved baseline)'}\nAll entries are simulated.`;
    }
    if (name === 'find') {
      const targetIndex = args.indexOf('-name');
      const target = targetIndex >= 0 ? args[targetIndex + 1] : '';
      if (target === 'cryptominer.exe') return '/tmp/.cache/cryptominer.exe';
      if (target === 'update-check.sh') return '/tmp/update-check.sh';
      return `No matching simulated files found${target ? ` for ${target}` : ''}.`;
    }
    if (name === 'stat') {
      const path = args[0] ?? '';
      const metadata: Record<string, string> = {
        '/tmp/.cache/cryptominer.exe': 'File: /tmp/.cache/cryptominer.exe\nType: regular file · Owner: root · Mode: 0755\nModified: today 03:22 · Inventory: not approved\nMetadata is simulated; verify execution separately.',
        '/tmp/update-check.sh': 'File: /tmp/update-check.sh\nType: regular file · Owner: unknown · Mode: 0644\nModified: today 09:11 · Inventory: no approved owner listed',
        '/opt/maintenance/backup.sh': 'File: /opt/maintenance/backup.sh\nType: regular file · Owner: administrator · Mode: 0750\nModified: 3 days ago · Inventory: approved maintenance script'
      };
      return metadata[resolveFile(path)] ?? metadata[path] ?? `stat: no metadata available for ${path} in this simulation`;
    }
    if (name === 'preserve') {
      const evidence = args.join(' ') || 'current investigation output';
      recordEvidenceNote(evidence);
      return `[EVIDENCE SAVED] ${evidence}\nA simulated read-only case note was recorded before response. Original source logs remain unchanged.`;
    }
    if (name === 'record-evidence') {
      const evidence = args.join(' ');
      if (!evidence) return 'Usage: record-evidence [source] [observed fact]';
      recordEvidenceNote(evidence);
      return `[CASE NOTE ${evidenceNotes.length + 1}] Observation recorded: ${evidence}\nKeep observations factual; put explanations in your assessment.`;
    }
    if (name === 'assess') {
      const confidence = args[0]?.toLowerCase();
      if (!confidence || !['low', 'medium', 'high'].includes(confidence)) return 'Usage: assess [low|medium|high] [supported finding]';
      onCaseConfidenceChange(confidence);
      const notes = evidenceNotes.length ? evidenceNotes.map((note, index) => `  ${index + 1}. ${note}`).join('\n') : '  No evidence notes recorded.';
      return `Assessment recorded · Confidence: ${confidence.toUpperCase()}\nFinding: ${args.slice(1).join(' ') || 'no finding supplied'}\nEvidence notes (${evidenceNotes.length}):\n${notes}\nConfidence describes support for this conclusion, not certainty about identity or intent.`;
    }
    if (name === 'block') return currentStep?.cmd.toLowerCase() === line.trim().toLowerCase() ? `[FIREWALL SIMULATION] ${args[0] ?? '(missing address)'} marked contained.\nThe training map will show the change; no firewall rule was applied to a real network.` : '[ACTION NOT APPLIED] Blocking is not the current authorized mission step. Collect and assess evidence first.';
    if (name === 'disable-service') return currentStep?.cmd.toLowerCase() === line.trim().toLowerCase() && args[0] === '4444' ? '[SERVICE SIMULATION] TCP 4444 listener disabled. Verify with ss -tuln. No real service was changed.' : `[ACTION NOT APPLIED] Port ${args[0] ?? '(missing port)'} is not the current authorized response step.`;
    if (name === 'kill') {
      const pid = args[0] ?? '';
      const isApprovedStep = currentStep?.cmd.toLowerCase() === line.trim().toLowerCase();
      if (pid === '3110' && ['m4', 'm9', 'bridge-process'].includes(activeMission.id)) return '[ACTION NOT APPLIED] PID 3110 is the approved scheduled backup in this scenario. High CPU alone does not justify stopping it.';
      if (!isApprovedStep) return '[ACTION NOT APPLIED] Inspect and preserve evidence before stopping a process.';
      if (pid === '2214') setTerminatedPids(previous => previous.includes(pid) ? previous : [...previous, pid]);
      return `PID ${pid || '(missing PID)'} ${pid === '2214' ? 'stopped in the training simulation' : 'is not a target in this scenario'}. Verify with ps -p ${pid || '[PID]'}. No real process was stopped.`;
    }
    if (name === 'crontab') return `# Simulated scheduled tasks\n# Approved system maintenance\n0 * * * * /usr/bin/logrotate\n# Approved nightly backup\n30 2 * * * /usr/bin/backup-system\n${removedPersistence.includes('cron') ? '' : '# Not in the approved task baseline\n*/5 * * * * /tmp/.cache/update.sh\n'}${removedPersistence.includes('cron') ? 'The suspicious temporary-directory task is no longer listed.' : 'The temporary-directory script is not in the approved baseline.'}`;
    if (name === 'remove-persistence') return currentStep?.cmd.toLowerCase() === line.trim().toLowerCase() ? `[PERSISTENCE SIMULATION] ${args[0] ?? '(missing mechanism)'} removed from the case model.\nVerify by reviewing the scheduled task or authorized-key list. No real account or system file was changed.` : '[ACTION NOT APPLIED] Preserve and review evidence before removing a persistence mechanism.';
    if (name === 'report') return `Case finding recorded: ${args.join(' ') || '(empty)'}\nUse observed facts and avoid claiming an impact the records do not establish.`;
    if (name === 'clear') { setHistory([]); return ''; }
    return `This training terminal does not implement "${name}". Type help to see available simulated commands.`;
  };

  const commandLessons: Record<string, string> = {
    pwd: 'pwd prints the current working directory; confirm where you are before using a relative file path.',
    ls: 'ls lists files in the simulated directory; identify candidate evidence before opening it.',
    cd: 'cd changes your location in the simulated filesystem; absolute paths start at / and ~ means your operator home.',
    cat: 'cat displays a complete simulated text file. Read surrounding entries so a single line is not taken out of context.',
    grep: 'grep filters file lines by pattern. -i ignores letter case, -n shows line numbers, and --ip/--after/--before narrow results; filters can hide relevant evidence.',
    whoami: 'whoami identifies the current simulated account; account context helps explain what actions are available.',
    status: 'status summarizes the simulated host and network state; compare it with the mission baseline.',
    ping: 'ping tests simulated reachability. A response shows availability, not trust or malicious intent.',
    nmap: 'nmap displays a simulated port and service inventory. Scan only systems you are authorized to assess in real work.',
    ps: 'ps lists simulated processes. Name, path, owner, parent, and behavior matter; CPU use alone does not prove malware.',
    netstat: 'netstat lists simulated listeners and connections. Compare them with the approved service baseline.',
    ss: 'ss inspects simulated sockets; listening means a service is waiting for connections, not that it has been compromised.',
    journalctl: 'journalctl shows this case’s simulated service journal. Use a time window or service filter, and account for clock differences.',
    find: 'find locates matching simulated files. A file’s location or name is a lead; check owner, metadata, and execution evidence.',
    stat: 'stat shows simulated file metadata such as owner, mode, and modification time; metadata alone does not prove execution.',
    preserve: 'preserve records a simulated case note before response. Real investigations preserve original evidence and record handling.',
    'record-evidence': 'record-evidence stores an observation and its source separately from your explanation.',
    assess: 'assess records a low, medium, or high confidence estimate. Confidence should reflect evidence quality and gaps, not certainty.',
    block: 'block simulates a scoped containment action against one address. Verify the resulting state; this does not change a real firewall.',
    'disable-service': 'disable-service simulates disabling one unapproved listener. Confirm the baseline first, then verify the port is gone.',
    kill: 'kill simulates stopping one process. Preserve relevant evidence and confirm the process has stopped afterward.',
    report: 'report records a concise finding. Separate observed facts from inference, and do not overstate impact or attribution.'
  };

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

      const output = simulateCommand(trimmed);
      if (output) {
        setHistory(prev => [...prev, output]);
      }

      const commandName = splitTerminalArgs(trimmed)[0]?.toLowerCase() ?? '';
      if (['m1', 'm4', 'm7'].includes(activeMission.id) && commandLessons[commandName]) {
        setHistory(prev => [...prev, `[COMMAND GUIDE] ${commandLessons[commandName]}`]);
      }

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
        const command = currentStep.cmd.split(' ')[0];
        const firstHint: Record<string, string> = {
          pwd: 'Orient yourself first: confirm the directory where the terminal is operating.',
          ls: 'Inspect the available files or folders before choosing what to open.',
          cd: 'Move to the directory that contains the evidence described in the objective.',
          cat: 'Read the named file and compare its entries for relevant details.',
          grep: 'Search the file for a pattern that would identify the evidence you need.',
          status: 'Review the active connections and security state, then compare them with the scenario.',
          ping: 'This checks reachability; a response alone does not establish intent.',
          nmap: 'Compare the discovered ports and services with what the scenario says is expected.',
          ps: 'Inspect the process list and use the PID or executable path as context.',
          netstat: 'Compare listening services against the expected service baseline.',
          crontab: 'Review scheduled commands and look for unexpected paths or timing.',
          find: 'Search by the suspicious filename mentioned in the evidence.',
          kill: 'Only stop the process after reviewing its details and preserving relevant evidence.',
          block: 'Contain only the source address supported by the evidence.',
          report: 'State the narrowest conclusion supported by the evidence; distinguish an attempt from a confirmed impact.',
          'disable-service': 'Use the baseline to confirm the listener is not expected before disabling it.',
          journalctl: 'Use the service journal to review events in context; timestamps may differ between systems.',
          ss: 'Inspect simulated listening sockets and compare them with the expected service baseline.',
          stat: 'Check simulated file ownership, permissions, and modification time; these are clues, not proof.',
          preserve: 'Save the relevant evidence as a case note before changing the simulated system.',
          'record-evidence': 'Write down a source and an observable fact before adding your interpretation.',
          assess: 'Choose confidence based on evidence quality and gaps; avoid claiming certainty about identity.'
        };
        const authoredHints = Array.isArray(currentStep.hint) ? currentStep.hint : [currentStep.hint];
        const conceptNudge = firstHint[command] ?? 'Start with the evidence the objective asks you to compare, then decide what it supports.';
        const commandFamily = command === 'grep' ? 'grep' : command;
        const hints = activeMission.difficulty === 'guided'
          ? [conceptNudge, ...authoredHints]
          : activeMission.difficulty === 'standard'
            ? [conceptNudge, `Command family: ${commandFamily}. Check the field guide for its purpose and limits.`, `Suggested format: ${currentStep.cmd}`]
            : [conceptNudge, `Use the ${commandFamily} command family to examine the evidence.`, `Command: ${commandFamily}. Choose the target and details from the evidence you collected.`];
        setHintText(
          hints
        );

        onHintLevelShown(1);

        setShowHint(
          true
        );
      }
    };

  return (
    <div className="mx-auto min-h-[calc(100dvh-4rem)] w-full max-w-[1680px] space-y-3 px-3 py-3 sm:px-5 lg:px-8 lg:py-5">

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

            <div className="text-xs text-green-500/50" aria-live="polite">
              {questStep >= activeMission.steps.length
                ? 'ALL OBJECTIVES COMPLETE'
                : `OBJECTIVE ${questStep + 1} / ${activeMission.steps.length}`}
            </div>

            <div
              className={`flex items-center gap-2 text-sm font-mono ${
                isThreatActive && timeLeft <= 30
                  ? 'text-red-400'
                  : 'text-green-400'
              }`}
            >

              <Clock size={16} />

              {isThreatActive
                ? `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`
                : 'UNTIMED PRACTICE'}

            </div>

          </div>

        </div>

      </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,390px)] 2xl:gap-5">

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

          <div className="h-[calc(100dvh-260px)] min-h-[320px] max-h-[900px] overflow-y-auto p-4 font-mono text-sm lg:p-5">

            {history.map(
              (
                line,
                index
              ) => (
                <div
                  key={`${line}-${index}`}
                  className="whitespace-pre-wrap break-words text-green-400/80 leading-6"
                >
                  {line.startsWith('operator@secure:') ? line : <TypewriterText text={line || '\u00A0'} />}
                </div>
              )
            )}

            {msg && (
              <div className="mt-2 text-green-300 whitespace-pre-wrap">
                <TypewriterText key={sysNonce} text={msg} />
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
                aria-label="Enter a simulated terminal command"
                placeholder="type a command…"
                className="min-w-0 flex-1 bg-transparent outline-none text-green-300 placeholder:text-green-900"
                autoFocus
              />

              <button
                type="button"
                onClick={executeCommand}
                className="ml-3 border border-green-800 px-3 py-1 text-[10px] font-bold text-green-400 hover:border-green-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
              >
                RUN
              </button>

            </div>

          </div>

        </div>

        <div className="space-y-3 xl:max-h-[calc(100dvh-6.5rem)] xl:overflow-y-auto xl:pr-1">

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

            <div className="mt-4 h-1.5 overflow-hidden bg-green-950" role="progressbar" aria-label="Mission progress" aria-valuemin={0} aria-valuemax={activeMission.steps.length} aria-valuenow={questStep}>
              <div className="h-full bg-green-500 transition-all" style={{ width: `${Math.min(100, (questStep / activeMission.steps.length) * 100)}%` }} />
            </div>
            <p className="mt-2 text-[10px] text-green-600">{questStep} of {activeMission.steps.length} objectives complete</p>
            {currentStep?.requiredCommands && <div className="mt-3 border-t border-green-900/60 pt-3">
              <p className="text-[9px] uppercase tracking-widest text-cyan-500">Run these checks in any order</p>
              <ul className="mt-2 space-y-1 font-mono text-[10px] text-cyan-200">{currentStep.requiredCommands.map(check => <li key={check}>› {check}</li>)}</ul>
            </div>}

          </div>

          {currentStep?.decision && <div className="border border-cyan-700/40 bg-[#071014] p-4" aria-label="Evidence based decision">
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Evidence decision</p>
            <p className="mt-2 text-sm leading-5 text-gray-200">{currentStep.decision.prompt}</p>
            <div className="mt-3 space-y-2">
              {currentStep.decision.choices.map(choice => <button
                key={choice.id}
                type="button"
                onClick={() => {
                  const commandLine = `choose ${choice.id}`;
                  setHistory(previous => [...previous, `operator@secure:${currentPath}$ ${commandLine}`]);
                  playSound('keystroke');
                  handleCommand(commandLine);
                }}
                className="w-full border border-cyan-900/70 bg-black px-3 py-2 text-left text-xs leading-5 text-cyan-100 hover:border-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >{choice.label}</button>)}
            </div>
          </div>}

          {activeMission.evidence && activeMission.evidence.length > 0 && (
            <div className="border border-blue-500/20 bg-[#071014] p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="text-xs text-blue-300 tracking-widest">INVESTIGATION BOARD</div>
                <span className="text-[10px] text-blue-700">Select a clue to inspect</span>
              </div>
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {activeMission.evidence.map(item => {
                  const inspected = inspectedEvidence.includes(item.id);
                  const isObjective = currentStep?.inspectEvidenceId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => inspectEvidence(item.id)}
                      aria-expanded={inspected}
                      className={`w-full border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${isObjective ? 'border-yellow-500/60 bg-yellow-950/10' : inspected ? 'border-blue-500/40 bg-blue-950/10' : 'border-green-900/70 bg-black hover:border-blue-500/40'}`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-[9px] uppercase tracking-widest text-blue-500">{item.kind}{isObjective ? ' · CURRENT CLUE' : ''}</span>
                        <span className="text-[9px] text-green-700">{inspected ? 'INSPECTED' : 'SELECT'}</span>
                      </span>
                      <span className="mt-1 block text-xs font-bold text-green-300">{item.label}</span>
                      <span className="mt-1 block break-all font-mono text-[10px] text-green-600">{item.value}</span>
                      {inspected && <span className="mt-2 block border-t border-green-900/60 pt-2 text-[11px] leading-5 text-gray-300">{item.detail}</span>}
                      {item.command && <span className="mt-2 block text-[9px] text-blue-700">TOOL: {item.command}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border border-green-500/20 bg-[#08100c] p-5">

            <div className="text-xs text-green-500/40 tracking-widest mb-3">
              {activeMission.difficulty === 'guided' ? 'COMMAND GUIDE' : 'COMMAND TOOLBOX'}
            </div>

            <div className="border border-green-500/10 bg-black p-3 font-mono text-xs text-green-400 break-all">
              {currentStep
                ? currentStep.inspectEvidenceId
                  ? `Select “${activeMission.evidence?.find(item => item.id === currentStep.inspectEvidenceId)?.label ?? 'the highlighted clue'}” on the investigation board.`
                  : activeMission.difficulty === 'guided'
                  ? currentStep.cmd
                  : 'Choose a command that supports the objective. Type help for available tools.'
                : 'MISSION COMPLETE'}
            </div>

          </div>

          <div className={`grid ${isCertificationMission ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-2`}>

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

            <button
              onClick={showCommandHelp}
              className="border border-green-500/20 bg-[#08100c] p-3 text-xs text-green-400 hover:border-green-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
            >
              <BookOpen size={16} className="mx-auto mb-1" />
              HELP
            </button>

            {isCertificationMission && <button
              onClick={() => setShowCommandGuide(true)}
              className="border border-cyan-500/70 bg-cyan-950/30 p-3 text-xs font-bold text-cyan-200 transition-colors hover:border-cyan-300 hover:bg-cyan-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <BookOpen size={16} className="mx-auto mb-1" />
              COMMAND GUIDE · RECOMMENDED
            </button>}

            {isCertificationMission && <button
              onClick={onShowMissionGuide}
              className="border border-cyan-700/50 bg-[#071014] p-3 text-xs text-cyan-300 hover:border-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <HelpCircle size={16} className="mx-auto mb-1" />
              SCREEN GUIDE
            </button>}

            {activeMission.primer && <button
              onClick={() => setShowMissionPrimer(true)}
              className="border border-cyan-700/50 bg-[#071014] p-3 text-xs text-cyan-300 hover:border-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <BookOpen size={16} className="mx-auto mb-1" />
              GLOSSARY
            </button>}

          </div>

          {isCertificationMission && <p className="border-l-2 border-cyan-700 bg-cyan-950/10 px-3 py-2 text-[11px] leading-5 text-cyan-200">
            Suggested workflow: read the objective, check the Command Guide for a suitable tool, then use a hint if you still need a clue.
          </p>}

          <div className="border border-green-500/20 bg-[#08100c] p-4">

            <div className="text-[10px] text-green-500/30 tracking-widest mb-3">
              SYSTEM STATUS
            </div>

            <div className="space-y-2 text-xs">

              <div className="flex justify-between">

                <span className="text-green-500/40">
                  TIMER STATUS
                </span>

                <span
                  className={
                    isThreatActive
                      ? 'text-red-400'
                      : 'text-green-400'
                  }
                >
                  {isThreatActive
                    ? 'RUNNING'
                    : 'UNTIMED'}
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

      {showCommandGuide && <CommandFieldGuide tier={activeMission.tier} onClose={() => setShowCommandGuide(false)} />}

      {showMissionPrimer && activeMission.primer && <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/85 p-4" role="dialog" aria-modal="true" aria-labelledby="mission-primer-title" onClick={() => setShowMissionPrimer(false)}>
        <section className="w-full max-w-xl border border-cyan-700 bg-[#050a08] p-5 shadow-[0_0_35px_rgba(34,211,238,0.15)]" onClick={event => event.stopPropagation()}>
          <p className="text-[10px] uppercase tracking-widest text-cyan-600">Mission glossary</p>
          <h2 id="mission-primer-title" className="mt-1 text-xl font-bold text-cyan-200">{activeMission.briefing.concept}</h2>
          <p className="mt-4 text-sm leading-6 text-gray-200">{activeMission.primer.definition}</p>
          <p className="mt-3 text-xs leading-5 text-cyan-200"><strong>Analogy:</strong> {activeMission.primer.analogy}</p>
          {activeMission.primer.example && <pre className="mt-3 whitespace-pre-wrap border-l-2 border-cyan-700 bg-black/50 p-3 font-mono text-xs leading-5 text-green-200">{activeMission.primer.example}</pre>}
          <button onClick={() => setShowMissionPrimer(false)} className="mt-4 w-full border border-cyan-700 px-4 py-2 text-xs font-bold uppercase text-cyan-300 hover:bg-cyan-950/30">Return to mission</button>
        </section>
      </div>}

    </div>
  );
};

interface ProfileScreenProps {
  user: FirebaseUser | null;

  userScores: Record<
    string,
    TierScoreLike
  >;

}

export const ProfileScreen = ({
  user,
  userScores
}: ProfileScreenProps) => {
  const [exportMessage, setExportMessage] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(user?.photoURL ?? null);
  const [photoMessage, setPhotoMessage] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (file?: File) => {
    if (!user || !file) return;
    setUploadingPhoto(true);
    setPhotoMessage('');
    try {
      const url = await uploadUserAvatar(user, file);
      setProfilePhoto(url);
      setPhotoMessage('Profile picture updated.');
    } catch (error) {
      console.error('Could not upload profile image:', error);
      setPhotoMessage(error instanceof Error ? error.message : 'Upload failed. Check Firebase Storage access.');
    } finally {
      setUploadingPhoto(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };
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

  const exportLearningData = async () => {
    if (!user) return;
    try {
      const [attempts, assessmentAttempts] = await Promise.all([getMissionAttempts(user.uid), getAssessmentAttempts(user.uid)]);
      if (!attempts.length && !assessmentAttempts.length) {
        setExportMessage('No mission or assessment attempt records are available yet.');
        return;
      }
      const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const downloadCsv = (filename: string, content: string) => {
        const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      };
      if (attempts.length) {
        const headers = ['missionId', 'missionTitle', 'tier', 'concept', 'outcome', 'startedAt', 'completedAt', 'totalTimeSeconds', 'hintsOpened', 'hintLevelsShown', 'timePerStepSeconds', 'wrongCommandsByStep', 'wrongDecisionCount'];
        const rows = attempts.map(attempt => headers.map(header => escapeCsv(typeof attempt[header as keyof typeof attempt] === 'object' ? JSON.stringify(attempt[header as keyof typeof attempt]) : attempt[header as keyof typeof attempt])).join(','));
        const groups = new Map<string, { missionTitle: string; tier: string; concept: string; attempts: number; completed: number; totalSeconds: number; hints: number; wrongCommands: number; wrongDecisions: number }>();
        attempts.forEach(attempt => {
          const summary = groups.get(attempt.missionId) ?? { missionTitle: attempt.missionTitle, tier: attempt.tier, concept: attempt.concept, attempts: 0, completed: 0, totalSeconds: 0, hints: 0, wrongCommands: 0, wrongDecisions: 0 };
          summary.attempts += 1;
          summary.completed += attempt.outcome === 'completed' ? 1 : 0;
          summary.totalSeconds += attempt.totalTimeSeconds;
          summary.hints += attempt.hintsOpened;
          summary.wrongCommands += Object.values(attempt.wrongCommandsByStep).reduce((sum, count) => sum + count, 0);
          summary.wrongDecisions += attempt.wrongDecisionCount;
          groups.set(attempt.missionId, summary);
        });
        const summaryHeaders = ['missionId', 'missionTitle', 'tier', 'concept', 'attemptCount', 'completionRatePercent', 'averageTimeSeconds', 'averageHintsOpened', 'averageWrongCommands', 'averageWrongDecisions'];
        const summaryRows = [...groups.entries()].map(([missionId, summary]) => [missionId, summary.missionTitle, summary.tier, summary.concept, summary.attempts, Math.round((summary.completed / summary.attempts) * 100), Math.round(summary.totalSeconds / summary.attempts), Number((summary.hints / summary.attempts).toFixed(2)), Number((summary.wrongCommands / summary.attempts).toFixed(2)), Number((summary.wrongDecisions / summary.attempts).toFixed(2))].map(escapeCsv).join(','));
        downloadCsv('sandbox-secure-mission-summary.csv', [summaryHeaders.join(','), ...summaryRows].join('\r\n'));
        downloadCsv('sandbox-secure-mission-attempts.csv', [headers.join(','), ...rows].join('\r\n'));
      }
      if (assessmentAttempts.length) {
        const headers = ['tier', 'assessment', 'score', 'total', 'attemptNumber', 'timestamp'];
        const rows = assessmentAttempts.map(attempt => headers.map(header => escapeCsv(attempt[header as keyof typeof attempt])).join(','));
        const groups = new Map<string, { count: number; scoreSum: number; totalSum: number; firstScore: number | null; bestScore: number }>();
        assessmentAttempts.forEach(attempt => {
          const key = `${attempt.tier}-${attempt.assessment}`;
          const summary = groups.get(key) ?? { count: 0, scoreSum: 0, totalSum: 0, firstScore: null, bestScore: 0 };
          summary.count += 1;
          summary.scoreSum += attempt.score;
          summary.totalSum += attempt.total;
          if (attempt.attemptNumber === 1) summary.firstScore = attempt.score;
          summary.bestScore = Math.max(summary.bestScore, attempt.score);
          groups.set(key, summary);
        });
        const summaryHeaders = ['tier', 'assessment', 'attemptCount', 'firstAttemptScore', 'bestScore', 'averagePercent'];
        const summaryRows = [...groups.entries()].map(([key, summary]) => {
          const [tier, assessment] = key.split('-');
          const averagePercent = summary.totalSum ? Math.round((summary.scoreSum / summary.totalSum) * 100) : 0;
          return [tier, assessment, summary.count, summary.firstScore, summary.bestScore, averagePercent].map(escapeCsv).join(',');
        });
        downloadCsv('sandbox-secure-assessment-summary.csv', [summaryHeaders.join(','), ...summaryRows].join('\r\n'));
        downloadCsv('sandbox-secure-assessment-attempts.csv', [headers.join(','), ...rows].join('\r\n'));
      }
      setExportMessage(`Exported ${attempts.length} mission and ${assessmentAttempts.length} assessment attempts for this account.`);
    } catch (error) {
      console.error('Could not export mission data:', error);
      setExportMessage('Export failed. Check Firestore access and try again.');
    }
  };

  return (
    <div className="mx-auto min-h-full w-full max-w-[1480px] space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">

      <section className="border border-green-500/20 bg-[#08100c] p-6">

        <div className="flex flex-col md:flex-row items-center md:items-start gap-5">

          <div className="flex flex-col items-center gap-2">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-green-500/30 bg-black">
              {profilePhoto ? <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" /> : <User size={34} className="text-green-400" />}
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" className="sr-only" onChange={event => void handleAvatarUpload(event.target.files?.[0])} />
            <button type="button" disabled={!user || uploadingPhoto} onClick={() => avatarInputRef.current?.click()} className="inline-flex items-center gap-1 border border-cyan-800 px-2 py-1 text-[10px] font-bold uppercase text-cyan-300 hover:border-cyan-400 disabled:opacity-50"><Upload size={12} />{uploadingPhoto ? 'Uploading…' : 'Upload photo'}</button>
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
        {photoMessage && <p className="mt-3 text-center text-xs text-cyan-200 md:text-left" role="status">{photoMessage}</p>}

      </section>

      <section className="flex flex-col gap-3 border border-cyan-900/60 bg-[#071014] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Learning data</p><p className="mt-1 text-xs text-gray-400">Download mission and assessment summaries plus detailed attempt rows for this account as CSV.</p>{exportMessage && <p className="mt-2 text-xs text-cyan-200" role="status">{exportMessage}</p>}</div>
        <button type="button" onClick={exportLearningData} className="border border-cyan-700 px-4 py-2 text-xs font-bold uppercase text-cyan-300 hover:border-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">Export my learning data</button>
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

    </div>
  );
};
