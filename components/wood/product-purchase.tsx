'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowRight, Minus, Plus, ShoppingCart } from 'lucide-react';
import type { WoodProduct } from '@/lib/data/wood-products';
import { formatWoodPrice, lengthLabel } from '@/lib/utils/wood';
import { CART_STORAGE_KEY, type StoredCartLine } from '@/lib/utils/cart';

export function ProductPurchase({ product }: { product: WoodProduct }) {
  const choices = product.wood_product_lengths;
  const initial = choices.find((item) => item.price_per_m3 != null) ?? choices[0];
  const [length, setLength] = useState(initial?.length_cm ?? 100);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const selected = choices.find((item) => item.length_cm === length);
  const maxQuantity = product.stock_m3 && product.stock_m3 > 0 ? Math.floor(product.stock_m3) : 99;
  const total = useMemo(
    () => selected?.price_per_m3 == null ? null : selected.price_per_m3 * quantity,
    [selected, quantity],
  );

  function addToCart() {
    if (selected?.price_per_m3 == null) {
      toast.error('Cette longueur est disponible sur devis. Contactez-nous pour connaître son prix.');
      return;
    }
    if (!product.in_stock) {
      toast.error('Ce produit est actuellement indisponible.');
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
      toast.success(`${quantity} m³ de ${product.name} (${line.length}) ajouté${quantity > 1 ? 's' : ''} au panier.`);
    } catch {
      toast.error('Le panier n’a pas pu être mis à jour.');
    }
  }

  return (
    <section className="rounded-[22px] border border-[#e6ddcf] bg-white p-5 shadow-[0_8px_22px_rgba(62,49,32,.08)] sm:p-6">
      <h2 className="text-sm font-bold text-[#18251d]">Longueur de bûche</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {choices.map((item) => (
          <button key={item.id} type="button" onClick={() => setLength(item.length_cm)} aria-pressed={length === item.length_cm}
            className={`min-w-[96px] rounded-2xl border px-3 py-2.5 text-left transition ${length === item.length_cm ? 'border-[#285535] bg-[#f1f6f1] ring-1 ring-[#285535]' : 'border-[#e6ddcf] hover:border-[#8b9b85]'}`}>
            <span className="block text-sm font-semibold text-[#19281f]">{lengthLabel(item.length_cm)}</span>
            <span className="mt-0.5 block text-[11px] text-[#746d62]">{item.price_per_m3 == null ? 'Sur devis' : `${formatWoodPrice(item.price_per_m3)} / m³`}</span>
          </button>
        ))}
      </div>
      <div className="mt-6">
        <h2 className="text-sm font-bold text-[#18251d]">Quantité en m³ (1 m³ = 1 stère)</h2>
        <div className="mt-3 flex items-center gap-2.5">
          <button type="button" aria-label="Diminuer la quantité" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e6ddcf] bg-[#faf8f3] shadow-sm"><Minus size={16} /></button>
          <input aria-label="Quantité en mètres cubes" type="number" min={1} max={maxQuantity} value={quantity} onChange={(event) => setQuantity(Math.min(maxQuantity, Math.max(1, Number(event.target.value) || 1)))} className="h-10 w-24 rounded-xl border border-[#e6ddcf] text-center text-sm" />
          <button type="button" aria-label="Augmenter la quantité" onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e6ddcf] bg-[#faf8f3] shadow-sm"><Plus size={16} /></button>
          <span className="text-sm text-[#756e62]">{quantity} m³</span>
        </div>
        <p className="mt-2 text-xs text-[#80796f]">{product.stock_m3 != null ? `Stock disponible : ${product.stock_m3} m³` : 'Disponibilité confirmée avec le devis'}</p>
      </div>
      <div className="mt-6 flex items-end justify-between border-t border-[#e5dbc9] pt-5">
        <div>
          <span className="block text-[10px] uppercase tracking-wide text-[#746d62]">Prix total</span>
          {total == null ? <strong className="text-xl text-[#17271e]">Sur devis</strong> : <strong className="text-3xl font-semibold text-[#17271e]">{formatWoodPrice(total)}</strong>}
          <span className="block text-xs text-[#746d62]">{selected?.price_per_m3 != null ? `${formatWoodPrice(selected.price_per_m3)} × ${quantity} m³` : 'Prix confirmé sur devis'}</span>
        </div>
        <span className="rounded-full border border-[#e8caaa] bg-[#fbf0e5] px-3 py-1 text-xs text-[#855633]">{lengthLabel(length)}</span>
      </div>
      <button type="button" onClick={addToCart} disabled={!product.in_stock} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#21492d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#173a22] disabled:cursor-not-allowed disabled:opacity-50">
        <ShoppingCart size={17} /> {!product.in_stock ? 'Indisponible' : added ? 'Ajouter encore au panier' : 'Ajouter au panier'}
      </button>
      {added && (
        <Link href="/commande" className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#cbd6c8] bg-[#f3f7f1] px-5 py-2.5 text-sm font-semibold text-[#21492d] transition hover:bg-[#e7efe5]">
          Finaliser ma commande <ArrowRight size={16} />
        </Link>
      )}
    </section>
  );
}
