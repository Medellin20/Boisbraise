'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { timingSafeEqual } from 'crypto';
import { adminLoginSchema } from '@/lib/validations/admin';
import { createAdminSessionToken, ADMIN_SESSION_DURATION_MS } from '@/lib/auth/admin-session';
import { checkRateLimit, registerFailedAttempt, clearRateLimit } from '@/lib/auth/rate-limit';
import { logAdminAction } from '@/lib/data/history';
import { ADMIN_SESSION_COOKIE } from '@/lib/utils/constants';

export interface AdminLoginState {
  success: boolean;
  message: string;
}

function getClientKey(): string {
  const h = headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

function isSecureRequest(): boolean {
  const h = headers();
  const forwardedProtocol = h.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase();

  if (forwardedProtocol) return forwardedProtocol === 'https';

  // Certains hébergeurs ne transmettent pas x-forwarded-proto, mais Origin
  // reste disponible sur la requête de la Server Action.
  const origin = h.get('origin');
  if (!origin) return false;

  try {
    return new URL(origin).protocol === 'https:';
  } catch {
    return false;
  }
}

function safeCompare(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) {
    // Comparaison factice pour garder un temps constant même en cas de longueur différente.
    timingSafeEqual(Buffer.from(a.padEnd(32, '0')).subarray(0, 32), Buffer.from(b.padEnd(32, '1')).subarray(0, 32));
    return false;
  }
  return timingSafeEqual(bufferA, bufferB);
}

export async function loginAdmin(_prevState: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const clientKey = getClientKey();
  const rateLimit = checkRateLimit(clientKey);

  if (!rateLimit.allowed) {
    return {
      success: false,
      message: `Trop de tentatives. Réessayez dans ${Math.ceil((rateLimit.retryAfterSeconds ?? 60) / 60)} minute(s).`,
    };
  }

  const parsed = adminLoginSchema.safeParse({ password: formData.get('password') });
  if (!parsed.success) {
    return { success: false, message: 'Merci de saisir le mot de passe.' };
  }

  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    return {
      success: false,
      message: 'ADMIN_PASSWORD n’est pas configuré côté serveur. Ajoutez-le dans .env.local.',
    };
  }

  const isValid = safeCompare(parsed.data.password, expectedPassword);

  if (!isValid) {
    registerFailedAttempt(clientKey);
    return { success: false, message: 'Mot de passe incorrect.' };
  }

  clearRateLimit(clientKey);

  const token = await createAdminSessionToken();
  cookies().set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    // Un cookie Secure est ignoré par les navigateurs lorsque l'application
    // est servie en HTTP (cas fréquent sur une IP ou derrière certains
    // reverse proxies), ce qui provoquait une boucle /admin/login en prod.
    secure: isSecureRequest(),
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_SESSION_DURATION_MS / 1000,
  });

  // Une panne du journal d'audit ne doit pas invalider une authentification
  // réussie ni empêcher l'envoi du cookie de session.
  try {
    await logAdminAction({ action: 'admin.login', details: { ip: clientKey } });
  } catch (error) {
    console.error('Impossible de journaliser la connexion administrateur.', error);
  }

  redirect('/admin');
}

export async function logoutAdmin(): Promise<void> {
  cookies().delete(ADMIN_SESSION_COOKIE);
  await logAdminAction({ action: 'admin.logout' });
  redirect('/admin/login');
}
