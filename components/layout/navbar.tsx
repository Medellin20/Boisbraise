'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Trees,
  CircleHelp,
  Home,
  Info,
  Mail,
  Menu,
  Search,
  Workflow,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { LanguageTranslator } from '@/components/layout/language-translator';

const NAV_LINKS = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/catalogue', label: 'Catalogue bois', icon: Trees },
  { href: '/comment-ca-marche', label: 'Commande & livraison', icon: Workflow },
  { href: '/a-propos', label: 'À propos', icon: Info },
  { href: '/contact', label: 'Contact', icon: Mail },
];

function isActivePath(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [tabletOpen, setTabletOpen] = React.useState(false);
  const tabletMenuRef = React.useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    setMobileOpen(false);
    setTabletOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  React.useEffect(() => {
    const tablet = window.matchMedia('(min-width: 768px)');
    const desktop = window.matchMedia('(min-width: 1400px)');
    const closeMenus = () => { setMobileOpen(false); setTabletOpen(false); };
    tablet.addEventListener('change', closeMenus);
    desktop.addEventListener('change', closeMenus);
    return () => { tablet.removeEventListener('change', closeMenus); desktop.removeEventListener('change', closeMenus); };
  }, []);

  React.useEffect(() => {
    if (!tabletOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!tabletMenuRef.current?.contains(event.target as Node)) setTabletOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setTabletOpen(false);
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [tabletOpen]);

  return (
    <header
      className={cn(
        'site-nav sticky top-0 z-50 w-full border-b transition-all duration-300',
        scrolled
          ? 'border-ink-100 bg-white/95 shadow-soft backdrop-blur-xl'
          : 'border-transparent bg-sand-100/85 backdrop-blur-lg'
      )}
    >
      <nav className="container-app flex h-16 items-center justify-between md:h-20">
        <Link href="/" aria-label="HolzNest — Accueil" className="flex items-center gap-2 shrink-0">
          <span className="brand-mark" aria-hidden="true">HN</span>
          <span className="brand-name">Holz<span className="brand-dot">Nest</span></span>
        </Link>

        <div className="hidden items-center gap-1 min-[1400px]:flex">
          {NAV_LINKS.slice(0, 4).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActivePath(pathname, link.href) ? 'page' : undefined}
              className={cn(
                'rounded-full px-3.5 py-2 text-sm font-semibold transition-colors',
                isActivePath(pathname, link.href)
                  ? 'bg-ink-950 text-white'
                  : 'text-ink-600 hover:bg-white hover:text-ink-950'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageTranslator id="desktop-language-translator" />
          <Button asChild size="md">
            <Link href="/catalogue">
              <Search className="h-4 w-4" />
              Voir le catalogue
            </Link>
          </Button>
          <div ref={tabletMenuRef} className="relative min-[1400px]:hidden">
            <button
              type="button"
              onClick={() => setTabletOpen((open) => !open)}
              aria-expanded={tabletOpen}
              aria-controls="main-dropdown-menu"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-ink-200 bg-white px-3.5 py-2 text-sm font-semibold text-ink-700 hover:bg-sand-100"
            >
              <Menu className="h-4.5 w-4.5" /> Menu
            </button>
            <AnimatePresence>
              {tabletOpen && (
                <motion.div id="main-dropdown-menu" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute right-0 top-full mt-2 max-h-[calc(100dvh-6rem)] w-64 overflow-y-auto overscroll-contain rounded-2xl border border-ink-100 bg-white p-2 shadow-lifted">
                  {NAV_LINKS.map((link) => (
                    <Link key={link.href} href={link.href} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-sand-100', isActivePath(pathname, link.href) ? 'bg-sand-100 text-ink-900' : 'text-ink-600')}>
                      <link.icon className="h-4.5 w-4.5 text-canal-600" /> {link.label}
                    </Link>
                  ))}
                  <Link href="/faq" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-sand-100"><CircleHelp className="h-4.5 w-4.5 text-canal-600" /> Questions fréquentes</Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:hidden">
          <LanguageTranslator id="mobile-language-translator" />
          <button
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-ink-700 hover:bg-sand-100"
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              id="mobile-navigation"
              aria-label="Navigation principale"
              className="absolute inset-x-0 top-full z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-ink-100 bg-white shadow-lifted md:hidden"
            >
              <div className="container-app py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.02 + i * 0.025 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={isActivePath(pathname, link.href) ? 'page' : undefined}
                      className={cn(
                        'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                        isActivePath(pathname, link.href)
                          ? 'bg-sand-100 text-ink-900'
                          : 'text-ink-600 hover:bg-sand-100'
                      )}
                    >
                      <link.icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                <Link
                  href="/faq"
                  className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-600 hover:bg-sand-100"
                >
                  <CircleHelp className="h-5 w-5" />
                  Questions fréquentes
                </Link>
              </div>
            </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
