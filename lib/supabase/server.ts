import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import { fetchNoStore } from './fetch-no-store';

// Client Supabase pour les Server Components / Server Actions — clé anonyme,
// soumis aux policies RLS. À utiliser pour toute lecture de données PUBLIQUES
// (catalogue de biens, images, équipements...).
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: fetchNoStore },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Appelé depuis un Server Component : ignoré, géré par le middleware.
          }
        },
        remove(name: string, options) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Idem
          }
        },
      },
    }
  );
}
