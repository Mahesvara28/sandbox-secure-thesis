import type { Tier } from '../data/gameData';

type GuideEntry = {
  command: string;
  what: string;
  example: string;
  limit: string;
};

const GUIDE: Record<Tier, GuideEntry[]> = {
  BEGINNER: [
    { command: 'help', what: 'Shows the commands supported by this training terminal.', example: 'help', limit: 'Use the mission objective and this guide to choose which command to try next.' },
    { command: 'pwd', what: 'Shows the folder you are currently in.', example: 'pwd', limit: 'It tells you location, not what files are present.' },
    { command: 'ls', what: 'Lists files and folders in the current location.', example: 'ls /var/log', limit: 'A filename is a lead; open the file to review its contents.' },
    { command: 'cd [folder]', what: 'Moves to a folder so later commands can use its files.', example: 'cd /var/log', limit: 'Use the exact path shown in the objective.' },
    { command: 'cat [file]', what: 'Displays the text in a file.', example: 'cat auth.log', limit: 'Read nearby entries too; a single line can mislead.' },
    { command: 'grep [word] [file]', what: 'Shows only lines containing a word or phrase.', example: 'grep failed auth.log', limit: 'A search can miss differently worded or incomplete records.' },
    { command: 'whoami', what: 'Shows the account used in this training session.', example: 'whoami', limit: 'Account name alone does not tell you what actions are safe.' },
    { command: 'ping [host]', what: 'Checks whether the simulated host responds.', example: 'ping 198.51.100.23', limit: 'A response does not prove the host is trustworthy.' },
    { command: 'nmap [host]', what: 'Shows simulated ports and services on a host.', example: 'nmap 198.51.100.23', limit: 'Only scan systems you are authorized to assess in real work.' },
    { command: 'status', what: 'Summarizes the case host, listeners, and containment state.', example: 'status', limit: 'A snapshot can be incomplete; compare it with logs and the mission baseline.' },
    { command: 'report [finding]', what: 'Records a short finding for the current case.', example: 'report repeated-failures', limit: 'Describe evidence; do not claim identity or impact without support.' },
    { command: 'block [IP]', what: 'Simulates containing one network address.', example: 'block 198.51.100.23', limit: 'Check the evidence and target first; this training action changes no real firewall.' }
  ],
  INTERMEDIATE: [
    { command: 'help', what: 'Shows the commands supported by this training terminal.', example: 'help', limit: 'Use the mission objective and this guide to choose which command to try next.' },
    { command: 'cd [folder] / ls', what: 'Move to a folder and list the files available there.', example: 'cd /var/log/apache2  then  ls', limit: 'Confirm your current path before reading a relative filename.' },
    { command: 'cat [file]', what: 'Displays the contents of a simulated log or record.', example: 'cat access.log', limit: 'A single request does not show whether an attack succeeded.' },
    { command: 'ps aux', what: 'Lists running simulated processes, including IDs, owners, CPU use, and paths.', example: 'ps aux', limit: 'High CPU or an unfamiliar name alone does not prove malware.' },
    { command: 'ps -p [PID]', what: 'Shows details about one process ID.', example: 'ps -p 2214', limit: 'Compare path and context with expected software.' },
    { command: 'preserve [source]', what: 'Adds a simulated case note before response.', example: 'preserve netstat port-4444-listener', limit: 'Real evidence handling requires preserving originals and recording collection details.' },
    { command: 'netstat -tuln / ss -tuln', what: 'Lists simulated listening services and sockets.', example: 'ss -tuln', limit: 'A listening port is a service endpoint, not proof of compromise.' },
    { command: 'grep [-i] [-n] [pattern] [file]', what: 'Searches file lines; -i ignores case and -n adds line numbers.', example: "grep -i -n failed auth.log", limit: 'Filters can hide relevant context.' },
    { command: 'grep --ip / --after / --before', what: 'Narrows simulated log lines by address or time.', example: 'grep --ip 198.51.100.23 auth.log', limit: 'A shared or translated IP may represent more than one user.' },
    { command: 'disable-service [port]', what: 'Simulates disabling one listener after comparing it with the approved baseline.', example: 'disable-service 4444', limit: 'Verify the listener is unexpected and check that it is gone afterward.' },
    { command: 'status / nmap [host]', what: 'Review current simulated network state or inspect a host’s exposed services.', example: 'nmap localhost', limit: 'A scan is only useful when its target is authorized and its results are checked against a baseline.' },
    { command: 'block [IP]', what: 'Simulates containing one evidence-supported network source.', example: 'block 198.51.100.23', limit: 'Use a scoped action and verify it; a shared address may represent multiple users.' },
    { command: 'kill [PID]', what: 'Stops a process in the training simulation.', example: 'kill 2214', limit: 'Review and preserve evidence first, then verify the process stopped.' },
    { command: 'report [finding]', what: 'Records a concise evidence-based assessment.', example: 'report unapproved-port-4444', limit: 'Separate observed facts from your interpretation.' }
  ],
  EXPERT: [
    { command: 'help', what: 'Shows the commands supported by this training terminal.', example: 'help', limit: 'Use the mission objective and this guide to choose which command to try next.' },
    { command: 'cd [folder] / cat [file]', what: 'Navigate to the evidence directory and read the source record.', example: 'cd /var/log  then  cat auth.log', limit: 'Preserve context and note missing or rotated records.' },
    { command: 'journalctl [-u ssh] [--since TIME] [--until TIME]', what: 'Filters the sample service journal by service and time window.', example: 'journalctl -u ssh --since 03:23:00 --until 03:27:00', limit: 'Clocks can differ; compare sequences and account for offsets.' },
    { command: 'record-evidence [source] [observation]', what: 'Stores an observation and where it came from, separate from your conclusion.', example: 'record-evidence auth.log repeated-failures-and-later-success', limit: 'Write what the record shows; avoid attribution in the observation.' },
    { command: 'assess [low|medium|high] [finding]', what: 'Records confidence based on evidence quality and gaps.', example: 'assess medium correlation-unconfirmed', limit: 'Confidence is not certainty about identity or intent.' },
    { command: 'find [path] -name [file]', what: 'Searches the simulated filesystem for a named file.', example: 'find / -name cryptominer.exe', limit: 'A file’s presence does not prove it ran.' },
    { command: 'stat [file]', what: 'Shows simulated file owner, permissions, and modified time.', example: 'stat /tmp/.cache/cryptominer.exe', limit: 'Metadata is useful context, not proof of execution or intent.' },
    { command: 'crontab -l', what: 'Lists simulated scheduled commands for review.', example: 'crontab -l', limit: 'Many scheduled tasks are legitimate; compare them with the baseline.' },
    { command: 'ps aux / ps -p [PID]', what: 'Review running processes or inspect one process in more detail.', example: 'ps -p 2214', limit: 'A process name or resource spike needs corroborating evidence.' },
    { command: 'grep [pattern] [file]', what: 'Searches the simulated log, with optional IP, time, case, and line filters.', example: 'grep -n --ip 203.0.113.77 access.log', limit: 'Filtering may hide context; inspect relevant surrounding records.' },
    { command: 'cat ~/.ssh/authorized_keys', what: 'Displays the simulated SSH keys allowed for the account.', example: 'cat ~/.ssh/authorized_keys', limit: 'Unknown key comments warrant investigation but do not identify a person.' },
    { command: 'preserve [source]', what: 'Records a simulated evidence note before changing case state.', example: 'preserve case-evidence-before-containment', limit: 'Real evidence preservation includes originals, timestamps, and chain of custody.' },
    { command: 'status / netstat -tuln', what: 'Review network state and verify listening services after a response.', example: 'netstat -tuln', limit: 'Verify each intended change; a missing listener does not explain how it appeared.' },
    { command: 'remove-persistence [cron|ssh-key]', what: 'Simulates removing a confirmed scheduled task or unfamiliar key.', example: 'remove-persistence cron', limit: 'Confirm the mechanism and document it before removal; verify afterward.' },
    { command: 'block [IP] / disable-service [port]', what: 'Simulates scoped containment of an address or listener.', example: 'block 198.51.100.23', limit: 'Contain only evidence-supported targets and verify each resulting state.' },
    { command: 'report [finding]', what: 'Records the conclusion, scope, and uncertainty for the case.', example: 'report suspicious-activity-impact-unconfirmed', limit: 'Do not describe attempted access as confirmed impact.' }
  ]
};

export const CommandFieldGuide = ({ tier, onClose }: { tier: Tier; onClose: () => void }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4" role="dialog" aria-modal="true" aria-labelledby="command-field-guide-title" onClick={onClose}>
    <section className="flex max-h-[88vh] w-full max-w-4xl flex-col border border-cyan-500/50 bg-[#06100d] shadow-[0_0_40px_rgba(34,211,238,0.12)]" onClick={event => event.stopPropagation()}>
      <header className="flex items-start justify-between gap-4 border-b border-green-900/70 p-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-500">Optional certification reference</p>
          <h2 id="command-field-guide-title" className="mt-1 text-xl font-black text-green-200">{tier} Command Field Guide</h2>
          <p className="mt-1 text-xs text-green-700">What it does · example · what it cannot prove</p>
        </div>
        <button onClick={onClose} className="border border-green-800 px-3 py-2 text-xs font-bold text-green-400 hover:border-green-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400">CLOSE</button>
      </header>
      <div className="overflow-y-auto p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2">
          {GUIDE[tier].map(entry => (
            <article key={entry.command} className="border border-green-900/70 bg-black/50 p-3 sm:p-4">
              <code className="block break-words text-xs font-bold text-cyan-300">{entry.command}</code>
              <p className="mt-2 text-xs leading-5 text-gray-300">{entry.what}</p>
              <p className="mt-2 text-[11px] text-green-500"><span className="text-green-800">EXAMPLE </span><code className="break-words">{entry.example}</code></p>
              <p className="mt-2 border-t border-green-950 pt-2 text-[11px] leading-4 text-yellow-700"><span className="font-bold text-yellow-600">LIMIT </span>{entry.limit}</p>
            </article>
          ))}
        </div>
        <p className="mt-4 text-[10px] text-green-800">Commands run only in the training simulation. Check the current objective before choosing a command.</p>
      </div>
    </section>
  </div>
);
