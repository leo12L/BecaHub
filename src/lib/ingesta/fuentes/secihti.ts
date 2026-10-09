import type { BecaCandidata, FuenteLector } from "../types";

const SECIHTI_API_URL =
  "https://secihti.mx/wp-json/wp/v2/convocatoria?categories=265,266&per_page=50";
const FETCH_TIMEOUT_MS = 15_000;

interface SECIHTIResponse {
  id: number;
  title: { rendered: string };
  link: string;
  acf: {
    titulo_resumido?: string;
    conv_year?: number;
    fechas?: {
      conclusion?: string;
      solicitudes?: string;
    };
    docs_convocatoria?: string;
    categorias?: number[];
  };
}

/**
 * Lector para la API JSON de SECIHTI.
 * Obtiene convocatorias de las categorías 265 y 266.
 */
export class SECIHTILector implements FuenteLector {
  readonly nombre = "SECIHTI (API JSON)";
  readonly sourceSlug = "secihti-api";

  async obtener(): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(SECIHTI_API_URL, {
        headers: {
          "User-Agent": "BecaHubBot/1.0 (+https://becahub.example/about-bot)",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`SECIHTI API respondió con ${response.status}`);
      }

      const data = await response.json();
      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  normalizar(data: unknown): BecaCandidata[] {
    if (!Array.isArray(data)) {
      console.warn("[SECIHTI] La respuesta no es un array");
      return [];
    }

    const becas: BecaCandidata[] = [];

    for (const item of data) {
      try {
        const beca = this.normalizarItem(item as SECIHTIResponse);
        if (beca) {
          becas.push(beca);
        }
      } catch (error) {
        console.warn(
          `[SECIHTI] Error normalizando item ${(item as SECIHTIResponse).id}:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    return becas;
  }

  private normalizarItem(item: SECIHTIResponse): BecaCandidata | null {
    const title = item.title?.rendered?.trim();
    if (!title) return null;

    const applyUrl = item.link?.trim();
    if (!applyUrl) return null;

    // Usar la fecha de conclusión como deadline, o la de solicitudes
    const deadline =
      item.acf?.fechas?.conclusion || item.acf?.fechas?.solicitudes || null;

    // Extraer año de la convocatoria
    const year = item.acf?.conv_year;

    return {
      title: this.cleanHtml(title),
      description: item.acf?.titulo_resumido
        ? this.cleanHtml(item.acf.titulo_resumido)
        : this.cleanHtml(title),
      applyUrl,
      deadline,
      amount: null,
      coverageType: "RESEARCH",
      academicLevel: null,
      countryDestination: "México",
      language: "Español",
      convocante: "SECIHTI",
      rawData: {
        id: item.id,
        year,
        categories: item.acf?.categorias,
        docs_url: item.acf?.docs_convocatoria,
      },
    };
  }

  private cleanHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .trim();
  }
}
