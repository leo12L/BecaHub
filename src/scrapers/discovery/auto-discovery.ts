import { runScraper } from "../orchestrator";
import {
  SEARCH_QUERIES,
  INCLUDE_DOMAINS,
} from "../adapters/tavily-discovery.adapter";
import type { ScraperRunResult } from "../types";

/** `Source.id` de "Descubrimiento (Tavily)" (ver `prisma/seed.ts`). */
export const DISCOVERY_SOURCE_ID = "00000000-0000-0000-0000-000000000003";

/** Tavily cobra 1 crédito por búsqueda con `search_depth: "basic"`. */
const CREDITS_PER_QUERY = 1;

export interface AutoDiscoveryResult extends ScraperRunResult {
  queries: string[];
  includeDomains: string[];
  creditsUsed: number;
}

/**
 * Punto de entrada del descubrimiento automático ("que corra solo"):
 * ejecuta `TavilyDiscoveryAdapter` vía el orquestador (que ya crea/actualiza
 * el `ScraperLog` de la fuente "Descubrimiento (Tavily)") y le agrega el
 * resumen de queries/créditos usados para `npm run discover` y el endpoint
 * de admin.
 */
export async function runAutoDiscovery(): Promise<AutoDiscoveryResult> {
  const [result] = await runScraper(DISCOVERY_SOURCE_ID);

  return {
    ...result,
    queries: SEARCH_QUERIES,
    includeDomains: INCLUDE_DOMAINS,
    creditsUsed: SEARCH_QUERIES.length * CREDITS_PER_QUERY,
  };
}
