import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serverClient: SupabaseClient | undefined;

export class SupabaseConfigurationError extends Error {}

export function getServerSupabase(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    supabaseUrl.includes("your-project") ||
    serviceRoleKey.startsWith("your-") ||
    serviceRoleKey.startsWith("replace-")
  ) {
    throw new SupabaseConfigurationError(
      "Supabase n’est pas configuré avec de vrais identifiants. Renseignez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans l’environnement du serveur.",
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    throw new SupabaseConfigurationError(
      "SUPABASE_URL doit être une URL HTTPS valide.",
    );
  }
  if (parsedUrl.protocol !== "https:") {
    throw new SupabaseConfigurationError(
      "SUPABASE_URL doit utiliser HTTPS.",
    );
  }

  serverClient ??= createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return serverClient;
}
