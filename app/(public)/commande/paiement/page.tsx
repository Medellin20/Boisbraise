import type { Metadata } from 'next';
import { PaymentInstructions } from '@/components/wood/payment-instructions';

export const metadata: Metadata = { title: 'Zahlungsinformationen', robots: { index: false, follow: false } };

export default function PaymentPage() {
  return (
    <main className="wood-catalog min-h-screen">
      <section className="container-app py-10 sm:py-14"><PaymentInstructions /></section>
    </main>
  );
}
