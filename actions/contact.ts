'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { contactSchema, type ContactInput } from '@/lib/validations/contact';
import type { ActionResult } from '@/types';
import { sendAdminAlert } from '@/lib/notifications/email';

export async function submitContactMessage(input: ContactInput): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Bitte korrigieren Sie die markierten Felder.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (parsed.data.website) {
    return { success: true, message: 'Ihre Nachricht wurde gesendet.' };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('contact_messages').insert({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });

  if (error) {
    return { success: false, message: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' };
  }

  await sendAdminAlert(`Nouveau message de contact — ${parsed.data.subject}`, {
    Nom: parsed.data.name,
    Email: parsed.data.email,
    Téléphone: parsed.data.phone || null,
    Sujet: parsed.data.subject,
    Message: parsed.data.message,
  });

  return { success: true, message: 'Ihre Nachricht wurde gesendet. Wir melden uns schnellstmöglich bei Ihnen.' };
}
