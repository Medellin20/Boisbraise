import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "boisbraise_admin_session";
const sessionDurationSeconds = 60 * 60 * 12;

function configuration() {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!password || !secret || secret.length < 32) return null;
  return { password, secret };
}

function safeEqual(left: string, right: string): boolean {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

function sign(expiresAt: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`${ADMIN_SESSION_COOKIE}.${expiresAt}`)
    .digest("base64url");
}

export function isAdminPasswordConfigured(): boolean {
  return configuration() !== null;
}

export function verifyAdminPassword(candidate: string): boolean {
  const config = configuration();
  return config !== null && safeEqual(candidate, config.password);
}

export function hasAdminSession(request: Request): boolean {
  const config = configuration();
  if (!config) return false;

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`))
    ?.slice(ADMIN_SESSION_COOKIE.length + 1);
  if (!cookie) return false;

  const separator = cookie.indexOf(".");
  if (separator < 1) return false;
  const expiresAt = cookie.slice(0, separator);
  const signature = cookie.slice(separator + 1);
  const expiry = Number(expiresAt);
  if (!Number.isSafeInteger(expiry) || expiry <= Math.floor(Date.now() / 1000)) {
    return false;
  }
  return safeEqual(signature, sign(expiresAt, config.secret));
}

export function setAdminSessionCookie(response: NextResponse): void {
  const config = configuration();
  if (!config) throw new Error("La configuration du mot de passe admin est incomplète.");
  const expiresAt = String(
    Math.floor(Date.now() / 1000) + sessionDurationSeconds,
  );
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: `${expiresAt}.${sign(expiresAt, config.secret)}`,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/admin",
    maxAge: sessionDurationSeconds,
  });
}

export function clearAdminSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/admin",
    maxAge: 0,
  });
}

export function rejectCrossOriginRequest(request: Request): Response | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  try {
    if (new URL(origin).origin === new URL(request.url).origin) return null;
  } catch {
    return Response.json({ error: "Origine de requête invalide." }, { status: 403 });
  }
  return Response.json({ error: "Requête inter-origines refusée." }, { status: 403 });
}

export function requireAdmin(request: Request): Response | null {
  const crossOrigin = rejectCrossOriginRequest(request);
  if (crossOrigin) return crossOrigin;
  if (!isAdminPasswordConfigured()) {
    return Response.json(
      { error: "Le mot de passe et la clé de session admin ne sont pas configurés." },
      { status: 503 },
    );
  }
  if (!hasAdminSession(request)) {
    return Response.json({ error: "Connexion admin requise." }, { status: 401 });
  }
  return null;
}
