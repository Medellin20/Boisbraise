import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, Droplets, Flame, PackageCheck, Truck } from 'lucide-react';
import { getPublishedWoodProduct } from '@/lib/data/wood-products';
import { ProductPurchase } from '@/components/wood/product-purchase';
import { woodDisplayName, woodDisplayText } from '@/lib/utils/wood-display';
import { lengthLabel } from '@/lib/utils/wood';

export const dynamic = 'force-dynamic';

type PageProps = { params: { slug: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getPublishedWoodProduct(params.slug);
  return product
    ? {
        title: `${woodDisplayName(product.name)} — Brennholz`,
        description: product.short_description,
        openGraph: { images: product.wood_product_images[0] ? [product.wood_product_images[0].url] : undefined },
      }
    : { title: 'Holzart nicht gefunden' };
}

function DescriptionContent({ description }: { description: string }) {
  const blocks = description
    .split(/\n\s*\n/)
    .map((block) => block.split('\n').map((line) => line.trim()).filter(Boolean))
    .filter((lines) => lines.length > 0);

  if (!blocks.length) {
    return <p className="text-sm leading-7 text-[#71695d]">Eine ausführliche Beschreibung dieser Holzart erhalten Sie auf Anfrage.</p>;
  }

  return (
    <div className="space-y-4 text-sm leading-7 text-[#514b42]">
      {blocks.map((lines, index) => {
        const isList = lines.every((line) => /^[-*•]\s+/.test(line));
        return isList ? (
          <ul key={index} className="list-disc space-y-2 pl-5 marker:text-[#bd682b]">
            {lines.map((line, lineIndex) => <li key={lineIndex}>{line.replace(/^[-*•]\s+/, '')}</li>)}
          </ul>
        ) : (
          <p key={index}>{lines.join(' ')}</p>
        );
      })}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[#eee7dc] py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
      <dt className="text-sm text-[#71695d]">{label}</dt>
      <dd className="text-sm font-semibold text-[#26372a] sm:text-right">{value}</dd>
    </div>
  );
}

export default async function WoodProductPage({ params }: PageProps) {
  const product = await getPublishedWoodProduct(params.slug);
  if (!product) notFound();

  const name = woodDisplayName(product.name);
  const cover = product.wood_product_images.find((image) => image.is_primary) ?? product.wood_product_images[0];
  const lengths = product.wood_product_lengths.map((item) => lengthLabel(item.length_cm));
  const stock = !product.in_stock
    ? 'Derzeit nicht verfügbar'
    : product.stock_m3 != null
      ? `${product.stock_m3} m³ auf Lager`
      : 'Verfügbarkeit wird bestätigt';

  return (
    <main className="container-app py-7 sm:py-10">
      <Link href="/catalogue" className="mb-5 inline-flex items-center gap-2 text-sm text-[#655f55] hover:text-[#1f492c]">
        <ArrowLeft size={16} /> Zurück zu den Holzarten
      </Link>

      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-[#e6ddcf]">
          {cover ? (
            <Image
              src={cover.url}
              alt={cover.alt_text ?? `Bûches de bois : ${name}`}
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-400">Foto folgt</div>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#bd682b]">Brennholz</p>
          <h1 className="wood-heading mt-1 text-5xl font-medium text-[#102b1e] sm:text-6xl">{name}</h1>
          {product.short_description.trim() && (
            <p className="mt-4 max-w-2xl text-[15px] leading-6 text-[#645f55]">
              {woodDisplayText(product.short_description)}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {product.moisture_percent != null && (
              <span className="wood-chip wood-chip-green"><Droplets size={14} />Feuchtigkeit ≤ {product.moisture_percent}%</span>
            )}
            {product.delivery_available && (
              <span className="wood-chip wood-chip-orange"><Truck size={14} />Lieferung möglich</span>
            )}
            {product.calorific_value_kwh != null && (
              <span className="wood-chip wood-chip-red"><Flame size={14} />{product.calorific_value_kwh} kWh/m³</span>
            )}
            {product.in_stock && (
              <span className="wood-chip wood-chip-green">
                <PackageCheck size={14} />{product.stock_m3 == null ? 'Verfügbarkeit wird bestätigt' : `${product.stock_m3} m³ auf Lager`}
              </span>
            )}
          </div>

          {product.calorific_value_kwh != null && (
            <p className="mt-5 text-sm text-[#655f55]">
              Heizwert: <strong>{product.calorific_value_kwh} kWh / m³</strong>
            </p>
          )}
          <div className="mt-7"><ProductPurchase product={product} /></div>
          <p className="mt-3 text-xs leading-5 text-[#766e62]">
            Verfügbarkeit und Lieferbedingungen werden je nach Lieferadresse und gewünschter Menge bestätigt.
          </p>
        </div>
      </div>

      <section className="mt-10 grid gap-6 rounded-3xl border border-[#e7dece] bg-white p-5 shadow-sm sm:p-7 lg:grid-cols-[1.1fr_.9fr] lg:gap-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#bd682b]">Produktübersicht</p>
          <h2 className="wood-heading mt-2 text-2xl font-semibold text-[#173a27]">Ausführliche Beschreibung</h2>
          <div className="mt-4">
            <DescriptionContent description={woodDisplayText(product.description).trim()} />
          </div>
        </div>

        <div className="rounded-2xl bg-[#fcfaf5] p-4 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#bd682b]">Produktinformationen</p>
          <h2 className="wood-heading mt-2 text-xl font-semibold text-[#173a27]">Eigenschaften & Verfügbarkeit</h2>
          <dl className="mt-3">
            <DetailRow label="Holzart" value={name} />
            <DetailRow label="Feuchtigkeit" value={product.moisture_percent != null ? `≤ ${product.moisture_percent} %` : 'Wird bestätigt'} />
            <DetailRow label="Heizwert" value={product.calorific_value_kwh != null ? `${product.calorific_value_kwh} kWh / m³` : 'Wird bestätigt'} />
            <DetailRow label="Scheitlängen" value={lengths.length ? lengths.join(' · ') : 'Wird bestätigt'} />
            <DetailRow label="Verfügbarkeit" value={stock} />
            <DetailRow label="Lieferung" value={product.delivery_available ? 'Möglich, abhängig von der Lieferadresse' : 'Abhängig von der Lieferadresse'} />
          </dl>
        </div>
      </section>
    </main>
  );
}
