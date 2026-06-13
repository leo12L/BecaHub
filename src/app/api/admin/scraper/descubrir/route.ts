import { NextRequest, NextResponse } from "next/server";
import { isAdminScraperRequest } from "@/lib/admin-auth";
import { runAutoDiscovery } from "@/scrapers/discovery/auto-discovery";

/**
 * Dispara el descubrimiento automático de becas con Tavily (sin LLM): busca,
 * valida links, filtra México+vigente y guarda como `PENDING_REVIEW`. Mismo
 * gate que `/api/admin/scraper/ejecutar`.
 */
export async function POST(request: NextRequest) {
  if (!isAdminScraperRequest(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await runAutoDiscovery();

  return NextResponse.json({ result });
}
