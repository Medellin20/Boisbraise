import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { WoodSalesPackageRecord, WoodSalesSettingRecord } from '@/types/database';
import { MAX_WOOD_ORDER_QUANTITY } from '@/lib/utils/wood-packages';

export { MAX_WOOD_ORDER_QUANTITY } from '@/lib/utils/wood-packages';

export type WoodSalesSettings = {
  allowedLengthsCm: number[];
  maxQuantityPerProduct: number;
  deliveryPricePerLitre: number;
  packages: WoodSalesPackageRecord[];
};

function normalizeSettings(
  setting: WoodSalesSettingRecord | null,
  packages: WoodSalesPackageRecord[] | null
): WoodSalesSettings | null {
  if (!setting || !packages) return null;
  if (!Array.isArray(setting.allowed_lengths_cm)) return null;
  const allowedLengthsCm = setting.allowed_lengths_cm
    .map(Number)
    .filter((length) => Number.isInteger(length) && length >= 10 && length <= 300);
  const normalizedPackages = packages.map((item) => ({
    ...item,
    volume_litres: Number(item.volume_litres),
    price: item.price == null ? null : Number(item.price),
  }));
  const packageCodes = normalizedPackages.map((item) => item.package_code);
  const maxQuantityPerProduct = Number(setting.max_quantity_per_product);
  const deliveryPricePerLitre = Number(setting.delivery_price_per_litre);
  if (!allowedLengthsCm.length || new Set(allowedLengthsCm).size !== allowedLengthsCm.length
    || normalizedPackages.length !== 4 || new Set(packageCodes).size !== 4
    || packageCodes.some((code) => !['12_5_litres', '20_litres', '40_litres', '1_rm'].includes(code))
    || !Number.isInteger(maxQuantityPerProduct) || maxQuantityPerProduct < 1 || maxQuantityPerProduct > MAX_WOOD_ORDER_QUANTITY
    || !Number.isFinite(deliveryPricePerLitre) || deliveryPricePerLitre < 0
    || normalizedPackages.some((item) => !Number.isFinite(item.volume_litres) || item.volume_litres <= 0
      || (item.price != null && (!Number.isFinite(item.price) || item.price < 0)))) {
    return null;
  }
  return {
    allowedLengthsCm: [...new Set(allowedLengthsCm)].sort((a, b) => a - b),
    maxQuantityPerProduct,
    deliveryPricePerLitre,
    packages: normalizedPackages.sort((a, b) => a.sort_order - b.sort_order),
  };
}

export async function getPublicWoodSalesSettings(): Promise<WoodSalesSettings | null> {
  const supabase = createClient();
  const [{ data: setting, error: settingError }, { data: packages, error: packagesError }] = await Promise.all([
    supabase.from('wood_sales_settings').select('*').eq('id', 1).maybeSingle(),
    supabase.from('wood_sales_packages').select('*').order('sort_order'),
  ]);
  if (settingError || packagesError) {
    console.error('getPublicWoodSalesSettings:', settingError?.message ?? packagesError?.message);
    return null;
  }
  return normalizeSettings(setting, packages);
}

export { normalizeSettings as normalizeWoodSalesSettings };
