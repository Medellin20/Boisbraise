import { LOG_LENGTHS, type LogLength } from "../../../shared/catalog";
import { createOrder } from "../../../server/supabase-catalog";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Les informations de commande sont invalides." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Les informations de commande sont incomplètes." }, { status: 400 });
  }
  const value = body as Record<string, unknown>;
  const requiredText = (field: string, maxLength: number) =>
    typeof value[field] === "string" &&
    value[field].trim().length > 0 &&
    value[field].trim().length <= maxLength;
  const validEmail =
    typeof value.email === "string" &&
    value.email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email);
  const items = value.items;

  if (
    !requiredText("customerName", 100) ||
    !requiredText("phone", 30) ||
    !validEmail ||
    typeof value.postalCode !== "string" ||
    !/^\d{5}$/.test(value.postalCode.trim()) ||
    !requiredText("address", 250) ||
    (value.deliveryNotes !== undefined &&
      (typeof value.deliveryNotes !== "string" ||
        value.deliveryNotes.length > 500)) ||
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > 30
  ) {
    return Response.json({ error: "Vérifiez vos coordonnées et les produits sélectionnés." }, { status: 400 });
  }

  const requestedItems: Array<{
    productId: string;
    logLength: LogLength;
    volume: number;
  }> = [];
  for (const item of items) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof item.productId !== "string" ||
      !/^[a-z0-9-]{1,60}$/.test(item.productId) ||
      typeof item.logLength !== "string" ||
      !LOG_LENGTHS.includes(item.logLength as LogLength) ||
      typeof item.volume !== "number" ||
      !Number.isFinite(item.volume) ||
      item.volume < 0.1 ||
      item.volume > 100 ||
      Math.round(item.volume * 10) !== item.volume * 10
    ) {
      return Response.json({ error: "Une ligne de votre panier est invalide." }, { status: 400 });
    }
    requestedItems.push({
      productId: item.productId,
      logLength: item.logLength as LogLength,
      volume: item.volume,
    });
  }

  try {
    const order = await createOrder({
      customerName: (value.customerName as string).trim(),
      phone: (value.phone as string).trim(),
      email: (value.email as string).trim(),
      postalCode: (value.postalCode as string).trim(),
      address: (value.address as string).trim(),
      deliveryNotes:
        typeof value.deliveryNotes === "string" ? value.deliveryNotes.trim() : "",
      items: requestedItems,
    });
    return Response.json(
      {
        orderId: order.id,
        total: order.total,
        deliveryFee: order.deliveryFee,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "La commande n’a pas pu être enregistrée.";
    console.error("Impossible d’enregistrer la commande dans Supabase.", error);
    return Response.json(
      { error: message },
      { status: message.startsWith("Supabase :") ? 503 : 400 },
    );
  }
}
