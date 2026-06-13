import * as cheerio from "cheerio";
import { BaseAdapter } from "../base.adapter";
import type { RawScholarship } from "../types";
import { validateUrlIsLive } from "../url-liveness";
import { buildRawScholarship } from "../discovery/heuristics";

const BASE_URL = "https://www.gob.mx";
const LISTING_URL = `${BASE_URL}/becasbenitojuarez`;
const MAX_TEXT_LENGTH = 20_000;

/**
 * Adaptador para el portal de Becas Benito Juárez (gob.mx). El sitio es un
 * portal de Drupal que no expone un listado tabular con metadatos
 * estructurados (montos, fechas límite, nivel académico): cada programa de
 * beca vive en un artículo individual con texto libre.
 *
 * Pipeline por convocatoria (mismo patrón que `TavilyDiscoveryAdapter`,
 * **sin LLM**):
 * 1. `validateUrlIsLive()` sobre el enlace de la convocatoria.
 * 2. Descarga la página (vía `fetchPage()`, con robots.txt y throttle) y
 *    extrae el texto plano del contenido principal (`<main>`).
 * 3. `buildRawScholarship()` (heurísticas, `src/scrapers/discovery/heuristics.ts`)
 *    infiere los campos ricos y aplica los filtros México/vigente.
 *
 * `applyUrl` siempre es la URL de la convocatoria que se descargó y validó
 * como viva — ningún modelo aporta ni rellena URLs.
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
   * descarga su texto y aplica heurísticas + filtros México/vigente
   * (`buildRawScholarship`). Devuelve `null` si la convocatoria debe
   * descartarse en cualquier paso. `url` (la URL fetcheada y validada) es
   * siempre el `applyUrl` resultante.
   */
  async processDetail(url: string): Promise<RawScholarship | null> {
    const isLive = await validateUrlIsLive(url);
    if (!isLive) {
      this.log("info", "URL no responde, se omite", { url });
      return null;
    }

    const html = await this.fetchPage(url);
    const text = extractMainText(html);
    if (!text || text.trim().length < 50) {
      this.log("info", "Contenido insuficiente, se omite", { url });
      return null;
    }

    const title = extractTitle(html);
    const raw = buildRawScholarship({
      title,
      url,
      text: text.slice(0, MAX_TEXT_LENGTH),
    });

    if (!raw) {
      this.log("info", "Descartado por filtro título/México/vigente", { url });
      return null;
    }

    return raw;
  }
}

/** Extrae texto plano del contenido principal (`<main>`) de un HTML. */
function extractMainText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();
  return $("main").first().text().replace(/\s+/g, " ").trim();
}

/** Extrae el título de la convocatoria desde el `<h1>` (o `<title>` como respaldo). */
function extractTitle(html: string): string {
  const $ = cheerio.load(html);
  const h1 =
    $("main h1").first().text().trim() || $("h1").first().text().trim();
  return h1 || $("title").text().trim();
}
