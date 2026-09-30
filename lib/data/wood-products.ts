import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { WoodProductImageRecord, WoodProductLengthRecord, WoodProductRecord } from '@/types/database';
export { WOOD_LENGTHS, formatWoodPrice, lengthLabel } from '@/lib/utils/wood';
export type WoodProduct = WoodProductRecord & { wood_product_lengths: WoodProductLengthRecord[]; wood_product_images: WoodProductImageRecord[] };
function fallbackImage(slug: string) { return ({ chene: '/images/wood/logs-oak.svg', hetre: '/images/wood/logs-beech.svg', frene: '/images/wood/logs-ash.svg' } as Record<string, string>)[slug] ?? null; }
async function attachRelations(rows: WoodProductRecord[]): Promise<WoodProduct[]> {
  if (!rows.length) return [];
  const supabase = createClient();
  const ids = rows.map((row) => row.id);
  const [lengths, images] = await Promise.all([
    supabase.from('wood_product_lengths').select('*').in('product_id', ids).order('sort_order'),
    supabase.from('wood_product_images').select('*').in('product_id', ids).order('sort_order'),
  ]);
  return rows.map((row) => {
    const productImages = images.data?.filter((img) => img.product_id === row.id) ?? [];
    const localImage = fallbackImage(row.slug);
    if (!productImages.length && localImage) productImages.push({ id: `local-${row.slug}`, product_id: row.id, storage_path: '', url: localImage, alt_text: row.name, is_primary: true, sort_order: 0, created_at: row.created_at });
    return { ...row, wood_product_lengths: lengths.data?.filter((item) => item.product_id === row.id) ?? [], wood_product_images: productImages };
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
  if (error || !data) return null;
  return (await attachRelations([data]))[0] ?? null;
}
