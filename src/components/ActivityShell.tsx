import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, FileText, Folder, LockKeyhole, ShieldAlert, Sparkles } from 'lucide-react';
import type { ActivityDefinition } from '../data/activities';
import novaCalmImage from '../assets/NOVA_CALM.png';

export interface ActivityResult {
  activityId: string;
  deck: string;
  score: number;
  stars: number;
  mistakes: number;
  durationSeconds: number;
}

interface ActivityShellProps {
  activity: ActivityDefinition;
  sceneImage?: string;
  onBack: () => void;
  onComplete: (result: ActivityResult) => Promise<{ rewarded: boolean; xp: number; coins: number }>;
}

const strengthFor = (value: string) => {
  let score = 0;
  if (value.length >= 12) score++;
  if (value.length >= 16) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  if (/^(password|qwerty|letmein|welcome|admin)/i.test(value)) score = Math.min(score, 1);
  if (/(.)\1{2,}/.test(value)) score = Math.max(0, score - 1);
  return Math.min(5, score);
};

const strengthLabel = (score: number) => ['Very guessable', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'][score];
const estimateLabel = (score: number) => ['A common guess may find it quickly', 'A common guess may find it quickly', 'More varied guesses take longer', 'This fictional example is harder to guess', 'This fictional example is harder to guess', 'This fictional example is harder to guess'][score];

export function ActivityShell({ activity, sceneImage, onBack, onComplete }: ActivityShellProps) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [password, setPassword] = useState('');
  const [activeFolder, setActiveFolder] = useState('/case-files');
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordChecked, setPasswordChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [pendingResult, setPendingResult] = useState<ActivityResult | null>(null);
  const [finalResult, setFinalResult] = useState<{ result: ActivityResult; rewarded: boolean; xp: number; coins: number } | null>(null);
  const startedAt = useRef<number | null>(null);
  const ensureStarted = () => { startedAt.current ??= Date.now(); return startedAt.current; };
  const round = activity.rounds[index];
  const isPasswordLab = activity.kind === 'password-lab';
  const isFileFinding = activity.kind === 'file-finding';
  const fileCase = round?.fileCase;
  const correctFileIndex = fileCase?.files.findIndex(file => file.id === fileCase.targetFileId) ?? -1;
  const selectedIsCorrect = selected !== null && (isFileFinding ? selected === correctFileIndex : selected === round.answer);
  const strength = strengthFor(password);
  const strengthColor = strength <= 1 ? 'var(--game-red)' : strength <= 3 ? 'var(--game-amber)' : 'var(--game-green)';
  const passwordChecks = [
    { label: 'At least 12 characters', passed: password.length >= 12 },
    { label: '16 characters or more', passed: password.length >= 16 },
    { label: 'Uppercase and lowercase letters', passed: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: 'Includes a number', passed: /\d/.test(password) },
    { label: 'Includes a symbol', passed: /[^A-Za-z0-9]/.test(password) },
  ];
  const progressPercent = Math.round(((index + (answered ? 1 : 0)) / activity.rounds.length) * 100);
  const answeredRounds = index + Number(answered);
  const accuracyPercent = answeredRounds ? Math.round((score / answeredRounds) * 100) : 0;
  const activitySceneStyle = sceneImage ? ({ '--activity-scene-image': `url("${sceneImage}")` } as CSSProperties) : undefined;

  const finish = async (result: ActivityResult) => {
    setSaving(true);
    setSaveError('');
    try {
      const reward = await onComplete(result);
      setFinalResult({ result, ...reward });
      if (isPasswordLab) setPassword('');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save this activity. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const submitChoice = () => {
    if (selected === null || saving || answered) return;
    const correct = selectedIsCorrect;
    const nextScore = score + Number(correct);
    const nextMistakes = mistakes + Number(!correct);
    setScore(nextScore);
    setMistakes(nextMistakes);
    setPendingResult({ activityId: activity.id, deck: activity.deck, score: nextScore, stars: nextScore === activity.rounds.length ? 3 : nextScore >= Math.ceil(activity.rounds.length * 0.66) ? 2 : 1, mistakes: nextMistakes, durationSeconds: Math.max(1, Math.round((Date.now() - ensureStarted()) / 1000)) });
    setAnswered(true);
  };

  const continueRound = async () => {
    if (!pendingResult || saving) return;
    if (index === activity.rounds.length - 1) {
      await finish(pendingResult);
      return;
    }
    setSelected(null);
    setAnswered(false);
    setPendingResult(null);
    setIndex(value => value + 1);
  };

  const submitPassword = async () => {
    if (saving) return;
    const pass = password.length >= 12 && strength >= 3;
    setPasswordChecked(true);
    const nextScore = Number(pass);
    const nextMistakes = Number(!pass);
    setScore(nextScore);
    setMistakes(nextMistakes);
    const result = { activityId: activity.id, deck: activity.deck, score: nextScore, stars: nextScore ? 3 : 1, mistakes: nextMistakes, durationSeconds: Math.max(1, Math.round((Date.now() - ensureStarted()) / 1000)) };
    setPendingResult(result);
    await finish(result);
  };

  if (finalResult) return <motion.section initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="game-card activity-play-screen mx-auto w-full max-w-6xl border-[var(--game-green)] p-4 sm:p-6 lg:p-8" style={activitySceneStyle} aria-live="polite">
    <p className="game-eyebrow">Optional practice · complete</p>
    <h2 className="mt-2 text-2xl font-black uppercase text-[var(--game-text)]">Activity debrief</h2>
    <div className="mt-5 flex flex-wrap items-center gap-4 border border-[var(--game-border)] bg-[var(--game-surface-raised)] p-4">
      <span className="text-2xl text-[var(--game-amber)]" aria-label={`${finalResult.result.stars} stars`}>{'★'.repeat(finalResult.result.stars)}{'☆'.repeat(3 - finalResult.result.stars)}</span>
      <p className="text-sm font-bold text-[var(--game-text)]">Score: {finalResult.result.score}/{activity.rounds.length} · Mistakes: {finalResult.result.mistakes}</p>
    </div>
    <p className="mt-4 text-sm leading-6 text-[var(--game-muted)]">{activity.kind === 'password-lab' ? 'Strength feedback was calculated in this browser. The password itself was cleared and was never sent or saved.' : 'Practice results are separate from certification scores and do not affect tier access.'}</p>
    {finalResult.rewarded ? <p className="mt-4 border border-[var(--game-green)] p-3 text-sm font-bold text-[var(--game-green)]">First-clear reward: +{finalResult.xp} XP and +{finalResult.coins} coins.</p> : <p className="mt-4 border border-[var(--game-border)] p-3 text-sm text-[var(--game-muted)]">Replay complete. First-clear rewards were already claimed.</p>}
    <button type="button" onClick={onBack} className="mt-5 min-h-11 w-full border border-[var(--game-green)] bg-[var(--game-green)] px-4 py-3 font-bold text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">Continue Story</button>
  </motion.section>;

  return <motion.section initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="game-card activity-play-screen mx-auto w-full max-w-6xl border-[var(--game-cyan)] p-3 sm:p-5 lg:p-7" style={activitySceneStyle} aria-labelledby="activity-title">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="game-eyebrow">Optional practice · not part of certification scoring</p>
      <button type="button" onClick={onBack} className="inline-flex min-h-10 items-center gap-2 border border-[var(--game-border)] px-3 text-sm font-semibold text-[var(--game-text)] hover:border-[var(--game-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]"><ArrowLeft size={16} /> Back to story</button>
    </div>
    <h2 id="activity-title" className="mt-2 text-2xl font-black uppercase text-[var(--game-text)]">{activity.title}</h2>
    <p className="mt-2 text-sm leading-6 text-[var(--game-muted)]">{activity.intro}</p>
    <aside className="activity-nova-tip mt-4 flex items-center gap-4 border border-[var(--game-cyan)]/50 bg-[color-mix(in_srgb,var(--game-surface-raised)_94%,transparent)] p-3 text-sm leading-6 text-[var(--game-text)]" aria-label="Nova's activity guidance"><img src={novaCalmImage} alt="" aria-hidden="true" className="activity-nova-portrait hidden h-20 w-20 shrink-0 object-contain sm:block" /><span className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--game-cyan)]/50 text-[var(--game-cyan)] sm:hidden"><Sparkles size={18} aria-hidden="true" /></span><div><p className="text-xs font-bold uppercase tracking-wider text-[var(--game-cyan)]">Nova · field note</p><p className="mt-1">Take your time. Use the evidence in the prompt, and say when something is uncertain.</p></div></aside>
    <div className="activity-hud mt-5 grid grid-cols-3 gap-2 sm:gap-3" aria-label="Practice status">
      <div className="activity-hud-cell"><span className="game-eyebrow">Round</span><strong>{String(index + 1).padStart(2, '0')}<small> / {String(activity.rounds.length).padStart(2, '0')}</small></strong></div>
      <div className="activity-hud-cell"><span className="game-eyebrow">Correct</span><strong>{score}<small> / {answeredRounds || activity.rounds.length}</small></strong></div>
      <div className="activity-hud-cell"><span className="game-eyebrow">Accuracy</span><strong>{answeredRounds ? `${accuracyPercent}%` : '—'}</strong></div>
    </div>
    <div className="mt-2 h-2 overflow-hidden border border-[var(--game-border)] bg-[var(--game-surface-raised)]" role="progressbar" aria-label="Activity progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}><motion.div className="h-full bg-[var(--game-cyan)]" initial={reduceMotion ? false : { width: 0 }} animate={{ width: `${progressPercent}%` }} transition={reduceMotion ? { duration: 0 } : { duration: 0.35, ease: 'easeOut' }} /></div>
    <div className="activity-round-pips mt-2" aria-label={`${answeredRounds} of ${activity.rounds.length} rounds answered`}>{activity.rounds.map((_, roundIndex) => <span key={roundIndex} className={roundIndex < answeredRounds ? 'is-complete' : roundIndex === index ? 'is-current' : ''} />)}</div>

    {isPasswordLab ? <div className="password-lab-workspace mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
      <div className="password-lab-panel border border-[var(--game-border)] bg-[color-mix(in_srgb,var(--game-surface)_94%,transparent)] p-4 sm:p-5">
        <div className="flex items-start gap-3 border border-[var(--game-amber)]/70 bg-[var(--game-surface-raised)] p-3 text-sm leading-6 text-[var(--game-text)]"><ShieldAlert className="mt-0.5 shrink-0 text-[var(--game-amber)]" size={18} /><p><strong>Training only:</strong> make up a password. Never enter one used for a real account. This example stays in your browser and is never saved or sent.</p></div>
        <label className="mt-5 block text-sm font-bold text-[var(--game-text)]" htmlFor="fictional-password">Build a fictional passphrase</label>
        <div className="relative mt-2"><input id="fictional-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={event => { ensureStarted(); setPassword(event.target.value); setPasswordChecked(false); }} className="min-h-12 w-full border border-[var(--game-border)] bg-[var(--game-page)] px-3 pr-12 font-mono text-[var(--game-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]" placeholder="Try a made-up phrase" aria-describedby="password-lab-tip" /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide fictional passphrase' : 'Show fictional passphrase'} aria-pressed={showPassword} className="absolute inset-y-1 right-1 inline-flex w-10 items-center justify-center text-[var(--game-muted)] hover:text-[var(--game-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
        <p id="password-lab-tip" className="mt-2 text-sm leading-6 text-[var(--game-muted)]">A longer, less predictable phrase is easier to remember and harder to guess than a short, common word.</p>
        <button type="button" disabled={saving || !password} onClick={() => void submitPassword()} className="mt-5 min-h-11 w-full border border-[var(--game-green)] bg-[var(--game-green)] px-4 py-3 font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">{saving ? 'Saving…' : 'Check fictional example'}</button>
      </div>
      <div className="password-lab-panel border border-[var(--game-border)] bg-[color-mix(in_srgb,var(--game-surface)_94%,transparent)] p-4 sm:p-5" aria-live="polite">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="game-eyebrow">Live estimate</p><h3 className="mt-1 text-lg font-bold text-[var(--game-text)]">{strengthLabel(strength)}</h3></div><span className="border border-[var(--game-border)] px-2 py-1 text-xs text-[var(--game-muted)]">Browser only</span></div>
        <div className="mt-4 grid grid-cols-5 gap-1.5" role="img" aria-label={`Estimated strength: ${strength} out of 5`}>
          {Array.from({ length: 5 }, (_, i) => <motion.span key={i} className="h-3 border border-[var(--game-border)]" animate={{ backgroundColor: i < strength ? strengthColor : 'var(--game-track)', borderColor: i < strength ? strengthColor : 'var(--game-border)' }} transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }} />)}
        </div>
        <p className="mt-3 text-sm leading-6 text-[var(--game-muted)]">{estimateLabel(strength)}. This is a simple learning estimate, not a real password-cracking calculation.</p>
        <div className="mt-5 border-t border-[var(--game-border)] pt-4"><h4 className="text-sm font-bold text-[var(--game-text)]">What helps?</h4><ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {passwordChecks.map(check => <li key={check.label} className="flex items-center gap-2 text-sm text-[var(--game-text)]"><span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${check.passed ? 'border-[var(--game-green)] text-[var(--game-green)]' : 'border-[var(--game-border)] text-[var(--game-muted)]'}`} aria-hidden="true">{check.passed ? '✓' : '·'}</span>{check.label}</li>)}
        </ul></div>
        {passwordChecked && <p className="mt-4 border border-[var(--game-cyan)]/70 bg-[var(--game-surface-raised)] p-3 text-sm font-semibold leading-6 text-[var(--game-text)]" role="status">{password.length >= 12 && strength >= 3 ? 'Good practice: use a long, unique passphrase.' : 'Try a longer, less predictable fictional phrase.'}</p>}
      </div>
    </div> : isFileFinding && fileCase ? <div className="file-finding-workspace mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)]">
      <section className="border border-[var(--game-border)] bg-[color-mix(in_srgb,var(--game-surface)_94%,transparent)] p-4 sm:p-5" aria-label="Simulated case folders">
        <div className="flex items-center justify-between gap-3">
          <div><p className="game-eyebrow">Case workspace</p><h3 className="mt-1 break-all font-mono text-sm font-bold text-[var(--game-text)]">{activeFolder}</h3></div>
          <Folder size={20} className="shrink-0 text-[var(--game-cyan)]" aria-hidden="true" />
        </div>
        <p className="mt-2 text-sm leading-6 text-[var(--game-muted)]">Browse the folders, open a record, and collect the one that supports the case.</p>
        <div className="mt-4 grid gap-2" role="group" aria-label="Folders">
          {fileCase.folders.map(folder => <button key={folder} type="button" aria-pressed={activeFolder === folder} onClick={() => { setActiveFolder(folder); setSelectedFileIndex(null); setSelected(null); }} className={`flex min-h-11 items-center gap-2 border px-3 py-2 text-left font-mono text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)] ${activeFolder === folder ? 'border-[var(--game-cyan)] bg-[var(--game-surface-raised)] text-[var(--game-cyan)]' : 'border-[var(--game-border)] text-[var(--game-text)] hover:border-[var(--game-cyan)]'}`}><Folder size={16} aria-hidden="true" /><span className="break-all">{folder.split('/').filter(Boolean).pop() || 'case-files'}</span></button>)}
        </div>
        <div className="mt-5 border-t border-[var(--game-border)] pt-4"><p className="game-eyebrow">Files in this folder</p><div className="mt-2 grid gap-2">
          {fileCase.files.map((file, fileIndex) => file.folder === activeFolder && <button key={file.id} type="button" draggable={!answered} aria-pressed={selectedFileIndex === fileIndex} onDragStart={event => event.dataTransfer.setData('text/plain', String(fileIndex))} onClick={() => { ensureStarted(); setSelectedFileIndex(fileIndex); setSelected(fileIndex); }} className={`flex min-h-12 items-center gap-3 border px-3 py-2 text-left text-sm transition-[border-color,background-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)] ${selectedFileIndex === fileIndex ? 'border-[var(--game-cyan)] bg-[var(--game-surface-raised)] text-[var(--game-cyan)]' : 'border-[var(--game-border)] text-[var(--game-text)] hover:-translate-y-0.5 hover:border-[var(--game-cyan)]'} ${answered ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}><FileText size={17} className="shrink-0" aria-hidden="true" /><span className="min-w-0 flex-1 truncate font-mono">{file.name}</span><span className="shrink-0 text-xs text-[var(--game-muted)]">{file.modified}</span></button>)}
          {!fileCase.files.some(file => file.folder === activeFolder) && <p className="border border-dashed border-[var(--game-border)] p-3 text-sm text-[var(--game-muted)]">This folder is empty.</p>}
        </div></div>
      </section>
      <div className="grid content-start gap-4">
        <section className="min-h-56 border border-[var(--game-border)] bg-[color-mix(in_srgb,var(--game-surface)_94%,transparent)] p-4 sm:p-5" aria-label="File preview">
          <div className="flex items-center justify-between gap-3"><div><p className="game-eyebrow">File preview</p><h3 className="mt-1 break-all font-mono text-sm font-bold text-[var(--game-text)]">{selectedFileIndex === null ? 'Select a file to inspect' : fileCase.files[selectedFileIndex]?.name}</h3></div><Eye size={18} className="shrink-0 text-[var(--game-cyan)]" aria-hidden="true" /></div>
          <pre className="mt-4 min-h-28 whitespace-pre-wrap break-words border border-[var(--game-border)] bg-[var(--game-page)] p-3 font-mono text-sm leading-6 text-[var(--game-text)]">{selectedFileIndex === null ? 'File contents will appear here. Opening a file only reads this fictional training record.' : fileCase.files[selectedFileIndex]?.contents}</pre>
        </section>
        <section className={`file-evidence-tray min-h-32 border-2 border-dashed p-4 sm:p-5 ${selectedFileIndex !== null ? 'border-[var(--game-cyan)] bg-[color-mix(in_srgb,var(--game-cyan)_6%,var(--game-surface))]' : 'border-[var(--game-border)] bg-[color-mix(in_srgb,var(--game-surface)_94%,transparent)]'}`} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (answered) return; const fileIndex = Number(event.dataTransfer.getData('text/plain')); if (Number.isInteger(fileIndex) && fileIndex >= 0 && fileIndex < fileCase.files.length) { ensureStarted(); setSelectedFileIndex(fileIndex); setSelected(fileIndex); } }} aria-label="Evidence collection tray">
          <p className="game-eyebrow">Evidence tray</p><p className="mt-2 text-sm leading-6 text-[var(--game-text)]">{selectedFileIndex === null ? 'Drag a file here, or select one from the list.' : <><strong>Collected:</strong> {fileCase.files[selectedFileIndex]?.name}</>}</p><p className="mt-1 text-xs leading-5 text-[var(--game-muted)]">The file stays inside this simulated activity. No real files are opened or uploaded.</p>
        </section>
      </div>
      {answered && <div role="status" className={`lg:col-span-2 border p-4 text-sm leading-6 ${selectedIsCorrect ? 'border-[var(--game-green)] text-[var(--game-text)]' : 'border-[var(--game-amber)] text-[var(--game-text)]'}`}><p className="font-bold">{selectedIsCorrect ? <><CheckCircle2 size={16} className="mr-2 inline" />Evidence collected</> : 'That record does not support this objective'}</p><p className="mt-1">{round.explanation}</p></div>}
      <button type="button" disabled={selected === null || saving} onClick={answered ? () => void continueRound() : submitChoice} className="mt-1 min-h-11 w-full border border-[var(--game-green)] bg-[var(--game-green)] px-4 py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)] lg:col-span-2">{saving ? 'Saving…' : answered ? 'Continue' : 'Collect selected evidence'}</button>
    </div> : <>
      <div className="activity-evidence-card mt-5 border border-[var(--game-border)] bg-[var(--game-surface-raised)] p-4 sm:p-5"><p className="text-xs font-bold uppercase tracking-wide text-[var(--game-cyan)]">{activity.kind === 'command-match' ? 'Simulated command' : activity.kind === 'phish' ? 'Compare the messages' : activity.kind === 'alert-triage' ? 'Alert card' : activity.kind === 'timeline' ? 'Timeline record' : 'Training string'}</p><p className="mt-3 whitespace-pre-wrap break-words text-base leading-7 text-[var(--game-text)]">{round.prompt}</p></div>
      {activity.kind === 'phish' && round.emailPair ? <fieldset className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2" disabled={answered}><legend className="mb-3 text-sm font-bold text-[var(--game-text)]">Select the suspicious email</legend>{round.emailPair.map((email, optionIndex) => { const correct = answered && optionIndex === round.answer; const chosenWrong = answered && selected === optionIndex && !correct; const chosen = selected === optionIndex; return <label key={`${email.sender}-${email.subject}`} className={`activity-answer-card relative flex min-h-48 cursor-pointer flex-col border p-4 text-[var(--game-text)] transition-[border-color,background-color,transform,box-shadow] duration-200 motion-reduce:transition-none focus-within:ring-2 focus-within:ring-[var(--game-cyan)] ${correct ? 'border-[var(--game-green)] bg-[color-mix(in_srgb,var(--game-green)_12%,var(--game-surface-raised))] shadow-[0_0_20px_color-mix(in_srgb,var(--game-green)_16%,transparent)]' : chosenWrong ? 'border-[var(--game-amber)] bg-[color-mix(in_srgb,var(--game-amber)_10%,var(--game-surface-raised))]' : chosen ? 'border-[var(--game-cyan)] bg-[var(--game-surface-raised)] shadow-[0_0_20px_color-mix(in_srgb,var(--game-cyan)_15%,transparent)]' : 'border-[var(--game-border)] hover:-translate-y-0.5 hover:border-[var(--game-cyan)] hover:shadow-[var(--game-shadow)]'}`}><span className="mb-3 flex items-center gap-2 font-bold text-[var(--game-cyan)]"><input type="radio" name={`activity-${activity.id}-${index}`} checked={chosen} onChange={() => { ensureStarted(); setSelected(optionIndex); }} className="h-5 w-5 accent-[var(--game-cyan)]" />Email {String.fromCharCode(65 + optionIndex)}{correct && <CheckCircle2 size={18} className="ml-auto text-[var(--game-green)]" aria-label="Suspicious email identified" />}{chosenWrong && <span className="ml-auto text-xs font-bold text-[var(--game-amber)]">Your choice</span>}</span><span className="grid grid-cols-[5rem_minmax(0,1fr)] gap-x-2 gap-y-2 text-sm leading-6"><strong className="text-[var(--game-muted)]">From</strong><span className="break-all">{email.sender}</span><strong className="text-[var(--game-muted)]">Subject</strong><span className="break-words font-semibold">{email.subject}</span><strong className="text-[var(--game-muted)]">Message</strong><span className="break-words">{email.body}</span></span></label>;})}</fieldset> : <fieldset className="activity-choice-grid mt-4 grid grid-cols-1 gap-2 lg:grid-cols-2" disabled={answered}><legend className="mb-2 text-sm font-bold text-[var(--game-text)]">Choose one answer</legend>{round.options.map((option, optionIndex) => { const correct = answered && optionIndex === round.answer; const chosenWrong = answered && selected === optionIndex && !correct; const chosen = selected === optionIndex; return <label key={option} className={`activity-answer-card flex min-h-16 cursor-pointer items-start gap-3 border p-4 text-sm leading-6 text-[var(--game-text)] transition-[border-color,background-color,transform,box-shadow] duration-200 motion-reduce:transition-none focus-within:ring-2 focus-within:ring-[var(--game-cyan)] ${correct ? 'border-[var(--game-green)] bg-[color-mix(in_srgb,var(--game-green)_12%,var(--game-surface-raised))]' : chosenWrong ? 'border-[var(--game-amber)] bg-[color-mix(in_srgb,var(--game-amber)_10%,var(--game-surface-raised))]' : chosen ? 'border-[var(--game-cyan)] bg-[var(--game-surface-raised)]' : 'border-[var(--game-border)] hover:-translate-y-0.5 hover:border-[var(--game-cyan)] hover:shadow-[var(--game-shadow)]'}`}><input type="radio" name={`activity-${activity.id}-${index}`} checked={chosen} onChange={() => { ensureStarted(); setSelected(optionIndex); }} className="mt-1 h-5 w-5 accent-[var(--game-cyan)]" /><span className="flex flex-1 items-center justify-between gap-3"><span>{option}</span>{correct && <CheckCircle2 size={18} className="shrink-0 text-[var(--game-green)]" aria-label="Correct answer" />}{chosenWrong && <span className="shrink-0 text-xs font-bold text-[var(--game-amber)]">Your choice</span>}</span></label>;})}</fieldset>}
      {answered && <div role="status" className={`mt-4 border p-4 text-sm leading-6 ${selectedIsCorrect ? 'border-[var(--game-green)] text-[var(--game-text)]' : 'border-[var(--game-amber)] text-[var(--game-text)]'}`}><p className="font-bold">{selectedIsCorrect ? <><CheckCircle2 size={16} className="mr-2 inline" />Correct</> : 'Review this clue'}</p><p className="mt-1">{round.explanation}</p></div>}
      <button type="button" disabled={selected === null || saving} onClick={answered ? () => void continueRound() : submitChoice} className="mt-4 min-h-11 w-full border border-[var(--game-green)] bg-[var(--game-green)] px-4 py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">{saving ? 'Saving…' : answered ? index === activity.rounds.length - 1 ? 'Finish activity' : 'Continue' : 'Check answer'}</button>
    </>}
    {saveError && pendingResult && <div role="alert" className="mt-4 flex items-start gap-2 border border-red-500 p-3 text-sm text-red-300"><LockKeyhole size={16} className="mt-0.5 shrink-0" /><div><p>{saveError}</p><button type="button" onClick={() => void finish(pendingResult)} className="mt-2 underline">Retry save</button></div></div>}
  </motion.section>;
}
