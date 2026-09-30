import {
  getServerSupabase,
  SupabaseConfigurationError,
} from "./supabase-client";

const defaultBucket = "product-images";

export { SupabaseConfigurationError as SupabaseStorageConfigurationError };

function getStorage() {
  const client = getServerSupabase();
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw new SupabaseConfigurationError(
      "SUPABASE_URL doit être configurée dans l’environnement du serveur.",
    );
  }
  return {
    client,
    bucket: process.env.SUPABASE_STORAGE_BUCKET || defaultBucket,
    supabaseUrl: new URL(supabaseUrl),
  };
}

export async function checkProductPhotoStorage(): Promise<void> {
  const { client, bucket } = getStorage();
  const { data, error } = await client.storage.getBucket(bucket);
  if (error) {
    if (error.statusCode === "404") {
      throw new SupabaseConfigurationError(
        `Le bucket Supabase « ${bucket} » n’existe pas. Créez-le dans Storage et rendez-le public.`,
      );
    }
    throw new Error(
      `Impossible de vérifier le bucket Supabase : ${error.message}`,
    );
  }
  if (!data.public) {
    throw new SupabaseConfigurationError(
      `Le bucket Supabase « ${bucket} » est privé. Rendez-le public pour afficher les photos dans le catalogue.`,
    );
  }
}

export async function uploadProductPhoto(
  productId: string,
  bytes: Uint8Array,
  contentType: string,
  extension: string,
) {
  const { client, bucket } = getStorage();
  const key = `${productId}/${crypto.randomUUID()}${extension}`;
  const { error } = await client.storage.from(bucket).upload(key, bytes, {
    contentType,
    upsert: false,
    cacheControl: "31536000",
  });
  if (error) {
    throw new Error(`Supabase Storage : ${error.message}`);
  }

  const { data } = client.storage.from(bucket).getPublicUrl(key);
  return { key, publicUrl: data.publicUrl };
}

export async function deleteProductPhoto(publicUrl: string): Promise<void> {
  let photoUrl: URL;
  try {
    photoUrl = new URL(publicUrl);
  } catch {
    return;
  }

  if (!photoUrl.pathname.includes("/storage/v1/object/public/")) return;

  const { client, bucket, supabaseUrl } = getStorage();
  const objectPrefix = `/storage/v1/object/public/${encodeURIComponent(bucket)}/`;
  if (
    photoUrl.origin !== supabaseUrl.origin ||
    !photoUrl.pathname.startsWith(objectPrefix)
  ) {
    return;
  }

  let key: string;
  try {
    key = photoUrl.pathname
      .slice(objectPrefix.length)
      .split("/")
      .map((segment) => decodeURIComponent(segment))
      .join("/");
  } catch {
    throw new Error("L’URL de la photo Supabase est invalide.");
  }
  if (!key) throw new Error("La clé de la photo Supabase est vide.");

  const { error } = await client.storage.from(bucket).remove([key]);
  if (error) {
    throw new Error(`Suppression Supabase Storage : ${error.message}`);
  }
}
