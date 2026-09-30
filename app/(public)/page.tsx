import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, BadgeCheck, Droplets, Flame, Ruler, Truck } from 'lucide-react';
import { getPublishedWoodProducts } from '@/lib/data/wood-products';
import { WoodProductCard } from '@/components/wood/product-card';
import { FadeIn } from '@/components/ui/fade-in';

export const metadata: Metadata = {
  title: 'HolzNest — Bois de chauffage et livraison',
  description: 'Choisissez votre bois, vos longueurs de bûches et demandez une livraison organisée avec HolzNest.',
};
export const dynamic = 'force-dynamic';

const benefits = [
  { icon: Droplets, title: 'Bois sec garanti', text: 'Séchage naturel sous abri, humidité mesurée sous 20 % avant chaque départ.' },
  { icon: Ruler, title: 'Cinq longueurs', text: '25 cm, 33 cm, 40 cm, 50 cm et 1 m pour poêle, insert, cheminée ou chaudière.' },
  { icon: Flame, title: 'Haute performance', text: 'Essences dures sélectionnées pour leur pouvoir calorifique et leurs braises durables.' },
  { icon: Truck, title: 'Livraison organisée', text: 'Livraison à domicile selon votre zone, avec un créneau confirmé avant le départ.' },
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
              <span className="h-2 w-2 rounded-full bg-[#527452]" /> HolzNest · le bois bien choisi
            </span>
            <h1 className="wood-heading mt-6 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-.04em] text-[#102b1e] sm:text-5xl lg:text-6xl">
              La chaleur du bois, simplement.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#625b50] sm:text-lg sm:leading-8">
              Trouvez l’essence et la longueur adaptées à votre foyer. Nous préparons votre commande et organisons la livraison chez vous.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/catalogue" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#21492d] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(33,73,45,.2)] transition hover:-translate-y-0.5 hover:bg-[#173a22]">
                Découvrir le catalogue <ArrowRight size={17} />
              </Link>
              <Link href="/contact" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#d9cebd] bg-white/80 px-6 py-3 text-sm font-semibold text-[#24442e] transition hover:bg-white">
                Demander un conseil
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-[#5c6656]">
              <span className="inline-flex items-center gap-1.5"><BadgeCheck size={15} /> Humidité contrôlée</span>
              <span className="inline-flex items-center gap-1.5"><Ruler size={15} /> 5 longueurs disponibles</span>
              <span className="inline-flex items-center gap-1.5"><Truck size={15} /> Livraison sur rendez-vous</span>
            </div>
          </FadeIn>

          <FadeIn delay={0.12} className="relative mx-auto w-full max-w-[620px] lg:max-w-none">
            <div className="wood-hero-image relative aspect-[1.18] overflow-hidden rounded-[30px] border border-white/70 shadow-[0_24px_65px_rgba(49,56,36,.2)]">
              <Image src={heroPhoto?.url ?? "/images/wood/logs-oak.svg"} alt={heroPhoto?.alt_text || (heroProduct ? `Bûches de ${heroProduct.name}` : "Bûches de chêne prêtes à être livrées")} fill priority sizes="(max-width: 1023px) 100vw, 48vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#15291f]/65 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white sm:p-7">
                <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-white/75">Une sélection essentielle</p><p className="mt-1 text-2xl font-semibold">{heroProduct ? heroProduct.name : "Chêne, hêtre, frêne"}</p></div>
                <span className="hidden rounded-full border border-white/40 bg-white/15 px-3 py-2 text-xs font-medium backdrop-blur sm:inline-flex">Prêts pour votre foyer</span>
              </div>
            </div>
            <div className="wood-hero-note absolute -bottom-5 left-4 rounded-2xl border border-[#e5dac8] bg-[#fffdf8] px-4 py-3 shadow-lg sm:-left-5 sm:px-5">
              <p className="text-xs text-[#777064]">La bonne longueur, au bon endroit</p>
              <p className="mt-1 font-semibold text-[#24442e]">25 cm · 33 cm · 40 cm · 50 cm · 1 m</p>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="wood-benefits" aria-label="Les avantages HolzNest">
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
            <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#bd682b]">Nos essences</p><h2 className="wood-heading mt-2 text-4xl font-medium text-[#102b1e] sm:text-5xl">Choisissez votre bois</h2></div>
            <Link href="/catalogue" className="hidden items-center gap-2 rounded-xl border border-[#e3d9c8] bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition hover:bg-[#f9f5ed] sm:inline-flex">Tout le catalogue <ArrowRight size={16} /></Link>
          </div>
          {products.length ? (
            <div className="mt-9 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {products.slice(0, 3).map((product, index) => <FadeIn key={product.id} delay={index * 0.1}><WoodProductCard product={product} /></FadeIn>)}
            </div>
          ) : (
            <div className="mt-9 rounded-2xl border border-dashed border-[#d7cdbb] bg-white/70 p-10 text-center text-sm text-[#645f55]">Notre sélection sera bientôt disponible.</div>
          )}
          <p className="mt-5 text-xs text-[#766e62]">Prix affichés au m³ (stère). Disponibilité et livraison à confirmer selon votre zone.</p>
        </div>
      </section>

      <section className="wood-winter-section relative overflow-hidden py-14 sm:py-20">
        <div className="wood-winter-glow" aria-hidden="true" />
        <FadeIn className="container-app relative">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d6c7ad] bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[.16em] text-[#765633]"><Flame size={15} /> Préparez la saison froide</span>
            <h2 className="wood-heading mt-5 text-3xl font-medium text-[#102b1e] sm:text-5xl">Combien de m³ pour votre hiver ?</h2>
            <p className="mx-auto mt-4 max-w-4xl text-sm leading-6 text-[#645f55] sm:text-base">Comptez environ 4 à 6 m³ pour un chauffage principal dans une maison de 100 m², et 2 à 3 m³ pour un usage d’agrément. Le prix total se calcule automatiquement selon la longueur et le volume choisi.</p>
            <p className="mt-2 text-xs text-[#867b69]">Estimation indicative : les besoins varient selon l’isolation, le climat et l’appareil de chauffage.</p>
            <Link href="/catalogue" className="wood-cta mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#21492d] px-8 py-3 text-sm font-semibold text-white shadow-[0_5px_14px_rgba(33,73,45,.2)] transition hover:bg-[#173a22]">Commander mon bois <ArrowRight size={16} /></Link>
          </div>
        </FadeIn>
      </section>

      <section className="border-t border-[#e7ddca] bg-[#f8f4ea] py-12 sm:py-16">
        <div className="container-app flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#bd682b]">Besoin d’un conseil ?</p><h2 className="wood-heading mt-2 text-3xl font-medium text-[#102b1e]">Trouvez la bonne longueur pour votre appareil.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#645f55]">Contactez-nous pour vérifier les disponibilités, le prix et la livraison dans votre commune.</p></div>
          <Link href="/contact" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#21492d] px-5 py-3 text-sm font-semibold text-white hover:bg-[#173a22]">Demander un devis <ArrowRight size={17} /></Link>
        </div>
      </section>
    </main>
  );
}
