import type { Question } from '../components/QuizModule';

// --- TYPES ---
export type Tier = 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';

export interface LevelData {
  id: string;
  title: string;
  description: string;
}

export interface TierConfig {
  id: Tier;
  levels: LevelData[];
  preTest: Question[];
  postTest: Question[];
}

export interface Mission {
  id: string;
  title: string;
  tier: Tier;
  scenario: string;
  intro: string;
  timerLimit: number;
  logs: string[];
  target: string;
  steps: { desc: string; cmd: string; hint: string }[];
  realWorld: string;
  briefing: {
    concept: string;
    commands: string[];
    objective: string;
  };
  didYouKnow: string[];
}

// --- BEGINNER QUESTIONS ---
export const BEGINNER_QUESTIONS: Question[] = [
  { 
    id: 1, 
    question: "Imagine you are in a huge maze with thousands of hallways. You need to know exactly where you are right now. Which command would tell you your current location in the file system?", 
    options: ["A) ls (List files)", "B) pwd (Print Working Directory)", "C) cd (Change Directory)", "D) mkdir (Make Directory)"], 
    correctAnswer: 1,
    explanation: "The 'pwd' (Print Working Directory) command shows your current location in the file system hierarchy. Think of it like asking 'Where am I?' in a building. It outputs the full path from root (/) to your current folder."
  },
  { 
    id: 2, 
    question: "Think of your computer like a house with many doors. Each door has a number, and different services (like web browsing or email) use different doors to communicate. What are these numbered 'doors' called?", 
    options: ["A) IP Addresses", "B) Ports", "C) Cables", "D) Passwords"], 
    correctAnswer: 1,
    explanation: "Ports are numbered endpoints (0-65535) that allow different services to communicate over a network. For example, web traffic uses port 80 (HTTP) or 443 (HTTPS), while email uses port 25 (SMTP). Each service 'listens' on a specific port."
  },
  { 
    id: 3, 
    question: "An IP address is like a computer's 'home address' on the internet. Just like your house has a unique address so mail can be delivered, what does an IP address do?", 
    options: ["A) Encrypts your files so hackers can't read them", "B) Uniquely identifies a device so data knows where to go", "C) Makes your computer run faster", "D) Deletes viruses automatically"], 
    correctAnswer: 1,
    explanation: "An IP address (Internet Protocol address) is a unique numerical label assigned to every device on a network. It ensures data packets reach the correct destination, just like a street address ensures mail reaches the right house."
  },
  { 
    id: 4, 
    question: "Imagine you want to send a letter to a friend, but you only know their name, not their street address. You use a phonebook to look up their address. In networking, what system works like a 'phonebook' to convert website names (like google.com) into IP addresses?", 
    options: ["A) Firewall", "B) DNS (Domain Name System)", "C) Router", "D) Ethernet Cable"], 
    correctAnswer: 1,
    explanation: "DNS (Domain Name System) translates human-readable domain names (like google.com) into IP addresses (like 142.250.80.46) that computers use to communicate. Without DNS, you'd have to memorize IP addresses for every website!"
  },
  { 
    id: 5, 
    question: "You want to check if another computer on the network is 'awake' and reachable. Which command is like shouting 'Hello!' to see if someone responds?", 
    options: ["A) cat", "B) ping", "C) grep", "D) chmod"], 
    correctAnswer: 1,
    explanation: "The 'ping' command sends small ICMP packets to a target device and waits for a response. If the device responds, it's online and reachable. It's the most basic network troubleshooting tool, named after submarine sonar 'pings'."
  },
  { 
    id: 6, 
    question: "Think of a 'file' like a physical document on your desk. If you want to read what's written inside that document from the terminal, which command would you use?", 
    options: ["A) cat (Concatenate/Display file contents)", "B) rm (Remove file)", "C) mv (Move file)", "D) touch (Create empty file)"], 
    correctAnswer: 0,
    explanation: "The 'cat' (concatenate) command displays the contents of a file in the terminal. It's the most basic way to read a file's contents. For example, 'cat notes.txt' will print everything inside notes.txt to your screen."
  },
  { 
    id: 7, 
    question: "In a terminal, you type commands to tell the computer what to do. If you wanted to see a list of all the files in your current folder, which command would you use?", 
    options: ["A) ls (List)", "B) cd (Change Directory)", "C) pwd (Print Working Directory)", "D) whoami"], 
    correctAnswer: 0,
    explanation: "The 'ls' (list) command displays all files and folders in your current directory. Use 'ls -la' to see hidden files (starting with .) and detailed information like file size and permissions."
  },
  { 
    id: 8, 
    question: "Imagine you are searching through a 100-page document looking for every mention of the word 'password.' Which tool is designed specifically for searching text inside files?", 
    options: ["A) find (Finds files by name)", "B) grep (Searches for text inside files)", "C) cat (Displays file contents)", "D) ls (Lists files)"], 
    correctAnswer: 1,
    explanation: "The 'grep' (Global Regular Expression Print) command searches for specific text patterns within files. It's essential for log analysis and finding specific information. For example, 'grep error logs.txt' finds all lines containing 'error'."
  },
  { 
    id: 9, 
    question: "A 'firewall' is like a security guard at the entrance of a building. What is its main job?", 
    options: ["A) To make your internet connection faster", "B) To control which traffic is allowed in or out based on rules", "C) To store all your passwords safely", "D) To backup your files automatically"], 
    correctAnswer: 1,
    explanation: "A firewall monitors and controls incoming and outgoing network traffic based on predetermined security rules. It acts as a barrier between trusted internal networks and untrusted external networks (like the internet)."
  },
  { 
    id: 10, 
    question: "If you wanted to create a new folder (directory) to organize your files, which command would you use?", 
    options: ["A) rm (Remove)", "B) mkdir (Make Directory)", "C) cd (Change Directory)", "D) touch (Create file)"], 
    correctAnswer: 1,
    explanation: "The 'mkdir' (make directory) command creates a new folder in the file system. For example, 'mkdir reports' creates a folder named 'reports' in your current location. You can also create nested folders with 'mkdir -p folder/subfolder'."
  },
];

// --- INTERMEDIATE QUESTIONS ---
export const INTERMEDIATE_QUESTIONS: Question[] = [
  { 
    id: 1, 
    question: "Imagine you want to hide a secret diary in your room so guests don't see it, but you still know it's there. In Linux, how do you 'hide' a file or folder from a standard list view?", 
    options: ["A) Put it inside the /tmp folder.", "B) Add a dot '.' at the very beginning of the filename (e.g., .secret_diary).", "C) Change the file extension to .hidden.", "D) Encrypt the file with a password."], 
    correctAnswer: 1,
    explanation: "In Linux, any file or folder starting with a dot (.) is considered hidden. The 'ls' command won't show it by default. You need 'ls -a' (all) to see hidden files. This is how configuration files like .bashrc are hidden from regular view."
  },
  { 
    id: 2, 
    question: "Think of a file like a physical document. You can Read it, Write (edit) it, or Execute (run) it. If a file is a program or script, which permission must it have for the computer to actually run it?", 
    options: ["A) Read (r)", "B) Write (w)", "C) Execute (x)", "D) Delete (d)"], 
    correctAnswer: 2,
    explanation: "The Execute (x) permission allows a file to be run as a program or script. Without it, even if you can read the file, the system won't execute it. You can add execute permission with 'chmod +x filename'."
  },
  { 
    id: 3, 
    question: "In a factory, a conveyor belt takes the output of one machine and feeds it directly into the next machine. In Linux, which symbol acts as this 'conveyor belt' to pass the results of one command into another?", 
    options: ["A) The Ampersand (&)", "B) The Pipe (|)", "C) The Hash (#)", "D) The Dash (-)"], 
    correctAnswer: 1,
    explanation: "The Pipe (|) symbol takes the output of one command and feeds it as input to another. For example, 'cat logs.txt | grep error' reads the file and immediately searches for 'error' in one step. It's one of Linux's most powerful features."
  },
  { 
    id: 4, 
    question: "Imagine you need to fix a broken server, but that server is in a data center in another country. Which protocol acts like a 'secure, invisible cable' allowing you to control that remote computer from your own terminal?", 
    options: ["A) FTP (File Transfer Protocol)", "B) HTTP (Hypertext Transfer Protocol)", "C) SSH (Secure Shell)", "D) SMTP (Simple Mail Transfer Protocol)"], 
    correctAnswer: 2,
    explanation: "SSH (Secure Shell) encrypts all communication between your computer and a remote server. It's the standard way administrators remotely manage servers. The command 'ssh user@server-ip' opens a secure terminal session on the remote machine."
  },
  { 
    id: 5, 
    question: "A server keeps a massive 'diary' (log file) of everything that happens. If you only want to see the most recent entries at the very bottom of this massive diary, which command is like looking at the last few pages?", 
    options: ["A) head (Shows the top)", "B) tail (Shows the bottom)", "C) cat (Shows the whole thing)", "D) less (Lets you scroll)"], 
    correctAnswer: 1,
    explanation: "The 'tail' command shows the last few lines of a file. 'tail -f logs.txt' is especially powerful - it continuously monitors the file and shows new entries as they're added, perfect for watching live server logs."
  },
  { 
    id: 6, 
    question: "If a program on your Linux machine freezes and starts eating up all your RAM, you need to forcefully stop it. What is the term for the unique ID number assigned to every running program, which you use to target and stop it?", 
    options: ["A) MAC Address", "B) PID (Process ID)", "C) IP Address", "D) UID (User ID)"], 
    correctAnswer: 1,
    explanation: "Every running process in Linux has a unique PID (Process ID). You can find it with 'ps aux' or 'top', and stop the process with 'kill [PID]'. The 'kill -9 [PID]' command force-kills unresponsive processes."
  },
  { 
    id: 7, 
    question: "In Windows, you have an 'Administrator' account that can change anything. In Linux, what is the name of the ultimate 'god-mode' user account that has unrestricted power over the entire system?", 
    options: ["A) admin", "B) sysadmin", "C) root", "D) superuser"], 
    correctAnswer: 2,
    explanation: "The 'root' user in Linux has complete control over the system - it can read, write, and execute any file, install software, and change system settings. Regular users use 'sudo' (SuperUser DO) to temporarily gain root privileges."
  },
  { 
    id: 8, 
    question: "A firewall uses rules to decide what traffic gets in. If you create a rule to 'DROP' incoming traffic from a specific hacker's IP address, what actually happens to their connection attempt?", 
    options: ["A) The firewall sends them an error message saying 'Access Denied.'", "B) The firewall silently ignores them, making them think the server doesn't exist.", "C) The firewall redirects them to a fake website.", "D) The firewall records their password."], 
    correctAnswer: 1,
    explanation: "DROP silently discards packets without sending any response. The hacker's computer will wait for a response that never comes, eventually timing out. This is more secure than REJECT, which sends back an error message confirming the server exists."
  },
  { 
    id: 9, 
    question: "If you want to pack a whole folder of files into a single, compressed package to email to a friend (like a .zip file in Windows), which Linux command is the standard tool for 'tarring' and compressing files?", 
    options: ["A) zip", "B) tar", "C) pack", "D) compress"], 
    correctAnswer: 1,
    explanation: "The 'tar' (Tape Archive) command bundles multiple files into one archive. Combined with gzip compression: 'tar -czf archive.tar.gz folder/' creates a compressed archive. To extract: 'tar -xzf archive.tar.gz'."
  },
  { 
    id: 10, 
    question: "Linux stores important system information (like your username or your current folder path) in invisible 'variables.' Which command is used to 'print' or display the value of these variables on your screen?", 
    options: ["A) print", "B) show", "C) echo", "D) display"], 
    correctAnswer: 2,
    explanation: "The 'echo' command prints text or variable values to the terminal. For example, 'echo $HOME' shows your home directory path, and 'echo $USER' shows your username. It's also used in scripts to output messages."
  },
];

// --- EXPERT QUESTIONS ---
export const EXPERT_QUESTIONS: Question[] = [
  { 
    id: 1, 
    question: "Which character input is commonly used first to test for basic SQL Injection vulnerabilities?", 
    options: ["A) <script>", "B) ' (Single Quote)", "C) ../", "D) %00"], 
    correctAnswer: 1,
    explanation: "A single quote (') is the classic SQL injection test character. If a web form is vulnerable, entering a quote will break the SQL query syntax and cause a database error, revealing the vulnerability. It tests if user input is properly sanitized."
  },
  { 
    id: 2, 
    question: "What is the primary difference between offline hash cracking and online password brute-forcing?", 
    options: ["A) Offline cracking relies on network bandwidth; online does not.", "B) Offline cracking attempts hashes stored locally without sending network requests to the target.", "C) Online cracking uses GPU acceleration exclusively.", "D) Offline cracking only works on MD5 hashes."], 
    correctAnswer: 1,
    explanation: "Offline cracking works on stolen password hashes stored locally (using tools like Hashcat or John the Ripper). It's faster and doesn't alert the target. Online brute-forcing sends actual login attempts to a live service, which is slower and often triggers security alerts."
  },
  { 
    id: 3, 
    question: "What Linux file permission allows a standard user to execute a program with the elevated privileges of the file's owner (such as root)?", 
    options: ["A) Sticky Bit", "B) SUID Bit", "C) SGID Bit", "D) Read-Only Bit"], 
    correctAnswer: 1,
    explanation: "The SUID (Set User ID) bit allows a program to run with the permissions of the file owner, not the user executing it. For example, 'passwd' has SUID set so regular users can change their passwords (which requires root access to /etc/shadow). Find SUID files with: find / -perm -4000"
  },
  { 
    id: 4, 
    question: "In exploitation, what is a 'Reverse Shell'?", 
    options: ["A) A shell session initiated by the target machine connecting back to the attacker's listener.", "B) A local terminal session locked in read-only mode.", "C) An encrypted connection over SSL port 443.", "D) A command prompt executed over DNS queries."], 
    correctAnswer: 0,
    explanation: "A Reverse Shell is when the target machine initiates a connection back to the attacker's computer, giving the attacker remote command-line access. It's called 'reverse' because the target connects out (bypassing inbound firewalls) rather than the attacker connecting in."
  },
  { 
    id: 5, 
    question: "What is the goal of 'Lateral Movement' in post-exploitation?", 
    options: ["A) Elevating privileges from low-privilege user to system administrator on the local host.", "B) Moving deeper into a network by leveraging compromised credentials or sessions to access other hosts.", "C) Clearing system log files to cover operational traces.", "D) Exfiltrating sensitive database records."], 
    correctAnswer: 1,
    explanation: "Lateral Movement is when an attacker moves from one compromised machine to others within the same network. They use stolen credentials, Pass-the-Hash attacks, or exploit trust relationships between systems to expand their foothold."
  },
  { 
    id: 6, 
    question: "Which automated tool is widely used to detect and exploit SQL Injection vulnerabilities in web applications?", 
    options: ["A) sqlmap", "B) hydra", "C) john", "D) metasploit"], 
    correctAnswer: 0,
    explanation: "sqlmap is an open-source penetration testing tool that automates the detection and exploitation of SQL injection flaws. It can dump databases, read files, and even execute commands on the underlying server. Usage: sqlmap -u 'http://target.com/page?id=1'"
  },
  { 
    id: 7, 
    question: "Which command line tool is specifically built for fast network service brute-forcing (SSH, FTP, HTTP)?", 
    options: ["A) Hashcat", "B) Hydra", "C) Nikto", "D) Wireshark"], 
    correctAnswer: 1,
    explanation: "Hydra is a parallelized login cracker that supports numerous protocols (SSH, FTP, HTTP, etc.). It's used for online brute-force attacks against live services. Example: hydra -l admin -P passwords.txt ssh://target-ip"
  },
  { 
    id: 8, 
    question: "Which command lists all SUID binaries on a Linux machine?", 
    options: ["A) find / -perm -4000 -type f 2>/dev/null", "B) ls -la /etc/sudoers", "C) cat /etc/passwd | grep root", "D) chmod 777 /bin/bash"], 
    correctAnswer: 0,
    explanation: "This 'find' command searches the entire filesystem (/) for files (-type f) with the SUID permission bit set (-perm -4000). The '2>/dev/null' suppresses permission errors. SUID binaries are prime targets for privilege escalation attacks."
  },
  { 
    id: 9, 
    question: "Which tool is commonly used to establish listener ports for incoming reverse shells?", 
    options: ["A) Nmap", "B) Netcat (nc)", "C) tcpdump", "D) OpenSSL"], 
    correctAnswer: 1,
    explanation: "Netcat (nc) is the 'Swiss Army knife' of networking. To listen for a reverse shell: 'nc -lvnp 4444' (listen, verbose, numeric, port 4444). When the target connects, you get an interactive shell. Modern alternatives include ncat and socat."
  },
  { 
    id: 10, 
    question: "What post-exploitation action involves maintaining continuous access across reboot cycles on a target host?", 
    options: ["A) Reconnaissance", "B) Persistence", "C) Enumeration", "D) Pivoting"], 
    correctAnswer: 1,
    explanation: "Persistence ensures an attacker maintains access even after the target reboots. Methods include: adding SSH keys to ~/.ssh/authorized_keys, creating cron jobs, installing systemd services, or modifying startup scripts. This is critical for long-term operations."
  },
];

// --- ISO 9126 EVALUATION DATA ---
export const ISO_QUESTIONS = [
  { category: "1. Functionality", q: "The terminal accurately simulates real Linux command-line responses and validates user inputs correctly.", comment: "Tests the core gameplay loop and command validation." },
  { category: "1. Functionality", q: "The pre-test and post-test questions accurately measure the user's understanding of the cybersecurity concepts taught.", comment: "Evaluates the QuizModule component and learning alignment." },
  { category: "2. Reliability", q: "The application runs smoothly without freezing or crashing when the user inputs incorrect commands or fails a quiz.", comment: "Tests error handling in the handleCommand function." },
  { category: "2. Reliability", q: "The countdown timer in timed missions functions accurately and triggers the 'Mission Failed' state exactly when time expires.", comment: "Evaluates the useEffect timer logic and state updates." },
  { category: "3. Usability", q: "The popup windows for 'Network Map' and 'Hints' are easy to access, provide clear information, and do not clutter the main interface.", comment: "Evaluates the modal implementation for auxiliary information." },
  { category: "3. Usability", q: "A beginner with no Linux experience can easily understand the instructions and analogies provided in the pre-assessment.", comment: "Evaluates the analogy-based question design for accessibility." },
  { category: "4. Efficiency", q: "The terminal responds instantly when the user types and submits commands, providing immediate feedback.", comment: "Evaluates React state updates and the typewriter effect." },
  { category: "5. Maintainability", q: "The system's architecture is modular, making it easy to add new missions, questions, or levels without rewriting core code.", comment: "Evaluates the component structure (App, TierDashboard, QuizModule)." },
  { category: "6. Portability", q: "The web application functions correctly and maintains its layout across different web browsers (Chrome, Edge, Firefox).", comment: "Validates the use of standard web technologies (React, Vite, Tailwind)." },
];

// --- CHEAT SHEET ---
export const CHEAT_SHEET = [
  {
    category: "Navigation",
    commands: [
      { cmd: "pwd", desc: "Print working directory" },
      { cmd: "ls", desc: "List files in current directory" },
      { cmd: "cd [dir]", desc: "Change to directory" },
      { cmd: "whoami", desc: "Show current username" }
    ]
  },
  {
    category: "File Operations",
    commands: [
      { cmd: "cat [file]", desc: "Display file contents" },
      { cmd: "grep [text] [file]", desc: "Search for text in file" },
      { cmd: "find / -name [file]", desc: "Find file by name" }
    ]
  },
  {
    category: "Network & Security",
    commands: [
      { cmd: "ping [host]", desc: "Test connectivity to host" },
      { cmd: "status", desc: "View network traffic logs" },
      { cmd: "block [IP]", desc: "Block traffic from IP" },
      { cmd: "report [user]", desc: "Flag compromised account" }
    ]
  }
];

// --- TIERS ---
export const TIERS: TierConfig[] = [
  {
    id: 'BEGINNER',
    levels: [
      { id: 'b1', title: 'Linux Navigation', description: 'Master pwd, ls, and cd.' },
      { id: 'b2', title: 'File Operations', description: 'Learn cat, grep, and find.' },
      { id: 'b3', title: 'Network Basics', description: 'Understanding IPs and ping.' },
      { id: 'b4', title: 'Port Scanning', description: 'Identify open services.' },
      { id: 'b5', title: 'Log Reading', description: 'Find anomalies in text logs.' },
    ],
    preTest: BEGINNER_QUESTIONS,
    postTest: BEGINNER_QUESTIONS,
  },
  {
    id: 'INTERMEDIATE',
    levels: [
      { id: 'i1', title: 'Firewall Management', description: 'Configure iptables rules.' },
      { id: 'i2', title: 'Traffic Analysis', description: 'Analyze packets with tcpdump.' },
      { id: 'i3', title: 'Service Detection', description: 'Use nmap for scanning.' },
      { id: 'i4', title: 'Incident Response', description: 'Contain security incidents.' },
      { id: 'i5', title: 'Threat Hunting', description: 'Find indicators of compromise.' },
    ],
    preTest: INTERMEDIATE_QUESTIONS,
    postTest: INTERMEDIATE_QUESTIONS,
  },
  {
    id: 'EXPERT',
    levels: [
      { id: 'e1', title: 'Web App Scanning', description: 'Find SQL injection vulnerabilities.' },
      { id: 'e2', title: 'Password Attacks', description: 'Brute force and hash cracking.' },
      { id: 'e3', title: 'Privilege Escalation', description: 'Exploit misconfigurations.' },
      { id: 'e4', title: 'Exploitation', description: 'Gain shell access safely.' },
      { id: 'e5', title: 'Post-Exploitation', description: 'Lateral movement techniques.' },
    ],
    preTest: EXPERT_QUESTIONS,
    postTest: EXPERT_QUESTIONS,
  },
];

/// --- MISSIONS (EXPANDED) ---
export const MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: 'Operation: Rookie Audit',
    tier: 'BEGINNER',
    scenario: 'You are a new sysadmin. Your first task is to navigate the server, find the configuration notes, and secure the main directory.',
    intro: "HANDLER: Welcome, Rookie. Let's see if you know your way around a Linux terminal. Follow the objectives.",
    timerLimit: 0, // No timer for beginners
    logs: ["System initialized.", "Waiting for user input..."],
    target: "none",
    steps: [
      { 
        desc: "Identify current user", 
        cmd: "whoami", 
        hint: "Use the command that prints the current user's name." 
      },
      { 
        desc: "Check current location", 
        cmd: "pwd", 
        hint: "Print Working Directory to see where you are." 
      },
      { 
        desc: "List all files in this directory", 
        cmd: "ls", 
        hint: "List the contents of the current folder." 
      },
      { 
        desc: "Read the instructions file", 
        cmd: "cat", 
        hint: "Use 'cat' to read the contents of 'notes.txt'." 
      },
      { 
        desc: "Move into the secure folder", 
        cmd: "cd", 
        hint: "Change Directory to 'secure_folder'." 
      },
      { 
        desc: "Verify you are in the right place", 
        cmd: "pwd", 
        hint: "Check your path again to confirm you are inside the secure folder." 
      }
    ],
    realWorld: "Sysadmins spend 80% of their time navigating file systems and checking permissions.",
    briefing: {
      concept: "Linux Navigation & File Reading",
      commands: ["whoami - Check user", "pwd - Check path", "ls - List files", "cat - Read file", "cd - Change directory"],
      objective: "Navigate from the home directory to the secure folder and verify your location."
    },
    didYouKnow: [
      "The 'root' user in Linux is like the 'Administrator' in Windows but with even more power.",
      "The command 'cd ..' moves you up one level in the folder hierarchy.",
      "Most server configurations are stored in the /etc/ directory in Linux."
    ]
  },
  {
    id: 'm2',
    title: 'Operation: Silent Exfiltration',
    tier: 'INTERMEDIATE',
    scenario: 'Our firewall detected unusual outbound traffic. A hacker is stealing data. Analyze the logs, find the rogue IP, and cut their connection.',
    intro: "HANDLER: We have a Code Red. Data is leaving the network. Find the leak and plug it.",
    timerLimit: 120, // 2 minutes
    logs: ["10.0.0.5 -> 8.8.8.8 [DNS] - 12KB", "192.168.1.1 -> 185.22.14.99 [SSH] - 840MB !! ALERT !!", "172.16.0.3 -> 10.0.0.1 [HTTP] - 45KB"],
    target: "185.22.14.99",
    steps: [
      { 
        desc: "Check network status", 
        cmd: "status", 
        hint: "Type 'status' to view the active network connections." 
      },
      { 
        desc: "Identify the suspicious IP", 
        cmd: "analyze", 
        hint: "Type 'analyze' to process the logs and highlight the largest data transfer." 
      },
      { 
        desc: "Ping the suspicious IP to confirm it's active", 
        cmd: "ping", 
        hint: "Type 'ping 185.22.14.99' to test connectivity." 
      },
      { 
        desc: "Trace the route of the connection", 
        cmd: "trace", 
        hint: "Type 'trace 185.22.14.99' to see the path the data is taking." 
      },
      { 
        desc: "Block the rogue IP immediately", 
        cmd: "block", 
        hint: "Type 'block 185.22.14.99' to cut the connection." 
      },
      { 
        desc: "Verify the block was successful", 
        cmd: "status", 
        hint: "Check the status again to ensure the threat is neutralized." 
      }
    ],
    realWorld: "In a SOC (Security Operations Center), analysts use tools like Wireshark to spot these massive data transfers.",
    briefing: {
      concept: "Network Traffic Analysis & Incident Response",
      commands: ["status - View logs", "analyze - Process data", "ping - Test connection", "trace - Route path", "block [IP] - Stop traffic"],
      objective: "Identify the IP stealing data (185.22.14.99) and block it before the timer runs out."
    },
    didYouKnow: [
      "Port 22 (SSH) is commonly targeted by hackers for brute-force attacks.",
      "A 'Denial of Service' (DoS) attack floods a server with traffic, while exfiltration steals data quietly.",
      "The command 'netstat' is often used in real life to see active network connections."
    ]
  },
  {
    id: 'm3',
    title: 'Operation: Deep Forensics',
    tier: 'EXPERT',
    scenario: 'A server was compromised. The hacker left a backdoor. Find the malicious process, kill it, delete the file, and secure the system.',
    intro: "HANDLER: We've been breached. The attacker is still inside. Hunt them down and remove their access.",
    timerLimit: 180, // 3 minutes
    logs: ["Process 8842: systemd", "Process 9991: cryptominer.exe (SUSPICIOUS)", "Process 102: sshd"],
    target: "9991",
    steps: [
      { 
        desc: "List all running processes", 
        cmd: "ps", 
        hint: "Type 'ps' to see the process list. Look for high CPU usage or strange names." 
      },
      { 
        desc: "Identify the malicious Process ID (PID)", 
        cmd: "identify", 
        hint: "Type 'identify 9991' to flag the cryptominer process." 
      },
      { 
        desc: "Kill the malicious process", 
        cmd: "kill", 
        hint: "Type 'kill 9991' to stop the process immediately." 
      },
      { 
        desc: "Find the location of the malicious file", 
        cmd: "find", 
        hint: "Type 'find / -name cryptominer.exe' to locate the file on the disk." 
      },
      { 
        desc: "Delete the malicious file", 
        cmd: "rm", 
        hint: "Type 'rm /tmp/cryptominer.exe' to remove the threat permanently." 
      },
      { 
        desc: "Secure the password file permissions", 
        cmd: "chmod", 
        hint: "Type 'chmod 600 /etc/passwd' to ensure only root can read/write it." 
      },
      { 
        desc: "Reboot the system to clear memory", 
        cmd: "reboot", 
        hint: "Type 'reboot' to restart the server cleanly." 
      }
    ],
    realWorld: "This mimics a real 'Incident Response' lifecycle: Identification -> Containment -> Eradication -> Recovery.",
    briefing: {
      concept: "Process Management & Malware Eradication",
      commands: ["ps - List processes", "kill [PID] - Stop process", "find - Locate files", "rm - Delete files", "chmod - Change permissions"],
      objective: "Find PID 9991, kill it, delete the file, and secure the system permissions."
    },
    didYouKnow: [
      "Cryptominers are malware that use your server's CPU to mine cryptocurrency for the hacker.",
      "The command 'kill -9 [PID]' forces a process to stop immediately, even if it's frozen.",
      "Permissions '777' mean everyone can read/write/execute (very dangerous). '600' is secure."
    ]
  }
];