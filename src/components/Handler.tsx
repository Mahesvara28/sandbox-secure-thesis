import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useId } from 'react';
import novaAlert from '../assets/NOVA_ALERT.png';
import novaCalm from '../assets/NOVA_CALM.png';
import novaFixingHerself from '../assets/NOVA_FIXING_HERSELF.png';
import novaHappy from '../assets/NOVA_HAPPY.png';
import novaOverworked from '../assets/NOVA_OVERWORKED.png';
import novaPanic from '../assets/NOVA_PANIC.png';
import novaRelief from '../assets/NOVA_RELIEF.png';
import novaShocked from '../assets/NOVA_SHOCKED.png';
import santosConcerned from '../assets/SANTOS_CONCERNED.png';
import santosExplaining from '../assets/SANTOS_EXPLAINING.png';
import santosRelieved from '../assets/SANTOS_RELIEVED.png';
import limHesitant from '../assets/MS.LIM_HESITANT.png';
import limReassured from '../assets/MS.LIM_REASSURED.png';
import limWorried from '../assets/MS.LIM_WORRIED.png';

export type HandlerPose = 'idle' | 'talking' | 'thinking' | 'alert' | 'shocked' | 'panic' | 'thumbsup' | 'celebrate' | 'encourage' | 'relief' | 'overworked' | 'fixing' | 'hesitant';

interface HandlerProps {
  pose: HandlerPose;
  size: number;
  speaking: boolean;
  character?: 'nova' | 'santos' | 'lim';
}

const poseAssets: Record<HandlerPose, string> = {
  idle: novaCalm,
  talking: novaCalm,
  thinking: novaCalm,
  alert: novaAlert,
  shocked: novaShocked,
  panic: novaPanic,
  thumbsup: novaHappy,
  celebrate: novaHappy,
  encourage: novaRelief,
  relief: novaRelief,
  overworked: novaOverworked,
  fixing: novaFixingHerself,
  hesitant: novaCalm,
};

const poseAsset = (pose: HandlerPose) => poseAssets[pose];

const characterPoseAssets: Record<'santos' | 'lim', Partial<Record<HandlerPose, string>>> = {
  santos: { idle: santosExplaining, talking: santosExplaining, thinking: santosExplaining, alert: santosConcerned, shocked: santosConcerned, panic: santosConcerned, encourage: santosRelieved, relief: santosRelieved, celebrate: santosRelieved, thumbsup: santosRelieved },
  lim: { idle: limHesitant, talking: limHesitant, thinking: limHesitant, hesitant: limHesitant, alert: limWorried, shocked: limWorried, panic: limWorried, encourage: limReassured, relief: limReassured, celebrate: limReassured, thumbsup: limReassured },
};

const poseLabel: Record<HandlerPose, string> = {
  idle: 'Nova, your friendly training mentor',
  talking: 'Nova is speaking',
  thinking: 'Nova is thinking',
  alert: 'Nova has spotted something to review',
  shocked: 'Nova is surprised',
  panic: 'Nova is startled',
  thumbsup: 'Nova gives an approving thumbs up',
  celebrate: 'Nova celebrates your progress',
  encourage: 'Nova encourages you to continue',
  relief: 'Nova is relieved',
  overworked: 'Nova looks overworked',
  fixing: 'Nova is getting herself organized',
  hesitant: 'Nova pauses before answering',
};

/** Nova portrait: bundled pose artwork crossfades as the dialogue beat changes. */
export function Handler({ pose, size, speaking, character = 'nova' }: HandlerProps) {
  const reduceMotion = useReducedMotion();
  const gradientId = `nova-bg-${useId().replace(/:/g, '')}`;
  const image = character === 'nova' ? poseAsset(pose) : characterPoseAssets[character][pose] ?? characterPoseAssets[character].idle;

  useEffect(() => {
    Object.values(character === 'nova' ? poseAssets : characterPoseAssets[character]).forEach(src => {
      if (!src) return;
      const preload = new Image();
      preload.src = src;
    });
  }, [character]);

  const celebrate = pose === 'celebrate' || pose === 'thumbsup';
  const shake = pose === 'alert';
  const breathe = pose === 'idle' || pose === 'encourage' || speaking;

  return (
    <div
      className="relative shrink-0 overflow-hidden bg-[radial-gradient(ellipse_at_50%_70%,color-mix(in_srgb,var(--game-cyan)_18%,transparent),transparent_70%)] drop-shadow-[0_0_16px_color-mix(in_srgb,var(--game-cyan)_25%,transparent)]"
      style={{ width: size, height: Math.round(size * 1.35) }}
    >
      <AnimatePresence mode="sync" initial={false}>
        {image ? (
          <motion.img
            key={pose}
            src={image}
      alt={character === 'nova' ? poseLabel[pose] : `${character === 'santos' ? 'Mr. Santos' : 'Ms. Lim'}, ${poseLabel[pose].replace(/^Nova[, ]*/i, '')}`}
            className="absolute inset-0 h-full w-full object-contain object-bottom"
            initial={reduceMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: reduceMotion ? 0 : speaking ? [0, -0.8, 0] : breathe ? [0, -1.2, 0] : celebrate ? [0, -2, 0] : 0, scale: reduceMotion ? 1 : breathe ? [1, 1.006, 1] : 1, rotate: reduceMotion || !shake ? 0 : [0, -0.6, 0.6, 0] }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -2 }}
            transition={{ opacity: { duration: reduceMotion ? 0 : 0.24, ease: 'easeInOut' }, y: { duration: reduceMotion ? 0 : 0.3 }, default: { duration: celebrate ? 0.45 : breathe ? (speaking ? 1.8 : 2.8) : 0.35, repeat: !reduceMotion && breathe ? Infinity : 0, ease: 'easeInOut' } }}
          />
        ) : (
          <motion.svg
            key={pose}
            viewBox="0 0 100 100"
            role="img"
            aria-label={poseLabel[pose]}
            className="h-full w-full"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1, y: reduceMotion ? 0 : speaking ? [0, -1, 0] : breathe ? [0, -1.5, 0] : celebrate ? [0, -4, 0] : 0, rotate: reduceMotion || !shake ? 0 : [0, -2, 2, 0] }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ opacity: { duration: reduceMotion ? 0 : 0.18 }, default: { duration: celebrate ? 0.42 : breathe ? 2.8 : 0.35, repeat: breathe && !speaking ? Infinity : 0, ease: 'easeInOut' } }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--game-surface-raised)"/><stop offset="1" stopColor="var(--game-page)"/></linearGradient>
            </defs>
            <circle cx="50" cy="50" r="49" fill={`url(#${gradientId})`} />
            <path d="M13 94c2-20 16-29 37-29s35 9 37 29" fill="var(--game-cyan)" opacity=".9" />
            <path d="M27 40c0-20 10-29 23-29s23 9 23 29v13c0 13-10 23-23 23S27 66 27 53z" fill="#d9a77d" />
            <path d="M25 43c-2-22 8-34 26-34 17 0 27 12 24 34l-7-12-13-7-20 7z" fill="#263849" />
            <path d="M22 37a8 8 0 0 0 0 16M78 37a8 8 0 0 1 0 16" fill="none" stroke="var(--game-cyan)" strokeWidth="4" />
            <path d="M25 40h18a8 8 0 0 1 8 8v4H32a7 7 0 0 1-7-7zm50 0H57a8 8 0 0 0-8 8v4h19a7 7 0 0 0 7-7z" fill="none" stroke="#d7f4f3" strokeWidth="2.5" />
            {pose === 'thinking' && <path d="M33 40l9-2m25 2-9-2" stroke="#263849" strokeWidth="3" strokeLinecap="round" />}
            {pose === 'alert' && <path d="M33 37l9 2m25-2-9 2" stroke="#263849" strokeWidth="3" strokeLinecap="round" />}
            <path d="M43 52h7m7 0h7" stroke="#d7f4f3" strokeWidth="2" />
            {pose === 'thinking' ? <path d="M44 64q4-4 8 0" fill="none" stroke="#693f32" strokeWidth="2.5" /> : pose === 'alert' ? <ellipse cx="50" cy="64" rx="4" ry="5" fill="none" stroke="#693f32" strokeWidth="2.5" /> : pose === 'talking' ? <ellipse cx="50" cy="64" rx="5" ry="6" fill="#693f32" /> : <path d="M42 61q8 10 16 0" fill="none" stroke="#693f32" strokeWidth={pose === 'celebrate' ? 3 : 2.5} />}
            {pose === 'celebrate' && <g fill="var(--game-amber)"><path d="M78 12l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><circle cx="19" cy="29" r="2"/><circle cx="82" cy="55" r="2"/></g>}
            {pose === 'thumbsup' && <path d="M76 61v-9q0-5 4-5 3 0 3 4v5h6q4 0 3 4l-2 13q-1 4-5 4h-9zM72 61h4v16h-4z" fill="var(--game-amber)" stroke="var(--game-page)" strokeWidth="1" />}
            {pose === 'alert' && <path d="M78 17l3 6 6 1-5 4 1 6-5-3-5 3 1-6-5-4 6-1z" fill="var(--game-amber)" />}
            <path d="M18 87q12-10 24 0m16 0q12-10 24 0" fill="none" stroke="var(--game-green)" strokeWidth="2" opacity=".8" />
          </motion.svg>
        )}
      </AnimatePresence>
    </div>
  );
}
