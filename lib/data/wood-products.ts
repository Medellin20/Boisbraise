import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { WoodProductImageRecord, WoodProductPackageRecord, WoodProductRecord } from '@/types/database';
import { WOOD_PACKAGES } from '@/lib/utils/wood-packages';
export { WOOD_LENGTHS, formatWoodPrice, lengthLabel } from '@/lib/utils/wood';
export type WoodProduct = WoodProductRecord & { wood_product_images: WoodProductImageRecord[]; wood_product_packages: WoodProductPackageRecord[] };
function fallbackImage(slug: string) { return ({ chene: '/images/wood/logs-oak.svg', hetre: '/images/wood/logs-beech.svg', frene: '/images/wood/logs-ash.svg' } as Record<string, string>)[slug] ?? null; }
async function attachRelations(rows: WoodProductRecord[]): Promise<WoodProduct[]> {
  if (!rows.length) return [];
  const supabase = createClient();
  const ids = rows.map((row) => row.id);
  const [images, packages] = await Promise.all([
    supabase.from('wood_product_images').select('*').in('product_id', ids).order('sort_order'),
    supabase.from('wood_product_packages').select('*').in('product_id', ids).order('sort_order'),
  ]);
  return rows.map((row) => {
    const productImages = images.data?.filter((img) => img.product_id === row.id) ?? [];
    const localImage = fallbackImage(row.slug);
    if (!productImages.length && localImage) productImages.push({ id: `local-${row.slug}`, product_id: row.id, storage_path: '', url: localImage, alt_text: row.name, is_primary: true, sort_order: 0, created_at: row.created_at });
    const productPackages = packages.data?.filter((item) => item.product_id === row.id) ?? [];
    const orderedPackages = WOOD_PACKAGES.map((option) =>
      productPackages.find((item) => item.package_code === option.code)
    ).filter((item): item is WoodProductPackageRecord => Boolean(item));
    return {
      ...row,
      wood_product_images: productImages,
      wood_product_packages: orderedPackages,
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
  if (error || !data) return null;
  return (await attachRelations([data]))[0] ?? null;
}
