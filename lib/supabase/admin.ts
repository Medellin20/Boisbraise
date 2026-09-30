import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { fetchNoStore } from './fetch-no-store';

// Client Supabase "admin" — utilise la SUPABASE_SERVICE_ROLE_KEY et
// CONTOURNE la Row Level Security.
//
// RÈGLES D'UTILISATION STRICTES :
//   1. Ce fichier importe "server-only" : toute tentative de l'importer
//      depuis un Client Component provoquera une erreur de build.
//   2. À utiliser UNIQUEMENT dans : Server Actions (actions/*.ts),
//      Route Handlers (app/api/**/route.ts) protégés, et le middleware admin.
//   3. Ne jamais retourner directement le résultat de requêtes utilisant ce
//      client à un visiteur non authentifié comme admin.
function jwtRole(key: string): string | null {
  const payload = key.split('.')[1];
  if (!payload) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')).role ?? null;
  } catch {
    return null;
  }
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Configuration Supabase manquante : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis côté serveur.'
    );
  }

  const configuredRole = jwtRole(serviceRoleKey);
  if (configuredRole && configuredRole !== 'service_role') {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY contient une clé de rôle « ${configuredRole} ». Utilisez la clé service_role du projet Supabase pour autoriser les écritures admin.`
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: fetchNoStore },
  });
}
