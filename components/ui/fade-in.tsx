'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

// Server-rendered content stays visible without JavaScript. Only elements below
// the viewport are prepared for a single reveal; no scroll listeners are needed.
export function FadeIn({ children, delay = 0, className }: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !('IntersectionObserver' in window)) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const show = () => { delete element.dataset.reveal; };
    if (preference.matches) return;
    if (element.getBoundingClientRect().top >= window.innerHeight) {
      element.dataset.reveal = 'pending';
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      element.dataset.reveal = 'visible';
      observer.disconnect();
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
    const onPreferenceChange = () => {
      if (preference.matches) { observer.disconnect(); show(); }
    };
    observer.observe(element);
    preference.addEventListener('change', onPreferenceChange);
    return () => {
      observer.disconnect();
      preference.removeEventListener('change', onPreferenceChange);
      show();
    };
  }, []);

  return <div ref={ref} className={className} style={{ '--reveal-delay': `${Math.min(Math.max(delay, 0), 0.2)}s` } as CSSProperties}>{children}</div>;
}
