import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Award, BookOpen, CheckCircle2, CircleHelp, ClipboardCheck, LockKeyhole, Play, TerminalSquare } from 'lucide-react';
import type { Tier } from '../data/gameData';
import type { CampaignProgress } from '../Firebase';
import { STORY_CHAPTERS, type CampaignChapter, type CampaignNode } from '../data/storyCampaign';
import { DialogueBox } from './DialogueBox';
import { Handler } from './Handler';
import { ActivityShell, type ActivityResult } from './ActivityShell';
import { ACTIVITY_CATALOG } from '../data/activities';
import computerLabScene from '../assets/Computer_Lab.jpg';
import libraryDeskScene from '../assets/Library_Desk.jpg';
import networkClosetScene from '../assets/Network_Closet.jpg';
import triageScene from '../assets/Triage.jpg';

interface StoryCampaignScreenProps {
  tier: Tier;
  completedMissions: string[];
  assessmentProgress: Record<Tier, { preTestComplete: boolean; postTestComplete: boolean }>;
  unlockedTiers: Record<Tier, boolean>;
  campaignProgress: CampaignProgress;
  skipStoryScenes: boolean;
  progressLoadFailed: boolean;
  assessmentScores: Record<'pre' | 'post', { score: number | null; total: number }>;
  onCompleteNode: (nodeId: string) => void;
  onStartMission: (missionId: string) => void;
  onAssessment: (tier: Tier, kind: 'pre' | 'post') => void;
  onReviewAssessment: (kind: 'pre' | 'post') => void;
  onActivityComplete: (nodeId: string, result: ActivityResult) => Promise<{ rewarded: boolean; xp: number; coins: number }>;
  onExit: () => void;
}

const iconFor = (type: CampaignNode['type']) => type === 'mission' ? TerminalSquare : type === 'assessment' ? ClipboardCheck : type === 'activity' ? CircleHelp : type === 'debrief' ? Award : BookOpen;

const chapterOpening: Record<Tier, { intro: string; scene: string }> = {
  BEGINNER: {
    intro: 'At Harborview Learning Center, a computer recorded unusual activity at 3:12 AM. Meet the team and follow the clues before deciding what happened.',
    scene: 'After-hours computer lab at Harborview Learning Center',
  },
  INTERMEDIATE: {
    intro: 'The overnight activity did not end with one login. The team has found a quiet process and needs to learn what it is doing before taking action.',
    scene: 'Harborview’s network room during the follow-up investigation',
  },
  EXPERT: {
    intro: 'A suspicious scheduled task could let the visitor return. Compare the evidence, build a careful timeline, and decide what the records can support.',
    scene: 'Harborview’s network room, where the team checks a possible return path',
  },
};

const chapterCast = [
  { name: 'Nova', role: 'Senior analyst · your patient mentor', character: 'nova' as const, pose: 'thinking' as const },
  { name: 'Mr. Santos', role: 'Harborview IT teacher', character: 'santos' as const, pose: 'talking' as const },
  { name: 'Ms. Lim', role: 'Harborview librarian', character: 'lim' as const, pose: 'hesitant' as const },
];

const nextRequiredNode = (chapter: CampaignChapter, completedMissions: string[], assessment: { preTestComplete: boolean; postTestComplete: boolean }, campaign: CampaignProgress) => {
  if (!assessment.preTestComplete) return chapter.nodes.find(node => node.type === 'assessment' && node.assessmentKind === 'pre')?.id ?? null;
  const intro = chapter.nodes.find(node => node.id.endsWith('-intro'));
  if (intro && !campaign.completedNodeIds.includes(intro.id)) return intro.id;
  const mission = chapter.nodes.find(node => node.type === 'mission' && node.missionId && !completedMissions.includes(node.missionId));
  if (mission) return mission.id;
  const debrief = chapter.nodes.find(node => node.type === 'debrief');
  if (debrief && !campaign.completedNodeIds.includes(debrief.id)) return debrief.id;
  if (!assessment.postTestComplete) return chapter.nodes.find(node => node.type === 'assessment' && node.assessmentKind === 'post')?.id ?? null;
  return chapter.nodes.find(node => node.id.endsWith('-certificate'))?.id ?? null;
};

export function StoryCampaignScreen({ tier, completedMissions, assessmentProgress, assessmentScores, unlockedTiers, campaignProgress, skipStoryScenes, progressLoadFailed, onCompleteNode, onStartMission, onAssessment, onReviewAssessment, onActivityComplete, onExit }: StoryCampaignScreenProps) {
  const activeTier = tier;
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const chapter = STORY_CHAPTERS.find(item => item.id === tier)!;
    return nextRequiredNode(chapter, completedMissions, assessmentProgress[tier], campaignProgress);
  });
  const [recap, setRecap] = useState<string | null>(null);
  const [startedIntroId, setStartedIntroId] = useState<string | null>(null);
  const [castIntroId, setCastIntroId] = useState<string | null>(null);
  const activeChapter = STORY_CHAPTERS.find(chapter => chapter.id === activeTier)!;
  const activeAssessment = assessmentProgress[activeTier];
  const completedNodes = new Set(campaignProgress.completedNodeIds);
  const selected = activeChapter.nodes.find(node => node.id === selectedId) ?? null;
  const activity = selected?.type === 'activity' && selected.activityId ? ACTIVITY_CATALOG[selected.activityId] : null;
  const sceneImage = selected?.id === 'c1-intro' ? computerLabScene
    : selected?.id === 'c2-intro' ? networkClosetScene
    : selected?.id === 'c1-debrief' ? libraryDeskScene
      : selected?.id === 'c2-debrief' || selected?.id === 'c3-intro' ? networkClosetScene
        : selected?.id === 'c3-finale' ? computerLabScene : libraryDeskScene;
  const activityImage = activity?.kind === 'alert-triage' ? triageScene
    : activity?.kind === 'phish' || activity?.kind === 'file-finding' ? libraryDeskScene
      : activity?.kind === 'password-lab' ? computerLabScene
        : activity?.kind === 'decoder' || activity?.kind === 'timeline' ? networkClosetScene : computerLabScene;
  const activityView = Boolean(activity && unlockedTiers[activeTier]);

  const isDone = (node: CampaignNode) => {
    if (node.type === 'mission') return Boolean(node.missionId && completedMissions.includes(node.missionId));
    if (node.type === 'assessment') return node.assessmentKind === 'pre' ? activeAssessment.preTestComplete : activeAssessment.postTestComplete;
    return completedNodes.has(node.id);
  };
  const firstRequiredNode = activeChapter.nodes.find(node => !node.optional && !isDone(node));
  const isUnlocked = (node: CampaignNode) => Boolean(unlockedTiers[activeTier]) && (Boolean(node.optional) || isDone(node) || node.id === firstRequiredNode?.id);
  const completeScene = (node: CampaignNode) => {
    onCompleteNode(node.id);
    setRecap(node.summary);
    setSelectedId(null);
  };
  const selectNode = (node: CampaignNode) => {
    if (!isUnlocked(node)) return;
    setRecap(null);
    if ((node.type === 'story' || node.type === 'debrief') && skipStoryScenes) {
      completeScene(node);
      return;
    }
    setSelectedId(node.id);
    setStartedIntroId(null);
    setCastIntroId(null);
  };
  const isChapterIntro = Boolean(selected?.type === 'story' && selected.id.endsWith('-intro'));

  return <div className={`game-screen mx-auto min-h-full w-full ${activityView ? 'max-w-none' : 'max-w-6xl'} space-y-6 px-4 py-6 sm:px-6 lg:px-8`}>
    {!activityView && <header className="game-card border-[var(--game-cyan)] p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="game-eyebrow">Story chapter · {activeTier} certification</p>
      <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-[var(--game-text)] sm:text-4xl">{activeChapter.title}</h1>
        </div>
        <button type="button" onClick={onExit} className="min-h-10 shrink-0 border border-[var(--game-border)] px-4 py-2 text-sm font-bold text-[var(--game-text)] hover:border-[var(--game-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">← Back to certification tiers</button>
      </div>
      <p className="mt-2 text-sm font-semibold text-[var(--game-cyan)]">{activeChapter.subtitle}</p>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--game-muted)]">This certification is told as a Harborview story chapter. Follow the case through its assessment, missions, and debrief; optional activities add practice without changing your certification score.</p>
      {progressLoadFailed && <p role="status" className="mt-4 border border-[var(--game-amber)] p-3 text-sm text-[var(--game-text)]">Saved progress did not load. Campaign progress cannot be saved until progress is reloaded.</p>}
      {recap && <p role="status" className="mt-4 border-l-2 border-[var(--game-cyan)] bg-[var(--game-surface-raised)] p-3 text-sm text-[var(--game-text)]"><strong>Scene recap:</strong> {recap}</p>}
    </header>}

    {!unlockedTiers[activeTier] && <section className="game-card border-[var(--game-amber)] p-5"><p className="game-eyebrow">Tier locked</p><h2 className="mt-2 text-xl font-black uppercase text-[var(--game-text)]">Complete the prior certification tier</h2><p className="mt-2 text-sm leading-6 text-[var(--game-muted)]">This journey follows the Academy’s existing certification access rules. Story and optional activity completion do not unlock tiers.</p></section>}

    {selected && unlockedTiers[activeTier] && (selected.type === 'story' || selected.type === 'debrief') && selected.beats && createPortal(
      <section className="story-scene-backdrop fixed inset-0 z-[160] flex min-h-[100svh] flex-col overflow-y-auto bg-black/85 p-3 sm:p-5 lg:p-8" style={{ backgroundImage: `linear-gradient(110deg, rgba(3, 10, 14, .55), rgba(3, 10, 14, .35)), url("${sceneImage}")` }} aria-label={`${selected.title} presentation`}>
        <div className="mx-auto flex min-h-[calc(100svh-1.5rem)] w-full max-w-[1440px] flex-1 flex-col sm:min-h-[calc(100svh-2.5rem)] lg:min-h-[calc(100svh-4rem)]">
          <div className="mb-3 flex shrink-0 items-center justify-between gap-4 text-sm"><p className="game-eyebrow border border-[var(--game-border)] bg-black/35 px-3 py-2 text-white">{activeTier} · {selected.title}</p><button type="button" onClick={() => setSelectedId(null)} className="min-h-10 border border-[var(--game-border)] bg-black/45 px-4 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Return to path</button></div>
          {isChapterIntro && startedIntroId !== selected.id ? <section className="mx-auto my-auto w-full max-w-5xl overflow-hidden border border-[var(--game-border)] bg-[#0b141b]/95 shadow-2xl" aria-labelledby="chapter-opening-title">
            {castIntroId !== selected.id ? <>
              <img src={sceneImage} alt={chapterOpening[activeTier].scene} className="h-[36svh] min-h-56 max-h-[460px] w-full object-cover object-center sm:h-[42svh]" />
              <div className="p-5 sm:p-7">
                <p className="game-eyebrow text-cyan-200">Story chapter {activeTier === 'BEGINNER' ? '01' : activeTier === 'INTERMEDIATE' ? '02' : '03'} · {activeTier} certification</p>
                <h2 id="chapter-opening-title" className="mt-2 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">{activeChapter.title}</h2>
                <p className="mt-2 text-sm font-semibold text-cyan-200">{activeChapter.subtitle}</p>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-100">{chapterOpening[activeTier].intro}</p>
                <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-[var(--game-border)] pt-4">
                  <button type="button" onClick={() => setSelectedId(null)} className="min-h-11 border border-[var(--game-border)] px-4 py-2 text-sm font-bold text-white hover:border-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Return to story path</button>
                  <button type="button" onClick={() => setCastIntroId(selected.id)} className="min-h-11 border border-cyan-300 bg-cyan-300 px-5 py-2 text-sm font-black text-slate-950 hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Meet the characters</button>
                </div>
              </div>
            </> : <div className="p-5 sm:p-8">
              <p className="game-eyebrow text-cyan-200">Story chapter cast · {activeTier}</p>
              <h2 id="chapter-opening-title" className="mt-2 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">Meet the Harborview team</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-200">These are the people you’ll work with in this chapter. Nova will guide the investigation; the Harborview team will share what they observed.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {chapterCast.map(person => <div key={person.name} className="flex min-w-0 items-center gap-4 border border-[var(--game-border)] bg-black/25 p-4">
                  <Handler pose={person.pose} size={82} speaking={false} character={person.character} />
                  <div className="min-w-0"><p className="font-bold text-white">{person.name}</p><p className="mt-1 text-xs leading-5 text-gray-300">{person.role}</p></div>
                </div>)}
              </div>
              <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-[var(--game-border)] pt-4">
                <button type="button" onClick={() => setCastIntroId(null)} className="min-h-11 border border-[var(--game-border)] px-4 py-2 text-sm font-bold text-white hover:border-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Back to scene</button>
                <button type="button" onClick={() => setStartedIntroId(selected.id)} className="min-h-11 border border-cyan-300 bg-cyan-300 px-5 py-2 text-sm font-black text-slate-950 hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Start chapter dialogue</button>
              </div>
            </div>}
          </section> : <DialogueBox beats={selected.beats} sceneLabel={selected.title} className="story-dialogue-box" onComplete={() => completeScene(selected)} />}
        </div>
      </section>,
      document.body
    )}

    {selected?.type === 'assessment' && unlockedTiers[activeTier] && (() => {
      const kind = selected.assessmentKind ?? 'pre';
      const completed = kind === 'pre' ? activeAssessment.preTestComplete : activeAssessment.postTestComplete;
      const score = assessmentScores[kind];
      const percent = score.score !== null && score.total > 0 ? Math.round((score.score / score.total) * 100) : null;
      return <section className="game-card p-5" aria-live="polite">
        <h2 className="text-xl font-black uppercase text-[var(--game-text)]">{selected.title}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--game-muted)]">{selected.summary} Your score and timer use the existing Academy assessment.</p>
        {completed && <p className="mt-3 border border-[var(--game-green)]/60 bg-[var(--game-green)]/10 p-3 text-sm font-semibold text-[var(--game-green)]">{kind === 'pre' ? 'Pre-test completed. This baseline can only be taken once.' : 'Assessment completed.'}{percent !== null && ` Recorded score: ${score.score}/${score.total} (${percent}%).`}</p>}
        <div className="mt-4 flex flex-wrap gap-3">
          {!(kind === 'pre' && completed) && <button type="button" onClick={() => onAssessment(activeTier, kind)} className="min-h-11 border border-[var(--game-green)] bg-[var(--game-green)] px-4 py-2 font-bold text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">{kind === 'post' && completed ? 'Retake assessment' : 'Open assessment'}</button>}
          {completed && <button type="button" onClick={() => onReviewAssessment(kind)} className="min-h-11 border border-[var(--game-cyan)] px-4 py-2 font-semibold text-[var(--game-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">Review answers</button>}
          <button type="button" onClick={() => setSelectedId(null)} className="min-h-11 border border-[var(--game-border)] px-4 py-2 font-semibold text-[var(--game-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">Back to journey</button>
        </div>
      </section>;
    })()}

    {selected?.type === 'mission' && selected.missionId && unlockedTiers[activeTier] && <section className="game-card p-5" aria-live="polite"><p className="game-eyebrow">Academy mission · existing flow</p><h2 className="mt-2 text-xl font-black uppercase text-[var(--game-text)]">{selected.title}</h2><p className="mt-2 text-sm leading-6 text-[var(--game-muted)]">{selected.summary} Mission steps, timer, hints, scoring, and saved progress stay in the existing Academy mission flow.</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => onStartMission(selected.missionId!)} className="min-h-11 border border-[var(--game-green)] bg-[var(--game-green)] px-4 py-2 font-bold text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">{isDone(selected) ? 'Replay mission' : 'Start mission'}</button><button type="button" onClick={() => setSelectedId(null)} className="min-h-11 border border-[var(--game-border)] px-4 py-2 font-semibold text-[var(--game-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">Back to story</button></div></section>}

    {activity && selected && unlockedTiers[activeTier] && <ActivityShell activity={activity} sceneImage={activityImage} onBack={() => setSelectedId(null)} onComplete={result => onActivityComplete(selected.id, result)} />}

    {!activityView && unlockedTiers[activeTier] && <ol className="relative space-y-3" aria-label={`${activeTier} story path`}>
      {activeChapter.nodes.map((node, index) => {
        const done = isDone(node);
        const unlocked = isUnlocked(node);
        const isCurrent = !done && !node.optional && node.id === firstRequiredNode?.id;
        const Icon = done ? CheckCircle2 : unlocked ? iconFor(node.type) : LockKeyhole;
        const assessmentKind = node.type === 'assessment' ? node.assessmentKind ?? 'pre' : null;
        const assessmentScore = assessmentKind ? assessmentScores[assessmentKind] : null;
        const assessmentPercent = assessmentScore?.score !== null && assessmentScore?.score !== undefined && assessmentScore.total > 0
          ? Math.round((assessmentScore.score / assessmentScore.total) * 100)
          : null;

        return <li key={node.id} className={`game-card min-w-0 p-4 sm:p-5 ${done ? 'border-[var(--game-green)]/70' : isCurrent ? 'border-[var(--game-cyan)]' : ''}`}>
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center border ${done ? 'border-[var(--game-green)] text-[var(--game-green)]' : isCurrent ? 'border-[var(--game-cyan)] text-[var(--game-cyan)]' : 'border-[var(--game-border)] text-[var(--game-muted)]'}`} aria-hidden="true"><Icon size={19} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><p className="game-eyebrow">{node.optional ? 'Optional activity' : node.type === 'story' ? 'Chapter story scene' : node.type === 'debrief' ? 'Chapter debrief scene' : `Chapter step ${String(index + 1).padStart(2, '0')}`}</p>{done && <span className="border border-[var(--game-green)] px-2 py-0.5 text-xs font-bold text-[var(--game-green)]">DONE</span>}{isCurrent && <span className="border border-[var(--game-cyan)] px-2 py-0.5 text-xs font-bold text-[var(--game-cyan)]">CURRENT</span>}{node.optional && <span className="border border-[var(--game-border)] px-2 py-0.5 text-xs text-[var(--game-muted)]">OPTIONAL</span>}</div>
              <h2 className="mt-1 break-words text-lg font-bold text-[var(--game-text)]">{node.title}</h2><p className="mt-1 text-sm leading-6 text-[var(--game-muted)]">{node.summary}</p>
              {assessmentKind && assessmentPercent !== null && <p className="mt-2 text-sm font-semibold text-[var(--game-green)]">Recorded score: {assessmentScore!.score}/{assessmentScore!.total} ({assessmentPercent}%)</p>}
              {!unlocked && !node.optional && <p className="mt-2 text-xs font-semibold text-[var(--game-amber)]">Complete the previous required step to unlock this part of the journey.</p>}
            </div>
            <div className="flex shrink-0 flex-col gap-2">
            <button type="button" disabled={!unlocked || (assessmentKind === 'pre' && activeAssessment.preTestComplete)} onClick={() => {
              if (node.type === 'mission' && node.missionId) onStartMission(node.missionId);
              else if (assessmentKind) onAssessment(activeTier, assessmentKind);
              else selectNode(node);
            }} className="min-h-10 shrink-0 border border-[var(--game-border)] px-3 py-2 text-xs font-bold text-[var(--game-text)] hover:border-[var(--game-cyan)] hover:text-[var(--game-cyan)] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">
              {node.type === 'mission' ? done ? 'Replay' : unlocked ? 'Start mission' : 'Locked' : assessmentKind ? assessmentKind === 'pre' && done ? 'Completed · one attempt' : done ? 'Retake test' : unlocked ? 'Open test' : 'Locked' : done ? 'Replay' : unlocked ? <><Play size={13} className="mr-1 inline" />Open</> : 'Locked'}
            </button>
            {assessmentKind && done && <button type="button" onClick={() => onReviewAssessment(assessmentKind)} className="min-h-10 border border-[var(--game-cyan)] px-3 py-2 text-xs font-bold text-[var(--game-cyan)] hover:bg-[var(--game-cyan)]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">Review answers</button>}
            </div>
          </div>
        </li>;
      })}
    </ol>}
  </div>;
}
