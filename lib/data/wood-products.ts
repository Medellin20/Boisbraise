import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { WoodProductImageRecord, WoodProductRecord } from '@/types/database';
import { getPublicWoodSalesSettings, type WoodSalesSettings } from '@/lib/data/wood-sales-settings';
export { WOOD_LENGTHS, formatWoodPrice, lengthLabel } from '@/lib/utils/wood';
export type WoodProduct = WoodProductRecord & {
  wood_product_images: WoodProductImageRecord[];
  wood_sales_settings: WoodSalesSettings | null;
};
function fallbackImage(slug: string) { return ({ chene: '/images/wood/logs-oak.svg', hetre: '/images/wood/logs-beech.svg', frene: '/images/wood/logs-ash.svg' } as Record<string, string>)[slug] ?? null; }
async function attachRelations(rows: WoodProductRecord[]): Promise<WoodProduct[]> {
  if (!rows.length) return [];
  const supabase = createClient();
  const ids = rows.map((row) => row.id);
  const [images, salesSettings] = await Promise.all([
    supabase.from('wood_product_images').select('*').in('product_id', ids).order('sort_order'),
    getPublicWoodSalesSettings(),
  ]);
  if (images.error) console.error('attachWoodProductImages:', images.error.message);
  if (!salesSettings) console.error('attachWoodSalesSettings: Sales settings are unavailable or invalid.');
  return rows.map((row) => {
    const productImages = images.data?.filter((img) => img.product_id === row.id) ?? [];
    const localImage = fallbackImage(row.slug);
    if (!productImages.length && localImage) productImages.push({ id: `local-${row.slug}`, product_id: row.id, storage_path: '', url: localImage, alt_text: row.name, is_primary: true, sort_order: 0, created_at: row.created_at });
    return {
      ...row,
      wood_product_images: productImages,
      wood_sales_settings: salesSettings,
    };
  });
}
export async function getPublishedWoodProducts(): Promise<WoodProduct[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from('wood_products').select('*').eq('is_published', true).order('sort_order').order('name');
  if (error) { console.error('getPublishedWoodProducts:', error.message); return []; }
  return attachRelations(data ?? []);
}
export async function getPublishedWoodProduct(slug: string): Promise<WoodProduct | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from('wood_products').select('*').eq('slug', slug).eq('is_published', true).maybeSingle();
  if (error) {
    console.error('getPublishedWoodProduct:', error.message);
    return null;
  }
  if (!data) return null;
  return (await attachRelations([data]))[0] ?? null;
}
