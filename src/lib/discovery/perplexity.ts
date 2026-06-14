const PERPLEXITY_TIMEOUT_MS = 25_000;
const PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions";

export class PerplexityUnavailableError extends Error {}

export interface PerplexitySearchResult {
  url: string;
  title: string;
  content: string;
}

interface PerplexityApiResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
  citations?: string[];
}

/**
 * Busca URLs de convocatorias usando la API de Perplexity (modelo `sonar`).
 * Extrae las `citations` del response — URLs reales que Perplexity recuperó —
 * y las devuelve junto con el contenido del mensaje para usar como texto de
 * apoyo en las heurísticas. Ningún LLM decide los campos de la beca; solo
 * aporta URLs candidatas que después pasan por `checkUrlHealth()` y
 * `buildRawScholarship()`.
 *
 * Requiere `PERPLEXITY_API_KEY`. Si no está configurada, lanza
 * `PerplexityUnavailableError`.
 */
export async function perplexitySearch(
  query: string,
  maxResults = 5,
): Promise<PerplexitySearchResult[]> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new PerplexityUnavailableError("PERPLEXITY_API_KEY no está configurada");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PERPLEXITY_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(PERPLEXITY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content:
              "Eres un asistente que busca convocatorias de becas para estudiantes mexicanos. " +
              "Devuelve solo URLs de páginas oficiales con convocatorias abiertas o vigentes.",
          },
          {
            role: "user",
            content: query,
          },
        ],
        max_tokens: 1000,
        return_citations: true,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: "year",
      }),
      signal: controller.signal,
    });
  } catch (error) {
    throw new PerplexityUnavailableError(
      error instanceof Error
        ? `No se pudo conectar con Perplexity: ${error.message}`
        : "No se pudo conectar con Perplexity",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new PerplexityUnavailableError(
      `Perplexity respondió con estado ${response.status}`,
    );
  }

  const data = (await response.json()) as PerplexityApiResponse;
  const citations: string[] = data.citations ?? [];
  const messageContent = data.choices?.[0]?.message?.content ?? "";

  // Return up to maxResults citation URLs with the message content as text aid
  return citations.slice(0, maxResults).map((url) => ({
    url,
    title: url,
    content: messageContent,
  }));
}
