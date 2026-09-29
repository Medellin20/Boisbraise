import { getCatalogProducts } from "../../../server/catalog-db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return Response.json(getCatalogProducts());
}
