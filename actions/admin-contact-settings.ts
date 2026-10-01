'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidAdminSessionToken } from '@/lib/auth/admin-session';
import { ADMIN_SESSION_COOKIE } from '@/lib/utils/constants';
import { logAdminAction } from '@/lib/data/history';

const contactSettingsSchema = z.object({
  contactEmail: z.string().trim().max(254).email('Bitte geben Sie eine gültige E-Mail-Adresse ein.').or(z.literal('')),
  phoneNumbers: z.array(
    z.string()
      .trim()
      .min(5, 'Bitte geben Sie eine gültige Telefonnummer ein.')
      .max(40, 'Telefonnummern dürfen höchstens 40 Zeichen enthalten.')
      .regex(/^\+?[\d\s()./-]+$/, 'Bitte geben Sie eine gültige Telefonnummer ein.')
  ).max(10, 'Sie können höchstens 10 Telefonnummern hinzufügen.'),
});

export type ContactSettingsInput = z.infer<typeof contactSettingsSchema>;
export type ContactSettingsResult = { success: boolean; message: string };

export async function saveAdminContactSettings(value: unknown): Promise<ContactSettingsResult> {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!await isValidAdminSessionToken(token)) {
    return { success: false, message: 'Ihre Administratorsitzung ist abgelaufen. Bitte melden Sie sich erneut an.' };
  }

  const parsed = contactSettingsSchema.safeParse(value);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? 'Bitte überprüfen Sie Ihre Kontaktdaten.',
    };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('site_contact_settings').upsert({
    id: 1,
    contact_email: parsed.data.contactEmail,
    phone_numbers: parsed.data.phoneNumbers,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  if (error) {
    return {
      success: false,
      message: 'Die Kontaktdaten konnten nicht gespeichert werden. Bitte wenden Sie die Supabase-Migration für die Footer-Kontaktdaten an.',
    };
  }

  await logAdminAction({ action: 'site.contact_settings.update', entityType: 'site_contact_settings', entityId: '1' });
  revalidatePath('/admin/kontakt');
  revalidatePath('/', 'layout');
  return { success: true, message: 'Die Footer-Kontaktdaten wurden gespeichert.' };
}
