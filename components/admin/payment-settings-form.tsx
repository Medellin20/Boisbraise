'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { saveAdminPaymentSettings, type PaymentSettingsInput } from '@/actions/admin-payment-settings';

const field = 'mt-1 block min-h-11 w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900';

export function PaymentSettingsForm({ initial }: { initial: PaymentSettingsInput }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [method, setMethod] = useState(initial.paymentMethod);

  async function submit(formData: FormData) {
    setPending(true);
    const value: PaymentSettingsInput = {
      paymentMethod: method,
      paymentUrl: String(formData.get('paymentUrl') ?? '').trim(),
      bankName: String(formData.get('bankName') ?? '').trim(),
      bankAccountHolder: String(formData.get('bankAccountHolder') ?? '').trim(),
      bankIban: String(formData.get('bankIban') ?? '').trim(),
      bankBic: String(formData.get('bankBic') ?? '').trim(),
    };
    try {
      const result = await saveAdminPaymentSettings(value);
      if (result.success) { toast.success(result.message); router.refresh(); }
      else toast.error(result.message);
    } catch {
      toast.error('Enregistrement impossible. Vérifiez la connexion à Supabase.');
    } finally {
      setPending(false);
    }
  }

  return <form onSubmit={(event) => { event.preventDefault(); void submit(new FormData(event.currentTarget)); }} className="space-y-6">
    <section className="rounded-2xl border border-ink-100 bg-white p-5 sm:p-6">
      <h2 className="font-bold text-ink-900">Moyen affiché au client</h2>
      <p className="mt-1 text-sm text-ink-500">Choisissez ce qui apparaît après l’envoi d’une commande. Les deux moyens peuvent être enregistrés ici.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${method === 'rib' ? 'border-[#31563b] bg-[#f3f7f1]' : 'border-ink-200'}`}>
          <input type="radio" name="paymentMethod" checked={method === 'rib'} onChange={() => setMethod('rib')} className="mt-1 accent-[#31563b]" />
          <span><strong className="block text-sm text-ink-900">Virement bancaire (RIB)</strong><span className="mt-1 block text-xs text-ink-500">Affiche l’IBAN à copier et les coordonnées du titulaire.</span></span>
        </label>
        <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${method === 'link' ? 'border-[#31563b] bg-[#f3f7f1]' : 'border-ink-200'}`}>
          <input type="radio" name="paymentMethod" checked={method === 'link'} onChange={() => setMethod('link')} className="mt-1 accent-[#31563b]" />
          <span><strong className="block text-sm text-ink-900">Lien de paiement</strong><span className="mt-1 block text-xs text-ink-500">Affiche un bouton qui redirige vers votre prestataire.</span></span>
        </label>
      </div>
    </section>

    <section className="rounded-2xl border border-ink-100 bg-white p-5 sm:p-6">
      <h2 className="font-bold text-ink-900">Lien de paiement</h2>
      <label className="mt-4 block text-sm font-medium text-ink-700">URL HTTPS<input name="paymentUrl" type="url" inputMode="url" placeholder="https://…" defaultValue={initial.paymentUrl} className={field} /></label>
    </section>

    <section className="rounded-2xl border border-ink-100 bg-white p-5 sm:p-6">
      <h2 className="font-bold text-ink-900">Coordonnées bancaires</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-ink-700">Nom de la banque<input name="bankName" maxLength={120} defaultValue={initial.bankName} className={field} /></label>
        <label className="text-sm font-medium text-ink-700">Titulaire du compte<input name="bankAccountHolder" maxLength={160} defaultValue={initial.bankAccountHolder} className={field} /></label>
        <label className="text-sm font-medium text-ink-700 sm:col-span-2">IBAN<input name="bankIban" autoComplete="off" maxLength={50} defaultValue={initial.bankIban} className={`${field} font-mono uppercase`} /></label>
        <label className="text-sm font-medium text-ink-700">BIC (facultatif)<input name="bankBic" maxLength={20} defaultValue={initial.bankBic} className={`${field} font-mono uppercase`} /></label>
      </div>
    </section>
    <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#21492d] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Save size={16} />{pending ? 'Enregistrement…' : 'Enregistrer les réglages'}</button>
  </form>;
}
