'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowRight, Minus, Plus, ShoppingCart } from 'lucide-react';
import type { WoodProduct } from '@/lib/data/wood-products';
import { formatWoodPrice, lengthLabel } from '@/lib/utils/wood';
import { CART_STORAGE_KEY, normalizeCartLine, type StoredCartLine } from '@/lib/utils/cart';
import type { WoodPackageCode } from '@/lib/utils/wood-packages';

export function ProductPurchase({ product }: { product: WoodProduct }) {
  const settings = product.wood_sales_settings;
  const packageOptions = settings?.packages ?? [];
  const initialPackage = packageOptions.find((item) => item.price != null) ?? packageOptions[0];
  const [packageCode, setPackageCode] = useState<WoodPackageCode | ''>(
    (initialPackage?.package_code as WoodPackageCode | undefined) ?? ''
  );
  const [packageLength, setPackageLength] = useState(settings?.allowedLengthsCm[0] ?? 25);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const selectedPackage = packageOptions.find((item) => item.package_code === packageCode);
  const packageDetails = selectedPackage;
  const packageTotal = selectedPackage?.price == null ? null : selectedPackage.price * quantity;
  const deliveryTotal = packageDetails && settings
    ? Math.round(packageDetails.volume_litres * quantity * settings.deliveryPricePerLitre * 100) / 100
    : null;
  const orderTotal = packageTotal == null || deliveryTotal == null ? null : packageTotal + deliveryTotal;
  const maxQuantity = packageDetails && settings
    ? Math.min(settings.maxQuantityPerProduct, product.stock_m3 == null
      ? settings.maxQuantityPerProduct
      : Math.floor(product.stock_m3 / (packageDetails.volume_litres / 1000) + 1e-9))
    : 0;

  function addToCart() {
    if (!selectedPackage || selectedPackage.price == null || !packageDetails || !settings) {
      toast.error('Dieses Format ist auf Anfrage verfügbar. Kontaktieren Sie uns für den Preis.');
      return;
    }
    if (!product.in_stock) {
      toast.error('Dieses Produkt ist derzeit nicht verfügbar.');
      return;
    }
    if (maxQuantity < 1 || quantity > maxQuantity) {
      toast.error('Die gewünschte Menge überschreitet den verfügbaren Lagerbestand.');
      return;
    }

    const line: StoredCartLine = {
      key: `${product.slug}-${packageDetails.package_code}-${packageLength}`,
      slug: product.slug,
      name: product.name,
      length: `${packageDetails.label} · ${packageLength === 100 ? '1 m' : `${packageLength} cm`}`,
      lengthCm: packageLength,
      packageCode: packageDetails.package_code as WoodPackageCode,
      packageLabel: packageDetails.label,
      quantity,
      unitPrice: selectedPackage.price,
    };

    try {
      const rawCart: unknown = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? '[]');
      const cart: StoredCartLine[] = Array.isArray(rawCart)
        ? rawCart.map((item) => normalizeCartLine(item)).filter((item): item is StoredCartLine => item !== null)
        : [];
      const index = cart.findIndex((item) => item.key === line.key);
      const existingForProduct = cart.filter((item) => item.slug === product.slug);
      const existingUnits = existingForProduct.reduce((sum, item) => sum + item.quantity, 0);
      const existingVolumeM3 = existingForProduct.reduce((sum, item) => {
        const packageItem = packageOptions.find((option) => option.package_code === item.packageCode);
        return sum + (packageItem ? packageItem.volume_litres / 1000 * item.quantity : 0);
      }, 0);
      const remainingByQuantity = settings.maxQuantityPerProduct - existingUnits;
      const remainingByStock = product.stock_m3 == null
        ? settings.maxQuantityPerProduct
        : Math.floor(Math.max(0, product.stock_m3 - existingVolumeM3) / (packageDetails.volume_litres / 1000) + 1e-9);
      const allowedToAdd = Math.min(remainingByQuantity, remainingByStock);
      if (quantity > allowedToAdd) {
        toast.error(`La quantité dépasse la limite restante pour ${product.name} (${Math.max(0, allowedToAdd)} unité(s)).`);
        return;
      }
      if (index >= 0) cart[index] = { ...line, quantity: Math.min(maxQuantity, cart[index].quantity + quantity) };
      else cart.push(line);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      window.dispatchEvent(new Event('wood-cart-updated'));
      setAdded(true);
      toast.success(`${quantity} × ${packageDetails.label} ${product.name} (${lengthLabel(packageLength)}) zum Warenkorb hinzugefügt.`);
    } catch {
      toast.error('Der Warenkorb konnte nicht aktualisiert werden.');
    }
  }

  if (!settings || packageOptions.length === 0) {
    return (
      <section className="rounded-[22px] border border-[#e6ddcf] bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm text-[#645f55]">Verkaufsformate werden derzeit eingerichtet.</p>
      </section>
    );
  }

  return (
    <section className="rounded-[22px] border border-[#e6ddcf] bg-white p-5 shadow-[0_8px_22px_rgba(62,49,32,.08)] sm:p-6">
      <h2 className="text-sm font-bold text-[#18251d]">Verkaufsformat · prix hors livraison</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {packageOptions.map((item) => {
          const active = packageCode === item.package_code;
          const optionMax = Math.min(settings.maxQuantityPerProduct, product.stock_m3 == null
            ? settings.maxQuantityPerProduct
            : Math.floor(product.stock_m3 / (item.volume_litres / 1000) + 1e-9));
          return (
            <button
              key={item.package_code}
              type="button"
              onClick={() => {
                setAdded(false);
                setPackageCode(item.package_code as WoodPackageCode);
                setQuantity((value) => Math.max(1, Math.min(value, optionMax)));
              }}
              aria-pressed={active}
              className={`min-h-16 rounded-xl border px-3 py-2.5 text-left transition ${active ? 'border-[#285535] bg-[#173d2f] text-white' : 'border-[#d9d8c9] bg-[#faf9f3] text-[#26372a] hover:border-[#8b9b85]'}`}
            >
              <span className="block text-sm">{item.label}</span>
              <span className="mt-0.5 block text-sm font-bold">
                {item.price == null ? 'Auf Anfrage' : formatWoodPrice(item.price)}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-[#746d62]">Bûches disponibles : {settings.allowedLengthsCm.map((length) => lengthLabel(length)).join(' · ')}.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {settings.allowedLengthsCm.map((cm) => (
          <button
            key={cm}
            type="button"
            onClick={() => { setAdded(false); setPackageLength(cm); }}
            aria-pressed={packageLength === cm}
            className={`rounded-lg border px-3 py-2 text-sm ${packageLength === cm ? 'border-[#285535] bg-[#f1f6f1] font-semibold text-[#21492d]' : 'border-[#e6ddcf] text-[#514b42]'}`}
          >
            {lengthLabel(cm)}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2.5">
        <button
          type="button"
          aria-label="Anzahl verringern"
          onClick={() => { setAdded(false); setQuantity((value) => Math.max(1, value - 1)); }}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e6ddcf] bg-[#faf8f3]"
        >
          <Minus size={16} />
        </button>
        <input
          aria-label="Anzahl der Pakete"
          type="number"
          min={1}
          max={maxQuantity}
          value={quantity}
          onChange={(event) => { setAdded(false); setQuantity(Math.max(1, Math.min(maxQuantity || 1, Math.floor(Number(event.target.value)) || 1))); }}
          className="h-10 w-20 rounded-xl border border-[#e6ddcf] text-center text-sm"
        />
        <button
          type="button"
          aria-label="Anzahl erhöhen"
          onClick={() => { setAdded(false); setQuantity((value) => Math.max(1, Math.min(maxQuantity, value + 1))); }}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e6ddcf] bg-[#faf8f3]"
        >
          <Plus size={16} />
        </button>
        <span className="text-sm text-[#756e62]">
          {packageTotal == null ? 'Prix du bois : sur devis' : `Bois : ${formatWoodPrice(packageTotal)}`}
        </span>
      </div>
      {orderTotal != null && deliveryTotal != null && settings && packageDetails && (
        <div className="mt-3 space-y-1 rounded-xl bg-[#f7f5ef] p-3 text-sm">
          <p className="flex justify-between gap-2 text-[#645f55]"><span>Livraison ({(packageDetails.volume_litres * quantity).toLocaleString('fr-FR')} l × {formatWoodPrice(settings.deliveryPricePerLitre)}/l)</span><span>{formatWoodPrice(deliveryTotal)}</span></p>
          <p className="flex justify-between gap-2 font-bold text-[#173a27]"><span>Total estimé à payer</span><span>{formatWoodPrice(orderTotal)}</span></p>
        </div>
      )}

      <button
        type="button"
        onClick={addToCart}
        disabled={!product.in_stock || maxQuantity < 1 || !selectedPackage || selectedPackage.price == null}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#21492d] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#173a22] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ShoppingCart size={16} /> {product.in_stock ? 'Format in den Warenkorb' : 'Nicht verfügbar'}
      </button>
      {added && (
        <Link
          href="/commande"
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#cbd6c8] bg-[#f3f7f1] px-5 py-2.5 text-sm font-semibold text-[#21492d] transition hover:bg-[#e7efe5]"
        >
          Bestellung abschließen <ArrowRight size={16} />
        </Link>
      )}
    </section>
  );
}
