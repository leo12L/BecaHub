import * as cheerio from "cheerio";
import { BaseAdapter } from "../base.adapter";
import type { RawScholarship } from "../types";
import { validateUrlIsLive } from "../url-liveness";
import { MEXICO_PATTERN } from "@/lib/geo";
import {
  parseScholarshipText,
  AiUnavailableError,
  AiParseError,
} from "@/lib/ai/parse-scholarship";

const BASE_URL = "https://www.gob.mx";
const LISTING_URL = `${BASE_URL}/becasbenitojuarez`;
const MAX_TEXT_LENGTH = 20_000;

/**
 * Adaptador para el portal de Becas Benito Juárez (gob.mx). El sitio es un
 * portal de Drupal que no expone un listado tabular con metadatos
 * estructurados (montos, fechas límite, nivel académico): cada programa de
 * beca vive en un artículo individual con texto libre.
 *
 * Pipeline por convocatoria (mismo patrón que `TavilyDiscoveryAdapter`):
 * 1. `validateUrlIsLive()` sobre el enlace de la convocatoria.
 * 2. Descarga la página (vía `fetchPage()`, con robots.txt y throttle) y
 *    extrae el texto plano del contenido principal (`<main>`).
 * 3. `parseScholarshipText()` (Groq) extrae los campos estructurados.
 * 4. Filtro México y filtro vigente (igual que el adapter de Tavily).
 *
 * `applyUrl` siempre es la URL de la convocatoria que se descargó y validó
 * como viva — el modelo nunca aporta ni rellena URLs.
 */
export class BecasGobAdapter extends BaseAdapter {
  readonly name = "Becas Benito Juárez (gob.mx)";
  readonly sourceSlug = "becas-gob-mx";

  async scrape(): Promise<RawScholarship[]> {
    const results: RawScholarship[] = [];

    let html: string;
    try {
      html = await this.fetchListing();
    } catch (error) {
      this.log("error", "No se pudo descargar el listado principal", {
        url: LISTING_URL,
        error: error instanceof Error ? error.message : String(error),
      });
      return results;
    }

    const links = this.extractScholarshipLinks(html);

    if (links.size === 0) {
      this.log(
        "warn",
        "No se encontraron enlaces a becas en el listado; la estructura del sitio pudo haber cambiado",
        { url: LISTING_URL },
      );
      return results;
    }

    for (const url of links) {
      try {
        const raw = await this.processDetail(url);
        if (raw) results.push(raw);
      } catch (error) {
        this.log(
          "warn",
          "No se pudo procesar el detalle de una beca, se omite",
          {
            url,
            error: error instanceof Error ? error.message : String(error),
          },
        );
      }
    }

    this.log("info", "Scraping completado", { found: results.length });
    return results;
  }

  /** Descarga la página de listado de convocatorias. */
  async fetchListing(): Promise<string> {
    return this.fetchPage(LISTING_URL);
  }

  /** Extrae los URLs absolutos de cada convocatoria desde el listado. */
  extractScholarshipLinks(html: string): Set<string> {
    const $ = cheerio.load(html);
    const links = new Set<string>();

    $('a[href*="/articulos/"]').each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;

      const text = $(el).text().trim() || $(el).find("img").attr("alt") || "";
      if (!/beca/i.test(text) && !/beca/i.test(href)) return;

      const url = href.startsWith("http") ? href : `${BASE_URL}${href}`;
      links.add(url);
    });

    return links;
  }

  /** Descarga una convocatoria y extrae el texto plano de su contenido principal. */
  async fetchDetailText(url: string): Promise<string> {
    const html = await this.fetchPage(url);
    return extractMainText(html);
  }

  /**
   * Pipeline completo para una convocatoria: valida que el link esté vivo,
   * descarga su texto, lo estructura con Groq y aplica los filtros
   * México/vigente. Devuelve `null` si la convocatoria debe descartarse en
   * cualquier paso. `url` (la URL fetcheada y validada) es siempre el
   * `applyUrl` resultante.
   */
  async processDetail(url: string): Promise<RawScholarship | null> {
    const isLive = await validateUrlIsLive(url);
    if (!isLive) {
      this.log("info", "URL no responde, se omite", { url });
      return null;
    }

    const text = await this.fetchDetailText(url);
    if (!text || text.trim().length < 50) {
      this.log("info", "Contenido insuficiente, se omite", { url });
      return null;
    }

    let parsed;
    try {
      parsed = await parseScholarshipText(text.slice(0, MAX_TEXT_LENGTH));
    } catch (error) {
      if (
        error instanceof AiUnavailableError ||
        error instanceof AiParseError
      ) {
        this.log("warn", "IA no disponible o respuesta inválida, se omite", {
          url,
          error: error.message,
        });
        return null;
      }
      throw error;
    }

    if (!parsed.title) {
      this.log("info", "La IA no extrajo título, se omite", { url });
      return null;
    }

    const countryText = `${parsed.country ?? ""} ${text}`;
    if (!MEXICO_PATTERN.test(countryText)) {
      this.log("info", "Descartado por filtro México", { url });
      return null;
    }

    if (parsed.deadline) {
      const deadline = new Date(parsed.deadline);
      if (
        !Number.isNaN(deadline.getTime()) &&
        deadline.getTime() < Date.now()
      ) {
        this.log("info", "Descartado por convocatoria vencida", {
          url,
          deadline: parsed.deadline,
        });
        return null;
      }
    }

    return {
      title: parsed.title,
      descriptionRaw: parsed.description ?? undefined,
      url,
      deadlineRaw: parsed.deadline ?? undefined,
      countryRaw: parsed.country ?? "México",
      levelRaw: parsed.level ?? undefined,
      coverageRaw: parsed.coverageType ?? undefined,
      languageRaw: "es",
    };
  }
}

/** Extrae texto plano del contenido principal (`<main>`) de un HTML. */
function extractMainText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();
  return $("main").first().text().replace(/\s+/g, " ").trim();
}
