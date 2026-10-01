'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Trees, LogOut, Menu, X, CreditCard, Mail } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { logoutAdmin } from '@/actions/admin-auth';

const NAV_ITEMS = [
  { href: '/admin', label: 'Übersicht', icon: LayoutDashboard, exact: true },
  { href: '/admin/bois', label: 'Holzkatalog', icon: Trees },
  { href: '/admin/paiement', label: 'Zahlung & Bankverbindung', icon: CreditCard },
  { href: '/admin/kontakt', label: 'Footer-Kontaktdaten', icon: Mail },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain px-3 py-4">
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
              isActive ? 'bg-white/10 text-white' : 'text-sand-300 hover:bg-white/5 hover:text-white'
            )}
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => { if (desktop.matches) setMobileOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  React.useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLElement>('button')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
      if (event.key !== 'Tab') return;
      const controls = panelRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      menuButtonRef.current?.focus();
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden h-dvh w-64 shrink-0 flex-col border-r border-white/10 bg-ink-950 lg:sticky lg:top-0 lg:flex">
        <SidebarHeader />
        <NavLinks pathname={pathname} />
        <LogoutSection />
      </aside>

      {/* Topbar mobile */}
      <div className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-ink-100 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/admin" className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-700 text-white">
            <Trees className="h-4 w-4" />
          </span>
          <span className="truncate font-extrabold text-ink-900">HolzNest</span>
        </Link>
        <button
          type="button"
          ref={menuButtonRef}
          aria-expanded={mobileOpen}
          aria-controls="admin-mobile-menu"
          onClick={() => setMobileOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-700"
          aria-label="Admin-Menü öffnen"
        >
          <Menu className="h-5.5 w-5.5" />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-ink-950/60" onClick={() => setMobileOpen(false)} />
          <div ref={panelRef} id="admin-mobile-menu" role="dialog" aria-modal="true" aria-label="Administrationsnavigation" className="relative flex h-dvh w-[min(18rem,calc(100vw-2rem))] flex-col bg-ink-950 shadow-2xl">
            <div className="flex shrink-0 items-center justify-between px-5 py-4">
              <SidebarHeader compact />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sand-300 hover:bg-white/10"
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            <LogoutSection />
          </div>
        </div>
      )}
    </>
  );
}

function SidebarHeader({ compact }: { compact?: boolean }) {
  return (
    <Link href="/admin" className={cn('flex items-center gap-2', !compact && 'px-5 py-5')}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
        <Trees className="h-4.5 w-4.5 text-white" />
      </span>
      <div>
        <p className="text-sm font-extrabold text-white">HolzNest</p>
        <p className="text-[11px] font-medium uppercase tracking-wide text-sand-400">Verwaltung</p>
      </div>
    </Link>
  );
}

function LogoutSection() {
  return (
    <div className="shrink-0 border-t border-white/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <form action={logoutAdmin}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-sand-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4.5 w-4.5" />
          Abmelden
        </button>
      </form>
    </div>
  );
}
