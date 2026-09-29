import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  LOG_LENGTHS,
  WOOD_CATEGORIES,
  type CatalogProduct,
  type LogLength,
  type WoodCategory,
} from "../shared/catalog";

export type OrderStatus = "new" | "confirmed" | "delivered" | "cancelled";

export type OrderItem = {
  productId: string;
  name: string;
  category: WoodCategory;
  logLength: LogLength;
  volume: number;
  unitPrice: number;
  total: number;
};

export type AdminOrder = {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  postalCode: string;
  address: string;
  deliveryNotes: string;
  items: OrderItem[];
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
};

const databasePath =
  process.env.CATALOG_DATABASE_PATH ||
  path.join(process.cwd(), "data", "catalog.sqlite");

mkdirSync(path.dirname(databasePath), { recursive: true });

const database = new DatabaseSync(databasePath);

database.exec(`
  PRAGMA busy_timeout = 10000;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    stock REAL NOT NULL DEFAULT 0 CHECK (stock >= 0)
  );
  CREATE TABLE IF NOT EXISTS product_prices (
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    log_length TEXT NOT NULL,
    price_per_m3 REAL NOT NULL CHECK (price_per_m3 >= 0),
    PRIMARY KEY (product_id, log_length)
  );
  CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1))
  );
  CREATE UNIQUE INDEX IF NOT EXISTS one_primary_image_per_product
    ON product_images(product_id) WHERE is_primary = 1;
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    address TEXT NOT NULL,
    delivery_notes TEXT NOT NULL DEFAULT '',
    items_json TEXT NOT NULL,
    delivery_fee REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'new'
      CHECK (status IN ('new', 'confirmed', 'delivered', 'cancelled')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS catalog_migrations (
    id TEXT PRIMARY KEY
  );
`);

const initialProducts: Array<{
  id: string;
  name: string;
  description: string;
  category: WoodCategory;
  image: string;
  prices: Record<LogLength, number>;
}> = [
  {
    id: "chene",
    name: "Chêne séché",
    description: "Une combustion lente et régulière, idéale pour les longues soirées.",
    category: "Chêne",
    image: "/images/catalog/chene.jpeg",
    prices: { "25 cm": 92, "33 cm": 84, "40 cm": 80, "50 cm": 74, "1 m": 66 },
  },
  {
    id: "hetre",
    name: "Hêtre séché",
    description: "Une chaleur homogène et un feu facile à maîtriser au quotidien.",
    category: "Hêtre",
    image: "/images/catalog/hetre.jpeg",
    prices: { "25 cm": 84, "33 cm": 76, "40 cm": 72, "50 cm": 66, "1 m": 58 },
  },
  {
    id: "frene",
    name: "Frêne séché",
    description: "Un bois polyvalent qui s’allume facilement et chauffe efficacement.",
    category: "Frêne",
    image: "/images/catalog/frene.jpeg",
    prices: { "25 cm": 88, "33 cm": 80, "40 cm": 76, "50 cm": 70, "1 m": 62 },
  },
  {
    id: "charme",
    name: "Charme séché",
    description: "Un bois dense à la belle tenue au feu et au pouvoir calorifique élevé.",
    category: "Charme",
    image: "/images/catalog/charme.jpeg",
    prices: { "25 cm": 96, "33 cm": 88, "40 cm": 84, "50 cm": 78, "1 m": 70 },
  },
  {
    id: "melange",
    name: "Mélange de feuillus",
    description: "Un assortiment équilibré de bois durs pour toute la saison.",
    category: "Mélange",
    image: "/images/catalog/melange.jpeg",
    prices: { "25 cm": 82, "33 cm": 74, "40 cm": 70, "50 cm": 64, "1 m": 56 },
  },
];

database.exec("BEGIN IMMEDIATE");
try {
  const orderColumns = database
    .prepare("PRAGMA table_info(orders)")
    .all() as Array<{ name: string }>;
  if (!orderColumns.some((column) => column.name === "delivery_fee")) {
    database.exec(
      "ALTER TABLE orders ADD COLUMN delivery_fee REAL NOT NULL DEFAULT 0",
    );
  }
  const prototypeMigration = "wood-catalog-prototype-images-v1";
  if (
    !database
      .prepare("SELECT 1 FROM catalog_migrations WHERE id = ?")
      .get(prototypeMigration)
  ) {
    const prototypeImageByProduct = new Map(
      initialProducts.map((product) => [product.id, product.image]),
    );
    const legacyImageByProduct: Record<string, string> = {
      chene: "/images/wood/oak-logs.jpg",
      hetre: "/images/wood/mixed-firewood.jpg",
      frene: "/images/wood/dry-oak.jpg",
      charme: "/images/wood/oak-logs.jpg",
      melange: "/images/wood/mixed-firewood.jpg",
    };
    const replaceSeededImage = database.prepare(
      "UPDATE product_images SET path = ? WHERE product_id = ? AND path = ?",
    );
    for (const [productId, legacyPath] of Object.entries(legacyImageByProduct)) {
      const prototypePath = prototypeImageByProduct.get(productId);
      if (!prototypePath) {
        throw new Error(`Image prototype manquante pour le produit ${productId}.`);
      }
      replaceSeededImage.run(
        prototypePath,
        productId,
        legacyPath,
      );
    }
    database
      .prepare("INSERT INTO catalog_migrations (id) VALUES (?)")
      .run(prototypeMigration);
  }
  const catalogPhotoMigration = "wood-catalog-user-photos-v1";
  if (
    !database
      .prepare("SELECT 1 FROM catalog_migrations WHERE id = ?")
      .get(catalogPhotoMigration)
  ) {
    const productPhotoById = new Map(
      initialProducts.map((product) => [product.id, product.image]),
    );
    const replacePrototypePhoto = database.prepare(
      "UPDATE product_images SET path = ? WHERE product_id = ? AND path = ?",
    );
    for (const product of initialProducts) {
      const imagePath = productPhotoById.get(product.id);
      if (!imagePath) {
        throw new Error(`Photo de catalogue absente pour le produit ${product.id}.`);
      }
      replacePrototypePhoto.run(
        imagePath,
        product.id,
        `/images/wood/prototypes/${product.id}.svg`,
      );
    }
    database
      .prepare("INSERT INTO catalog_migrations (id) VALUES (?)")
      .run(catalogPhotoMigration);
  }
  if (database.prepare("SELECT COUNT(*) AS count FROM products").get()?.count === 0) {
    const addProduct = database.prepare(
      "INSERT INTO products (id, name, description, category, stock) VALUES (?, ?, ?, ?, ?)",
    );
    const addPrice = database.prepare(
      "INSERT INTO product_prices (product_id, log_length, price_per_m3) VALUES (?, ?, ?)",
    );
    const addImage = database.prepare(
      "INSERT INTO product_images (product_id, path, is_primary) VALUES (?, ?, 1)",
    );

    for (const product of initialProducts) {
      addProduct.run(
        product.id,
        product.name,
        product.description,
        product.category,
        20,
      );
      for (const length of LOG_LENGTHS) {
        addPrice.run(product.id, length, product.prices[length]);
      }
      addImage.run(product.id, product.image);
    }
  }
  database.exec("COMMIT");
} catch (error) {
  database.exec("ROLLBACK");
  throw error;
}

export function getCatalogProducts(): CatalogProduct[] {
  const products = database
    .prepare(
      "SELECT id, name, description, category, stock FROM products ORDER BY CASE category WHEN 'Chêne' THEN 1 WHEN 'Hêtre' THEN 2 WHEN 'Frêne' THEN 3 WHEN 'Charme' THEN 4 ELSE 5 END",
    )
    .all() as Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    stock: number;
  }>;
  const getPrices = database.prepare(
    "SELECT log_length, price_per_m3 FROM product_prices WHERE product_id = ?",
  );
  const getImages = database.prepare(
    "SELECT id, path, is_primary FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, id",
  );

  return products.map((product) => {
    if (!WOOD_CATEGORIES.includes(product.category as WoodCategory)) {
      throw new Error(`Catégorie de bois inconnue pour le produit ${product.id}.`);
    }

    const prices = Object.fromEntries(
      (getPrices.all(product.id) as Array<{
        log_length: string;
        price_per_m3: number;
      }>).map(({ log_length, price_per_m3 }) => [log_length, price_per_m3]),
    ) as Partial<Record<LogLength, number>>;

    for (const length of LOG_LENGTHS) {
      if (prices[length] === undefined) {
        throw new Error(`Tarif manquant pour ${product.id} (${length}).`);
      }
    }

    return {
      ...product,
      category: product.category as WoodCategory,
      prices: prices as Record<LogLength, number>,
      images: (getImages.all(product.id) as Array<{
        id: number;
        path: string;
        is_primary: number;
      }>).map((image) => ({
        id: image.id,
        path: image.path,
        isPrimary: image.is_primary === 1,
      })),
    };
  });
}

function inTransaction<T>(operation: () => T): T {
  database.exec("BEGIN IMMEDIATE");
  try {
    const result = operation();
    database.exec("COMMIT");
    return result;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function updateCatalogProduct(
  id: string,
  changes: {
    name: string;
    description: string;
    category: WoodCategory;
    stock: number;
    prices: Record<LogLength, number>;
  },
): void {
  inTransaction(() => {
    const result = database
      .prepare(
        "UPDATE products SET name = ?, description = ?, category = ?, stock = ? WHERE id = ?",
      )
      .run(changes.name, changes.description, changes.category, changes.stock, id);
    if (result.changes === 0) throw new Error("Produit introuvable.");

    const updatePrice = database.prepare(
      "INSERT INTO product_prices (product_id, log_length, price_per_m3) VALUES (?, ?, ?) ON CONFLICT(product_id, log_length) DO UPDATE SET price_per_m3 = excluded.price_per_m3",
    );
    for (const length of LOG_LENGTHS) {
      updatePrice.run(id, length, changes.prices[length]);
    }
  });
}

export function addProductImage(
  productId: string,
  imagePath: string,
  replaceImageId?: number,
  setPrimary = false,
): { removedPath: string | null } {
  return inTransaction(() => {
    if (!database.prepare("SELECT 1 FROM products WHERE id = ?").get(productId)) {
      throw new Error("Produit introuvable.");
    }

    let removedPath: string | null = null;
    if (replaceImageId !== undefined) {
      const previous = database
        .prepare(
          "SELECT path FROM product_images WHERE id = ? AND product_id = ?",
        )
        .get(replaceImageId, productId) as { path: string } | undefined;
      if (!previous) throw new Error("Photo à remplacer introuvable.");
      removedPath = previous.path;
      database
        .prepare("DELETE FROM product_images WHERE id = ? AND product_id = ?")
        .run(replaceImageId, productId);
    }

    if (setPrimary) {
      database
        .prepare("UPDATE product_images SET is_primary = 0 WHERE product_id = ?")
        .run(productId);
    }

    database
      .prepare(
        "INSERT INTO product_images (product_id, path, is_primary) VALUES (?, ?, ?)",
      )
      .run(productId, imagePath, setPrimary ? 1 : 0);

    const imageCount = database
      .prepare("SELECT COUNT(*) AS count FROM product_images WHERE product_id = ?")
      .get(productId) as { count: number };
    if (imageCount.count === 1) {
      database
        .prepare(
          "UPDATE product_images SET is_primary = 1 WHERE product_id = ?",
        )
        .run(productId);
    }
    return { removedPath };
  });
}

export function setProductPrimaryImage(
  productId: string,
  imageId: number,
): void {
  inTransaction(() => {
    const image = database
      .prepare("SELECT 1 FROM product_images WHERE id = ? AND product_id = ?")
      .get(imageId, productId);
    if (!image) throw new Error("Photo introuvable.");
    database
      .prepare("UPDATE product_images SET is_primary = 0 WHERE product_id = ?")
      .run(productId);
    database
      .prepare("UPDATE product_images SET is_primary = 1 WHERE id = ?")
      .run(imageId);
  });
}

export function deleteProductImage(
  productId: string,
  imageId: number,
): { removedPath: string; replacementPrimary: boolean } {
  return inTransaction(() => {
    const image = database
      .prepare(
        "SELECT path, is_primary FROM product_images WHERE id = ? AND product_id = ?",
      )
      .get(imageId, productId) as
      | { path: string; is_primary: number }
      | undefined;
    if (!image) throw new Error("Photo introuvable.");

    const remaining = database
      .prepare(
        "SELECT id FROM product_images WHERE product_id = ? AND id != ? ORDER BY id LIMIT 1",
      )
      .get(productId, imageId) as { id: number } | undefined;
    if (image.is_primary === 1 && !remaining) {
      throw new Error("Chaque produit doit conserver au moins une photo.");
    }

    database
      .prepare("DELETE FROM product_images WHERE id = ? AND product_id = ?")
      .run(imageId, productId);
    if (image.is_primary === 1 && remaining) {
      database
        .prepare("UPDATE product_images SET is_primary = 1 WHERE id = ?")
        .run(remaining.id);
    }
    return { removedPath: image.path, replacementPrimary: image.is_primary === 1 };
  });
}

export function createOrder(input: {
  customerName: string;
  phone: string;
  email: string;
  postalCode: string;
  address: string;
  deliveryNotes: string;
  items: Array<{ productId: string; logLength: LogLength; volume: number }>;
}): AdminOrder {
  return inTransaction(() => {
    const items: OrderItem[] = input.items.map((requested) => {
      const product = database
        .prepare(
          "SELECT name, category, stock FROM products WHERE id = ?",
        )
        .get(requested.productId) as
        | { name: string; category: string; stock: number }
        | undefined;
      if (!product) throw new Error("Un produit de votre panier n’existe plus.");
      if (!WOOD_CATEGORIES.includes(product.category as WoodCategory)) {
        throw new Error(`Catégorie de bois invalide pour ${requested.productId}.`);
      }
      const price = database
        .prepare(
          "SELECT price_per_m3 FROM product_prices WHERE product_id = ? AND log_length = ?",
        )
        .get(requested.productId, requested.logLength) as
        | { price_per_m3: number }
        | undefined;
      if (!price) throw new Error("Tarif indisponible pour une sélection.");
      if (product.stock < requested.volume) {
        throw new Error(`Stock insuffisant pour ${product.name}.`);
      }
      return {
        ...requested,
        name: product.name,
        category: product.category as WoodCategory,
        unitPrice: price.price_per_m3,
        total: Math.round(price.price_per_m3 * requested.volume * 100) / 100,
      };
    });

    const subtotal = Math.round(items.reduce((sum, item) => sum + item.total, 0) * 100) / 100;
    const deliveryFee = subtotal >= 150 || subtotal === 0 ? 0 : 12;
    const total = Math.round((subtotal + deliveryFee) * 100) / 100;
    const id = `BB-${randomUUID().slice(0, 8).toUpperCase()}`;
    database
      .prepare(
        "INSERT INTO orders (id, customer_name, phone, email, postal_code, address, delivery_notes, items_json, delivery_fee, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(
        id,
        input.customerName,
        input.phone,
        input.email,
        input.postalCode,
        input.address,
        input.deliveryNotes,
        JSON.stringify(items),
        deliveryFee,
        total,
      );

    const updateStock = database.prepare(
      "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
    );
    for (const item of items) {
      const result = updateStock.run(item.volume, item.productId, item.volume);
      if (result.changes === 0) {
        throw new Error(`Stock insuffisant pour ${item.name}.`);
      }
    }

    return {
      ...input,
      items,
      deliveryFee,
      total,
      id,
      status: "new",
      createdAt: new Date().toISOString(),
    };
  });
}

export function getAdminOrders(): AdminOrder[] {
  const orders = database
    .prepare(
      "SELECT id, customer_name, phone, email, postal_code, address, delivery_notes, items_json, delivery_fee, total, status, created_at FROM orders ORDER BY created_at DESC",
    )
    .all() as Array<{
    id: string;
    customer_name: string;
    phone: string;
    email: string;
    postal_code: string;
    address: string;
    delivery_notes: string;
    items_json: string;
    delivery_fee: number;
    total: number;
    status: string;
    created_at: string;
  }>;
  return orders.map((order) => ({
    id: order.id,
    customerName: order.customer_name,
    phone: order.phone,
    email: order.email,
    postalCode: order.postal_code,
    address: order.address,
    deliveryNotes: order.delivery_notes,
    items: JSON.parse(order.items_json) as OrderItem[],
    deliveryFee: order.delivery_fee,
    total: order.total,
    status: order.status as OrderStatus,
    createdAt: order.created_at,
  }));
}

export function updateOrderStatus(id: string, status: OrderStatus): void {
  inTransaction(() => {
    const current = database
      .prepare("SELECT status, items_json FROM orders WHERE id = ?")
      .get(id) as { status: OrderStatus; items_json: string } | undefined;
    if (!current) throw new Error("Commande introuvable.");

    if (current.status !== status && status === "cancelled") {
      const items = JSON.parse(current.items_json) as OrderItem[];
      const restock = database.prepare(
        "UPDATE products SET stock = stock + ? WHERE id = ?",
      );
      for (const item of items) restock.run(item.volume, item.productId);
    } else if (current.status === "cancelled" && status !== "cancelled") {
      const items = JSON.parse(current.items_json) as OrderItem[];
      const reserve = database.prepare(
        "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
      );
      for (const item of items) {
        const result = reserve.run(item.volume, item.productId, item.volume);
        if (result.changes === 0) {
          throw new Error(`Stock insuffisant pour réactiver la commande (${item.name}).`);
        }
      }
    }

    database.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
  });
}
