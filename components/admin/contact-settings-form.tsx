'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Save, Trash2 } from 'lucide-react';
import { saveAdminContactSettings } from '@/actions/admin-contact-settings';

const field = 'mt-1 block min-h-11 w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900';

export function ContactSettingsForm({
  initialEmail,
  initialPhoneNumbers,
}: {
  initialEmail: string;
  initialPhoneNumbers: string[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState(initialPhoneNumbers.length ? initialPhoneNumbers : ['']);

  async function submit(formData: FormData) {
    setPending(true);
    const value = {
      contactEmail: String(formData.get('contactEmail') ?? '').trim(),
      phoneNumbers: phoneNumbers.map((number) => number.trim()).filter(Boolean),
    };

    try {
      const result = await saveAdminContactSettings(value);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Speichern fehlgeschlagen. Bitte überprüfen Sie die Verbindung zu Supabase.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit(new FormData(event.currentTarget));
      }}
      className="space-y-6"
    >
      <section className="rounded-2xl border border-ink-100 bg-white p-5 sm:p-6">
        <h2 className="font-bold text-ink-900">E-Mail-Adresse</h2>
        <p className="mt-1 text-sm text-ink-500">Diese Adresse wird im Kontaktbereich des Footers angezeigt.</p>
        <label className="mt-4 block text-sm font-medium text-ink-700">
          Kontakt-E-Mail
          <input
            name="contactEmail"
            type="email"
            autoComplete="email"
            maxLength={254}
            defaultValue={initialEmail}
            placeholder="kontakt@beispiel.de"
            className={field}
          />
        </label>
      </section>

      <section className="rounded-2xl border border-ink-100 bg-white p-5 sm:p-6">
        <h2 className="font-bold text-ink-900">Telefonnummern</h2>
        <p className="mt-1 text-sm text-ink-500">Fügen Sie eine oder mehrere Nummern hinzu. Leere Felder werden ignoriert.</p>
        <div className="mt-4 space-y-3">
          {phoneNumbers.map((number, index) => (
            <div key={index} className="flex items-end gap-2">
              <label className="min-w-0 flex-1 text-sm font-medium text-ink-700">
                Telefonnummer {index + 1}
                <input
                  type="tel"
                  autoComplete="tel"
                  maxLength={40}
                  value={number}
                  onChange={(event) => {
                    const next = [...phoneNumbers];
                    next[index] = event.target.value;
                    setPhoneNumbers(next);
                  }}
                  placeholder="+49 30 12345678"
                  className={field}
                />
              </label>
              <button
                type="button"
                onClick={() => setPhoneNumbers(phoneNumbers.filter((_, itemIndex) => itemIndex !== index))}
                disabled={phoneNumbers.length === 1}
                aria-label={`Telefonnummer ${index + 1} entfernen`}
                className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink-200 text-ink-600 transition-colors hover:border-red-200 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPhoneNumbers([...phoneNumbers, ''])}
          disabled={phoneNumbers.length >= 10}
          className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-ink-200 px-3 py-2 text-sm font-semibold text-ink-700 transition-colors hover:bg-sand-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} />
          Telefonnummer hinzufügen
        </button>
      </section>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#21492d] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        <Save size={16} />
        {pending ? 'Wird gespeichert …' : 'Kontaktdaten speichern'}
      </button>
    </form>
  );
}
