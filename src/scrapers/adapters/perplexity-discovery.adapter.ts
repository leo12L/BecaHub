import * as cheerio from "cheerio";
import { BaseAdapter } from "../base.adapter";
import type { RawScholarship } from "../types";
import { buildRawScholarship } from "../discovery/heuristics";
import { checkUrlHealth } from "@/lib/validation/url-health";
import { perplexitySearch, PerplexityUnavailableError } from "@/lib/discovery/perplexity";
import { db } from "@/lib/db";

/**
 * Consultas enviadas a Perplexity para descubrir convocatorias nuevas.
 * Diseñadas para obtener citas de páginas oficiales de becas en México.
 */
export const PERPLEXITY_SEARCH_QUERIES = [
  "becas México 2026 convocatoria abierta SECIHTI gobierno",
  "becas posgrado México 2026 maestría doctorado convocatoria vigente",
  "becas internacionales para mexicanos 2026 Fulbright DAAD OEA",
  "becas licenciatura bachillerato México 2026 programa federal",
  "becas investigación ciencia tecnología México 2026",
];

const MAX_TEXT_LENGTH = 10_000;

/**
 * Adaptador de descubrimiento que usa Perplexity AI para encontrar URLs
 * de convocatorias, luego las valida con `checkUrlHealth()` y extrae
 * campos con `buildRawScholarship()` (heurísticas, sin LLM).
 *
 * Perplexity solo aporta **URLs candidatas** vía sus `citations`. Los
 * campos ricos de cada beca (deadline, monto, nivel) los infiere la
 * misma heurística que usan Tavily y BecasGob — sin LLM.
 *
 * Requiere `PERPLEXITY_API_KEY`.
 */
export class PerplexityDiscoveryAdapter extends BaseAdapter {
  readonly name = "Descubrimiento (Perplexity)";
  readonly sourceSlug = "perplexity-discovery";

  async scrape(): Promise<RawScholarship[]> {
    const results: RawScholarship[] = [];
    const seenUrls = new Set<string>();

    const existing = await db.scholarship.findMany({ select: { applyUrl: true } });
    const existingUrls = new Set(existing.map((s) => s.applyUrl));

    for (const query of PERPLEXITY_SEARCH_QUERIES) {
      let searchResults;
      try {
        searchResults = await perplexitySearch(query, 5);
      } catch (error) {
        if (error instanceof PerplexityUnavailableError) {
          this.log("error", "Perplexity no disponible, se detiene el descubrimiento", {
            reason: error.message,
          });
          break;
        }
        this.log("warn", "Error en query de Perplexity, se omite", {
          query,
          error: error instanceof Error ? error.message : String(error),
        });
        continue;
      }

      for (const item of searchResults) {
        if (!item.url || seenUrls.has(item.url) || existingUrls.has(item.url)) continue;
        seenUrls.add(item.url);

        try {
          const raw = await this.processResult(item.url, existingUrls);
          if (raw) {
            results.push(raw);
            existingUrls.add(raw.url ?? item.url);
          }
        } catch (error) {
          this.log("warn", "No se pudo procesar URL de Perplexity", {
            url: item.url,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    this.log("info", "Descubrimiento Perplexity completado", { found: results.length });
    return results;
  }

  private async processResult(
    url: string,
    existingUrls: Set<string>,
  ): Promise<RawScholarship | null> {
    const health = await checkUrlHealth(url);
    if (!health.valid) return null;

    const applyUrl = health.finalUrl ?? url;
    if (existingUrls.has(applyUrl)) return null;

    let html: string;
    try {
      html = await this.fetchPage(applyUrl);
    } catch {
      return null;
    }

    const $ = cheerio.load(html);
    const title =
      $("h1").first().text().trim() ||
      $("title").text().trim().split("|")[0]?.trim() ||
      "";

    if (!title) return null;

    const text = ($("main, article, .content, #content, body").first().text() || $("body").text())
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_TEXT_LENGTH);

    if (text.length < 50) return null;

    const raw = buildRawScholarship({ title, url: applyUrl, text });
    if (!raw) {
      this.log("info", "Descartado por filtro México/vigente (Perplexity)", { url: applyUrl });
    }
    return raw;
  }
}
