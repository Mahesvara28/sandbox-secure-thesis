export type ActivityKind = 'phish' | 'command-match' | 'alert-triage' | 'password-lab' | 'decoder' | 'timeline' | 'file-finding';

export interface PhishingEmail {
  sender: string;
  subject: string;
  body: string;
}

export interface ActivityRound {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  emailPair?: [PhishingEmail, PhishingEmail];
  fileCase?: {
    folders: string[];
    files: { id: string; folder: string; name: string; modified: string; contents: string }[];
    targetFileId: string;
  };
}

export interface ActivityDefinition {
  id: string;
  kind: ActivityKind;
  title: string;
  intro: string;
  deck: string;
  rounds: ActivityRound[];
}

const make = (id: string, kind: ActivityKind, title: string, intro: string, rounds: ActivityRound[], deck = 'BEGINNER'): ActivityDefinition => ({ id, kind, title, intro, deck, rounds });

export const ACTIVITY_CATALOG: Record<string, ActivityDefinition> = {
  'evidence-locker-beginner': make('evidence-locker-beginner', 'file-finding', 'Evidence Locker', 'Search a fictional training workspace, inspect the files, and collect the record that best supports the case. You can open files or drag one into the evidence tray. No real files are accessed.', [
    {
      prompt: 'Nova found a small evidence bundle from the library workstation. Find the record that mentions the 3:12 AM account activity, then collect it. A recorded attempt is evidence of an attempt; it does not identify a person or prove access.',
      options: [], answer: 1,
      explanation: 'The authentication note records a denied attempt for temp_vendor at 3:12 AM. It supports further investigation, but does not establish who was at the keyboard or that anyone accessed data.',
      fileCase: {
        folders: ['/case-files', '/case-files/library', '/case-files/library/notes'],
        targetFileId: 'auth-review.txt',
        files: [
          { id: 'shift-note.txt', folder: '/case-files/library/notes', name: 'shift-note.txt', modified: '02:55 AM', contents: 'Library desk opens at 08:00 AM. The evening shift ended at 6:10 PM. No staff member reported using the workstation overnight.' },
          { id: 'auth-review.txt', folder: '/case-files/library', name: 'auth-review.txt', modified: '03:18 AM', contents: '03:12:04 AM · account=temp_vendor · result=denied · source=203.0.113.44\nTraining note: this record shows a failed sign-in attempt only. It does not identify the person behind the source address.' },
          { id: 'printer-status.txt', folder: '/case-files/library', name: 'printer-status.txt', modified: '03:14 AM', contents: 'Library printer queue: idle. Last scheduled status check completed normally.' },
          { id: 'readme.txt', folder: '/case-files', name: 'readme.txt', modified: '09:00 AM', contents: 'Harborview training bundle. All names, times, and addresses are fictional examples.' },
          { id: 'backup-summary.txt', folder: '/case-files', name: 'backup-summary.txt', modified: '03:10 AM', contents: 'Routine backup check completed on schedule. No unexpected changes were reported.' }
        ]
      }
    }
  ]),
  'spot-the-phish-beginner': make('spot-the-phish-beginner', 'phish', 'Spot the Phish', 'Compare each pair of fictional emails. One fits the expected context; the other has a warning sign. Select the suspicious email, then compare the details.', [
    { prompt: 'Both messages claim to be from Harborview IT about the same account check.', options: [], answer: 1, explanation: 'The suspicious message creates urgent pressure and sends the reader to an unfamiliar sign-in address. Open the school portal directly or ask IT through a known channel.', emailPair: [
      { sender: 'it-notices@harborview.example.invalid', subject: 'Account review this week', body: 'Please review the account notice in the school portal when convenient. IT will never ask for your password by email.' },
      { sender: 'it-notlces@harborview-help.example.invalid', subject: 'Action required: account closes in 10 minutes', body: 'Sign in now at harborview-verify.example.invalid or your account will be disabled.' }
    ] },
    { prompt: 'Both messages announce a change to library opening hours.', options: [], answer: 0, explanation: 'The suspicious message uses a lookalike sender and an unexpected attachment. Check the library portal or contact the desk directly.', emailPair: [
      { sender: 'librery@harborview.example.invalid', subject: 'Updated library hours — open schedule', body: 'Open the attached schedule viewer and sign in to confirm you have read the change.' },
      { sender: 'library@harborview.example.invalid', subject: 'Updated library hours', body: 'The new schedule is posted on the library portal. No action is needed in your account.' }
    ] },
    { prompt: 'Both messages refer to a shared class document.', options: [], answer: 1, explanation: 'A real class-platform notice links to the service the class normally uses. The suspicious one asks for a password by email, which support should not request.', emailPair: [
      { sender: 'classroom@harborview.example.invalid', subject: 'Science project document shared', body: 'A classmate shared “Project outline.” Open the class platform you normally use to view it.' },
      { sender: 'classroom-help@harborview.example.invalid', subject: 'Document access problem', body: 'Reply with your account password so we can restore access to the shared project.' }
    ] },
    { prompt: 'Both messages claim to be delivery updates for a package.', options: [], answer: 0, explanation: 'The suspicious message asks for an unexpected fee through an unfamiliar payment link. Check the order using the delivery company’s official app or website.', emailPair: [
      { sender: 'parcel-fees@parcel-pay.example.invalid', subject: 'Small fee due to release your package', body: 'Pay 25 pesos now at parcel-release.example.invalid. This notice was sent even if you did not place an order.' },
      { sender: 'updates@parcel.example.invalid', subject: 'Delivery attempt recorded', body: 'A delivery attempt was recorded. View the status in the delivery app where you placed the order.' }
    ] },
    { prompt: 'Both messages say a teacher has shared a lesson file.', options: [], answer: 1, explanation: 'The suspicious message pressures the reader to open an unexpected file and uses a sender address with a misspelled school name. Verify with the teacher through the class platform.', emailPair: [
      { sender: 'teacher.mlim@harborview.example.invalid', subject: 'Reading guide for tomorrow', body: 'The reading guide is available in the usual class folder. We will discuss it during class.' },
      { sender: 'teacher.mlim@harborvlew.example.invalid', subject: 'Open now: important reading guide', body: 'Enable the attached document immediately to avoid missing your participation credit.' }
    ] },
    { prompt: 'Both messages ask the recipient to review a sign-in notification.', options: [], answer: 0, explanation: 'The suspicious message asks the recipient to approve a sign-in they did not start. Never approve an unexpected prompt; report it and check account activity using the official service.', emailPair: [
      { sender: 'security-check@school-accounts.example.invalid', subject: 'Approve this sign-in to protect your account', body: 'Tap Approve now. If you ignore this request, access to your mailbox may be removed.' },
      { sender: 'security@school-accounts.example.invalid', subject: 'New sign-in notice', body: 'If this was not you, open the account security page directly and review recent activity. Do not approve requests you did not start.' }
    ] }
  ]),
  'command-match-beginner': make('command-match-beginner', 'command-match', 'Command Match', 'Choose the purpose that best matches each simulated command. These commands run only in the training terminal.', [
    { prompt: 'pwd', options: ['Show the current directory', 'List directory contents', 'Search text in files'], answer: 0, explanation: 'pwd prints the current working directory.' },
    { prompt: 'ls', options: ['Show the current account', 'List directory contents', 'Change directory'], answer: 1, explanation: 'ls lists files and folders in the current directory.' },
    { prompt: 'cd', options: ['Change directory', 'Read a file', 'Show network connections'], answer: 0, explanation: 'cd changes your location in the simulated filesystem.' },
    { prompt: 'cat', options: ['Read a file', 'Stop a process', 'Show the current account'], answer: 0, explanation: 'cat prints a file’s contents; inspect evidence before drawing conclusions.' },
    { prompt: 'grep', options: ['Search text for a match', 'List running processes', 'Change directory'], answer: 0, explanation: 'grep searches text for matching patterns.' },
    { prompt: 'whoami', options: ['Show the current account', 'List files', 'Test a network host'], answer: 0, explanation: 'whoami identifies the current simulated account.' }
  ]),
  'command-match-intermediate': make('command-match-intermediate', 'command-match', 'Command Match', 'Match each command to its purpose. Response commands are simulated and should be scoped to approved evidence.', [
    { prompt: 'ps aux', options: ['List running processes', 'List listening services', 'Read file metadata'], answer: 0, explanation: 'ps aux lists processes. Compare PID, owner, and path; resource use alone does not prove harm.' },
    { prompt: 'ss -tuln', options: ['List listening network sockets', 'Stop one process', 'Search file contents'], answer: 0, explanation: 'ss -tuln shows simulated listening sockets and ports.' },
    { prompt: 'kill 2214', options: ['Stop the process with PID 2214', 'Block an IP address', 'Read a service journal'], answer: 0, explanation: 'In this training simulation, kill stops the selected process. Preserve evidence and confirm scope first.' },
    { prompt: 'block 203.0.113.44', options: ['Simulate blocking one source address', 'Disable all network services', 'Search for a file'], answer: 0, explanation: 'block is a game-specific simulated action, not a standard shell command. It represents scoped containment.' },
    { prompt: 'stat suspicious.txt', options: ['Show file metadata', 'Print file contents', 'Show listening ports'], answer: 0, explanation: 'stat displays simulated metadata such as size and timestamps; metadata alone does not identify an author.' },
    { prompt: 'grep -in failed auth.log', options: ['Search case-insensitively and show line numbers', 'Delete matching lines', 'Show network routes'], answer: 0, explanation: 'grep -i ignores letter case and -n includes matching line numbers.' }
  ], 'INTERMEDIATE'),
  'command-match-expert': make('command-match-expert', 'command-match', 'Command Match', 'Review evidence and persistence tools. Game-specific evidence actions are clearly labeled as simulated.', [
    { prompt: 'journalctl -u ssh --since today', options: ['Filter the service journal by unit and time', 'List scheduled tasks', 'Show file ownership only'], answer: 0, explanation: 'journalctl reads service journal records and can filter by service and time.' },
    { prompt: 'find /var/log -name "*.log"', options: ['Search for matching files', 'Search inside file contents', 'Stop a process'], answer: 0, explanation: 'find locates paths matching criteria. It does not interpret those files.' },
    { prompt: 'crontab -l', options: ['List the current user’s scheduled jobs', 'Run every scheduled job now', 'List network listeners'], answer: 0, explanation: 'crontab -l displays scheduled jobs for the current user; it does not prove a job ran.' },
    { prompt: 'preserve auth.log', options: ['Record evidence handling in this simulation', 'Delete the log', 'Block its source address'], answer: 0, explanation: 'preserve is a game-specific action, not a standard shell command.' },
    { prompt: 'record-evidence auth.log repeated-failures', options: ['Record an observation separately from interpretation', 'Claim an attacker was identified', 'Change the file timestamp'], answer: 0, explanation: 'record-evidence is a simulation command for noting observations without overstating conclusions.' },
    { prompt: 'assess medium repeated-failures', options: ['Record a confidence-rated assessment', 'Disable every account', 'Decode Base64'], answer: 0, explanation: 'assess is a game-specific simulated action for recording confidence and a finding.' }
  ], 'EXPERT'),
  'alert-triage-beginner': make('alert-triage-beginner', 'alert-triage', 'Alert Triage', 'Prioritize each alert using only the evidence shown. A signal can justify investigation without proving impact.', [
    { prompt: 'Several failed sign-ins for one account, followed by a successful sign-in from a new location.', options: ['Investigate now', 'Monitor', 'Benign'], answer: 0, explanation: 'The sequence raises concern and warrants prompt correlation with user and access records.' },
    { prompt: 'A scheduled backup completed on its documented host at its usual time.', options: ['Investigate now', 'Monitor', 'Benign'], answer: 2, explanation: 'The activity matches the approved schedule and baseline.' },
    { prompt: 'One failed login from a shared campus network; no other unusual events are available.', options: ['Investigate now', 'Monitor', 'Benign'], answer: 1, explanation: 'A single failure is weak evidence. Check for repetition and related activity.' },
    { prompt: 'A web server returns 404 for a request to a sensitive-looking path. No successful access is recorded.', options: ['Investigate now', 'Monitor', 'Benign'], answer: 1, explanation: 'The request is worth checking, but 404 means the requested resource was not found in this record.' },
    { prompt: 'An unfamiliar remote service is listening, while the approved service baseline is not yet available.', options: ['Investigate now', 'Monitor', 'Benign'], answer: 0, explanation: 'Compare ownership and configuration with an approved baseline before taking action.' },
    { prompt: 'A user reports a suspicious message, but no link click or account activity is confirmed.', options: ['Investigate now', 'Monitor', 'Benign'], answer: 1, explanation: 'Preserve the message and check for follow-on activity; do not assume compromise.' }
  ]),
  'alert-triage-intermediate': make('alert-triage-intermediate', 'alert-triage', 'Alert Triage', 'Use process, service, and log context to choose a proportionate next step.', [
    { prompt: 'A high-CPU backup process matches the approved owner, path, and schedule.', options: ['Investigate now', 'Monitor', 'Benign'], answer: 2, explanation: 'The available context matches the baseline. Record it as expected and keep monitoring.' },
    { prompt: 'An unfamiliar listener is absent from the service baseline, but no connection log is available.', options: ['Investigate now', 'Monitor', 'Benign'], answer: 0, explanation: 'Validate the service owner and change record. A listener is an observation, not proof of access.' },
    { prompt: 'A single failed login appears from a shared campus gateway with no other signals.', options: ['Investigate now', 'Monitor', 'Benign'], answer: 1, explanation: 'Shared addresses and one failure are inconclusive. Check for repetition and correlated events.' },
    { prompt: 'A request for a hidden configuration path returned HTTP 404.', options: ['Investigate now', 'Monitor', 'Benign'], answer: 1, explanation: 'The request merits review, but the recorded response did not find that path.' },
    { prompt: 'Repeated failures for one account are followed by a successful sign-in outside its normal pattern.', options: ['Investigate now', 'Monitor', 'Benign'], answer: 0, explanation: 'The sequence warrants prompt correlation with authentication and user activity records.' },
    { prompt: 'An approved patch service listens on its documented port during a maintenance window.', options: ['Investigate now', 'Monitor', 'Benign'], answer: 2, explanation: 'The service, port, and timing match the approved change record.' }
  ], 'INTERMEDIATE'),
  'build-timeline-intermediate': make('build-timeline-intermediate', 'timeline', 'Build the Timeline', 'Put fictional incident records in a defensible sequence. Account for clock differences, and remember that sequence alone does not prove cause.', [
    { prompt: 'The account log records a failed sign-in at 03:12:04. Which event is recorded first?', options: ['A web request at 03:12:10', 'A process starts at 03:12:18', 'A service check at 03:13:02'], answer: 0, explanation: 'The web request at 03:12:10 is the next timestamp after 03:12:04. Keep the record source attached to each time.' },
    { prompt: 'After the 03:12:10 web request, which event comes next?', options: ['A process starts at 03:12:18', 'An account review at 03:12:08', 'A service check at 03:13:02'], answer: 0, explanation: '03:12:18 follows 03:12:10. The account review at 03:12:08 happened earlier.' },
    { prompt: 'A host clock is 2 minutes fast. Its event is logged at 03:15:00. What corrected time should the timeline use?', options: ['03:13:00', '03:17:00', '03:15:00'], answer: 0, explanation: 'A clock that is two minutes fast shows a time two minutes later than the reference; subtract two minutes.' },
    { prompt: 'The account log says 03:12:04, while a host known to be 2 minutes fast records 03:14:10. What is the corrected host time?', options: ['03:12:10', '03:16:10', '03:14:10'], answer: 0, explanation: 'Subtract the documented two-minute clock offset. The corrected event is 03:12:10.' },
    { prompt: 'The corrected times are close together. What can you conclude from timing alone?', options: ['The events may be related; timing alone does not prove cause or a shared actor', 'The first event definitely caused the second', 'The same person definitely performed both events'], answer: 0, explanation: 'A timeline helps identify possible relationships. Corroborating evidence is needed to support causation or attribution.' },
    { prompt: 'One record has no timezone and its host clock offset is unknown. What is the careful next step?', options: ['Mark its time as uncertain and seek clock/source context', 'Place it exactly between the other records', 'Discard it as false'], answer: 0, explanation: 'Do not invent precision. Record the limitation and look for timezone or clock-synchronization context.' }
  ], 'INTERMEDIATE'),
  'alert-triage-expert': make('alert-triage-expert', 'alert-triage', 'Alert Triage', 'Prioritize mixed evidence. Keep correlation, attribution, and impact as separate claims.', [
    { prompt: 'Clock-corrected SSH failures and a later process share a time window, but source attribution is incomplete.', options: ['Investigate now', 'Monitor', 'Benign'], answer: 0, explanation: 'Correlate independent records, preserve them, and state that a shared actor is not established.' },
    { prompt: 'An unfamiliar scheduled task has no approved owner, but there is no execution record yet.', options: ['Investigate now', 'Monitor', 'Benign'], answer: 0, explanation: 'Compare task details with the baseline and execution logs before claiming it ran.' },
    { prompt: 'A known backup task completed at its documented time and its output matches the expected record.', options: ['Investigate now', 'Monitor', 'Benign'], answer: 2, explanation: 'Current evidence supports expected activity; keep the record for the incident timeline.' },
    { prompt: 'Two records have nearby timestamps, but one host clock is known to be four minutes fast.', options: ['Investigate now', 'Monitor', 'Benign'], answer: 1, explanation: 'Normalize the timestamp before drawing a sequence; clock proximity alone does not show causation.' },
    { prompt: 'A suspicious request returned 200, but application logs show no account change and data access is unverified.', options: ['Investigate now', 'Monitor', 'Benign'], answer: 0, explanation: 'Review application evidence. HTTP 200 is a response status, not proof of the requested impact.' },
    { prompt: 'A shared IP appears in approved and unusual events, with no user-level attribution.', options: ['Investigate now', 'Monitor', 'Benign'], answer: 1, explanation: 'A shared address does not identify a person. Seek account-level or endpoint evidence.' }
  ], 'EXPERT'),
  'password-lab-beginner': make('password-lab-beginner', 'password-lab', 'Password Lab', 'Try a fictional password to learn what affects strength. It is evaluated locally, is never saved, and must not be a real password.', [
    { prompt: 'Try a fictional password. Avoid names, dictionary words, and predictable substitutions.', options: [], answer: 0, explanation: 'Longer, unique passphrases are generally harder to guess. Use a password manager for real accounts.' }
  ]),
  'decoder-desk-beginner': make('decoder-desk-beginner', 'decoder', 'Decoder Desk', 'Decode harmless training strings. Encoding is not encryption and does not prove that content is trustworthy.', [
    { prompt: 'Caesar shift +1: “dbu” (each letter was moved one step forward). Decode it.', options: ['cat', 'dog', 'cab'], answer: 0, explanation: 'Move each letter one step backward: d→c, b→a, u→t.' },
    { prompt: 'Base64 text “SGk=” decodes to which greeting?', options: ['Hi', 'OK', 'No'], answer: 0, explanation: 'Base64 represents bytes as text; it does not encrypt or authenticate the message.' },
    { prompt: 'URL-encoded text “hello%20world” contains which phrase?', options: ['hello world', 'hello+world', 'hello/world'], answer: 0, explanation: '%20 represents a space in URL encoding.' },
    { prompt: 'Caesar shift +2: “jgnnq” (letters moved two steps forward). Decode it.', options: ['hello', 'world', 'jello'], answer: 0, explanation: 'Move each letter two steps backward to get “hello”.' },
    { prompt: 'URL-encoded “%2Flogs%2Fapp” decodes to which path?', options: ['/logs/app', 'logs app', '//logs//app'], answer: 0, explanation: '%2F represents the slash character.' },
    { prompt: 'Base64 text “T0s=” decodes to which response?', options: ['OK', 'NO', 'UP'], answer: 0, explanation: 'The decoded text is “OK”. Always treat decoded data as untrusted input.' }
  ]),
  'decoder-desk-intermediate': make('decoder-desk-intermediate', 'decoder', 'Decoder Desk', 'Decode harmless URL and Base64 values from fictional records. Decoding does not prove access or authenticity.', [
    { prompt: 'URL value “%2Fadmin%2Fstatus” decodes to which path?', options: ['/admin/status', 'admin status', '//admin//status'], answer: 0, explanation: '%2F represents a slash. Decoding does not show that the path was accessed.' },
    { prompt: 'Base64 “c3RhdHVzOjQwNA==” decodes to which record?', options: ['status:404', 'status:200', 'user:admin'], answer: 0, explanation: 'The harmless text is “status:404”. Base64 is encoding, not encryption.' },
    { prompt: 'URL value “user%3Dguest%26role%3Dreader” decodes to which text?', options: ['user=guest&role=reader', 'user:guest role:reader', 'user guest role reader'], answer: 0, explanation: '%3D and %26 represent equals and ampersand.' },
    { prompt: 'Base64 “aG9zdD1saWJyYXJ5LTAy” decodes to which host note?', options: ['host=library-02', 'host=library-20', 'user=library-02'], answer: 0, explanation: 'The decoded note is “host=library-02”; treat decoded content as untrusted evidence.' },
    { prompt: 'URL value “%3Fsource%3Dmail” begins with what query text?', options: ['?source=mail', '&source=mail', '/source/mail'], answer: 0, explanation: '%3F represents a question mark and %3D represents equals.' },
    { prompt: 'A decoded message says “approved”. Does that prove the message is authentic?', options: ['No; encoding does not prove source or integrity', 'Yes; Base64 confirms the sender', 'Yes; URL encoding encrypts it'], answer: 0, explanation: 'Decoding reveals a representation. Verify origin and integrity using independent evidence.' }
  ], 'INTERMEDIATE'),
  'decoder-desk-expert': make('decoder-desk-expert', 'decoder', 'Decoder Desk', 'Decode a fictional note from the evidence bundle. Use it as a lead, then verify it against the records.', [
    { prompt: 'Hidden note: Base64 “dGVtcF92ZW5kb3I=” decodes to which account name?', options: ['temp_vendor', 'temp_viewer', 'test_vendor'], answer: 0, explanation: 'It decodes to “temp_vendor”. A note is a lead; verify it against account records.' },
    { prompt: 'URL-encoded “%2Fhome%2Ftemp_vendor%2F.cache” becomes which path?', options: ['/home/temp_vendor/.cache', 'home temp_vendor cache', '//home//temp_vendor'], answer: 0, explanation: '%2F becomes a slash. Compare the path with file and process evidence.' },
    { prompt: 'Base64 “c2NoZWR1bGVkIHRhc2s=” decodes to what clue?', options: ['scheduled task', 'shared target', 'service status'], answer: 0, explanation: 'The text decodes to “scheduled task”. It does not prove a task exists or ran.' },
    { prompt: 'URL-encoded “%74%65%6D%70%5F%76%65%6E%64%6F%72” decodes to what?', options: ['temp_vendor', 'temp_viewer', 'team_vendor'], answer: 0, explanation: 'The percent values spell “temp_vendor”. Validate against the account inventory.' },
    { prompt: 'A decoded note and a log mention the same account. What is the strongest conclusion?', options: ['The records support a lead; actor and impact need validation', 'The note proves who used the account', 'The log proves data theft'], answer: 0, explanation: 'Matching clues support investigation but do not by themselves prove identity or impact.' },
    { prompt: 'The decoded note is Base64. Which statement is accurate?', options: ['It is encoded, not encrypted or authenticated', 'It needs a secret key to read', 'It proves the note was not changed'], answer: 0, explanation: 'Base64 is reversible encoding and provides no confidentiality or integrity guarantee.' }
  ], 'EXPERT')
};

export const ACTIVITY_REWARD_XP = 15;
export const ACTIVITY_REWARD_COINS = 10;
