import { SCRAPER_USER_AGENT } from "@/scrapers/base.adapter";

const HEALTH_TIMEOUT_MS = 10_000;
const MAX_BODY_LENGTH = 50_000;
const MIN_BODY_LENGTH = 100;

export interface UrlHealthResult {
  valid: boolean;
  finalUrl?: string;
  reason?: string;
}

/** Frases que sugieren que la página "vive" pero la convocatoria ya no. */
const SOFT_404_PATTERNS = [
  /p[aá]gina no encontrada/i,
  /no\s+(fue\s+)?encontrad[oa]/i,
  /not found/i,
  /error 404/i,
  /convocatoria (cerrada|finalizada|expirada|ha (cerrado|finalizado|expirado))/i,
  /(esta|la) p[aá]gina (ya )?no est[aá] disponible/i,
  /contenido no disponible/i,
  /ha expirado/i,
  /enlace roto/i,
];

/**
 * Verifica que `url` apunte a una convocatoria viva, para el panel de
 * curación de admin. Más estricta que `src/scrapers/url-liveness.ts`
 * (pensada para el orquestador de scraping):
 *
 * - Sigue redirecciones y reporta la URL final.
 * - Hace `GET` (no `HEAD`) porque necesita inspeccionar el contenido.
 * - Rechaza si el status final no es 2xx.
 * - Rechaza contenido vacío o demasiado corto.
 * - Detecta "soft 404": páginas que responden 200 pero el cuerpo dice
 *   "no encontrado" / "convocatoria cerrada" / etc.
 * - Ante timeout o error de red, devuelve inválido (nunca lanza).
 */
export async function checkUrlHealth(url: string): Promise<UrlHealthResult> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": SCRAPER_USER_AGENT },
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });
  } catch (error) {
    return {
      valid: false,
      reason:
        error instanceof Error
          ? `No se pudo conectar: ${error.message}`
          : "No se pudo conectar",
    };
  }

  const finalUrl = response.url || url;

  if (!response.ok) {
    return { valid: false, finalUrl, reason: `HTTP ${response.status}` };
  }

  let body: string;
  try {
    const text = await response.text();
    body = text.slice(0, MAX_BODY_LENGTH);
  } catch {
    return { valid: false, finalUrl, reason: "No se pudo leer el contenido" };
  }

  const stripped = body
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (stripped.length < MIN_BODY_LENGTH) {
    return {
      valid: false,
      finalUrl,
      reason: "Contenido vacío o demasiado corto",
    };
  }

  for (const pattern of SOFT_404_PATTERNS) {
    if (pattern.test(stripped)) {
      return {
        valid: false,
        finalUrl,
        reason: "La página indica que el contenido ya no está disponible",
      };
    }
  }

  return { valid: true, finalUrl };
}
