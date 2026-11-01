export const WOOD_PACKAGES = [
  { code: '12_5_litres', label: '12,5 Liter', volumeLitres: 12.5, defaultPrice: 4.5 },
  { code: '20_litres', label: '20 Liter', volumeLitres: 20, defaultPrice: 7 },
  { code: '40_litres', label: '40 Liter', volumeLitres: 40, defaultPrice: 14 },
  { code: '1_rm', label: '1 RM', volumeLitres: 1000, defaultPrice: 199 },
  { code: 'format_5', label: 'Format 5', volumeLitres: null, defaultPrice: null },
] as const;

export const MAX_WOOD_ORDER_QUANTITY = 1000;

export function woodPackageLabel(value: string): string {
  return value.replace(/\blitres?\b/gi, 'Liter');
}

export type WoodPackageCode = (typeof WOOD_PACKAGES)[number]['code'];

export function getWoodPackage(code: string) {
  return WOOD_PACKAGES.find((item) => item.code === code);
}
