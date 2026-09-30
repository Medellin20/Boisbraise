import type { ReactNode } from 'react';

export function LegalPage({ title, updatedAt, children }: { title: string; updatedAt: string; children: ReactNode }) {
  return (
    <div className="container-app py-14 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <span className="text-eyebrow uppercase text-canal-600">Informations légales</span>
        <h1 className="mt-2 text-display-sm font-extrabold text-ink-900 sm:text-display-md">{title}</h1>
        <p className="mt-2 text-sm text-ink-400">Dernière mise à jour : {updatedAt}</p>
        <div className="prose prose-slate mt-10 max-w-none prose-headings:font-bold prose-headings:text-ink-900 prose-p:leading-relaxed prose-p:text-ink-600 prose-li:text-ink-600">
          {children}
        </div>
      </div>
    </div>
  );
}
