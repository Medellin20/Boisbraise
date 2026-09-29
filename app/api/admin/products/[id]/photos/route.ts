import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { addProductImage } from "../../../../../../server/catalog-db";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };
const maximumFileSize = 5 * 1024 * 1024;

function validImageType(file: File, bytes: Uint8Array): string | null {
  if (
    file.type === "image/jpeg" &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) return ".jpg";
  if (
    file.type === "image/png" &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) return ".png";
  if (
    file.type === "image/webp" &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) return ".webp";
  return null;
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Le formulaire photo est invalide." }, { status: 400 });
  }

  const file = form.get("photo");
  if (!(file instanceof File)) {
    return Response.json({ error: "Sélectionnez une photo." }, { status: 400 });
  }
  if (file.size === 0 || file.size > maximumFileSize) {
    return Response.json({ error: "La photo doit peser moins de 5 Mo." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = validImageType(file, bytes);
  if (!extension) {
    return Response.json({ error: "Formats acceptés : JPEG, PNG ou WebP." }, { status: 400 });
  }

  const replaceValue = form.get("replaceImageId");
  const replaceImageId =
    typeof replaceValue === "string" && /^\d+$/.test(replaceValue)
      ? Number(replaceValue)
      : undefined;
  if (replaceValue !== null && replaceImageId === undefined) {
    return Response.json({ error: "Photo à remplacer invalide." }, { status: 400 });
  }
  const setPrimary = form.get("isPrimary") === "true";
  const relativePath = `/uploads/catalog/${randomUUID()}${extension}`;
  const uploadDirectory = path.join(process.cwd(), "public", "uploads", "catalog");
  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(
    path.join(uploadDirectory, path.basename(relativePath)),
    bytes,
    { flag: "wx" },
  );

  let result: ReturnType<typeof addProductImage>;
  try {
    result = addProductImage(id, relativePath, replaceImageId, setPrimary);
  } catch (error) {
    const { unlink } = await import("node:fs/promises");
    await unlink(path.join(uploadDirectory, path.basename(relativePath)));
    const message = error instanceof Error ? error.message : "Échec de l’ajout de la photo.";
    return Response.json({ error: message }, { status: 400 });
  }

  if (result.removedPath?.startsWith("/uploads/catalog/")) {
    const previousPath = path.join(
      uploadDirectory,
      path.basename(result.removedPath),
    );
    const { unlink } = await import("node:fs/promises");
    await unlink(previousPath).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") {
        console.error("Impossible de supprimer l’ancienne photo remplacée.", error);
      }
    });
  }
  return Response.json({ success: true }, { status: 201 });
}
