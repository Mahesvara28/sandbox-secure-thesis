import { useState } from 'react';
import { ArrowRight, Lightbulb, X } from 'lucide-react';
import chibi from '../assets/chibi.png';

const facts = [
  'Multi-factor authentication adds another check after a password, so a stolen password alone may not be enough to sign in.',
  'HTTPS encrypts data between your browser and a website. It does not, by itself, prove the website is trustworthy.',
  'A failed login is an observation. It does not prove that an account was accessed.',
  'DNS translates a domain name, such as example.com, into an IP address computers can use.',
  'When it is safe and authorized, preserve useful evidence before containment. Timestamps can help build an incident timeline.',
];

interface NovaCompanionProps {
  onOpenHelp: () => void;
}

/** Small optional cybersecurity fact companion available throughout the signed-in game. */
export default function NovaCompanion({ onOpenHelp }: NovaCompanionProps) {
  const [open, setOpen] = useState(false);
  const [factIndex, setFactIndex] = useState(() => Math.floor(Math.random() * facts.length));

  const showNextFact = () => setFactIndex(index => (index + 1) % facts.length);

  return (
    <aside className="nova-fact-companion" aria-label="Nova cybersecurity facts">
      {open && <section className="nova-fact-popover" aria-labelledby="nova-fact-title">
        <div className="nova-fact-heading">
          <div><p className="game-eyebrow">A quick fact</p><h2 id="nova-fact-title">Nova’s field note</h2></div>
          <button type="button" onClick={() => setOpen(false)} className="nova-fact-close" aria-label="Close Nova’s fact"><X size={17} /></button>
        </div>
        <p className="nova-fact-copy" aria-live="polite" aria-atomic="true">{facts[factIndex]}</p>
        <div className="nova-fact-actions">
          <button type="button" onClick={showNextFact} className="nova-fact-next"><Lightbulb size={15} />Another fact</button>
          <button type="button" onClick={onOpenHelp} className="nova-fact-help">Ask Nova <ArrowRight size={15} /></button>
        </div>
      </section>}
      <button type="button" className="nova-fact-launcher" aria-expanded={open} aria-label={open ? 'Close Nova cybersecurity fact' : 'Show a cybersecurity fact from Nova'} onClick={() => setOpen(value => !value)}>
        <img src={chibi} alt="" aria-hidden="true" />
        <span className="nova-fact-spark" aria-hidden="true"><Lightbulb size={15} /></span>
      </button>
    </aside>
  );
}
