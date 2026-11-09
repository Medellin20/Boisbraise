'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Pause, Play, TreePine } from 'lucide-react';

export function ForestHero() {
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const visibility = () => setTabVisible(!document.hidden);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(hero);
    document.addEventListener('visibilitychange', visibility);
    visibility();
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  return (
    <section ref={heroRef} className="forest-hero" data-paused={paused || !inView || !tabVisible} aria-labelledby="forest-title">
      <div className="forest-landscape" aria-hidden="true">
        <div className="forest-scenery">
          <Image src="/images/wood/stacked-firewood-hero.webp" alt="" fill priority sizes="100vw" quality={85} className="forest-photo" />
        </div>
      </div>
      <div className="forest-shade" aria-hidden="true" />
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
