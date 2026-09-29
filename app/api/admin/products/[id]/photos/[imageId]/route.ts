import { unlink } from "node:fs/promises";
import path from "node:path";
import {
  deleteProductImage,
  setProductPrimaryImage,
} from "../../../../../../../server/catalog-db";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string; imageId: string }> };

function parseImageId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function PATCH(_request: Request, { params }: RouteContext) {
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
  const { id, imageId: rawImageId } = await params;
  const imageId = parseImageId(rawImageId);
  if (imageId === null) {
    return Response.json({ error: "Identifiant de photo invalide." }, { status: 400 });
  }
  try {
    const result = deleteProductImage(id, imageId);
    if (result.removedPath.startsWith("/uploads/catalog/")) {
      const uploadsDirectory = path.join(process.cwd(), "public", "uploads", "catalog");
      await unlink(
        path.join(uploadsDirectory, path.basename(result.removedPath)),
      ).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") {
          console.error("La photo a été retirée de la base mais son fichier reste présent.", error);
        }
      });
    }
    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Échec de suppression.";
    return Response.json({ error: message }, { status: 400 });
  }
}
