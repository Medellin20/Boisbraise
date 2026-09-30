'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, LoaderCircle, ShieldCheck } from 'lucide-react';
import { submitWoodOrder } from '@/actions/wood-orders';
import { CART_STORAGE_KEY, ORDER_CONFIRMATION_STORAGE_KEY, normalizeCartLine, type StoredCartLine } from '@/lib/utils/cart';
import { formatWoodPrice } from '@/lib/utils/wood';

export function CheckoutForm({ deliveryFee }: { deliveryFee: number | null }) {
  const router = useRouter();
  const [cart, setCart] = useState<StoredCartLine[]>([]);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const [customer, setCustomer] = useState({ firstName: '', lastName: '', address: '', postalCode: '', city: '', phone: '', email: '' });
  const subtotal = useMemo(() => cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0), [cart]);
  const estimatedTotal = deliveryFee == null ? null : subtotal + deliveryFee;
  const estimatedDeposit = estimatedTotal == null ? null : Math.round(estimatedTotal * 100 / 2) / 100;

  useEffect(() => {
    try {
      const raw: unknown = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? '[]');
      setCart(Array.isArray(raw) ? raw.map(normalizeCartLine).filter((line): line is StoredCartLine => line !== null) : []);
    } catch {
      setCart([]);
    }
  }, []);

  function setField(field: keyof typeof customer, value: string) {
    setCustomer((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!cart.length) return;
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await submitWoodOrder({
        customer,
        lines: cart.map((line) => ({ slug: line.slug, lengthCm: line.lengthCm, quantity: line.quantity })),
        website: String(form.get('website') ?? ''),
        acceptTerms: form.get('acceptTerms') === 'on',
      });
      if (!result.success) {
        setError(result.message);
        return;
      }
      try {
        sessionStorage.setItem(ORDER_CONFIRMATION_STORAGE_KEY, JSON.stringify(result.order));
        localStorage.removeItem(CART_STORAGE_KEY);
        window.dispatchEvent(new Event('wood-cart-updated'));
      } catch {
        setError('La commande est envoyée, mais les informations de paiement ne peuvent pas être mémorisées. Gardez le récapitulatif affiché.');
        return;
      }
      router.push('/commande/paiement');
      router.refresh();
    });
  }

  if (cart.length === 0) {
    return (
      <div className="rounded-3xl border border-[#e7dece] bg-white p-8 text-center shadow-sm sm:p-12">
        <h1 className="wood-heading text-3xl font-semibold text-[#173a27]">Votre panier est vide</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#71695d]">Ajoutez d’abord une essence au panier. Vous pourrez ensuite saisir vos coordonnées de livraison.</p>
        <Link href="/catalogue" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#21492d] px-5 py-3 text-sm font-semibold text-white">Voir le catalogue <ArrowRight size={16} /></Link>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-3xl border border-[#e7dece] bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#bd682b]">Étape 1 · Livraison</p>
          <h1 className="wood-heading mt-2 text-3xl font-semibold text-[#173a27]">Vos coordonnées</h1>
          <p className="mt-2 text-sm text-[#71695d]">Nous vous contacterons pour confirmer le créneau et les détails de livraison.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Prénom(s)" name="firstName" autoComplete="given-name" value={customer.firstName} onChange={(value) => setField('firstName', value)} required />
            <Field label="Nom" name="lastName" autoComplete="family-name" value={customer.lastName} onChange={(value) => setField('lastName', value)} required />
            <Field label="E-mail" name="email" type="email" autoComplete="email" value={customer.email} onChange={(value) => setField('email', value)} required />
            <Field label="Téléphone" name="phone" type="tel" autoComplete="tel" placeholder="+33 …" value={customer.phone} onChange={(value) => setField('phone', value)} required />
            <Field label="Adresse de livraison" name="address" autoComplete="street-address" value={customer.address} onChange={(value) => setField('address', value)} required className="sm:col-span-2" />
            <Field label="Code postal" name="postalCode" autoComplete="postal-code" value={customer.postalCode} onChange={(value) => setField('postalCode', value)} required />
            <Field label="Ville" name="city" autoComplete="address-level2" value={customer.city} onChange={(value) => setField('city', value)} required />
          </div>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="absolute -left-[10000px] h-px w-px opacity-0" aria-hidden="true" />
          <label className="mt-5 flex items-start gap-3 text-sm leading-5 text-[#5e594f]">
            <input type="checkbox" name="acceptTerms" required className="mt-1 h-4 w-4 accent-[#21492d]" />
            <span>J’accepte l’utilisation de mes coordonnées pour traiter cette commande. Consultez notre <Link href="/confidentialite" className="font-semibold text-[#21492d] underline">politique de confidentialité</Link>.</span>
          </label>
        </section>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Link href="/catalogue" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#ddd2bf] bg-white px-5 py-3 text-sm font-semibold text-[#524a3e]"><ArrowLeft size={16} /> Continuer mes achats</Link>
          <button type="submit" disabled={pending || cart.length === 0} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#21492d] px-6 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
            {pending ? <LoaderCircle size={17} className="animate-spin" /> : <ShieldCheck size={17} />}
            {pending ? 'Transmission en cours…' : 'Confirmer et voir le paiement'}
          </button>
        </div>
      </form>

      <aside className="rounded-3xl border border-[#e7dece] bg-[#fcfaf5] p-5 shadow-sm lg:sticky lg:top-24">
        <h2 className="font-bold text-[#173a27]">Récapitulatif</h2>
        <ul className="mt-4 space-y-4">
          {cart.map((line) => <li key={line.key} className="flex justify-between gap-3 border-b border-[#e9e1d4] pb-3 text-sm"><span className="min-w-0"><strong className="block text-[#343c33]">{line.name}</strong><span className="text-xs text-[#71695d]">{line.length} · {line.quantity} m³</span></span><strong className="shrink-0 text-[#173a27]">{formatWoodPrice(line.unitPrice * line.quantity)}</strong></li>)}
        </ul>
        <div className="mt-4 space-y-2 text-sm"><div className="flex justify-between"><span className="text-[#71695d]">Bois</span><span>{formatWoodPrice(subtotal)}</span></div><div className="flex justify-between"><span className="text-[#71695d]">Livraison</span><span>{deliveryFee == null ? 'À configurer' : formatWoodPrice(deliveryFee)}</span></div></div>
        <div className="mt-4 space-y-2 border-t border-[#ded3c1] pt-4 text-sm"><div className="flex justify-between font-semibold text-[#173a27]"><span>Total à payer</span><span>{estimatedTotal == null ? "À confirmer" : formatWoodPrice(estimatedTotal)}</span></div><div className="flex justify-between text-[#21492d]"><span>Acompte (50 % du total)</span><strong>{estimatedDeposit == null ? "À confirmer" : formatWoodPrice(estimatedDeposit)}</strong></div><p className="pt-1 text-xs leading-5 text-[#766e62]">L’acompte correspond à la moitié du montant total, frais de livraison inclus. Le montant définitif est recalculé à l’envoi selon les tarifs du catalogue.</p></div>
      </aside>
    </div>
  );
}

function Field({ label, name, value, onChange, required, type = 'text', autoComplete, placeholder, className = '' }: {
  label: string; name: string; value: string; onChange: (value: string) => void; required?: boolean;
  type?: string; autoComplete?: string; placeholder?: string; className?: string;
}) {
  return (
    <label className={`block text-sm font-medium text-[#403b32] ${className}`}>
      {label}
      <input name={name} type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} autoComplete={autoComplete} placeholder={placeholder}
        className="mt-1.5 min-h-11 w-full rounded-xl border border-[#dcd1bd] bg-[#fffefa] px-3.5 py-2.5 text-sm outline-none transition focus:border-[#607c5e] focus:ring-2 focus:ring-[#607c5e]/20" />
    </label>
  );
}
