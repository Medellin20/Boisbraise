// Limitation de débit simple en mémoire pour les tentatives de connexion
// admin. Suffisant pour une instance unique (ex: déploiement Node classique).
//
// LIMITE CONNUE : dans un environnement serverless multi-instances (ex:
// Vercel Functions), cette mémoire n'est PAS partagée entre les instances.
// Pour une protection robuste en production à grande échelle, remplacez ce
// module par un store partagé (ex: Upstash Redis, Vercel KV) en conservant
// la même interface `checkRateLimit` / `registerFailedAttempt`.

interface Attempt {
  count: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

const attempts = new Map<string, Attempt>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  const entry = attempts.get(key);
  if (!entry) return { allowed: true };

  if (entry.lockedUntil && entry.lockedUntil > Date.now()) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.lockedUntil - Date.now()) / 1000) };
  }

  if (Date.now() - entry.firstAttemptAt > WINDOW_MS) {
    attempts.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

export function registerFailedAttempt(key: string): void {
  const entry = attempts.get(key);
  const now = Date.now();

  if (!entry || now - entry.firstAttemptAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAttemptAt: now, lockedUntil: null });
    return;
  }

  const count = entry.count + 1;
  const lockedUntil = count >= MAX_ATTEMPTS ? now + LOCKOUT_MS : null;
  attempts.set(key, { count, firstAttemptAt: entry.firstAttemptAt, lockedUntil });
}

export function clearRateLimit(key: string): void {
  attempts.delete(key);
}
