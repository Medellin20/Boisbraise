import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { WoodProductImageRecord, WoodProductLengthRecord, WoodProductRecord } from '@/types/database';

export type AdminWoodProduct = WoodProductRecord & {
  wood_product_images: WoodProductImageRecord[];
  wood_product_lengths: WoodProductLengthRecord[];
};

export async function getAllWoodProductsAdmin(): Promise<{
  products: AdminWoodProduct[];
  error: string | null;
}> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('wood_products')
    .select('*')
    .order('sort_order')
    .order('created_at', { ascending: false });

  if (error) {
    return { products: [], error: 'Catalogue bois indisponible. Appliquez la migration Supabase du catalogue bois.' };
  }

  const ids = (data ?? []).map((item) => item.id);
  if (!ids.length) return { products: [], error: null };

  const [{ data: images }, { data: lengths }] = await Promise.all([
    supabase.from('wood_product_images').select('*').in('product_id', ids).order('sort_order'),
    supabase.from('wood_product_lengths').select('*').in('product_id', ids).order('sort_order'),
  ]);

  const products = (data ?? []).map((product) => ({
    ...product,
    wood_product_images: images?.filter((image) => image.product_id === product.id) ?? [],
    wood_product_lengths: lengths?.filter((length) => length.product_id === product.id) ?? [],
  })) as AdminWoodProduct[];

  return { products, error: null };
}

export async function getWoodProductByIdAdmin(id: string): Promise<AdminWoodProduct | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('wood_products').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;

  const [{ data: images }, { data: lengths }] = await Promise.all([
    supabase.from('wood_product_images').select('*').eq('product_id', id).order('sort_order'),
    supabase.from('wood_product_lengths').select('*').eq('product_id', id).order('sort_order'),
  ]);

  return {
    ...data,
    wood_product_images: images ?? [],
    wood_product_lengths: lengths ?? [],
  } as AdminWoodProduct;
}
