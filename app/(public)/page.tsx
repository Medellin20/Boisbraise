import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, BadgeCheck, Droplets, Flame, Ruler, Truck } from 'lucide-react';
import { getPublishedWoodProducts } from '@/lib/data/wood-products';
import { WoodProductCard } from '@/components/wood/product-card';
import { FadeIn } from '@/components/ui/fade-in';
import { woodDisplayName } from '@/lib/utils/wood-display';

export const metadata: Metadata = {
  title: 'HolzNest — Brennholz und Lieferung',
  description: 'Wählen Sie Ihr Holz und die Scheitlänge und organisieren Sie die Lieferung mit HolzNest.',
};
export const dynamic = 'force-dynamic';

const benefits = [
  { icon: Droplets, title: 'Garantiert trockenes Holz', text: 'Natürlich unter Dach getrocknet; die Feuchtigkeit wird vor jeder Lieferung geprüft und liegt unter 20 %.' },
  { icon: Ruler, title: 'Fünf Längen', text: '25 cm, 33 cm, 40 cm, 50 cm und 1 m für Ofen, Kamineinsatz, Kamin oder Heizkessel.' },
  { icon: Flame, title: 'Hohe Heizleistung', text: 'Ausgewählte Harthölzer mit hohem Heizwert und lang anhaltender Glut.' },
  { icon: Truck, title: 'Organisierte Lieferung', text: 'Lieferung nach Hause je nach Region, mit bestätigtem Zeitfenster vor der Abfahrt.' },
];

export default async function HomePage() {
  const products = await getPublishedWoodProducts();
  const heroProduct = products.find((product) => product.wood_product_images.some((image) => image.storage_path));
  const heroPhoto = heroProduct?.wood_product_images.find((image) => image.is_primary && image.storage_path)
    ?? heroProduct?.wood_product_images.find((image) => image.storage_path);

  return (
    <main className="wood-home">
      <section className="wood-hero">
        <div className="container-app grid items-center gap-10 py-10 sm:py-14 lg:min-h-[570px] lg:grid-cols-[1fr_0.95fr] lg:gap-12 lg:py-16">
          <FadeIn className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d7c6a8] bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[.15em] text-[#70522f]">
              <span className="h-2 w-2 rounded-full bg-[#527452]" /> HolzNest · die richtige Holzwahl
            </span>
            <h1 className="wood-heading mt-6 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-.04em] text-[#102b1e] sm:text-5xl lg:text-6xl">
              Wärme aus Holz. Ganz einfach.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#625b50] sm:text-lg sm:leading-8">
              Finden Sie die passende Holzart und Scheitlänge für Ihren Ofen. Wir bereiten Ihre Bestellung vor und organisieren die Lieferung zu Ihnen nach Hause.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/catalogue" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#21492d] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(33,73,45,.2)] transition hover:-translate-y-0.5 hover:bg-[#173a22]">
                Katalog entdecken <ArrowRight size={17} />
              </Link>
              <Link href="/contact" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#d9cebd] bg-white/80 px-6 py-3 text-sm font-semibold text-[#24442e] transition hover:bg-white">
                Beratung anfragen
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-[#5c6656]">
              <span className="inline-flex items-center gap-1.5"><BadgeCheck size={15} /> Kontrollierte Feuchtigkeit</span>
              <span className="inline-flex items-center gap-1.5"><Ruler size={15} /> 5 Längen verfügbar</span>
              <span className="inline-flex items-center gap-1.5"><Truck size={15} /> Lieferung nach Termin</span>
            </div>
          </FadeIn>

          <FadeIn delay={0.12} className="relative mx-auto w-full max-w-[620px] lg:max-w-none">
            <div className="wood-hero-image relative aspect-[1.18] overflow-hidden rounded-[30px] border border-white/70 shadow-[0_24px_65px_rgba(49,56,36,.2)]">
              <Image src={heroPhoto?.url ?? "/images/wood/logs-oak.svg"} alt={heroPhoto?.alt_text || (heroProduct ? `Brennholzscheite aus ${woodDisplayName(heroProduct.name)}` : "Lieferfertige Eichenholzscheite")} fill priority sizes="(max-width: 1023px) 100vw, 48vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#15291f]/65 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white sm:p-7">
                <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-white/75">Unsere Auswahl</p><p className="mt-1 text-2xl font-semibold">{heroProduct ? woodDisplayName(heroProduct.name) : "Eiche, Buche, Esche"}</p></div>
                <span className="hidden rounded-full border border-white/40 bg-white/15 px-3 py-2 text-xs font-medium backdrop-blur sm:inline-flex">Bereit für Ihr Zuhause</span>
              </div>
            </div>
            <div className="wood-hero-note absolute -bottom-5 left-4 rounded-2xl border border-[#e5dac8] bg-[#fffdf8] px-4 py-3 shadow-lg sm:-left-5 sm:px-5">
              <p className="text-xs text-[#777064]">Die passende Scheitlänge für Ihren Ofen</p>
              <p className="mt-1 font-semibold text-[#24442e]">25 cm · 33 cm · 40 cm · 50 cm · 1 m</p>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="wood-benefits" aria-label="Ihre Vorteile mit HolzNest">
        <div className="container-app grid gap-4 py-12 sm:grid-cols-2 xl:grid-cols-4">
          {benefits.map(({ icon: Icon, title, text }, index) => (
            <FadeIn key={title} delay={index * 0.07}>
              <article className="wood-benefit-card h-full rounded-[22px] border border-[#e6ddcf] bg-white p-6 shadow-[0_8px_22px_rgba(62,49,32,.08)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf1ed] text-[#264b32]"><Icon size={20} /></span>
                <h2 className="wood-heading mt-4 text-[19px] font-semibold text-[#102b1e]">{title}</h2>
                <p className="mt-2 text-sm leading-5 text-[#645f55]">{text}</p>
              </article>
            </FadeIn>
          ))}
        </div>
      </section>

      <section id="essences" className="wood-catalog">
        <div className="container-app py-12 sm:py-16">
          <div className="flex items-end justify-between gap-5">
            <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#bd682b]">Unsere Holzarten</p><h2 className="wood-heading mt-2 text-4xl font-medium text-[#102b1e] sm:text-5xl">Wählen Sie Ihr Holz</h2></div>
            <Link href="/catalogue" className="hidden items-center gap-2 rounded-xl border border-[#e3d9c8] bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition hover:bg-[#f9f5ed] sm:inline-flex">Zum gesamten Katalog <ArrowRight size={16} /></Link>
          </div>
          {products.length ? (
            <div className="mt-9 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {products.slice(0, 3).map((product, index) => <FadeIn key={product.id} delay={index * 0.1}><WoodProductCard product={product} /></FadeIn>)}
            </div>
          ) : (
            <div className="mt-9 rounded-2xl border border-dashed border-[#d7cdbb] bg-white/70 p-10 text-center text-sm text-[#645f55]">Unsere Auswahl ist bald verfügbar.</div>
          )}
          <p className="mt-5 text-xs text-[#766e62]">Preise pro m³ (Raummeter). Verfügbarkeit und Lieferung werden je nach Region bestätigt.</p>
        </div>
      </section>

      <section className="wood-winter-section relative overflow-hidden py-14 sm:py-20">
        <div className="wood-winter-glow" aria-hidden="true" />
        <FadeIn className="container-app relative">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d6c7ad] bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[.16em] text-[#765633]"><Flame size={15} /> Bereiten Sie sich auf die kalte Jahreszeit vor</span>
            <h2 className="wood-heading mt-5 text-3xl font-medium text-[#102b1e] sm:text-5xl">Wie viele m³ Holz brauchen Sie im Winter?</h2>
            <p className="mx-auto mt-4 max-w-4xl text-sm leading-6 text-[#645f55] sm:text-base">Für ein 100 m² großes Haus mit Holz als Hauptheizung benötigen Sie etwa 4 bis 6 m³. Für gelegentliches Heizen reichen meist 2 bis 3 m³. Der Gesamtpreis wird anhand der gewählten Scheitlänge und Menge berechnet.</p>
            <p className="mt-2 text-xs text-[#867b69]">Richtwert: Der Bedarf hängt von Dämmung, Klima und Heizgerät ab.</p>
            <Link href="/catalogue" className="wood-cta mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#21492d] px-8 py-3 text-sm font-semibold text-white shadow-[0_5px_14px_rgba(33,73,45,.2)] transition hover:bg-[#173a22]">Holz bestellen <ArrowRight size={16} /></Link>
          </div>
        </FadeIn>
      </section>

      <section className="border-t border-[#e7ddca] bg-[#f8f4ea] py-12 sm:py-16">
        <div className="container-app flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#bd682b]">Sie brauchen Beratung?</p><h2 className="wood-heading mt-2 text-3xl font-medium text-[#102b1e]">Finden Sie die richtige Scheitlänge für Ihren Ofen.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#645f55]">Kontaktieren Sie uns, um Verfügbarkeit, Preis und Lieferung an Ihren Wohnort zu klären.</p></div>
          <Link href="/contact" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#21492d] px-5 py-3 text-sm font-semibold text-white hover:bg-[#173a22]">Angebot anfragen <ArrowRight size={17} /></Link>
        </div>
      </section>
    </main>
  );
}
