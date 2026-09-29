import { NextResponse } from "next/server";
import {
  clearAdminSessionCookie,
  hasAdminSession,
  isAdminPasswordConfigured,
  rejectCrossOriginRequest,
  setAdminSessionCookie,
  verifyAdminPassword,
} from "../../../../server/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  if (!isAdminPasswordConfigured()) {
    return Response.json(
      { error: "Le mot de passe et la clé de session admin ne sont pas configurés." },
      { status: 503 },
    );
  }
  return Response.json({ authenticated: hasAdminSession(request) });
}

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOriginRequest(request);
  if (crossOrigin) return crossOrigin;
  if (!isAdminPasswordConfigured()) {
    return Response.json(
      { error: "Le mot de passe et la clé de session admin ne sont pas configurés." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête de connexion invalide." }, { status: 400 });
  }
  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as Record<string, unknown>).password !== "string"
  ) {
    return Response.json({ error: "Saisissez le mot de passe admin." }, { status: 400 });
  }
  if (!verifyAdminPassword((body as { password: string }).password)) {
    return Response.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true });
  setAdminSessionCookie(response);
  return response;
}

export function DELETE(request: Request) {
  const crossOrigin = rejectCrossOriginRequest(request);
  if (crossOrigin) return crossOrigin;
  const response = NextResponse.json({ authenticated: false });
  clearAdminSessionCookie(response);
  return response;
}
