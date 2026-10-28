import type { Question } from '../components/QuizModule';

export type Tier = 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';

export interface LevelData { id: string; title: string; description: string; }
export interface TierConfig { id: Tier; levels: LevelData[]; preTest: Question[]; postTest: Question[]; }
export interface MissionEvidence {
  id: string;
  kind: 'file' | 'host' | 'ip' | 'port' | 'event';
  label: string;
  value: string;
  detail: string;
  command?: string;
}

export interface MissionPrimer {
  definition: string;
  analogy: string;
  example?: string;
}

export interface MissionDecision {
  prompt: string;
  correctId: string;
  choices: { id: string; label: string; feedback: string }[];
}

export interface Mission {
  id: string; title: string; tier: Tier; scenario: string; intro: string; timerLimit: number;
  softTimeTarget?: number;
  category?: 'files' | 'network' | 'logs' | 'response';
  evidence?: MissionEvidence[];
  learningGoal: string;
  difficulty: 'guided' | 'standard' | 'advanced';
  topology: { label: string; address: string; role: string; status: string; linksTo?: string }[];
  logs: string[]; target: string; steps: { desc: string; cmd: string; hint: string | string[]; target?: string; inspectEvidenceId?: string; alternates?: string[]; decision?: MissionDecision; requiredCommands?: string[]; }[];
  primer?: MissionPrimer;
  realWorld: string;
  briefing: { concept: string; commands: string[]; objective: string; };
  didYouKnow: string[];
}

// --- TUTORIAL MISSIONS ---
export const TUTORIAL_MISSIONS: Mission[] = [
  {
    id: 't1',
    title: 'Tutorial: Meet the Terminal',
    tier: 'BEGINNER',
    scenario:
      'You have just received access to the Sandbox Secure training server. Before investigating security incidents, you need to understand how to navigate the Linux filesystem.',
    intro:
      'HANDLER: Welcome, Operator. Every investigation starts with knowing where you are and what is around you.',
    timerLimit: 0,
    category: 'files',
    learningGoal: 'Use a small set of terminal commands to find your way around a simulated Linux system.',
    difficulty: 'guided',
    topology: [
      { label: 'Training workstation', address: 'operator session', role: 'Your starting point', status: 'READY' },
      { label: 'Log directory', address: '/var/log', role: 'Practice evidence location', status: 'AVAILABLE', linksTo: 'Training workstation' }
    ],
    logs: [
      'Training environment initialized.',
      'User session: operator',
      'Filesystem mounted successfully.'
    ],
    target: 'logs',
    steps: [
      {
        desc: 'Check your current location.',
        cmd: 'pwd',
        hint: 'Use pwd (Print Working Directory) to see your current location.'
      },
      {
        desc: 'List the files and directories around you.',
        cmd: 'ls',
        hint: 'Use ls to inspect the contents of the current directory.'
      },
      {
        desc: 'Enter the system log directory where investigation evidence is stored.',
        cmd: 'cd /var/log',
        hint: ['Use the directory path shown in the objective.', 'The system keeps its log directory beneath /var.', 'Submit: cd /var/log']
      },
      {
        desc: 'Confirm that you are now inside the logs directory.',
        cmd: 'pwd',
        hint: 'Use pwd again to verify your new location.'
      },
      {
        desc: 'Return to your home directory.',
        cmd: 'cd ~',
        hint: 'The ~ symbol represents the current user\'s home directory.'
      }
    ],
    realWorld:
      'Security analysts constantly move between directories to locate logs, configuration files, evidence, and other system information.',
    briefing: {
      concept: 'Linux Filesystem Navigation',
      commands: ['pwd', 'ls', 'cd'],
      objective:
        'Learn how to identify your location, inspect a directory, and move through the filesystem.'
    },
    didYouKnow: [
      'Linux uses / as the root of the entire filesystem.',
      'The ~ symbol is commonly used as a shortcut for the current user\'s home directory.',
      'Security investigations often begin by locating and reading system logs.'
    ]
  },
  {
    id: 't2',
    title: 'Practice: Search a Text Record',
    tier: 'BEGINNER',
    scenario: 'A training folder contains a short activity record. Practice locating it and searching for a word the handler has flagged.',
    intro: 'HANDLER: This is a practice exercise outside the certification path. Find the record, search it, and report the clue you found.',
    timerLimit: 0,
    category: 'files',
    learningGoal: 'Practice locating a text record and searching it for a specific clue.',
    difficulty: 'guided',
    topology: [
      { label: 'Training workstation', address: 'operator session', role: 'Your starting point', status: 'READY' },
      { label: 'Practice records', address: '/home/operator/practice', role: 'Text evidence for this exercise', status: 'AVAILABLE', linksTo: 'Training workstation' }
    ],
    logs: [
      'Training exercise initialized.',
      'Practice record: activity.txt',
      'Search clue: warning'
    ],
    target: 'practice records',
    steps: [
      { desc: 'List the items in your current folder.', cmd: 'ls', hint: 'Use ls to see the available files and folders.' },
      { desc: 'Enter the practice folder.', cmd: 'cd /home/operator/practice', hint: ['Use cd to move into a folder.', 'The practice folder is under /home/operator.', 'Submit: cd /home/operator/practice'] },
      { desc: 'Search activity.txt for the word warning.', cmd: 'grep warning activity.txt', hint: ['grep searches text for a word or phrase.', 'Use warning as the search word and activity.txt as the file.', 'Submit: grep warning activity.txt'] },
      { desc: 'Read the full record so you can put the matching line in context.', cmd: 'cat activity.txt', hint: 'Use cat followed by the filename to display its text.' }
    ],
    realWorld: 'Analysts search text records for useful clues, then read surrounding context before drawing a conclusion.',
    briefing: {
      concept: 'Finding and checking text evidence',
      commands: ['ls', 'cd', 'grep', 'cat'],
      objective: 'Locate a practice record, search for a clue, and read the record in context.'
    },
    didYouKnow: [
      'A matching word is a lead to review, not proof of what happened.',
      'Reading surrounding lines helps avoid taking a clue out of context.'
    ]
  },
  {
    id: 't3',
    title: 'Practice: Is This Service Expected?',
    tier: 'BEGINNER',
    category: 'network',
    scenario: 'A small office server has three recorded services. Check the server and the unfamiliar service, then decide whether the evidence supports an alert.',
    intro: 'HANDLER: Explore the host and service cards first. An unfamiliar port deserves a check, but a port number alone does not prove a compromise.',
    timerLimit: 0,
    learningGoal: 'Connect a host address to its services and compare a port with the approved baseline.',
    difficulty: 'guided',
    topology: [
      { label: 'Office web server', address: '10.20.0.15', role: 'Hosts the staff portal', status: 'MONITORING', linksTo: 'Staff network' },
      { label: 'Staff network', address: '10.20.0.0/24', role: 'Approved internal segment', status: 'TRUSTED' }
    ],
    evidence: [
      { id: 't3-host', kind: 'host', label: 'Office web server', value: '10.20.0.15', detail: 'Inventory record: internal staff portal. The address belongs to the approved 10.20.0.0/24 network.', command: 'nmap 10.20.0.15' },
      { id: 't3-443', kind: 'port', label: 'Port 443', value: 'HTTPS · approved', detail: 'The baseline lists HTTPS on port 443 as an expected staff portal service.', command: 'nmap 10.20.0.15' },
      { id: 't3-8448', kind: 'port', label: 'Port 8448', value: 'Unknown service · review', detail: 'Port 8448 is not listed in the approved baseline. This is a configuration difference to investigate, not proof of malicious activity.', command: 'nmap 10.20.0.15' }
    ],
    logs: ['[INVENTORY] Staff portal: 10.20.0.15', '[BASELINE] Expected service: HTTPS on port 443', '[SCAN] Additional listener recorded on port 8448'],
    target: '10.20.0.15',
    steps: [
      { desc: 'Inspect the server inventory card and confirm its address.', cmd: 'inspect t3-host', hint: 'Select the Office web server card in the evidence board.', inspectEvidenceId: 't3-host' },
      { desc: 'Inspect the expected HTTPS port and compare it with the baseline.', cmd: 'inspect t3-443', hint: 'Select the port 443 card. The baseline tells you whether it is expected.', inspectEvidenceId: 't3-443' },
      { desc: 'Inspect the additional listener and note why it needs review.', cmd: 'inspect t3-8448', hint: 'Select port 8448 and compare its status with the approved baseline.', inspectEvidenceId: 't3-8448' },
      { desc: 'Report the finding without claiming an attack is confirmed.', cmd: 'report unexpected-port', hint: ['A port outside the baseline is a configuration difference.', 'Report that port 8448 needs review; do not claim it proves an attack.', 'Submit: report unexpected-port'] }
    ],
    realWorld: 'Defenders compare discovered services with an approved inventory. Unexpected listeners are investigated and verified before response actions are taken.',
    briefing: { concept: 'Hosts, ports, services, and baselines', commands: ['nmap [host]', 'report [finding]'], objective: 'Inspect the host, compare its services with the baseline, and state a measured conclusion.' },
    didYouKnow: ['An IP address identifies a network interface, while a port points to a service on that host.', 'A baseline is a reference for what should normally be present.']
  },
  {
    id: 't4',
    title: 'Practice: Find the Unusual File',
    tier: 'BEGINNER',
    category: 'files',
    scenario: 'A scheduled maintenance folder contains one file that the team does not recognize. Inspect the file details and decide whether it should be escalated.',
    intro: 'HANDLER: The file card gives you a simulated directory listing. Inspect the entries and use the evidence, not the filename alone, to choose what to report.',
    timerLimit: 0,
    learningGoal: 'Compare file names, locations, and ownership clues before escalating an unfamiliar file.',
    difficulty: 'guided',
    topology: [{ label: 'Maintenance server', address: '10.20.0.22', role: 'Scheduled task host', status: 'UNDER REVIEW' }],
    evidence: [
      { id: 't4-backup', kind: 'file', label: 'backup.sh', value: '/opt/maintenance/backup.sh', detail: 'Owner: administrator · Last changed: 3 days ago · Listed in the approved maintenance inventory.', command: 'ls /opt/maintenance' },
      { id: 't4-update', kind: 'file', label: 'update-check.sh', value: '/tmp/update-check.sh', detail: 'Owner: unknown · Last changed: today · The temporary directory and missing inventory entry make this file worth investigating. The details do not prove it ran.', command: 'find /tmp -name update-check.sh' }
    ],
    logs: ['[INVENTORY] Approved: /opt/maintenance/backup.sh', '[FILE] /tmp/update-check.sh created today', '[OWNER] No approved owner listed'],
    target: 'update-check.sh',
    steps: [
      { desc: 'Inspect the approved backup file as a point of comparison.', cmd: 'inspect t4-backup', hint: 'Select backup.sh to see its location and inventory status.', inspectEvidenceId: 't4-backup' },
      { desc: 'Inspect the unfamiliar file and compare its location and owner.', cmd: 'inspect t4-update', hint: 'Select update-check.sh. Check its path, owner, and inventory status.', inspectEvidenceId: 't4-update' },
      { desc: 'Report why the file deserves follow-up without claiming it executed.', cmd: 'report unverified-file', hint: ['The path and missing owner are reasons to investigate.', 'The evidence does not show whether the script ran.', 'Submit: report unverified-file'] }
    ],
    realWorld: 'File paths, owners, timestamps, and approved inventories help analysts decide what to investigate. A suspicious-looking name alone is not enough to establish impact.',
    briefing: { concept: 'File context and evidence-based escalation', commands: ['find [path] -name [file]', 'report [finding]'], objective: 'Inspect two file records, compare their context, and report a supported conclusion.' },
    didYouKnow: ['Temporary folders can contain legitimate files as well as suspicious ones.', 'Ownership and change time are clues to check, not proof of intent.']
  },
  {
    id: 't5',
    title: 'Practice: Put the Alert in Order',
    tier: 'BEGINNER',
    category: 'logs',
    scenario: 'A training alert contains a failed sign-in, a successful sign-in, and a later password reset. Inspect the events and report what the timeline supports.',
    intro: 'HANDLER: Events can look related because they are close together. Read each record, put them in order, and separate what happened from what you suspect.',
    timerLimit: 0,
    learningGoal: 'Build a short event timeline and distinguish observed facts from a possible explanation.',
    difficulty: 'standard',
    topology: [{ label: 'Training account', address: 'operator-demo', role: 'Account in the activity records', status: 'UNDER REVIEW' }, { label: 'Sign-in service', address: '10.20.0.5:22', role: 'Recorded authentication service', status: 'MONITORING' }],
    evidence: [
      { id: 't5-fail', kind: 'event', label: 'Failed sign-in', value: '09:02 · source 203.0.113.18', detail: 'Observed fact: an authentication failure was recorded at 09:02 from this source. It does not show that access succeeded.' },
      { id: 't5-success', kind: 'event', label: 'Successful sign-in', value: '09:06 · source 203.0.113.18', detail: 'Observed fact: a successful sign-in was recorded four minutes later from the same source. The records do not identify the person using that address.' },
      { id: 't5-reset', kind: 'event', label: 'Password reset', value: '09:11 · account operator-demo', detail: 'Observed fact: a password reset was recorded five minutes later. More context is needed to establish why it happened or who initiated it.' }
    ],
    logs: ['[09:02] Failed sign-in for operator-demo from 203.0.113.18', '[09:06] Successful sign-in for operator-demo from 203.0.113.18', '[09:11] Password reset for operator-demo'],
    target: 'timeline',
    steps: [
      { desc: 'Inspect the failed sign-in and note its time and source.', cmd: 'inspect t5-fail', hint: 'Select the failed sign-in event card.', inspectEvidenceId: 't5-fail' },
      { desc: 'Inspect the later successful sign-in and compare its source.', cmd: 'inspect t5-success', hint: 'Select the successful sign-in event. Compare its time and source with the first event.', inspectEvidenceId: 't5-success' },
      { desc: 'Inspect the password reset as the final event in the sequence.', cmd: 'inspect t5-reset', hint: 'Select the password reset card and add it to your timeline.', inspectEvidenceId: 't5-reset' },
      { desc: 'Report the sequence while making clear that the user identity is unconfirmed.', cmd: 'report related-events', hint: ['The records show a sequence of events from the same source address.', 'A shared source and close timing support further investigation, not identity attribution.', 'Submit: report related-events'] }
    ],
    realWorld: 'Timelines help analysts compare events and form hypotheses. Correlation is useful, but a shared address or close timestamp does not prove who caused an event.',
    briefing: { concept: 'Timelines and cautious conclusions', commands: ['inspect evidence', 'report [finding]'], objective: 'Inspect events in order and report only what the records support.' },
    didYouKnow: ['A single IP can be shared by many people or devices.', 'State observations separately from possible explanations.']
  },
  {
    id: 't6',
    title: 'Practice: Check a New Remote Service',
    tier: 'BEGINNER',
    category: 'network',
    scenario: 'A branch file server has a newly reported remote-access service. Compare its host, approved services, and the unfamiliar listener before deciding what to report.',
    intro: 'HANDLER: Verify which host is in scope, check its expected services, then examine the new listener. An unexpected service needs review; it does not identify who enabled it.',
    timerLimit: 0,
    learningGoal: 'Read host and service evidence, compare an exposed port with its baseline, and write a cautious finding.',
    difficulty: 'standard',
    topology: [
      { label: 'Branch file server', address: '10.20.0.44', role: 'Stores shared team files', status: 'UNDER REVIEW', linksTo: 'Branch office network' },
      { label: 'Branch office network', address: '10.20.0.0/24', role: 'Approved internal segment', status: 'TRUSTED' }
    ],
    evidence: [
      { id: 't6-host', kind: 'host', label: 'Branch file server', value: '10.20.0.44', detail: 'Inventory record: branch file server on the approved 10.20.0.0/24 network. This is the host in scope for this check.' },
      { id: 't6-445', kind: 'port', label: 'Port 445', value: 'SMB · approved', detail: 'The baseline lists SMB file sharing on port 445 for this server. This expected listener provides a useful comparison.' },
      { id: 't6-3389', kind: 'port', label: 'Port 3389', value: 'Remote desktop · newly observed', detail: 'Remote desktop is not listed in the approved baseline for this server. Confirm with the system owner before taking action; the scan alone does not show who enabled it or whether it was used.' }
    ],
    logs: ['[INVENTORY] Branch file server: 10.20.0.44', '[BASELINE] Expected service: SMB on port 445', '[SCAN] TCP 3389 listener observed; change record not attached'],
    target: '10.20.0.44',
    steps: [
      { desc: 'Inspect the host card and confirm which server is in scope.', cmd: 'inspect t6-host', hint: 'Start with the Branch file server card and note its address.', inspectEvidenceId: 't6-host' },
      { desc: 'Inspect the expected file-sharing service as a baseline comparison.', cmd: 'inspect t6-445', hint: 'Check the port 445 card to see what the inventory expects.', inspectEvidenceId: 't6-445' },
      { desc: 'Inspect the newly observed remote-access port and note what is still unknown.', cmd: 'inspect t6-3389', hint: 'Compare port 3389 with the approved baseline. The observation does not identify who enabled it.', inspectEvidenceId: 't6-3389' },
      { desc: 'Report the baseline difference without claiming unauthorized access occurred.', cmd: 'report unapproved-remote-service', hint: ['The listener differs from the approved baseline.', 'The evidence does not show who enabled it or whether it was used.', 'Submit: report unapproved-remote-service'] }
    ],
    realWorld: 'A network scan shows reachable services at the time of collection. Analysts compare these observations with asset records and change approvals before labeling a service unauthorized.',
    briefing: { concept: 'Service baselines and remote access', commands: ['inspect evidence', 'report [finding]'], objective: 'Compare one host with its approved services and document the observed difference.' },
    didYouKnow: ['Port 3389 is commonly associated with Microsoft Remote Desktop, though port numbers can be reassigned.', 'A service being reachable does not prove that anyone connected to it.']
  },
  {
    id: 't7',
    title: 'Practice: Reconcile a Split Timeline',
    tier: 'BEGINNER',
    category: 'logs',
    scenario: 'A short incident packet includes events from two systems whose clocks may not match. Inspect each event, account for the recorded offset, and state what the sequence supports.',
    intro: 'HANDLER: Build the sequence from the records. One system reports a clock offset, and a shared address can represent more than one user. Keep those limits in your conclusion.',
    timerLimit: 0,
    learningGoal: 'Order records from separate sources, notice a clock difference, and separate a plausible relationship from confirmed causation.',
    difficulty: 'standard',
    topology: [
      { label: 'Authentication server', address: '10.20.0.5', role: 'Records account sign-ins', status: 'LOGS AVAILABLE', linksTo: 'Application server' },
      { label: 'Application server', address: '10.20.0.18', role: 'Records web requests', status: 'CLOCK OFFSET NOTED', linksTo: 'Authentication server' }
    ],
    evidence: [
      { id: 't7-fail', kind: 'event', label: 'Failed sign-in', value: '09:02 · auth server · 203.0.113.18', detail: 'Observed fact: an authentication failure for the training account was recorded at 09:02 by the auth server. A failed attempt does not establish successful access.' },
      { id: 't7-success', kind: 'event', label: 'Successful sign-in', value: '09:06 · auth server · 203.0.113.18', detail: 'Observed fact: a successful sign-in for the training account was recorded four minutes later from the same source address. The logs do not identify the person using that address.' },
      { id: 't7-offset', kind: 'event', label: 'Application clock note', value: 'App server clock was 2 minutes slow', detail: 'The application server reports a two-minute clock lag relative to the reference clock. Its displayed request times should be adjusted before comparing them with authentication events.' },
      { id: 't7-request', kind: 'event', label: 'Web request', value: '09:05 app time · 203.0.113.18 · HTTP 200', detail: 'Observed fact: the application log records a request with HTTP 200 at 09:05 local time. With the noted offset, this is about 09:07 reference time. HTTP 200 alone does not show what data was returned or who sent the request.' }
    ],
    logs: ['[AUTH 09:02] Failed sign-in for training account from 203.0.113.18', '[AUTH 09:06] Successful sign-in for training account from 203.0.113.18', '[APP CLOCK] Application host is 2 minutes slow', '[APP 09:05] Request from 203.0.113.18 returned HTTP 200'],
    target: 'timeline',
    steps: [
      { desc: 'Inspect the failed sign-in and note its source and recorded time.', cmd: 'inspect t7-fail', hint: 'Select the failed sign-in event card. Record that it is an attempt, not a successful login.', inspectEvidenceId: 't7-fail' },
      { desc: 'Inspect the later successful sign-in and compare the source address.', cmd: 'inspect t7-success', hint: 'Compare its source with the failed attempt, while remembering that an IP does not identify a person.', inspectEvidenceId: 't7-success' },
      { desc: 'Inspect the application clock note before comparing timestamps.', cmd: 'inspect t7-offset', hint: 'Check whether the application log uses the same clock as the authentication server.', inspectEvidenceId: 't7-offset' },
      { desc: 'Inspect the web request and adjust its time using the clock offset.', cmd: 'inspect t7-request', hint: 'Add two minutes to the application time, then compare the corrected time and source with the auth events.', inspectEvidenceId: 't7-request' },
      { desc: 'Report a possible relationship while stating what remains unconfirmed.', cmd: 'report related-events-needs-validation', hint: ['The records may be related after correcting the clock offset.', 'The address and timing do not prove a shared actor or successful impact.', 'Submit: report related-events-needs-validation'] }
    ],
    realWorld: 'Correlating events across systems requires normalizing clocks and checking data from independent sources. A close timeline supports a hypothesis but does not establish causation or identity.',
    briefing: { concept: 'Timeline correlation and clock normalization', commands: ['inspect evidence', 'report [finding]'], objective: 'Reconcile the clock offset and report the relationship the evidence does and does not support.' },
    didYouKnow: ['NTP helps systems synchronize time, but offset and drift can still occur.', 'NAT and shared gateways can make many users appear under one public IP address.']
  }
];

// Short, untimed bridge lessons at the start of the Intermediate certification path.
export const BRIDGE_MISSIONS: Mission[] = [
  {
    id: 'bridge-process', title: 'Bridge 1: Programs in Motion', tier: 'INTERMEDIATE',
    scenario: 'A monitoring alert reports high CPU use. One busy process is an approved backup job. Identify the process by its PID, owner, and path before deciding whether it is concerning.',
    intro: 'HANDLER: A process is a program that is running. High CPU can be normal during scheduled work. Read the process list, inspect one PID, and distinguish the backup job from the item that needs review.',
    timerLimit: 0, category: 'response', learningGoal: 'Read a process list and use a PID to inspect one running program.', difficulty: 'guided',
    topology: [{ label: 'Training server', address: '10.20.0.30', role: 'Host whose processes are being reviewed', status: 'MONITORING' }],
    logs: ['[MONITOR] CPU use increased during scheduled backup window.', '[INVENTORY] PID 3110: approved backup job.', '[PROCESS] PID 2214: executable under /tmp; owner and path need review.'], target: 'process',
    primer: { definition: 'A process is a program that is running on a computer. A PID is the number the system uses to refer to one running program.', analogy: 'Think of a process as a worker and its PID as the worker’s badge number.', example: 'PID 3110 · backup-user · /usr/bin/backup → approved scheduled backup\nPID 2214 · root · /tmp/.cache/worker → needs investigation; its location is unusual, not proof of harm.' },
    steps: [
      { desc: 'List the running programs and compare their CPU use, owner, and path.', cmd: 'ps aux', hint: ['A process is a running program. Look at the PID, owner, and path together; CPU use alone is not enough.'] },
      { desc: 'Identify the high-CPU process that the inventory says is approved scheduled work.', cmd: 'choose backup-pid-3110', hint: ['Use the owner and executable path to separate the approved backup from the other process.'], decision: { prompt: 'Which process is the approved backup job?', correctId: 'backup-pid-3110', choices: [
        { id: 'backup-pid-3110', label: 'PID 3110 · backup-user · /usr/bin/backup', feedback: 'Correct. The owner, approved path, and schedule match the inventory. High CPU does not make this process malicious.' },
        { id: 'review-pid-2214', label: 'PID 2214 · root · /tmp/.cache/worker', feedback: 'That process is the stronger lead for review because its path is unapproved. The backup job is PID 3110.' }
      ] } },
      { desc: 'Inspect PID 3110 to confirm its owner and executable path.', cmd: 'ps -p 3110', hint: ['Use the PID from the process list to focus on one program.', 'The backup job uses PID 3110.', 'Submit: ps -p 3110'] },
      { desc: 'Record that the busy backup job is expected, while the other process still needs review.', cmd: 'report backup-is-expected-other-process-needs-review', hint: ['Compare the inspected owner and path with the inventory note.', 'High CPU can be legitimate; keep PID 2214 as a separate lead.', 'Submit: report backup-is-expected-other-process-needs-review'] }
    ],
    realWorld: 'Analysts use process IDs and executable paths to investigate running programs. Busy work can be legitimate, so compare it with schedules and approved software.',
    briefing: { concept: 'Process and PID', commands: ['ps aux', 'ps -p [PID]', 'report [finding]'], objective: 'Identify a running program by its PID and context; do not stop anything in this lesson.' },
    didYouKnow: ['A process list is a snapshot; a program may start or stop immediately afterward.']
  },
  {
    id: 'bridge-listener', title: 'Bridge 2: Listening Services and Baselines', tier: 'INTERMEDIATE',
    scenario: 'A server inventory lists the services expected on a training host. Compare the live simulated listener list with that baseline and report the difference without changing the system.',
    intro: 'HANDLER: A listening service waits for network connections. A baseline is the approved list used for comparison. An unexpected listener is a reason to check, not proof of an attack.',
    timerLimit: 0, category: 'network', learningGoal: 'Compare simulated listening services with an approved baseline.', difficulty: 'guided',
    topology: [{ label: 'Training server', address: '10.20.0.31', role: 'Host in the approved service inventory', status: 'UNDER REVIEW' }],
    logs: ['[BASELINE] Approved listeners: TCP 22 SSH, TCP 443 HTTPS.', '[OBSERVATION] Simulated listener list includes TCP 9443.', '[CHANGE RECORD] No change ticket is attached to TCP 9443.'], target: 'listener-baseline',
    primer: { definition: 'A listening service is a program waiting for network connections on a port. A baseline lists the services the organization expects to be there.', analogy: 'The baseline is the guest list; a listener not on it should be checked with its owner.', example: 'ss/netstat: 22/tcp ssh, 443/tcp https, 9443/tcp unknown\nApproved list: 22/tcp ssh, 443/tcp https\nDifference: 9443 needs review; the comparison alone does not prove misuse.' },
    steps: [
      { desc: 'List the services waiting for connections on the simulated host.', cmd: 'ss -tuln', hint: ['A listening service waits for connections. Read the port and service columns, then compare them with the approved list.'] },
      { desc: 'Read the approved service baseline.', cmd: 'cat /etc/training/approved-services.txt', hint: ['A baseline is the reference for what should normally be present.', 'The approved list is in /etc/training/approved-services.txt.', 'Submit: cat /etc/training/approved-services.txt'] },
      { desc: 'Select the observed listener that is not in the approved baseline.', cmd: 'choose tcp-9443', hint: ['Compare the two lists and identify the entry that appears only in the observation.'], decision: { prompt: 'Which listener differs from the baseline?', correctId: 'tcp-9443', choices: [
        { id: 'tcp-22', label: 'TCP 22 · SSH', feedback: 'TCP 22 is listed in the approved baseline. It is an expected service in this case.' },
        { id: 'tcp-443', label: 'TCP 443 · HTTPS', feedback: 'TCP 443 is listed in the approved baseline. It is an expected service in this case.' },
        { id: 'tcp-9443', label: 'TCP 9443 · unknown', feedback: 'Correct. The listener appears in the observation but not the baseline. That difference needs validation, not an immediate accusation.' }
      ] } },
      { desc: 'Report the listener that is missing from the baseline, without calling it a confirmed attack.', cmd: 'report tcp-9443-needs-review', hint: ['Compare the two lists and find the port that appears in only one.', 'An unexpected listener needs owner and change-record validation.', 'Submit: report tcp-9443-needs-review'] }
    ],
    realWorld: 'Defenders compare observed listeners with an approved service inventory and change records. A difference is a lead for investigation, not a verdict.',
    briefing: { concept: 'Listeners and baselines', commands: ['ss -tuln', 'netstat -tuln', 'cat [file]', 'report [finding]'], objective: 'Compare observed listeners with the approved baseline and document one difference.' },
    didYouKnow: ['Port numbers are conventions; service identity should be confirmed from context, not assumed from the number alone.']
  },
  {
    id: 'bridge-web-log', title: 'Bridge 3: Reading a Web Request', tier: 'INTERMEDIATE',
    scenario: 'A web server owner asks you to review two access-log entries: one ordinary health check and one unusual request for a hidden configuration path. Determine what the records show and what they do not prove.',
    intro: 'HANDLER: A web access log records requests and responses. An unusual path may deserve follow-up, but a request alone does not establish that data was accessed.',
    timerLimit: 0, category: 'logs', learningGoal: 'Read the fields in a web access-log line and distinguish unusual activity from confirmed impact.', difficulty: 'guided',
    topology: [{ label: 'Training web server', address: '10.20.0.32', role: 'Source of simulated access records', status: 'LOGS AVAILABLE' }],
    logs: ['[ACCESS] 192.0.2.24 - - [23/Oct/2026:10:02:11] "GET /health HTTP/1.1" 200', '[ACCESS] 203.0.113.44 - - [23/Oct/2026:10:03:08] "GET /.env HTTP/1.1" 404'], target: 'access-log',
    primer: { definition: 'A web access log records who made a request, when it arrived, what method and path were requested, and the response status.', analogy: 'It is like a visitor log that records the visitor’s address, the door they tried, and whether the door opened.', example: '203.0.113.44 - - [23/Oct/2026:10:03:08] "GET /.env HTTP/1.1" 404\nIP: 203.0.113.44 · Time: 10:03:08 · Method: GET · Path: /.env · Status: 404 (not found)' },
    steps: [
      { desc: 'Read the simulated access log and compare the normal health check with the unusual request.', cmd: 'cat /var/log/apache2/access.log', hint: ['Each row records a request and a response. Compare the paths and status codes; unusual does not automatically mean malicious.'] },
      { desc: 'Choose the request that should be checked with the application owner.', cmd: 'choose hidden-path-request', hint: ['Compare the normal health path with the hidden configuration path, then read the response code.'], decision: { prompt: 'What does the access log support?', correctId: 'hidden-path-request', choices: [
        { id: 'health-check', label: 'The /health request is the unusual event', feedback: 'The /health path is the routine comparison entry in this sample. The other request is the one that merits follow-up.' },
        { id: 'hidden-path-request', label: 'The /.env request is unusual, but returned 404', feedback: 'Correct. The request warrants review; the 404 response does not show successful access.' }
      ] } },
      { desc: 'Report that the hidden configuration path was requested but returned not found.', cmd: 'report unusual-request-no-confirmed-access', hint: ['The 404 status means the requested path was not found in this response.', 'Report the request as unusual and avoid claiming access succeeded.', 'Submit: report unusual-request-no-confirmed-access'] }
    ],
    realWorld: 'Access logs show requests and response codes. Analysts use application and system evidence to determine impact rather than treating a suspicious-looking request as a successful compromise.',
    briefing: { concept: 'Web access-log fields', commands: ['cat [file]', 'report [finding]'], objective: 'Read a normal and an unusual request, then state what the recorded response supports.' },
    didYouKnow: ['HTTP 404 records a not-found response; it does not describe every internal application action.']
  }
];

// --- CAMPAIGN MISSIONS ---
export const MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: 'Operation: Know Your System',
    tier: 'BEGINNER',
    scenario:
      'You are beginning your first security investigation. Before looking for an attacker, establish basic information about the system and locate the available evidence.',
    intro:
      'HANDLER: Rookie, lesson one: never investigate blindly. First establish who you are, where you are, and what evidence is available.',
    timerLimit: 0,
    softTimeTarget: 600,
    learningGoal: 'Build a basic system picture before investigating an alert: identify the account, location, and available evidence.',
    difficulty: 'guided',
    topology: [
      { label: 'Operator workstation', address: '192.168.1.50', role: 'Investigation console', status: 'TRUSTED' },
      { label: 'Sandbox server', address: '192.168.1.10', role: 'System under investigation', status: 'MONITORING', linksTo: 'Operator workstation' },
      { label: 'System logs', address: '/var/log', role: 'Authentication evidence', status: 'AVAILABLE', linksTo: 'Sandbox server' }
    ],
    logs: [
      '[SYSTEM] Sandbox Secure workstation online.',
      '[AUTH] User operator logged in.',
      '[TRAINING] Investigation environment ready.'
    ],
    target: 'filesystem',
    steps: [
      {
        desc: 'Identify the account currently being used.',
        cmd: 'whoami',
        hint: 'Use whoami to identify the current user.'
      },
      {
        desc: 'Determine your current filesystem location.',
        cmd: 'pwd',
        hint: 'Use pwd to print the current working directory.'
      },
      {
        desc: 'Inspect the contents of your current directory.',
        cmd: 'ls',
        hint: 'Use ls to see which files and directories are available.'
      },
      {
        desc: 'Navigate to the system log directory.',
        cmd: 'cd /var/log',
        hint: 'System logs are commonly stored under /var/log on Linux.'
      },
      {
        desc: 'List the available log files.',
        cmd: 'ls',
        hint: 'Look for authentication or security-related logs.'
      },
      {
        desc: 'Read the authentication log.',
        cmd: 'cat auth.log',
        hint: 'Authentication events are recorded in auth.log in this simulation.'
      },
      {
        desc: 'Return to your home directory after collecting the evidence.',
        cmd: 'cd ~',
        hint: 'Use cd ~ to return to the operator home directory.'
      }
    ],
    realWorld:
      'Incident responders first establish system context before making changes. Identifying the current account, location, and available logs prevents investigators from overlooking important evidence.',
    briefing: {
      concept: 'System Orientation and Evidence Collection',
      commands: ['whoami', 'pwd', 'ls', 'cd', 'cat'],
      objective:
        'Establish basic system context and locate the authentication log without changing the system.'
    },
    didYouKnow: [
      'The principle of least privilege means users should receive only the access they need.',
      'Authentication logs can reveal failed logins, successful logins, and suspicious access attempts.',
      'Investigators should collect evidence before making unnecessary changes to a compromised system.'
    ]
  },

  {
    id: 'm2',
    title: 'Operation: Failed Login',
    tier: 'BEGINNER',
    scenario:
      'The security team noticed repeated login failures on the training server. Your job is to inspect the authentication log and determine whether the activity is suspicious.',
    intro:
      'HANDLER: We have our first alert. Someone may be attempting to gain access to the server. Do not block anything yet. First, understand the evidence.',
    timerLimit: 0,
    softTimeTarget: 720,
    learningGoal: 'Compare authentication, system, and web records to identify a suspicious sequence while separating evidence from assumptions.',
    difficulty: 'guided',
    topology: [
      { label: 'Operator workstation', address: '192.168.1.50', role: 'Investigation console', status: 'TRUSTED' },
      { label: 'Sandbox server', address: '192.168.1.10', role: 'SSH service under review', status: 'MONITORING', linksTo: 'Operator workstation' },
      { label: 'External host', address: '198.51.100.23', role: 'Source in authentication and web records', status: 'UNVERIFIED', linksTo: 'Sandbox server' },
      { label: 'System logs', address: '/var/log', role: 'Three records to compare', status: 'AVAILABLE', linksTo: 'Sandbox server' }
    ],
    logs: [
      '[ALERT] Multiple failed SSH authentication attempts.',
      '[AUTH] Several failures target the root account within seconds.',
      '[EVIDENCE] Compare auth.log, syslog, and access.log before concluding.',
      '[CAUTION] A separate failed sign-in from the office workstation may be a typo, not an attack.',
      '[CAUTION] The system journal clock is about two minutes fast; correlate event order, not exact matching times.'
    ],
    target: '198.51.100.23',
    steps: [
      {
        desc: 'Navigate to the authentication logs.',
        cmd: 'cd /var/log',
        hint: 'Use cd /var/log to reach the system log directory.'
      },
      {
        desc: 'List the available logs.',
        cmd: 'ls',
        hint: 'Look for auth.log.'
      },
      {
        desc: 'Read the authentication log.',
        cmd: 'cat auth.log',
        hint: 'Use cat auth.log to inspect sign-in attempts and their source addresses.'
      },
      {
        desc: 'Read the system log and look for activity around the same time.',
        cmd: 'cat syslog',
        hint: ['System logs can record services starting and account sessions.', 'Compare the timestamps and source with the authentication entries.', 'Submit: cat syslog']
      },
      {
        desc: 'Read the web access log and compare its source address with the other records.',
        cmd: 'cat access.log',
        hint: ['Web access logs record requests made to the site.', 'Look for the address already present in the authentication records.', 'Submit: cat access.log']
      },
      {
        desc: 'Report the repeated access pattern and note that the records do not identify the person behind the source address.',
        cmd: 'report correlated-suspicious-activity',
        hint: ['Compare timestamps and the source address across all three files.', 'The records support suspicious activity and a possible sequence, but not a person’s identity or confirmed impact.', 'Submit: report correlated-suspicious-activity']
      },
      {
        desc: 'Return to your home directory.',
        cmd: 'cd ~',
        hint: 'Use cd ~ when you finish collecting the evidence.'
      }
    ],
    realWorld:
      'Repeated authentication failures can indicate password guessing or brute-force activity. Analysts normally investigate the frequency, source, targeted account, and timing before deciding how to respond.',
    briefing: {
      concept: 'Authentication Logs and Suspicious Login Activity',
      commands: ['cd', 'ls', 'cat', 'report [finding]'],
      objective:
        'Compare three log files, identify the source and sequence of suspicious activity, and state what the records do and do not prove.'
    },
    didYouKnow: [
      'A failed login is not automatically an attack. Analysts look for patterns and unusual frequency.',
      'SSH is commonly used for remote administration of Linux systems.',
      'A source IP identifies the network address associated with a connection, but does not automatically prove who was behind it.'
    ]
  },

  {
    id: 'm3',
    title: 'Network Basics: Meet a Host and Service',
    tier: 'BEGINNER',
    scenario:
      'The authentication investigation identified a suspicious source. Network telemetry now shows that the same address may be communicating with the server. You are reviewing a simulated scan, not connecting to the host.',
    intro:
      'HANDLER: Good work identifying the source. We are moving from authentication evidence to network evidence. SSH is the service recorded on port 22; you do not need to open an SSH session. Use the simulated network tools to inspect the host.',
    timerLimit: 0,
    softTimeTarget: 720,
    learningGoal: 'Learn how hosts, reachability, ports, and services relate before deciding whether a connection is unexpected.',
    difficulty: 'guided',
    topology: [
      { label: 'Operator workstation', address: '192.168.1.50', role: 'Authorized investigation host', status: 'TRUSTED' },
      { label: 'Sandbox server', address: '192.168.1.10', role: 'Protected host', status: 'MONITORING', linksTo: 'Operator workstation' },
      { label: 'Unknown external host', address: '198.51.100.23', role: 'Observed network peer', status: 'UNDER REVIEW', linksTo: 'Sandbox server' }
    ],
    logs: [
      '[NET] Connection observed from 198.51.100.23.',
      '[NET] SSH traffic detected.',
      '[ALERT] Unexpected external host communicating with server.'
    ],
    target: '198.51.100.23',
    steps: [
      {
        desc: 'Check the current simulated network status.',
        cmd: 'status',
        hint: 'Use status to inspect the current network situation.'
      },
      {
        desc: 'Test connectivity to the suspicious host.',
        cmd: 'ping 198.51.100.23',
        hint: 'Use ping to test whether the simulated host responds.'
      },
      {
        desc: 'Perform a simulated scan of the suspicious host. This checks its listed services; it does not log in or connect to a shell.',
        cmd: 'nmap 198.51.100.23',
        hint: 'Use nmap followed by the target IP address.'
      },
      {
        desc: 'Interpret the scan carefully: identify the service shown, without assuming an open service proves malicious activity.',
        cmd: 'report ssh-service',
        hint: ['Read the port and service columns in the scan output.', 'Port 22 is commonly used for secure remote administration.', 'Submit: report ssh-service']
      },
      {
        desc: 'Block the suspicious address after collecting the evidence.',
        cmd: 'block 198.51.100.23',
        target: '198.51.100.23',
        hint: ['Contain only the host supported by your evidence.', 'Use the block command with the observed address.', 'Submit: block 198.51.100.23']
      },
      {
        desc: 'Open the Map and confirm the source is marked contained, then check status again.',
        cmd: 'status',
        hint: ['A response action is not complete until you check its effect.', 'Open Map and confirm 198.51.100.23 is marked CONTAINED, then use the status command.', 'Submit: status']
      }
    ],
    realWorld:
      'Network reconnaissance helps defenders understand which services are exposed. In a real environment, defenders must verify the target and authorization before performing scans.',
    briefing: {
      concept: 'Basic Network Investigation and Containment',
      commands: ['status', 'ping', 'nmap [IP]', 'report [finding]', 'block [IP]'],
      objective:
        'Correlate a suspicious IP with network activity, identify exposed services, and contain the simulated threat.'
    },
    didYouKnow: [
      'A port identifies a logical endpoint used by network services.',
      'Port 22 is commonly associated with SSH.',
      'Network scans should only be performed against systems you are authorized to test.'
    ]
  },

  {
    id: 'm4',
    title: 'Operation: Process Under Suspicion',
    tier: 'INTERMEDIATE',
    scenario:
      'Building on Bridge 1, you already used a process list and PID to separate an approved backup from a process needing review. Here, check the flagged process again, preserve its details, and decide whether scoped containment is justified.',
    intro:
      'HANDLER: Apply the process-list and PID skills from Bridge 1. The roster is a fresh snapshot; now add metadata and approval evidence, preserve it, then make and verify a scoped kill decision. High CPU remains a clue, not proof. This mission is untimed.',
    timerLimit: 0,
    learningGoal: 'Use process details and inventory context to assess an unapproved process, then perform a scoped simulated response.',
    difficulty: 'guided',
    primer: { definition: 'A process is a program that is running now. Its PID is a number used to inspect that specific program.', analogy: 'The process list is a staff roster; the PID is each worker’s badge number.', example: 'PID 3110 · backup-user · /usr/bin/backup → approved scheduled task\nPID 2214 · root · /tmp/.cache/cryptominer.exe → investigate the path and context before acting.' },
    topology: [
      { label: 'Sandbox server', address: '192.168.1.10', role: 'Host with elevated CPU activity', status: 'INVESTIGATING' },
      { label: 'Apache service', address: 'PID 1477', role: 'Expected parent process', status: 'EXPECTED', linksTo: 'Sandbox server' },
      { label: 'Unknown process', address: 'PID 2214', role: 'High CPU process in /tmp', status: 'SUSPICIOUS', linksTo: 'Sandbox server' }
    ],
    logs: [
      '[SYSTEM] CPU utilization above normal threshold.',
      '[ALERT] Unusual process activity detected.',
      '[MONITOR] Process 2214 consuming excessive CPU.'
    ],
    target: '2214',
    steps: [
      {
        desc: 'Refresh the process list and confirm the previously flagged PID is still running.',
        cmd: 'ps aux',
        hint: 'You practiced reading the process roster in Bridge 1. Use ps aux to confirm PID 2214 is still present before acting.'
      },
      {
        desc: 'Choose which process needs an individual review, using owner and path as well as CPU use.',
        cmd: 'choose 2214',
        hint: ['Compare each process with the approved backup job and its executable path.'],
        decision: { prompt: 'Which PID should you inspect next?', correctId: '2214', choices: [
          { id: '3110', label: 'PID 3110 · approved backup job with high CPU', feedback: 'The inventory identifies PID 3110 as scheduled backup work. High CPU during its scheduled window is not enough to flag it.' },
          { id: '2214', label: 'PID 2214 · root-owned program running from /tmp', feedback: 'Correct. Its temporary path and missing approval make it the stronger lead. Inspect the PID before any response.' }
        ] }
      },
      {
        desc: 'Investigate the suspicious process ID.',
        cmd: 'ps -p 2214',
        hint: ['Building on Bridge 1, focus the process review on the flagged PID.', 'The process roster shows PID 2214.']
      },
      {
        desc: 'Check the executable metadata and approval status before deciding whether response is justified.',
        cmd: 'stat /tmp/.cache/cryptominer.exe',
        hint: ['Compare its owner and location with the approved inventory.', 'Metadata supports review but does not prove who created the file or why.']
      },
      {
        desc: 'Report that PID 2214 is running from an unapproved path and needs scoped response; do not claim attribution.',
        cmd: 'report pid-2214-unapproved-process',
        hint: ['Cite the running PID, path, and missing approval.', 'High CPU and a temporary path are reasons to investigate, not proof of identity or intent.', 'Submit: report pid-2214-unapproved-process']
      },
      {
        desc: 'Record the process path and PID before stopping it.',
        cmd: 'preserve ps-pid-2214-process-path',
        hint: ['Preserve the command output as a simulated case note.', 'Real responders document process details before containment when circumstances permit.', 'Submit: preserve ps-pid-2214-process-path']
      },
      {
        desc: 'Stop the unapproved process in the training simulation after recording its evidence.',
        cmd: 'kill 2214',
        hint: 'Use kill followed by the process ID.'
      },
      {
        desc: 'Verify that the suspicious process is no longer running.',
        cmd: 'ps aux',
        hint: 'Run ps aux again and confirm PID 2214 is gone.'
      },
      {
        desc: 'Return to your home directory.',
        cmd: 'cd ~',
        hint: 'Use cd ~ to return to the operator directory.'
      }
    ],
    realWorld:
      'During incident response, analysts examine processes for unusual names, locations, resource usage, and parent-child relationships. An unapproved running process may justify scoped containment, but do not infer the operator or intent without more evidence.',
    briefing: {
      concept: 'Process Investigation and Malware Identification',
      commands: ['ps aux', 'ps -p [PID]', 'preserve [evidence]', 'kill [PID]'],
      objective:
        'Identify an abnormal process, investigate its PID, terminate the simulated malicious process, and verify the result.'
    },
    didYouKnow: [
      'PID means Process Identifier.',
      'High CPU usage does not automatically mean a process is malicious.',
      'Incident responders should preserve evidence when possible before terminating suspicious processes.'
    ]
  },

  {
    id: 'm5',
    title: 'Operation: Contain The Breach',
    tier: 'INTERMEDIATE',
    scenario:
      'A suspicious process has been removed, but the system is still communicating with an unknown service. You must determine which network service is exposed and contain the threat.',
    intro:
      'HANDLER: Removing malware is only part of incident response. We need to understand the network exposure and prevent further communication.',
    timerLimit: 0,
    learningGoal: 'Compare listening services with an approved baseline, then contain the confirmed suspicious source and verify the result.',
    difficulty: 'standard',
    primer: { definition: 'A listening service waits for a connection on a port. A baseline is the approved list of services expected on a host.', analogy: 'The baseline is the guest list; an unlisted listener needs checking with its owner.', example: 'Observed: 22/ssh, 80/http, 4444/unknown\nApproved: 22/ssh, 80/http\n4444 is a difference to investigate, not proof of compromise.' },
    topology: [
      { label: 'Operator workstation', address: '192.168.1.50', role: 'Authorized response console', status: 'TRUSTED' },
      { label: 'Sandbox server', address: '192.168.1.10', role: 'Protected host', status: 'INVESTIGATING', linksTo: 'Operator workstation' },
      { label: 'Approved services', address: 'TCP 22, 80', role: 'SSH and HTTP baseline', status: 'EXPECTED', linksTo: 'Sandbox server' },
      { label: 'Unknown service', address: 'TCP 4444', role: 'Unapproved listener', status: 'SUSPICIOUS', linksTo: 'Sandbox server' },
      { label: 'External host', address: '198.51.100.23', role: 'Known suspicious source', status: 'UNDER REVIEW', linksTo: 'Sandbox server' }
    ],
    logs: [
      '[NET] Unexpected listening service detected.',
      '[NET] TCP port 4444 exposed.',
      '[NETFLOW] Connection to the TCP 4444 listener from 198.51.100.23 observed at 10:14.',
      '[ALERT] The source is unverified; confirm ownership before treating it as malicious.'
    ],
    target: '4444',
    steps: [
      {
        desc: 'Check the current network status.',
        cmd: 'status',
        hint: 'Use status to inspect the simulated network state.'
      },
      {
        desc: 'List active network connections and listening services.',
        cmd: 'netstat -tuln',
        hint: 'Use netstat -tuln to inspect listening ports.'
      },
      {
        desc: 'Select the listener that differs from the approved service baseline.',
        cmd: 'choose 4444',
        hint: ['The baseline lists SSH and HTTP. Compare every observed listener before deciding.'],
        decision: { prompt: 'Which listener is absent from the baseline and needs follow-up?', correctId: '4444', choices: [
          { id: '22', label: 'TCP 22 · SSH', feedback: 'TCP 22 appears in the approved baseline. Keep it as an expected service unless other evidence changes that assessment.' },
          { id: '80', label: 'TCP 80 · HTTP', feedback: 'HTTP on TCP 80 is listed as expected in this case. The baseline comparison does not support selecting it.' },
          { id: '4444', label: 'TCP 4444 · unknown listener', feedback: 'Correct. It appears in the observed list but not the approved baseline. That is a configuration difference to investigate.' }
        ] }
      },
      {
        desc: 'Compare the listening ports with the approved baseline: SSH and HTTP are expected; port 4444 is not.',
        cmd: 'report unapproved-port-4444',
        hint: ['Compare every LISTEN entry with the expected-services list.', 'Port 4444 is the entry missing from the baseline.', 'Submit: report unapproved-port-4444']
      },
      {
        desc: 'Scan the local system to confirm the exposed service.',
        cmd: 'nmap localhost',
        hint: 'Use nmap localhost to perform a simulated local scan.'
      },
      {
        desc: 'Preserve a note of the listener inventory before changing the simulated network state.',
        cmd: 'preserve netstat port-4444-listener',
        hint: ['Record the source and observed fact before response.', 'Preserving evidence first helps explain what changed and why.', 'Submit: preserve netstat port-4444-listener']
      },
      {
        desc: 'Disable the unapproved simulated listener after confirming it is outside the server baseline.',
        cmd: 'disable-service 4444',
        hint: ['A listener can represent a legitimate service, so compare it with the approved baseline first.', 'The training action accepts a port number with the disable-service command.', 'Submit: disable-service 4444']
      },
      {
        desc: 'Select the source recorded in the connection evidence before containing it.',
        cmd: 'choose source-198-51-100-23',
        hint: ['Use the source shown in the network-flow record. Do not infer who controls the address.'],
        decision: { prompt: 'Which source is associated with the observed TCP 4444 connection?', correctId: 'source-198-51-100-23', choices: [
          { id: 'source-203-0-113-77', label: '203.0.113.77 · source from a separate web-request case', feedback: 'That address belongs to a separate web-log scenario. The current network-flow line records a different source.' },
          { id: 'source-198-51-100-23', label: '198.51.100.23 · source in this connection record', feedback: 'Correct. This is the recorded peer for the TCP 4444 connection. The record does not identify the person or prove malicious intent.' }
        ] }
      },
      {
        desc: 'Contain the unverified source associated with the unapproved listener, using a scoped simulated block.',
        cmd: 'block 198.51.100.23',
        target: '198.51.100.23',
        hint: ['The port identifies a service; the observed source IP identifies the peer to contain.', 'Block the known suspicious source, not the port number.', 'Submit: block 198.51.100.23']
      },
      {
        desc: 'Check the network status again.',
        cmd: 'status',
        hint: 'Verify that the suspicious connection has been contained.'
      },
      {
        desc: 'Verify that the unapproved listener is no longer present.',
        cmd: 'netstat -tuln',
        hint: ['Review the current listening-service list after the change.', 'Use netstat to confirm the 4444/tcp entry is absent.']
      }
    ],
    realWorld:
      'Containment prevents a security incident from spreading or continuing while responders investigate the root cause. Network isolation and firewall rules are common containment techniques.',
    briefing: {
      concept: 'Network Exposure and Incident Containment',
      commands: ['status', 'netstat -tuln', 'nmap localhost', 'preserve [evidence]', 'disable-service [port]', 'block [IP]'],
      objective:
        'Compare listeners against the baseline, disable the unapproved simulated service, contain the supported source, and verify both changes.'
    },
    didYouKnow: [
      'A listening port means a service is waiting for network connections.',
      'Not every open port is dangerous; defenders compare exposed services against the expected system configuration.',
      'Containment is different from eradication: containment limits the incident while eradication removes the cause.'
    ]
  },

  {
    id: 'm6',
    title: 'Operation: Web Server Under Attack',
    tier: 'INTERMEDIATE',
    scenario:
      'The web server is receiving unusual requests. Your task is to analyze the access logs and determine what type of attack is being attempted.',
    intro:
      'HANDLER: The network is contained, but another alert just came in. The web server is receiving suspicious requests. Investigate the logs.',
    timerLimit: 0,
    learningGoal: 'Use web access logs to identify suspicious input while distinguishing evidence of an attempt from proof of a successful compromise.',
    difficulty: 'standard',
    primer: { definition: 'A web access log records a request’s source, time, method, path, and response status.', analogy: 'It is a visitor log: who arrived, which door they tried, and what response they received.', example: '203.0.113.77 · 03:31:42 · GET · /index.php?id=1 UNION SELECT… · 200\nThis records a request and response; it does not alone prove database data was returned.' },
    topology: [
      { label: 'Client host', address: '203.0.113.77', role: 'Source of unusual HTTP requests', status: 'UNDER REVIEW' },
      { label: 'Web server', address: '192.168.1.10', role: 'Apache service', status: 'MONITORING', linksTo: 'Client host' },
      { label: 'Application logs', address: '/var/log/apache2/access.log', role: 'Request evidence', status: 'AVAILABLE', linksTo: 'Web server' },
      { label: 'Database', address: 'Sandbox data store', role: 'Potentially exposed resource', status: 'NO CONFIRMED ACCESS', linksTo: 'Web server' }
    ],
    logs: [
      '[WEB] Unusual HTTP request detected.',
      '[WEB] Request contains database keywords.',
      '[ALERT] Possible SQL injection attempt.'
    ],
    target: 'sql_injection',
    steps: [
      {
        desc: 'Navigate to the Apache web-server logs.',
        cmd: 'cd /var/log/apache2',
        hint: 'Apache logs are stored in the simulated /var/log/apache2 directory.'
      },
      {
        desc: 'List the available web logs.',
        cmd: 'ls',
        hint: 'Look for access.log.'
      },
      {
        desc: 'Read the web access log.',
        cmd: 'cat access.log',
        hint: 'Use cat access.log to inspect HTTP requests.'
      },
      {
        desc: 'Search the log for the UNION keyword.',
        cmd: "grep 'UNION' access.log",
        hint: 'grep searches text for a specified pattern.'
      },
      {
        desc: 'Choose the request that warrants application-owner review, without claiming data access.',
        cmd: 'choose sql-request',
        hint: ['Compare the routine health request with the request that includes database-like syntax.'],
        decision: { prompt: 'Which recorded event should be escalated as a possible injection attempt?', correctId: 'sql-request', choices: [
          { id: 'health-check', label: 'GET /health · routine response', feedback: 'The health-check path matches the expected service behavior in this case. Keep it as a benign comparison.' },
          { id: 'sql-request', label: 'GET request containing UNION SELECT', feedback: 'Correct. The request contains a pattern worth investigating. The HTTP response alone does not establish whether data was returned.' }
        ] }
      },
      {
        desc: 'Classify the evidence as an attempted SQL injection. A log entry shows a request pattern, not proof that data was accessed.',
        cmd: 'report sql-injection-attempt',
        hint: ['Inspect where the UNION SELECT text appears in the request.', 'User-controlled input containing SQL syntax is an injection indicator; the response code alone does not confirm impact.', 'Use report to classify the recorded request as an injection attempt, without claiming confirmed access.']
      },
      {
        desc: 'Return to your home directory.',
        cmd: 'cd ~',
        hint: 'Use cd to return to the operator’s home directory after the investigation.'
      }
    ],
    realWorld:
      'SQL injection occurs when untrusted input is interpreted as part of a database query. Defenders use parameterized queries, input validation, least privilege, and monitoring to reduce the risk.',
    briefing: {
      concept: 'Web Logs and SQL Injection Detection',
      commands: ['cd', 'ls', 'cat', 'grep', 'report [finding]'],
      objective:
        'Analyze HTTP access logs and recognize evidence of a SQL injection attempt.'
    },
    didYouKnow: [
      'SQL injection targets the way an application constructs database queries.',
      'UNION SELECT is one pattern that can appear in SQL injection attempts.',
      'The strongest defense against SQL injection is parameterized database queries.'
    ]
  },

  {
    id: 'm7',
    title: 'Operation: Trace the Attack',
    tier: 'EXPERT',
    scenario:
      'Three different alerts have appeared: failed authentication, suspicious network activity, and a malicious web request. Your task is to correlate the evidence and determine whether they belong to the same incident.',
    intro:
      'HANDLER: Rookie missions are over. Real incidents rarely arrive as one clean alert. Correlate the evidence and build the timeline.',
    timerLimit: 0,
    learningGoal: 'Correlate independent sources and timestamps, separate confirmed facts from assumptions, and build a defensible incident timeline.',
    difficulty: 'advanced',
    primer: { definition: 'A timeline orders records from different systems. Their clocks may differ, so recorded times may need adjustment before comparison.', analogy: 'Before comparing two watches, first check whether they show the same time.', example: 'Host A: 03:24 · Host B: 03:26 · B is 2 minutes fast\nAdjusted B time: 03:24. Similar timing supports a possible link, not proof of one actor.' },
    topology: [
      { label: 'Operator workstation', address: '192.168.1.50', role: 'Investigation console', status: 'TRUSTED' },
      { label: 'Sandbox server', address: '192.168.1.10', role: 'System with related alerts', status: 'INVESTIGATING', linksTo: 'Operator workstation' },
      { label: 'External host', address: '198.51.100.23', role: 'Failed SSH source', status: 'UNVERIFIED', linksTo: 'Sandbox server' },
      { label: 'Web client', address: '203.0.113.77', role: 'Source of suspicious request', status: 'NEEDS CORRELATION', linksTo: 'Sandbox server' },
      { label: 'Process evidence', address: 'PID 2214', role: 'Abnormal activity after alerts', status: 'SUSPICIOUS', linksTo: 'Sandbox server' }
    ],
    logs: [
      '[03:21] Failed SSH authentication from 198.51.100.23.',
      '[03:24] Successful SSH authentication from 198.51.100.23.',
      '[03:31] SQL-like web request from 203.0.113.77.',
      '[03:32] Process 2214 begins abnormal activity.',
      '[03:35] Approved backup task completed on schedule.'
    ],
    target: 'incident_correlation',
    steps: [
      {
        desc: 'Review authentication evidence.',
        cmd: 'cd /var/log',
        hint: 'Start with the authentication logs.'
      },
      {
        desc: 'Read the authentication log.',
        cmd: 'cat auth.log',
        hint: 'Look for the suspicious source and timing.'
      },
      {
        desc: 'Filter the SSH service journal to the relevant time window and compare event order.',
        cmd: 'journalctl -u ssh --since 03:23:00 --until 03:27:00',
        hint: ['Use the service and time filters to narrow the journal.', 'The system journal clock is about two minutes fast; compare event order after accounting for the offset.', 'Use the journalctl command family to review service events in a time window.']
      },
      {
        desc: 'Record the authentication observation and cite its source file.',
        cmd: 'record-evidence auth.log repeated-failures-and-later-success',
        hint: ['Capture what the log shows without naming an attacker.', 'Keep observations separate from interpretation.', 'Use the evidence-recording command with a source and a factual observation.']
      },
      {
        desc: 'Inspect the system processes.',
        cmd: 'ps aux',
        hint: 'Look for abnormal processes that appeared after the authentication activity.'
      },
      {
        desc: 'Inspect current network activity.',
        cmd: 'ss -tuln',
        hint: 'Use ss -tuln to inspect listening sockets, then compare them with the expected services.'
      },
      {
        desc: 'Review the web-server evidence.',
        cmd: 'cd /var/log/apache2',
        hint: 'Move to the Apache logs.'
      },
      {
        desc: 'Read the web access log.',
        cmd: 'cat access.log',
        hint: 'Look for suspicious requests and correlate their timing.'
      },
      {
        desc: 'Record the web observation and note that this source address differs from the SSH source.',
        cmd: 'record-evidence access.log sql-like-request-from-separate-address',
        hint: ['Cite access.log and the source address it records.', 'A separate address is a reason not to assume one shared actor.', 'Use the evidence-recording command with the log name and observed fact.']
      },
      {
        desc: 'Review scheduled work and rule out the approved backup as an unrelated benign event.',
        cmd: 'crontab -l',
        hint: ['Compare scheduled commands with the timeline and known maintenance notes. A nearby event is not automatically part of the incident.']
      },
      {
        desc: 'Classify the scheduled backup using its approved path and completion record.',
        cmd: 'choose backup-benign',
        hint: ['Check the task name against the approved maintenance context before including it in your incident timeline.'],
        decision: { prompt: 'How should the scheduled backup be treated?', correctId: 'backup-benign', choices: [
          { id: 'backup-benign', label: 'Benign comparison event; exclude it from the incident chain', feedback: 'Correct. The task is approved and completed on schedule, so proximity alone does not make it incident activity.' },
          { id: 'backup-malicious', label: 'Confirmed malicious because CPU use was high', feedback: 'CPU usage and timing alone are not enough. The schedule and approved path support legitimate maintenance.' }
        ] }
      },
      {
        desc: 'Decide whether the records establish one shared actor or only a possible relationship.',
        cmd: 'choose related-needs-validation',
        hint: ['Compare the corrected timeline with the different source addresses and the incomplete records.'],
        decision: { prompt: 'What conclusion is best supported by this evidence?', correctId: 'related-needs-validation', choices: [
          { id: 'same-actor-confirmed', label: 'The same actor is confirmed across SSH and web activity', feedback: 'The records show different source addresses, and shared networks or clock offsets remain possible. The current evidence does not identify a shared actor.' },
          { id: 'unrelated-confirmed', label: 'The activity is definitely unrelated', feedback: 'Different addresses weaken a single-source theory but do not prove the events are unrelated. Keep the relationship as a hypothesis for follow-up.' },
          { id: 'related-needs-validation', label: 'The timeline may be related, but the link needs validation', feedback: 'Correct. Timing supports follow-up; source differences and missing records limit attribution.' }
        ] }
      },
      {
        desc: 'Record medium confidence because suspicious events are correlated in time but source identity and impact remain unconfirmed.',
        cmd: 'assess medium correlation-unconfirmed',
        hint: ['Medium confidence reflects multiple suspicious observations but incomplete linkage.', 'Different source IPs, possible shared networks, and clock differences limit attribution.', 'Use the confidence-assessment command and choose a level supported by the gaps.']
      },
      {
        desc: 'Submit the finding while keeping possible correlation separate from confirmed attribution or impact.',
        cmd: 'report correlation-unconfirmed',
        hint: ['Compare timestamps and source addresses across the four evidence sources.', 'A close timeline supports investigation, but the web request uses a different source address.', 'Use the report command to state the cautious conclusion.']
      },
      {
        desc: 'Return to the operator home directory.',
        cmd: 'cd ~',
        hint: 'Return home when your evidence collection is complete.'
      }
    ],
    realWorld:
      'Incident responders correlate multiple evidence sources to reconstruct what happened. A single alert may be harmless, but several related events can reveal a larger attack chain.',
    briefing: {
      concept: 'Incident Correlation and Attack Timeline',
      commands: ['cat', 'journalctl [time filters]', 'ps aux', 'ss -tuln', 'record-evidence [source] [fact]', 'assess [confidence] [finding]', 'report [finding]', 'cd'],
      objective:
        'Correlate authentication, process, network, and web evidence to reconstruct a simulated security incident.'
    },
    didYouKnow: [
      'Security Operations Centers often correlate events from many systems.',
      'A timeline helps responders understand what happened first and what happened afterward.',
      'Correlation is stronger when multiple independent sources support the same conclusion.'
    ]
  },

  {
    id: 'm8',
    title: 'Operation: Find the Persistence',
    tier: 'EXPERT',
    scenario:
      'The malicious process was removed, but the security team suspects the attacker created a way to return after the system restarts. Investigate possible persistence mechanisms.',
    intro:
      'HANDLER: Killing the process did not end the incident. Something may be allowing the attacker to return. Find the persistence mechanism.',
    timerLimit: 0,
    learningGoal: 'Investigate multiple persistence locations and distinguish expected automation from unauthorized mechanisms.',
    difficulty: 'advanced',
    primer: { definition: 'Persistence is a way a program or account can regain access after a restart or sign-out.', analogy: 'It is like leaving a spare key so someone can return later; find and verify the key before removing it.', example: 'A scheduled task or an unfamiliar authorized key can be a persistence clue. Confirm ownership and purpose before changing it.' },
    topology: [
      { label: 'Sandbox server', address: '192.168.1.10', role: 'Previously compromised host', status: 'INVESTIGATING' },
      { label: 'Scheduled tasks', address: 'cron', role: 'Automation review', status: 'SUSPICIOUS ENTRY', linksTo: 'Sandbox server' },
      { label: 'SSH access', address: '~/.ssh/authorized_keys', role: 'Remote access review', status: 'UNKNOWN KEY', linksTo: 'Sandbox server' },
      { label: 'Temporary storage', address: '/tmp/.cache', role: 'Executable review', status: 'SUSPICIOUS FILE', linksTo: 'Sandbox server' }
    ],
    logs: [
      '[ALERT] Suspicious scheduled task detected.',
      '[AUTH] Unexpected SSH key discovered.',
      '[SYSTEM] Unknown executable found in temporary storage.'
    ],
    target: 'persistence',
    steps: [
      {
        desc: 'Inspect running processes for remaining suspicious activity.',
        cmd: 'ps aux',
        hint: 'Start by checking whether the malicious process returned.'
      },
      {
        desc: 'Inspect scheduled tasks.',
        cmd: 'crontab -l',
        hint: 'Cron can automatically execute commands on a schedule.'
      },
      {
        desc: 'Inspect the operator SSH authorized keys.',
        cmd: 'cat ~/.ssh/authorized_keys',
        hint: 'Authorized SSH keys can provide persistent remote access.'
      },
      {
        desc: 'Search the filesystem for the suspicious executable.',
        cmd: 'find / -name cryptominer.exe',
        hint: 'Use find to locate files by name.'
      },
      {
        desc: 'Check the executable metadata and compare its owner, permissions, and location with the baseline.',
        cmd: 'stat /tmp/.cache/cryptominer.exe',
        hint: ['File metadata includes owner, mode, and modification time.', 'Metadata makes a file worth reviewing but does not prove it executed.', 'Use the metadata command family and the path you found in the evidence.']
      },
      {
        desc: 'Summarize the persistence evidence: a suspicious scheduled script, an unknown SSH key, and an executable in temporary storage.',
        cmd: 'choose cron-and-ssh-key',
        hint: ['The approved backup schedule and known operator key are decoys. Compare the remaining entries with the inventory.'],
        decision: { prompt: 'Which entries are the strongest persistence leads?', correctId: 'cron-and-ssh-key', choices: [
          { id: 'backup-and-operator', label: 'The scheduled backup and known operator key', feedback: 'Both entries match expected administration. A familiar scheduled task or approved key should not be removed just because it is present.' },
          { id: 'cron-only', label: 'Only the temporary-directory cron task', feedback: 'That task is suspicious, but the unknown external-host key is also absent from the known-key list and needs review.' },
          { id: 'cron-and-ssh-key', label: 'The temporary-directory cron task and unfamiliar SSH key', feedback: 'Correct. Both are outside the expected baseline. The backup job and known operator key are benign comparison items.' }
        ] }
      },
      { desc: 'Record the evidence-based persistence finding.', cmd: 'report cron-key-and-temp-file', hint: ['Cite the scheduled task, key entry, and file details. Do not infer who installed them without more evidence.'] },
      { desc: 'Decide whether the discovered executable is confirmed to have run.', cmd: 'choose execution-unconfirmed', hint: ['Metadata and file presence are not execution records. Identify what evidence is still missing.'], decision: { prompt: 'What does the file evidence establish?', correctId: 'execution-unconfirmed', choices: [
        { id: 'execution-confirmed', label: 'The executable definitely ran because it exists in /tmp', feedback: 'A file’s presence and metadata do not establish that it executed. Look for process history or other corroborating records.' },
        { id: 'execution-unconfirmed', label: 'The file is an unapproved lead; execution remains unconfirmed', feedback: 'Correct. Its path and metadata justify investigation, but they do not prove it ran.' }
      ] } },
      {
        desc: 'Verify that the suspicious process is no longer active.',
        cmd: 'ps aux',
        hint: 'Check the process list one more time.'
      }
    ],
    realWorld:
      'Persistence allows an attacker or malicious program to survive reboots or regain access later. Defenders investigate scheduled tasks, startup mechanisms, unauthorized accounts, SSH keys, and suspicious files.',
    briefing: {
      concept: 'Persistence Detection',
      commands: ['ps aux', 'crontab -l', 'cat', 'find', 'stat [file]', 'report [finding]'],
      objective:
        'Investigate multiple persistence mechanisms and identify how the simulated attacker could regain access.'
    },
    didYouKnow: [
      'Persistence is the ability of an attacker or malware to maintain access over time.',
      'Cron is a legitimate scheduling system that can also be abused for persistence.',
      'An unauthorized SSH key can allow remote access without the attacker repeatedly entering a password.'
    ]
  },

  {
    id: 'm9',
    title: 'Operation: Full Incident Response',
    tier: 'EXPERT',
    scenario:
      'The Sandbox Secure server has a multi-stage security incident. Investigate the records, separate confirmed facts from assumptions, contain supported activity, review persistence, and verify the simulated system state.',
    intro:
      'HANDLER: Final operation. Apply what you have learned: collect evidence, separate facts from assumptions, contain the supported threat, and verify the system state.',
    timerLimit: 2100,
    learningGoal: 'Run a careful incident-response cycle: establish scope, collect evidence, correlate facts, contain supported activity, and verify system state.',
    difficulty: 'advanced',
    topology: [
      { label: 'Operator workstation', address: '192.168.1.50', role: 'Authorized response console', status: 'TRUSTED' },
      { label: 'Sandbox server', address: '192.168.1.10', role: 'Multi-stage incident host', status: 'INCIDENT ACTIVE', linksTo: 'Operator workstation' },
      { label: 'External host', address: '198.51.100.23', role: 'Repeated SSH failures', status: 'UNVERIFIED', linksTo: 'Sandbox server' },
      { label: 'Unknown process', address: 'PID 2214', role: 'High CPU executable', status: 'SUSPICIOUS', linksTo: 'Sandbox server' },
      { label: 'Web application', address: 'HTTP 80', role: 'SQL-like input in access logs', status: 'ATTEMPT OBSERVED', linksTo: 'Sandbox server' },
      { label: 'Scheduled task', address: '/tmp/.cache/update.sh', role: 'Possible persistence', status: 'SUSPICIOUS', linksTo: 'Sandbox server' },
      { label: 'SSH access key', address: '~/.ssh/authorized_keys', role: 'Unfamiliar remote access entry', status: 'UNVERIFIED', linksTo: 'Sandbox server' }
    ],
    logs: [
      '[03:21] Multiple failed SSH logins from 198.51.100.23.',
      '[03:24] Successful SSH authentication from 198.51.100.23.',
      '[03:26] Unexpected network connection detected.',
      '[03:28] Suspicious process 2214 created.',
      '[03:31] Web server receives SQL injection attempt.',
      '[03:32] CPU usage rises sharply.',
      '[03:35] Suspicious scheduled task discovered.'
    ],
    target: 'full_incident_response',
    steps: [
      {
        desc: 'Establish the current user and investigation context.',
        cmd: 'whoami',
        hint: 'Start by establishing who you are operating as.'
      },
      {
        desc: 'Review the authentication evidence.',
        cmd: 'cd /var/log',
        hint: 'Navigate to the authentication logs.'
      },
      {
        desc: 'Read the authentication log and identify the suspicious source.',
        cmd: 'cat auth.log',
        hint: 'Look for repeated failures followed by suspicious successful access.'
      },
      {
        desc: 'Inspect running processes for malicious activity.',
        cmd: 'ps aux',
        hint: 'Look for the suspicious process identified in the incident timeline.'
      },
      {
        desc: 'Choose a process for individual review, ruling out approved scheduled work.',
        cmd: 'choose 2214',
        hint: ['Compare the process owner and executable path with the scheduled backup inventory.'],
        decision: { prompt: 'Which PID should be inspected further?', correctId: '2214', choices: [
          { id: '3110', label: 'PID 3110 · approved backup process', feedback: 'The inventory and scheduled time support this backup process as legitimate. CPU use alone is not enough to stop it.' },
          { id: '2214', label: 'PID 2214 · root process from a temporary path', feedback: 'Correct. The path is not approved and should be corroborated with the timeline before response.' }
        ] }
      },
      {
        desc: 'Investigate the suspicious process.',
        cmd: 'ps -p 2214',
        hint: 'Inspect PID 2214.'
      },
      {
        desc: 'Inspect network services.',
        cmd: 'netstat -tuln',
        hint: 'Look for unexpected listening services.'
      },
      {
        desc: 'Investigate the web-server logs.',
        cmd: 'cd /var/log/apache2',
        hint: 'Move into the Apache log directory.'
      },
      {
        desc: 'Read the web access log.',
        cmd: 'cat access.log',
        hint: 'Look for evidence of the SQL injection attempt.'
      },
      {
        desc: 'Search for the suspicious SQL pattern.',
        cmd: "grep 'UNION' access.log",
        hint: 'Search for UNION in the access log.'
      },
      {
        desc: 'Investigate scheduled-task persistence.',
        cmd: 'crontab -l',
        hint: 'Inspect scheduled tasks for suspicious entries.'
      },
      {
        desc: 'Check authorized SSH keys for an unfamiliar route back into the host.',
        cmd: 'cat ~/.ssh/authorized_keys',
        hint: ['Compare key comments with the known operator and backup accounts.', 'One key is labeled as coming from an unknown external host.', 'Use a file-reading command to review the simulated authorized-key list.']
      },
      {
        desc: 'Record a careful assessment before response: suspicious access and persistence are supported, but the web request source differs and impact is not confirmed.',
        cmd: 'report suspicious-activity-impact-unconfirmed',
        hint: ['Separate observed facts from assumptions before changing the system.', 'The logs support suspicious activity; they do not establish that database data was accessed or who controlled both sources.', 'Use the report command to capture a scoped, evidence-based conclusion.']
      },
      {
        desc: 'Preserve the key process, network, and persistence evidence before making response changes.',
        cmd: 'preserve case-evidence-before-containment',
        hint: ['The assessment is recorded. Capture the simulated case evidence before response actions.', 'Evidence preservation helps explain what was present before containment.', 'Use the evidence-preservation command before response.']
      },
      {
        desc: 'Select the source supported by the authentication evidence for scoped containment.',
        cmd: 'choose ssh-source',
        hint: ['The web request has a different source. Use the authentication records for this containment decision.'],
        decision: { prompt: 'Which source should be selected for this case’s scoped block?', correctId: 'ssh-source', choices: [
          { id: 'web-source', label: '203.0.113.77 · source of SQL-like web requests', feedback: 'This address appears in web requests, not the authentication sequence. The evidence does not support substituting it for the SSH source.' },
          { id: 'ssh-source', label: '198.51.100.23 · repeated SSH failures followed by success', feedback: 'Correct. This address is supported by the authentication evidence. A scoped response still does not identify the person behind it.' }
        ] }
      },
      {
        desc: 'Choose the persistence entries supported by the inventory and collected evidence.',
        cmd: 'choose cron-and-ssh-key',
        hint: ['The logrotate and scheduled backup tasks are approved. Compare the remaining entries with the evidence you collected.'],
        decision: { prompt: 'Which persistence targets should be removed after the evidence has been recorded?', correctId: 'cron-and-ssh-key', choices: [
          { id: 'backup', label: 'Remove the approved backup schedule', feedback: 'The backup schedule is listed as approved. Removing it would disrupt expected work without evidence that it is part of the incident.' },
          { id: 'cron-and-ssh-key', label: 'Remove the unapproved temporary-path task and unfamiliar key', feedback: 'Correct. These are the two unapproved persistence leads. Preserve them first, then verify both are gone.' },
          { id: 'web-source', label: 'Remove the web source address', feedback: 'An IP address is not a persistence mechanism. The supported persistence evidence is in the scheduled-task and authorized-key records.' }
        ] }
      },
      {
        desc: 'Stop the unapproved running process after preserving its evidence.',
        cmd: 'kill 2214',
        hint: 'Remove the malicious process after collecting the evidence.'
      },
      {
        desc: 'Contain the known suspicious source.',
        cmd: 'block 198.51.100.23',
        target: '198.51.100.23',
        hint: ['Use the source supported by repeated authentication evidence.', 'Do not use the web request source as a substitute; the logs show a different address.', 'Use the simulated containment command with the source you selected from the logs.']
      },
      {
        desc: 'Disable the confirmed unapproved listener discovered during investigation.',
        cmd: 'disable-service 4444',
        hint: ['The 4444/tcp listener was absent from the approved baseline.', 'Use the service-containment command with the port supported by the baseline comparison.']
      },
      {
        desc: 'Remove the confirmed unauthorized scheduled task from the simulated host.',
        cmd: 'remove-persistence cron',
        hint: ['The cron list showed an unknown script running from temporary storage.', 'Use the persistence-removal action with the mechanism supported by the evidence.']
      },
      {
        desc: 'Remove the unfamiliar SSH key after recording it as evidence.',
        cmd: 'remove-persistence ssh-key',
        hint: ['Preserve the finding in your report before changing access controls.', 'Use the persistence-removal action with the mechanism supported by the evidence.']
      },
      {
        desc: 'Verify containment and cleanup by checking the process list, network status, listeners, scheduled tasks, and authorized keys in any order.',
        cmd: 'verify incident response',
        requiredCommands: ['ps aux', 'status', 'netstat -tuln', 'crontab -l', 'cat ~/.ssh/authorized_keys'],
        hint: ['Run each listed read-only check in any order.', 'Confirm PID 2214, the 4444 listener, the temporary-path task, and unfamiliar key are absent; confirm the approved services remain.']
      },
      {
        desc: 'Return to the operator home directory.',
        cmd: 'cd ~',
        hint: 'Return home after completing the incident response.'
      }
    ],
    realWorld:
      'Incident response commonly follows a cycle of preparation, detection and analysis, containment, eradication, recovery, and lessons learned. The exact workflow varies by organization, but responders should preserve evidence and make controlled changes.',
    briefing: {
      concept: 'Complete Incident Response',
      commands: [
        'whoami',
        'cat',
        'ps aux',
        'ps -p [PID]',
        'netstat -tuln',
        'grep',
        'crontab -l',
        'report [finding]',
        'kill [PID]',
        'block [IP]',
        'disable-service [port]',
        'remove-persistence [cron|ssh-key]',
        'netstat -tuln',
        'crontab -l',
        'status'
      ],
      objective:
        'Investigate a multi-stage simulated intrusion, correlate evidence, contain the threat, remove malicious activity, and verify the system state.'
    },
    didYouKnow: [
      'Incident response is not simply "find malware and delete it."',
      'Evidence collection and containment should be performed carefully because actions can destroy useful forensic evidence.',
      'A successful response should include verification that the threat is no longer active.',
      'After an incident, organizations should document what happened and improve their defenses.'
    ]
  }
];

// --- QUIZ DATA (10 Questions Each) ---
export const BEGINNER_PRETEST: Question[] = [
  { id: 1, question: "Which command tells you the current working directory?", options: ["pwd", "ls", "cat", "ping"], correctAnswer: 0, explanation: "pwd prints the path of the directory you are currently in." },
  { id: 2, question: "You need to move into a folder named evidence. Which command changes directories?", options: ["cd evidence", "ls evidence", "cat evidence", "whoami evidence"], correctAnswer: 0, explanation: "cd changes the current directory; the folder name is its argument." },
  { id: 3, question: "What does ls help you discover?", options: ["Which files and folders are listed in a directory", "The contents of a text file", "Whether a host replies", "The current account password"], correctAnswer: 0, explanation: "ls lists directory entries; use cat when you need to read a text file." },
  { id: 4, question: "Which command displays the text stored in alerts.txt?", options: ["cat alerts.txt", "cd alerts.txt", "pwd alerts.txt", "ping alerts.txt"], correctAnswer: 0, explanation: "cat prints the contents of a text file." },
  { id: 5, question: "What does whoami report in the training terminal?", options: ["The current simulated account name", "The current folder", "The files in a folder", "A remote host's open ports"], correctAnswer: 0, explanation: "whoami identifies the account used by the current terminal session." },
  { id: 6, question: "A ping reply is received from a training host. What does that result tell you?", options: ["The host responded to a reachability check", "The host is free of security issues", "Every service on it is approved", "The person using it is identified"], correctAnswer: 0, explanation: "A response indicates reachability at that time; it does not establish safety or identity." },
  { id: 7, question: "What does an IP address represent in a basic network check?", options: ["An address for a host or network interface", "A command to read a file", "A running program's PID", "A user password"], correctAnswer: 0, explanation: "An IP address is used to address a host or one of its network interfaces." },
  { id: 8, question: "In a network address such as 192.0.2.10:443, what does 443 identify?", options: ["A service port", "A folder", "A user account", "A process name"], correctAnswer: 0, explanation: "The port number identifies a service endpoint on the addressed host." },
  { id: 9, question: "Why might an analyst read a log file with cat before making a decision?", options: ["To inspect the recorded lines as evidence", "To automatically block the source", "To prove who wrote each line", "To remove old events"], correctAnswer: 0, explanation: "Reading the file lets you examine the available records; it does not modify or authenticate them." },
  { id: 10, question: "A folder listing shows a file called report.txt. Which command sequence reads it from that folder?", options: ["cat report.txt", "cd report.txt", "ping report.txt", "pwd report.txt"], correctAnswer: 0, explanation: "Once you are in the folder, cat followed by the filename displays its text." }
];

// NEW: Distinct Post-Test Questions
export const BEGINNER_POSTTEST: Question[] = [
  { id: 1, question: "You are in /home/operator and need the files in the logs subfolder. What should you do first?", options: ["cd logs", "cat logs", "whoami logs", "ping logs"], correctAnswer: 0, explanation: "Change into the directory with cd before working with its files." },
  { id: 2, question: "After entering a folder, which command gives you a quick inventory of its entries?", options: ["ls", "pwd", "cat", "whoami"], correctAnswer: 0, explanation: "ls provides a listing of files and directories." },
  { id: 3, question: "You see auth.log in the listing and want to inspect its text. Which command fits?", options: ["cat auth.log", "cd auth.log", "pwd auth.log", "ping auth.log"], correctAnswer: 0, explanation: "cat reads the text in the named file." },
  { id: 4, question: "The prompt says you are in /home/operator/logs. Which command would confirm that location?", options: ["pwd", "ls", "cat", "whoami"], correctAnswer: 0, explanation: "pwd reports the current directory path." },
  { id: 5, question: "A command output identifies the current account as trainee. Which command produced that kind of result?", options: ["whoami", "cd", "cat", "ping"], correctAnswer: 0, explanation: "whoami prints the active account name." },
  { id: 6, question: "A host does not reply to ping. What is the careful interpretation?", options: ["No reply was received; this alone does not prove why", "The host is definitely powered off", "The host has no network address", "The host is compromised"], correctAnswer: 0, explanation: "Filtering, configuration, or connectivity can affect replies; the result alone does not identify the cause." },
  { id: 7, question: "A service is listed on port 22. Which detail does the port provide?", options: ["The service endpoint number", "The host's folder path", "The account name", "The process owner's identity"], correctAnswer: 0, explanation: "A port number identifies an endpoint used by a service on a host." },
  { id: 8, question: "A training host is listed as 192.0.2.25. What kind of information is that?", options: ["A network address for the host or interface", "A directory name", "A log command", "A process ID"], correctAnswer: 0, explanation: "The IP address identifies a network destination, not the person using it." },
  { id: 9, question: "A log line records a failed sign-in. What does that line establish by itself?", options: ["A failed attempt was recorded", "The account was accessed successfully", "The identity of the person who tried", "That no other events occurred"], correctAnswer: 0, explanation: "A failed event records an attempt, not a successful sign-in or a person's identity." },
  { id: 10, question: "Before treating an unfamiliar host or service as dangerous, what is the sensible first step?", options: ["Check the available records and expected context", "Delete the logs", "Assume the owner is malicious", "Block every address"], correctAnswer: 0, explanation: "Basic investigation starts by checking context and evidence before drawing conclusions." }
];

export const INTERMEDIATE_PRETEST: Question[] = [
  { id: 1, question: "A process list shows a high-CPU PID. Which command targets that process for focused inspection?", options: ["ps -p 2214", "netstat -tuln", "grep 2214 access.log", "crontab -l"], correctAnswer: 0, explanation: "ps -p [PID] displays details for one process so you can assess its context." },
  { id: 2, question: "What fields can ps aux help an analyst compare across running processes?", options: ["PID, owner, CPU use, and command", "HTTP status, URL, and request method", "File contents and line numbers", "Listening ports and remote peers only"], correctAnswer: 0, explanation: "ps aux provides a process snapshot with identifiers, owners, resource use, and command details." },
  { id: 3, question: "A process runs from /tmp and is absent from the approved inventory. What is the strongest initial finding?", options: ["Its path and approval status warrant investigation", "Its operator is identified", "It definitely stole data", "It must be terminated before recording anything"], correctAnswer: 0, explanation: "Path and inventory differences are evidence to investigate; they do not establish attribution or impact." },
  { id: 4, question: "Which command displays metadata for a specific file before a response decision?", options: ["stat /tmp/task.sh", "pwd /tmp/task.sh", "ping /tmp/task.sh", "whoami /tmp/task.sh"], correctAnswer: 0, explanation: "stat reports metadata such as ownership, permissions, and modification times." },
  { id: 5, question: "netstat -tuln reports a listening service absent from the approved baseline. What should you establish next?", options: ["Which listener differs and whether the case evidence supports action", "The identity of the person who opened it", "That data was exfiltrated", "That every other listener is malicious"], correctAnswer: 0, explanation: "Compare observed listeners with the case baseline and gather supporting context." },
  { id: 6, question: "In the training environment, what does nmap localhost inspect?", options: ["Simulated services exposed by the local host", "The contents of every log file", "The current process owner", "Scheduled task history"], correctAnswer: 0, explanation: "The local scan checks which simulated network services are exposed on that host." },
  { id: 7, question: "Which command can find lines containing 'UNION SELECT' in access.log?", options: ["grep 'UNION SELECT' access.log", "ps -p 'UNION SELECT'", "cd 'UNION SELECT'", "kill access.log"], correctAnswer: 0, explanation: "grep searches text for a supplied pattern." },
  { id: 8, question: "A web log contains a SQL-like request and HTTP 200. What additional evidence is needed before claiming data was returned?", options: ["Application or database evidence showing the request's effect", "The source IP alone", "A high process CPU value", "The fact that grep found the string"], correctAnswer: 0, explanation: "A logged request and response code do not establish database impact; corroborating application or database records are needed." },
  { id: 9, question: "Why run crontab -l during a persistence investigation?", options: ["To inspect scheduled commands for unexpected entries", "To list active network sockets", "To stop all running processes", "To search web requests"], correctAnswer: 0, explanation: "crontab -l displays scheduled tasks that may warrant comparison with the approved baseline." },
  { id: 10, question: "Before using kill [PID] on a suspicious process, what is the strongest practice?", options: ["Confirm the PID and preserve relevant evidence when feasible", "Kill every process owned by the same account", "Delete the process logs", "Assume high CPU proves malware"], correctAnswer: 0, explanation: "Verify the target and preserve useful process evidence before scoped containment when circumstances permit." }
];

// NEW: Distinct Post-Test Questions
export const INTERMEDIATE_POSTTEST: Question[] = [
  { id: 1, question: "After preserving the details for PID 2214, which command performs the mission's scoped process containment?", options: ["kill 2214", "kill 0", "grep 2214", "crontab -l"], correctAnswer: 0, explanation: "The simulated kill command targets the confirmed PID; it should follow investigation and evidence capture." },
  { id: 2, question: "After kill 2214, which follow-up best verifies the process state?", options: ["Run ps aux and confirm PID 2214 is absent", "Assume it worked because the command ran", "Delete the process log", "Run whoami"], correctAnswer: 0, explanation: "A fresh process listing checks whether that specific PID remains active." },
  { id: 3, question: "A listener on port 4444 is missing from the approved services list. Which action is appropriately scoped in the simulation?", options: ["disable-service 4444 after confirming the baseline difference", "disable-service all", "kill 4444", "remove every service"], correctAnswer: 0, explanation: "The mission's simulated command disables the identified unapproved listener by port after comparison." },
  { id: 4, question: "A connection record associates a peer with the unapproved listener. What should guide a block [IP] decision?", options: ["The recorded peer and supporting case evidence", "Any address visible on the screen", "The process PID", "The HTTP status number"], correctAnswer: 0, explanation: "Use the source in the connection evidence and keep the response scoped; an address does not identify a person." },
  { id: 5, question: "After disabling a listener, which command can verify the listening-port list changed?", options: ["netstat -tuln", "cat /etc/passwd", "whoami", "crontab -l"], correctAnswer: 0, explanation: "A new network status listing can confirm whether the target listener is absent." },
  { id: 6, question: "Why preserve process or network output before containment when feasible?", options: ["It records the observed state for later analysis", "It proves who caused the activity", "It guarantees no recurrence", "It automatically blocks the threat"], correctAnswer: 0, explanation: "Preserved observations help explain what was present before a response changed the system." },
  { id: 7, question: "A grep search finds a suspicious request string. What does that result prove?", options: ["The matching text appears in the searched log", "The database returned sensitive data", "The source user is identified", "The server was compromised"], correctAnswer: 0, explanation: "A text match establishes that the pattern was logged; impact requires corroborating evidence." },
  { id: 8, question: "A crontab entry runs an unfamiliar script. What is the sound next step?", options: ["Inspect its path and compare it with approved scheduled tasks", "Delete all scheduled jobs", "Assume it executed successfully", "Block the host's IP"], correctAnswer: 0, explanation: "An unfamiliar scheduled task merits context and inventory checks before deciding on removal." },
  { id: 9, question: "The process is gone and the unexpected listener is closed. What does this verify?", options: ["Those checked states changed; other persistence and impact still need review", "The entire incident is eradicated", "The responsible person is known", "No data was accessed"], correctAnswer: 0, explanation: "Each check verifies a specific state and does not prove that every risk or persistence path is resolved." },
  { id: 10, question: "Your report has a process path, a baseline difference, and a containment check. How should you phrase the finding?", options: ["Separate observed facts, the supported assessment, actions taken, and what remains unknown", "State a person's identity without evidence", "Claim data theft from the port number", "List commands without outcomes"], correctAnswer: 0, explanation: "An evidence-based report distinguishes observations, interpretation, response, verification, and uncertainty." }
];

export const EXPERT_PRETEST: Question[] = [
  { id: 1, question: "Several alerts appear close together. What should an analyst do first?", options: ["Build a timeline and compare independent evidence", "Assume one actor caused all alerts", "Delete the logs", "Block every address"], correctAnswer: 0, explanation: "A timeline tests whether events are related without assuming attribution." },
  { id: 2, question: "Events are close in time but have different source addresses. What is supported?", options: ["A relationship is possible but unconfirmed", "They are certainly the same actor", "One event is false", "The server is safe"], correctAnswer: 0, explanation: "Timing is useful, but differences require additional evidence." },
  { id: 3, question: "A request contains SQL syntax. What does that directly show?", options: ["The request pattern was attempted", "Data was stolen", "The sender is identified", "The query succeeded"], correctAnswer: 0, explanation: "A request is evidence of an attempt, not necessarily impact or identity." },
  { id: 4, question: "Why inspect a process's parent and executable path?", options: ["They add context about how and where it started", "They reveal the source IP", "They prove intent alone", "They show HTTP status"], correctAnswer: 0, explanation: "Process relationships and locations help assess suspicious behavior." },
  { id: 5, question: "A cron entry runs a script from /tmp. What is a sound conclusion?", options: ["Suspicious persistence evidence needs validation", "Cron is always malicious", "The attacker is identified", "The script definitely ran"], correctAnswer: 0, explanation: "Cron is legitimate, but an unexpected script path merits investigation." },
  { id: 6, question: "An unfamiliar SSH key is found. What may it indicate?", options: ["A possible route for persistent access", "A confirmed active session", "A known person's identity", "A disabled account"], correctAnswer: 0, explanation: "An unfamiliar key may enable access, but use and ownership need investigation." },
  { id: 7, question: "Why preserve evidence before eradication when feasible?", options: ["It supports scope and root-cause analysis", "It guarantees recovery", "It prevents every future attack", "It proves attribution"], correctAnswer: 0, explanation: "Evidence helps explain what happened and what remains affected." },
  { id: 8, question: "Which statement separates observation from inference?", options: ["Observation: log records failed logins; inference: the host may be targeted", "Observation: a named attacker caused it", "Inference: the log line exists", "They are interchangeable"], correctAnswer: 0, explanation: "Analysis distinguishes what evidence shows from what it suggests." },
  { id: 9, question: "What should guide containment scope?", options: ["Evidence, risk, and operational impact", "The shortest command", "The loudest alert", "Blocking all traffic"], correctAnswer: 0, explanation: "Containment should reduce risk while accounting for service impact." },
  { id: 10, question: "What makes an incident report useful?", options: ["Evidence, timeline, uncertainty, actions, and verification", "Only a command list", "Attribution without sources", "A screenshot alone"], correctAnswer: 0, explanation: "A useful report communicates findings and their limits." }
];

// NEW: Distinct Post-Test Questions
export const EXPERT_POSTTEST: Question[] = [
  { id: 1, question: "Failed SSH attempts, a later process, and a web request appear close together. What is the strongest conclusion?", options: ["They are suspicious; a shared actor remains unconfirmed", "One attacker definitely caused all events", "The web request proves the process is malicious", "No incident occurred"], correctAnswer: 0, explanation: "The sequence supports a hypothesis, but not attribution by itself." },
  { id: 2, question: "Why state uncertainty in an incident report?", options: ["It separates supported findings from open questions", "It makes evidence unnecessary", "It proves an alert is false", "It reduces accuracy"], correctAnswer: 0, explanation: "Clear uncertainty keeps hypotheses from being presented as facts." },
  { id: 3, question: "A process is absent after termination. What does that verify?", options: ["It is not currently listed as running", "All persistence is removed", "No data was accessed", "The source is identified"], correctAnswer: 0, explanation: "One check verifies a specific state, not all recovery outcomes." },
  { id: 4, question: "A blocked address disappears from active connections. What still needs review?", options: ["Other indicators and persistence mechanisms", "Nothing; everything is resolved", "The user's identity", "Whether the request happened"], correctAnswer: 0, explanation: "Containment is one phase; broader checks are still needed." },
  { id: 5, question: "Why compare timestamps across log, process, and network evidence?", options: ["To form and test a possible sequence", "To prove common causation", "To identify a person from an IP", "To replace evidence collection"], correctAnswer: 0, explanation: "A timeline helps with correlation but does not prove causation." },
  { id: 6, question: "Which finding suggests a possible persistence path?", options: ["An unfamiliar key and scheduled script outside the baseline", "A normal SSH service", "One failed login", "An expected web port"], correctAnswer: 0, explanation: "Unexpected access mechanisms and tasks may enable return access." },
  { id: 7, question: "Why does HTTP 200 not prove a SQL injection succeeded?", options: ["It records an HTTP response, not database impact", "200 always means blocked", "Logs are not evidence", "SQL cannot appear in requests"], correctAnswer: 0, explanation: "Additional application or database evidence is needed to assess impact." },
  { id: 8, question: "Which action best balances evidence and containment?", options: ["Record relevant details, apply scoped containment, then verify", "Delete every suspicious file immediately", "Shut down all systems without assessment", "Wait without documenting"], correctAnswer: 0, explanation: "A measured response preserves evidence while limiting ongoing risk." },
  { id: 9, question: "What is eradication intended to do after containment?", options: ["Remove the confirmed cause or persistence mechanism", "Prove attribution", "Replace the timeline", "Close all ports"], correctAnswer: 0, explanation: "Eradication addresses the cause after limiting ongoing activity." },
  { id: 10, question: "What belongs in a final response summary?", options: ["Scope, timeline, evidence, actions, verification, and uncertainty", "Only the final command", "Only a threat label", "A claim every risk is gone"], correctAnswer: 0, explanation: "A clear report includes what is known, done, verified, and still open." }
];

const balanceAnswerPositions = (questions: Question[]): Question[] => {
  const positions = [2, 0, 3, 1, 1, 3, 0, 2, 3, 1];
  return questions.map((question, index) => {
    const options = [...question.options];
    const targetPosition = positions[index % positions.length] % options.length;
    const [correctOption] = options.splice(question.correctAnswer, 1);
    options.splice(targetPosition, 0, correctOption);
    return { ...question, options, correctAnswer: targetPosition };
  });
};

export const TIERS: TierConfig[] = [
  { id: 'BEGINNER', levels: [{ id: 'b1', title: 'System and Network Foundations', description: 'Navigate the simulated system, read basic evidence, and learn what hosts, addresses, ports, and services represent. Standalone practice missions are optional.' }], preTest: balanceAnswerPositions(BEGINNER_PRETEST), postTest: balanceAnswerPositions(BEGINNER_POSTTEST) },
  { id: 'INTERMEDIATE', levels: [{ id: 'i1', title: 'Evidence and Containment', description: 'Start with three short untimed bridge lessons on processes, service baselines, and web logs. Then inspect certification cases, take scoped response actions, and verify their effects.' }], preTest: balanceAnswerPositions(INTERMEDIATE_PRETEST), postTest: balanceAnswerPositions(INTERMEDIATE_POSTTEST) },
  { id: 'EXPERT', levels: [{ id: 'e1', title: 'Incident Correlation and Response', description: 'Build a timeline from mixed evidence, communicate uncertainty, investigate persistence, and plan a verified response.' }], preTest: balanceAnswerPositions(EXPERT_PRETEST), postTest: balanceAnswerPositions(EXPERT_POSTTEST) },
];

export const CHEAT_SHEET = [
  { category: "Navigation", commands: [{ cmd: "pwd", desc: "Prints your current directory path" }, { cmd: "ls", desc: "Lists files and folders" }, { cmd: "cd [dir]", desc: "Changes into a directory" }] },
  { category: "Evidence", commands: [{ cmd: "cat [file]", desc: "Displays a simulated text file" }, { cmd: "grep [pattern] [file]", desc: "Searches simulated file text; add -i, -n, --ip, --after, or --before filters" }, { cmd: "journalctl [--since TIME] [--until TIME] [-u ssh]", desc: "Filters the sample service journal by time and service" }, { cmd: "find [path] -name [file]", desc: "Searches for a simulated file by name" }, { cmd: "stat [file]", desc: "Shows simulated file metadata" }, { cmd: "preserve [source]", desc: "Records a simulated evidence note before response" }, { cmd: "record-evidence [source] [observation]", desc: "Records an observation separately from interpretation" }, { cmd: "assess [low|medium|high] [finding]", desc: "Records a confidence-rated assessment" }] },
  { category: "Network", commands: [{ cmd: "status", desc: "Shows the simulated host and network state" }, { cmd: "ping [host]", desc: "Checks simulated reachability" }, { cmd: "nmap [IP]", desc: "Shows simulated ports and services; does not scan a real host" }, { cmd: "ss -tuln", desc: "Lists simulated listening services" }, { cmd: "netstat -tuln", desc: "Lists simulated listening services" }, { cmd: "block [IP]", desc: "Simulates containing one source address" }, { cmd: "disable-service [port]", desc: "Simulates disabling one training listener" }] },
  { category: "System and Findings", commands: [{ cmd: "whoami", desc: "Shows the current simulated user" }, { cmd: "ps aux", desc: "Lists simulated running processes" }, { cmd: "ps -p [PID]", desc: "Shows details for one simulated process" }, { cmd: "kill [PID]", desc: "Simulates stopping a process" }, { cmd: "crontab -l", desc: "Lists simulated scheduled tasks" }, { cmd: "report [finding]", desc: "Records a short evidence-based finding" }] }
];

export const TERMINAL_HELP_TEXT = `AVAILABLE TRAINING COMMANDS

Navigation
  pwd                     Show your current folder
  ls [folder]             List files and folders
  cd [folder]             Move to a folder
  cat [file]              Read a text file

System
  whoami                  Show the current training account
  ps aux                  List simulated running programs
  ps -p [PID]             Inspect one program

Network
  status                  Review simulated network status
  ping [host]             Check whether a host responds
  nmap [host]             Review simulated ports and services
  netstat -tuln           List simulated listening services
  block [IP]              Contain a simulated network address

Analysis and response
  grep [-i] [-n] [word] [file]  Search a simulated text file
  grep --ip [IP] [file]  Filter records by source address
  grep --after/--before HH:MM:SS [file] Filter records by time
  journalctl [--since T] [--until T] [-u ssh] Review sample service events
  ss -tuln               List simulated listening sockets
  find [path] -name [file] Search for a named file
  stat [file]            Review simulated file owner, mode, and time
  preserve [source]      Record evidence before a response action
  record-evidence [source] [fact] Record an observation in case notes
  assess [low|medium|high] [finding] Record a confidence-rated assessment
  crontab -l              Review scheduled tasks
  kill [PID]              Stop a simulated program
  disable-service [port] Disable a simulated service
  remove-persistence [cron|ssh-key]
  report [finding]        Record a short finding
  inspect [clue]          Inspect a clue on the investigation board
Evidence decision box   Select an option when the mission asks you to choose a target or conclusion

TRAINING-ONLY COMMANDS: block, disable-service, preserve, record-evidence, assess, remove-persistence, report, and inspect are simplified game actions. grep --ip/--after/--before are custom filters in this simulation.
Real work uses authorized firewall or service-management tools, evidence-handling and case-management procedures, and the documented filters in grep or a log-analysis platform.

Use the command that fits your current objective. All hosts, files, commands, and response actions are simulated; nothing contacts or changes a real system.`;

export const MOCK_FILE_SYSTEM: Record<string, string[]> = { 
  '/': ['home', 'var'], 
  '/home': ['operator'], 
  '/home/operator': ['notes.txt', 'practice'],
  '/home/operator/practice': ['activity.txt'],
  '/var': ['log', 'log/apache2'], 
  '/var/log': ['auth.log', 'syslog', 'access.log'],
  '/var/log/apache2': ['access.log'],
  '/etc/training': ['approved-services.txt']
};

export const MOCK_FILES: Record<string, string> = { 
  '/home/operator/notes.txt': 'Check port 22.', 
  '/home/operator/practice/activity.txt': '09:10 INFO scheduled training check started\n09:11 WARNING unknown file requested review\n09:12 INFO training check completed',
  '/var/log/auth.log': `Oct 08 03:17:02 sandbox sshd[1812]: Failed password for operator from 192.168.1.20
Oct 08 03:17:18 sandbox sshd[1818]: Accepted publickey for operator from 192.168.1.20
Oct 08 03:18:02 sandbox sshd[1801]: Accepted publickey for deploy from 192.168.1.20
Oct 08 03:21:11 sandbox sshd[1842]: Failed password for root from 198.51.100.23
Oct 08 03:21:14 sandbox sshd[1845]: Failed password for root from 198.51.100.23
Oct 08 03:21:17 sandbox sshd[1848]: Failed password for root from 198.51.100.23
Oct 08 03:24:03 sandbox sshd[1858]: Accepted password for root from 198.51.100.23
Oct 08 03:24:06 sandbox sshd[1860]: Accepted publickey for operator from 192.168.1.50`,
  '/var/log/syslog': `Oct 08 03:22:02 sandbox systemd[1]: ssh.service started
Oct 08 03:23:17 sandbox sshd[1848]: authentication failures from 198.51.100.23: 3 attempts in 6 seconds
Oct 08 03:26:03 sandbox sshd[1858]: new root session opened from 198.51.100.23
Oct 08 03:26:08 sandbox sudo[1862]: root command session started
Oct 08 03:27:00 sandbox syslog[1]: clock offset approximately +00:02:00; compare event sequence with host logs
Oct 08 03:28:10 sandbox apache[1882]: access-log rotation gap recorded for 03:22-03:24; some requests may be unavailable
Oct 08 03:28:40 sandbox systemd[1]: scheduled backup completed successfully`,
  '/var/log/access.log': `192.168.1.20 - - [08/Oct/2026:03:20:05] "GET /health HTTP/1.1" 200
198.51.100.23 - - [08/Oct/2026:03:25:11] "GET /admin HTTP/1.1" 403
198.51.100.23 - - [08/Oct/2026:03:25:18] "GET /admin/config HTTP/1.1" 404
192.168.1.20 - - [08/Oct/2026:03:26:01] "GET /status HTTP/1.1" 200`,
  '/var/log/apache2/access.log': `192.168.1.20 - - [08/Oct/2026:03:20:05] "GET /health HTTP/1.1" 200
203.0.113.77 - - [08/Oct/2026:03:31:42] "GET /index.php?id=1 UNION SELECT username,password FROM users HTTP/1.1" 200
203.0.113.77 - - [08/Oct/2026:03:31:45] "GET /index.php?id=1 UNION SELECT email FROM customers HTTP/1.1" 200
192.168.1.20 - - [08/Oct/2026:03:34:01] "GET /status HTTP/1.1" 200`,
  '/etc/training/approved-services.txt': 'TCP 22 ssh · approved remote administration\nTCP 443 https · approved secure web service',
  '/var/log/apache2/bridge-access.log': '192.0.2.24 - - [23/Oct/2026:10:02:11] "GET /health HTTP/1.1" 200\n203.0.113.44 - - [23/Oct/2026:10:03:08] "GET /.env HTTP/1.1" 404'
};

export const EASTER_EGGS: Record<string, string> = { 'sl': '🚂 Choo choo!' };
