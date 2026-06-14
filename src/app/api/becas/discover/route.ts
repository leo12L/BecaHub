import { NextRequest, NextResponse } from "next/server";
import { tavilySearch } from "@/lib/discovery/tavily";
import { perplexitySearch, PerplexityUnavailableError } from "@/lib/discovery/perplexity";
import { TavilyUnavailableError } from "@/lib/discovery/tavily";
import { checkUrlHealth } from "@/lib/validation/url-health";
import { buildRawScholarship } from "@/scrapers/discovery/heuristics";
import { normalize, upsertScholarship } from "@/scrapers/normalize";
import { db } from "@/lib/db";

const SOURCE_IDS = {
  tavily: "00000000-0000-0000-0000-000000000003",
  perplexity: "00000000-0000-0000-0000-000000000005",
} as const;

const QUERIES_BY_TOPIC: Record<string, string[]> = {
  default: [
    "becas México 2026 convocatoria abierta licenciatura maestría",
    "becas SECIHTI posgrado México 2026 vigente",
    "becas internacionales para mexicanos Fulbright DAAD 2026",
  ],
  posgrado: [
    "becas maestría doctorado México 2026 convocatoria abierta",
    "becas SECIHTI doctorado investigación México 2026",
  ],
  licenciatura: [
    "becas licenciatura México 2026 programa federal convocatoria",
    "becas Benito Juárez SEP México 2026",
  ],
  internacional: [
    "becas internacionales mexicanos Fulbright DAAD OEA Erasmus 2026",
    "becas estudiar extranjero México 2026 gobierno",
  ],
};

/**
 * POST /api/becas/discover
 * Corre descubrimiento con Tavily (y Perplexity si está configurado),
 * valida URLs, filtra con heurísticas y guarda las que pasen como
 * PENDING_REVIEW. Devuelve las recién guardadas para que el cliente
 * pueda mostrarlas sin reload.
 *
 * Body: { topic?: "default" | "posgrado" | "licenciatura" | "internacional" }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { topic?: string };
  const topic = (body.topic && QUERIES_BY_TOPIC[body.topic]) ? body.topic : "default";
  const queries = QUERIES_BY_TOPIC[topic]!;

  const existing = await db.scholarship.findMany({ select: { applyUrl: true } });
  const existingUrls = new Set(existing.map((s) => s.applyUrl));
  const seen = new Set<string>();

  interface Candidate { url: string; title: string; content: string }
  const candidates: Candidate[] = [];

  // --- Tavily ---
  if (process.env.TAVILY_API_KEY) {
    for (const query of queries) {
      try {
        const results = await tavilySearch({
          query,
          maxResults: 5,
          searchDepth: "basic",
          includeRawContent: true,
          includeDomains: [
            "gob.mx", "secihti.mx", "sep.gob.mx", "bienestar.gob.mx",
            "fulbright.edu.mx", "daad.de", "oas.org",
          ],
        });
        for (const r of results) {
          if (r.url && !seen.has(r.url) && !existingUrls.has(r.url)) {
            seen.add(r.url);
            candidates.push({ url: r.url, title: r.title, content: r.rawContent || r.content });
          }
        }
      } catch (err) {
        if (err instanceof TavilyUnavailableError) break;
      }
    }
  }

  // --- Perplexity (if available) ---
  if (process.env.PERPLEXITY_API_KEY) {
    for (const query of queries.slice(0, 2)) {
      try {
        const results = await perplexitySearch(query, 5);
        for (const r of results) {
          if (r.url && !seen.has(r.url) && !existingUrls.has(r.url)) {
            seen.add(r.url);
            candidates.push({ url: r.url, title: r.url, content: r.content });
          }
        }
      } catch (err) {
        if (err instanceof PerplexityUnavailableError) break;
      }
    }
  }

  const saved: { id: string; title: string; slug: string; status: string }[] = [];

  for (const candidate of candidates) {
    try {
      const health = await checkUrlHealth(candidate.url);
      if (!health.valid) continue;
      const applyUrl = health.finalUrl ?? candidate.url;
      if (existingUrls.has(applyUrl)) continue;

      const raw = buildRawScholarship({
        title: candidate.title || applyUrl,
        url: applyUrl,
        text: candidate.content,
      });
      if (!raw) continue;

      const sourceId = SOURCE_IDS.tavily;
      const normalized = normalize(raw, sourceId);
      if (!normalized) continue;

      await upsertScholarship(normalized);
      existingUrls.add(applyUrl);

      saved.push({ id: normalized.slug, title: normalized.title, slug: normalized.slug, status: normalized.status });
    } catch {
      // Skip individual failures
    }
  }

  const newBecas = await db.scholarship.findMany({
    where: { slug: { in: saved.map((s) => s.slug) } },
    select: {
      id: true, title: true, slug: true, status: true,
      countryDestination: true, academicLevel: true,
      coverageType: true, deadline: true, applyUrl: true, isVerified: true,
    },
  });

  return NextResponse.json({
    found: candidates.length,
    saved: saved.length,
    becas: newBecas,
  });
}
