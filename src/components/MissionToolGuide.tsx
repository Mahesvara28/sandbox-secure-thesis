import { BookOpen, CheckCircle2, HelpCircle, Map, X } from 'lucide-react';

interface MissionToolGuideProps {
  onComplete: () => void;
}

const tools = [
  { icon: BookOpen, name: 'Mission context', description: 'The briefing explains the situation and why it matters. Read it before starting; it tells you what is already known and what still needs checking.' },
  { icon: CheckCircle2, name: 'Objective', description: 'Read the current task first. Objectives are completed in order; they explain what you are trying to learn or verify.' },
  { icon: HelpCircle, name: 'Hint', description: 'Hints are progressive. Start with the first nudge and reveal more only if you need it.' },
  { icon: BookOpen, name: 'Command field guide', description: 'Look up the commands used in this certification, what they do, and their limits. It is a reference, not a list of answers.' },
  { icon: Map, name: 'Network map', description: 'See the simulated hosts, addresses, services, and how they connect. Changes made by a mission may appear here.' },
];

export default function MissionToolGuide({ onComplete }: MissionToolGuideProps) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-4 font-mono" role="dialog" aria-modal="true" aria-labelledby="mission-tool-guide-title">
      <section className="w-full max-w-2xl border-2 border-cyan-700 bg-[#050a08] p-5 shadow-[0_0_40px_rgba(34,211,238,0.15)] sm:p-7">
        <div className="flex items-start justify-between gap-4 border-b border-cyan-900 pb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-600">First certification mission · quick tour</p>
            <h2 id="mission-tool-guide-title" className="mt-2 text-2xl font-black text-cyan-200">Your investigation tools</h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">This is a safe simulation. The commands and actions here do not access or change a real computer or network. Response commands are simplified for learning; real systems use different tools and procedures.</p>
          </div>
          <button onClick={onComplete} aria-label="Close mission guide" className="border border-green-900 p-2 text-green-500 hover:border-green-500"><X size={18} /></button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {tools.map(({ icon: Icon, name, description }) => (
            <article key={name} className="border border-green-900/70 bg-green-950/10 p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-green-300"><Icon size={16} className="text-cyan-400" />{name}</h3>
              <p className="mt-2 text-xs leading-5 text-gray-400">{description}</p>
            </article>
          ))}
        </div>

        <div className="mt-4 border border-yellow-900/70 bg-yellow-950/10 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">A good mission rhythm</p>
          <p className="mt-2 text-xs leading-5 text-gray-300">Read the objective → inspect evidence → use a hint or the field guide when needed → make only the requested simulated change → verify the result.</p>
        </div>

        <button onClick={onComplete} autoFocus className="mt-5 w-full border border-cyan-500 bg-cyan-500/10 px-5 py-3 text-xs font-black uppercase text-cyan-200 hover:bg-cyan-400 hover:text-black">Start the mission</button>
      </section>
    </div>
  );
}
