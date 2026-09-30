import { requireAdmin } from "../../../../server/admin-auth";
import {
  checkProductPhotoStorage,
  SupabaseStorageConfigurationError,
} from "../../../../server/supabase-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    await checkProductPhotoStorage();
    return Response.json({ ready: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Vérification Supabase impossible.";
    const status =
      error instanceof SupabaseStorageConfigurationError ? 503 : 502;
    return Response.json({ ready: false, error: message }, { status });
  }
}
