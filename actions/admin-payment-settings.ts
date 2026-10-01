'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidAdminSessionToken } from '@/lib/auth/admin-session';
import { ADMIN_SESSION_COOKIE } from '@/lib/utils/constants';
import { logAdminAction } from '@/lib/data/history';

const settingsSchema = z.object({
  paymentMethod: z.enum(['rib', 'link']),
  paymentUrl: z.string().trim().max(500).default(''),
  bankName: z.string().trim().max(120).default(''),
  bankAccountHolder: z.string().trim().max(160).default(''),
  bankIban: z.string().trim().max(50).default(''),
  bankBic: z.string().trim().max(20).default(''),
}).superRefine((value, ctx) => {
  if (value.paymentMethod === 'link') {
    try {
      if (new URL(value.paymentUrl).protocol !== 'https:') throw new Error();
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['paymentUrl'], message: 'Bitte geben Sie einen gültigen HTTPS-Zahlungslink ein.' });
    }
  } else {
    const iban = value.bankIban.replace(/\s/g, '').toUpperCase();
    if (!value.bankAccountHolder) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['bankAccountHolder'], message: 'Der Kontoinhaber ist erforderlich.' });
    if (!/^[A-Z]{2}[A-Z0-9]{13,32}$/.test(iban)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['bankIban'], message: 'Bitte geben Sie eine gültige IBAN ein.' });
  }
});

export type PaymentSettingsInput = z.infer<typeof settingsSchema>;
export type PaymentSettingsResult = { success: boolean; message: string };

export async function saveAdminPaymentSettings(value: unknown): Promise<PaymentSettingsResult> {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!await isValidAdminSessionToken(token)) return { success: false, message: 'Ihre Administratorsitzung ist abgelaufen. Bitte melden Sie sich erneut an.' };
  const parsed = settingsSchema.safeParse(value);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? 'Bitte überprüfen Sie Ihre Einstellungen.' };

  const data = parsed.data;
  const supabase = createAdminClient();
  const { error } = await supabase.from('wood_store_settings').upsert({
    id: 1,
    payment_method: data.paymentMethod,
    payment_url: data.paymentUrl,
    bank_name: data.bankName,
    bank_account_holder: data.bankAccountHolder,
    bank_iban: data.bankIban.replace(/\s/g, '').toUpperCase(),
    bank_bic: data.bankBic.replace(/\s/g, '').toUpperCase(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });
  if (error) return { success: false, message: 'Speichern nicht möglich. Wenden Sie die Supabase-Migration für Zahlungseinstellungen an und versuchen Sie es erneut.' };

  await logAdminAction({ action: 'store.payment_settings.update', entityType: 'store_settings', entityId: '1' });
  revalidatePath('/admin/paiement');
  return { success: true, message: 'Zahlungsart gespeichert.' };
}
