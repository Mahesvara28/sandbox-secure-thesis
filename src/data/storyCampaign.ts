import type { DialogueBeat } from '../components/DialogueBox';
import { BRIDGE_MISSIONS, MISSIONS } from './gameData';

export type CampaignNodeType = 'story' | 'mission' | 'activity' | 'assessment' | 'debrief';
export interface CampaignNode {
  id: string;
  type: CampaignNodeType;
  title: string;
  summary: string;
  optional?: boolean;
  missionId?: string;
  assessmentKind?: 'pre' | 'post';
  activityId?: string;
  beats?: DialogueBeat[];
}
export interface CampaignChapter {
  id: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
  title: string;
  subtitle: string;
  nodes: CampaignNode[];
}

const mission = (nodeId: string, missionId: string, summary: string): CampaignNode => {
  const record = [...BRIDGE_MISSIONS, ...MISSIONS].find(item => item.id === missionId);
  if (!record) throw new Error(`Story campaign references unknown mission: ${missionId}`);
  return { id: nodeId, type: 'mission', missionId: record.id, title: record.title, summary };
};

const beginnerNodes: CampaignNode[] = [
  { id: 'c1-pretest', type: 'assessment', assessmentKind: 'pre', title: 'Beginner pre-test', summary: 'Open the existing Beginner pre-test in the Academy.' },
  {
    id: 'c1-intro', type: 'story', title: 'The Midnight Visitor', summary: 'Meet Nova and hear about the activity recorded at 3:12 AM.',
    beats: [
      { id: 'c1-intro-1', speaker: 'Nova', pose: 'idle', text: 'Hi, Operator. I’m Nova, your senior analyst and guide at Harborview Learning Center.' },
      { id: 'c1-intro-2', speaker: 'Mr. Santos', text: 'I teach IT here. I saw a computer doing something odd at 3:12 AM.' },
      { id: 'c1-intro-3', speaker: 'Mr. Santos', text: 'I was asleep, thankfully. The computer apparently missed the memo.' },
      { id: 'c1-intro-4', speaker: 'Nova', pose: 'thinking', text: 'A [[timestamp|recorded date and time]] helps us compare events from different records.' },
      { id: 'c1-intro-5', speaker: 'Ms. Lim', text: 'I clicked a delivery notice at the library desk. I’m not sure it matters.' },
      { id: 'c1-intro-6', speaker: 'Nova', pose: 'encourage', text: 'Thanks for sharing that. We will check the evidence without blaming anyone.' },
      { id: 'c1-intro-7', speaker: 'Nova', pose: 'thinking', text: 'We will first learn the system, then compare account, web, and network clues.' },
      { id: 'c1-intro-8', speaker: 'Nova', pose: 'thumbsup', text: 'A clue is a starting point. We will be careful about what it does and does not show.' }
    ]
  },
  mission('c1-m1', 'm1', 'Build a basic system picture before investigating an alert.'),
  { id: 'c1-command-match', type: 'activity', activityId: 'command-match-beginner', title: 'Command Match · Beginner', summary: 'Optional practice matching beginner commands to their purpose.', optional: true },
  mission('c1-m2', 'm2', 'Compare authentication, system, and web records.'),
  { id: 'c1-evidence-locker', type: 'activity', activityId: 'evidence-locker-beginner', title: 'Evidence Locker', summary: 'Optional file-finding practice: browse a simulated case folder, inspect records, and collect the relevant evidence.', optional: true },
  { id: 'c1-spot-phish', type: 'activity', activityId: 'spot-the-phish-beginner', title: 'Spot the Phish', summary: 'Optional practice noticing how a message might trick someone into sharing a password.', optional: true },
  mission('c1-m3', 'm3', 'Inspect a host and compare its services with an approved baseline.'),
  { id: 'c1-password-lab', type: 'activity', activityId: 'password-lab-beginner', title: 'Password Lab', summary: 'Optional local-only password-strength practice. Use a fictional example, never a real password.', optional: true },
  {
    id: 'c1-debrief', type: 'debrief', title: 'First case debrief', summary: 'Review what the available records support and what remains uncertain.',
    beats: [
      { id: 'c1-debrief-1', speaker: 'Nova', pose: 'thinking', text: 'The records gave us clues to compare. One clue alone does not explain the whole event.' },
      { id: 'c1-debrief-2', speaker: 'Mr. Santos', text: 'The visitor only knocked… but one account name is unfamiliar: temp_vendor.' },
      { id: 'c1-debrief-3', speaker: 'Nova', pose: 'encourage', text: 'We do not yet know who used that account or whether it was the same visitor.' }
    ]
  },
  { id: 'c1-posttest', type: 'assessment', assessmentKind: 'post', title: 'Beginner post-test', summary: 'Open the existing Beginner post-test in the Academy.' }
];

const intermediateNodes: CampaignNode[] = [
  { id: 'c2-pretest', type: 'assessment', assessmentKind: 'pre', title: 'Intermediate pre-test', summary: 'Open the existing Intermediate pre-test in the Academy.' },
  {
    id: 'c2-intro', type: 'story', title: 'The Quiet Passenger', summary: 'The overnight visitor may have left something running.',
    beats: [
      { id: 'c2-intro-1', speaker: 'Nova', pose: 'idle', text: 'Welcome back, Operator. Harborview has another clue to check.' },
      { id: 'c2-intro-2', speaker: 'Mr. Santos', text: 'A computer is still busy after hours. It is not one of our scheduled backups.' },
      { id: 'c2-intro-3', speaker: 'Nova', pose: 'thinking', text: 'A [[process|program that is currently running]] can be expected or unfamiliar.' },
      { id: 'c2-intro-4', speaker: 'Nova', text: 'We will compare its owner and location with the approved inventory.' },
      { id: 'c2-intro-5', speaker: 'Ms. Lim', text: 'The library computer was on, but I did not leave anything running.' },
      { id: 'c2-intro-6', speaker: 'Nova', pose: 'encourage', text: 'That is useful context. It does not tell us what the process did.' },
      { id: 'c2-intro-7', speaker: 'Mr. Santos', text: 'Can we stop it now? It is making the fan sound like a tiny aircraft.' },
      { id: 'c2-intro-8', speaker: 'Nova', pose: 'alert', text: 'First preserve the relevant details. Then we can choose a scoped response and verify it.' }
    ]
  },
  mission('c2-bridge-process', 'bridge-process', 'Identify the process that needs review without mistaking an approved backup for a threat.'),
  { id: 'c2-alert-triage', type: 'activity', activityId: 'alert-triage-intermediate', title: 'Alert Triage · Intermediate', summary: 'Optional practice weighing alert context and choosing what to investigate first.', optional: true },
  mission('c2-bridge-listener', 'bridge-listener', 'Compare listening services against an approved baseline.'),
  { id: 'c2-command-match', type: 'activity', activityId: 'command-match-intermediate', title: 'Command Match · Intermediate', summary: 'Optional practice with process, service, and evidence commands.', optional: true },
  mission('c2-bridge-web-log', 'bridge-web-log', 'Read a web request and separate an unusual attempt from confirmed access.'),
  { id: 'c2-build-timeline', type: 'activity', activityId: 'build-timeline-intermediate', title: 'Build the Timeline', summary: 'Optional practice sequencing fictional records while accounting for clock differences and uncertainty.', optional: true },
  mission('c2-m4', 'm4', 'Investigate a process using its PID, owner, and path as evidence.'),
  { id: 'c2-decoder-desk', type: 'activity', activityId: 'decoder-desk-intermediate', title: 'Decoder Desk · Intermediate', summary: 'Optional practice decoding URL and Base64 strings from fictional records.', optional: true },
  mission('c2-m5', 'm5', 'Contain a confirmed suspicious source with a scoped action and verify the result.'),
  mission('c2-m6', 'm6', 'Correlate web activity while distinguishing requests from confirmed impact.'),
  {
    id: 'c2-debrief', type: 'debrief', title: 'Second case debrief', summary: 'The immediate activity is contained; the team still needs to understand how it could return.',
    beats: [
      { id: 'c2-debrief-1', speaker: 'Nova', pose: 'thinking', text: 'We compared the process, service, and web evidence before acting.' },
      { id: 'c2-debrief-2', speaker: 'Mr. Santos', text: 'The unfamiliar activity has stopped, and the approved services still work.' },
      { id: 'c2-debrief-3', speaker: 'Nova', pose: 'alert', text: 'We stopped it, but how did it plan to come back?' },
      { id: 'c2-debrief-4', speaker: 'Nova', pose: 'encourage', text: 'The next case will look for a scheduled return path. Keep the evidence and uncertainty separate.' }
    ]
  },
  { id: 'c2-posttest', type: 'assessment', assessmentKind: 'post', title: 'Intermediate post-test', summary: 'Open the existing Intermediate post-test in the Academy.' }
];

const expertNodes: CampaignNode[] = [
  { id: 'c3-pretest', type: 'assessment', assessmentKind: 'pre', title: 'Expert pre-test', summary: 'Open the existing Expert pre-test in the Academy.' },
  {
    id: 'c3-intro', type: 'story', title: 'The Door Left Ajar', summary: 'The team has found evidence that the visitor could return.',
    beats: [
      { id: 'c3-intro-1', speaker: 'Nova', pose: 'idle', text: 'Operator, the evidence points to a possible way back into Harborview.' },
      { id: 'c3-intro-2', speaker: 'Mr. Santos', text: 'I found a scheduled task I do not recognize. I did not create it.' },
      { id: 'c3-intro-3', speaker: 'Nova', pose: 'thinking', text: 'A [[scheduled task|work configured to run at a set time]] may be normal. We will check its owner and records.' },
      { id: 'c3-intro-4', speaker: 'Ms. Lim', text: 'The message I clicked asked me to sign in again. The records also show different times.' }
    ]
  },
  mission('c3-m7', 'm7', 'Reconcile timestamps and report which events may be related without claiming a shared actor.'),
  { id: 'c3-command-match', type: 'activity', activityId: 'command-match-expert', title: 'Command Match · Expert', summary: 'Optional review of forensic, persistence, and evidence-handling tools.', optional: true },
  mission('c3-m8', 'm8', 'Find and assess a possible persistence mechanism using supporting records.'),
  { id: 'c3-alert-triage', type: 'activity', activityId: 'alert-triage-expert', title: 'Alert Triage · Expert', summary: 'Optional practice prioritizing correlated evidence without overclaiming attribution.', optional: true },
  { id: 'c3-decoder-desk', type: 'activity', activityId: 'decoder-desk-expert', title: 'Decoder Desk · Expert', summary: 'Optional practice decoding a harmless note found in the simulated evidence.', optional: true },
  mission('c3-m9', 'm9', 'Complete a careful incident response, verify changes, and report evidence and remaining uncertainty.'),
  {
    id: 'c3-finale', type: 'debrief', title: 'The automated visitor', summary: 'The team compares the evidence and explains the light mystery.',
    beats: [
      { id: 'c3-finale-1', speaker: 'Nova', pose: 'thinking', text: 'The records point to an automated bot, not a person at a keyboard overnight.' },
      { id: 'c3-finale-2', speaker: 'Mr. Santos', text: 'It used the forgotten temp_vendor account to enter the training network.' },
      { id: 'c3-finale-3', speaker: 'Ms. Lim', text: 'The message was a clue. A reused password made that old account easier to misuse.' },
      { id: 'c3-finale-4', speaker: 'Nova', text: 'The timeline supports this explanation, but it does not identify a person behind the bot.' },
      { id: 'c3-finale-5', speaker: 'Mr. Santos', text: 'We disabled the unused account, reset its password, checked the task, and preserved the records.' },
      { id: 'c3-finale-6', speaker: 'Nova', pose: 'celebrate', text: 'We verified the approved services too. Well handled, Operator; the team learned and improved.' }
    ]
  },
  { id: 'c3-posttest', type: 'assessment', assessmentKind: 'post', title: 'Expert post-test', summary: 'Open the existing Expert post-test in the Academy.' },
  {
    id: 'c3-certificate', type: 'story', title: 'Your certificate', summary: 'After passing, view or print the Expert certificate from the Academy certificate prompt or Profile.',
    beats: [
      { id: 'c3-certificate-1', speaker: 'Nova', pose: 'celebrate', text: 'When you pass the Expert post-test, your certificate is awarded in the Academy.' },
      { id: 'c3-certificate-2', speaker: 'Nova', text: 'You can open it there and print a copy. The story does not change the certificate rules.' }
    ]
  }
];

export const STORY_CHAPTERS: CampaignChapter[] = [
  { id: 'BEGINNER', title: 'The Midnight Visitor', subtitle: 'System and network foundations', nodes: beginnerNodes },
  { id: 'INTERMEDIATE', title: 'The Quiet Passenger', subtitle: 'Evidence and scoped containment', nodes: intermediateNodes },
  { id: 'EXPERT', title: 'The Door Left Ajar', subtitle: 'Correlation, persistence, and response', nodes: expertNodes }
];

export const BEGINNER_CHAPTER_ONE = beginnerNodes;

/** Academy-order mission IDs included in each story chapter. */
export const STORY_MISSION_NODE_LISTS = Object.fromEntries(STORY_CHAPTERS.map(chapter => [
  chapter.id,
  chapter.nodes.filter(node => node.type === 'mission').map(node => ({ id: node.missionId!, title: node.title }))
])) as Record<CampaignChapter['id'], Array<{ id: string; title: string }>>;
