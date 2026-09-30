'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Recharge notamment les prix quand on revient du formulaire admin dans un autre onglet. */
export function RefreshOnReturn() {
  const router = useRouter();

  useEffect(() => {
    let lastRefresh = 0;
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      // focus et visibilitychange peuvent signaler le même retour dans l'onglet.
      const now = Date.now();
      if (now - lastRefresh < 1000) return;
      lastRefresh = now;
      router.refresh();
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) refresh();
    };

    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [router]);

  return null;
}
