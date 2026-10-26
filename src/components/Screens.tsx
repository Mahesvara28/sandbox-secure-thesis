import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { User as FirebaseUser } from 'firebase/auth';
import logoImage from '../assets/logo.jpg';
import { getMissionAttempts, getAssessmentAttempts, getDailyTimeAttackEntries, saveProgression } from '../Firebase';
import type { LeaderboardEntry, MissionAttemptRecord } from '../Firebase';
import { AVATARS, getAvatarById, type AvatarId } from '../data/avatars';
import { Avatar } from './Avatar';
import { ACHIEVEMENTS } from '../data/achievements';
import { applyCertificationRewards, rankProgress, type PlayerProgression, getTierLearningGain } from '../data/progression';
import { AchievementBadge, GameCard, ProgressBar, SectionHeader } from './GameUI';

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
} from 'lucide-react';

import type {
  Tier,
  Mission
} from '../data/gameData';

import {
  MISSIONS,
  BRIDGE_MISSIONS,
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
  preTestFirstScore?: number;
  preTestFirstTotal?: number;
  finalScore?: number;
  finalTotal?: number;
  firstFinalScore?: number;
  firstFinalTotal?: number;
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
  const fieldClass = 'min-h-12 w-full rounded-lg border border-[var(--game-border)] bg-[var(--game-page)] px-4 py-3 text-[var(--game-text)] outline-none transition placeholder:text-[var(--game-muted)]/70 focus:border-[var(--game-green)] focus:ring-2 focus:ring-[var(--game-green)]/20';
  const activeTabClass = 'min-h-11 flex-1 rounded-md bg-[var(--game-surface-raised)] px-3 text-sm font-semibold text-[var(--game-text)] shadow-sm';
  const inactiveTabClass = 'min-h-11 flex-1 rounded-md px-3 text-sm font-medium text-[var(--game-muted)] transition hover:text-[var(--game-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-green)]';

  return (
    <div className="app-atmosphere flex min-h-screen items-center justify-center bg-[var(--game-page)] p-3 text-[var(--game-text)] sm:p-6">
      <main className="game-card grid w-full max-w-5xl overflow-hidden rounded-2xl shadow-[var(--game-shadow)] md:min-h-[620px] md:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-center border-b border-[var(--game-border)] bg-[var(--game-surface-raised)] p-5 sm:p-8 md:border-b-0 md:border-r md:p-10" aria-labelledby="auth-brand-title">
          <div className="mx-auto w-full max-w-xl">
            <div className="overflow-hidden rounded-xl border border-[var(--game-border)] bg-[#050907] shadow-lg">
              {logoLoaded ? <img src={logoImage} alt="Sandbox Secure cybersecurity training" onError={() => setLogoLoaded(false)} className="block h-auto w-full object-contain" /> : <div className="flex aspect-video items-center justify-center text-[var(--game-green)]"><Shield size={64} aria-hidden="true" /></div>}
            </div>
            <div className="mt-6">
              <p className="game-eyebrow">Cybersecurity training simulation</p>
              <h1 id="auth-brand-title" className="mt-2 text-2xl font-bold leading-tight text-[var(--game-text)] sm:text-3xl">Learn security by doing.</h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--game-muted)]">Build confidence through guided investigations, simulated tools, and clear explanations of each decision.</p>
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
              {[['01', 'Learn the tools'], ['02', 'Investigate evidence'], ['03', 'Explain your findings']].map(([number, label]) => <div key={number} className="flex items-center gap-3 rounded-lg border border-[var(--game-border)] bg-[var(--game-surface)]/70 px-3 py-3"><span className="font-mono text-xs font-bold text-[var(--game-green)]">{number}</span><span className="text-xs font-medium text-[var(--game-text)]">{label}</span></div>)}
            </div>
          </div>
        </section>

        <section className="flex flex-col justify-center p-5 sm:p-8 md:p-10" aria-labelledby="auth-form-title">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div><p className="game-eyebrow">Operator access</p><h2 id="auth-form-title" className="mt-1 text-xl font-bold text-[var(--game-text)]">{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h2></div>
            <button type="button" onClick={onToggleTheme} className="min-h-11 rounded-lg border border-[var(--game-border)] px-3 py-2 text-xs font-semibold text-[var(--game-text)] transition hover:bg-[var(--game-track)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-green)]" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
          </div>

          <div role="tablist" aria-label="Account access options" onKeyDown={event => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
            event.preventDefault();
            const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
            const currentIndex = tabs.indexOf(document.activeElement as HTMLButtonElement);
            const nextIndex = (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
            tabs[nextIndex]?.focus();
            tabs[nextIndex]?.click();
          }} className="mb-6 flex gap-1 rounded-lg border border-[var(--game-border)] bg-[var(--game-page)] p-1">
            <button id="auth-tab-login" type="button" role="tab" tabIndex={authMode === 'login' ? 0 : -1} aria-selected={authMode === 'login'} aria-controls="auth-form-panel" onClick={() => setAuthMode('login')} className={authMode === 'login' ? activeTabClass : inactiveTabClass}>Sign in</button>
            <button id="auth-tab-register" type="button" role="tab" tabIndex={authMode === 'register' ? 0 : -1} aria-selected={authMode === 'register'} aria-controls="auth-form-panel" onClick={() => setAuthMode('register')} className={authMode === 'register' ? activeTabClass : inactiveTabClass}>Create account</button>
          </div>

          <div id="auth-form-panel" role="tabpanel" aria-labelledby={authMode === 'login' ? 'auth-tab-login' : 'auth-tab-register'}>
            {authMode === 'login' ? <form className="space-y-4" onSubmit={event => { event.preventDefault(); void handleLogin(); }}>
              <div><label htmlFor="login-email" className="mb-2 block text-sm font-medium text-[var(--game-text)]">Email address</label><input id="login-email" name="email" autoComplete="email" required type="email" value={regEmail} onChange={event => setRegEmail(event.target.value)} className={fieldClass} placeholder="operator@example.com" /></div>
              <div><label htmlFor="login-password" className="mb-2 block text-sm font-medium text-[var(--game-text)]">Password</label><div className="relative"><input id="login-password" name="password" autoComplete="current-password" required value={regPassword} onChange={event => setRegPassword(event.target.value)} type={showPassword ? 'text' : 'password'} className={`${fieldClass} pr-12`} placeholder="Enter your password" /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className="absolute inset-y-1 right-1 inline-flex w-10 items-center justify-center rounded-md text-[var(--game-muted)] transition hover:text-[var(--game-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-green)]">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
              <button type="submit" className="min-h-12 w-full rounded-lg bg-[var(--game-green)] px-4 py-3 font-bold text-black shadow-sm transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-green)] focus-visible:ring-offset-2">Sign in</button>
              <div className="flex items-center gap-3 py-1" aria-hidden="true"><span className="h-px flex-1 bg-[var(--game-border)]" /><span className="text-xs text-[var(--game-muted)]">or</span><span className="h-px flex-1 bg-[var(--game-border)]" /></div>
              <button type="button" onClick={() => void handleGoogleLogin()} className="min-h-12 w-full rounded-lg border border-[var(--game-border)] px-4 py-3 text-sm font-semibold text-[var(--game-text)] transition hover:border-[var(--game-cyan)] hover:bg-[var(--game-track)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">Continue with Google</button>
            </form> : <form className="space-y-4" onSubmit={event => { event.preventDefault(); void handleRegister(); }}>
              <div><label htmlFor="register-name" className="mb-2 block text-sm font-medium text-[var(--game-text)]">Operator name</label><input id="register-name" name="name" autoComplete="nickname" required value={regUsername} onChange={event => setRegUsername(event.target.value)} className={fieldClass} placeholder="Choose a display name" /></div>
              <div><label htmlFor="register-email" className="mb-2 block text-sm font-medium text-[var(--game-text)]">Email address</label><input id="register-email" name="email" autoComplete="email" required type="email" value={regEmail} onChange={event => setRegEmail(event.target.value)} className={fieldClass} placeholder="operator@example.com" /></div>
              <div><label htmlFor="register-password" className="mb-2 block text-sm font-medium text-[var(--game-text)]">Password</label><div className="relative"><input id="register-password" name="new-password" autoComplete="new-password" required minLength={6} value={regPassword} onChange={event => setRegPassword(event.target.value)} type={showPassword ? 'text' : 'password'} className={`${fieldClass} pr-12`} placeholder="At least 6 characters" /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className="absolute inset-y-1 right-1 inline-flex w-10 items-center justify-center rounded-md text-[var(--game-muted)] transition hover:text-[var(--game-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-green)]">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
              <button type="submit" className="min-h-12 w-full rounded-lg bg-[var(--game-green)] px-4 py-3 font-bold text-black shadow-sm transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-green)] focus-visible:ring-offset-2">Create account</button>
            </form>}
          </div>

          {authError && <div className="mt-5 rounded-lg border border-[var(--game-red)]/40 bg-[var(--game-red)]/10 p-3 text-sm text-[var(--game-red)]" role="alert">{authError}</div>}
          {authSuccess && <div className="mt-5 rounded-lg border border-[var(--game-green)]/40 bg-[var(--game-green)]/10 p-3 text-sm text-[var(--game-text)]" role="status">Account created successfully.</div>}
          <p className="mt-6 border-t border-[var(--game-border)] pt-4 text-center text-xs leading-5 text-[var(--game-muted)]">Authorized training environment · Commands are simulated for learning.</p>
        </section>
      </main>
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
  onContinue: () => void;
  onStartDailyTrial: (type: 'timeAttack' | 'accuracy') => void;
  dailyTimeAttackPlayed: boolean;
  dailyAccuracyPlayed: boolean;
  dailyTrialDate: string;
  dailyTimeAttackMissionTitle: string;
  dailyAccuracyMissionTitle: string;
  progression: PlayerProgression;
  isLoadingProgress: boolean;
  onProgressionChange: (progression: PlayerProgression) => void;
  completedMissions: string[];
  progressLoadFailed?: boolean;
}

export const DashboardScreen = ({
  user,
  userScores,
  setScreen,
  onShowGuide,
  onContinue,
  onStartDailyTrial,
  dailyTimeAttackPlayed,
  dailyAccuracyPlayed,
  dailyTrialDate,
  dailyTimeAttackMissionTitle,
  dailyAccuracyMissionTitle,
  progression,
  isLoadingProgress,
  onProgressionChange,
  completedMissions,
  progressLoadFailed = false
}: DashboardScreenProps) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardUnavailable, setLeaderboardUnavailable] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [activeMoreTab, setActiveMoreTab] = useState<'progress' | 'badges' | 'leaderboard' | null>(null);
  const reduceMotion = useReducedMotion();
  const userId = user?.uid;

  const rank = rankProgress(progression.xp);
  const currentTier = (['BEGINNER', 'INTERMEDIATE', 'EXPERT'] as const).find(tier => {
    const score = userScores[tier];
    return score?.preTestScore === undefined || !score?.finalTotal || (score.finalScore ?? 0) / score.finalTotal < 0.7;
  }) ?? 'EXPERT';
  const currentTierMissions = [...(currentTier === 'INTERMEDIATE' ? BRIDGE_MISSIONS : []), ...MISSIONS.filter(mission => mission.tier === currentTier)];
  const nextMission = currentTierMissions.find(mission => !completedMissions.includes(mission.id));
  const currentTierCompleted = currentTierMissions.filter(mission => completedMissions.includes(mission.id)).length;
  const tierProgressPercent = currentTierMissions.length ? currentTierCompleted / currentTierMissions.length * 100 : 0;
  const currentTierScore = userScores[currentTier];
  const currentTierAllMissionsComplete = currentTierMissions.length > 0 && currentTierMissions.every(mission => completedMissions.includes(mission.id));
  const dailyChallengeAvailable = currentTierAllMissionsComplete || Object.values(userScores).some(score => score.finalScore !== undefined);
  useEffect(() => {
    let cancelled = false;
    if (!dailyChallengeAvailable || activeMoreTab !== 'leaderboard') return () => { cancelled = true; };
    void getDailyTimeAttackEntries(dailyTrialDate).then(entries => {
      if (!cancelled) {
        setLeaderboard(entries);
        setLeaderboardUnavailable(false);
      }
    }).catch(error => {
      console.warn('Could not load the daily time-attack leaderboard. Check sign-in and Firestore rules for dailyTimeAttackEntries:', error);
      if (!cancelled) setLeaderboardUnavailable(true);
    }).finally(() => { if (!cancelled) setLeaderboardLoading(false); });
    return () => { cancelled = true; };
  }, [userId, dailyTrialDate, dailyChallengeAvailable, activeMoreTab]);

  const toggleMoreTab = (tab: 'progress' | 'badges' | 'leaderboard') => {
    const next = activeMoreTab === tab ? null : tab;
    if (next === 'leaderboard' && dailyChallengeAvailable) {
      setLeaderboardLoading(true);
      setLeaderboardUnavailable(false);
    }
    setActiveMoreTab(next);
  };

  const handleMoreTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const currentIndex = tabs.indexOf(document.activeElement as HTMLButtonElement);
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[nextIndex]?.focus();
    tabs[nextIndex]?.click();
  };

  useEffect(() => {
    if (!user || isLoadingProgress || progressLoadFailed) return;
    const tiers = (['BEGINNER', 'INTERMEDIATE', 'EXPERT'] as const).map(id => {
      const missionIds = [...(id === 'INTERMEDIATE' ? BRIDGE_MISSIONS : []), ...MISSIONS.filter(mission => mission.tier === id)].map(mission => mission.id);
      const score = userScores[id];
      return { id, missionIds, completedMissionIds: completedMissions, preTestTaken: score?.preTestScore !== undefined, postTestTaken: score?.finalScore !== undefined, passed: Boolean(score?.finalTotal && (score.finalScore ?? 0) / score.finalTotal >= 0.7) };
    });
    const next = applyCertificationRewards(progression, tiers);
    if (next.xp !== progression.xp || next.rank !== progression.rank || next.badges.length !== progression.badges.length || next.tierRewards.length !== progression.tierRewards.length) {
      onProgressionChange(next);
      void saveProgression(user.uid, next).catch(error => console.warn('Could not save tier rewards:', error));
    }
  }, [user, userScores, completedMissions, progression, onProgressionChange, isLoadingProgress, progressLoadFailed]);

  const completedMissionCount = new Set(completedMissions).size;
  const isNewUser = !Object.values(userScores).some(score => score.preTestScore !== undefined) && completedMissionCount === 0;
  const hasScoreData = Object.values(userScores).some(score => score.preTestScore !== undefined || score.finalScore !== undefined);
  const visibleMoreTabs = [
    ...(hasScoreData ? [{ id: 'progress' as const, label: 'Progress' }] : []),
    { id: 'badges' as const, label: 'Badges' },
    ...(dailyChallengeAvailable ? [{ id: 'leaderboard' as const, label: 'Time Attack leaderboard' }] : [])
  ];
  const completedTierCount = (['BEGINNER', 'INTERMEDIATE', 'EXPERT'] as const).filter(tier => {
    const tierMissions = [...(tier === 'INTERMEDIATE' ? BRIDGE_MISSIONS : []), ...MISSIONS.filter(mission => mission.tier === tier)];
    const score = userScores[tier];
    return tierMissions.length > 0 && tierMissions.every(mission => completedMissions.includes(mission.id)) && score?.finalScore !== undefined;
  }).length;
  const hasCompletedTier = completedTierCount > 0;
  const showLearningGain = hasCompletedTier;
  const gainForTier = (data?: TierScoreLike) => getTierLearningGain(
    data?.preTestScore !== undefined ? { score: data.preTestFirstScore ?? data.preTestScore, total: data.preTestFirstTotal ?? data.preTestTotal } : undefined,
    data?.finalScore !== undefined ? { score: data.firstFinalScore ?? data.finalScore, total: data.firstFinalTotal ?? data.finalTotal } : undefined
  );
  const badgePeek = [
    ...ACHIEVEMENTS.filter(achievement => achievement.active && progression.badges.includes(achievement.id)),
    ...ACHIEVEMENTS.filter(achievement => achievement.active && !progression.badges.includes(achievement.id))
  ].slice(0, 3);
  const pathDescription = 'This learning study uses simulated commands and saves your progress and attempts. Path: pre-test → missions → post-test.';
  const heroTitle = currentTierScore?.preTestScore === undefined
    ? `Start your ${currentTier[0]}${currentTier.slice(1).toLowerCase()} pre-test`
    : nextMission
      ? `Continue: ${nextMission.title}`
      : `Take the ${currentTier[0]}${currentTier.slice(1).toLowerCase()} post-test`;
  const heroDescription = isNewUser
    ? pathDescription
    : nextMission?.learningGoal ?? `Complete the ${currentTier} post-test to finish this certification tier.`;

  return (
    <div className="game-screen mx-auto min-h-full w-full max-w-6xl space-y-7 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <GameCard className="continue-hero p-5 sm:p-8 lg:p-10">
        <p className="game-eyebrow">Next step · {currentTier}</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-bold leading-tight text-[var(--game-text)] sm:text-4xl">{heroTitle}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--game-muted)]">{heroDescription}</p>
        {!isNewUser && <p className="mt-3 text-xs leading-5 text-[var(--game-muted)]">Learning study · all commands are simulated · progress and attempt data are saved.</p>}
        {!isNewUser && nextMission && <p className="mt-3 text-sm text-[var(--game-muted)]">{nextMission.difficulty} mission · about {Math.max(3, Math.ceil(nextMission.steps.length * 1.5))} min</p>}
        {!isNewUser && <ProgressBar value={tierProgressPercent} label={`${currentTier} mission progress`} className="mt-5 max-w-2xl" />}
        <button type="button" onClick={onContinue} className="mt-6 min-h-12 rounded-md bg-[var(--game-green)] px-6 py-3 text-sm font-bold text-black shadow-md transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)] focus-visible:ring-offset-2">{currentTierScore?.preTestScore === undefined ? 'Start pre-test' : 'Continue training'} <ChevronRight size={16} className="ml-1 inline" /></button>
      </GameCard>

      {!isNewUser && !isLoadingProgress && <div className="game-card grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 p-3 sm:gap-4 sm:p-4" aria-label="Training status">
        <div className="min-w-0"><div className="flex flex-col text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-2"><span className="truncate font-semibold text-[var(--game-text)]">{rank.current.name}</span><span className="whitespace-nowrap text-[var(--game-muted)]">{progression.xp}{rank.next ? `/${rank.next.threshold}` : ''} XP</span></div><div role="img" aria-label={rank.next ? `${rank.percent}% progress to ${rank.next.name}` : 'Maximum rank'}><ProgressBar value={rank.percent} className="mt-2" /></div></div>
        <p className="whitespace-nowrap rounded-full border border-[var(--game-border)] px-2 py-2 text-center text-xs font-semibold text-[var(--game-text)] sm:px-3">{progression.streak.current}d streak</p>
        <p className="whitespace-nowrap text-right text-xs text-[var(--game-text)]"><span className="font-semibold">{currentTierCompleted}/{currentTierMissions.length}</span><span className="block sm:inline sm:pl-1">missions</span></p>
      </div>}

      {!isNewUser && <>
        {dailyChallengeAvailable && <section className="grid gap-4 lg:grid-cols-2" aria-label="Daily challenges">
          <GameCard className="border-[var(--game-cyan)] p-4 sm:p-5" aria-label="Daily Time Attack">
            <div className="flex h-full flex-col justify-between gap-4"><div><p className="game-eyebrow">Daily Time Attack · one attempt</p><h2 className="mt-1 text-lg font-bold text-[var(--game-text)]">{dailyTimeAttackMissionTitle}</h2><p className="mt-1 text-sm text-[var(--game-muted)]">Clear today’s timed case for a place on the Time Attack leaderboard.</p></div><button type="button" disabled={dailyTimeAttackPlayed || progressLoadFailed} onClick={() => onStartDailyTrial('timeAttack')} className="min-h-11 w-full rounded-md border border-[var(--game-cyan)] px-4 py-2 text-sm font-semibold text-[var(--game-text)] transition hover:bg-[var(--game-cyan)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)] disabled:cursor-not-allowed disabled:opacity-50">{dailyTimeAttackPlayed ? 'Attempt used today' : 'Start Time Attack'}</button></div>
          </GameCard>
          <GameCard className="border-[var(--game-green)] p-4 sm:p-5" aria-label="Daily Accuracy Trial">
            <div className="flex h-full flex-col justify-between gap-4"><div><p className="game-eyebrow">Daily Accuracy Trial · one attempt</p><h2 className="mt-1 text-lg font-bold text-[var(--game-text)]">{dailyAccuracyMissionTitle}</h2><p className="mt-1 text-sm text-[var(--game-muted)]">Work carefully through today’s untimed case. Accuracy is tracked independently from your Time Attack.</p></div><button type="button" disabled={dailyAccuracyPlayed || progressLoadFailed} onClick={() => onStartDailyTrial('accuracy')} className="min-h-11 w-full rounded-md border border-[var(--game-green)] px-4 py-2 text-sm font-semibold text-[var(--game-text)] transition hover:bg-[var(--game-green)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)] disabled:cursor-not-allowed disabled:opacity-50">{dailyAccuracyPlayed ? 'Attempt used today' : 'Start Accuracy Trial'}</button></div>
          </GameCard>
        </section>}

        <GameCard className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="shrink-0 text-sm font-semibold text-[var(--game-text)]">More</span>
              <div role="tablist" aria-label="Dashboard details" aria-orientation="horizontal" onKeyDown={handleMoreTabKeyDown} className="flex min-w-0 gap-1 overflow-x-auto scrollbar-hide">
                {visibleMoreTabs.map(tab => <button key={tab.id} id={`dashboard-tab-${tab.id}`} type="button" role="tab" aria-selected={activeMoreTab === tab.id} aria-controls="dashboard-more-panel" onClick={() => toggleMoreTab(tab.id)} className={`min-h-11 shrink-0 rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)] ${activeMoreTab === tab.id ? 'border-[var(--game-cyan)] bg-[var(--game-cyan)]/10 text-[var(--game-text)]' : 'border-[var(--game-border)] text-[var(--game-muted)] hover:bg-[var(--game-track)]'}`}>
                  {tab.label}{tab.id === 'badges' ? ` · ${progression.badges.length}/${ACHIEVEMENTS.filter(item => item.active).length}` : ''}
                </button>)}
              </div>
            </div>
            <button type="button" onClick={onShowGuide} className="min-h-11 shrink-0 rounded-md px-2 text-sm font-medium text-[var(--game-muted)] hover:text-[var(--game-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]"><HelpCircle size={16} className="mr-1 inline" />How to Play</button>
          </div>
          <div className={`mt-3 min-h-0 overflow-hidden border-t border-[var(--game-border)] pt-3 ${activeMoreTab ? 'min-h-48' : ''}`}>
            <AnimatePresence mode="wait" initial={false}>{activeMoreTab && visibleMoreTabs.some(tab => tab.id === activeMoreTab) && <motion.div key={activeMoreTab} id="dashboard-more-panel" role="tabpanel" aria-labelledby={`dashboard-tab-${activeMoreTab}`} tabIndex={0} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.16 }} className="max-h-96 overflow-y-auto overscroll-contain pr-1">
              {activeMoreTab === 'progress' && hasScoreData && <div id="dashboard-progress-details" className="space-y-4">
                <div><h2 className="text-base font-bold text-[var(--game-text)]">Assessment results</h2><p className="mt-1 text-sm text-[var(--game-muted)]">Pre-test and post-test scores are shown for each tier.</p></div>
                <div className="space-y-3">{(['BEGINNER', 'INTERMEDIATE', 'EXPERT'] as const).filter(tier => userScores[tier]?.preTestScore !== undefined || userScores[tier]?.finalScore !== undefined).map(tier => { const data = userScores[tier]; const gain = gainForTier(data); return <div key={tier} className="grid gap-2 rounded-md border border-[var(--game-border)] p-3 text-sm sm:grid-cols-[100px_1fr_1fr_1fr] sm:items-center"><span className="font-semibold text-[var(--game-text)]">{tier}</span><span className="text-[var(--game-muted)]">Pre-test: {data?.preTestScore !== undefined ? `${data.preTestScore}/${data.preTestTotal ?? 0}` : 'Not taken'}</span><span className="text-[var(--game-muted)]">Post-test (best): {data?.finalScore !== undefined ? `${data.finalScore}/${data.finalTotal ?? 0}` : 'Not taken'}</span>{showLearningGain && gain !== null && <span className="font-semibold text-[var(--game-text)]">Gain (first attempts): {gain > 0 ? '+' : ''}{gain} pp</span>}</div>; })}</div>
                <p className="text-xs leading-5 text-[var(--game-muted)]">Gain compares first pre-test and first post-test attempts when recorded; older records use their saved scores. This is descriptive and does not change certification scoring.</p>
                <button type="button" onClick={() => setScreen('profile')} className="min-h-11 text-sm font-semibold text-[var(--game-text)] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-green)]">View all results in Profile</button>
              </div>}
              {activeMoreTab === 'badges' && <div id="dashboard-badge-peek" className="space-y-3" aria-label="Badge preview">
                <div><h2 className="text-base font-bold text-[var(--game-text)]">{progression.badges.length} of {ACHIEVEMENTS.filter(item => item.active).length} badges earned</h2><p className="mt-1 text-sm text-[var(--game-muted)]">A quick look at your achievements.</p></div>
                <div className="flex flex-wrap items-center gap-3">{badgePeek.map(achievement => { const Icon = achievement.icon === 'shield' ? Shield : achievement.icon === 'target' ? Target : achievement.icon === 'sparkles' ? Activity : Award; const earned = progression.badges.includes(achievement.id); return <span key={achievement.id} title={achievement.name} aria-label={`${achievement.name}${earned ? ', earned' : ', next up'}`} className={`inline-flex h-10 w-10 items-center justify-center rounded-full border ${earned ? 'border-[var(--game-green)] text-[var(--game-green)]' : 'border-[var(--game-border)] text-[var(--game-muted)]'}`}><Icon size={18} aria-hidden="true" /></span>; })}</div>
                <button type="button" onClick={() => setScreen('profile')} className="min-h-11 text-sm font-semibold text-[var(--game-text)] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-green)]">View all badges in Profile</button>
              </div>}
              {activeMoreTab === 'leaderboard' && <div id="dashboard-leaderboard" className="space-y-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-base font-bold text-[var(--game-text)]">Today’s Time Attack leaderboard</h2><p className="text-sm text-[var(--game-muted)]">{dailyTrialDate} · {dailyTimeAttackMissionTitle}</p></div><p className="text-xs text-[var(--game-muted)]">Players are shown by their saved username.</p></div>
                <p className="text-xs text-[var(--game-muted)]">Speed is a challenge only; certification progress rewards evidence and accuracy.</p>
                {leaderboardLoading ? <p className="text-sm text-[var(--game-muted)]">Loading entries…</p> : leaderboardUnavailable ? <p className="text-sm text-[var(--game-muted)]">Could not load entries. Check sign-in and the dailyTimeAttackEntries read rule.</p> : leaderboard.length === 0 ? <p className="text-sm text-[var(--game-muted)]">No one has completed today’s Time Attack yet.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left text-sm"><thead className="text-xs text-[var(--game-muted)]"><tr><th className="pb-2 pr-3">Rank</th><th className="pb-2 pr-3">Player</th><th className="pb-2">Clear time</th></tr></thead><tbody>{leaderboard.map((entry, index) => <tr key={`${entry.uid}-${index}`} className="border-t border-[var(--game-border)] text-[var(--game-text)]"><td className="py-2 pr-3 font-semibold">#{index + 1}</td><td className="py-2 pr-3"><div className="flex items-center gap-2">{entry.avatarId ? <Avatar avatarId={entry.avatarId} alt={`${entry.nickname}'s avatar: ${getAvatarById(entry.avatarId).label}`} /> : <span role="img" aria-label="No avatar selected" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--game-border)] bg-[var(--game-track)] text-lg font-bold text-[var(--game-muted)]">?</span>}<span>{entry.nickname}{entry.uid === userId ? ' · YOU' : ''}</span></div></td><td className="py-2 font-semibold">{Math.floor(entry.clearTimeSeconds / 60)}:{String(entry.clearTimeSeconds % 60).padStart(2, '0')}</td></tr>)}</tbody></table></div>}
                <p className="text-xs text-[var(--game-muted)]">Entries are submitted by the game client and are not tamper-proof.</p>
              </div>}
            </motion.div>}</AnimatePresence>
          </div>
        </GameCard>
      </>}
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

        <p className="text-green-300 text-sm">
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
                className={`border ${tier.border} bg-black/60 p-6`}
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

                      <p className="text-green-300 text-sm mt-1 max-w-2xl">
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

                        <span className="text-green-300">
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

                        <span className="text-green-300">
                          PRE-TEST:{' '}
                          <span className="text-white">
                            {score &&
                            score.preTestScore !==
                              undefined
                              ? `${score.preTestScore}/${score.preTestTotal}`
                              : 'NOT TAKEN'}
                          </span>
                        </span>

                        <span className="text-green-300">
                          POST-TEST:{' '}
                          <span className="text-white">
                            {score?.finalScore !== undefined
                              ? `${score.finalScore}/${score.finalTotal ?? 0}`
                              : 'NOT TAKEN'}
                          </span>
                        </span>

                        <span className="text-green-300">
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
                    <div className="border border-green-900 px-6 py-3 text-xs font-black uppercase text-green-300 whitespace-nowrap flex items-center gap-2 cursor-not-allowed">
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
    <div className="game-screen mx-auto min-h-full w-full max-w-[1480px] space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">

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
              <GameCard
                key={
                  mission.id
                }
                className={`p-5 ${
                  completed
                    ? 'border-[var(--game-green)]'
                    : ''
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

                      <p className="game-eyebrow">CASE FILE · {String(index + 1).padStart(2, '0')} · {mission.category ?? 'practice'}</p>
                      <h2 className="mt-1 text-lg font-bold text-[var(--game-text)]">
                        {
                          mission.title
                        }
                      </h2>

                      <p className="mt-1 text-sm leading-6 text-[var(--game-muted)]">
                        {
                          mission.scenario
                        }
                      </p>

                      <p className="text-sm text-green-500/50 mt-3">
                        {mission.learningGoal}
                      </p>

                      {completed && <span className="mt-3 inline-block rotate-[-2deg] border border-green-500/50 px-2 py-1 text-[10px] font-bold tracking-[0.18em] text-green-300">RESOLVED</span>}

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
                    className="shrink-0 flex min-h-11 items-center justify-center gap-2 rounded-md border border-green-500 px-5 py-2 text-xs font-bold uppercase text-green-300 transition hover:-translate-y-0.5 hover:bg-green-500 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    <Play
                      size={13}
                    />

                    {completed
                      ? 'Replay'
                      : 'Deploy'}
                  </button>

                </div>

              </GameCard>
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
  onSkillSignal: (signal: 'evidence' | 'calibrated-report') => void;
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
  onSkillSignal,
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
    onSkillSignal('evidence');
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
      const finding = args.slice(1).join(' ').trim();
      const overclaims = /\b(definitely|certainly|proved|proves|confirmed breach|stolen|exfiltrated|compromised)\b/i.test(finding);
      if (evidenceNotes.length > 0 && finding.length > 0 && !overclaims && (confidence !== 'high' || evidenceNotes.length >= 2)) onSkillSignal('calibrated-report');
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
  progression: PlayerProgression;
  completedMissions: string[];
  onProgressionChange: (progression: PlayerProgression) => void;
  avatarId: AvatarId;
  progressLoadFailed: boolean;
  onSaveAvatarChoice: (avatarId: AvatarId) => Promise<void>;

}

export const ProfileScreen = ({
  user,
  userScores,
  progression,
  completedMissions,
  onProgressionChange,
  avatarId,
  progressLoadFailed,
  onSaveAvatarChoice
}: ProfileScreenProps) => {
  const [exportMessage, setExportMessage] = useState('');
  const [archive, setArchive] = useState<MissionAttemptRecord[]>([]);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<{ uid: string; id: AvatarId } | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const avatarOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedAvatarId = localAvatar?.uid === user?.uid ? localAvatar?.id ?? getAvatarById(avatarId).id : getAvatarById(avatarId).id;

  const chooseAvatar = async (nextAvatarId: AvatarId) => {
    if (!user || progressLoadFailed || savingAvatar || nextAvatarId === selectedAvatarId) return;
    const previousAvatarId = selectedAvatarId;
    setLocalAvatar({ uid: user.uid, id: nextAvatarId });
    setAvatarMessage('');
    setSavingAvatar(true);
    try {
      await onSaveAvatarChoice(nextAvatarId);
      setAvatarMessage('Avatar updated.');
    } catch (error) {
      console.error('Could not save avatar choice:', error);
      setLocalAvatar({ uid: user.uid, id: previousAvatarId });
      setAvatarMessage('Couldn’t save your avatar. Try again.');
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleAvatarKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = AVATARS.findIndex(avatar => avatar.id === selectedAvatarId);
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
    const nextIndex = (currentIndex + direction + AVATARS.length) % AVATARS.length;
    const nextAvatar = AVATARS[nextIndex];
    avatarOptionRefs.current[nextIndex]?.focus();
    void chooseAvatar(nextAvatar.id);
  };

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    void getMissionAttempts(user.uid).then(attempts => {
      if (!cancelled) setArchive(attempts.filter(attempt => attempt.outcome === 'completed'));
    }).catch(error => console.warn('Could not load case archive:', error));
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const added = new Set<string>();
    for (const tier of ['BEGINNER', 'INTERMEDIATE', 'EXPERT'] as const) {
      const tierMissions = [...(tier === 'INTERMEDIATE' ? BRIDGE_MISSIONS : []), ...MISSIONS.filter(mission => mission.tier === tier)];
      const allCasesDone = tierMissions.length > 0 && tierMissions.every(mission => completedMissions.includes(mission.id));
      const score = userScores[tier];
      const passed = Boolean(score?.finalTotal && (score.finalScore ?? 0) / score.finalTotal >= 0.7);
      if (allCasesDone && passed && !progression.badges.includes('clearance-granted')) added.add('clearance-granted');
      if (allCasesDone && score?.preTestScore !== undefined && score.finalScore !== undefined && !progression.badges.includes('full-circle')) added.add('full-circle');
    }
    if (added.size) {
      const next = { ...progression, badges: [...new Set([...progression.badges, ...added])] };
      onProgressionChange(next);
      void saveProgression(user.uid, next).catch(error => console.warn('Could not save certification achievement:', error));
    }
  }, [user, userScores, completedMissions, progression, onProgressionChange]);

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
  const profileLearningGain = (data: TierScoreLike) => getTierLearningGain(
    data.preTestScore !== undefined ? { score: data.preTestFirstScore ?? data.preTestScore, total: data.preTestFirstTotal ?? data.preTestTotal } : undefined,
    data.finalScore !== undefined ? { score: data.firstFinalScore ?? data.finalScore, total: data.firstFinalTotal ?? data.finalTotal } : undefined
  );
  const learningGainEntries = (['BEGINNER', 'INTERMEDIATE', 'EXPERT'] as const)
    .map(tier => ({ tier, data: userScores[tier], gain: userScores[tier] ? profileLearningGain(userScores[tier]) : null }))
    .filter((entry): entry is { tier: Tier; data: TierScoreLike; gain: number } => Boolean(entry.data && entry.gain !== null));

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
        const headers = ['missionId', 'missionTitle', 'tier', 'concept', 'outcome', 'startedAt', 'completedAt', 'totalTimeSeconds', 'hintsOpened', 'hintLevelsShown', 'timePerStepSeconds', 'wrongCommandsByStep', 'wrongDecisionCount', 'challengeMode', 'dailyChallengeDate', 'dailyChallengeType', 'skillSignals', 'xpAwarded'];
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
    <div className="game-screen mx-auto min-h-full w-full max-w-[1480px] space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">

      <section className="border border-green-500/20 bg-[#08100c] p-6">

        <div className="flex flex-col md:flex-row items-center md:items-start gap-5">

          <div className="flex flex-col items-center gap-2">
            <Avatar avatarId={selectedAvatarId} size="large" />
            <button type="button" aria-expanded={avatarPickerOpen} aria-controls="profile-avatar-picker" disabled={!user || progressLoadFailed || savingAvatar} onClick={() => setAvatarPickerOpen(open => !open)} className="min-h-11 rounded-md border border-cyan-800 px-3 py-2 text-xs font-bold text-cyan-200 hover:border-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-50">{savingAvatar ? 'Saving…' : 'Change avatar'}</button>
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

        {avatarPickerOpen && <div id="profile-avatar-picker" className="mt-5 border-t border-[var(--game-border)] pt-4">
          <p className="mb-3 text-sm font-semibold text-[var(--game-text)]">Choose a preset avatar</p>
          <div role="radiogroup" aria-label="Choose your profile avatar" onKeyDown={handleAvatarKeyDown} className="flex flex-wrap gap-3">
            {AVATARS.map((avatar, index) => {
              const selected = selectedAvatarId === avatar.id;
              return <button key={avatar.id} ref={element => { avatarOptionRefs.current[index] = element; }} type="button" role="radio" aria-checked={selected} aria-label={avatar.label} tabIndex={selected ? 0 : -1} disabled={!user || progressLoadFailed || savingAvatar} onClick={() => void chooseAvatar(avatar.id)} className={`relative flex min-h-16 min-w-16 items-center justify-center rounded-full border-2 p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--game-surface)] disabled:cursor-not-allowed disabled:opacity-50 ${selected ? 'border-[var(--game-green)] ring-2 ring-[var(--game-green)]' : 'border-[var(--game-border)] hover:border-[var(--game-cyan)]'}`}>
                <Avatar avatarId={avatar.id} />
                {selected && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--game-surface)] bg-[var(--game-green)] text-xs font-black text-black" aria-hidden="true">✓</span>}
              </button>;
            })}
          </div>
          {progressLoadFailed && <p className="mt-3 text-xs text-[var(--game-muted)]">Avatar changes are unavailable until saved progress loads successfully.</p>}
          {avatarMessage && <p className="mt-3 text-xs text-[var(--game-text)]" role="status">{avatarMessage}</p>}
        </div>}

      </section>

      <GameCard className="p-5 sm:p-6">
        <SectionHeader eyebrow="Clearance profile" title={`${rankProgress(progression.xp).current.name} · ${progression.xp} XP`} detail={`${progression.streak.current} day streak · ${progression.streak.longest} day personal best`} />
        <ProgressBar value={rankProgress(progression.xp).percent} label={rankProgress(progression.xp).next ? `Progress to ${rankProgress(progression.xp).next?.name}` : 'Maximum rank'} />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">{ACHIEVEMENTS.map(achievement => <AchievementBadge key={achievement.id} achievement={achievement} earned={progression.badges.includes(achievement.id)} />)}</div>
      </GameCard>

      {learningGainEntries.length > 0 && <GameCard className="p-5 sm:p-6">
        <SectionHeader eyebrow="Assessment progress" title="Learning gain · first attempts" detail="Percentage-point change between the first pre-test and post-test attempts." />
        <div className="mt-4 space-y-2">{learningGainEntries.map(({ tier, gain }) => <div key={tier} className="flex items-center justify-between gap-3 rounded-md border border-[var(--game-border)] p-3 text-sm"><span className="font-semibold text-[var(--game-text)]">{tier}</span><span className="font-bold text-[var(--game-text)]">{gain > 0 ? '+' : ''}{gain} pp</span></div>)}</div>
        <p className="mt-3 text-xs leading-5 text-[var(--game-muted)]">Older records without first-attempt fields use their saved assessment scores. Total score and average below reflect best saved post-test scores.</p>
      </GameCard>}

      <GameCard className="p-5 sm:p-6">
        <SectionHeader eyebrow="Resolved case files" title="Case Archive" detail="Completed practice and certification cases with their learning takeaway." />
        {archive.length ? <div className="space-y-2">{archive.map((attempt, index) => <article key={`${attempt.missionId}-${attempt.completedAt}-${index}`} className="flex flex-col gap-2 rounded-md border border-[var(--game-border)] bg-[var(--game-surface)] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-[var(--game-text)]">{attempt.missionTitle} <span className="ml-2 rounded border border-[var(--game-green)] px-2 py-0.5 text-[10px] text-[var(--game-green)]">RESOLVED</span></p><p className="mt-1 text-xs text-[var(--game-muted)]">{attempt.concept} · {new Date(attempt.completedAt).toLocaleDateString()}</p></div><p className="text-xs text-[var(--game-muted)]">Takeaway: {attempt.concept}</p></article>)}</div> : <div className="empty-state">No resolved cases yet. Complete a mission to start your archive.</div>}
      </GameCard>

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
              BEST POST-TEST SCORE
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
              BEST-SCORE AVERAGE
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
