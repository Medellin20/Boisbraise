'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Pause, Play, TreePine } from 'lucide-react';

function Firelight({ paused }: { paused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let visible = true;
    let last = 0;
    let width = 0;
    let height = 0;
    const sparks = Array.from({ length: 32 }, (_, i) => ({
      life: i / 32, speed: .045 + Math.random() * .055,
      drift: (Math.random() - .5) * 130, size: .6 + Math.random() * 1.3,
      phase: Math.random() * Math.PI * 2,
    }));
    const resize = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width; height = rect.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * ratio; canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    });
    resize.observe(canvas);
    function draw(now: number) {
      frame = 0;
      if (paused || motion.matches || !visible || document.hidden) {
        context!.clearRect(0, 0, width, height);
        last = 0;
        return;
      }
      const delta = last ? Math.min((now - last) / 1000, .05) : 0;
      last = now;
      context!.clearRect(0, 0, width, height);
      context!.globalCompositeOperation = 'screen';
      const originX = width * (width < 768 ? .71 : .76);
      const originY = height * .73;
      // Translucent moving tongues add life to the photographic fire beneath.
      for (let i = 0; i < 9; i++) {
        const pulse = Math.sin(now * .003 + i * 2.3);
        const x = originX + Math.sin(i * 3.1) * 32 + pulse * 5;
        const flameHeight = 30 + (pulse + 1) * 20;
        const glow = context!.createRadialGradient(x, originY - flameHeight * .35, 0, x, originY - flameHeight * .35, flameHeight);
        glow.addColorStop(0, 'rgba(255,218,124,.15)');
        glow.addColorStop(.35, 'rgba(255,132,32,.09)');
        glow.addColorStop(1, 'rgba(255,88,10,0)');
        context!.fillStyle = glow;
        context!.beginPath();
        context!.ellipse(x, originY - flameHeight * .5, 14 + pulse * 3, flameHeight, pulse * .13, 0, Math.PI * 2);
        context!.fill();
        const tipX = x + Math.sin(now * .004 + i) * 13;
        const flame = context!.createLinearGradient(x, originY, tipX, originY - flameHeight * 1.8);
        flame.addColorStop(0, 'rgba(255,225,140,.38)');
        flame.addColorStop(.45, 'rgba(255,158,38,.23)');
        flame.addColorStop(1, 'rgba(255,94,12,0)');
        context!.fillStyle = flame;
        context!.beginPath();
        context!.moveTo(x - 9, originY);
        context!.bezierCurveTo(x - 19, originY - 25, tipX + 12, originY - flameHeight, tipX, originY - flameHeight * 1.8);
        context!.bezierCurveTo(tipX + 30, originY - flameHeight * .6, x + 19, originY - 18, x + 9, originY);
        context!.fill();
      }
      for (const spark of sparks) {
        spark.life = (spark.life + delta * spark.speed) % 1;
        const x = originX + spark.drift * spark.life + Math.sin(spark.phase + spark.life * 8) * 14;
        const y = originY - spark.life * height * .58;
        const alpha = Math.sin(spark.life * Math.PI) * .8;
        context!.shadowBlur = 7;
        context!.shadowColor = '#ff9e36';
        context!.fillStyle = `rgba(255,${155 + Math.round(65 * (1 - spark.life))},76,${alpha})`;
        context!.beginPath();
        context!.ellipse(x, y, spark.size, spark.size * 1.65, -.3, 0, Math.PI * 2);
        context!.fill();
      }
      context!.shadowBlur = 0;
      frame = requestAnimationFrame(draw);
    }
    const restart = () => { if (!frame) frame = requestAnimationFrame(draw); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; restart(); });
    observer.observe(canvas);
    motion.addEventListener('change', restart);
    document.addEventListener('visibilitychange', restart);
    restart();
    return () => {
      cancelAnimationFrame(frame); resize.disconnect(); observer.disconnect();
      motion.removeEventListener('change', restart);
      document.removeEventListener('visibilitychange', restart);
    };
  }, [paused]);
  return <canvas ref={canvasRef} className="forest-fire" aria-hidden="true" />;
}

export function ForestHero() {
  const [paused, setPaused] = useState(false);
  return (
    <section className="forest-hero" data-paused={paused} aria-labelledby="forest-title">
      <div className="forest-scenery" aria-hidden="true">
        <Image src="/images/forest-fire-hero.webp" alt="" fill priority sizes="100vw" quality={85} className="forest-photo" />
      </div>
      <div className="forest-shade" aria-hidden="true" />
      <div className="forest-warmth" aria-hidden="true" />
      <Firelight paused={paused} />
      <div className="container-app forest-content">
        <p className="forest-eyebrow"><TreePine size={16} strokeWidth={1.5} /> HOLZNEST · NATÜRLICH WARM</p>
        <h1 id="forest-title">Wärme aus Holz.<br /><span>Ganz einfach.</span></h1>
        <p className="forest-description">Gutes Holz. Wohltuende Wärme. Finden Sie das passende Brennholz für Ihr Zuhause – mit Lieferung bis zu Ihnen.</p>
        <div className="forest-actions">
          <Link href="/catalogue" className="forest-button forest-button-primary">Holzkatalog entdecken <ArrowRight size={18} /></Link>
          <Link href="/contact" className="forest-button forest-button-secondary">Beratung anfragen</Link>
        </div>
        <p className="forest-signature"><span /> Vom Wald zur Wärme. Mit HolzNest.</p>
      </div>
      <div className="forest-bottom container-app">
        <span>HOLZ. FEUER. ZUHAUSE.</span>
        <button type="button" onClick={() => setPaused(!paused)} aria-label={paused ? 'Animation abspielen' : 'Animation pausieren'} aria-pressed={paused} className="forest-motion-toggle">
          {paused ? <Play size={14} /> : <Pause size={14} />}<span>{paused ? 'Animation abspielen' : 'Animation pausieren'}</span>
        </button>
      </div>
    </section>
  );
}
