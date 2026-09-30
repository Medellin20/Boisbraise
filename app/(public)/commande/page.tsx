import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/wood/checkout-form';

export const metadata: Metadata = { title: 'Finaliser ma commande', robots: { index: false, follow: false } };

export default function CheckoutPage() {
  const rawDeliveryFee = process.env.WOOD_DELIVERY_FEE_EUR?.trim();
  const parsedDeliveryFee = rawDeliveryFee ? Number(rawDeliveryFee) : Number.NaN;
  const deliveryFee = Number.isFinite(parsedDeliveryFee) && parsedDeliveryFee >= 0 ? parsedDeliveryFee : null;

  return (
    <main className="wood-catalog min-h-screen">
      <section className="container-app py-10 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#bd682b]">HolzNest · commande sécurisée</p>
        <div className="mt-5"><CheckoutForm deliveryFee={deliveryFee} /></div>
      </section>
    </main>
  );
}
