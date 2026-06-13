const TAVILY_TIMEOUT_MS = 20_000;
const TAVILY_URL = "https://api.tavily.com/search";

/** La API de Tavily no está disponible, no respondió a tiempo, o falta `TAVILY_API_KEY`. */
export class TavilyUnavailableError extends Error {}

/** Resultado individual de una búsqueda de Tavily. */
export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  /** Solo presente si `includeRawContent: true`. */
  rawContent?: string;
  score: number;
  publishedDate?: string;
}

export interface TavilySearchParams {
  query: string;
  maxResults?: number;
  searchDepth?: "basic" | "advanced";
  /** Si es `true`, Tavily intenta devolver el contenido crudo de cada página. */
  includeRawContent?: boolean;
  /** Dominios a priorizar (fuentes oficiales/confiables). */
  includeDomains?: string[];
}

interface TavilyApiResponse {
  results?: Array<{
    title?: string;
    url?: string;
    content?: string;
    raw_content?: string;
    score?: number;
    published_date?: string;
  }>;
}

/**
 * Busca en la web usando la API de Tavily (hosted) vía `fetch`, sin SDK —
 * mismo patrón aislado que `src/lib/ai/profile-assistant.ts`. Si cambia el
 * proveedor de descubrimiento, solo este módulo debería tocarse.
 *
 * Cada llamada consume 1 crédito de Tavily con `searchDepth: "basic"`
 * (el default). Lanza `TavilyUnavailableError` si Tavily no responde,
 * responde con error, o falta `TAVILY_API_KEY`.
 */
export async function tavilySearch(
  params: TavilySearchParams,
): Promise<TavilySearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.error("[tavily] TAVILY_API_KEY no está configurada");
    throw new TavilyUnavailableError("TAVILY_API_KEY no está configurada");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TAVILY_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(TAVILY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: params.query,
        max_results: params.maxResults ?? 5,
        search_depth: params.searchDepth ?? "basic",
        include_answer: false,
        include_raw_content: params.includeRawContent ?? false,
        ...(params.includeDomains?.length
          ? { include_domains: params.includeDomains }
          : {}),
      }),
      signal: controller.signal,
    });
  } catch (error) {
    throw new TavilyUnavailableError(
      error instanceof Error
        ? `No se pudo conectar con Tavily: ${error.message}`
        : "No se pudo conectar con Tavily",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    if (response.status === 401) {
      console.error(
        "[tavily] Tavily respondió 401: TAVILY_API_KEY inválida o faltante",
      );
    } else {
      console.error(`[tavily] Tavily respondió con estado ${response.status}`);
    }
    throw new TavilyUnavailableError(
      `Tavily respondió con estado ${response.status}`,
    );
  }

  const data = (await response.json()) as TavilyApiResponse;

  return (data.results ?? []).map((result) => ({
    title: result.title?.trim() ?? "",
    url: result.url?.trim() ?? "",
    content: result.content?.trim() ?? "",
    rawContent: result.raw_content?.trim() || undefined,
    score: result.score ?? 0,
    publishedDate: result.published_date,
  }));
}

/**
 * Variante simplificada de `tavilySearch` (compatibilidad con
 * `TavilyDiscoveryAdapter`, Fase 3B): solo `query` y `maxResults`, sin
 * contenido crudo ni filtro de dominios.
 */
export async function searchTavily(
  query: string,
  maxResults = 5,
): Promise<TavilySearchResult[]> {
  return tavilySearch({ query, maxResults });
}
