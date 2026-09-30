export const CART_STORAGE_KEY = 'bois-foret-cart-v1';
export const ORDER_CONFIRMATION_STORAGE_KEY = 'holznest-order-confirmation-v1';

export type StoredCartLine = {
  key: string;
  slug: string;
  name: string;
  length: string;
  lengthCm?: number;
  quantity: number;
  unitPrice: number;
};

export function normalizeCartLine(value: unknown): StoredCartLine | null {
  if (!value || typeof value !== 'object') return null;
  const line = value as Partial<StoredCartLine>;
  const slug = typeof line.slug === 'string' ? line.slug : '';
  const legacyLength = line.length?.trim().toLowerCase() === '1 m' ? 100 : line.length?.match(/\d+/)?.[0];
  const lengthCm = Number(line.lengthCm ?? legacyLength ?? 0);
  const quantity = Number(line.quantity);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || ![25, 33, 40, 50, 100].includes(lengthCm)) return null;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) return null;
  return {
    key: `${slug}-${lengthCm}`,
    slug,
    name: typeof line.name === 'string' ? line.name : slug,
    length: lengthCm === 100 ? '1 m' : `${lengthCm} cm`,
    lengthCm,
    quantity,
    unitPrice: Number.isFinite(Number(line.unitPrice)) ? Number(line.unitPrice) : 0,
  };
}
