import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { ContactSettingsForm } from '@/components/admin/contact-settings-form';

export const metadata: Metadata = { title: 'Footer-Kontaktdaten' };
export const dynamic = 'force-dynamic';

export default async function AdminContactSettingsPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('site_contact_settings')
    .select('contact_email,phone_numbers')
    .eq('id', 1)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-[#806344]">HolzNest · Website-Einstellungen</p>
        <h1 className="mt-1 text-2xl font-extrabold text-ink-900">Footer-Kontaktdaten</h1>
        <p className="mt-1 text-sm text-ink-500">
          Verwalten Sie die Kontakt-E-Mail-Adresse und Telefonnummern, die Besuchern im Footer angezeigt werden.
        </p>
      </header>
      {error ? (
        <div role="alert" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Wenden Sie die Migration <code>20261001_site_contact_settings.sql</code> in Supabase an, um diese Einstellungen zu aktivieren.
        </div>
      ) : null}
      <ContactSettingsForm
        initialEmail={data?.contact_email ?? ''}
        initialPhoneNumbers={data?.phone_numbers ?? []}
      />
    </div>
  );
}
