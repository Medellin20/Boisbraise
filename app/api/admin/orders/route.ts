import {
  getAdminOrders,
  updateOrderStatus,
  type OrderStatus,
} from "../../../../server/catalog-db";
import { requireAdmin } from "../../../../server/admin-auth";

export const runtime = "nodejs";

const orderStatuses: OrderStatus[] = ["new", "confirmed", "delivered", "cancelled"];

export function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  return Response.json(getAdminOrders());
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
    updateOrderStatus(value.id, value.status as OrderStatus);
    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "La commande n’a pas pu être mise à jour.";
    return Response.json({ error: message }, { status: 404 });
  }
}
