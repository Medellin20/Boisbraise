import {
  deleteProductImage,
  setProductPrimaryImage,
} from "../../../../../../../server/catalog-db";
import { deleteProductPhoto } from "../../../../../../../server/supabase-storage";
import { requireAdmin } from "../../../../../../../server/admin-auth";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string; imageId: string }> };

function parseImageId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function PATCH(_request: Request, { params }: RouteContext) {
  const denied = requireAdmin(_request);
  if (denied) return denied;
  const { id, imageId: rawImageId } = await params;
  const imageId = parseImageId(rawImageId);
  if (imageId === null) {
    return Response.json({ error: "Identifiant de photo invalide." }, { status: 400 });
  }
  try {
    setProductPrimaryImage(id, imageId);
    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Échec de mise à jour.";
    return Response.json({ error: message }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const denied = requireAdmin(_request);
  if (denied) return denied;
  const { id, imageId: rawImageId } = await params;
  const imageId = parseImageId(rawImageId);
  if (imageId === null) {
    return Response.json({ error: "Identifiant de photo invalide." }, { status: 400 });
  }
  try {
    const result = deleteProductImage(id, imageId);
    try {
      await deleteProductPhoto(result.removedPath);
    } catch (error) {
      console.error(
        "La photo a été retirée du catalogue mais reste dans Supabase Storage.",
        error,
      );
      return Response.json(
        { error: "La photo a été retirée du catalogue mais sa suppression du stockage a échoué." },
        { status: 502 },
      );
    }
    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Échec de suppression.";
    return Response.json({ error: message }, { status: 400 });
  }
}
