import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Rafraîchit la session Supabase (si Supabase Auth est utilisé côté client,
// ex: /mon-compte) à chaque requête. Séparé de la protection /admin, qui a
// sa propre vérification par cookie de session signé (voir middleware.ts).
export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  await supabase.auth.getUser();

  return response;
}
