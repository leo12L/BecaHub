/**
 * Heurísticas de extracción sin LLM para el pipeline de becas (descubrimiento
 * con Tavily y scraping directo). Solo buscan patrones de texto/fechas/montos
 * en el contenido descargado; lo que no se detecta queda `null` y el admin lo
 * completa en la revisión. Ningún LLM participa en este pipeline.
 */
import { MEXICO_PATTERN } from "@/lib/geo";
import { parseSpanishDate } from "../normalize";
import type { RawScholarship } from "../types";

const DEADLINE_KEYWORDS =
  /(fecha\s+l[ií]mite|fecha\s+de\s+cierre|cierre\s+de\s+(la\s+)?convocatoria|vencimiento|vence\s+el|hasta\s+el|plazo\s+(de\s+)?(registro|inscripci[oó]n)?)/i;

const DATE_PATTERNS = [
  /\d{1,2}\s+de\s+[a-záéíóúñ]+\s+de\s+\d{4}/gi,
  /\d{4}-\d{2}-\d{2}/g,
  /\d{1,2}[/-]\d{1,2}[/-]\d{4}/g,
];

/**
 * Busca una fecha límite en `text`: primero cerca de palabras clave
 * ("fecha límite", "cierre", "hasta el", etc.), y si no encuentra nada,
 * toma la primera fecha que aparezca en el texto. Devuelve el substring
 * crudo de la fecha (sin parsear) o `undefined` si no encuentra ninguna.
 */
export function extractDeadlineRaw(text: string): string | undefined {
  const sentences = text.split(/(?<=[.;])\s+/);

  for (const sentence of sentences) {
    if (!DEADLINE_KEYWORDS.test(sentence)) continue;
    for (const pattern of DATE_PATTERNS) {
      const match = sentence.match(pattern);
      if (match?.[0]) return match[0];
    }
  }

  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[0]) return match[0];
  }

  return undefined;
}

const AMOUNT_PATTERN = /\$\s?[\d,]+(\.\d+)?(\s?(MXN|pesos))?/gi;

/**
 * Busca montos en pesos (`$1,000`, `$5,000 MXN`, etc.) en `text`. Devuelve
 * hasta 2 coincidencias unidas en un string, o `undefined` si no encuentra
 * ninguna.
 */
export function extractAmountRaw(text: string): string | undefined {
  const matches = text.match(AMOUNT_PATTERN);
  if (!matches || matches.length === 0) return undefined;
  return matches.slice(0, 2).join(" ");
}

export interface HeuristicScholarshipInput {
  title: string;
  /** `applyUrl`: la URL real ya validada como viva. */
  url: string;
  /** Texto completo de la página/resultado, usado para las heurísticas. */
  text: string;
  /** Resumen/snippet a usar como `descriptionRaw` si existe (preferido sobre `text`). */
  descriptionFallback?: string;
}

/**
 * Construye un `RawScholarship` aplicando las heurísticas de esta unidad y
 * los filtros México/vigente. Devuelve `null` si debe descartarse (sin
 * título, no es de México, o la convocatoria ya venció).
 */
export function buildRawScholarship(
  input: HeuristicScholarshipInput,
): RawScholarship | null {
  const title = input.title.trim();
  if (!title) return null;

  // Include URL domain so .mx domains (gob.mx, secihti.mx, etc.) pass automatically
  const countryText = `${title} ${input.url} ${input.text}`;
  if (!MEXICO_PATTERN.test(countryText)) return null;

  const deadlineRaw = extractDeadlineRaw(input.text);
  if (deadlineRaw) {
    const deadline = parseSpanishDate(deadlineRaw);
    if (deadline && deadline.getTime() < Date.now()) return null;
  }

  return {
    title,
    descriptionRaw:
      input.descriptionFallback?.trim() || input.text.slice(0, 500),
    url: input.url,
    deadlineRaw,
    amountRaw: extractAmountRaw(input.text),
    countryRaw: "México",
    levelRaw: input.text,
    coverageRaw: input.text,
    languageRaw: "es",
  };
}
