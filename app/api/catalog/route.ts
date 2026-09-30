import { getCatalogProducts } from "../../../server/supabase-catalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json(await getCatalogProducts());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Le catalogue est indisponible.";
    console.error("Impossible de charger le catalogue depuis Supabase.", error);
    return Response.json({ error: message }, { status: 503 });
  }
}
