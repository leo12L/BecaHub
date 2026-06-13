import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { isAdminScraperRequest } from "@/lib/admin-auth";
import { runScraper } from "@/scrapers/orchestrator";
import { ejecutarScraperSchema } from "@/validators/scraper.validator";

export async function POST(request: NextRequest) {
  if (!isAdminScraperRequest(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body;
  try {
    const json = await request.json().catch(() => ({}));
    body = ejecutarScraperSchema.parse(json);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Cuerpo inválido", details: error.issues },
        { status: 400 },
      );
    }
    throw error;
  }

  const results = await runScraper(body.sourceId ?? "all");

  return NextResponse.json({ results });
}
