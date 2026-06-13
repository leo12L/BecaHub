import type { ScraperRunStatus } from "@/generated/prisma/enums";

/**
 * Forma cruda de una beca tal como se extrae de una fuente, antes de
 * normalizar. Todos los campos son strings opcionales porque vienen
 * directamente del HTML/feed sin validar ni tipar.
 */
export interface RawScholarship {
  title?: string;
  descriptionRaw?: string;
  url?: string;
  deadlineRaw?: string;
  amountRaw?: string;
  countryRaw?: string;
  levelRaw?: string;
  coverageRaw?: string;
  languageRaw?: string;
}

/**
 * Contrato que debe implementar cada adaptador de scraping concreto.
 * `sourceSlug` debe coincidir con `Source.scraperAdapter` en la DB para
 * que el orquestador pueda resolverlo dinámicamente.
 */
export interface ScraperAdapter {
  /** Nombre legible del adapter, usado en logs. */
  readonly name: string;
  /** Identificador que coincide con `Source.scraperAdapter`. */
  readonly sourceSlug: string;
  scrape(): Promise<RawScholarship[]>;
}

/**
 * Resultado de una corrida del orquestador para una fuente, usado para
 * poblar un `ScraperLog`.
 */
export interface ScraperRunResult {
  sourceId: string | null;
  status: ScraperRunStatus;
  itemsFound: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsSkipped: number;
  errorMessage?: string;
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
}
