// Session admin signée (HMAC-SHA256) — implémentée avec l'API Web Crypto
// (crypto.subtle) afin d'être exécutable aussi bien côté Node.js (Server
// Actions, Route Handlers) que dans le middleware Edge, sans dépendance
// externe. Le cookie ne contient qu'un horodatage d'expiration signé : il
// ne stocke aucune donnée sensible et ne nécessite pas de table "sessions"
// côté base de données.

const ONE_HOUR = 60 * 60 * 1000;
export const ADMIN_SESSION_DURATION_MS = 8 * ONE_HOUR;

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'ADMIN_SESSION_SECRET manquant ou trop court. Définissez une chaîne aléatoire d’au moins 16 caractères dans .env.local.'
    );
  }
  return secret;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(value.length + ((4 - (value.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey('raw', encoder.encode(getSecret()), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

async function sign(payload: string): Promise<string> {
  const key = await getKey();
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return toBase64Url(new Uint8Array(signature));
}

/** Crée la valeur du cookie de session admin : `expiry.signature`. */
export async function createAdminSessionToken(): Promise<string> {
  const expiry = String(Date.now() + ADMIN_SESSION_DURATION_MS);
  const signature = await sign(expiry);
  return `${expiry}.${signature}`;
}

/** Vérifie la validité (signature + expiration) d'un cookie de session admin. */
export async function isValidAdminSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [expiry, signature] = token.split('.');
  if (!expiry || !signature) return false;

  const expectedSignature = await sign(expiry);
  if (expectedSignature.length !== signature.length) return false;

  // Comparaison en temps constant pour limiter les attaques par timing.
  const a = fromBase64Url(expectedSignature);
  const b = fromBase64Url(signature);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  if (diff !== 0) return false;

  return Number(expiry) > Date.now();
}
