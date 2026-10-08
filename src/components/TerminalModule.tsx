import React, { useState, useEffect, useRef } from 'react';
import { MOCK_FILE_SYSTEM, MOCK_FILES, EASTER_EGGS } from '../data/gameData';

interface TerminalModuleProps {
  onCommand: (cmd: string) => void;
  systemMessage: string;
  nonce: number;
  currentPath: string;
  setCurrentPath: (path: string) => void;
  onMapAction: (action: 'scan' | 'block' | 'none') => void;
  playSound: (type: 'keystroke' | 'success' | 'error' | 'scan') => void;
}

type HistoryLine = {
  type: 'sys' | 'user' | 'error' | 'success' | 'ambient';
  content: string;
  id: number;
};

const stripQuotes = (value: string) => {
  return value.replace(/^['"`]|['"`]$/g, '');
};

export const TerminalModule: React.FC<TerminalModuleProps> = ({
  onCommand,
  systemMessage,
  nonce,
  currentPath,
  setCurrentPath,
  onMapAction,
  playSound
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryLine[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastNonceRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addHistory = (
    type: HistoryLine['type'],
    content: string
  ) => {
    setHistory(prev => [
      ...prev,
      {
        type,
        content,
        id: Date.now() + Math.random()
      }
    ]);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isProcessing]);

  useEffect(() => {
    const ambientMessages = [
      '[SYSLOG] sshd[1042]: Listening on 0.0.0.0 port 22',
      '[CRON] Executing scheduled maintenance task...',
      '[NET] eth0: link up, 1000 Mbps',
      '[SYSTEM] Monitoring services are operational.',
      '[SECURITY] Endpoint monitoring active.'
    ];

    const triggerAmbient = () => {
      const randomMsg =
        ambientMessages[Math.floor(Math.random() * ambientMessages.length)];

      addHistory('ambient', randomMsg);

      idleTimerRef.current = setTimeout(
        triggerAmbient,
        15000 + Math.random() * 15000
      );
    };

    idleTimerRef.current = setTimeout(triggerAmbient, 10000);

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      nonce > 0 &&
      nonce !== lastNonceRef.current &&
      systemMessage
    ) {
      lastNonceRef.current = nonce;
      addHistory('sys', systemMessage);
      playSound('success');
    }
  }, [nonce, systemMessage, playSound]);

  const resolvePath = (target: string) => {
    target = target.trim();

    if (target === '~' || target === '~/') {
      return '/home/operator';
    }

    if (target.startsWith('~/')) {
      return '/home/operator/' + target.slice(2);
    }

    if (target === '/') {
      return '/';
    }

    if (target === '..') {
      const parts = currentPath.split('/').filter(Boolean);

      if (parts.length === 0) {
        return '/';
      }

      parts.pop();

      return '/' + parts.join('/');
    }

    if (target === '.') {
      return currentPath;
    }

    /*
     * Tutorial shortcut:
     * The tutorial asks the player to enter "logs"
     * from the operator home directory.
     *
     * We map that training shortcut to /var/log.
     */
    if (
      currentPath === '/home/operator' &&
      target === 'logs'
    ) {
      return '/var/log';
    }

    if (target.startsWith('/')) {
      return target;
    }

    return currentPath === '/'
      ? `/${target}`
      : `${currentPath}/${target}`;
  };

  const executeLocalCommand = async (cmd: string) => {
    const trimmedCommand = cmd.trim();

    if (!trimmedCommand) {
      return;
    }

    /*
     * Handles commands containing quoted arguments.
     *
     * Example:
     * grep 'UNION' access.log
     */
    const parts =
      trimmedCommand.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];

    const command = parts[0]?.toLowerCase();
    const args = parts.slice(1).map(stripQuotes);

    if (!command) {
      return;
    }

    /*
     * EASTER EGGS
     */
    if (
      EASTER_EGGS[
        command as keyof typeof EASTER_EGGS
      ]
    ) {
      addHistory(
        'sys',
        EASTER_EGGS[
          command as keyof typeof EASTER_EGGS
        ]
      );

      playSound('success');
      return;
    }

    /*
     * HELP
     */
    if (command === 'help') {
      addHistory(
        'sys',
        `Available commands:

Navigation:
  pwd
  ls
  cd [directory]
  cat [file]

System:
  whoami
  ps aux
  ps -p [PID]
  clear

Network:
  status
  ping [host]
  nmap [host]
  netstat -tuln
  block [IP]

Analysis:
  grep [pattern] [file]
  find [path] -name [file]
  crontab -l

Use the command exactly as shown in mission objectives.`
      );

      playSound('success');
      return;
    }

    /*
     * CLEAR
     */
    if (command === 'clear') {
      setHistory([]);
      playSound('success');
      return;
    }

    /*
     * PWD
     */
    if (command === 'pwd') {
      addHistory('sys', currentPath);
      playSound('success');
      return;
    }

    /*
     * WHOAMI
     */
    if (command === 'whoami') {
      addHistory('sys', 'operator');
      playSound('success');
      return;
    }

    /*
     * LS
     */
    if (command === 'ls') {
      const requestedPath = args[0]
        ? resolvePath(args[0])
        : currentPath;

      const files =
        MOCK_FILE_SYSTEM[
          requestedPath as keyof typeof MOCK_FILE_SYSTEM
        ] || [];

      if (files.length === 0) {
        addHistory(
          'sys',
          'total 0'
        );
      } else {
        addHistory(
          'sys',
          files.join('    ')
        );
      }

      playSound('success');
      return;
    }

    /*
     * CD
     */
    if (command === 'cd') {
      if (!args[0]) {
        setCurrentPath('/home/operator');
        playSound('success');
        return;
      }

      const newPath = resolvePath(args[0]);

      if (
        MOCK_FILE_SYSTEM[
          newPath as keyof typeof MOCK_FILE_SYSTEM
        ] ||
        newPath === '/'
      ) {
        setCurrentPath(newPath);
        playSound('success');
        return;
      }

      addHistory(
        'error',
        `cd: ${args[0]}: No such file or directory`
      );

      playSound('error');
      return;
    }

    /*
     * CAT
     */
    if (command === 'cat') {
      if (!args[0]) {
        addHistory(
          'error',
          'cat: missing operand'
        );

        playSound('error');
        return;
      }

      const filePath = resolvePath(args[0]);

      /*
       * Simulated SSH authorized keys.
       */
      if (
        args[0] === '~/.ssh/authorized_keys' ||
        filePath === '/home/operator/.ssh/authorized_keys'
      ) {
        addHistory(
          'sys',
          `ssh-rsa AAAA... operator@workstation
ssh-ed25519 AAAA... backup-admin@secure-host
ssh-rsa AAAA... unknown@external-host`
        );

        playSound('success');
        return;
      }

      if (
        MOCK_FILES[
          filePath as keyof typeof MOCK_FILES
        ]
      ) {
        addHistory(
          'sys',
          MOCK_FILES[
            filePath as keyof typeof MOCK_FILES
          ]
        );

        playSound('success');
        return;
      }

      addHistory(
        'error',
        `cat: ${args[0]}: No such file or directory`
      );

      playSound('error');
      return;
    }

    /*
     * STATUS
     */
    if (command === 'status') {
      addHistory(
        'sys',
        `=== SANDBOX NETWORK STATUS ===

Host: sandbox-server
Interface: eth0
State: UP
IP Address: 192.168.1.10
Gateway: 192.168.1.1

Active Connections:
  192.168.1.10:22  <- 185.22.14.99
  192.168.1.10:80  <- 192.168.1.20

Security Status:
  Firewall: ACTIVE
  IDS: ACTIVE
  Threat Level: ELEVATED`
      );

      playSound('success');
      return;
    }

    /*
     * PING
     */
    if (command === 'ping') {
      const target = args[0] || '127.0.0.1';

      setIsProcessing(true);

      addHistory(
        'sys',
        `PING ${target}...`
      );

      await new Promise(resolve =>
        setTimeout(resolve, 900)
      );

      setIsProcessing(false);

      addHistory(
        'success',
        `64 bytes from ${target}: icmp_seq=1 ttl=57 time=24.3 ms
64 bytes from ${target}: icmp_seq=2 ttl=57 time=23.8 ms
64 bytes from ${target}: icmp_seq=3 ttl=57 time=24.1 ms

--- ${target} ping statistics ---
3 packets transmitted, 3 received, 0% packet loss`
      );

      playSound('success');
      return;
    }

    /*
     * NMAP
     */
    if (command === 'nmap') {
      const target = args[0] || 'localhost';

      onMapAction('scan');
      playSound('scan');
      setIsProcessing(true);

      addHistory(
        'sys',
        `Starting Nmap simulation against ${target}...`
      );

      await new Promise(resolve =>
        setTimeout(resolve, 1200)
      );

      setIsProcessing(false);
      onMapAction('none');

      if (
        target === 'localhost' ||
        target === '127.0.0.1'
      ) {
        addHistory(
          'success',
          `Nmap scan report for ${target}

PORT     STATE    SERVICE
22/tcp   open     ssh
80/tcp   open     http
4444/tcp open     unknown

Nmap done: 1 host scanned`
        );
      } else {
        addHistory(
          'success',
          `Nmap scan report for ${target}

PORT     STATE    SERVICE
22/tcp   open     ssh

Host appears reachable.

Nmap done: 1 host scanned`
        );
      }

      playSound('success');
      return;
    }

    /*
     * PS AUX
     */
    if (
      command === 'ps' &&
      args.length >= 1 &&
      args[0] === 'aux'
    ) {
      addHistory(
        'sys',
        `USER       PID   %CPU  %MEM  COMMAND
root         1    0.0   0.1   /sbin/init
root       842    0.1   0.4   /usr/sbin/sshd
root      1091    0.3   0.8   /usr/sbin/apache2
root      1477    0.1   0.2   /usr/bin/cron
operator  2014    0.2   1.1   -bash
root      2214   87.4   2.3   /tmp/.cache/cryptominer.exe`
      );

      playSound('success');
      return;
    }

    /*
     * PS -P PID
     */
    if (
      command === 'ps' &&
      args[0] === '-p'
    ) {
      const pid = args[1];

      if (!pid) {
        addHistory(
          'error',
          'ps: option requires a process ID'
        );

        playSound('error');
        return;
      }

      if (pid === '2214') {
        addHistory(
          'sys',
          `PID     USER     CPU     COMMAND
2214    root     87.4%   /tmp/.cache/cryptominer.exe

Process status: RUNNING
Parent process: 1477
Executable: /tmp/.cache/cryptominer.exe`
        );
      } else {
        addHistory(
          'sys',
          `PID ${pid}: process information available
Status: RUNNING`
        );
      }

      playSound('success');
      return;
    }

    /*
     * KILL
     */
    if (command === 'kill') {
      const pid = args[0];

      if (!pid) {
        addHistory(
          'error',
          'kill: usage: kill [PID]'
        );

        playSound('error');
        return;
      }

      if (pid === '2214') {
        addHistory(
          'success',
          `Process 2214 terminated.

[OK] Signal sent.
[OK] Process removed from active process table.`
        );
      } else {
        addHistory(
          'success',
          `Process ${pid} terminated.`
        );
      }

      playSound('success');
      return;
    }

    /*
     * NETSTAT
     */
    if (
      command === 'netstat' &&
      args.includes('-tuln')
    ) {
      addHistory(
        'sys',
        `Active listening services:

Proto  Local Address       State
tcp    0.0.0.0:22         LISTEN
tcp    0.0.0.0:80         LISTEN
tcp    0.0.0.0:4444       LISTEN

Expected services:
22/tcp  SSH
80/tcp  HTTP

WARNING:
4444/tcp is not part of the approved server configuration.`
      );

      playSound('success');
      return;
    }

    /*
     * GREP
     */
    if (command === 'grep') {
      const pattern = args[0];
      const file = args[1];

      if (!pattern || !file) {
        addHistory(
          'error',
          'grep: usage: grep [pattern] [file]'
        );

        playSound('error');
        return;
      }

      if (
        pattern.toLowerCase() === 'union' &&
        file === 'access.log'
      ) {
        addHistory(
          'success',
          `192.168.1.50 - - [08/Oct/2026:03:31:42] "GET /index.php?id=1 UNION SELECT username,password FROM users HTTP/1.1" 200
192.168.1.50 - - [08/Oct/2026:03:31:45] "GET /index.php?id=1 UNION SELECT email FROM customers HTTP/1.1" 200`
        );

        playSound('success');
        return;
      }

      if (
        pattern.toLowerCase().includes('failed') &&
        file === 'auth.log'
      ) {
        addHistory(
          'success',
          `Oct 08 03:21:11 sandbox sshd[1842]: Failed password for root from 185.22.14.99
Oct 08 03:21:14 sandbox sshd[1845]: Failed password for root from 185.22.14.99
Oct 08 03:21:17 sandbox sshd[1848]: Failed password for root from 185.22.14.99`
        );

        playSound('success');
        return;
      }

      addHistory(
        'sys',
        `No matches found for "${pattern}" in ${file}`
      );

      playSound('success');
      return;
    }

    /*
     * CRONTAB
     */
    if (
      command === 'crontab' &&
      args[0] === '-l'
    ) {
      addHistory(
        'sys',
        `# User scheduled tasks

0 * * * * /usr/bin/logrotate
30 2 * * * /usr/bin/backup-system
*/5 * * * * /tmp/.cache/update.sh

WARNING:
The third entry executes an unknown script from /tmp.`
      );

      playSound('success');
      return;
    }

    /*
     * FIND
     */
    if (command === 'find') {
      const fullCommand = args.join(' ');

      if (
        fullCommand.includes('cryptominer.exe')
      ) {
        addHistory(
          'success',
          `/tmp/.cache/cryptominer.exe`
        );

        playSound('success');
        return;
      }

      addHistory(
        'sys',
        'No matching files found.'
      );

      playSound('success');
      return;
    }

    /*
     * BLOCK
     */
    if (command === 'block') {
      const target = args[0];

      if (!target) {
        addHistory(
          'error',
          'block: usage: block [IP]'
        );

        playSound('error');
        return;
      }

      onMapAction('block');

      addHistory(
        'success',
        `[FIREWALL] Rule created.
[BLOCKED] ${target}
[STATUS] Incoming connections from ${target} are now denied.`
      );

      playSound('success');

      setTimeout(() => {
        onMapAction('none');
      }, 700);

      return;
    }

    /*
     * UNKNOWN COMMAND
     */
    addHistory(
      'error',
      `${command}: command not found

Type "help" to see available commands.`
    );

    playSound('error');
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!input.trim() || isProcessing) {
      return;
    }

    const commandInput = input.trim();

    playSound('keystroke');

    setHistory(prev => [
      ...prev,
      {
        type: 'user',
        content: commandInput,
        id: Date.now() + Math.random()
      }
    ]);

    await executeLocalCommand(commandInput);

    /*
     * IMPORTANT:
     * Always forward the original command to the
     * mission handler so the mission can determine
     * whether the player completed the current step.
     */
    onCommand(commandInput);

    setInput('');
  };

  return (
    <div className="flex flex-col h-full font-mono text-[13px] bg-black/90 p-4 rounded border border-green-900/50 shadow-inner">

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto mb-2 space-y-1 pr-2 scrollbar-hide"
      >
        {history.map((line, i) => (
          <div
            key={`${line.id}-${i}`}
            className={`whitespace-pre-wrap break-words ${
              line.type === 'user'
                ? 'text-white'
                : line.type === 'error'
                ? 'text-red-400 font-bold'
                : line.type === 'success'
                ? 'text-green-300 font-bold'
                : line.type === 'ambient'
                ? 'text-gray-600 text-[11px] italic'
                : 'text-green-300'
            }`}
          >
            <span className="opacity-50 mr-2 select-none">
              {line.type === 'user'
                ? `operator@sandbox:${currentPath}$`
                : '[SYS]:'}
            </span>

            {line.content}
          </div>
        ))}

        {isProcessing && (
          <div className="text-yellow-500 animate-pulse">
            [ | ] Processing...
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center border-t border-green-900/50 pt-2 shrink-0"
      >
        <span className="text-cyan-400 font-bold mr-2 select-none">
          operator@sandbox:{currentPath}$
        </span>

        <input
          autoFocus
          type="text"
          value={input}
          onChange={e => {
            setInput(e.target.value);
            playSound('keystroke');
          }}
          className="flex-1 bg-transparent border-none outline-none text-white focus:ring-0 p-0 tracking-wide"
          spellCheck={false}
          autoComplete="off"
          disabled={isProcessing}
        />
      </form>
    </div>
  );
};

export default TerminalModule;