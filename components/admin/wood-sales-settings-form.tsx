'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { saveAdminWoodSalesSettings, type WoodSalesSettingsInput } from '@/actions/admin-wood-sales-settings';
import type { WoodSalesSettings } from '@/lib/data/wood-sales-settings';

const inputClass = 'mt-1 block w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900';

export function WoodSalesSettingsForm({ initial }: { initial: WoodSalesSettings }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [allowedLengthsCm, setAllowedLengthsCm] = useState(initial.allowedLengthsCm);
  const [maxQuantity, setMaxQuantity] = useState(String(initial.maxQuantityPerProduct));
  const [packages, setPackages] = useState(initial.packages.map((item, sortOrder) => ({
    packageCode: item.package_code as WoodSalesSettingsInput['packages'][number]['packageCode'],
    label: item.label,
    price: item.price == null ? '' : String(item.price),
    sortOrder,
  })));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const value: WoodSalesSettingsInput = {
      allowedLengthsCm,
      maxQuantityPerProduct: Number(maxQuantity),
      packages: packages.map((item) => ({
        packageCode: item.packageCode,
        label: item.label.trim(),
        price: item.price.trim() === '' ? null : Number(item.price),
        sortOrder: item.sortOrder,
      })),
    };
    try {
      const result = await saveAdminWoodSalesSettings(value);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    } catch {
      toast.error('Die Einstellungen konnten nicht gespeichert werden. Prüfen Sie die Verbindung zu Supabase.');
    } finally {
      setPending(false);
    }
  }

  function addLength() {
    const nextLength = [25, 33, 40, 50, 100].find((length) => !allowedLengthsCm.includes(length))
      ?? Array.from({ length: 291 }, (_, index) => index + 10).find((length) => !allowedLengthsCm.includes(length));
    if (nextLength != null && allowedLengthsCm.length < 12) {
      setAllowedLengthsCm((current) => [...current, nextLength].sort((a, b) => a - b));
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="rounded-2xl border border-ink-100 bg-white p-5 sm:p-6">
        <h2 className="font-bold text-ink-900">Gemeinsame Formate, Größen und Preise</h2>
        <p className="mt-1 text-sm text-ink-500">Diese fünf Formate und Preise gelten einheitlich für alle sechs Holzarten.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {packages.map((item, index) => (
            <fieldset key={item.packageCode} className="rounded-xl border border-ink-100 p-4">
              <legend className="px-1 text-sm font-semibold text-ink-800">Format {index + 1}</legend>
              <label className="block text-sm font-medium text-ink-700">
                Formatname
                <input required maxLength={80} value={item.label} onChange={(event) => setPackages((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, label: event.target.value } : entry))} className={inputClass} />
              </label>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="text-sm font-medium text-ink-700">
                  Preis (€)
                  <input type="number" min="0" step="0.01" value={item.price} placeholder="Auf Anfrage" onChange={(event) => setPackages((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, price: event.target.value } : entry))} className={inputClass} />
                </label>
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-ink-100 bg-white p-5 sm:p-6">
        <h2 className="font-bold text-ink-900">Verfügbare Scheitlängen</h2>
        <p className="mt-1 text-sm text-ink-500">Für alle Holzarten werden dieselben Längen angeboten.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {allowedLengthsCm.map((length, index) => (
            <div key={`${index}-${length}`} className="flex items-end gap-2">
              <label className="text-sm font-medium text-ink-700">
                Länge (cm)
                <input required type="number" min="10" max="300" step="1" value={length} onChange={(event) => {
                  const nextLength = Number(event.target.value);
                  setAllowedLengthsCm((current) => current.map((value, itemIndex) => itemIndex === index ? nextLength : value));
                }} className={`${inputClass} w-28`} />
              </label>
              <button type="button" onClick={() => setAllowedLengthsCm((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="mb-0.5 min-h-11 rounded-xl border border-ink-200 px-3 text-sm text-ink-700 hover:bg-sand-100">
                Entfernen
              </button>
            </div>
          ))}
        </div>
        <button type="button" disabled={allowedLengthsCm.length >= 12} onClick={addLength} className="mt-3 min-h-10 rounded-xl border border-[#cbd6c8] px-3 text-sm font-semibold text-[#21492d] disabled:opacity-50">
          Länge hinzufügen
        </button>
        {(!allowedLengthsCm.length || new Set(allowedLengthsCm).size !== allowedLengthsCm.length || allowedLengthsCm.some((length) => !Number.isInteger(length) || length < 10 || length > 300)) && (
          <p role="alert" className="mt-2 text-sm text-red-700">Fügen Sie mindestens eine eindeutige Länge zwischen 10 und 300 cm hinzu.</p>
        )}
      </section>

      <section className="rounded-2xl border border-ink-100 bg-white p-5 sm:p-6">
        <h2 className="font-bold text-ink-900">Höchstmenge pro Holzart</h2>
        <p className="mt-1 text-sm text-ink-500">Maximale Gesamtzahl der Einheiten je Holzart und Bestellung (1 bis 1.000). Der verfügbare Lagerbestand kann die Menge weiter begrenzen.</p>
        <label className="mt-4 block max-w-xs text-sm font-medium text-ink-700">
          Höchstmenge
          <input required type="number" min="1" max="1000" step="1" value={maxQuantity} onChange={(event) => setMaxQuantity(event.target.value)} className={inputClass} />
        </label>
      </section>

      <section className="rounded-2xl border border-ink-100 bg-white p-5 sm:p-6">
        <h2 className="font-bold text-ink-900">Standardlieferung</h2>
        <p className="mt-1 text-sm text-ink-500">Die Lieferung kostet 30 % des Warenwerts. Bei 100 € Warenwert betragen die Lieferkosten 30 €, insgesamt also 130 €.</p>
      </section>

      <button type="submit" disabled={pending || allowedLengthsCm.length === 0 || new Set(allowedLengthsCm).size !== allowedLengthsCm.length || allowedLengthsCm.some((length) => !Number.isInteger(length) || length < 10 || length > 300)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#21492d] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        <Save size={16} />{pending ? 'Wird gespeichert…' : 'Gemeinsame Einstellungen speichern'}
      </button>
    </form>
  );
}
