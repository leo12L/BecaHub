import * as cheerio from "cheerio";
import { BaseAdapter } from "../base.adapter";
import type { RawScholarship } from "../types";

const BASE_URL = "https://www.gob.mx";
const LISTING_URL = `${BASE_URL}/becasbenitojuarez`;

/**
 * Adaptador para el portal de Becas Benito Juárez (gob.mx). El sitio es un
 * portal de Drupal que no expone un listado tabular con metadatos
 * estructurados (montos, fechas límite, nivel académico): cada programa de
 * beca vive en un artículo individual con texto libre.
 *
 * Estrategia: desde la página principal extraemos los enlaces a artículos
 * cuyo texto/alt menciona "beca", y de cada artículo extraemos título,
 * descripción y (si aparece) una fecha límite en formato español.
 */
export class BecasGobAdapter extends BaseAdapter {
  readonly name = "Becas Benito Juárez (gob.mx)";
  readonly sourceSlug = "becas-gob-mx";

  async scrape(): Promise<RawScholarship[]> {
    const results: RawScholarship[] = [];

    let html: string;
    try {
      html = await this.fetchPage(LISTING_URL);
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
        const raw = await this.scrapeDetail(url);
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

  private extractScholarshipLinks(html: string): Set<string> {
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

  private async scrapeDetail(url: string): Promise<RawScholarship | null> {
    const html = await this.fetchPage(url);
    const $ = cheerio.load(html);

    const title = $("h1").first().text().trim();
    if (!title) return null;

    const description = $('[class*="field--name-body"], article p')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean)
      .join("\n\n");

    const deadlineRaw = extractDeadline($("body").text());

    return {
      title,
      descriptionRaw: description || undefined,
      url,
      deadlineRaw,
      countryRaw: "México",
      coverageRaw: title,
      languageRaw: "es",
    };
  }
}

/** Busca un patrón "15 de marzo de 2026" en texto libre. */
function extractDeadline(text: string): string | undefined {
  const match = text.match(/\d{1,2}\s+de\s+[a-záéíóúñ]+\s+de\s+\d{4}/i);
  return match?.[0];
}
