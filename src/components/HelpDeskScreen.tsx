import { useState } from 'react';
import { ArrowRight, BookOpen, CircleHelp, LifeBuoy, MessageSquareWarning, RotateCcw, TerminalSquare } from 'lucide-react';
import { Handler } from './Handler';
import type { HandlerPose } from './Handler';

interface HelpDeskScreenProps {
  currentMission?: string;
  onReportIssue?: () => void;
}

const helpTopics = [
  {
    id: 'start',
    label: 'Where should I start?',
    icon: BookOpen,
    answer: 'Open Academy to follow the certification path. Start with the first available step; each mission builds on the one before it.',
  },
  {
    id: 'commands',
    label: 'I’m stuck on a command',
    icon: TerminalSquare,
    answer: 'Use the Hint for a nudge, Help to see simulated commands, or the Command Field Guide for examples and plain-language explanations. Commands here only affect the training simulation.',
  },
  {
    id: 'progress',
    label: 'Where did my progress go?',
    icon: RotateCcw,
    answer: 'Use Save & Pause before leaving an active mission. From the Dashboard, choose Resume Mission to continue. If saved data will not load, use the Report an issue button on Nova’s help desk so the team can investigate.',
  },
  {
    id: 'assessments',
    label: 'How do assessments work?',
    icon: CircleHelp,
    answer: 'The pre-test checks what you know before the tier. Complete its missions, then take the post-test to review what you learned. Your scores are shown in Academy and Profile.',
  },
];

const answerPoses: Record<string, HandlerPose> = {
  start: 'encourage',
  commands: 'thinking',
  progress: 'alert',
  assessments: 'talking',
};

/** Curated in-game guidance for common player questions. */
export default function HelpDeskScreen({ currentMission, onReportIssue }: HelpDeskScreenProps) {
  const [ready, setReady] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const selected = helpTopics.find(topic => topic.id === selectedTopic);

  return (
    <section className="help-desk-shell mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8" aria-labelledby="help-desk-title">
      <header className="help-desk-header">
        <div>
          <p className="game-eyebrow">Player support · Nova’s help desk</p>
          <h1 id="help-desk-title" className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">Need a hand, Operator?</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--game-muted)] sm:text-base">
            Get a quick guide for the game and your current mission.
          </p>
        </div>
        {currentMission && <p className="help-desk-context"><span>Current operation</span>{currentMission}</p>}
      </header>

      <div className="help-desk-layout mt-6">
        <aside className={`help-desk-nova ${ready ? 'is-ready' : 'is-overloaded'}`} aria-label="Nova, your training mentor">
          <div className="help-desk-portrait">
            <Handler pose={ready ? (selected ? answerPoses[selected.id] : 'fixing') : 'overworked'} size={320} speaking={false} />
          </div>
          <div className="help-desk-mood" aria-live="polite">
            <span className="game-eyebrow">Nova · Senior analyst</span>
            <strong>{ready ? 'Okay. I’ve got this.' : 'One moment… too many alerts!'}</strong>
            <p>{ready ? 'Tell me what you need and we’ll work through it together.' : 'I have 47 tabs open and one of them is making a noise.'}</p>
          </div>
          {!ready && <button type="button" onClick={() => { setReady(true); setSelectedTopic(null); }} className="help-desk-primary mt-4 inline-flex items-center justify-center gap-2 px-5 py-3 font-bold">
            I need help <ArrowRight size={16} />
          </button>}
        </aside>

        <div className="help-desk-panel">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--game-border)] pb-4">
            <div>
              <p className="game-eyebrow">Quick answers</p>
              <h2 className="mt-1 text-xl font-black uppercase">What can Nova help with?</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {ready && <span className="help-desk-status"><span /> Assistant ready</span>}
              {onReportIssue && <button type="button" onClick={onReportIssue} className="help-desk-secondary inline-flex min-h-10 items-center justify-center gap-2 px-3 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]"><MessageSquareWarning size={15} aria-hidden="true" />Report an issue</button>}
            </div>
          </div>

          {!ready ? (
            <div className="help-desk-placeholder" aria-live="polite">
              <LifeBuoy size={25} />
              <p>Click <strong>“I need help”</strong> when you’re ready. Nova will take a breath and bring up the help topics.</p>
            </div>
          ) : (
            <>
              <div className="help-topic-grid" aria-label="Choose a help topic">
                {helpTopics.map(topic => {
                  const Icon = topic.icon;
                  return <button key={topic.id} type="button" onClick={() => setSelectedTopic(topic.id)} aria-pressed={selectedTopic === topic.id} className={`help-topic ${selectedTopic === topic.id ? 'is-selected' : ''}`}>
                    <Icon size={18} aria-hidden="true" /><span>{topic.label}</span><ArrowRight size={15} className="help-topic-arrow" aria-hidden="true" />
                  </button>;
                })}
              </div>

              <div className="help-answer" aria-live="polite" aria-atomic="true">
                {selected ? <>
                  <p className="game-eyebrow">Nova says</p>
                  <h3>{selected.label}</h3>
                  <p>{selected.answer}</p>
                </> : <p>Select a topic above and Nova will walk you through it.</p>}
              </div>

            </>
          )}
        </div>
      </div>
    </section>
  );
}
