import Link from 'next/link';
import { ArrowRight, Mail, Phone, TreePine } from 'lucide-react';
import { GermanReviewCarousel } from '@/components/shared/german-review-carousel';
import { createClient } from '@/lib/supabase/server';

const COLUMN_LINKS = [
  { href: '/', label: 'Startseite' },
  { href: '/catalogue', label: 'Holzkatalog' },
  { href: '/comment-ca-marche', label: 'So funktioniert es' },
  { href: '/a-propos', label: 'Über uns' },
  { href: '/faq', label: 'Häufige Fragen' },
];

const LEGAL_LINKS = [
  { href: '/mentions-legales', label: 'Impressum' },
  { href: '/confidentialite', label: 'Datenschutz' },
  { href: '/conditions-generales', label: 'Allgemeine Geschäftsbedingungen' },
];

export async function Footer() {
  const year = new Date().getFullYear();
  const supabase = createClient();
  const { data, error } = await supabase
    .from('site_contact_settings')
    .select('contact_email,phone_numbers')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    console.error('Footer-Kontaktdaten konnten nicht geladen werden.', error);
  }

  const email = typeof data?.contact_email === 'string' ? data.contact_email.trim() : '';
  const phoneNumbers = Array.isArray(data?.phone_numbers)
    ? data.phone_numbers.filter((phone: unknown): phone is string => typeof phone === 'string')
    : [];

  return (
    <footer className="site-footer border-t border-ink-100">
      <GermanReviewCarousel />
      <div className="bg-ink-950 text-sand-100">
        <div className="border-b border-white/10">
          <div className="container-app flex flex-col gap-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:py-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-sand-300">HolzNest · Holz mit Herkunft</p>
              <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                Das passende Holz für Ihr Vorhaben.
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-sand-300">
                Entdecken Sie unser Sortiment und lassen Sie sich ein persönliches Angebot erstellen.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#31563b] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#3d6949]"
            >
              Kontakt aufnehmen
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="container-app grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8 lg:py-14">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sand-100">
                <TreePine className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <span className="text-xl font-extrabold tracking-tight text-white">HolzNest</span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-sand-300">
              Brennholz, Rundholz und Bauholz – sorgfältig ausgewählt und zuverlässig zu Ihnen geliefert.
            </p>
          </div>

          <nav aria-label="Footer-Navigation">
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-sand-200">Entdecken</h3>
            <ul className="mt-5 space-y-3">
              {COLUMN_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-sand-300 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Rechtliche Informationen">
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-sand-200">Informationen</h3>
            <ul className="mt-5 space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-sand-300 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/contact" className="text-sm text-sand-300 transition-colors hover:text-white">
                  Kontaktformular
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-sand-200">Kontakt</h3>
            <ul className="mt-5 space-y-4">
              {email ? (
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="flex min-w-0 items-start gap-3 break-all text-sm text-sand-300 transition-colors hover:text-white"
                  >
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-sand-200" />
                    {email}
                  </a>
                </li>
              ) : null}
              {phoneNumbers.map((phone, index) => (
                <li key={`${phone}-${index}`}>
                  <a
                    href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                    className="flex items-start gap-3 text-sm text-sand-300 transition-colors hover:text-white"
                  >
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-sand-200" />
                    {phone}
                  </a>
                </li>
              ))}
              {!email && phoneNumbers.length === 0 ? (
                <li className="flex items-start gap-3 text-sm text-sand-300">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-sand-200" />
                  Schreiben Sie uns über das Kontaktformular.
                </li>
              ) : null}
              <li>
                <Link href="/contact" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-sand-200">
                  Nachricht senden
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="container-app flex flex-col items-center justify-between gap-3 py-5 text-xs text-sand-300 sm:flex-row">
            <p>© {year} HolzNest. Alle Rechte vorbehalten.</p>
            <p>Holzverkauf · Beratung · Lieferung</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
