import { BookOpen, CheckCircle2, HelpCircle, Terminal, Clock3, Network, FileText, X } from 'lucide-react';

interface MissionToolGuideProps {
  onComplete: () => void;
}

const tools = [
  { icon: FileText, name: 'Mission context', description: 'The briefing and scenario describe what happened and what is known so far. Use that context to decide what evidence to check.' },
  { icon: CheckCircle2, name: 'Objective and progress', description: 'The objective panel tells you the current task. The progress indicator shows how many steps you have completed and what comes next.' },
  { icon: Terminal, name: 'Terminal', description: 'Type a command in the prompt and press Enter. This is a simulation with sample systems and data; it does not access a real computer or network. Type help to see supported commands.' },
  { icon: HelpCircle, name: 'Hints', description: 'Open Hint for a nudge. Hints appear in stages: read the first one, then reveal another only if you are still stuck.' },
  { icon: BookOpen, name: 'Command Field Guide', description: 'Use this reference to check what a command does, see an example, and learn its limits. It supports your decision; it does not replace the mission objective.' },
  { icon: BookOpen, name: 'Glossary', description: 'Open the glossary for a plain-language explanation of the key idea in this mission.' },
  { icon: Network, name: 'Network map', description: 'View simulated hosts, addresses, services, and connections. Some response actions create a visual change here so you can verify the result.' },
  { icon: Clock3, name: 'Timer and system status', description: 'Check whether a challenge timer is running and review the current system state. Untimed missions let you work at your own pace.' },
];

export default function MissionToolGuide({ onComplete }: MissionToolGuideProps) {
  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto bg-black/90 p-3 font-mono sm:p-4" role="dialog" aria-modal="true" aria-labelledby="mission-tool-guide-title" onClick={onComplete}>
      <div className="grid min-h-full place-items-center">
      <section className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col border-2 border-cyan-700 bg-[#050a08] p-4 shadow-[0_0_40px_rgba(34,211,238,0.15)] sm:max-h-[calc(100dvh-2rem)] sm:p-6" onClick={event => event.stopPropagation()}>
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-cyan-900 pb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-600">Terminal orientation · first certification mission</p>
            <h2 id="mission-tool-guide-title" className="mt-2 text-xl font-black text-cyan-200 sm:text-2xl">What’s on this screen?</h2>
            <p className="mt-2 text-xs leading-5 text-gray-400 sm:text-sm sm:leading-6">Use these panels to understand the case, choose a tool, and check your work. You can close this guide at any time and reopen the Command Field Guide during the mission.</p>
          </div>
          <button onClick={onComplete} aria-label="Close terminal guide" className="shrink-0 border border-green-900 p-2 text-green-500 hover:border-green-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"><X size={18} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto py-4 pr-1 sm:py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {tools.map(({ icon: Icon, name, description }) => (
              <article key={name} className="border border-green-900/70 bg-green-950/10 p-3 sm:p-4">
                <h3 className="flex items-center gap-2 text-sm font-bold text-green-300"><Icon size={16} className="shrink-0 text-cyan-400" />{name}</h3>
                <p className="mt-2 text-xs leading-5 text-gray-400">{description}</p>
              </article>
            ))}
          </div>

          <div className="mt-4 border border-yellow-900/70 bg-yellow-950/10 p-3 sm:p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">A good mission rhythm</p>
            <p className="mt-2 text-xs leading-5 text-gray-300">Read the objective → inspect evidence → check the Command Field Guide or glossary when useful → open a hint if stuck → make only the requested simulated change → verify the result.</p>
          </div>
        </div>

        <div className="shrink-0 border-t border-cyan-900 pt-3">
          <button onClick={onComplete} autoFocus className="w-full border border-cyan-500 bg-cyan-500/10 px-5 py-3 text-xs font-black uppercase text-cyan-200 transition-colors hover:bg-cyan-400 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Continue to terminal</button>
        </div>
      </section>
      </div>
    </div>
  );
}
