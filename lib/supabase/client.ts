'use client';

// Client Supabase pour le navigateur — utilise uniquement la clé anonyme
// (protégée par les policies RLS définies dans supabase/rls_policies.sql).
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
