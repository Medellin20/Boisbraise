'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

const REVIEWS = [
  'Der Kauf war unkompliziert. Das Brennholz kam trocken und sauber bei uns an.',
  'Die Lieferung war pünktlich und der Fahrer sehr freundlich. Gerne wieder!',
  'Gute Holzqualität, faire Abwicklung und eine zuverlässige Lieferung.',
  'Die Scheite waren ordentlich gespalten und sofort einsatzbereit.',
  'Von der Bestellung bis zur Anlieferung hat alles reibungslos funktioniert.',
  'Das Holz wurde sorgfältig abgeladen und entsprach der Beschreibung.',
  'Sehr angenehmer Kontakt und ein zuverlässiger Liefertermin.',
  'Die Qualität hat uns überzeugt. Wir bestellen gerne wieder.',
  'Einfach bestellt, gut geliefert und sauber gestapelt.',
  'Freundlicher Service und eine schnelle Rückmeldung zu meiner Bestellung.',
  'Das Holz brennt gut und die Lieferung kam wie angekündigt.',
  'Alles lief unkompliziert. Auch die Abstimmung des Liefertermins war einfach.',
  'Gute Ware und ein hilfsbereiter Fahrer bei der Anlieferung.',
  'Die Scheite haben die bestellte Länge und sind schön trocken.',
  'Zuverlässiger Anbieter mit freundlichem Kundenservice.',
  'Die Bestellung war einfach und die Lieferung bestens organisiert.',
  'Saubere Qualität und eine pünktliche Ankunft. Vielen Dank!',
  'Wir sind mit dem Holz und dem gesamten Ablauf sehr zufrieden.',
  'Die Lieferung wurde vorher angekündigt und kam genau im Zeitfenster.',
  'Das Holz war ordentlich verpackt und ließ sich gut lagern.',
  'Sehr gute Kommunikation und eine angenehme Abwicklung.',
  'Die bestellte Menge wurde sorgfältig und zuverlässig geliefert.',
  'Gute Qualität zu einem fairen Preis. Wir sind sehr zufrieden.',
  'Die Anlieferung war schnell, freundlich und ohne Probleme.',
  'Das Holz entspricht unseren Erwartungen und kam pünktlich an.',
  'Von der Anfrage bis zur Lieferung fühlten wir uns gut betreut.',
  'Trockene Scheite, freundlicher Kontakt und eine zuverlässige Lieferung.',
  'Der Fahrer war hilfsbereit und hat das Holz am vereinbarten Ort abgeladen.',
  'Ein rundum angenehmer Einkauf. Wir würden wieder bestellen.',
  'Gute Ware und ein verlässlicher Lieferservice. Klare Empfehlung!',
];

const PAGE_SIZE = 3;

export function GermanReviewCarousel() {
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(REVIEWS.length / PAGE_SIZE);
  const visibleReviews = REVIEWS.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <section className="container-app py-10 sm:py-12" aria-labelledby="customer-reviews-title">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#bd682b]">Kundenstimmen · Deutschland</p>
          <h2 id="customer-reviews-title" className="wood-heading mt-2 text-2xl font-semibold text-[#102b1e] sm:text-3xl">
            Gute Erfahrungen mit Kauf und Lieferung
          </h2>
        </div>
        <div className="flex items-center gap-2" aria-label={`Seite ${page + 1} von ${pageCount}`}>
          <button type="button" onClick={() => setPage((current) => (current - 1 + pageCount) % pageCount)} aria-label="Vorherige Bewertungen" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d6c7ad] bg-white text-[#21492d] transition hover:bg-[#f8f4ea]">
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-14 text-center text-xs text-[#645f55]">{page + 1} / {pageCount}</span>
          <button type="button" onClick={() => setPage((current) => (current + 1) % pageCount)} aria-label="Nächste Bewertungen" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d6c7ad] bg-white text-[#21492d] transition hover:bg-[#f8f4ea]">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <p className="mb-5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">
        Demo: Die folgenden 30 Mustertexte sind fiktiv und keine echten Kundenbewertungen. Bitte vor der Veröffentlichung durch verifizierte Rückmeldungen ersetzen.
      </p>

      <div className="grid gap-4 md:grid-cols-3" aria-live="polite">
        {visibleReviews.map((review, index) => (
          <figure key={page * PAGE_SIZE + index} className="flex min-h-44 flex-col rounded-2xl border border-[#e6ddcf] bg-white p-5 shadow-[0_6px_18px_rgba(62,49,32,.07)]">
            <div className="flex gap-1 text-[#bb7b32]" aria-label="5 von 5 Sternen">
              {Array.from({ length: 5 }, (_, star) => <Star key={star} size={14} fill="currentColor" strokeWidth={1.5} />)}
            </div>
            <blockquote lang="de" className="mt-3 flex-1 text-sm leading-6 text-[#514b42]">„{review}“</blockquote>
            <figcaption className="mt-4 border-t border-[#eee7dc] pt-3 text-xs font-semibold text-[#21492d]">Musterbewertung · Deutschland</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
