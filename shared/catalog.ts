export const WOOD_CATEGORIES = [
  "Chêne",
  "Hêtre",
  "Frêne",
  "Charme",
  "Mélange",
] as const;

export const LOG_LENGTHS = ["25 cm", "33 cm", "40 cm", "50 cm", "1 m"] as const;

export type WoodCategory = (typeof WOOD_CATEGORIES)[number];
export type LogLength = (typeof LOG_LENGTHS)[number];

export type CatalogImage = {
  id: number;
  path: string;
  isPrimary: boolean;
};

export type CatalogProduct = {
  id: string;
  name: string;
  description: string;
  category: WoodCategory;
  stock: number;
  prices: Record<LogLength, number>;
  images: CatalogImage[];
};
