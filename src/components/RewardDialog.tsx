import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Activity, Award, BookOpen, Shield, Sparkles, Target, Trophy } from 'lucide-react';
import { ACHIEVEMENTS } from '../data/achievements';

export type RewardDialogItem =
  | { id: string; kind: 'rank'; previousRank: string; rank: string; xp: number }
  | { id: string; kind: 'badge'; badgeId: string };

const rankAssets = import.meta.glob('../assets/ranks/*', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export const RewardDialog = ({ item, onContinue }: { item: RewardDialogItem | null; onContinue: () => void }) => {
  const reduceMotion = useReducedMotion();
  const continueButton = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const onContinueRef = useRef(onContinue);
  const isOpen = item !== null;
  const rewardId = item?.id;
  const badge = item?.kind === 'badge' ? ACHIEVEMENTS.find(entry => entry.id === item.badgeId) : undefined;
  const BadgeIcon = badge?.icon === 'shield' ? Shield : badge?.icon === 'target' ? Target : badge?.icon === 'sparkles' ? Sparkles : badge?.icon === 'file' ? BookOpen : badge?.icon === 'message' ? Activity : Award;
  const rankId = item?.kind === 'rank' ? item.rank.toLowerCase() : '';
  const rankImage = item?.kind === 'rank' ? Object.entries(rankAssets).find(([path]) => path.toLowerCase().endsWith(`/${rankId}.png`) || path.toLowerCase().endsWith(`/${rankId}.svg`))?.[1] : undefined;

  useEffect(() => {
    onContinueRef.current = onContinue;
  }, [onContinue]);

  useEffect(() => {
    if (!isOpen) return;
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => previousFocus.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    continueButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onContinueRef.current();
      } else if (event.key === 'Tab') {
        event.preventDefault();
        continueButton.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, rewardId]);

  if (!item) return null;
  return <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/75 p-4" role="presentation">
    <motion.section role="dialog" aria-modal="true" aria-labelledby="reward-dialog-title" aria-describedby="reward-dialog-description" initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0.16 : 0.22 }} className="w-full max-w-md rounded-xl border border-amber-300/70 bg-[var(--game-surface)] p-6 text-center text-[var(--game-text)] shadow-2xl">
      {item.kind === 'rank' ? <>
        <p className="game-eyebrow">Rank advancement</p>
        <h2 id="reward-dialog-title" className="mt-2 text-2xl font-black">{item.rank}</h2>
        <p id="reward-dialog-description" className="mt-2 text-sm text-[var(--game-muted)]">You advanced from {item.previousRank}. Your current total is {item.xp} XP.</p>
        {rankImage ? <img src={rankImage} alt={`${item.rank} emblem`} className="mx-auto my-5 h-24 w-24 object-contain" /> : <motion.div initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduceMotion ? 0.16 : 0.22 }} className="relative mx-auto my-5 grid h-28 w-28 place-items-center rounded-full border border-[var(--game-amber)] shadow-[0_0_32px_color-mix(in_srgb,var(--game-amber)_35%,transparent)]">
          <span className="absolute inset-2 rounded-full border-2 border-[var(--game-cyan)]/70" /><span className="absolute inset-5 rounded-full border border-[var(--game-violet)]/80" /><Trophy size={30} className="text-[var(--game-amber)]" aria-hidden="true" />
        </motion.div>}
      </> : <>
        <p className="game-eyebrow">Achievement earned</p>
        <div className="mx-auto my-5 grid h-20 w-20 place-items-center rounded-full border-2 border-[var(--game-amber)] bg-[var(--game-surface-raised)] text-[var(--game-amber)]"><BadgeIcon size={34} aria-hidden="true" /></div>
        <h2 id="reward-dialog-title" className="text-2xl font-black">{badge?.name ?? 'Achievement earned'}</h2>
        <p id="reward-dialog-description" className="mt-2 text-sm leading-6 text-[var(--game-muted)]">{badge?.description ?? 'A new achievement has been added to your profile.'}</p>
      </>}
      <button ref={continueButton} type="button" onClick={onContinue} className="mt-5 min-h-11 w-full rounded-md bg-[var(--game-green)] px-5 py-3 font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">Continue</button>
    </motion.section>
  </div>;
};
