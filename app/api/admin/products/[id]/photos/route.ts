import {
  addProductImage,
  validateProductImageTarget,
} from "../../../../../../server/supabase-catalog";
import {
  checkProductPhotoStorage,
  deleteProductPhoto,
  SupabaseStorageConfigurationError,
  uploadProductPhoto,
} from "../../../../../../server/supabase-storage";
import { requireAdmin } from "../../../../../../server/admin-auth";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };
const maximumFileSize = 5 * 1024 * 1024;
const productIdPattern = /^[a-z0-9-]{1,60}$/;

function validImageType(file: File, bytes: Uint8Array) {
  if (
    file.type === "image/jpeg" &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  )
    return { extension: ".jpg", contentType: "image/jpeg" };
  if (
    file.type === "image/png" &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  )
    return { extension: ".png", contentType: "image/png" };
  if (
    file.type === "image/webp" &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    return { extension: ".webp", contentType: "image/webp" };
  return null;
}

export async function POST(request: Request, { params }: RouteContext) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  if (!productIdPattern.test(id)) {
    return Response.json(
      { error: "Identifiant de produit invalide." },
      { status: 400 },
    );
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json(
      { error: "Le formulaire photo est invalide." },
      { status: 400 },
    );
  }

  const file = form.get("photo");
  if (!(file instanceof File)) {
    return Response.json({ error: "Sélectionnez une photo." }, { status: 400 });
  }
  if (file.size === 0 || file.size > maximumFileSize) {
    return Response.json(
      { error: "La photo doit peser 5 Mo maximum." },
      { status: 400 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const imageType = validImageType(file, bytes);
  if (!imageType) {
    return Response.json(
      { error: "Formats acceptés : JPEG, PNG ou WebP." },
      { status: 400 },
    );
  }

  const replaceValue = form.get("replaceImageId");
  const replaceImageId =
    typeof replaceValue === "string" && /^\d+$/.test(replaceValue)
      ? Number(replaceValue)
      : undefined;
  if (
    replaceValue !== null &&
    (replaceImageId === undefined ||
      !Number.isSafeInteger(replaceImageId) ||
      replaceImageId < 1)
  ) {
    return Response.json(
      { error: "Photo à remplacer invalide." },
      { status: 400 },
    );
  }
  try {
    await validateProductImageTarget(id, replaceImageId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Produit ou photo introuvable.";
    return Response.json({ error: message }, { status: 404 });
  }
  const setPrimary = form.get("isPrimary") === "true";
  let uploadedPhoto: Awaited<ReturnType<typeof uploadProductPhoto>>;
  try {
    await checkProductPhotoStorage();
    uploadedPhoto = await uploadProductPhoto(
      id,
      bytes,
      imageType.contentType,
      imageType.extension,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Échec de l’envoi vers Supabase Storage.";
    const status =
      error instanceof SupabaseStorageConfigurationError ? 503 : 502;
    return Response.json({ error: message }, { status });
  }

  let result: Awaited<ReturnType<typeof addProductImage>>;
  try {
    result = await addProductImage(
      id,
      uploadedPhoto.publicUrl,
      replaceImageId,
      setPrimary,
    );
  } catch (error) {
    await deleteProductPhoto(uploadedPhoto.publicUrl).catch(
      (cleanupError: unknown) => {
        console.error(
          `Échec du nettoyage de la photo Supabase temporaire ${uploadedPhoto.key}.`,
          cleanupError,
        );
      },
    );
    const message =
      error instanceof Error ? error.message : "Échec de l’ajout de la photo.";
    return Response.json({ error: message }, { status: 400 });
  }

  let cleanupWarning: string | undefined;
  if (result.removedPath && result.removedPath !== uploadedPhoto.publicUrl) {
    await deleteProductPhoto(result.removedPath).catch((error: unknown) => {
      console.error(
        "Impossible de supprimer l’ancienne photo remplacée dans Supabase Storage.",
        error,
      );
      cleanupWarning =
        "La nouvelle photo est enregistrée, mais l’ancienne n’a pas pu être supprimée du stockage.";
    });
  }
  return Response.json(
    { success: true, ...(cleanupWarning ? { warning: cleanupWarning } : {}) },
    { status: 201 },
  );
}
