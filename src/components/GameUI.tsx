import type { ReactNode } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { Award, FileCheck2, MessageSquareText, ShieldCheck, Sparkles, Target, Lock } from 'lucide-react';
import type { AchievementDefinition } from '../data/achievements';

const badgeIcons = { file: FileCheck2, message: MessageSquareText, shield: ShieldCheck, sparkles: Sparkles, award: Award, target: Target };

export const GameCard = ({ children, className = '', delay = 0, ...props }: { children: ReactNode; className?: string; delay?: number; 'aria-label'?: string }) => (
  <GameCardMotion delay={delay} className={className} {...props}>{children}</GameCardMotion>
);

const GameCardMotion = ({ children, className, delay, ...props }: { children: ReactNode; className: string; delay: number; 'aria-label'?: string }) => {
  const reduceMotion = useReducedMotion();
  return <motion.section {...props} initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.22, delay: reduceMotion ? 0 : delay }} className={`game-card ${className}`}>{children}</motion.section>;
};

const CountUpNumber = ({ value }: { value: number }) => {
  const reduceMotion = useReducedMotion();
  const counter = useMotionValue(reduceMotion ? value : 0);
  const rounded = useTransform(counter, latest => Math.round(latest));
  useEffect(() => {
    if (reduceMotion) { counter.set(value); return; }
    const controls = animate(counter, value, { duration: 0.35 });
    return () => controls.stop();
  }, [counter, reduceMotion, value]);
  return <motion.span>{rounded}</motion.span>;
};

export const SectionHeader = ({ eyebrow, title, detail }: { eyebrow?: string; title: string; detail?: string }) => (
  <header className="mb-4"><p className="game-eyebrow">{eyebrow}</p><h2 className="mt-1 text-xl font-bold text-[var(--game-text)] sm:text-2xl">{title}</h2>{detail && <p className="mt-1 text-sm text-[var(--game-muted)]">{detail}</p>}</header>
);

export const StatTile = ({ label, value, detail, color = 'green' }: { label: string; value: string | number; detail?: string; color?: 'green' | 'cyan' | 'amber' }) => (
  <div className={`stat-tile stat-tile-${color}`}><p className="game-eyebrow">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums text-[var(--game-text)] sm:text-3xl">{typeof value === 'number' ? <CountUpNumber value={value} /> : value}</p>{detail && <p className="mt-1 text-xs text-[var(--game-muted)]">{detail}</p>}</div>
);

export const ProgressBar = ({ value, label, className = '' }: { value: number; label?: string; className?: string }) => {
  const reduceMotion = useReducedMotion();
  return <div className={className}>{label && <div className="mb-1 flex justify-between gap-3 text-xs text-[var(--game-muted)]"><span>{label}</span><span>{Math.max(0, Math.min(100, Math.round(value)))}%</span></div>}<div className="h-2 overflow-hidden rounded-full bg-[var(--game-track)]"><motion.div initial={reduceMotion ? false : { width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, value))}%` }} transition={{ duration: reduceMotion ? 0 : 0.25 }} className="h-full rounded-full bg-[var(--game-green)]" /></div></div>;
};

export const AchievementBadge = ({ achievement, earned }: { achievement: AchievementDefinition; earned: boolean }) => {
  const Icon = earned ? badgeIcons[achievement.icon] : Lock;
  return <div className={`badge-card ${earned ? 'badge-earned' : 'badge-locked'}`} title={earned ? achievement.description : achievement.unlockHint} aria-label={`${achievement.name}: ${earned ? achievement.description : achievement.unlockHint}`}><span className="badge-icon"><Icon size={18} aria-hidden="true" /></span><span><span className="block text-sm font-semibold">{achievement.name}</span><span className="mt-0.5 block text-xs text-[var(--game-muted)]">{earned ? achievement.description : achievement.unlockHint}</span></span>{!achievement.active && <span className="ml-auto text-[10px] text-[var(--game-muted)]">SOON</span>}</div>;
};

export const Toast = ({ message, onDismiss }: { message: string; onDismiss: () => void }) => message ? <motion.div role="status" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="fixed bottom-5 right-5 z-[150] max-w-sm border border-[var(--game-cyan)] bg-[var(--game-surface)] px-4 py-3 text-sm text-[var(--game-text)] shadow-xl"><div className="flex items-start gap-3"><Sparkles size={17} className="mt-0.5 shrink-0 text-[var(--game-cyan)]"/><span>{message}</span><button className="ml-2 text-[var(--game-muted)] focus-visible:outline focus-visible:outline-2" onClick={onDismiss} aria-label="Dismiss notification">×</button></div></motion.div> : null;
