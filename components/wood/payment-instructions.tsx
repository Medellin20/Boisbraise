'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Check, Copy, CreditCard, Landmark } from 'lucide-react';
import { toast } from 'sonner';
import { ORDER_CONFIRMATION_STORAGE_KEY } from '@/lib/utils/cart';
import { formatWoodPrice, lengthLabel } from '@/lib/utils/wood';
import type { OrderConfirmation } from '@/lib/types/order';

export function PaymentInstructions() {
  const [order, setOrder] = useState<OrderConfirmation | null>(null);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const value = sessionStorage.getItem(ORDER_CONFIRMATION_STORAGE_KEY);
      if (value) setOrder(JSON.parse(value) as OrderConfirmation);
    } catch {
      setOrder(null);
    } finally {
      setReady(true);
    }
  }, []);

  async function copyIban(iban: string) {
    try {
      await navigator.clipboard.writeText(iban);
      setCopied(true);
      toast.success('IBAN copié.');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Copie impossible. Sélectionnez l’IBAN et copiez-le manuellement.');
    }
  }

  if (!ready) return <div className="min-h-[45vh]" aria-label="Chargement des instructions de paiement" />;
  if (!order) {
    return (
      <section className="rounded-3xl border border-[#e7dece] bg-white p-8 text-center shadow-sm sm:p-12">
        <h1 className="wood-heading text-3xl font-semibold text-[#173a27]">Récapitulatif indisponible</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#71695d]">Les informations de paiement ne sont plus dans cette session. Revenez au panier pour vérifier votre commande ou contactez-nous.</p>
        <Link href="/commande" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#21492d] px-5 py-3 text-sm font-semibold text-white">Retour à ma commande <ArrowRight size={16} /></Link>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-3xl border border-[#dbe6d9] bg-[#f1f7ef] p-5 sm:p-7">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#21492d] text-white"><Check size={22} /></span>
        <p className="mt-4 text-xs font-bold uppercase tracking-[.16em] text-[#527452]">Demande transmise</p>
        <h1 className="wood-heading mt-2 text-3xl font-semibold text-[#173a27] sm:text-4xl">Merci, {order.customer.firstName}.</h1>
        <p className="mt-2 text-sm leading-6 text-[#5f675c]">Votre commande <strong>{order.reference}</strong> a été envoyée à HolzNest. Un e-mail récapitulatif a été transmis à notre équipe.</p>
      </div>

      <section className="mt-6 rounded-3xl border border-[#e7dece] bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-2 text-[#21492d]">{order.payment.method === 'link' ? <CreditCard size={19} /> : <Landmark size={19} />}<h2 className="font-bold">Règlement de l’acompte</h2></div>
        <p className="mt-4 rounded-xl bg-[#fbf6eb] p-4 text-sm leading-6 text-[#514b42]">
          Pour confirmer votre commande, réglez un acompte correspondant à <strong>50 % du montant total, livraison comprise</strong>. Le solde restant sera à régler selon les modalités confirmées par HolzNest.
        </p>

        <div className="mt-5 rounded-2xl border border-[#e8dfd1] p-4 sm:p-5">
          <dl className="space-y-2.5 text-sm">
            <Row label="Montant du bois" value={formatWoodPrice(order.subtotal)} />
            <Row label="Frais de livraison" value={formatWoodPrice(order.deliveryFee)} />
            <Row label="Total de la commande" value={formatWoodPrice(order.total)} />
            <div className="my-3 border-t border-[#e8dfd1]" />
            <Row label="Acompte à régler maintenant" value={formatWoodPrice(order.deposit)} emphasis />
            <Row label="Solde restant" value={formatWoodPrice(order.remaining)} />
          </dl>
        </div>

        {order.payment.method === 'link' ? (
          <a href={order.payment.url} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#21492d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#173a22]">
            Ouvrir le lien de paiement <ArrowRight size={17} />
          </a>
        ) : (
          <div className="mt-5 rounded-2xl border border-[#d9cfbd] bg-[#fcfaf5] p-4 sm:p-5">
            <h3 className="font-semibold text-[#26372a]">Coordonnées bancaires</h3>
            {order.payment.bankName && <p className="mt-2 text-sm text-[#645f55]">Banque : {order.payment.bankName}</p>}
            <p className="mt-2 text-sm text-[#645f55]">Titulaire : <strong className="text-[#343c33]">{order.payment.accountHolder}</strong></p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1"><p className="text-xs text-[#766e62]">IBAN</p><p className="mt-1 break-all font-mono text-sm font-semibold tracking-wide text-[#26372a]">{order.payment.iban}</p></div>
              <button type="button" onClick={() => void copyIban(order.payment.method === 'rib' ? order.payment.iban : '')} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#cbd6c8] bg-white px-4 py-2 text-sm font-semibold text-[#21492d] hover:bg-[#f3f7f1]">
                {copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copié' : 'Copier l’IBAN'}
              </button>
            </div>
            {order.payment.bic && <p className="mt-3 text-sm text-[#645f55]">BIC : <strong className="font-mono text-[#343c33]">{order.payment.bic}</strong></p>}
            <p className="mt-4 text-xs leading-5 text-[#766e62]">Indiquez la référence <strong>{order.reference}</strong> dans le motif du virement et réglez le montant de l’acompte affiché ci-dessus.</p>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-3xl border border-[#e7dece] bg-white p-5 shadow-sm sm:p-7">
        <h2 className="font-bold text-[#173a27]">Votre commande</h2>
        <ul className="mt-4 divide-y divide-[#eee7dc]">
          {order.lines.map((line, index) => <li key={`${line.slug}-${line.lengthCm}-${index}`} className="flex justify-between gap-4 py-3 text-sm"><span>{line.quantity} m³ · {line.name} · {lengthLabel(line.lengthCm)}</span><strong>{formatWoodPrice(line.total)}</strong></li>)}
        </ul>
        <p className="mt-4 border-t border-[#eee7dc] pt-4 text-sm text-[#625b50]">Livraison à : {order.customer.address}, {order.customer.postalCode} {order.customer.city}</p>
      </section>
      <p className="mt-5 text-center text-xs leading-5 text-[#766e62]">HolzNest vous contactera pour confirmer la disponibilité, le créneau et les détails de livraison.</p>
    </div>
  );
}

function Row({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return <div className={`flex items-center justify-between gap-4 ${emphasis ? 'text-base font-bold text-[#173a27]' : 'text-sm text-[#645f55]'}`}><dt>{label}</dt><dd className="shrink-0">{value}</dd></div>;
}
