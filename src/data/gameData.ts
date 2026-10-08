import type { Question } from '../components/QuizModule';

export type Tier = 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';

export interface LevelData { id: string; title: string; description: string; }
export interface TierConfig { id: Tier; levels: LevelData[]; preTest: Question[]; postTest: Question[]; }

export interface Mission {
  id: string; title: string; tier: Tier; scenario: string; intro: string; timerLimit: number;
  logs: string[]; target: string; steps: { desc: string; cmd: string; hint: string }[];
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
    timerLimit: 300,
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
        desc: 'Enter the logs directory.',
        cmd: 'cd logs',
        hint: 'Use cd to move into another directory.'
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
    timerLimit: 360,
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
    timerLimit: 420,
    logs: [
      '[ALERT] Multiple failed SSH authentication attempts.',
      '[AUTH] Repeated failures detected.',
      '[SOURCE] 185.22.14.99'
    ],
    target: '185.22.14.99',
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
        hint: 'Use cat auth.log to inspect authentication events.'
      },
      {
        desc: 'Identify the source IP responsible for the repeated failures.',
        cmd: 'cat auth.log',
        hint: 'Look through the log output for repeated failed login attempts and their source IP.'
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
      commands: ['cd', 'ls', 'cat'],
      objective:
        'Analyze authentication events and identify the source of repeated failed login attempts.'
    },
    didYouKnow: [
      'A failed login is not automatically an attack. Analysts look for patterns and unusual frequency.',
      'SSH is commonly used for remote administration of Linux systems.',
      'A source IP identifies the network address associated with a connection, but does not automatically prove who was behind it.'
    ]
  },

  {
    id: 'm3',
    title: 'Operation: Suspicious Connection',
    tier: 'BEGINNER',
    scenario:
      'The authentication investigation identified a suspicious source. Network telemetry now shows that the same address may be communicating with the server.',
    intro:
      'HANDLER: Good work identifying the source. Now we move from authentication evidence to network evidence. Your job is to determine what the host is exposing.',
    timerLimit: 420,
    logs: [
      '[NET] Connection observed from 185.22.14.99.',
      '[NET] SSH traffic detected.',
      '[ALERT] Unexpected external host communicating with server.'
    ],
    target: '185.22.14.99',
    steps: [
      {
        desc: 'Check the current simulated network status.',
        cmd: 'status',
        hint: 'Use status to inspect the current network situation.'
      },
      {
        desc: 'Test connectivity to the suspicious host.',
        cmd: 'ping 185.22.14.99',
        hint: 'Use ping to test whether the simulated host responds.'
      },
      {
        desc: 'Perform a basic scan of the suspicious host.',
        cmd: 'nmap 185.22.14.99',
        hint: 'Use nmap followed by the target IP address.'
      },
      {
        desc: 'Review the scan result and identify the exposed service.',
        cmd: 'nmap 185.22.14.99',
        hint: 'Look for the open port associated with remote administration.'
      },
      {
        desc: 'Block the suspicious address after collecting the evidence.',
        cmd: 'block 185.22.14.99',
        hint: 'Use block followed by the suspicious IP address.'
      }
    ],
    realWorld:
      'Network reconnaissance helps defenders understand which services are exposed. In a real environment, defenders must verify the target and authorization before performing scans.',
    briefing: {
      concept: 'Basic Network Investigation and Containment',
      commands: ['status', 'ping', 'nmap [IP]', 'block [IP]'],
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
      'The server has been experiencing unusually high CPU usage. The security team suspects that an unauthorized program may be running in the background.',
    intro:
      'HANDLER: We have contained the suspicious network source, but something may already be running on the server. Now we investigate processes.',
    timerLimit: 480,
    logs: [
      '[SYSTEM] CPU utilization above normal threshold.',
      '[ALERT] Unusual process activity detected.',
      '[MONITOR] Process 2214 consuming excessive CPU.'
    ],
    target: '2214',
    steps: [
      {
        desc: 'List the currently running processes.',
        cmd: 'ps aux',
        hint: 'Use ps aux to view running processes.'
      },
      {
        desc: 'Identify the process using unusually high CPU.',
        cmd: 'ps aux',
        hint: 'Look for the process with abnormal CPU usage.'
      },
      {
        desc: 'Investigate the suspicious process ID.',
        cmd: 'ps -p 2214',
        hint: 'Use ps -p followed by the suspicious PID.'
      },
      {
        desc: 'Terminate the confirmed malicious process.',
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
      'During incident response, analysts examine processes for unusual names, locations, resource usage, and parent-child relationships. A suspicious process should be investigated before termination whenever possible.',
    briefing: {
      concept: 'Process Investigation and Malware Identification',
      commands: ['ps aux', 'ps -p [PID]', 'kill [PID]'],
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
    title: 'Operation: Contain the Breach',
    tier: 'INTERMEDIATE',
    scenario:
      'A suspicious process has been removed, but the system is still communicating with an unknown service. You must determine which network service is exposed and contain the threat.',
    intro:
      'HANDLER: Removing malware is only part of incident response. We need to understand the network exposure and prevent further communication.',
    timerLimit: 480,
    logs: [
      '[NET] Unexpected listening service detected.',
      '[NET] TCP port 4444 exposed.',
      '[ALERT] Unknown external communication associated with port 4444.'
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
        desc: 'Identify the unexpected listening port.',
        cmd: 'netstat -tuln',
        hint: 'Look for the port that does not belong to the normal services.'
      },
      {
        desc: 'Scan the local system to confirm the exposed service.',
        cmd: 'nmap localhost',
        hint: 'Use nmap localhost to perform a simulated local scan.'
      },
      {
        desc: 'Block the malicious network connection.',
        cmd: 'block 185.22.14.99',
        hint: 'Contain the known suspicious source after confirming the evidence.'
      },
      {
        desc: 'Check the network status again.',
        cmd: 'status',
        hint: 'Verify that the suspicious connection has been contained.'
      }
    ],
    realWorld:
      'Containment prevents a security incident from spreading or continuing while responders investigate the root cause. Network isolation and firewall rules are common containment techniques.',
    briefing: {
      concept: 'Network Exposure and Incident Containment',
      commands: ['status', 'netstat -tuln', 'nmap localhost', 'block [IP]'],
      objective:
        'Identify an unexpected network service and contain communication from the suspicious source.'
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
    timerLimit: 480,
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
        desc: 'Identify the type of attack represented by the request.',
        cmd: "grep 'UNION' access.log",
        hint: 'A UNION SELECT statement inside user-controlled input is a common SQL injection indicator.'
      },
      {
        desc: 'Return to your home directory.',
        cmd: 'cd ~',
        hint: 'Use cd ~ after completing the investigation.'
      }
    ],
    realWorld:
      'SQL injection occurs when untrusted input is interpreted as part of a database query. Defenders use parameterized queries, input validation, least privilege, and monitoring to reduce the risk.',
    briefing: {
      concept: 'Web Logs and SQL Injection Detection',
      commands: ['cd', 'ls', 'cat', 'grep'],
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
    timerLimit: 600,
    logs: [
      '[03:21] Failed SSH authentication from 185.22.14.99.',
      '[03:24] Connection detected from 185.22.14.99.',
      '[03:31] Suspicious web request detected.',
      '[03:32] Process 2214 begins abnormal activity.'
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
        desc: 'Inspect the system processes.',
        cmd: 'ps aux',
        hint: 'Look for abnormal processes that appeared after the authentication activity.'
      },
      {
        desc: 'Inspect current network activity.',
        cmd: 'netstat -tuln',
        hint: 'Look for unexpected listening services.'
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
        desc: 'Identify the likely attack chain.',
        cmd: 'cat access.log',
        hint: 'Connect the authentication, network, process, and web evidence into one timeline.'
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
      commands: ['cat', 'ps aux', 'netstat -tuln', 'cd'],
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
    timerLimit: 600,
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
        desc: 'Read the suspicious file location information.',
        cmd: 'find / -name cryptominer.exe',
        hint: 'Determine where the suspicious executable was placed.'
      },
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
      commands: ['ps aux', 'crontab -l', 'cat', 'find'],
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
      'The Sandbox Secure server has suffered a multi-stage intrusion. You must investigate the evidence, identify the attack, contain the threat, remove malicious activity, and verify that the system is stable.',
    intro:
      'HANDLER: Final operation. You are no longer following a checklist. Apply everything you learned and work the incident from detection to verification.',
    timerLimit: 900,
    logs: [
      '[03:21] Multiple failed SSH logins from 185.22.14.99.',
      '[03:24] Successful authentication event.',
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
        desc: 'Terminate the confirmed malicious process.',
        cmd: 'kill 2214',
        hint: 'Remove the malicious process after collecting the evidence.'
      },
      {
        desc: 'Contain the known suspicious source.',
        cmd: 'block 185.22.14.99',
        hint: 'Block the identified malicious IP.'
      },
      {
        desc: 'Verify the process is no longer active.',
        cmd: 'ps aux',
        hint: 'Confirm PID 2214 no longer appears.'
      },
      {
        desc: 'Verify the network is contained.',
        cmd: 'status',
        hint: 'Check the final network state.'
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
        'kill [PID]',
        'block [IP]',
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
  { id: 1, question: "Which command shows your CURRENT location?", options: ["ls", "pwd", "cd", "mkdir"], correctAnswer: 1, explanation: "pwd displays your current location." },
  { id: 2, question: "What does the 'ls' command do?", options: ["Creates a file", "Lists files", "Deletes files", "Changes directory"], correctAnswer: 1, explanation: "ls lists directory contents." },
  { id: 3, question: "To move INTO a directory called 'Docs', you type:", options: ["ls Docs", "mkdir Docs", "cd Docs", "rm Docs"], correctAnswer: 2, explanation: "cd changes directory." },
  { id: 4, question: "Which command displays file contents?", options: ["cat", "dog", "read", "show"], correctAnswer: 0, explanation: "cat reads and displays file contents." },
  { id: 5, question: "What does 'whoami' return?", options: ["Password", "Current username", "IP address", "Home directory"], correctAnswer: 1, explanation: "whoami displays the current username." },
  { id: 6, question: "To go BACK to the parent directory, you type:", options: ["cd ..", "cd back", "cd /", "cd ~"], correctAnswer: 0, explanation: "cd .. moves up one level." },
  { id: 7, question: "Which command creates a NEW directory?", options: ["touch", "mkdir", "newdir", "create"], correctAnswer: 1, explanation: "mkdir creates a new folder." },
  { id: 8, question: "What is the root directory symbol?", options: ["#", "/", "~", "*"], correctAnswer: 1, explanation: "/ represents the root directory." },
  { id: 9, question: "To see hidden files, you use:", options: ["ls -a", "ls -h", "ls -l", "ls -all"], correctAnswer: 0, explanation: "ls -a shows all files including hidden ones." },
  { id: 10, question: "Which key combination cancels a running command?", options: ["Ctrl + Z", "Ctrl + C", "Ctrl + X", "Alt + F4"], correctAnswer: 1, explanation: "Ctrl + C sends an interrupt signal." }
];

// NEW: Distinct Post-Test Questions
export const BEGINNER_POSTTEST: Question[] = [
  { id: 1, question: "You are lost in the filesystem. Which command tells you exactly where you are?", options: ["whereami", "pwd", "locate", "find ."], correctAnswer: 1, explanation: "pwd is the standard command to print working directory." },
  { id: 2, question: "What does 'cd ~' do?", options: ["Deletes home", "Goes to root", "Goes to home directory", "Creates home"], correctAnswer: 2, explanation: "cd ~ takes you to your home directory." },
  { id: 3, question: "To view a file called 'notes.txt', you type:", options: ["open notes.txt", "cat notes.txt", "view notes.txt", "read notes.txt"], correctAnswer: 1, explanation: "cat displays the contents of text files." },
  { id: 4, question: "Which command lists files with detailed info (size, date)?", options: ["ls -l", "ls -d", "ls -i", "ls -s"], correctAnswer: 0, explanation: "ls -l shows long format with permissions and dates." },
  { id: 5, question: "What does the tilde (~) symbol represent?", options: ["Root directory", "Current directory", "Home directory", "Parent directory"], correctAnswer: 2, explanation: "~ is a shortcut for the current user's home directory." },
  { id: 6, question: "To create an empty file called 'test.txt', you use:", options: ["mkdir test.txt", "touch test.txt", "new test.txt", "create test.txt"], correctAnswer: 1, explanation: "touch creates an empty file." },
  { id: 7, question: "What does 'cd -' do?", options: ["Goes to home", "Goes to previous directory", "Goes to root", "Deletes directory"], correctAnswer: 1, explanation: "cd - takes you back to the last directory you were in." },
  { id: 8, question: "Which command removes (deletes) a file?", options: ["del", "remove", "rm", "delete"], correctAnswer: 2, explanation: "rm (remove) deletes files." },
  { id: 9, question: "To copy a file, you use:", options: ["cp", "copy", "mv", "clone"], correctAnswer: 0, explanation: "cp (copy) duplicates files." },
  { id: 10, question: "What does 'clear' do in the terminal?", options: ["Deletes all files", "Clears the screen", "Exits terminal", "Resets password"], correctAnswer: 1, explanation: "clear removes previous commands from view." }
];

export const INTERMEDIATE_PRETEST: Question[] = [
  { id: 1, question: "Which command shows active network connections?", options: ["ifconfig", "netstat", "ipconfig", "network"], correctAnswer: 1, explanation: "netstat displays network connections." },
  { id: 2, question: "To search for text within a file, you use:", options: ["find", "search", "grep", "locate"], correctAnswer: 2, explanation: "grep searches for patterns in files." },
  { id: 3, question: "What does 'ps aux' show?", options: ["User accounts", "Running processes", "System uptime", "Disk space"], correctAnswer: 1, explanation: "ps aux lists all running processes." },
  { id: 4, question: "To kill a process with PID 1234, you type:", options: ["kill 1234", "stop 1234", "end 1234", "terminate 1234"], correctAnswer: 0, explanation: "kill sends a termination signal to the PID." },
  { id: 5, question: "Which command shows disk usage?", options: ["du", "df", "disk", "space"], correctAnswer: 1, explanation: "df shows available disk space." },
  { id: 6, question: "To view the last 10 lines of a log file:", options: ["head", "tail", "last", "end"], correctAnswer: 1, explanation: "tail displays the last lines of a file." },
  { id: 7, question: "What does 'chmod 755' do?", options: ["Deletes file", "Changes permissions", "Copies file", "Renames file"], correctAnswer: 1, explanation: "chmod changes file permissions." },
  { id: 8, question: "Which command finds files by name?", options: ["grep", "search", "find", "locate"], correctAnswer: 2, explanation: "find searches for files in a hierarchy." },
  { id: 9, question: "To check which ports are listening:", options: ["netstat -tuln", "port -list", "check ports", "listen -a"], correctAnswer: 0, explanation: "netstat -tuln shows listening ports." },
  { id: 10, question: "What does 'top' command show?", options: ["Highest files", "Real-time processes", "Top directories", "System temp"], correctAnswer: 1, explanation: "top displays real-time process info." }
];

// NEW: Distinct Post-Test Questions
export const INTERMEDIATE_POSTTEST: Question[] = [
  { id: 1, question: "To monitor network traffic in real-time:", options: ["ping", "tcpdump", "netcat", "traceroute"], correctAnswer: 1, explanation: "tcpdump captures network packets." },
  { id: 2, question: "Which command compresses a file?", options: ["zip", "compress", "tar", "All of the above"], correctAnswer: 3, explanation: "All these commands can compress files." },
  { id: 3, question: "To change file ownership:", options: ["chown", "chmod", "chgrp", "owner"], correctAnswer: 0, explanation: "chown modifies file ownership." },
  { id: 4, question: "What does 'ssh user@host' do?", options: ["Copies files", "Secure remote connection", "Scans host", "Pings host"], correctAnswer: 1, explanation: "SSH provides encrypted remote login." },
  { id: 5, question: "To extract a tar.gz file:", options: ["tar -xzvf file.tar.gz", "unzip file.tar.gz", "extract file.tar.gz", "open file.tar.gz"], correctAnswer: 0, explanation: "tar -xzvf extracts compressed archives." },
  { id: 6, question: "Which command shows running services?", options: ["systemctl list-units", "services --list", "show services", "list-services"], correctAnswer: 0, explanation: "systemctl manages systemd services." },
  { id: 7, question: "To schedule a task to run later:", options: ["schedule", "cron", "timer", "at"], correctAnswer: 3, explanation: "at schedules one-time tasks." },
  { id: 8, question: "What does 'wc -l' do?", options: ["Counts words", "Counts lines", "Counts characters", "Lists files"], correctAnswer: 1, explanation: "wc -l counts lines in a file." },
  { id: 9, question: "To redirect output to a file (overwrite):", options: ["command >> file", "command > file", "command | file", "command & file"], correctAnswer: 1, explanation: "> redirects and overwrites. >> appends." },
  { id: 10, question: "Which command checks system uptime?", options: ["time", "uptime", "date", "clock"], correctAnswer: 1, explanation: "uptime shows how long the system has been running." }
];

export const EXPERT_PRETEST: Question[] = [
  { id: 1, question: "Which tool is used for port scanning?", options: ["nmap", "ping", "traceroute", "netstat"], correctAnswer: 0, explanation: "nmap is the industry-standard port scanner." },
  { id: 2, question: "What is SQL Injection?", options: ["Database backup", "Code injection via inputs", "SQL optimization", "Database encryption"], correctAnswer: 1, explanation: "SQLi exploits vulnerabilities via user inputs." },
  { id: 3, question: "To analyze packet captures:", options: ["Wireshark", "Notepad", "grep", "cat"], correctAnswer: 0, explanation: "Wireshark is a network protocol analyzer." },
  { id: 4, question: "What does 'iptables -A INPUT -p tcp --dport 22 -j DROP' do?", options: ["Allows SSH", "Blocks SSH", "Forwards SSH", "Logs SSH"], correctAnswer: 1, explanation: "This rule drops all incoming TCP traffic on port 22." },
  { id: 5, question: "Which command finds SUID binaries?", options: ["find / -perm -4000", "ls -suid", "search suid", "find -suid"], correctAnswer: 0, explanation: "find / -perm -4000 searches for SUID files." },
  { id: 6, question: "What is a reverse shell?", options: ["Backwards terminal", "Shell connecting back to attacker", "Encrypted shell", "Root shell"], correctAnswer: 1, explanation: "A reverse shell connects from victim to attacker." },
  { id: 7, question: "To check for vulnerable software versions:", options: ["nmap -sV", "ping -v", "version check", "apt list"], correctAnswer: 0, explanation: "nmap -sV performs version detection." },
  { id: 8, question: "What does 'john --wordlist=pw.txt hash.txt' do?", options: ["Encrypts", "Cracks hashes", "Creates passwords", "Deletes hashes"], correctAnswer: 1, explanation: "John the Ripper cracks password hashes." },
  { id: 9, question: "Which file contains hashed passwords in Linux?", options: ["/etc/passwd", "/etc/shadow", "/etc/passwords", "/var/log/auth"], correctAnswer: 1, explanation: "/etc/shadow stores encrypted passwords." },
  { id: 10, question: "What is privilege escalation?", options: ["Updating software", "Gaining higher access", "Creating users", "Installing programs"], correctAnswer: 1, explanation: "Privilege escalation gains elevated permissions." }
];

// NEW: Distinct Post-Test Questions
export const EXPERT_POSTTEST: Question[] = [
  { id: 1, question: "To exploit a buffer overflow, you need:", options: ["Source code", "Binary and memory control", "Password", "Network access"], correctAnswer: 1, explanation: "Buffer overflows require controlling memory." },
  { id: 2, question: "What does 'msfconsole' launch?", options: ["MySQL", "Metasploit Framework", "Microsoft Console", "Message Console"], correctAnswer: 1, explanation: "msfconsole is the Metasploit console." },
  { id: 3, question: "To perform a man-in-the-middle attack:", options: ["arpspoof", "ping", "traceroute", "netstat"], correctAnswer: 0, explanation: "arpspoof sends fake ARP replies." },
  { id: 4, question: "What is Cross-Site Scripting (XSS)?", options: ["Database attack", "Injecting scripts into webpages", "Network sniffing", "Password cracking"], correctAnswer: 1, explanation: "XSS injects client-side scripts into web pages." },
  { id: 5, question: "To crack WPA2 WiFi password:", options: ["aircrack-ng", "nmap", "wireshark", "ping"], correctAnswer: 0, explanation: "aircrack-ng cracks WiFi encryption keys." },
  { id: 6, question: "What does 'hydra -l admin -P passwords.txt ssh://target' do?", options: ["Scans ports", "Brute-force SSH login", "Copies files", "Pings target"], correctAnswer: 1, explanation: "Hydra performs brute-force attacks." },
  { id: 7, question: "Which tool fuzzes web applications?", options: ["Burp Suite", "Wireshark", "nmap", "tcpdump"], correctAnswer: 0, explanation: "Burp Suite is used for web app testing." },
  { id: 8, question: "What is a rootkit?", options: ["Antivirus", "Malware that hides its presence", "Firewall", "Backup tool"], correctAnswer: 1, explanation: "Rootkits are malicious software designed to remain hidden." },
  { id: 9, question: "To analyze malware behavior:", options: ["Run it directly", "Use sandbox/VM", "Delete it", "Ignore it"], correctAnswer: 1, explanation: "Analyzing malware in a sandbox prevents infection." },
  { id: 10, question: "What does 'nikto -h target' do?", options: ["Pings target", "Scans for web vulnerabilities", "Copies files", "Traces route"], correctAnswer: 1, explanation: "Nikto scans web servers for dangerous files." }
];

export const TIERS: TierConfig[] = [
  { id: 'BEGINNER', levels: [{ id: 'b1', title: 'Linux Navigation', description: 'Master pwd, ls, and cd.' }], preTest: BEGINNER_PRETEST, postTest: BEGINNER_POSTTEST },
  { id: 'INTERMEDIATE', levels: [{ id: 'i1', title: 'Firewall Management', description: 'Configure iptables rules.' }], preTest: INTERMEDIATE_PRETEST, postTest: INTERMEDIATE_POSTTEST },
  { id: 'EXPERT', levels: [{ id: 'e1', title: 'Web App Scanning', description: 'Find SQL injection vulnerabilities.' }], preTest: EXPERT_PRETEST, postTest: EXPERT_POSTTEST },
];

export const ISO_QUESTIONS: { category: string; q: string; comment: string }[] = [
  { category: "1. Functionality", q: "The terminal accurately simulates real Linux command-line responses.", comment: "Tests core loop." },
  { category: "2. Reliability", q: "The application runs without crashing during normal use.", comment: "Tests stability." },
  { category: "3. Usability", q: "The interface is intuitive and easy to navigate.", comment: "Tests UX design." },
  { category: "4. Efficiency", q: "The application loads quickly and responds instantly.", comment: "Tests performance." },
  { category: "5. Maintainability", q: "The code structure is clean and well-organized.", comment: "Tests code quality." },
  { category: "6. Portability", q: "The application works across different browsers/devices.", comment: "Tests cross-platform support." }
];

export const CHEAT_SHEET = [
  { category: "Navigation", commands: [{ cmd: "pwd", desc: "Prints your current directory path" }, { cmd: "ls", desc: "Lists files and folders" }, { cmd: "cd [dir]", desc: "Changes into a directory" }] },
  { category: "File Ops", commands: [{ cmd: "cat [file]", desc: "Displays file contents" }, { cmd: "grep [text]", desc: "Searches for text in a file" }] },
  { category: "Network", commands: [{ cmd: "ping [host]", desc: "Tests connection to a host" }, { cmd: "nmap [IP]", desc: "Scans IP for open ports" }] },
  { category: "System", commands: [{ cmd: "ps aux", desc: "Lists all running processes" }, { cmd: "kill [PID]", desc: "Stops a process by ID" }] }
];

export const MOCK_FILE_SYSTEM: Record<string, string[]> = { 
  '/': ['home', 'var'], 
  '/home': ['operator'], 
  '/home/operator': ['notes.txt'], 
  '/var': ['log', 'log/apache2'], 
  '/var/log': ['auth.log'],
  '/var/log/apache2': ['access.log']
};

export const MOCK_FILES: Record<string, string> = { 
  '/home/operator/notes.txt': 'Check port 22.', 
  '/var/log/auth.log': 'Failed login from 185.22.14.99',
  '/var/log/apache2/access.log': 'GET /index.php?id=1 UNION SELECT * FROM users'
};

export const EASTER_EGGS: Record<string, string> = { 'sl': '🚂 Choo choo!', 'help': 'Available: ls, cd, pwd, cat, whoami, ping, nmap, block, status, sl, help' };