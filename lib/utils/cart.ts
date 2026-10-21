import { getWoodPackage, MAX_WOOD_ORDER_QUANTITY, type WoodPackageCode } from '@/lib/utils/wood-packages';

export const CART_STORAGE_KEY = 'bois-foret-cart-v1';
export const ORDER_CONFIRMATION_STORAGE_KEY = 'holznest-order-confirmation-v1';

export type StoredCartLine = {
  key: string;
  slug: string;
  name: string;
  length: string;
  lengthCm?: number;
  packageCode?: WoodPackageCode;
  quantity: number;
  unitPrice: number;
};

export function normalizeCartLine(value: unknown): StoredCartLine | null {
  if (!value || typeof value !== 'object') return null;
  const line = value as Partial<StoredCartLine>;
  const slug = typeof line.slug === 'string' ? line.slug : '';
  const lengthText = typeof line.length === 'string' ? line.length : '';
  const legacyLength = lengthText.trim().toLowerCase() === '1 m' ? 100 : lengthText.match(/\d+/)?.[0];
  const lengthCm = Number(line.lengthCm ?? legacyLength ?? 0);
  const quantity = Number(line.quantity);
  const packageCode = typeof line.packageCode === 'string' ? getWoodPackage(line.packageCode)?.code : undefined;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !packageCode || !Number.isInteger(lengthCm) || lengthCm < 10 || lengthCm > 300) return null;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_WOOD_ORDER_QUANTITY) return null;
  return {
    key: `${slug}-${packageCode}-${lengthCm}`,
    slug,
    name: typeof line.name === 'string' ? line.name : slug,
    length: lengthCm === 100 ? '1 m' : `${lengthCm} cm`,
    lengthCm,
    packageCode,
    quantity,
    unitPrice: Number.isFinite(Number(line.unitPrice)) ? Number(line.unitPrice) : 0,
  };
}
