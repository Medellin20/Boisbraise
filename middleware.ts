import { NextResponse, type NextRequest } from 'next/server';
import { isValidAdminSessionToken } from '@/lib/auth/admin-session';
import { ADMIN_SESSION_COOKIE } from '@/lib/utils/constants';

// Protège l'ensemble de l'espace /admin (Route Handlers /api/admin/**
// exceptés, qui vérifient la session eux-mêmes). Aucune vérification de
// mot de passe ne dépend du JavaScript côté client : la validation du
// cookie de session signé se fait ici, côté serveur, à chaque requête.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === '/admin/login';
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isAuthenticated = await isValidAdminSessionToken(token);

  if (!isAuthenticated && !isLoginPage) {
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
