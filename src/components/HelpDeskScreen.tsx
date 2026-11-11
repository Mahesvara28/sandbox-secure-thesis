import { useState } from 'react';
import { ArrowRight, BookOpen, CircleHelp, Lightbulb, LifeBuoy, RotateCcw, Send, TerminalSquare } from 'lucide-react';
import { Handler } from './Handler';
import type { HandlerPose } from './Handler';
import { submitFeatureSuggestion, type PlayerFeatureSuggestion } from '../Firebase';

interface HelpDeskScreenProps {
  userId: string;
  username: string;
  currentMission?: string;
}

type SuggestionCategory = PlayerFeatureSuggestion['category'];

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
    answer: 'Use Save & Pause before leaving an active mission. From the Dashboard, choose Resume Mission to continue. If saved data will not load, use Report issue in the navigation bar so the team can investigate.',
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
export default function HelpDeskScreen({ userId, username, currentMission }: HelpDeskScreenProps) {
  const [ready, setReady] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [suggestionCategory, setSuggestionCategory] = useState<SuggestionCategory>('Gameplay');
  const [suggestionTitle, setSuggestionTitle] = useState('');
  const [suggestionDescription, setSuggestionDescription] = useState('');
  const [suggestionError, setSuggestionError] = useState('');
  const [suggestionSent, setSuggestionSent] = useState(false);
  const [sendingSuggestion, setSendingSuggestion] = useState(false);
  const selected = helpTopics.find(topic => topic.id === selectedTopic);

  const sendSuggestion = async () => {
    setSendingSuggestion(true);
    setSuggestionError('');
    try {
      await submitFeatureSuggestion(userId, username, suggestionCategory, suggestionTitle, suggestionDescription);
      setSuggestionSent(true);
      setSuggestionTitle('');
      setSuggestionDescription('');
    } catch (error) {
      setSuggestionError(error instanceof Error ? error.message : 'The suggestion could not be sent. Please try again.');
    } finally {
      setSendingSuggestion(false);
    }
  };

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
              <button type="button" onClick={() => { setShowSuggestionForm(value => !value); setSuggestionError(''); setSuggestionSent(false); }} className="help-desk-secondary inline-flex min-h-10 items-center justify-center gap-2 px-3 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]"><Lightbulb size={15} aria-hidden="true" />Suggest a feature</button>
            </div>
          </div>

          {showSuggestionForm && <form className="mt-5 border border-[var(--game-cyan)]/60 bg-[var(--game-page)] p-4 sm:p-5" onSubmit={event => { event.preventDefault(); void sendSuggestion(); }}>
            <div className="flex items-start justify-between gap-3"><div><p className="game-eyebrow">Player feedback</p><h3 className="mt-1 text-lg font-black uppercase text-[var(--game-text)]">Share an idea with the team</h3><p className="mt-1 text-sm leading-6 text-[var(--game-muted)]">Suggest a game feature, learning activity, or improvement. The administrators can review your idea.</p></div><button type="button" onClick={() => setShowSuggestionForm(false)} className="min-h-9 border border-[var(--game-border)] px-3 text-sm font-bold text-[var(--game-text)]">Close</button></div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold text-[var(--game-text)]">Category<select value={suggestionCategory} onChange={event => setSuggestionCategory(event.target.value as SuggestionCategory)} className="mt-2 min-h-11 w-full border border-[var(--game-border)] bg-[var(--game-surface)] px-3 text-sm text-[var(--game-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">{(['Gameplay', 'Learning content', 'Interface', 'Accessibility', 'Other'] as const).map(category => <option key={category} value={category}>{category}</option>)}</select></label>
              <label className="block text-sm font-bold text-[var(--game-text)]">Idea title<input value={suggestionTitle} onChange={event => { setSuggestionTitle(event.target.value); setSuggestionSent(false); }} maxLength={100} minLength={5} required placeholder="e.g. Add a short alert-triage activity" className="mt-2 min-h-11 w-full border border-[var(--game-border)] bg-[var(--game-surface)] px-3 text-sm text-[var(--game-text)] placeholder:text-[var(--game-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]" /></label>
            </div>
            <label className="mt-4 block text-sm font-bold text-[var(--game-text)]">How would it help?<textarea value={suggestionDescription} onChange={event => { setSuggestionDescription(event.target.value); setSuggestionSent(false); }} maxLength={2000} minLength={10} required rows={4} placeholder="Describe the activity or change and what learners would practice." className="mt-2 w-full resize-y border border-[var(--game-border)] bg-[var(--game-surface)] p-3 text-sm leading-6 text-[var(--game-text)] placeholder:text-[var(--game-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]" /></label>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[var(--game-muted)]"><span>5–100 character title · 10–2,000 character description</span><span>{suggestionDescription.length}/2,000</span></div>
            {suggestionError && <p role="alert" className="mt-3 border border-[var(--game-red)] p-3 text-sm text-[var(--game-red)]">{suggestionError}</p>}
            {suggestionSent && <p role="status" className="mt-3 border border-[var(--game-green)] p-3 text-sm text-[var(--game-green)]">Thanks. Your suggestion was sent to the administrators for review.</p>}
            <div className="mt-4 flex justify-end"><button type="submit" disabled={sendingSuggestion || suggestionTitle.trim().length < 5 || suggestionDescription.trim().length < 10} className="inline-flex min-h-11 items-center gap-2 border border-[var(--game-green)] bg-[var(--game-green)] px-4 py-2 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-50"><Send size={15} aria-hidden="true" />{sendingSuggestion ? 'Sending…' : 'Send suggestion'}</button></div>
          </form>}

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
