'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowRight, Minus, Plus, ShoppingCart } from 'lucide-react';
import type { WoodProduct } from '@/lib/data/wood-products';
import { formatWoodPrice, lengthLabel } from '@/lib/utils/wood';
import { CART_STORAGE_KEY, type StoredCartLine } from '@/lib/utils/cart';
import { getWoodPackage, WOOD_PACKAGES, type WoodPackageCode } from '@/lib/utils/wood-packages';

export function ProductPurchase({ product }: { product: WoodProduct }) {
  const choices = product.wood_product_lengths;
  const initial = choices.find((item) => item.price_per_m3 != null) ?? choices[0];
  const [length, setLength] = useState(initial?.length_cm ?? 100);
  const [quantity, setQuantity] = useState(1);
  const packageOptions = product.wood_product_packages ?? [];
  const initialPackage = packageOptions.find((item) => item.price != null) ?? packageOptions[0];
  const [packageCode, setPackageCode] = useState<WoodPackageCode | ''>(
    (initialPackage?.package_code as WoodPackageCode | undefined) ?? ''
  );
  const [packageLength, setPackageLength] = useState(25);
  const [packageQuantity, setPackageQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const selected = choices.find((item) => item.length_cm === length);
  const maxQuantity = product.stock_m3 && product.stock_m3 > 0 ? Math.floor(product.stock_m3) : 99;
  const total = useMemo(
    () => selected?.price_per_m3 == null ? null : selected.price_per_m3 * quantity,
    [selected, quantity],
  );
  const selectedPackage = packageOptions.find((item) => item.package_code === packageCode);
  const packageDetails = packageCode ? getWoodPackage(packageCode) : undefined;
  const packageTotal = selectedPackage?.price == null ? null : selectedPackage.price * packageQuantity;
  const maxPackageQuantity = packageDetails && product.stock_m3 != null
    ? Math.min(100, Math.floor(product.stock_m3 / (packageDetails.volumeLitres / 1000)))
    : 99;

  function addToCart() {
    if (selected?.price_per_m3 == null) {
      toast.error('Diese Länge ist auf Anfrage verfügbar. Kontaktieren Sie uns für den Preis.');
      return;
    }
    if (!product.in_stock) {
      toast.error('Dieses Produkt ist derzeit nicht verfügbar.');
      return;
    }
    const line: StoredCartLine = {
      key: `${product.slug}-${length}`,
      slug: product.slug,
      name: product.name,
      length: lengthLabel(length),
      lengthCm: length,
      quantity,
      unitPrice: selected.price_per_m3,
    };
    try {
      const cart: StoredCartLine[] = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? '[]');
      const index = cart.findIndex((item) => item.key === line.key);
      if (index >= 0) cart[index] = { ...line, quantity: Math.min(maxQuantity, cart[index].quantity + quantity) };
      else cart.push(line);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      window.dispatchEvent(new Event('wood-cart-updated'));
      setAdded(true);
      toast.success(`${quantity} m³ ${product.name} (${line.length}) zum Warenkorb hinzugefügt.`);
    } catch {
      toast.error('Der Warenkorb konnte nicht aktualisiert werden.');
    }
  }

  function addPackageToCart() {
    if (!selectedPackage || selectedPackage.price == null || !packageDetails) {
      toast.error('Dieses Format ist auf Anfrage verfügbar. Kontaktieren Sie uns für den Preis.');
      return;
    }
    if (!product.in_stock) {
      toast.error('Dieses Produkt ist derzeit nicht verfügbar.');
      return;
    }
    if (packageQuantity > maxPackageQuantity || maxPackageQuantity < 1) {
      toast.error('Die gewünschte Menge überschreitet den verfügbaren Lagerbestand.');
      return;
    }

    const line: StoredCartLine = {
      key: `${product.slug}-${packageDetails.code}-${packageLength}`,
      slug: product.slug,
      name: product.name,
      length: `${packageDetails.label} · ${packageLength} cm`,
      lengthCm: packageLength,
      packageCode: packageDetails.code,
      quantity: packageQuantity,
      unitPrice: selectedPackage.price,
    };
    try {
      const cart: StoredCartLine[] = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? '[]');
      const index = cart.findIndex((item) => item.key === line.key);
      if (index >= 0) cart[index] = { ...line, quantity: Math.min(maxPackageQuantity, cart[index].quantity + packageQuantity) };
      else cart.push(line);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      window.dispatchEvent(new Event('wood-cart-updated'));
      setAdded(true);
      toast.success(`${packageQuantity} × ${packageDetails.label} ${product.name} (${packageLength} cm) zum Warenkorb hinzugefügt.`);
    } catch {
      toast.error('Der Warenkorb konnte nicht aktualisiert werden.');
    }
  }

  return (
    <section className="rounded-[22px] border border-[#e6ddcf] bg-white p-5 shadow-[0_8px_22px_rgba(62,49,32,.08)] sm:p-6">
      {packageOptions.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-[#18251d]">Verkaufsformat</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {WOOD_PACKAGES.map((option) => {
              const item = packageOptions.find((entry) => entry.package_code === option.code);
              if (!item) return null;
              const active = packageCode === option.code;
              const optionMaxQuantity = product.stock_m3 == null
                ? 100
                : Math.min(100, Math.floor(product.stock_m3 / (option.volumeLitres / 1000)));
              return (
                <button key={option.code} type="button" onClick={() => { setPackageCode(option.code); setPackageQuantity((value) => Math.max(1, Math.min(value, optionMaxQuantity))); }} aria-pressed={active}
                  className={`min-h-16 rounded-xl border px-3 py-2.5 text-left transition ${active ? 'border-[#285535] bg-[#173d2f] text-white' : 'border-[#d9d8c9] bg-[#faf9f3] text-[#26372a] hover:border-[#8b9b85]'}`}>
                  <span className="block text-sm">{option.label}</span>
                  <span className="mt-0.5 block text-sm font-bold">{item.price == null ? 'Auf Anfrage' : formatWoodPrice(item.price)}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-[#746d62]">
            Bûches disponibles en 25 cm, 33 cm et 50 cm.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[25, 33, 50].map((cm) => (
              <button key={cm} type="button" onClick={() => setPackageLength(cm)} aria-pressed={packageLength === cm}
                className={`rounded-lg border px-3 py-2 text-sm ${packageLength === cm ? 'border-[#285535] bg-[#f1f6f1] font-semibold text-[#21492d]' : 'border-[#e6ddcf] text-[#514b42]'}`}>
                {cm} cm
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2.5">
            <button type="button" aria-label="Anzahl der Pakete verringern" onClick={() => setPackageQuantity((value) => Math.max(1, value - 1))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e6ddcf] bg-[#faf8f3]"><Minus size={16} /></button>
            <input aria-label="Anzahl der Pakete" type="number" min={1} max={maxPackageQuantity} value={packageQuantity} onChange={(event) => setPackageQuantity(Math.min(maxPackageQuantity, Math.max(1, Number(event.target.value) || 1)))} className="h-10 w-20 rounded-xl border border-[#e6ddcf] text-center text-sm" />
            <button type="button" aria-label="Anzahl der Pakete erhöhen" onClick={() => setPackageQuantity((value) => Math.min(maxPackageQuantity, value + 1))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e6ddcf] bg-[#faf8f3]"><Plus size={16} /></button>
            <span className="text-sm text-[#756e62]">Gesamt: {packageTotal == null ? 'Auf Anfrage' : formatWoodPrice(packageTotal)}</span>
          </div>
          <button type="button" onClick={addPackageToCart} disabled={!product.in_stock || maxPackageQuantity < 1} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#21492d] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#173a22] disabled:cursor-not-allowed disabled:opacity-50">
            <ShoppingCart size={16} /> {product.in_stock ? 'Format in den Warenkorb' : 'Nicht verfügbar'}
          </button>
        </div>
      )}
      {packageOptions.length > 0 && <div className="my-6 border-t border-[#e5dbc9]" />}
      <h2 className="text-sm font-bold text-[#18251d]">Scheitlänge</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {choices.map((item) => (
          <button key={item.id} type="button" onClick={() => setLength(item.length_cm)} aria-pressed={length === item.length_cm}
            className={`min-w-[96px] rounded-2xl border px-3 py-2.5 text-left transition ${length === item.length_cm ? 'border-[#285535] bg-[#f1f6f1] ring-1 ring-[#285535]' : 'border-[#e6ddcf] hover:border-[#8b9b85]'}`}>
            <span className="block text-sm font-semibold text-[#19281f]">{lengthLabel(item.length_cm)}</span>
            <span className="mt-0.5 block text-[11px] text-[#746d62]">{item.price_per_m3 == null ? 'Auf Anfrage' : `${formatWoodPrice(item.price_per_m3)} / m³`}</span>
          </button>
        ))}
      </div>
      <div className="mt-6">
        <h2 className="text-sm font-bold text-[#18251d]">Menge in m³ (1 m³ = 1 Raummeter)</h2>
        <div className="mt-3 flex items-center gap-2.5">
          <button type="button" aria-label="Menge verringern" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e6ddcf] bg-[#faf8f3] shadow-sm"><Minus size={16} /></button>
          <input aria-label="Menge in Kubikmetern" type="number" min={1} max={maxQuantity} value={quantity} onChange={(event) => setQuantity(Math.min(maxQuantity, Math.max(1, Number(event.target.value) || 1)))} className="h-10 w-24 rounded-xl border border-[#e6ddcf] text-center text-sm" />
          <button type="button" aria-label="Menge erhöhen" onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e6ddcf] bg-[#faf8f3] shadow-sm"><Plus size={16} /></button>
          <span className="text-sm text-[#756e62]">{quantity} m³</span>
        </div>
        <p className="mt-2 text-xs text-[#80796f]">{product.stock_m3 != null ? `Lagerbestand: ${product.stock_m3} m³` : 'Verfügbarkeit wird mit dem Angebot bestätigt'}</p>
      </div>
      <div className="mt-6 flex items-end justify-between border-t border-[#e5dbc9] pt-5">
        <div>
          <span className="block text-[10px] uppercase tracking-wide text-[#746d62]">Gesamtpreis</span>
          {total == null ? <strong className="text-xl text-[#17271e]">Auf Anfrage</strong> : <strong className="text-3xl font-semibold text-[#17271e]">{formatWoodPrice(total)}</strong>}
          <span className="block text-xs text-[#746d62]">{selected?.price_per_m3 != null ? `${formatWoodPrice(selected.price_per_m3)} × ${quantity} m³` : 'Preis wird mit dem Angebot bestätigt'}</span>
        </div>
        <span className="rounded-full border border-[#e8caaa] bg-[#fbf0e5] px-3 py-1 text-xs text-[#855633]">{lengthLabel(length)}</span>
      </div>
      <button type="button" onClick={addToCart} disabled={!product.in_stock} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#21492d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#173a22] disabled:cursor-not-allowed disabled:opacity-50">
        <ShoppingCart size={17} /> {!product.in_stock ? 'Nicht verfügbar' : added ? 'Weiter einkaufen' : 'In den Warenkorb'}
      </button>
      {added && (
        <Link href="/commande" className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#cbd6c8] bg-[#f3f7f1] px-5 py-2.5 text-sm font-semibold text-[#21492d] transition hover:bg-[#e7efe5]">
          Bestellung abschließen <ArrowRight size={16} />
        </Link>
      )}
    </section>
  );
}
