import { ArrowLeft, BookOpen, ChevronRight, History, SkipForward, X } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Handler, type HandlerPose } from './Handler';

export interface DialogueChoice {
  id: string;
  label: string;
  reply: string;
}

export interface DialogueBeat {
  id: string;
  speaker: string;
  role?: string;
  pose?: HandlerPose;
  text: string;
  choices?: DialogueChoice[];
}

interface DialogueBoxProps {
  beats: DialogueBeat[];
  onComplete?: () => void;
  className?: string;
  sceneLabel?: string;
  modal?: boolean;
}

const speakerColors = (speaker: string) => {
  const normalized = speaker.toLowerCase();
  if (normalized.includes('nova')) return 'border-[var(--game-cyan)] text-[var(--game-cyan)]';
  if (normalized.includes('santos')) return 'border-[var(--game-amber)] text-[var(--game-amber)]';
  if (normalized.includes('lim')) return 'border-[var(--game-violet)] text-[var(--game-violet)]';
  return 'border-[var(--game-green)] text-[var(--game-green)]';
};

/** Select one pose for the whole line so the portrait never changes mid-sentence. */
const inferNovaPose = (text: string): HandlerPose => {
  const line = text.toLowerCase();
  if (/\b(panic|terrified|emergency|everything is failing|under attack)\b/.test(line)) return 'panic';
  if (/\b(shocked|surprise|did not expect|what happened|how did it)\b/.test(line)) return 'shocked';
  if (/\b(alert|unfamiliar|suspicious|odd activity|unexpected|threat|visitor|strange)\b/.test(line)) return 'alert';
  if (/\b(stopped|resolved|safe|thank you|well done|complete|you did it|good work)\b/.test(line)) return 'relief';
  if (/\b(evidence|records|compare|timeline|uncertain|might|could|let us check|what do we know)\b/.test(line)) return 'thinking';
  return 'idle';
};

function formatDialogue(text: string, idPrefix: string) {
  const parts = text.split(/(\[\[[^\]]+\]\]|\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    const jargon = part.match(/^\[\[([^|]+)\|([\s\S]+)\]\]$/);
    if (jargon) {
      const tooltipId = `${idPrefix}-jargon-${index}`;
      return <span key={`${index}-${part}`} className="group relative inline">
        <button type="button" className="border-b border-dotted border-[var(--game-cyan)] font-semibold text-[var(--game-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]" aria-describedby={tooltipId}>
          {jargon[1]}
        </button>
        <span id={tooltipId} role="tooltip" className="invisible absolute bottom-full left-0 z-30 mb-2 w-56 border border-[var(--game-cyan)] bg-[var(--game-page)] p-2 text-xs font-normal text-[var(--game-text)] shadow-lg group-hover:visible group-focus-within:visible">
          {jargon[2]}
        </span>
        <span className="sr-only"> ({jargon[2]})</span>
      </span>;
    }
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={`${index}-${part}`} className="font-extrabold text-[var(--game-text)]">{part.slice(2, -2)}</strong>;
    return <span key={`${index}-${part}`}>{part}</span>;
  });
}

/** Reusable, keyboard-operable dialogue presentation for briefings and story scenes. */
export function DialogueBox({ beats, onComplete, className = '', sceneLabel = 'Scene dialogue', modal = false }: DialogueBoxProps) {
  const reduceMotion = useReducedMotion();
  const dialogueId = useId().replace(/:/g, '');
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [choiceReply, setChoiceReply] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [skipConfirm, setSkipConfirm] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [seen, setSeen] = useState<string[]>([]);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (modal) panelRef.current?.focus();
  }, [modal]);

  const beat = beats[index];
  const fullText = choiceReply ?? beat?.text ?? '';
  const visibleText = useMemo(() => reduceMotion ? fullText : fullText.slice(0, revealed), [fullText, reduceMotion, revealed]);
  const lineComplete = reduceMotion || revealed >= fullText.length;
  const hasValidBeats = Array.isArray(beats) && beats.length > 0 && beats.every(item =>
    item
    && typeof item.id === 'string'
    && typeof item.speaker === 'string'
    && typeof item.text === 'string'
    && item.text.trim().length > 0
    && (item.choices === undefined || (Array.isArray(item.choices) && item.choices.length <= 3 && item.choices.every(choice => choice && typeof choice.id === 'string' && typeof choice.label === 'string' && typeof choice.reply === 'string')))
  );

  useEffect(() => {
    if (!hasValidBeats || completed || reduceMotion || revealed >= fullText.length || !beat) return;
    const timeout = window.setTimeout(() => {
      const next = Math.min(fullText.length, revealed + 1);
      setRevealed(next);
      if (next >= fullText.length) setSeen(previous => previous.includes(beat.id) ? previous : [...previous, beat.id]);
    }, 1000 / 45);
    return () => window.clearTimeout(timeout);
  }, [beat, completed, fullText, hasValidBeats, reduceMotion, revealed]);

  if (!hasValidBeats || !beat) return null;

  const markSeen = (beatId: string) => setSeen(previous => previous.includes(beatId) ? previous : [...previous, beatId]);
  const finishScene = () => { setCompleted(true); onComplete?.(); };
  const advance = () => {
    if (completed) return;
    if (!lineComplete) {
      setRevealed(fullText.length);
      markSeen(beat.id);
      return;
    }
    markSeen(beat.id);
    if (choiceReply !== null) {
      setChoiceReply(null);
      if (index + 1 < beats.length) { setIndex(index + 1); setRevealed(0); }
      else finishScene();
      return;
    }
    if (beat.choices?.length && beat.choices.length <= 3) return;
    if (index + 1 < beats.length) { setIndex(index + 1); setRevealed(0); }
    else finishScene();
  };
  const goBack = () => {
    if (choiceReply !== null) { setChoiceReply(null); setRevealed(0); return; }
    if (index > 0) { setIndex(index - 1); setRevealed(0); }
  };
  const choose = (reply: string) => { markSeen(beat.id); setChoiceReply(reply); setRevealed(0); };
  const skip = () => {
    if (seen.length === 0 && !reduceMotion && !skipConfirm) { setSkipConfirm(true); return; }
    finishScene();
  };
  const handlePanelKey = (event: React.KeyboardEvent<HTMLElement>) => {
    if (/^[1-3]$/.test(event.key)) {
      const choice = beat.choices?.[Number(event.key) - 1];
      if (choice && !choiceReply) { event.preventDefault(); choose(choice.reply); }
      return;
    }
    if (event.key === 'ArrowLeft') { event.preventDefault(); goBack(); return; }
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); advance(); }
  };

  const isNova = beat.speaker.toLowerCase().includes('nova');
  const isSantos = beat.speaker.toLowerCase().includes('santos');
  const isLim = beat.speaker.toLowerCase().includes('lim');
  const character = isSantos ? 'santos' : isLim ? 'lim' : 'nova';
  const pose = beat.pose ?? (choiceReply ? 'encourage' : inferNovaPose(beat.text));
  const dialoguePanel = (
    <section ref={panelRef} aria-label={sceneLabel} aria-modal={modal || undefined} role={modal ? 'dialog' : undefined} className={`relative overflow-hidden border border-[var(--game-border)] bg-[var(--game-surface)] shadow-[0_0_24px_color-mix(in_srgb,var(--game-cyan)_12%,transparent)] ${className}`} onClick={event => { if (event.target === event.currentTarget) advance(); }} onKeyDown={handlePanelKey} tabIndex={0}>
      <div className="grid items-center gap-3 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--game-cyan)_10%,var(--game-page)),var(--game-surface))] p-3 sm:gap-4 sm:p-4 md:grid-cols-[minmax(220px,0.8fr)_minmax(0,2fr)] md:p-5">
        <div className="relative flex min-h-[230px] items-end justify-center overflow-hidden px-2 pt-2 sm:min-h-[270px] md:min-h-[350px]">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--game-surface)] to-transparent" aria-hidden="true" />
          <div className="relative z-[1] -mb-2"><Handler character={character} pose={pose} size={250} speaking={!lineComplete} /></div>
        </div>
        <div className="relative min-w-0 border border-[var(--game-border)] bg-[var(--game-page)] p-3 sm:p-4 md:p-5">
          <span className="absolute right-3 top-2 font-mono text-xs text-[var(--game-muted)] sm:right-4 sm:top-3" aria-label={`Line ${index + 1} of ${beats.length}`}>{index + 1} / {beats.length}</span>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 sm:mb-3">
            <div className={`inline-flex flex-col border-l-2 pl-2 ${speakerColors(beat.speaker)}`}>
              <span className="text-sm font-bold leading-tight">{beat.speaker}</span>
              <span className="text-xs opacity-80">{beat.role ?? (isNova ? 'Senior analyst · your mentor' : 'Harborview Learning Center')}</span>
            </div>
          </div>
          <button type="button" className="block w-full cursor-pointer pr-14 text-left text-sm leading-6 text-[var(--game-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)] sm:text-base" onClick={advance} aria-label={lineComplete ? index + 1 < beats.length ? 'Show next dialogue line' : 'Finish dialogue' : 'Show full dialogue line'}>
            <span aria-hidden="true">{formatDialogue(visibleText, `${dialogueId}-current`)}</span>
          </button>
          <span className="sr-only" aria-live="polite" aria-atomic="true">{fullText}</span>
          {lineComplete && !beat.choices?.length && <p className="mt-2 text-xs font-semibold text-[var(--game-cyan)]" aria-hidden="true">Next ▸</p>}
          {lineComplete && !choiceReply && beat.choices && beat.choices.length > 0 && beat.choices.length <= 3 && <div className="mt-3 flex flex-wrap gap-2" aria-label="Choose a response">
            {beat.choices.map((choice, choiceIndex) => <button key={choice.id} type="button" onClick={() => choose(choice.reply)} className="border border-[var(--game-cyan)] px-3 py-2 text-sm text-[var(--game-text)] hover:bg-[var(--game-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]"><span className="mr-2 font-mono text-[var(--game-cyan)]">{choiceIndex + 1}</span>{choice.label}</button>)}
          </div>}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--game-border)]/60 px-3 py-2 sm:px-4">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={goBack} disabled={index === 0 && choiceReply === null} className="inline-flex items-center gap-1 border border-[var(--game-border)] px-2 py-1.5 text-xs text-[var(--game-text)] hover:bg-[var(--game-surface-raised)] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]"><ArrowLeft size={14} /> Back</button>
          <button type="button" onClick={() => { if (lineComplete) markSeen(beat.id); setHistoryOpen(true); }} className="inline-flex items-center gap-1 border border-[var(--game-border)] px-2 py-1.5 text-xs text-[var(--game-text)] hover:bg-[var(--game-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]"><History size={14} /> Log</button>
        </div>
        {!completed && <button type="button" onClick={skip} className="inline-flex items-center gap-1 border border-[var(--game-border)] px-2 py-1.5 text-xs text-[var(--game-muted)] hover:text-[var(--game-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]"><SkipForward size={14} /> Skip scene</button>}
        {!completed && lineComplete && <button type="button" onClick={advance} disabled={Boolean(beat.choices?.length && !choiceReply)} className="inline-flex items-center gap-1 border border-[var(--game-cyan)] px-3 py-1.5 text-xs font-bold text-[var(--game-cyan)] hover:bg-[var(--game-surface-raised)] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">{index + 1 < beats.length ? 'Next' : 'Done'} <ChevronRight size={14} /></button>}
        {completed && <span className="text-xs font-semibold text-[var(--game-green)]">Scene complete</span>}
      </div>

      {historyOpen && <div className="absolute inset-0 z-20 overflow-y-auto border border-[var(--game-border)] bg-[var(--game-surface)] p-4" role="dialog" aria-modal="true" aria-label="Dialogue log">
        <div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-2 font-bold text-[var(--game-text)]"><BookOpen size={16} /> Dialogue log</h3><button type="button" onClick={() => setHistoryOpen(false)} aria-label="Close dialogue log" className="border border-[var(--game-border)] p-2 text-[var(--game-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]"><X size={16} /></button></div>
        <ol className="space-y-3">{beats.filter(item => seen.includes(item.id)).map(item => <li key={item.id} className="border-l-2 border-[var(--game-cyan)] pl-3"><p className="text-xs font-bold text-[var(--game-cyan)]">{item.speaker}</p><p className="mt-1 text-sm leading-6 text-[var(--game-text)]">{formatDialogue(item.text, `${dialogueId}-${item.id}`)}</p></li>)}</ol>
        {seen.length === 0 && <p className="text-sm text-[var(--game-muted)]">No lines revealed yet.</p>}
      </div>}

      {skipConfirm && <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Confirm skipping scene">
        <div className="w-full max-w-sm border border-[var(--game-amber)] bg-[var(--game-surface)] p-4"><p className="font-bold text-[var(--game-text)]">Skip this scene?</p><p className="mt-2 text-sm text-[var(--game-muted)]">You have not viewed these lines. You can still continue, and this will not change mission progress.</p><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setSkipConfirm(false)} className="border border-[var(--game-border)] px-3 py-2 text-sm text-[var(--game-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">Keep reading</button><button type="button" onClick={finishScene} className="border border-[var(--game-amber)] px-3 py-2 text-sm font-bold text-[var(--game-amber)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">Skip scene</button></div></div>
      </div>}
    </section>
  );

  if (!modal) return dialoguePanel;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 p-3 backdrop-blur-sm sm:p-6" onClick={event => event.stopPropagation()}>
      <div className="my-auto w-full max-w-5xl">{dialoguePanel}</div>
    </div>,
    document.body
  );
}
