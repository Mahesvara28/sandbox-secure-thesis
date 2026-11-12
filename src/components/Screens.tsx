import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { User as FirebaseUser } from 'firebase/auth';
import type { CampaignProgress, UserCertificate } from '../Firebase';
import type { ActivityResult } from './ActivityShell';
import loginBackgroundLoop from '../assets/login_loop.mp4';
import recruitRankBadge from '../assets/Recruit.webp';
import analystRankBadge from '../assets/Analyst.webp';
import responderRankBadge from '../assets/Responder.webp';
import hunterRankBadge from '../assets/Hunter.webp';
import leadRankBadge from '../assets/Lead.webp';
import dailyAccuracyImage from '../assets/accuracy.webp';
import dailyTimeAttackImage from '../assets/time.webp';
import beginnerTierImage from '../assets/beginner.webp';
import intermediateTierImage from '../assets/intermediate.webp';
import expertTierImage from '../assets/expert.webp';
import tutorialMissionImage from '../assets/tutorial.webp';
import mission2Image from '../assets/mission2.webp';
import mission3Image from '../assets/mission3.webp';
import mission4Image from '../assets/mission4.webp';
import mission5Image from '../assets/mission5.webp';
import mission6Image from '../assets/mission6.webp';
import mission7Image from '../assets/mission7.webp';
import cosmeticShopImage from '../assets/shop.webp';
import dashboardHeroImage from '../assets/bg2.webp';
import { getMissionAttempts, getAssessmentAttempts, getDailyTimeAttackEntries, getDailyAccuracyEntries, retryDailyLeaderboardEntry, saveProgression } from '../Firebase';
import type { LeaderboardEntry, AccuracyLeaderboardEntry, MissionAttemptRecord } from '../Firebase';
import { AVATARS, getAvatarById, type AvatarId } from '../data/avatars';
import { Avatar } from './Avatar';
import { DialogueBox } from './DialogueBox';
import { ACHIEVEMENTS } from '../data/achievements';
import { applyCertificationRewards, rankProgress, type PlayerProgression, getTierLearningGain } from '../data/progression';
import { AchievementBadge, GameCard, ProgressBar, SectionHeader } from './GameUI';
import { COSMETIC_CATALOG, type CosmeticKind, type PlayerCosmetics } from '../data/cosmetics';

const DailySplitText = ({ text, split }: { text: string; split: 'characters' | 'words' }) => {
  if (split === 'characters') {
    return <span aria-hidden="true" className="daily-split-text">{Array.from(text).map((character, index) => (
      <span key={`${character}-${index}`} className="daily-split-char" style={{ '--daily-split-index': index } as CSSProperties}>{character === ' ' ? '\u00a0' : character}</span>
    ))}</span>;
  }
  return <span aria-hidden="true" className="daily-split-text">{text.split(/\s+/).map((word, index) => (
    <span key={`${word}-${index}`} className="daily-split-word" style={{ '--daily-split-index': index } as CSSProperties}>{word}</span>
  ))}</span>;
};

import {
  Terminal,
  Shield,
  GraduationCap,
  Target,
  Play,
  CheckCircle2,
  Clock,
  Award,
  BookOpen,
  ChevronRight,
  Activity,
  Wifi,
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
import { SecurityBrief } from './SecurityBrief';
import { SECURITY_BRIEF_ITEMS } from '../data/securityBrief';
import { getDailyQuickDrills, QUICK_DRILLS_PER_DAY } from '../data/quickDrills';

type DailyQuickDrillState = { completed: number; selectedAnswer: string | null };

const DailyQuickDrill = ({ uid, dateKey }: { uid: string; dateKey: string }) => {
  const reduceMotion = useReducedMotion();
  const dailyDrills = getDailyQuickDrills(uid, dateKey);
  const storageKey = `sandbox-secure-quick-drills:${uid}:${dateKey}`;
  const [state, setState] = useState<DailyQuickDrillState>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<DailyQuickDrillState>;
        if (typeof parsed.completed === 'number' && typeof parsed.selectedAnswer !== 'undefined') {
          return { completed: Math.max(0, Math.min(QUICK_DRILLS_PER_DAY, parsed.completed)), selectedAnswer: parsed.selectedAnswer };
        }
      }
    } catch { /* Storage can be unavailable in private browsing; the drill still works in memory. */ }
    return { completed: 0, selectedAnswer: null };
  });
  const saveState = (next: DailyQuickDrillState) => {
    setState(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Keep the current practice session usable without storage. */ }
  };
  const drill = dailyDrills[state.completed];
  const selectedIsCorrect = Boolean(drill && state.selectedAnswer === drill.answer);

  return <section className="game-card dashboard-quick-drill p-5 sm:p-6" aria-label="Daily quick drill">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="game-eyebrow">Quick drill · practice only</p><h2 className="mt-1 text-xl font-black uppercase text-[var(--game-text)]">Build your investigation instincts</h2><p className="mt-2 text-sm text-[var(--game-muted)]">Answer five short scenarios. Your next drill changes after each answer. No certification score or currency is affected.</p></div>
      <span className="shrink-0 border border-[var(--game-cyan)] px-3 py-2 text-xs font-bold text-[var(--game-text)]">{Math.min(state.completed + (state.selectedAnswer ? 1 : 0), QUICK_DRILLS_PER_DAY)} / {QUICK_DRILLS_PER_DAY} answered</span>
    </div>
    <div className="mt-4 flex items-center gap-2" aria-label={`Drill ${Math.min(state.completed + 1, QUICK_DRILLS_PER_DAY)} of ${QUICK_DRILLS_PER_DAY}`}>
      {Array.from({ length: QUICK_DRILLS_PER_DAY }, (_, pip) => <span key={pip} aria-hidden="true" className={`h-2 flex-1 border ${pip < state.completed ? 'border-[var(--game-green)] bg-[var(--game-green)]' : pip === state.completed && drill ? 'border-[var(--game-cyan)] bg-[var(--game-cyan)]' : 'border-[var(--game-border)] bg-transparent'}`} />)}
    </div>
    {drill ? <AnimatePresence mode="wait" initial={false}><motion.article key={state.completed} initial={reduceMotion ? false : { opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: -14 }} transition={{ duration: reduceMotion ? 0 : 0.18 }} className="mt-3 border border-[var(--game-border)] bg-[var(--game-surface-raised)] p-4 sm:p-5" aria-live="polite">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--game-cyan)]">Drill {state.completed + 1} · {drill.title}</p>
      <p className="mt-3 text-sm leading-6 text-[var(--game-text)]">{drill.prompt}</p>
      <div className="mt-4 grid gap-2">{drill.options.map(option => {
        const isSelected = state.selectedAnswer === option.id;
        const isRevealedCorrect = Boolean(state.selectedAnswer) && option.id === drill.answer;
        const optionTone = isRevealedCorrect ? 'border-[var(--game-green)] bg-[var(--game-green)]/10' : isSelected ? 'border-[var(--game-amber)] bg-[var(--game-amber)]/10' : 'border-[var(--game-border)] hover:border-[var(--game-cyan)]';
        return <button key={option.id} type="button" disabled={Boolean(state.selectedAnswer)} onClick={() => saveState({ ...state, selectedAnswer: option.id })} className={`min-h-11 w-full border p-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)] disabled:cursor-default ${optionTone} text-[var(--game-text)]`}><span className="flex items-center justify-between gap-3"><span>{option.label}</span>{isRevealedCorrect && <CheckCircle2 size={18} className="shrink-0 text-[var(--game-green)]" aria-label="Correct answer" />}{isSelected && !selectedIsCorrect && <span className="shrink-0 text-xs font-bold text-[var(--game-amber)]">Your choice</span>}</span></button>;
      })}</div>
      {state.selectedAnswer && <div className={`mt-4 border p-3 text-sm leading-6 ${selectedIsCorrect ? 'border-[var(--game-green)]' : 'border-[var(--game-yellow)]'}`} role="status"><p className="font-bold text-[var(--game-text)]">{selectedIsCorrect ? 'Good analysis.' : 'Review the evidence.'}</p><p className="mt-1 text-[var(--game-text)]">{drill.feedback}</p><button type="button" onClick={() => saveState({ completed: state.completed + 1, selectedAnswer: null })} className="mt-3 min-h-10 border border-[var(--game-cyan)] px-4 py-2 text-xs font-bold text-[var(--game-text)] hover:bg-[var(--game-cyan)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">{state.completed + 1 === QUICK_DRILLS_PER_DAY ? 'Finish today’s drills' : 'Next drill'} <span aria-hidden="true">→</span></button></div>}
    </motion.article></AnimatePresence> : <div className="mt-3 border border-[var(--game-green)] p-4" role="status"><p className="font-bold text-[var(--game-text)]">Today’s five drills are complete.</p><p className="mt-1 text-sm text-[var(--game-muted)]">A fresh set is ready tomorrow.</p><button type="button" onClick={() => saveState({ completed: 0, selectedAnswer: null })} className="mt-3 min-h-10 border border-[var(--game-border)] px-4 py-2 text-xs font-bold text-[var(--game-text)] hover:border-[var(--game-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">Review today’s drills</button></div>}
  </section>;
};

const RANK_BADGES: Record<string, string> = {
  Recruit: recruitRankBadge,
  Analyst: analystRankBadge,
  Responder: responderRankBadge,
  Hunter: hunterRankBadge,
  Lead: leadRankBadge
};

const TIER_CARD_IMAGES: Record<string, string> = {
  BEGINNER: beginnerTierImage,
  INTERMEDIATE: intermediateTierImage,
  EXPERT: expertTierImage
};

const PRACTICE_MISSION_IMAGES: Record<string, string> = {
  t1: tutorialMissionImage,
  t2: mission2Image,
  t3: mission3Image,
  t4: mission4Image,
  t5: mission5Image,
  t6: mission6Image,
  t7: mission7Image
};

const ArtworkPreviewDialog = ({ artwork, onClose }: { artwork: { title: string; src: string; alt: string } | null; onClose: () => void }) => {
  useEffect(() => {
    if (!artwork) return;
    const handleKeyDown = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [artwork, onClose]);
  if (!artwork) return null;
  return <div className="fixed inset-0 z-[170] flex items-center justify-center overflow-y-auto bg-black/85 p-3 sm:p-5" role="presentation" onClick={onClose}>
    <section role="dialog" aria-modal="true" aria-label={artwork.title} className="flex h-[calc(100dvh-1.5rem)] max-h-[900px] w-full max-w-4xl flex-col items-center gap-3 overflow-hidden rounded-lg border border-[var(--game-border)] bg-[var(--game-surface)] p-3 shadow-2xl sm:h-[calc(100dvh-2.5rem)] sm:gap-4 sm:p-5" onClick={event => event.stopPropagation()}>
      <h2 className="w-full shrink-0 text-center text-lg font-bold text-[var(--game-text)]">{artwork.title}</h2>
      <img src={artwork.src} alt={artwork.alt} className="min-h-0 min-w-0 w-full flex-1 rounded-md object-contain" />
      <button type="button" autoFocus onClick={onClose} className="min-h-11 shrink-0 rounded-md border border-[var(--game-border)] px-5 py-2 font-semibold text-[var(--game-text)] hover:border-[var(--game-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">Close</button>
    </section>
  </div>;
};

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
  bootText = [],
  status = 'SYSTEM BOOT'
}: {
  bootText?: string[];
  status?: string;
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
                {status}
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
  authSuccessMessage: string;
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
  handlePasswordReset: () => Promise<void>;
}

export const AuthScreen = ({
  authMode,
  setAuthMode,
  authError,
  authSuccess,
  authSuccessMessage,
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
  handleGoogleLogin,
  handlePasswordReset
}: AuthScreenProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const authVideoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = authVideoRef.current;
    if (!video) return;
    video.volume = 0.35;
    // Start muted so browsers allow the background loop to autoplay reliably.
    // The first user interaction below enables its audio.
    video.muted = true;
    void video.play().catch(() => {
      // Keep the page usable if autoplay is disabled by browser policy.
    });
    return () => {
      video.pause();
    };
  }, []);
  const enableAuthVideoAudio = () => {
    const video = authVideoRef.current;
    if (!video) return;
    video.muted = false;
    video.volume = 0.35;
    void video.play().catch(() => {});
  };
  const fieldClass = 'min-h-12 w-full rounded-lg border border-[var(--game-border)] bg-[var(--game-page)] px-4 py-3 text-[var(--game-text)] outline-none transition placeholder:text-[var(--game-muted)]/70 focus:border-[var(--game-green)] focus:ring-2 focus:ring-[var(--game-green)]/20';
  const activeTabClass = 'min-h-11 flex-1 rounded-md bg-[var(--game-surface-raised)] px-3 text-sm font-semibold text-[var(--game-text)] shadow-sm';
  const inactiveTabClass = 'min-h-11 flex-1 rounded-md px-3 text-sm font-medium text-[var(--game-muted)] transition hover:text-[var(--game-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-green)]';

  return (
    <div className="auth-screen app-atmosphere relative isolate flex min-h-[100svh] items-center justify-center overflow-x-hidden bg-[var(--game-page)] px-4 py-5 font-sans text-[var(--game-text)] sm:px-6 sm:py-7" onPointerDownCapture={enableAuthVideoAudio} onKeyDownCapture={enableAuthVideoAudio}>
      <video ref={authVideoRef} className="auth-background-video pointer-events-none fixed inset-0 z-0 h-full w-full object-cover" src={loginBackgroundLoop} autoPlay muted loop playsInline preload="auto" aria-hidden="true" />
      <div className="auth-background-overlay pointer-events-none fixed inset-0 z-[1] bg-[linear-gradient(135deg,rgba(3,8,12,0.32),rgba(5,16,18,0.18)_50%,rgba(2,7,11,0.4))]" aria-hidden="true" />
      <button type="button" onClick={onToggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} className="fixed right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--game-border)] bg-[var(--game-surface)]/90 text-sm font-black text-[var(--game-text)] shadow-lg backdrop-blur transition hover:border-[var(--game-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-green)]" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
        <span className="flex items-center gap-0.5" aria-hidden="true">
          <span className={`rounded px-1 ${theme === 'light' ? 'bg-[var(--game-cyan)] text-[var(--game-page)]' : 'text-[var(--game-muted)]'}`}>L</span>
          <span className="text-[var(--game-muted)]">/</span>
          <span className={`rounded px-1 ${theme === 'dark' ? 'bg-[var(--game-cyan)] text-[var(--game-page)]' : 'text-[var(--game-muted)]'}`}>D</span>
        </span>
      </button>
      <main data-auth-mode={authMode} className="auth-card game-card auth-panel-frame relative z-10 my-auto w-full max-w-[520px] overflow-hidden rounded-2xl shadow-[var(--game-shadow)] backdrop-blur-xl">
        <section className="p-4 sm:p-6" aria-labelledby="auth-form-title">
          <div className="auth-header mb-4 flex min-w-0 items-start">
            <div className="min-w-0"><p className="auth-brandmark max-w-full font-black text-[var(--game-text)]">SANDBOX<span className="text-[var(--game-green)]">_SECURE</span></p><p className="game-eyebrow mt-2">Operator access</p><h1 id="auth-form-title" className="mt-1 text-xl font-bold text-[var(--game-text)] sm:text-2xl">{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h1></div>
          </div>

          <div role="tablist" aria-label="Account access options" onKeyDown={event => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
            event.preventDefault();
            const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
            const currentIndex = tabs.indexOf(document.activeElement as HTMLButtonElement);
            const nextIndex = (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
            tabs[nextIndex]?.focus();
            tabs[nextIndex]?.click();
          }} className="mb-4 flex gap-1 rounded-lg border border-[var(--game-border)] bg-[var(--game-page)] p-1">
            <button id="auth-tab-login" type="button" role="tab" tabIndex={authMode === 'login' ? 0 : -1} aria-selected={authMode === 'login'} aria-controls="auth-form-panel" onClick={() => setAuthMode('login')} className={authMode === 'login' ? activeTabClass : inactiveTabClass}>Sign in</button>
            <button id="auth-tab-register" type="button" role="tab" tabIndex={authMode === 'register' ? 0 : -1} aria-selected={authMode === 'register'} aria-controls="auth-form-panel" onClick={() => setAuthMode('register')} className={authMode === 'register' ? activeTabClass : inactiveTabClass}>Create account</button>
          </div>

          {authMode === 'login' && <p className="mb-3 text-xs leading-5 text-[var(--game-muted)]">Email and password accounts must verify their email address before signing in. Check your inbox and spam folder for the verification link.</p>}

          <div id="auth-form-panel" role="tabpanel" aria-labelledby={authMode === 'login' ? 'auth-tab-login' : 'auth-tab-register'}>
            {authMode === 'login' ? <form className="auth-login-form grid grid-cols-1 gap-y-2.5" onSubmit={event => { event.preventDefault(); void handleLogin(); }}>
              <div><label htmlFor="login-email" className="auth-login-label mb-1.5 block text-sm font-medium text-[var(--game-text)]">Email address</label><input id="login-email" name="email" autoComplete="email" required type="email" value={regEmail} onChange={event => setRegEmail(event.target.value)} className={`${fieldClass} auth-login-input`} placeholder="operator@example.com" /></div>
              <div><label htmlFor="login-password" className="auth-login-label mb-1.5 block text-sm font-medium text-[var(--game-text)]">Password</label><div className="relative"><input id="login-password" name="password" autoComplete="current-password" required value={regPassword} onChange={event => setRegPassword(event.target.value)} type={showPassword ? 'text' : 'password'} className={`${fieldClass} auth-login-input pr-12`} placeholder="Enter your password" /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className="absolute inset-y-1 right-1 inline-flex w-10 items-center justify-center rounded-md text-[var(--game-muted)] transition hover:text-[var(--game-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-green)]">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
              <button type="submit" className="auth-primary-button min-h-11 w-full rounded-lg bg-[var(--game-green)] px-4 py-2.5 font-bold text-black shadow-sm transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-green)] focus-visible:ring-offset-2">Sign in</button>
              <button type="button" onClick={() => void handlePasswordReset()} className="min-h-9 text-left text-sm font-semibold text-[var(--game-cyan)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">Forgot password?</button>
              <div className="flex items-center gap-3 py-1" aria-hidden="true"><span className="h-px flex-1 bg-[var(--game-border)]" /><span className="text-xs text-[var(--game-muted)]">or</span><span className="h-px flex-1 bg-[var(--game-border)]" /></div>
              <button type="button" onClick={() => void handleGoogleLogin()} className="min-h-11 w-full rounded-lg border border-[var(--game-border)] px-4 py-2.5 text-sm font-semibold text-[var(--game-text)] transition hover:border-[var(--game-cyan)] hover:bg-[var(--game-track)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">Continue with Google</button>
            </form> : <form className="grid grid-cols-1 gap-y-2.5" onSubmit={event => { event.preventDefault(); void handleRegister(); }}>
              <div><label htmlFor="register-name" className="mb-2 block text-sm font-medium text-[var(--game-text)]">Operator name</label><input id="register-name" name="name" autoComplete="nickname" required value={regUsername} onChange={event => setRegUsername(event.target.value)} className={fieldClass} placeholder="Choose a display name" /></div>
              <div><label htmlFor="register-email" className="mb-2 block text-sm font-medium text-[var(--game-text)]">Email address</label><input id="register-email" name="email" autoComplete="email" required type="email" value={regEmail} onChange={event => setRegEmail(event.target.value)} className={fieldClass} placeholder="operator@example.com" /></div>
              <div><label htmlFor="register-password" className="mb-2 block text-sm font-medium text-[var(--game-text)]">Password</label><div className="relative"><input id="register-password" name="new-password" autoComplete="new-password" required minLength={6} value={regPassword} onChange={event => setRegPassword(event.target.value)} type={showPassword ? 'text' : 'password'} className={`${fieldClass} pr-12`} placeholder="At least 6 characters" /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className="absolute inset-y-1 right-1 inline-flex w-10 items-center justify-center rounded-md text-[var(--game-muted)] transition hover:text-[var(--game-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-green)]">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
              <button type="submit" className="auth-primary-button min-h-11 w-full rounded-lg bg-[var(--game-green)] px-4 py-2.5 font-bold text-black shadow-sm transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-green)] focus-visible:ring-offset-2">Create account</button>
            </form>}
          </div>

          {authError && <div className="mt-5 rounded-lg border border-[var(--game-red)]/40 bg-[var(--game-red)]/10 p-3 text-sm text-[var(--game-red)]" role="alert">{authError}</div>}
          {authSuccess && <div className="mt-5 rounded-lg border border-[var(--game-green)]/40 bg-[var(--game-green)]/10 p-3 text-sm text-[var(--game-text)]" role="status">{authSuccessMessage}</div>}
          <p className="mt-4 border-t border-[var(--game-border)] pt-3 text-center text-xs leading-5 text-[var(--game-muted)]">Authorized training environment · Commands are simulated for learning.</p>
        </section>
      </main>
    </div>
  );
};

interface DashboardScreenProps {
  user: FirebaseUser | null;
  cosmetics: PlayerCosmetics;
  onClaimWelcomeReward: () => Promise<PlayerCosmetics>;

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
  resumeActivityLabel?: string;
  onContinueNextMission?: () => void;
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
  cosmetics,
  onClaimWelcomeReward,
  userScores,
  setScreen,
  onShowGuide,
  onContinue,
  resumeActivityLabel,
  onContinueNextMission,
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
  const [welcomeRewardBusy, setWelcomeRewardBusy] = useState(false);
  const [welcomeRewardError, setWelcomeRewardError] = useState('');
  const [welcomeRewardSuccess, setWelcomeRewardSuccess] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardUnavailable, setLeaderboardUnavailable] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [activeMoreTab, setActiveMoreTab] = useState<'progress' | 'badges' | 'leaderboard' | 'accuracyLeaderboard' | 'brief' | null>(null);
  const [accuracyLeaderboard, setAccuracyLeaderboard] = useState<AccuracyLeaderboardEntry[]>([]);
  const [accuracyLeaderboardLoading, setAccuracyLeaderboardLoading] = useState(false);
  const [accuracyLeaderboardUnavailable, setAccuracyLeaderboardUnavailable] = useState(false);
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0);
  const [leaderboardSubmitMessage, setLeaderboardSubmitMessage] = useState('');
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
    if (!dailyChallengeAvailable || (activeMoreTab !== 'leaderboard' && activeMoreTab !== 'accuracyLeaderboard')) return () => { cancelled = true; };
    const type = activeMoreTab === 'accuracyLeaderboard' ? 'accuracy' : 'timeAttack';
    const load = async () => {
      try {
        if (userId) {
          const result = await retryDailyLeaderboardEntry(userId, dailyTrialDate, type);
          if (!cancelled) {
            setLeaderboardSubmitMessage(result === 'no-saved-attempt'
              ? 'No saved completed trial was found to submit.'
              : '');
          }
        }
        const entries = type === 'accuracy'
          ? await getDailyAccuracyEntries(dailyTrialDate)
          : await getDailyTimeAttackEntries(dailyTrialDate);
        if (!cancelled) {
          if (type === 'accuracy') { setAccuracyLeaderboard(entries as AccuracyLeaderboardEntry[]); setAccuracyLeaderboardUnavailable(false); }
          else { setLeaderboard(entries as LeaderboardEntry[]); setLeaderboardUnavailable(false); }
        }
      } catch (error) {
        console.warn(`Could not refresh the daily ${type} leaderboard:`, error);
        if (!cancelled) {
          setLeaderboardSubmitMessage('Could not submit a saved trial. Check the Firestore rules for daily leaderboard entries.');
          if (type === 'accuracy') setAccuracyLeaderboardUnavailable(true);
          else setLeaderboardUnavailable(true);
        }
      } finally {
        if (!cancelled) {
          if (type === 'accuracy') setAccuracyLeaderboardLoading(false);
          else setLeaderboardLoading(false);
        }
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [userId, dailyTrialDate, dailyChallengeAvailable, activeMoreTab, leaderboardRefreshKey]);

  const refreshLeaderboard = (type: 'timeAttack' | 'accuracy') => {
    if (type === 'timeAttack') setLeaderboardLoading(true);
    else setAccuracyLeaderboardLoading(true);
    setLeaderboardRefreshKey(key => key + 1);
  };

  const toggleMoreTab = (tab: 'progress' | 'badges' | 'leaderboard' | 'accuracyLeaderboard' | 'brief') => {
    const next = activeMoreTab === tab ? null : tab;
    if (next === 'leaderboard' && dailyChallengeAvailable) {
      setLeaderboardLoading(true);
      setLeaderboardUnavailable(false);
    }
    if (next === 'accuracyLeaderboard' && dailyChallengeAvailable) {
      setAccuracyLeaderboardLoading(true);
      setAccuracyLeaderboardUnavailable(false);
    }
    if (next === null) {
      setLeaderboardLoading(false);
      setAccuracyLeaderboardLoading(false);
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
    ...(dailyChallengeAvailable ? [{ id: 'leaderboard' as const, label: 'Time Attack leaderboard' }] : []),
    ...(dailyChallengeAvailable ? [{ id: 'accuracyLeaderboard' as const, label: 'Accuracy leaderboard' }] : []),
    ...(!isNewUser && SECURITY_BRIEF_ITEMS.length > 0 ? [{ id: 'brief' as const, label: 'Security Brief' }] : [])
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
  const heroTitle = resumeActivityLabel
    ? resumeActivityLabel
    : currentTierScore?.preTestScore === undefined
    ? `Start your ${currentTier[0]}${currentTier.slice(1).toLowerCase()} pre-test`
    : nextMission
      ? `Continue: ${nextMission.title}`
      : `Take the ${currentTier[0]}${currentTier.slice(1).toLowerCase()} post-test`;
  const heroDescription = isNewUser
    ? pathDescription
    : nextMission?.learningGoal ?? `Complete the ${currentTier} post-test to finish this certification tier.`;

  return (
    <div className="game-screen dashboard-layout mx-auto min-h-full w-full max-w-7xl space-y-7 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <GameCard className="continue-hero dashboard-command-center relative isolate overflow-hidden p-5 sm:p-8 lg:p-10">
        <img src={dashboardHeroImage} alt="" aria-hidden="true" loading="lazy" decoding="async" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right opacity-100" />
        {!isNewUser && SECURITY_BRIEF_ITEMS.length > 0 && <div className="absolute right-6 top-6 z-10 hidden w-72 xl:block"><SecurityBrief /></div>}
        <div className="relative z-10">
        <p className="game-eyebrow">Next step · {currentTier}</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-bold leading-tight text-[var(--game-text)] sm:text-4xl">{heroTitle}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--game-muted)]">{heroDescription}</p>
        {!isNewUser && <p className="mt-3 text-xs leading-5 text-[var(--game-muted)]">Learning study · all commands are simulated · progress and attempt data are saved.</p>}
        {!isNewUser && nextMission && <p className="mt-3 text-sm text-[var(--game-muted)]">{nextMission.difficulty} mission · about {Math.max(3, Math.ceil(nextMission.steps.length * 1.5))} min</p>}
        {!isNewUser && <ProgressBar value={tierProgressPercent} label={`${currentTier} mission progress`} className="mt-5 max-w-2xl" />}
        <div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={onContinue} className="min-h-12 rounded-md bg-[var(--game-green)] px-6 py-3 text-sm font-bold text-black shadow-md transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)] focus-visible:ring-offset-2">{resumeActivityLabel ?? (currentTierScore?.preTestScore === undefined ? 'Start pre-test' : 'Continue training')} <ChevronRight size={16} className="ml-1 inline" /></button>{resumeActivityLabel === 'Resume replay' && onContinueNextMission && nextMission && <button type="button" onClick={onContinueNextMission} className="min-h-12 rounded-md border border-[var(--game-cyan)] px-5 py-3 text-sm font-bold text-[var(--game-cyan)] hover:bg-[var(--game-cyan)] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">Continue to next mission</button>}</div>
        </div>
      </GameCard>

      {user && !cosmetics.welcomeRewardClaimed && !isLoadingProgress && !progressLoadFailed && <GameCard className="welcome-theme-gift flex flex-col gap-4 border-[var(--game-cyan)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="game-eyebrow text-[var(--game-cyan)]">A welcome gift from Nova</p>
          <h2 className="mt-1 text-xl font-black text-[var(--game-text)]">Your Harborview Night terminal theme is ready</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--game-muted)]">Claim your free Harborview Night palette. It will be added to your collection and equipped right away; you can change it later in the Shop.</p>
          {welcomeRewardError && <p className="mt-2 text-sm text-[var(--game-red)]" role="alert">{welcomeRewardError}</p>}
        </div>
        <button type="button" disabled={welcomeRewardBusy} onClick={() => {
          setWelcomeRewardBusy(true);
          setWelcomeRewardError('');
          setWelcomeRewardSuccess(false);
          void onClaimWelcomeReward()
            .then(() => setWelcomeRewardSuccess(true))
            .catch(error => setWelcomeRewardError(error instanceof Error ? error.message : 'The welcome gift could not be claimed. Please try again.'))
            .finally(() => setWelcomeRewardBusy(false));
        }} className="min-h-11 shrink-0 border border-[var(--game-cyan)] bg-[var(--game-cyan)]/10 px-5 py-3 text-sm font-black text-[var(--game-cyan)] transition hover:bg-[var(--game-cyan)] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)] disabled:cursor-wait disabled:opacity-60">{welcomeRewardBusy ? 'Claiming gift…' : 'Claim & equip theme'}</button>
      </GameCard>}

      {welcomeRewardSuccess && <div className="game-card flex items-start justify-between gap-4 border-[var(--game-green)] p-4" role="status" aria-live="polite">
        <div>
          <p className="font-bold text-[var(--game-green)]">Welcome gift unlocked!</p>
          <p className="mt-1 text-sm text-[var(--game-text)]">Harborview Night is now in your collection and equipped as your terminal theme. Find it anytime in the Shop.</p>
        </div>
        <button type="button" onClick={() => setWelcomeRewardSuccess(false)} className="shrink-0 px-2 py-1 text-sm font-bold text-[var(--game-muted)] hover:text-[var(--game-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]" aria-label="Dismiss welcome gift confirmation">Dismiss</button>
      </div>}

      {user && <DailyQuickDrill key={`${user.uid}-${dailyTrialDate}`} uid={user.uid} dateKey={dailyTrialDate} />}

      {!isNewUser && !isLoadingProgress && <div className="game-card grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 p-3 sm:gap-4 sm:p-4" aria-label="Training status">
        <div className="min-w-0"><div className="flex flex-col text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-2"><span className="truncate font-semibold text-[var(--game-text)]">{rank.current.name}</span><span className="whitespace-nowrap text-[var(--game-muted)]">{progression.xp}{rank.next ? `/${rank.next.threshold}` : ''} XP</span></div><div role="img" aria-label={rank.next ? `${rank.percent}% progress to ${rank.next.name}` : 'Maximum rank'}><ProgressBar value={rank.percent} className="mt-2" /></div></div>
        <p className="whitespace-nowrap rounded-full border border-[var(--game-border)] px-2 py-2 text-center text-xs font-semibold text-[var(--game-text)] sm:px-3">{progression.streak.current}d streak</p>
        <p className="whitespace-nowrap text-right text-xs text-[var(--game-text)]"><span className="font-semibold">{currentTierCompleted}/{currentTierMissions.length}</span><span className="block sm:inline sm:pl-1">missions</span></p>
      </div>}

      {!isNewUser && <>
        {dailyChallengeAvailable && <section className="daily-challenge-grid" aria-label="Daily challenges">
          <GameCard className="daily-challenge-card daily-time-card relative isolate overflow-hidden border-[var(--game-cyan)]" aria-label="Daily Time Attack">
            <img src={dailyTimeAttackImage} alt="" aria-hidden="true" loading="lazy" decoding="async" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
            <div className="daily-card-shade" aria-hidden="true" />
            <div className="daily-card-copy">
              <p className="game-eyebrow">Daily Time Attack · one attempt</p>
              <h2 className="daily-card-title" aria-label={dailyTimeAttackMissionTitle}><DailySplitText text={dailyTimeAttackMissionTitle} split="characters" /></h2>
              <p className="daily-card-description" aria-label="Clear today’s timed case for a place on the Time Attack leaderboard."><DailySplitText text="Clear today’s timed case for a place on the Time Attack leaderboard." split="words" /></p>
              <button type="button" disabled={dailyTimeAttackPlayed || progressLoadFailed} onClick={() => onStartDailyTrial('timeAttack')} className="min-h-11 w-full border border-[var(--game-cyan)] bg-[var(--game-surface)]/90 px-4 py-2 text-sm font-semibold text-[var(--game-text)] transition hover:bg-[var(--game-cyan)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)] disabled:cursor-not-allowed disabled:opacity-50">{dailyTimeAttackPlayed ? 'Attempt used today' : 'Start Time Attack'}</button>
            </div>
          </GameCard>
          <GameCard className="daily-challenge-card daily-accuracy-card relative isolate overflow-hidden border-[var(--game-green)]" aria-label="Daily Accuracy Trial">
            <img src={dailyAccuracyImage} alt="" aria-hidden="true" loading="lazy" decoding="async" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
            <div className="daily-card-shade" aria-hidden="true" />
            <div className="daily-card-copy">
              <p className="game-eyebrow">Daily Accuracy Trial · one attempt</p>
              <h2 className="daily-card-title" aria-label={dailyAccuracyMissionTitle}><DailySplitText text={dailyAccuracyMissionTitle} split="characters" /></h2>
              <p className="daily-card-description" aria-label="Work carefully through today’s untimed case. Accuracy is tracked independently from your Time Attack."><DailySplitText text="Work carefully through today’s untimed case. Accuracy is tracked independently from your Time Attack." split="words" /></p>
              <button type="button" disabled={dailyAccuracyPlayed || progressLoadFailed} onClick={() => onStartDailyTrial('accuracy')} className="min-h-11 w-full border border-[var(--game-green)] bg-[var(--game-surface)]/90 px-4 py-2 text-sm font-semibold text-[var(--game-text)] transition hover:bg-[var(--game-green)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)] disabled:cursor-not-allowed disabled:opacity-50">{dailyAccuracyPlayed ? 'Attempt used today' : 'Start Accuracy Trial'}</button>
            </div>
          </GameCard>
        </section>}

        <GameCard className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="shrink-0 text-sm font-semibold text-[var(--game-text)]">More</span>
              <div role="tablist" aria-label="Dashboard details" aria-orientation="horizontal" onKeyDown={handleMoreTabKeyDown} className="flex min-w-0 gap-1 overflow-x-auto scrollbar-hide">
                {visibleMoreTabs.map(tab => <button key={tab.id} id={`dashboard-tab-${tab.id}`} type="button" role="tab" aria-selected={activeMoreTab === tab.id} aria-controls="dashboard-more-panel" onClick={() => toggleMoreTab(tab.id)} className={`min-h-11 shrink-0 rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)] ${tab.id === 'brief' ? 'xl:hidden' : ''} ${activeMoreTab === tab.id ? 'border-[var(--game-cyan)] bg-[var(--game-cyan)]/10 text-[var(--game-text)]' : 'border-[var(--game-border)] text-[var(--game-muted)] hover:bg-[var(--game-track)]'}`}>
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
                <div className="space-y-3">{(['BEGINNER', 'INTERMEDIATE', 'EXPERT'] as const).filter(tier => userScores[tier]?.preTestScore !== undefined || userScores[tier]?.finalScore !== undefined).map(tier => { const data = userScores[tier]; const gain = gainForTier(data); const prePercent = data?.preTestScore !== undefined ? Math.round(((data.preTestFirstScore ?? data.preTestScore) / Math.max(1, data.preTestFirstTotal ?? data.preTestTotal ?? 1)) * 100) : null; const postPercent = data?.finalScore !== undefined ? Math.round(((data.firstFinalScore ?? data.finalScore) / Math.max(1, data.firstFinalTotal ?? data.finalTotal ?? 1)) * 100) : null; return <div key={tier} className="grid gap-3 rounded-md border border-[var(--game-border)] p-3 text-sm sm:grid-cols-[100px_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center"><span className="font-semibold text-[var(--game-text)]">{tier}</span><div className="space-y-2"><div className="flex justify-between gap-2 text-xs"><span className="text-[var(--game-muted)]">Pre-test · first attempt</span><span className="font-semibold text-[var(--game-text)]">{prePercent === null ? 'Not taken' : `${prePercent}%`}</span></div><div className="relative h-2 overflow-visible bg-[var(--game-track)]" role="img" aria-label={prePercent === null ? 'Pre-test not taken' : `First-attempt pre-test score ${prePercent} percent; pass reference 70 percent`}><span className="absolute inset-y-0 left-[70%] z-[1] border-l border-dashed border-[var(--game-amber)]" aria-hidden="true" /><motion.span initial={reduceMotion ? false : { width: 0 }} animate={{ width: `${prePercent ?? 0}%` }} transition={{ duration: reduceMotion ? 0 : 0.7, ease: 'easeOut' }} className="block h-full bg-[var(--game-cyan)]" /></div></div><div className="space-y-2"><div className="flex justify-between gap-2 text-xs"><span className="text-[var(--game-muted)]">Post-test · first attempt</span><span className="font-semibold text-[var(--game-text)]">{postPercent === null ? 'Not taken' : `${postPercent}%`}</span></div><div className="relative h-2 overflow-visible bg-[var(--game-track)]" role="img" aria-label={postPercent === null ? 'Post-test not taken' : `First-attempt post-test score ${postPercent} percent; pass reference 70 percent`}><span className="absolute inset-y-0 left-[70%] z-[1] border-l border-dashed border-[var(--game-amber)]" aria-hidden="true" /><motion.span initial={reduceMotion ? false : { width: 0 }} animate={{ width: `${postPercent ?? 0}%` }} transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.12, ease: 'easeOut' }} className="block h-full bg-[var(--game-green)]" /></div></div>{showLearningGain && gain !== null && <span className="font-semibold text-[var(--game-text)]">{gain > 0 ? '+' : ''}{gain} pp</span>}</div>; })}</div>
                <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--game-muted)]"><span><span className="mr-1 inline-block h-2 w-2 bg-[var(--game-cyan)]" />Pre-test</span><span><span className="mr-1 inline-block h-2 w-2 bg-[var(--game-green)]" />Post-test</span><span><span className="mr-1 inline-block h-3 border-l border-dashed border-[var(--game-amber)] align-middle" />70% pass reference</span><span>First attempts shown for comparison.</span></p>
                <p className="text-xs leading-5 text-[var(--game-muted)]">Gain compares first pre-test and first post-test attempts when recorded; older records use their saved scores. This is descriptive and does not change certification scoring.</p>
                <button type="button" onClick={() => setScreen('profile')} className="min-h-11 text-sm font-semibold text-[var(--game-text)] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-green)]">View all results in Profile</button>
              </div>}
              {activeMoreTab === 'badges' && <div id="dashboard-badge-peek" className="space-y-3" aria-label="Badge preview">
                <div><h2 className="text-base font-bold text-[var(--game-text)]">{progression.badges.length} of {ACHIEVEMENTS.filter(item => item.active).length} badges earned</h2><p className="mt-1 text-sm text-[var(--game-muted)]">A quick look at your achievements.</p></div>
                <div className="flex flex-wrap items-center gap-3">{badgePeek.map(achievement => { const Icon = achievement.icon === 'shield' ? Shield : achievement.icon === 'target' ? Target : achievement.icon === 'sparkles' ? Activity : Award; const earned = progression.badges.includes(achievement.id); return <span key={achievement.id} title={achievement.name} aria-label={`${achievement.name}${earned ? ', earned' : ', next up'}`} className={`inline-flex h-10 w-10 items-center justify-center rounded-full border ${earned ? 'border-[var(--game-green)] text-[var(--game-green)]' : 'border-[var(--game-border)] text-[var(--game-muted)]'}`}><Icon size={18} aria-hidden="true" /></span>; })}</div>
                <button type="button" onClick={() => setScreen('profile')} className="min-h-11 text-sm font-semibold text-[var(--game-text)] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-green)]">View all badges in Profile</button>
              </div>}
              {activeMoreTab === 'leaderboard' && <div id="dashboard-leaderboard" className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-base font-bold text-[var(--game-text)]">Today’s Time Attack leaderboard</h2><p className="text-sm text-[var(--game-muted)]">{dailyTrialDate} · {dailyTimeAttackMissionTitle}</p></div><div className="flex items-center gap-3"><p className="text-xs text-[var(--game-muted)]">Daily clears appear automatically with your profile name. Email stays private.</p><button type="button" onClick={() => refreshLeaderboard('timeAttack')} disabled={leaderboardLoading} className="min-h-10 rounded-md border border-[var(--game-border)] px-3 text-xs font-semibold text-[var(--game-text)] hover:border-[var(--game-green)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-green)] disabled:opacity-60">{leaderboardLoading ? 'Refreshing…' : 'Refresh'}</button></div></div>
                {leaderboardSubmitMessage && <p className="mt-2 text-xs text-[var(--game-muted)]" role="status">{leaderboardSubmitMessage}</p>}
                <p className="text-xs text-[var(--game-muted)]">Speed is a challenge only; certification progress rewards evidence and accuracy.</p>
                {leaderboardLoading ? <p className="text-sm text-[var(--game-muted)]">Loading entries…</p> : leaderboardUnavailable ? <p className="text-sm text-[var(--game-muted)]">Could not load entries. Check sign-in and the dailyTimeAttackEntries read rule.</p> : leaderboard.length === 0 ? <p className="text-sm text-[var(--game-muted)]">No one has completed today’s Time Attack yet.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left text-sm"><thead className="text-xs text-[var(--game-muted)]"><tr><th className="pb-2 pr-3">Rank</th><th className="pb-2 pr-3">Player</th><th className="pb-2">Clear time</th></tr></thead><tbody>{leaderboard.map((entry, index) => <tr key={`${entry.uid}-${index}`} className="border-t border-[var(--game-border)] text-[var(--game-text)]"><td className="py-2 pr-3 font-semibold">#{index + 1}</td><td className="py-2 pr-3"><div className="flex items-center gap-2">{entry.avatarId ? <Avatar avatarId={entry.avatarId} alt={`${entry.nickname}'s avatar: ${getAvatarById(entry.avatarId).label}`} /> : <span role="img" aria-label="No avatar selected" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--game-border)] bg-[var(--game-track)] text-lg font-bold text-[var(--game-muted)]">?</span>}<span>{entry.nickname}{entry.uid === userId ? ' · YOU' : ''}</span></div></td><td className="py-2 font-semibold">{Math.floor(entry.clearTimeSeconds / 60)}:{String(entry.clearTimeSeconds % 60).padStart(2, '0')}</td></tr>)}</tbody></table></div>}
                <p className="text-xs text-[var(--game-muted)]">Entries are submitted by the game client and are not tamper-proof.</p>
              </div>}
              {activeMoreTab === 'accuracyLeaderboard' && <div id="dashboard-accuracy-leaderboard" className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-base font-bold text-[var(--game-text)]">Today’s Accuracy leaderboard</h2><p className="text-sm text-[var(--game-muted)]">{dailyTrialDate} · {dailyAccuracyMissionTitle}</p></div><button type="button" onClick={() => refreshLeaderboard('accuracy')} disabled={accuracyLeaderboardLoading} className="min-h-10 self-start rounded-md border border-[var(--game-border)] px-3 text-xs font-semibold text-[var(--game-text)] hover:border-[var(--game-green)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-green)] disabled:opacity-60 sm:self-auto">{accuracyLeaderboardLoading ? 'Refreshing…' : 'Refresh'}</button></div>
                {leaderboardSubmitMessage && <p className="mt-2 text-xs text-[var(--game-muted)]" role="status">{leaderboardSubmitMessage}</p>}
                <p className="rounded border border-[var(--game-border)] bg-[var(--game-surface-raised)] p-3 text-xs leading-5 text-[var(--game-muted)]">Score starts at 100; subtract 5 per wrong command, 10 per wrong decision, and 5 per hint level shown (minimum 0). Ties go to the earlier completion.</p>
                {accuracyLeaderboardLoading ? <p className="text-sm text-[var(--game-muted)]">Loading entries…</p> : accuracyLeaderboardUnavailable ? <p className="text-sm text-[var(--game-muted)]">Could not load entries. Check sign-in and the dailyAccuracyEntries read rule.</p> : accuracyLeaderboard.length === 0 ? <p className="text-sm text-[var(--game-muted)]">No one has completed today’s Accuracy trial yet.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[400px] text-left text-sm"><thead className="text-xs text-[var(--game-muted)]"><tr><th className="pb-2 pr-3">Rank</th><th className="pb-2 pr-3">Player</th><th className="pb-2 pr-3">Accuracy</th><th className="pb-2">Completed</th></tr></thead><tbody>{accuracyLeaderboard.map((entry, index) => <tr key={`${entry.uid}-${index}`} className="border-t border-[var(--game-border)] text-[var(--game-text)]"><td className="py-2 pr-3 font-semibold">#{index + 1}</td><td className="py-2 pr-3">{entry.nickname}{entry.uid === userId ? ' · YOU' : ''}</td><td className="py-2 pr-3 font-bold">{entry.accuracyScore}</td><td className="py-2"><time dateTime={entry.completedAt}>{new Date(entry.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></td></tr>)}</tbody></table></div>}
              </div>}
              {activeMoreTab === 'brief' && !isNewUser && <div className="xl:hidden"><SecurityBrief /></div>}
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
    isPreTest?: boolean,
    metadata?: { startedAt?: string; timedOut: boolean; answeredCount: number }
  ) => Promise<void>;
  onSessionReady?: (session: Record<string, unknown>) => void;

  onStartMission: (
    missionId: string
  ) => void;

  completedMissions: string[];
  progression: PlayerProgression;
  activeSession?: Record<string, unknown> | null;
  campaignProgress: CampaignProgress;
  assessmentProgress: Record<Tier, { preTestComplete: boolean; postTestComplete: boolean }>;
  unlockedTiers: Record<Tier, boolean>;
  skipStoryScenes: boolean;
  progressLoadFailed: boolean;
  onCompleteCampaignNode: (nodeId: string) => void;
  onCompleteStoryActivity: (nodeId: string, result: ActivityResult) => Promise<{ rewarded: boolean; xp: number; coins: number }>;
}

export const AcademyScreen = ({
  activeTier,
  setActiveTier,
  userScores,
  handleQuizComplete,
  onSessionReady,
  onStartMission,
  completedMissions,
  progression,
  activeSession,
  campaignProgress,
  assessmentProgress,
  unlockedTiers,
  skipStoryScenes,
  progressLoadFailed,
  onCompleteCampaignNode,
  onCompleteStoryActivity
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
        key={activeTier}
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
          score: number,
          total: number,
          isPreTest?: boolean,
          metadata?: { startedAt?: string; timedOut: boolean; answeredCount: number }
        ) => {
          void handleQuizComplete(
            activeTier,
            score,
            total,
            isPreTest,
            metadata
          );
        }}
        onSessionReady={onSessionReady}
        onStartMission={
          onStartMission
        }
        completedMissions={
          completedMissions
        }
        progression={progression}
        userScores={
          userScores
        }
        activeSession={activeSession}
        campaignProgress={campaignProgress}
        assessmentProgress={assessmentProgress}
        unlockedTiers={unlockedTiers}
        skipStoryScenes={skipStoryScenes}
        progressLoadFailed={progressLoadFailed}
        onCompleteCampaignNode={onCompleteCampaignNode}
        onCompleteStoryActivity={onCompleteStoryActivity}
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

        <div className="mt-4 border-l-2 border-[var(--game-cyan)] bg-[var(--game-surface)]/80 p-4" aria-label="Campaign briefing">
          <p className="game-eyebrow">Campaign · the incident desk</p>
          <p className="mt-1 text-sm font-bold text-[var(--game-text)]">Start with context, build a defensible finding, then coordinate a careful response.</p>
          <p className="mt-1 text-sm leading-5 text-[var(--game-muted)]">Beginner introduces the analyst workflow, Intermediate connects system and network evidence, and Expert asks you to correlate an incident and report what is known and unknown.</p>
        </div>

      </div>

      <div className="academy-tier-route grid gap-6 lg:grid-cols-3" aria-label="Certification chapter route">

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
                data-tier={tier.id.toLowerCase()}
                className={`academy-tier-card relative isolate min-h-44 overflow-hidden border ${tier.border} bg-black/60 p-5 sm:p-6 lg:min-h-[560px]`}
              >

                {TIER_CARD_IMAGES[tier.id] && (
                  <img
                    src={TIER_CARD_IMAGES[tier.id]}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className={`pointer-events-none absolute inset-0 h-full w-full object-cover object-right ${locked ? 'grayscale opacity-55' : 'opacity-100'}`}
                  />
                )}

                <div className="relative z-10 flex h-full flex-col gap-6 md:flex-row md:items-center md:justify-between lg:flex-col lg:items-stretch lg:justify-between">

                  <div className="flex min-w-0 flex-1 gap-4">

                    <div
                      className={`w-14 h-14 border ${tier.border} flex items-center justify-center ${tier.color} font-black`}
                    >
                      {
                        tier.number
                      }
                    </div>

                    <div className="min-w-0 flex-1 lg:max-w-none">

                      <h2
                        data-glitch-text={`${tier.title} CERTIFICATION`}
                        aria-label={`${tier.title} Certification`}
                        className={`academy-tier-title text-xl font-black sm:text-2xl ${tier.color}`}
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
                    <div className="flex cursor-not-allowed items-center gap-2 whitespace-nowrap border border-green-900 bg-[var(--game-surface)]/95 px-6 py-3 text-xs font-black uppercase text-green-300">
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
                      className={`w-full border ${tier.border} bg-[var(--game-surface)]/95 px-4 py-3 text-xs font-black uppercase ${tier.color} transition-colors hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)] lg:mt-auto`}
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
  const [fieldGuideTier, setFieldGuideTier] = useState<Tier | null>(null);
  const [missionFilter, setMissionFilter] = useState<'all' | 'files' | 'network' | 'logs'>(
    'all'
  );
  const missions = [
    ...TUTORIAL_MISSIONS
  ].filter(mission => missionFilter === 'all' || mission.category === missionFilter);
  const completedCount = missions.filter(mission => completedMissions.includes(mission.id)).length;

  return (
    <div className="game-screen operations-layout mx-auto min-h-full w-full max-w-[1480px] space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">

      <section className="operations-header border border-green-500/20 bg-[#08100c] p-6">

        <div className="flex items-center gap-3">

          <Target
            className="text-green-400"
            size={28}
          />

          <div>

            <h1 className="text-3xl font-black text-green-300 uppercase">
              OPERATIONS
            </h1>

            <p className="mt-1 text-sm text-[var(--game-muted)]">
              Practice with standalone missions. Certification training missions are kept in the Academy.
            </p>
            <p className="mt-3 text-sm text-[var(--game-green)]">{`${completedCount} of ${missions.length} shown missions completed`}</p>

          </div>

        </div>

      </section>

      <div className="operations-filters flex flex-wrap gap-2" aria-label="Filter practice missions">
        {([
          ['all', 'ALL PRACTICE'],
          ['files', 'FILES'],
          ['network', 'NETWORK'],
          ['logs', 'TIMELINES'],
        ] as const).map(([filter, label]) => (
          <button
            key={filter}
            onClick={() => setMissionFilter(filter)}
            aria-pressed={missionFilter === filter}
            className={`min-h-11 border px-4 py-2 text-xs font-bold tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-green)] ${missionFilter === filter ? 'border-[var(--game-green)] bg-[var(--game-green)]/10 text-[var(--game-green)]' : 'border-[var(--game-border)] text-[var(--game-muted)] hover:border-[var(--game-green)] hover:text-[var(--game-text)]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="operations-list space-y-4">

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
                data-category={mission.category ?? 'practice'}
                className={`mission-art-card relative isolate overflow-hidden p-5 ${
                  completed
                    ? 'border-[var(--game-green)]'
                    : ''
                }`}
              >

                {PRACTICE_MISSION_IMAGES[mission.id] && (
                  <img
                    src={PRACTICE_MISSION_IMAGES[mission.id]}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="mission-art-image pointer-events-none absolute inset-0 h-full w-full object-cover object-right opacity-75"
                  />
                )}

                <div className="relative z-10">

                <div className="mission-art-card-layout flex min-w-0 flex-col gap-5">

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

                    <div className="mission-art-card-content min-w-0 flex-1">

                      <p className="game-eyebrow">CASE FILE · {String(index + 1).padStart(2, '0')} · {mission.category ?? 'practice'}</p>
                      <h2 data-glitch-text={mission.title} className="mission-art-title mt-1 text-lg font-bold text-[var(--game-text)]">
                        {
                          mission.title
                        }
                      </h2>

                      <p className="mt-1 text-sm leading-6 text-[var(--game-muted)]">
                        {
                          mission.scenario
                        }
                      </p>

                      <p className="mt-3 text-sm leading-6 text-[var(--game-muted)]">
                        {mission.learningGoal}
                      </p>

                      {completed && <span className="mt-3 inline-block rotate-[-2deg] border border-[var(--game-green)]/60 px-2 py-1 text-xs font-bold tracking-[0.12em] text-[var(--game-green)]">RESOLVED</span>}

                      <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--game-muted)] sm:gap-4">

                        <span className="border border-[var(--game-border)] px-2 py-1 uppercase tracking-wider">
                          {mission.category ?? 'practice'} · {mission.difficulty}
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock
                            size={13}
                          />

                          {mission.timerLimit > 0
                            ? `${Math.floor(mission.timerLimit / 60)} MIN TIME LIMIT`
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

                  <div className="mission-art-card-actions flex w-full min-w-0 flex-col gap-2 sm:flex-row lg:w-auto lg:shrink-0">
                    <button
                      type="button"
                      onClick={() => setFieldGuideTier(mission.tier)}
                      aria-label={`Open ${mission.tier.toLowerCase()} command field guide for ${mission.title}`}
                      className="flex min-h-11 items-center justify-center gap-2 border border-[var(--game-cyan)] px-4 py-2 text-xs font-bold uppercase text-[var(--game-cyan)] transition hover:border-[var(--game-cyan)] hover:bg-[var(--game-cyan)] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--game-bg)]"
                    >
                      <BookOpen size={14} />
                      Command field guide
                    </button>
                    <button
                      type="button"
                      onClick={() => startMission(mission)}
                      className="flex min-h-11 items-center justify-center gap-2 border border-[var(--game-green)] px-5 py-2 text-xs font-bold uppercase text-[var(--game-green)] transition hover:-translate-y-0.5 hover:bg-[var(--game-green)] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--game-bg)]"
                    >
                      <Play size={13} />
                      {completed ? 'Replay' : 'Deploy'}
                    </button>
                  </div>

                </div>

                </div>

              </GameCard>
            );
          }
        )}

      </div>

      {fieldGuideTier && (
        <CommandFieldGuide
          tier={fieldGuideTier}
          onClose={() => setFieldGuideTier(null)}
        />
      )}

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
  elapsedSeconds: number;
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
  terminalPaletteId: string;

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
  elapsedSeconds,
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
  terminalPaletteId,
  playSound
}: TerminalScreenProps) => {
  const [command, setCommand] =
    useState('');
  const [introDismissed, setIntroDismissed] = useState(false);

  const [history, setHistory] =
    useState<string[]>([
      'SANDBOX SECURE TERMINAL',
      'Type commands to interact with the simulated environment.',
      ''
    ]);
  const terminalViewportRef = useRef<HTMLDivElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);
  const shouldFollowTerminalRef = useRef(true);
  const missionIntroActive = Boolean(activeMission.intro.trim()) && msg === activeMission.intro && !introDismissed;

  useEffect(() => {
    if (!missionIntroActive) commandInputRef.current?.focus();
  }, [missionIntroActive]);

  useEffect(() => {
    const viewport = terminalViewportRef.current;
    if (!viewport) return;
    const scrollToLatest = () => {
      if (shouldFollowTerminalRef.current) viewport.scrollTop = viewport.scrollHeight;
    };
    scrollToLatest();
    const observer = new ResizeObserver(scrollToLatest);
    observer.observe(viewport);
    const mutationObserver = new MutationObserver(scrollToLatest);
    mutationObserver.observe(viewport, { childList: true, subtree: true, characterData: true });
    return () => { observer.disconnect(); mutationObserver.disconnect(); };
  }, [history, msg]);

  const [inspectedEvidence, setInspectedEvidence] = useState<string[]>([]);
  const [evidenceNotes, setEvidenceNotes] = useState<string[]>([]);
  const [terminatedPids, setTerminatedPids] = useState<string[]>([]);
  const [showCommandGuide, setShowCommandGuide] = useState(false);
  const [showMissionPrimer, setShowMissionPrimer] = useState(false);

  const currentStep = activeMission.steps[Math.min(questStep, activeMission.steps.length - 1)];
  const isCertificationMission = activeMission.id.startsWith('m') || activeMission.id.startsWith('bridge-');
  const traceBackActive = activeMission.id.startsWith('daily-timeAttack-') && isThreatActive && activeMission.timerLimit > 0;
  const intrusionProgress = traceBackActive
    ? Math.min(100, Math.max(0, ((activeMission.timerLimit - timeLeft) / activeMission.timerLimit) * 100))
    : 0;

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
    if (name === 'ping') {
      const host = args[0];
      if (!host) {
        const objectiveHost = currentStep?.cmd.match(/^ping\s+(\S+)$/i)?.[1];
        return `Usage: ping [host]\n${objectiveHost ? `This objective's host is ${objectiveHost}. Type ping and press Tab to complete it.` : 'Add the host address you want to check.'}`;
      }
      return `PING ${host} (simulated)\n3 packets transmitted, 3 received, 0% packet loss\nTraining result only; this does not contact a real host.`;
    }
    if (name === 'nmap') {
      if (!args[0] && currentStep?.cmd.match(/^nmap\s+\S+$/i)) {
        const objectiveHost = currentStep.cmd.match(/^nmap\s+(\S+)$/i)?.[1];
        return `Usage: nmap [host]\nThis objective's host is ${objectiveHost}. Type nmap and press Tab to complete it.`;
      }
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
      if (missionIntroActive) return;
      const trimmed =
        command.trim();

      if (!trimmed) {
        return;
      }

      playSound(
        'keystroke'
      );

      shouldFollowTerminalRef.current = true;

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
    if (missionIntroActive) {
      event.preventDefault();
      return;
    }
    if (event.key === 'Tab') {
      const source = event.currentTarget.value;
      const tokens = splitTerminalArgs(source);
      const commandName = tokens[0]?.toLowerCase() ?? '';
      const isCompletingCommand = !/\s/.test(source);
      const lastSpace = source.lastIndexOf(' ');
      const argumentPrefix = lastSpace < 0 ? '' : source.slice(lastSpace + 1);
      const commandNames = ['help', 'pwd', 'ls', 'cd', 'cat', 'whoami', 'grep', 'journalctl', 'ss', 'netstat', 'ps', 'find', 'stat', 'nmap', 'ping', 'status', 'inspect', 'choose', 'preserve', 'record-evidence', 'assess', 'block', 'disable-service', 'kill', 'crontab', 'remove-persistence', 'report', 'clear'];
      const targetCommand = currentStep?.cmd.match(/^(ping|nmap)\s+(\S+)$/i);
      const inspectTarget = currentStep?.cmd.match(/^inspect\s+(\S+)$/i);
      const reportFinding = commandName === 'report'
        ? currentStep?.cmd.match(/^report\s+(.+)$/i)?.[1]
        : undefined;
      const files = Object.keys(MOCK_FILES);
      const directories = Object.keys(MOCK_FILE_SYSTEM);
      const relativeEntries = MOCK_FILE_SYSTEM[currentPath] ?? [];
      const pathNames = [...new Set([...files, ...directories, ...relativeEntries, ...files.map(path => path.split('/').pop() ?? path)])];
      const candidates = isCompletingCommand
        ? targetCommand && source.trim().toLowerCase() === targetCommand[1].toLowerCase()
          ? [currentStep?.cmd ?? '']
          : inspectTarget && source.trim().toLowerCase() === 'inspect'
            ? [currentStep?.cmd ?? '']
          : commandNames.filter(name => name.startsWith(source.trim().toLowerCase()))
        : ['cat', 'cd', 'grep', 'find', 'stat'].includes(commandName)
          ? pathNames.filter(path => path.startsWith(argumentPrefix))
          : commandName === 'inspect' && inspectTarget
            ? [inspectTarget[1]].filter(target => target.startsWith(argumentPrefix))
          : targetCommand && commandName === targetCommand[1].toLowerCase()
            ? [targetCommand[2]].filter(target => target.startsWith(argumentPrefix))
          : reportFinding
            ? [reportFinding].filter(finding => finding.startsWith(argumentPrefix))
          : [];
      if (candidates.length) {
        event.preventDefault();
        if (candidates.length === 1) {
          const completed = isCompletingCommand
            ? candidates[0]
            : `${source.slice(0, lastSpace + 1)}${candidates[0]}`;
          setCommand(completed);
        } else {
          const commonPrefix = candidates.reduce((prefix, value) => {
            let length = 0;
            while (length < prefix.length && prefix[length] === value[length]) length++;
            return prefix.slice(0, length);
          });
          if (isCompletingCommand && commonPrefix.length > source.length) setCommand(commonPrefix);
          else setHistory(previous => [...previous, `[TAB] Matches: ${candidates.slice(0, 8).join(' · ')}${candidates.length > 8 ? ' · …' : ''}`]);
        }
        return;
      }
    }
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
        const authoredHints = (Array.isArray(currentStep.hint) ? currentStep.hint : [currentStep.hint])
          .map(hint => /^\s*(submit|type|run):/i.test(hint)
            ? 'Use the Command Field Guide for the syntax, then choose the target from the evidence you collected.'
            : hint);
        const conceptNudge = firstHint[command] ?? 'Start with the evidence the objective asks you to compare, then decide what it supports.';
        const commandFamily = command === 'grep' ? 'grep' : command;
        const hints = activeMission.difficulty === 'guided'
          ? [conceptNudge, ...authoredHints]
          : activeMission.difficulty === 'standard'
            ? [conceptNudge, `Command family: ${commandFamily}. Check the field guide for its purpose, syntax, and limits. Select the target and options from the evidence.`]
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
    <div data-terminal-palette={terminalPaletteId} className="terminal-palette mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-[1680px] flex-col gap-3 px-3 py-3 sm:px-5 lg:px-8 lg:py-5 xl:h-full xl:min-h-0 xl:overflow-hidden">

      <div className="shrink-0 border border-green-500/20 bg-[#08100c] p-4">

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
                : activeMission.timerLimit > 0 ? 'TIMER STOPPED' : 'UNTIMED TRIAL'}

            </div>

            {activeMission.softTimeTarget !== undefined && <p className="text-xs leading-5 text-slate-300">
              Elapsed {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, '0')} · pace target {Math.floor(activeMission.softTimeTarget / 60)} min
              {elapsedSeconds > activeMission.softTimeTarget && <span className="ml-2 block text-slate-400">Take your time. The pace target has passed, but you can keep going.</span>}
            </p>}

          </div>

        </div>

        {traceBackActive && <div className="mt-4 border-t border-red-900/50 pt-3" aria-label="Trace-Back intrusion progress">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wider text-red-300"><span>Trace-Back · intruder progress</span><span>{Math.round(intrusionProgress)}%</span></div>
          <div className="h-2 overflow-hidden border border-red-900/70 bg-red-950/40" role="progressbar" aria-label="Intruder progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(intrusionProgress)}>
            <div className="h-full bg-red-500 transition-[width] duration-500" style={{ width: `${intrusionProgress}%` }} />
          </div>
          <p className="mt-1 text-xs text-red-200/90">Unknown or incorrect commands cost 5 seconds. Investigate before responding.</p>
        </div>}

      </div>

        <div className="grid grid-cols-1 gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1fr)_minmax(340px,390px)] xl:overflow-hidden 2xl:gap-5">

        <div className="terminal-window flex min-h-[55dvh] flex-col overflow-hidden border border-green-500/20 bg-black xl:min-h-0">

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

          <div ref={terminalViewportRef} onScroll={event => {
            const element = event.currentTarget;
            shouldFollowTerminalRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 40;
          }} className="terminal-output h-[50dvh] min-h-0 flex-1 overflow-y-auto p-4 font-mono text-sm lg:p-5 xl:h-auto">

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
                {msg === activeMission.intro ? (
                  introDismissed ? null : <DialogueBox
                    key={`terminal-intro-${activeMission.id}-${sysNonce}`}
                    sceneLabel="Mission introduction from Nova"
                    className="text-left"
                    modal
                    onComplete={() => setIntroDismissed(true)}
                    beats={[{ id: `terminal-intro-${activeMission.id}`, speaker: 'Nova', role: 'Senior analyst · your mentor', pose: 'talking', text: msg.replace(/^HANDLER:\s*/i, '') }]}
                  />
                ) : <TypewriterText key={sysNonce} text={msg} />}
              </div>
            )}

          </div>

          <div className="terminal-input-dock shrink-0 border-t border-green-900/70 p-3 font-mono text-sm lg:px-5">
            <div className="flex min-w-0 items-center">

              <span className="text-green-500 mr-2">
                operator@secure:
                {
                  currentPath
                }$
              </span>

              <input
                ref={commandInputRef}
                value={
                  command
                }
                disabled={missionIntroActive}
                onChange={e =>
                  setCommand(
                    e.target.value
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                onFocus={() => { shouldFollowTerminalRef.current = true; }}
                aria-label="Enter a simulated terminal command"
                title="Press Tab to complete a command or file path. After typing report and a space, press Tab to complete the current finding."
                placeholder="type a command…"
                className="min-w-0 flex-1 bg-transparent outline-none text-green-300 placeholder:text-green-900 disabled:cursor-not-allowed disabled:opacity-50"
                autoCapitalize="off"
                autoCorrect="off"
                inputMode="text"
                enterKeyHint="send"
                autoFocus
              />

              <button
                type="button"
                onClick={executeCommand}
                disabled={missionIntroActive}
                className="ml-3 border border-green-800 px-3 py-1 text-[10px] font-bold text-green-400 hover:border-green-400 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
              >
                RUN
              </button>

            </div>
          </div>

        </div>

        <div className="min-h-0 space-y-3 overflow-y-auto xl:pr-1">

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
            <details className="border border-blue-500/30 bg-[#071014]">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-bold tracking-widest text-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                <span>INVESTIGATION BOARD</span>
                <span className="text-[11px] font-normal tracking-normal text-blue-300">{activeMission.evidence.length} clues · expand to inspect</span>
              </summary>
              <div className="max-h-72 space-y-2 overflow-y-auto border-t border-blue-900/60 p-4 pr-3">
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
            </details>
          )}

          <details className="border border-green-500/30 bg-[#08100c]">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-bold tracking-widest text-green-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400">
              <span>MISSION TOOLS</span>
              <span className="text-[11px] font-normal tracking-normal text-green-300">Hint · Map · Commands · Guides</span>
            </summary>
            <div className="grid grid-cols-2 gap-2 border-t border-green-900/60 p-3 sm:grid-cols-3">

            <button
              onClick={
                showCurrentHint
              }
              className="inline-flex min-h-10 items-center justify-center gap-2 border border-green-500/30 bg-black/30 px-3 py-2 text-xs font-semibold text-green-300 hover:border-green-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
            >
              <HelpCircle size={15} aria-hidden="true" />
              HINT
            </button>

            <button
              onClick={() =>
                setShowMap(
                  true
                )
              }
              className="inline-flex min-h-10 items-center justify-center gap-2 border border-green-500/30 bg-black/30 px-3 py-2 text-xs font-semibold text-green-300 hover:border-green-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
            >
              <Wifi size={15} aria-hidden="true" />
              MAP
            </button>

            <button
              onClick={showCommandHelp}
              className="inline-flex min-h-10 items-center justify-center gap-2 border border-green-500/30 bg-black/30 px-3 py-2 text-xs font-semibold text-green-300 hover:border-green-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
            >
              <BookOpen size={15} aria-hidden="true" />
              HELP
            </button>

            {isCertificationMission && <button
              onClick={() => setShowCommandGuide(true)}
              className="inline-flex min-h-10 min-w-0 items-center justify-center gap-2 border border-cyan-500/60 bg-cyan-950/30 px-3 py-2 text-center text-xs font-bold leading-4 text-cyan-200 transition-colors hover:border-cyan-300 hover:bg-cyan-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <BookOpen size={15} aria-hidden="true" />
              COMMAND GUIDE
            </button>}

            {isCertificationMission && <button
              onClick={onShowMissionGuide}
              className="inline-flex min-h-10 items-center justify-center gap-2 border border-cyan-700/50 bg-[#071014] px-3 py-2 text-xs font-semibold text-cyan-300 hover:border-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <HelpCircle size={15} aria-hidden="true" />
              SCREEN GUIDE
            </button>}

            {activeMission.primer && <button
              onClick={() => setShowMissionPrimer(true)}
              className="inline-flex min-h-10 items-center justify-center gap-2 border border-cyan-700/50 bg-[#071014] px-3 py-2 text-xs font-semibold text-cyan-300 hover:border-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <BookOpen size={15} aria-hidden="true" />
              GLOSSARY
            </button>}

            </div>
          </details>

          <details className="border border-green-500/20 bg-[#08100c]">
            <summary className="min-h-11 cursor-pointer px-4 py-3 text-xs font-bold tracking-widest text-green-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400">SYSTEM STATUS</summary>

            <div className="space-y-2 border-t border-green-900/60 p-4 text-xs">

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

          </details>

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
  view: 'profile' | 'shop';
  user: FirebaseUser | null;

  userScores: Record<
    string,
    TierScoreLike
  >;
  progression: PlayerProgression;
  completedMissions: string[];
  onProgressionChange: (progression: PlayerProgression) => void;
  avatarId: AvatarId;
  cosmetics: PlayerCosmetics;
  onPurchaseCosmetic: (kind: CosmeticKind, itemId: string) => Promise<void>;
  onEquipCosmetic: (kind: CosmeticKind, itemId: string) => Promise<void>;
  progressLoadFailed: boolean;
  onSaveAvatarChoice: (avatarId: AvatarId) => Promise<void>;
  certificates: UserCertificate[];
  onViewCertificate: (certificate: UserCertificate) => void;

}

export const ProfileScreen = ({
  view,
  user,
  userScores,
  progression,
  completedMissions,
  onProgressionChange,
  avatarId,
  cosmetics,
  onPurchaseCosmetic,
  onEquipCosmetic,
  progressLoadFailed,
  onSaveAvatarChoice,
  certificates,
  onViewCertificate
}: ProfileScreenProps) => {
  const reduceMotion = useReducedMotion();
  const [exportMessage, setExportMessage] = useState('');
  const [archive, setArchive] = useState<MissionAttemptRecord[]>([]);
  const [allMissionAttempts, setAllMissionAttempts] = useState<MissionAttemptRecord[]>([]);
  const [archiveCompletionCounts, setArchiveCompletionCounts] = useState<Record<string, number>>({});
  const [assessmentAttemptCount, setAssessmentAttemptCount] = useState(0);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<{ uid: string; id: AvatarId } | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const [artworkPreview, setArtworkPreview] = useState<{ title: string; src: string; alt: string } | null>(null);
  const [cosmeticMessage, setCosmeticMessage] = useState('');
  const [cosmeticBusyId, setCosmeticBusyId] = useState('');
  const [activeProfileSection, setActiveProfileSection] = useState<'overview' | 'progress' | 'skills' | 'achievements' | 'certificates' | 'leaderboards'>('overview');
  const avatarOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedAvatarId = localAvatar?.uid === user?.uid ? localAvatar?.id ?? getAvatarById(avatarId).id : getAvatarById(avatarId).id;
  const equippedCosmeticId = (kind: CosmeticKind) => kind === 'frame' ? cosmetics.equippedFrameId : kind === 'palette' ? cosmetics.equippedPaletteId : cosmetics.equippedTitleId;
  const ownedCosmeticIds = (kind: CosmeticKind) => kind === 'frame' ? cosmetics.ownedFrameIds : kind === 'palette' ? cosmetics.ownedPaletteIds : cosmetics.ownedTitleIds;
  const handleCosmeticAction = async (kind: CosmeticKind, itemId: string) => {
    if (!user || progressLoadFailed || cosmeticBusyId) return;
    const owned = ownedCosmeticIds(kind).includes(itemId);
    setCosmeticBusyId(itemId);
    setCosmeticMessage('');
    try {
      if (!owned) {
        await onPurchaseCosmetic(kind, itemId);
        setCosmeticMessage('Purchase complete. Equip your new cosmetic when you are ready.');
      } else {
        await onEquipCosmetic(kind, itemId);
        setCosmeticMessage('Cosmetic equipped.');
      }
    } catch (error) {
      setCosmeticMessage(error instanceof Error ? error.message : 'Could not update your cosmetics. Try again.');
    } finally {
      setCosmeticBusyId('');
    }
  };

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
      if (cancelled) return;
      const latestByMission = new Map<string, MissionAttemptRecord>();
      const completionCounts: Record<string, number> = {};
      for (const attempt of attempts.filter(item => item.outcome === 'completed')) {
        completionCounts[attempt.missionId] = (completionCounts[attempt.missionId] ?? 0) + 1;
        const previous = latestByMission.get(attempt.missionId);
        if (!previous || previous.completedAt < attempt.completedAt) latestByMission.set(attempt.missionId, attempt);
      }
      setArchiveCompletionCounts(completionCounts);
      setAllMissionAttempts(attempts);
      setArchive([...latestByMission.values()].sort((a, b) => b.completedAt.localeCompare(a.completedAt)));
    }).catch(error => console.warn('Could not load mission history:', error));
    void getAssessmentAttempts(user.uid).then(attempts => {
      if (!cancelled) setAssessmentAttemptCount(attempts.length);
    }).catch(error => console.warn('Could not load assessment attempts:', error));
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
    .filter((entry): entry is { tier: Tier; data: TierScoreLike; gain: number | null } => Boolean(
      entry.data && (entry.data.preTestScore !== undefined || entry.data.finalScore !== undefined)
    ));
  const certificationsPassed = (['BEGINNER', 'INTERMEDIATE', 'EXPERT'] as const).filter(tier => {
    const score = userScores[tier];
    return Boolean(score?.finalTotal && (score.finalScore ?? 0) / score.finalTotal >= 0.7);
  }).length;

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
        const url = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      };
      if (attempts.length) {
        const fields = [['Mission ID', 'missionId'], ['Mission title', 'missionTitle'], ['Tier', 'tier'], ['Learning concept', 'concept'], ['Outcome', 'outcome'], ['Started at', 'startedAt'], ['Completed at', 'completedAt'], ['Time (seconds)', 'totalTimeSeconds'], ['Hints opened', 'hintsOpened'], ['Hint levels shown', 'hintLevelsShown'], ['Time per step (seconds)', 'timePerStepSeconds'], ['Wrong commands by step', 'wrongCommandsByStep'], ['Wrong decisions', 'wrongDecisionCount'], ['Challenge mode', 'challengeMode'], ['Daily challenge date', 'dailyChallengeDate'], ['Daily challenge type', 'dailyChallengeType'], ['Skill signals', 'skillSignals'], ['XP awarded', 'xpAwarded']] as const;
        const rows = attempts.map(attempt => fields.map(([, key]) => escapeCsv(typeof attempt[key] === 'object' ? JSON.stringify(attempt[key]) : attempt[key])).join(','));
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
        const summaryHeaders = ['Mission ID', 'Mission title', 'Tier', 'Learning concept', 'Attempt count', 'Completion rate (%)', 'Average time (seconds)', 'Average hints used', 'Average wrong commands', 'Average wrong decisions'];
        const summaryRows = [...groups.entries()].map(([missionId, summary]) => [missionId, summary.missionTitle, summary.tier, summary.concept, summary.attempts, Math.round((summary.completed / summary.attempts) * 100), Math.round(summary.totalSeconds / summary.attempts), Number((summary.hints / summary.attempts).toFixed(2)), Number((summary.wrongCommands / summary.attempts).toFixed(2)), Number((summary.wrongDecisions / summary.attempts).toFixed(2))].map(escapeCsv).join(','));
        downloadCsv('sandbox-secure-mission-summary.csv', [summaryHeaders.join(','), ...summaryRows].join('\r\n'));
        downloadCsv('sandbox-secure-mission-attempts.csv', [fields.map(([label]) => label).join(','), ...rows].join('\r\n'));
      }
      if (assessmentAttempts.length) {
        const fields = [['Tier', 'tier'], ['Assessment', 'assessment'], ['Score earned', 'score'], ['Total questions', 'total'], ['Attempt number', 'attemptNumber'], ['Completed at', 'timestamp']] as const;
        const rows = assessmentAttempts.map(attempt => fields.map(([, key]) => escapeCsv(attempt[key])).join(','));
        const groups = new Map<string, { count: number; scoreSum: number; totalSum: number; firstScore: number | null; bestScore: number; questions: number }>();
        assessmentAttempts.forEach(attempt => {
          const key = `${attempt.tier}-${attempt.assessment}`;
          const summary = groups.get(key) ?? { count: 0, scoreSum: 0, totalSum: 0, firstScore: null, bestScore: 0, questions: 0 };
          summary.count += 1;
          summary.scoreSum += attempt.score;
          summary.totalSum += attempt.total;
          summary.questions = Math.max(summary.questions, attempt.total);
          if (attempt.attemptNumber === 1) summary.firstScore = attempt.score;
          summary.bestScore = Math.max(summary.bestScore, attempt.score);
          groups.set(key, summary);
        });
        const summaryHeaders = ['Tier', 'Assessment type', 'Attempts', 'First attempt score (correct answers)', 'Best score (correct answers)', 'Average score (%)', 'Questions'];
        const summaryRows = [...groups.entries()].map(([key, summary]) => {
          const [tier, assessment] = key.split('-');
          const averagePercent = summary.totalSum ? Math.round((summary.scoreSum / summary.totalSum) * 100) : 0;
          return [tier, assessment, summary.count, summary.firstScore, summary.bestScore, averagePercent, summary.questions].map(escapeCsv).join(',');
        });
        downloadCsv('sandbox-secure-assessment-summary.csv', [summaryHeaders.join(','), ...summaryRows].join('\r\n'));
        downloadCsv('sandbox-secure-assessment-attempts.csv', [fields.map(([label]) => label).join(','), ...rows].join('\r\n'));
      }
      setExportMessage(`Exported ${attempts.length} mission and ${assessmentAttempts.length} assessment attempts for this account.`);
    } catch (error) {
      console.error('Could not export mission data:', error);
      setExportMessage('Export failed. Check Firestore access and try again.');
    }
  };

  return (
    <div className="game-screen profile-layout mx-auto min-h-full w-full max-w-[1480px] space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">

      {view === 'profile' && <section className="profile-identity-panel border border-green-500/20 bg-[#08100c] p-6">

        <div className="flex flex-col md:flex-row items-center md:items-start gap-5">

          <div className="flex flex-col items-center gap-2">
            <button type="button" onClick={() => setArtworkPreview({ title: 'Profile picture', src: getAvatarById(selectedAvatarId).src, alt: `${getAvatarById(selectedAvatarId).label} profile picture` })} aria-label="Enlarge profile picture" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--game-surface)]"><Avatar avatarId={selectedAvatarId} size="large" frameId={cosmetics.equippedFrameId} /></button>
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
            <p className="mt-2 inline-flex border border-[var(--game-cyan)] px-2 py-1 text-xs font-bold uppercase tracking-wide text-[var(--game-cyan)]">{COSMETIC_CATALOG.title.find(item => item.id === cosmetics.equippedTitleId)?.name ?? 'Operator'}</p>

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

      </section>}

      {view === 'profile' && <>
        <div role="tablist" aria-label="Profile sections" className="profile-section-tabs flex gap-2 overflow-x-auto border-b border-[var(--game-border)] pb-2">
          {([
            ['overview', 'Overview'], ['progress', 'Progress'], ['skills', 'Skill practice'], ['achievements', 'Rank & achievements'], ['certificates', 'Certificates'], ['leaderboards', 'Leaderboards']
          ] as const).map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={activeProfileSection === id} onClick={() => setActiveProfileSection(id)} className={`min-h-11 shrink-0 border px-4 py-2 text-sm font-bold ${activeProfileSection === id ? 'border-[var(--game-cyan)] bg-[var(--game-cyan)]/10 text-[var(--game-cyan)]' : 'border-[var(--game-border)] text-[var(--game-muted)] hover:border-[var(--game-cyan)]'}`}>{label}</button>)}
        </div>
        {activeProfileSection === 'overview' && <div className="space-y-5">
        <GameCard className="profile-overview-stats grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
          <div><p className="game-eyebrow">Current rank</p><p className="mt-2 text-xl font-bold text-[var(--game-text)]">{rankProgress(progression.xp).current.name}</p><ProgressBar value={rankProgress(progression.xp).percent} label="Rank progress" className="mt-3" /></div>
          <div><p className="game-eyebrow">Completed missions</p><p className="mt-2 text-xl font-bold text-[var(--game-text)]">{new Set(completedMissions).size}</p><p className="mt-2 text-sm text-[var(--game-muted)]">Across practice and certification missions</p></div>
          <div><p className="game-eyebrow">Assessment attempts</p><p className="mt-2 text-xl font-bold text-[var(--game-text)]">{assessmentAttemptCount}</p><p className="mt-2 text-sm text-[var(--game-muted)]">Pre-tests and post-tests</p></div>
        </GameCard>
        {learningGainEntries.length > 0 && <GameCard className="profile-learning-chart p-5 sm:p-6">
          <SectionHeader eyebrow="Learning analytics" title="Pre-test → post-test" detail="Compare your first recorded attempt in each assessment. The percentage-point change is descriptive and does not change certification scoring." />
          <div className="mt-5 space-y-5">{learningGainEntries.map(({ tier, data, gain }) => {
            const prePercent = data.preTestScore !== undefined ? Math.round(((data.preTestFirstScore ?? data.preTestScore) / Math.max(1, data.preTestFirstTotal ?? data.preTestTotal ?? 1)) * 100) : null;
            const postPercent = data.finalScore !== undefined ? Math.round(((data.firstFinalScore ?? data.finalScore) / Math.max(1, data.firstFinalTotal ?? data.finalTotal ?? 1)) * 100) : null;
            return <article key={tier} className="profile-score-comparison grid gap-3 border border-[var(--game-border)] p-4 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center">
              <h3 className="text-sm font-bold text-[var(--game-text)]">{tier}</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-[5.5rem_minmax(0,1fr)_3rem] items-center gap-2 text-xs"><span className="text-[var(--game-muted)]">Pre-test</span><div role="img" aria-label={prePercent === null ? 'Pre-test not taken' : `Pre-test score ${prePercent}%`} className="h-2 overflow-hidden bg-[var(--game-track)]"><motion.span initial={reduceMotion ? false : { width: 0 }} animate={{ width: `${prePercent ?? 0}%` }} transition={{ duration: reduceMotion ? 0 : 0.7, ease: 'easeOut' }} className="block h-full bg-[var(--game-cyan)]" /></div><span className="text-right font-semibold text-[var(--game-text)]">{prePercent === null ? '—' : `${prePercent}%`}</span></div>
                <div className="grid grid-cols-[5.5rem_minmax(0,1fr)_3rem] items-center gap-2 text-xs"><span className="text-[var(--game-muted)]">Post-test</span><div role="img" aria-label={postPercent === null ? 'Post-test not taken' : `Post-test score ${postPercent}%`} className="h-2 overflow-hidden bg-[var(--game-track)]"><motion.span initial={reduceMotion ? false : { width: 0 }} animate={{ width: `${postPercent ?? 0}%` }} transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.12, ease: 'easeOut' }} className="block h-full bg-[var(--game-green)]" /></div><span className="text-right font-semibold text-[var(--game-text)]">{postPercent === null ? '—' : `${postPercent}%`}</span></div>
              </div>
              <p className="text-sm font-bold text-[var(--game-green)] sm:text-right">{gain === null ? 'Post-test pending' : `${gain > 0 ? '+' : ''}${gain} pp`}</p>
            </article>;
          })}</div>
          <p className="mt-3 text-xs leading-5 text-[var(--game-muted)]">Older records without first-attempt fields use their saved assessment scores.</p>
        </GameCard>}
        <GameCard className="p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><SectionHeader eyebrow="Your records" title="Learning data" detail="Download your mission and assessment summaries, including detailed attempt rows." />{exportMessage && <p className="mt-2 text-sm text-[var(--game-cyan)]" role="status">{exportMessage}</p>}</div><button type="button" onClick={exportLearningData} disabled={!user || progressLoadFailed} className="min-h-11 border border-[var(--game-cyan)] px-4 py-2 text-sm font-bold text-[var(--game-cyan)] hover:bg-[var(--game-cyan)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)] disabled:cursor-not-allowed disabled:opacity-50">Export learning data</button></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="border border-[var(--game-border)] p-4"><p className="game-eyebrow">Best post-test points</p><p className="mt-2 text-2xl font-bold text-[var(--game-text)]">{totalScore}{totalPossible > 0 ? ` / ${totalPossible}` : ''}</p></div><div className="border border-[var(--game-border)] p-4"><p className="game-eyebrow">Best-score average</p><p className="mt-2 text-2xl font-bold text-[var(--game-text)]">{percentage}%</p></div><div className="border border-[var(--game-border)] p-4"><p className="game-eyebrow">Certifications passed</p><p className="mt-2 text-2xl font-bold text-[var(--game-text)]">{certificationsPassed} / 3</p></div></div>
        </GameCard>
        </div>}
      </>}

      {view === 'shop' && <GameCard className="p-5 sm:p-6">
        <div className="shop-art-banner relative isolate mb-5 overflow-hidden border border-[var(--game-border)]">
          <img src={cosmeticShopImage} alt="" aria-hidden="true" loading="lazy" decoding="async" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right opacity-90" />
          <div className="relative z-10 flex min-h-36 items-center p-5 sm:min-h-40 sm:p-7">
            <SectionHeader eyebrow="Personal customization" title="Cosmetic Shop" detail="Your balance, purchases, and equipped items belong to your account and are not shown on public leaderboards." />
          </div>
        </div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-[var(--game-amber)]/50 bg-[var(--game-amber)]/5 p-4">
          <div><p className="text-xs font-bold uppercase tracking-widest text-[var(--game-amber)]">Your shop coins</p><p className="mt-1 text-2xl font-black tabular-nums text-[var(--game-text)]">{cosmetics.coins}</p></div>
          <p className="max-w-xl text-sm leading-6 text-[var(--game-muted)]">Earn 50 coins for each eligible mission clear and 100 coins for each certification earned. Mission rewards are one-time; replays and daily trials do not award coins. Assessment scores do not affect your balance.</p>
        </div>
        {cosmeticMessage && <p className="mb-4 border border-[var(--game-border)] p-3 text-sm text-[var(--game-text)]" role="status">{cosmeticMessage}</p>}
        <div className="space-y-6">
          {(['frame', 'palette', 'title'] as const).map(kind => <section key={kind} aria-labelledby={`cosmetic-${kind}-heading`}>
            <h3 id={`cosmetic-${kind}-heading`} className="mb-3 text-sm font-black uppercase tracking-wide text-[var(--game-text)]">{kind === 'frame' ? 'Avatar frames' : kind === 'palette' ? 'Terminal colors' : 'Operator titles'}</h3>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {COSMETIC_CATALOG[kind].map(item => {
                const owned = ownedCosmeticIds(kind).includes(item.id);
                const equipped = equippedCosmeticId(kind) === item.id;
                const busy = cosmeticBusyId === item.id;
                return <article key={item.id} className="flex min-w-0 flex-col border border-[var(--game-border)] bg-[var(--game-surface)] p-4">
                  <div className="mb-3 flex min-h-12 items-center gap-3">
                    {kind === 'frame' && <span data-avatar-frame={item.id} className="avatar-cosmetic-frame flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[var(--game-border)] bg-[var(--game-track)] text-xs font-black text-[var(--game-text)]" aria-hidden="true">OP</span>}
                    {kind === 'palette' && <span data-palette-preview={item.id} className="palette-cosmetic-preview flex h-12 w-16 shrink-0 flex-col overflow-hidden border border-[var(--game-border)]" aria-hidden="true"><span className="h-2 w-full bg-current opacity-80" /><span className="flex flex-1 items-center gap-1 px-1.5"><i className="h-1 w-4 bg-current opacity-90" /><i className="h-1 w-5 bg-current opacity-50" /></span><span className="mx-1.5 mb-1 h-1 border border-current opacity-70" /></span>}
                    {kind === 'title' && <span className="flex min-h-10 max-w-36 items-center justify-center border border-[var(--game-cyan)] px-2 text-center text-xs font-black leading-tight text-[var(--game-cyan)]" aria-hidden="true">{item.name}</span>}
                    <div className="min-w-0"><p className="break-words text-sm font-bold text-[var(--game-text)]">{item.name}</p><p className="mt-1 text-xs text-[var(--game-muted)]">{owned ? equipped ? 'Equipped' : 'Owned' : `${item.price} coins`}</p></div>
                  </div>
                  <p className="mb-4 flex-1 text-sm leading-5 text-[var(--game-muted)]">{item.description}</p>
                  <button type="button" disabled={!user || progressLoadFailed || Boolean(cosmeticBusyId) || equipped || (!owned && cosmetics.coins < item.price)} onClick={() => void handleCosmeticAction(kind, item.id)} className="min-h-10 w-full border border-[var(--game-cyan)] px-3 py-2 text-xs font-bold uppercase text-[var(--game-cyan)] hover:bg-[var(--game-cyan)] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)] disabled:cursor-not-allowed disabled:opacity-50">
                    {busy ? 'Saving…' : equipped ? 'Equipped' : owned ? 'Equip' : `Purchase · ${item.price} coins`}
                  </button>
                </article>;
              })}
            </div>
          </section>)}
        </div>
        {progressLoadFailed && <p className="mt-4 text-sm text-[var(--game-muted)]">The shop is unavailable until your saved profile finishes loading.</p>}
      </GameCard>}

      {view === 'profile' && activeProfileSection === 'leaderboards' && <GameCard className="p-5 sm:p-6">
        <SectionHeader eyebrow="Daily challenges" title="Leaderboards" detail="When you complete a daily challenge, your result is submitted automatically using your chosen profile name and avatar. Your email address is never shown." />
        <p className="mt-4 border border-[var(--game-border)] bg-[var(--game-surface)] p-4 text-sm leading-6 text-[var(--game-muted)]">Entries are limited to one per account per daily challenge. You can view the current Time Attack and Accuracy Trial standings on the Dashboard.</p>
      </GameCard>}

      {view === 'profile' && activeProfileSection === 'achievements' && <GameCard className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-4">
          <button type="button" onClick={() => setArtworkPreview({ title: `${rankProgress(progression.xp).current.name} rank badge`, src: RANK_BADGES[rankProgress(progression.xp).current.name], alt: `${rankProgress(progression.xp).current.name} rank badge` })} aria-label={`Enlarge ${rankProgress(progression.xp).current.name} rank badge`} className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]"><img src={RANK_BADGES[rankProgress(progression.xp).current.name]} alt={`${rankProgress(progression.xp).current.name} rank badge`} className="h-20 w-20 rounded-md border border-[var(--game-border)] object-cover" /></button>
          <div><p className="text-xs font-bold uppercase tracking-widest text-[var(--game-muted)]">Current rank</p><p className="mt-1 text-lg font-bold text-[var(--game-text)]">{rankProgress(progression.xp).current.name} badge</p><p className="text-sm text-[var(--game-muted)]">Your rank emblem appears here and updates as you level up.</p></div>
        </div>
        <SectionHeader eyebrow="Clearance profile" title={`${rankProgress(progression.xp).current.name} · ${progression.xp} XP`} detail={`${progression.streak.current} day streak · ${progression.streak.longest} day personal best`} />
        <ProgressBar value={rankProgress(progression.xp).percent} label={rankProgress(progression.xp).next ? `Progress to ${rankProgress(progression.xp).next?.name}` : 'Maximum rank'} />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">{ACHIEVEMENTS.map(achievement => <AchievementBadge key={achievement.id} achievement={achievement} earned={progression.badges.includes(achievement.id)} />)}</div>
      </GameCard>}

      {view === 'profile' && activeProfileSection === 'skills' && <GameCard className="p-5 sm:p-6">
        <SectionHeader eyebrow="Observed practice" title="Skill practice map" detail="Shows recorded investigation habits from completed missions. These indicators are learning feedback, not validated proficiency scores." />
        {(() => {
          const completed = allMissionAttempts.filter(attempt => attempt.outcome === 'completed' && attempt.skillSignals);
          const signals = [
            { key: 'evidenceFirst', label: 'Evidence before response', description: 'Recorded evidence collection before a simulated response action.' },
            { key: 'verifiedAll', label: 'Response verification', description: 'Verified all simulated response actions after applying them.' },
            { key: 'calibratedReport', label: 'Evidence-based reporting', description: 'Submitted a report calibrated to the available evidence.' }
          ] as const;
          return completed.length ? <div className="mt-5 grid gap-3 md:grid-cols-3">{signals.map(signal => {
            const positive = completed.filter(attempt => attempt.skillSignals?.[signal.key]).length;
            const value = Math.round(positive / completed.length * 100);
            return <article key={signal.key} className="border border-[var(--game-border)] bg-[var(--game-surface)] p-4"><div className="flex items-baseline justify-between gap-3"><h3 className="font-bold text-[var(--game-text)]">{signal.label}</h3><span className="text-sm font-bold text-[var(--game-cyan)]">{value}%</span></div><p className="mt-2 text-sm text-[var(--game-muted)]">{signal.description}</p><ProgressBar value={value} label={`${positive} of ${completed.length} recorded completions`} /><p className="mt-2 text-xs text-[var(--game-muted)]">{positive} / {completed.length} completed attempts</p></article>;
          })}</div> : <div className="empty-state mt-4">Complete a mission to build your practice map.</div>;
        })()}
      </GameCard>}

      {view === 'profile' && activeProfileSection === 'certificates' && <GameCard className="p-5 sm:p-6">
        <SectionHeader eyebrow="Credentials" title="Certificates" detail="Completed certification certificates are saved here for viewing and printing." />
        {certificates.length ? <div className="mt-4 space-y-3">{certificates.map(certificate => <article key={certificate.id} className="flex flex-col gap-3 rounded-md border border-[var(--game-border)] bg-[var(--game-surface)] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-[var(--game-text)]">{certificate.tier} Security Certification</p><p className="mt-1 text-sm text-[var(--game-muted)]">Awarded {new Date(certificate.issuedAt).toLocaleDateString()} · {certificate.score}/{certificate.total}</p></div><button type="button" onClick={() => onViewCertificate(certificate)} className="min-h-11 rounded-md border border-[var(--game-green)] px-4 py-2 text-sm font-semibold text-[var(--game-green)] hover:bg-[var(--game-green)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-green)]">View / Print</button></article>)}</div> : <p className="mt-4 text-sm text-[var(--game-muted)]">Pass a certification post-test after completing its missions to earn your first certificate.</p>}
      </GameCard>}

      {view === 'profile' && activeProfileSection === 'progress' && <GameCard className="p-5 sm:p-6">
        <SectionHeader eyebrow="Mission history" title="Completed cases" detail="One latest completion per mission, with its learning takeaway and replay count. Detailed attempts remain available in the learning data export." />
        {archive.length ? <div className="overflow-x-auto"><table className="w-full min-w-[620px] border-collapse text-left text-sm"><thead><tr className="border-b border-[var(--game-border)] text-xs uppercase tracking-wide text-[var(--game-muted)]"><th scope="col" className="px-3 py-3">Mission</th><th scope="col" className="px-3 py-3">What you practiced</th><th scope="col" className="px-3 py-3">Completions</th><th scope="col" className="px-3 py-3">Last completed</th></tr></thead><tbody>{archive.map(attempt => <tr key={attempt.missionId} className="border-b border-[var(--game-border)] last:border-0"><th scope="row" className="px-3 py-3 font-semibold text-[var(--game-text)]">{attempt.missionTitle}</th><td className="px-3 py-3 text-[var(--game-muted)]">{attempt.concept}</td><td className="px-3 py-3 text-[var(--game-text)]">{archiveCompletionCounts[attempt.missionId] ?? 1}</td><td className="px-3 py-3 text-[var(--game-muted)]">{new Date(attempt.completedAt).toLocaleDateString()}</td></tr>)}</tbody></table></div> : <div className="empty-state">No completed missions yet. Finish a mission and your history will appear here.</div>}
      </GameCard>}

      <ArtworkPreviewDialog artwork={artworkPreview} onClose={() => setArtworkPreview(null)} />
    </div>
  );
};
