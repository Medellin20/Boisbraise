import {
  getAdminOrders,
  updateOrderStatus,
  type OrderStatus,
} from "../../../../server/supabase-catalog";
import { requireAdmin } from "../../../../server/admin-auth";

export const runtime = "nodejs";

const orderStatuses: OrderStatus[] = ["new", "confirmed", "delivered", "cancelled"];

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    return Response.json(await getAdminOrders());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Les commandes sont indisponibles.";
    console.error("Impossible de charger les commandes depuis Supabase.", error);
    return Response.json({ error: message }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Les informations de commande sont invalides." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Statut ou identifiant de commande invalide." }, { status: 400 });
  }
  const value = body as Record<string, unknown>;
  if (
    typeof value.id !== "string" ||
    typeof value.status !== "string" ||
    !orderStatuses.includes(value.status as OrderStatus)
  ) {
    return Response.json({ error: "Statut ou identifiant de commande invalide." }, { status: 400 });
  }
  try {
    await updateOrderStatus(value.id, value.status as OrderStatus);
    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "La commande n’a pas pu être mise à jour.";
    console.error("Impossible de mettre à jour la commande dans Supabase.", error);
    return Response.json(
      { error: message },
      { status: message.startsWith("Supabase :") ? 503 : 404 },
    );
  }
}
