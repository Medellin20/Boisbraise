import Link from 'next/link';
import { Facebook, TreePine, Instagram, Linkedin, Mail, Phone } from 'lucide-react';
import { GermanReviewCarousel } from '@/components/shared/german-review-carousel';

const COLUMN_LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/catalogue', label: 'Catalogue bois' },
  { href: '/comment-ca-marche', label: 'Comment ça marche' },
  { href: '/a-propos', label: 'À propos' },
  { href: '/contact', label: 'Contact' },
  { href: '/faq', label: 'FAQ' },
];

const LEGAL_LINKS = [
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/confidentialite', label: 'Confidentialité' },
  { href: '/conditions-generales', label: 'Conditions générales' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer border-t border-ink-100 bg-sand-200 text-ink-700">
      <GermanReviewCarousel />
      <div className="container-app grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#21492d] text-white">
              <TreePine className="h-4.5 w-4.5" strokeWidth={2.25} />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-ink-900">
              HolzNest
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-600">
            Bois de chauffage, grumes et bois de construction. Une offre adaptée à votre projet, avec livraison à organiser.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a
              href="#"
              aria-label="Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-sand-100 text-ink-700 transition-colors hover:bg-sand-300 hover:text-ink-900"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-sand-100 text-ink-700 transition-colors hover:bg-sand-300 hover:text-ink-900"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="#"
              aria-label="LinkedIn"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-sand-100 text-ink-700 transition-colors hover:bg-sand-300 hover:text-ink-900"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-eyebrow uppercase text-ink-600">Navigation</h3>
          <ul className="mt-4 space-y-2.5">
            {COLUMN_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-ink-600 transition-colors hover:text-ink-900">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-eyebrow uppercase text-ink-600">Informations légales</h3>
          <ul className="mt-4 space-y-2.5">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-ink-600 transition-colors hover:text-ink-900">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-eyebrow uppercase text-ink-600">Contact</h3>
          <ul className="mt-4 space-y-3">
            <li>
              <a
                href="mailto:kontakt@holznest.de"
                className="flex min-w-0 items-center gap-2.5 break-all text-sm text-ink-600 transition-colors hover:text-ink-900"
              >
                <Mail className="h-4 w-4 shrink-0" />
                kontakt@holznest.de
              </a>
            </li>
            <li>
              <a
                href="tel:+31201234567"
                className="flex items-center gap-2.5 text-sm text-ink-600 transition-colors hover:text-ink-900"
              >
                <Phone className="h-4 w-4 shrink-0" />
                +33 1 23 45 67 89
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-200">
        <div className="container-app flex flex-col items-center justify-between gap-3 py-5 text-xs text-ink-600 sm:flex-row">
          <p>© {year} HolzNest. Tous droits réservés.</p>
          <p>Bois, vente et livraison</p>
        </div>
      </div>
    </footer>
  );
}
