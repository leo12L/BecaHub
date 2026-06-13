import { BaseAdapter } from "../base.adapter";
import type { RawScholarship } from "../types";
import { buildRawScholarship } from "../discovery/heuristics";
import { tavilySearch, type TavilySearchResult } from "@/lib/discovery/tavily";
import { checkUrlHealth } from "@/lib/validation/url-health";
import { db } from "@/lib/db";

/** Consultas usadas para descubrir convocatorias nuevas vía Tavily. */
export const SEARCH_QUERIES = [
  "becas México 2026 convocatoria abierta",
  "becas posgrado México 2026 SECIHTI",
  "becas licenciatura gobierno México vigente",
];

/** Dominios oficiales/confiables a priorizar en la búsqueda. */
export const INCLUDE_DOMAINS = [
  "gob.mx",
  "secihti.mx",
  "enbc.secihti.mx",
  "sep.gob.mx",
  "becasbenitojuarez.sep.gob.mx",
];

const MAX_RESULTS_PER_QUERY = 5;
const MAX_TEXT_LENGTH = 5_000;

/**
 * Adaptador de descubrimiento: usa la API de Tavily para encontrar páginas
 * con convocatorias de becas que no provienen de ninguna fuente fija.
 *
 * **Sin LLM**: a diferencia de versiones anteriores, este adapter NO pasa el
 * contenido por Groq. Los campos ricos (`coverageType`, `academicLevel`,
 * `deadline`, montos) se infieren con heurísticas simples
 * (`src/scrapers/discovery/heuristics.ts`) sobre `title`/`content` que
 * devuelve Tavily; lo que no se detecta queda `null` para que el admin lo
 * complete en la revisión.
 *
 * Pipeline por resultado:
 * 1. Descarta URLs ya vistas o ya existentes en la DB (`applyUrl`).
 * 2. `checkUrlHealth()` — descarta URLs muertas, con error HTTP o soft-404.
 *    `applyUrl` = la URL final tras seguir redirecciones (la que de verdad
 *    respondió 200), nunca una URL inventada.
 * 3. Filtro México: descarta resultados que no mencionan México en el título
 *    ni en el contenido.
 * 4. Filtro vigente: si se detecta una `deadline` y ya pasó, se descarta.
 *    Si no se detecta ninguna, se deja pasar como `PENDING_REVIEW` (el admin
 *    la completa).
 *
 * Si Tavily no está configurado (`TAVILY_API_KEY` faltante) o no responde,
 * lanza para que el orquestador marque la fuente como `FAILED`.
 */
export class TavilyDiscoveryAdapter extends BaseAdapter {
  readonly name = "Descubrimiento (Tavily)";
  readonly sourceSlug = "tavily-discovery";

  async scrape(): Promise<RawScholarship[]> {
    const results: RawScholarship[] = [];
    const seenUrls = new Set<string>();

    const existingScholarships = await db.scholarship.findMany({
      select: { applyUrl: true },
    });
    const existingUrls = new Set(existingScholarships.map((s) => s.applyUrl));

    for (const query of SEARCH_QUERIES) {
      // Si Tavily no está disponible (p. ej. falta la API key), todas las
      // demás consultas fallarán igual: se deja propagar para que el
      // orquestador marque la corrida completa como FAILED.
      const searchResults = await tavilySearch({
        query,
        maxResults: MAX_RESULTS_PER_QUERY,
        searchDepth: "basic",
        includeRawContent: true,
        includeDomains: INCLUDE_DOMAINS,
      });

      for (const item of searchResults) {
        if (!item.url || seenUrls.has(item.url) || existingUrls.has(item.url)) {
          continue;
        }
        seenUrls.add(item.url);

        try {
          const raw = await this.processResult(item, existingUrls);
          if (raw) {
            results.push(raw);
            existingUrls.add(raw.url ?? item.url);
          }
        } catch (error) {
          this.log("warn", "No se pudo procesar un resultado, se omite", {
            url: item.url,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    this.log("info", "Descubrimiento completado", { found: results.length });
    return results;
  }

  private async processResult(
    item: TavilySearchResult,
    existingUrls: Set<string>,
  ): Promise<RawScholarship | null> {
    const health = await checkUrlHealth(item.url);
    if (!health.valid) {
      this.log("info", "URL no vive o es soft-404, se omite", {
        url: item.url,
        reason: health.reason,
      });
      return null;
    }

    // `applyUrl` = la URL final tras seguir redirecciones, que es la que
    // realmente respondió 200 — nunca una URL inventada por un modelo.
    const applyUrl = health.finalUrl ?? item.url;
    if (existingUrls.has(applyUrl)) return null;

    const text = (item.rawContent || item.content || "").slice(
      0,
      MAX_TEXT_LENGTH,
    );
    if (text.trim().length < 50) {
      this.log("info", "Contenido insuficiente, se omite", { url: applyUrl });
      return null;
    }

    const title = item.title?.trim();
    if (!title) {
      this.log("info", "Tavily no devolvió título, se omite", {
        url: applyUrl,
      });
      return null;
    }

    // `applyUrl` siempre es la URL real que Tavily devolvió y que
    // `checkUrlHealth()` validó como viva (200, sin soft-404). Ningún LLM
    // participa en este pipeline; los campos ricos se infieren con
    // heurísticas (`buildRawScholarship`).
    const raw = buildRawScholarship({
      title,
      url: applyUrl,
      text,
      descriptionFallback: item.content,
    });

    if (!raw) {
      this.log("info", "Descartado por filtro México/vigente", {
        url: applyUrl,
      });
      return null;
    }

    return raw;
  }
}
