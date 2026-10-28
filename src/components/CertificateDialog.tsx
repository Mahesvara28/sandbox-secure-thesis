import { useEffect } from 'react';
import type { UserCertificate } from '../Firebase';

export const CertificateDialog = ({ certificate, onClose }: { certificate: UserCertificate | null; onClose: () => void }) => {
  useEffect(() => {
    if (!certificate) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [certificate, onClose]);

  if (!certificate) return null;
  const issuedDate = new Date(certificate.issuedAt);

  return <div className="fixed inset-0 z-[180] flex items-center justify-center overflow-y-auto bg-black/80 p-4" role="presentation" onClick={onClose}>
    <section className="w-full max-w-4xl rounded-lg border border-[var(--game-border)] bg-[var(--game-surface)] p-4 text-[var(--game-text)] shadow-2xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="certificate-dialog-title" onClick={event => event.stopPropagation()}>
      <article className="certificate-print-area mx-auto flex min-h-[440px] flex-col items-center justify-center border-4 border-double border-[var(--game-green)] bg-[var(--game-surface)] px-8 py-12 text-center sm:px-14">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-[var(--game-green)]">Sandbox Secure Academy</p>
        <h2 id="certificate-dialog-title" className="mt-6 text-3xl font-black uppercase tracking-wide sm:text-5xl">Certificate of Completion</h2>
        <p className="mt-8 text-sm text-[var(--game-muted)]">This certifies that</p>
        <p className="mt-2 max-w-full break-words text-2xl font-bold sm:text-4xl">{certificate.recipientName}</p>
        <p className="mt-5 text-sm text-[var(--game-muted)]">has completed the</p>
        <p className="mt-2 text-xl font-black text-[var(--game-green)] sm:text-3xl">{certificate.tier} Security Certification</p>
        <p className="mt-5 text-sm text-[var(--game-muted)]">Final assessment: {certificate.score} / {certificate.total}</p>
        <p className="mt-8 text-xs text-[var(--game-muted)]">Awarded {Number.isNaN(issuedDate.getTime()) ? certificate.issuedAt : issuedDate.toLocaleDateString()}</p>
        <p className="mt-2 font-mono text-[10px] text-[var(--game-muted)]">Certificate ID · {certificate.id}</p>
      </article>
      <div className="no-print mt-4 flex flex-col-reverse justify-end gap-2 sm:flex-row">
        <button type="button" onClick={onClose} className="min-h-11 rounded-md border border-[var(--game-border)] px-5 py-2 text-sm font-semibold hover:border-[var(--game-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">Close</button>
        <button type="button" onClick={() => window.print()} className="min-h-11 rounded-md bg-[var(--game-green)] px-5 py-2 text-sm font-bold text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--game-cyan)]">Print certificate</button>
      </div>
    </section>
  </div>;
};
