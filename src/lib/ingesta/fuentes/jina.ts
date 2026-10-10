import type { BecaCandidata, FuenteLector } from "../types";

const JINA_BASE_URL = "https://r.jina.ai/";
const FETCH_TIMEOUT_MS = 20_000;

// URLs de sitios conocidos con becas (ejemplo para Jina Reader)
const TARGET_URLS = [
  "https://www.gob.mx/sep/acciones-y-programas/becas-educacion-superior",
];

/**
 * Lector para páginas HTML vía Jina Reader (r.jina.ai).
 * Jina Reader convierte HTML a markdown sin necesidad de API key.
 */
export class JinaLector implements FuenteLector {
  readonly nombre = "Jina Reader (HTML)";
  readonly sourceSlug = "jina-reader";

  async obtener(): Promise<unknown> {
    const results: Array<{ url: string; content: string }> = [];

    for (const url of TARGET_URLS) {
      try {
        const content = await this.fetchViaJina(url);
        results.push({ url, content });
      } catch (error) {
        console.warn(
          `[Jina] Error obteniendo ${url}:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    return results;
  }

  private async fetchViaJina(url: string): Promise<string> {
    const jinaUrl = `${JINA_BASE_URL}${url}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(jinaUrl, {
        headers: {
          "User-Agent": "BecaHubBot/1.0 (+https://becahub.example/about-bot)",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `Jina Reader respondió con ${response.status} para ${url}`,
        );
      }

      return await response.text();
    } finally {
      clearTimeout(timeout);
    }
  }

  normalizar(data: unknown): BecaCandidata[] {
    if (!Array.isArray(data)) {
      console.warn("[Jina] La respuesta no es un array");
      return [];
    }

    const becas: BecaCandidata[] = [];

    for (const item of data) {
      if (
        typeof item !== "object" ||
        item === null ||
        !("content" in item) ||
        !("url" in item)
      ) {
        continue;
      }

      const { content, url } = item as { content: string; url: string };

      try {
        const extraidas = this.extraerBecasDeMarkdown(content, url);
        becas.push(...extraidas);
      } catch (error) {
        console.warn(
          `[Jina] Error extrayendo becas de ${url}:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    return becas;
  }

  private extraerBecasDeMarkdown(
    markdown: string,
    sourceUrl: string,
  ): BecaCandidata[] {
    const becas: BecaCandidata[] = [];

    // Extraer URL fuente del markdown (línea "URL Source:")
    const urlSourceMatch = markdown.match(/URL Source:\s*(.+)/);
    const baseUrl = urlSourceMatch ? urlSourceMatch[1]?.trim() : sourceUrl;

    // Dividir por secciones con encabezados de nivel 2 (##)
    const sections = markdown.split(/\n##\s+/);

    for (let i = 1; i < sections.length; i++) {
      const section = sections[i];
      if (!section) continue;

      try {
        const beca = this.parsearSeccion(section, baseUrl ?? sourceUrl);
        if (beca) {
          becas.push(beca);
        }
      } catch (error) {
        console.warn(
          "[Jina] Error parseando sección:",
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    return becas;
  }

  private parsearSeccion(
    section: string,
    baseUrl: string,
  ): BecaCandidata | null {
    const lines = section.split("\n");
    const title = lines[0]?.trim();

    if (!title) return null;

    // Extraer información de la sección
    let deadline: string | null = null;
    let amount: string | null = null;
    let academicLevel: string | null = null;
    let applyUrl: string | null = null;
    let description = "";
    let convocante: string | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Fecha límite
      if (/fecha\s+(l[ií]mite|de\s+cierre|de\s+registro)/i.test(trimmed)) {
        const match = trimmed.match(/:\s*(.+)/);
        if (match) deadline = match[1]?.trim() ?? null;
      }

      // Monto
      if (/monto|apoyo|beca/i.test(trimmed) && /\$|MXN|USD/i.test(trimmed)) {
        const match = trimmed.match(/:\s*(.+)/);
        if (match) amount = match[1]?.trim() ?? null;
      }

      // Nivel académico
      if (/nivel|dirigido\s+a/i.test(trimmed)) {
        const match = trimmed.match(/:\s*(.+)/);
        if (match) academicLevel = match[1]?.trim() ?? null;
      }

      // URL de aplicación
      if (trimmed.match(/https?:\/\//)) {
        const urlMatch = trimmed.match(/(https?:\/\/[^\s)]+)/);
        if (urlMatch && !applyUrl) {
          applyUrl = urlMatch[1] ?? null;
        }
      }

      // Convocante
      if (/convoca|organizador/i.test(trimmed)) {
        const match = trimmed.match(/:\s*(.+)/);
        if (match) convocante = match[1]?.trim() ?? null;
      }

      // Descripción (primeras líneas de texto)
      if (
        !trimmed.startsWith("**") &&
        !trimmed.match(/^[-*]/) &&
        trimmed.length > 20 &&
        description.length < 500
      ) {
        description += (description ? " " : "") + trimmed;
      }
    }

    // Si no encontramos URL específica, usar la base
    if (!applyUrl) {
      applyUrl = baseUrl;
    }

    return {
      title,
      description: description || title,
      applyUrl,
      deadline,
      amount,
      coverageType: null,
      academicLevel,
      countryDestination: null,
      language: "Español",
      convocante,
      rawData: {
        sourceUrl: baseUrl,
        section,
      },
    };
  }
}
