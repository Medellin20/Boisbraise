'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowRight, Pause, Play, TreePine } from 'lucide-react';

const pollen = Array.from({ length: 24 }, (_, index) => ({
  '--particle-x': `${(index * 37 + 13) % 100}%`,
  '--particle-y': `${(index * 23 + 7) % 95}%`,
  '--particle-delay': `${-index * 1.7}s`,
  '--particle-time': `${18 + index % 7 * 3}s`,
  '--particle-size': `${2 + index % 3}px`,
}) as CSSProperties);

export function ForestHero() {
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    const update = () => {
      frame = 0;
      const rect = hero.getBoundingClientRect();
      const enabled = !paused && !motion.matches && rect.bottom > 0 && rect.top < window.innerHeight && !document.hidden;
      hero.style.setProperty('--scene-x', `${enabled ? pointerX * 7 : 0}px`);
      hero.style.setProperty('--scene-y', `${enabled ? pointerY * 4 + Math.max(-24, Math.min(24, -rect.top * .045)) : 0}px`);
      hero.style.setProperty('--log-tilt', `${enabled ? pointerX * -2 : 0}deg`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const rect = hero.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width - .5;
      pointerY = (event.clientY - rect.top) / rect.height - .5;
      schedule();
    };
    const reset = () => { pointerX = 0; pointerY = 0; schedule(); };
    const visibility = () => { setTabVisible(!document.hidden); schedule(); };
    const observer = new IntersectionObserver(([entry]) => { setInView(entry.isIntersecting); schedule(); });
    observer.observe(hero);
    hero.addEventListener('pointermove', pointer);
    hero.addEventListener('pointerleave', reset);
    window.addEventListener('scroll', schedule, { passive: true });
    motion.addEventListener('change', schedule);
    document.addEventListener('visibilitychange', visibility);
    visibility();
    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      hero.removeEventListener('pointermove', pointer);
      hero.removeEventListener('pointerleave', reset);
      window.removeEventListener('scroll', schedule);
      motion.removeEventListener('change', schedule);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [paused]);

  return (
    <section ref={heroRef} className="forest-hero" data-paused={paused || !inView || !tabVisible} aria-labelledby="forest-title">
      <div className="forest-landscape" aria-hidden="true">
        <div className="forest-scenery">
          <Image src="/images/forest-sunrise-hero.webp" alt="" fill priority sizes="100vw" quality={85} className="forest-photo" />
        </div>
        <div className="forest-tree-canopy" />
        <div className="forest-sun" />
        <div className="forest-rays" />
        <div className="forest-delivery-route">
          <div className="forest-truck">
            <Image src="/images/holznest-delivery-truck.webp" alt="" fill sizes="240px" className="forest-truck-image" />
            <Image src="/images/holznest-logo-transparent.png" alt="" width={80} height={60} className="forest-truck-logo" />
          </div>
        </div>
      </div>
      <div className="forest-shade" aria-hidden="true" />
      <div className="forest-pollen" aria-hidden="true">{pollen.map((style, index) => <i key={index} style={style} />)}</div>
      <div className="forest-logs" aria-hidden="true">
        <Image src="/images/forest-foreground-logs.webp" alt="" fill sizes="(max-width: 767px) 230px, 420px" />
      </div>
      <div className="container-app forest-content">
        <p className="forest-eyebrow"><TreePine size={16} strokeWidth={1.5} /> HOLZNEST · NATÜRLICH WARM</p>
        <h1 id="forest-title" aria-label="Von der Natur direkt zu Ihnen.">
          <span className="forest-title-line" aria-hidden="true"><span>Von der Natur</span></span>
          <span className="forest-title-line forest-title-gold" aria-hidden="true"><span>direkt zu Ihnen.</span></span>
        </h1>
        <p className="forest-description">Natürliches Brennholz für ein warmes Zuhause. Entdecken Sie unsere Holzarten – wir organisieren die Lieferung zu Ihnen.</p>
        <div className="forest-actions">
          <Link href="/catalogue" className="forest-button forest-button-primary">Holz entdecken <ArrowRight size={18} /></Link>
          <Link href="/comment-ca-marche" className="forest-button forest-button-secondary">Mehr erfahren <ArrowRight size={16} /></Link>
        </div>
        <p className="forest-signature"><span /> Aus der Natur. Für Ihr Zuhause.</p>
      </div>
      <div className="forest-bottom container-app">
        <span>NATUR. HOLZ. ZUHAUSE.</span>
        <button type="button" onClick={() => setPaused(!paused)} aria-label={paused ? 'Animation abspielen' : 'Animation pausieren'} aria-pressed={paused} className="forest-motion-toggle">
          {paused ? <Play size={14} /> : <Pause size={14} />}<span>{paused ? 'Animation abspielen' : 'Animation pausieren'}</span>
        </button>
      </div>
    </section>
  );
}
