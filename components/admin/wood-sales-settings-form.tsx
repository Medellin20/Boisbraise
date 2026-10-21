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
    volumeLitres: String(item.volume_litres),
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
        volumeLitres: Number(item.volumeLitres),
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
      toast.error('Les paramètres n’ont pas pu être enregistrés. Vérifiez la connexion à Supabase.');
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
        <h2 className="font-bold text-ink-900">Formats, tailles et prix communs</h2>
        <p className="mt-1 text-sm text-ink-500">Ces quatre tarifs et contenances s’appliquent uniformément aux six essences.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {packages.map((item, index) => (
            <fieldset key={item.packageCode} className="rounded-xl border border-ink-100 p-4">
              <legend className="px-1 text-sm font-semibold text-ink-800">Format {index + 1}</legend>
              <label className="block text-sm font-medium text-ink-700">
                Nom du format
                <input required maxLength={80} value={item.label} onChange={(event) => setPackages((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, label: event.target.value } : entry))} className={inputClass} />
              </label>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="text-sm font-medium text-ink-700">
                  Contenance (litres)
                  <input required type="number" min="0.01" max="100000" step="0.01" value={item.volumeLitres} onChange={(event) => setPackages((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, volumeLitres: event.target.value } : entry))} className={inputClass} />
                </label>
                <label className="text-sm font-medium text-ink-700">
                  Prix (€)
                  <input type="number" min="0" step="0.01" value={item.price} placeholder="Sur devis" onChange={(event) => setPackages((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, price: event.target.value } : entry))} className={inputClass} />
                </label>
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-ink-100 bg-white p-5 sm:p-6">
        <h2 className="font-bold text-ink-900">Longueurs de bûches disponibles</h2>
        <p className="mt-1 text-sm text-ink-500">Les mêmes longueurs seront proposées pour toutes les essences.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {allowedLengthsCm.map((length, index) => (
            <div key={`${index}-${length}`} className="flex items-end gap-2">
              <label className="text-sm font-medium text-ink-700">
                Longueur (cm)
                <input required type="number" min="10" max="300" step="1" value={length} onChange={(event) => {
                  const nextLength = Number(event.target.value);
                  setAllowedLengthsCm((current) => current.map((value, itemIndex) => itemIndex === index ? nextLength : value));
                }} className={`${inputClass} w-28`} />
              </label>
              <button type="button" onClick={() => setAllowedLengthsCm((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="mb-0.5 min-h-11 rounded-xl border border-ink-200 px-3 text-sm text-ink-700 hover:bg-sand-100">
                Supprimer
              </button>
            </div>
          ))}
        </div>
        <button type="button" disabled={allowedLengthsCm.length >= 12} onClick={addLength} className="mt-3 min-h-10 rounded-xl border border-[#cbd6c8] px-3 text-sm font-semibold text-[#21492d] disabled:opacity-50">
          Ajouter une longueur
        </button>
        {(!allowedLengthsCm.length || new Set(allowedLengthsCm).size !== allowedLengthsCm.length || allowedLengthsCm.some((length) => !Number.isInteger(length) || length < 10 || length > 300)) && (
          <p role="alert" className="mt-2 text-sm text-red-700">Ajoutez au moins une longueur distincte comprise entre 10 et 300 cm.</p>
        )}
      </section>

      <section className="rounded-2xl border border-ink-100 bg-white p-5 sm:p-6">
        <h2 className="font-bold text-ink-900">Limite de quantité par essence</h2>
        <p className="mt-1 text-sm text-ink-500">Nombre maximal d’unités d’un même format cumulées par essence et par commande (1 à 1 000). Le stock disponible peut imposer une limite plus basse.</p>
        <label className="mt-4 block max-w-xs text-sm font-medium text-ink-700">
          Quantité maximale
          <input required type="number" min="1" max="1000" step="1" value={maxQuantity} onChange={(event) => setMaxQuantity(event.target.value)} className={inputClass} />
        </label>
      </section>

      <button type="submit" disabled={pending || allowedLengthsCm.length === 0 || new Set(allowedLengthsCm).size !== allowedLengthsCm.length || allowedLengthsCm.some((length) => !Number.isInteger(length) || length < 10 || length > 300)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#21492d] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        <Save size={16} />{pending ? 'Enregistrement…' : 'Enregistrer les paramètres communs'}
      </button>
    </form>
  );
}
