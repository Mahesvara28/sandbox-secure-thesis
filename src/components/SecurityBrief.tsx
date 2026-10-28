import { SECURITY_BRIEF_ITEMS } from '../data/securityBrief';

const safeHttpsUrl = (value?: string) => {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
};

export const SecurityBrief = () => {
  if (!SECURITY_BRIEF_ITEMS.length) return null;
  return <section aria-label="Security Brief" className="rounded-lg border border-[var(--game-border)] bg-[var(--game-surface)] p-4 shadow-[var(--game-shadow)]">
    <p className="game-eyebrow">Security Brief</p>
    <ul className="mt-3 space-y-3">
      {SECURITY_BRIEF_ITEMS.map((item, index) => {
        const href = item.type === 'news' ? safeHttpsUrl(item.link) : undefined;
        return <li key={`${item.type}-${index}`} className="border-t border-[var(--game-border)] pt-3 first:border-0 first:pt-0">
          <h3 className="text-sm font-semibold leading-5 text-[var(--game-text)]">{href
            ? <a href={href} target="_blank" rel="noopener noreferrer" className="underline decoration-[var(--game-cyan)] underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">{item.title}<span className="sr-only"> (external link)</span></a>
            : item.title}</h3>
          <p className="mt-1 text-xs text-[var(--game-muted)]">{item.source}{item.type === 'news' && item.date ? ` · ${item.date}` : ''}{href ? ' · external link' : ''}</p>
        </li>;
      })}
    </ul>
  </section>;
};
