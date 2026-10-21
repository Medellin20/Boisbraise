import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/wood/checkout-form';

export const metadata: Metadata = { title: 'Bestellung abschließen', robots: { index: false, follow: false } };

export default function CheckoutPage() {
  return (
    <main className="wood-catalog min-h-screen">
      <section className="container-app py-10 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#bd682b]">HolzNest · sichere Bestellung</p>
        <div className="mt-5"><CheckoutForm /></div>
      </section>
    </main>
  );
}
