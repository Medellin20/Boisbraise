import {
  LOG_LENGTHS,
  WOOD_CATEGORIES,
  type CatalogProduct,
  type LogLength,
  type WoodCategory,
} from "../shared/catalog";
import { getServerSupabase } from "./supabase-client";

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

function throwOnError(error: { message: string } | null): void {
  if (error) throw new Error(`Supabase : ${error.message}`);
}

export async function getCatalogProducts(): Promise<CatalogProduct[]> {
  const supabase = getServerSupabase();
  const [productsResult, pricesResult, imagesResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, description, category, stock"),
    supabase
      .from("product_prices")
      .select("product_id, log_length, price_per_m3"),
    supabase
      .from("product_images")
      .select("id, product_id, path, is_primary")
      .order("is_primary", { ascending: false })
      .order("id", { ascending: true }),
  ]);
  throwOnError(productsResult.error);
  throwOnError(pricesResult.error);
  throwOnError(imagesResult.error);

  const pricesByProduct = new Map<
    string,
    Partial<Record<LogLength, number>>
  >();
  for (const price of pricesResult.data ?? []) {
    const length = price.log_length as LogLength;
    if (!LOG_LENGTHS.includes(length)) {
      throw new Error(
        `Longueur inconnue dans les tarifs Supabase : ${price.log_length}.`,
      );
    }
    const productPrices = pricesByProduct.get(price.product_id) ?? {};
    productPrices[length] = Number(price.price_per_m3);
    pricesByProduct.set(price.product_id, productPrices);
  }

  const imagesByProduct = new Map<
    string,
    CatalogProduct["images"]
  >();
  for (const image of imagesResult.data ?? []) {
    const productImages = imagesByProduct.get(image.product_id) ?? [];
    productImages.push({
      id: Number(image.id),
      path: image.path,
      isPrimary: image.is_primary,
    });
    imagesByProduct.set(image.product_id, productImages);
  }

  return (productsResult.data ?? [])
    .map((product) => {
      if (!WOOD_CATEGORIES.includes(product.category as WoodCategory)) {
        throw new Error(`Catégorie inconnue pour le produit ${product.id}.`);
      }
      const partialPrices = pricesByProduct.get(product.id) ?? {};
      for (const length of LOG_LENGTHS) {
        if (partialPrices[length] === undefined) {
          throw new Error(`Tarif manquant pour ${product.id} (${length}).`);
        }
      }
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category as WoodCategory,
        stock: Number(product.stock),
        prices: partialPrices as Record<LogLength, number>,
        images: imagesByProduct.get(product.id) ?? [],
      };
    })
    .sort(
      (a, b) =>
        WOOD_CATEGORIES.indexOf(a.category) -
        WOOD_CATEGORIES.indexOf(b.category),
    );
}

export async function updateCatalogProduct(
  id: string,
  changes: {
    name: string;
    description: string;
    category: WoodCategory;
    stock: number;
    prices: Record<LogLength, number>;
  },
): Promise<void> {
  const { error } = await getServerSupabase().rpc(
    "admin_update_catalog_product",
    {
      p_product_id: id,
      p_name: changes.name,
      p_description: changes.description,
      p_category: changes.category,
      p_stock: changes.stock,
      p_prices: changes.prices,
    },
  );
  throwOnError(error);
}

export async function validateProductImageTarget(
  productId: string,
  replaceImageId?: number,
): Promise<void> {
  const supabase = getServerSupabase();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();
  throwOnError(productError);
  if (!product) throw new Error("Produit introuvable.");

  if (replaceImageId !== undefined) {
    const { data: image, error: imageError } = await supabase
      .from("product_images")
      .select("id")
      .eq("id", replaceImageId)
      .eq("product_id", productId)
      .maybeSingle();
    throwOnError(imageError);
    if (!image) throw new Error("Photo à remplacer introuvable.");
  }
}

export async function addProductImage(
  productId: string,
  imagePath: string,
  replaceImageId?: number,
  setPrimary = false,
): Promise<{ removedPath: string | null }> {
  const { data, error } = await getServerSupabase().rpc(
    "admin_add_product_image",
    {
      p_product_id: productId,
      p_path: imagePath,
      p_replace_image_id: replaceImageId ?? null,
      p_set_primary: setPrimary,
    },
  );
  throwOnError(error);
  return data as { removedPath: string | null };
}

export async function setProductPrimaryImage(
  productId: string,
  imageId: number,
): Promise<void> {
  const { error } = await getServerSupabase().rpc(
    "admin_set_primary_product_image",
    { p_product_id: productId, p_image_id: imageId },
  );
  throwOnError(error);
}

export async function deleteProductImage(
  productId: string,
  imageId: number,
): Promise<{ removedPath: string; replacementPrimary: boolean }> {
  const { data, error } = await getServerSupabase().rpc(
    "admin_delete_product_image",
    { p_product_id: productId, p_image_id: imageId },
  );
  throwOnError(error);
  return data as { removedPath: string; replacementPrimary: boolean };
}

export async function createOrder(input: {
  customerName: string;
  phone: string;
  email: string;
  postalCode: string;
  address: string;
  deliveryNotes: string;
  items: Array<{ productId: string; logLength: LogLength; volume: number }>;
}): Promise<{ id: string; total: number; deliveryFee: number }> {
  const { data, error } = await getServerSupabase().rpc("create_catalog_order", {
    p_customer_name: input.customerName,
    p_phone: input.phone,
    p_email: input.email,
    p_postal_code: input.postalCode,
    p_address: input.address,
    p_delivery_notes: input.deliveryNotes,
    p_items: input.items,
  });
  throwOnError(error);
  const result = Array.isArray(data) ? data[0] : data;
  if (!result) throw new Error("Supabase n’a pas renvoyé la commande créée.");
  return {
    id: result.order_id,
    total: Number(result.total),
    deliveryFee: Number(result.delivery_fee),
  };
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
  const { data, error } = await getServerSupabase()
    .from("orders")
    .select(
      "id, customer_name, phone, email, postal_code, address, delivery_notes, items, delivery_fee, total, status, created_at",
    )
    .order("created_at", { ascending: false });
  throwOnError(error);
  return (data ?? []).map((order) => ({
    id: order.id,
    customerName: order.customer_name,
    phone: order.phone,
    email: order.email,
    postalCode: order.postal_code,
    address: order.address,
    deliveryNotes: order.delivery_notes,
    items: order.items as OrderItem[],
    deliveryFee: Number(order.delivery_fee),
    total: Number(order.total),
    status: order.status as OrderStatus,
    createdAt: order.created_at,
  }));
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<void> {
  const { error } = await getServerSupabase().rpc("admin_update_order_status", {
    p_order_id: id,
    p_status: status,
  });
  throwOnError(error);
}
