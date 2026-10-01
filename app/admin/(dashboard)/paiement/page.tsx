import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { PaymentSettingsForm } from '@/components/admin/payment-settings-form';

export const metadata: Metadata = { title: 'Zahlung & Bankverbindung' };
export const dynamic = 'force-dynamic';

export default async function AdminPaymentSettingsPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('wood_store_settings').select('*').eq('id', 1).maybeSingle();
  const initial = {
    paymentMethod: data?.payment_method ?? 'rib',
    paymentUrl: data?.payment_url ?? '',
    bankName: data?.bank_name ?? '',
    bankAccountHolder: data?.bank_account_holder ?? '',
    bankIban: data?.bank_iban ?? '',
    bankBic: data?.bank_bic ?? '',
  } as const;
  return <div className="mx-auto max-w-4xl">
    <header className="mb-6"><p className="text-xs font-bold uppercase tracking-widest text-[#806344]">HolzNest · Shop-Einstellungen</p><h1 className="mt-1 text-2xl font-extrabold text-ink-900">Zahlung & Bankverbindung</h1><p className="mt-1 text-sm text-ink-500">Speichern Sie Ihre Zahlungsdaten und wählen Sie aus, welche Zahlungsart Kunden nach der Bestellung sehen.</p></header>
    {error ? <div role="alert" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">Wenden Sie die Migration <code>20260930_wood_store_settings.sql</code> in Supabase, um diese Einstellungen zu aktivieren.</div> : null}
    <PaymentSettingsForm initial={initial} />
  </div>;
}
