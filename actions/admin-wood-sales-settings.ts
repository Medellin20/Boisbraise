'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidAdminSessionToken } from '@/lib/auth/admin-session';
import { ADMIN_SESSION_COOKIE } from '@/lib/utils/constants';
import { logAdminAction } from '@/lib/data/history';
import { MAX_WOOD_ORDER_QUANTITY } from '@/lib/data/wood-sales-settings';

const packageCodes = ['12_5_litres', '20_litres', '40_litres', '1_rm'] as const;
const settingsSchema = z.object({
  allowedLengthsCm: z.array(z.number().int().min(10).max(300)).min(1).max(12),
  maxQuantityPerProduct: z.number().int().min(1).max(MAX_WOOD_ORDER_QUANTITY),
  packages: z.array(z.object({
    packageCode: z.enum(packageCodes),
    label: z.string().trim().min(1).max(80),
    volumeLitres: z.number().finite().positive().max(100000),
    price: z.number().finite().nonnegative().nullable(),
    sortOrder: z.number().int().min(0).max(999),
  })).length(packageCodes.length),
}).superRefine((settings, ctx) => {
  if (new Set(settings.allowedLengthsCm).size !== settings.allowedLengthsCm.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['allowedLengthsCm'], message: 'Jede Scheitlänge darf nur einmal ausgewählt werden.' });
  }
  if (new Set(settings.packages.map((item) => item.packageCode)).size !== packageCodes.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['packages'], message: 'Jedes Verkaufsformat muss genau einmal angegeben werden.' });
  }
});

export type WoodSalesSettingsInput = z.infer<typeof settingsSchema>;
export type WoodSalesSettingsResult = { success: boolean; message: string };

export async function saveAdminWoodSalesSettings(value: unknown): Promise<WoodSalesSettingsResult> {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!await isValidAdminSessionToken(token)) {
    return { success: false, message: 'Ihre Administratorsitzung ist abgelaufen. Bitte melden Sie sich erneut an.' };
  }
  const parsed = settingsSchema.safeParse(value);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? 'Bitte überprüfen Sie die Verkaufsparameter.' };
  }

  const supabase = createAdminClient();
  const { error: packageError } = await supabase.from('wood_sales_packages').upsert(
    parsed.data.packages.map((item) => ({
      package_code: item.packageCode,
      label: item.label,
      volume_litres: item.volumeLitres,
      price: item.price,
      sort_order: item.sortOrder,
    })),
    { onConflict: 'package_code' }
  );
  if (packageError) {
    return { success: false, message: 'Die Formate und Preise konnten nicht gespeichert werden. Prüfen Sie die Shop-Einstellungs-Migration.' };
  }

  const { error: settingsError } = await supabase.from('wood_sales_settings').upsert({
    id: 1,
    allowed_lengths_cm: [...new Set(parsed.data.allowedLengthsCm)].sort((a, b) => a - b),
    max_quantity_per_product: parsed.data.maxQuantityPerProduct,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });
  if (settingsError) {
    return { success: false, message: 'Les formats et prix sont enregistrés, mais les quantités et longueurs n’ont pas été enregistrées. Veuillez réessayer.' };
  }

  await logAdminAction({ action: 'store.wood_sales_settings.update', entityType: 'wood_sales_settings', entityId: '1' });
  revalidatePath('/');
  revalidatePath('/catalogue');
  revalidatePath('/catalogue/[slug]', 'page');
  revalidatePath('/admin/bois');
  revalidatePath('/admin/vente');
  return { success: true, message: 'Die gemeinsamen Verkaufsparameter für alle Holzarten wurden gespeichert.' };
}
