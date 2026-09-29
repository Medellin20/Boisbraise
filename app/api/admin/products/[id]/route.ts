import {
  LOG_LENGTHS,
  WOOD_CATEGORIES,
  type LogLength,
  type WoodCategory,
} from "../../../../../shared/catalog";
import { updateCatalogProduct } from "../../../../../server/catalog-db";
import { requireAdmin } from "../../../../../server/admin-auth";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Le corps JSON est invalide." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Les données du produit sont invalides." }, { status: 400 });
  }
  const value = body as Record<string, unknown>;
  const prices = value.prices;
  if (
    typeof value.name !== "string" ||
    value.name.trim().length < 2 ||
    value.name.trim().length > 100 ||
    typeof value.description !== "string" ||
    value.description.trim().length < 5 ||
    value.description.trim().length > 500 ||
    typeof value.category !== "string" ||
    !WOOD_CATEGORIES.includes(value.category as WoodCategory) ||
    typeof value.stock !== "number" ||
    !Number.isFinite(value.stock) ||
    value.stock < 0 ||
    value.stock > 100000 ||
    !prices ||
    typeof prices !== "object" ||
    !LOG_LENGTHS.every((length) => {
      const price = (prices as Record<string, unknown>)[length];
      return typeof price === "number" && Number.isFinite(price) && price >= 0 && price <= 100000;
    })
  ) {
    return Response.json({ error: "Vérifiez le nom, la description, le stock et les cinq tarifs." }, { status: 400 });
  }

  try {
    updateCatalogProduct(id, {
      name: value.name.trim(),
      description: value.description.trim(),
      category: value.category as WoodCategory,
      stock: value.stock,
      prices: Object.fromEntries(
        LOG_LENGTHS.map((length) => [
          length,
          (prices as Record<LogLength, number>)[length],
        ]),
      ) as Record<LogLength, number>,
    });
    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Échec de mise à jour.";
    return Response.json({ error: message }, { status: 404 });
  }
}
