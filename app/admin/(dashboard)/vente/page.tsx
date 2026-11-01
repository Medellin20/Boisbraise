import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeWoodSalesSettings } from '@/lib/data/wood-sales-settings';
import { WoodSalesSettingsForm } from '@/components/admin/wood-sales-settings-form';

export const metadata: Metadata = { title: 'Holzverkaufseinstellungen' };
export const dynamic = 'force-dynamic';

export default async function WoodSalesSettingsPage() {
  const supabase = createAdminClient();
  const [{ data: setting, error: settingError }, { data: packages, error: packagesError }] = await Promise.all([
    supabase.from('wood_sales_settings').select('*').eq('id', 1).maybeSingle(),
    supabase.from('wood_sales_packages').select('*').order('sort_order'),
  ]);
  const initial = settingError || packagesError ? null : normalizeWoodSalesSettings(setting, packages);

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-[#806344]">HolzNest · gemeinsame Einstellungen</p>
        <h1 className="mt-1 text-2xl font-extrabold text-ink-900">Holzverkauf</h1>
        <p className="mt-1 text-sm text-ink-500">Verwalten Sie hier die gemeinsamen Preise, Füllmengen, Längen, Mengen und Lieferkosten für alle sechs Holzarten.</p>
      </header>
      {!initial ? (
        <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
          {settingError || packagesError
            ? 'Die Verkaufseinstellungen sind nicht verfügbar. Wenden Sie die Migration 20261021_uniform_wood_sales_settings.sql in Supabase an.'
            : 'Die Verkaufseinstellungen sind unvollständig. Prüfen Sie, ob die Migration und ihre Ausgangsdaten angewendet wurden.'}
        </div>
      ) : <WoodSalesSettingsForm initial={initial} />}
    </div>
  );
}
