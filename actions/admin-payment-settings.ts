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
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['paymentUrl'], message: 'Saisissez un lien de paiement HTTPS valide.' });
    }
  } else {
    const iban = value.bankIban.replace(/\s/g, '').toUpperCase();
    if (!value.bankAccountHolder) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['bankAccountHolder'], message: 'Le nom du titulaire est requis pour le RIB.' });
    if (!/^[A-Z]{2}[A-Z0-9]{13,32}$/.test(iban)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['bankIban'], message: 'Saisissez un IBAN valide.' });
  }
});

export type PaymentSettingsInput = z.infer<typeof settingsSchema>;
export type PaymentSettingsResult = { success: boolean; message: string };

export async function saveAdminPaymentSettings(value: unknown): Promise<PaymentSettingsResult> {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!await isValidAdminSessionToken(token)) return { success: false, message: 'Session administrateur expirée. Reconnectez-vous.' };
  const parsed = settingsSchema.safeParse(value);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? 'Vérifiez vos réglages.' };

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
  if (error) return { success: false, message: 'Impossible d’enregistrer. Appliquez la migration des réglages de paiement Supabase, puis réessayez.' };

  await logAdminAction({ action: 'store.payment_settings.update', entityType: 'store_settings', entityId: '1' });
  revalidatePath('/admin/paiement');
  return { success: true, message: 'Moyen de paiement enregistré.' };
}
