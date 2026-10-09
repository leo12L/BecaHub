import { z } from "zod";

/**
 * Esquema de validación para una beca candidata desde una fuente externa.
 * Los campos opcionales se validan pero pueden quedar null si no se detectan
 * con confianza, entrando a PENDING_REVIEW para revisión manual.
 */
export const BecaCandidataSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  applyUrl: z.string().url("La URL debe ser válida"),
  deadline: z.string().nullable(),
  amount: z.string().nullable(),
  coverageType: z.string().nullable(),
  academicLevel: z.string().nullable(),
  countryDestination: z.string().nullable(),
  language: z.string().nullable(),
  convocante: z.string().nullable(),
  rawData: z.record(z.unknown()).optional(),
});

export type BecaCandidata = z.infer<typeof BecaCandidataSchema>;

/**
 * Resultado de la validación de una beca candidata.
 * Incluye la beca (si es válida) y/o errores de validación.
 */
export interface ValidationResult {
  valid: boolean;
  beca?: BecaCandidata;
  errors?: string[];
}

/**
 * Contrato que debe implementar cada lector de fuente.
 * Cada fuente tiene su propio módulo en `fuentes/<fuente>.ts`.
 */
export interface FuenteLector {
  readonly nombre: string;
  readonly sourceSlug: string;
  obtener(): Promise<unknown>;
  normalizar(data: unknown): BecaCandidata[];
}

/**
 * Resultado de una ejecución de ingesta para una fuente.
 */
export interface ResultadoIngesta {
  sourceId: string | null;
  fuente: string;
  status: "SUCCESS" | "PARTIAL" | "FAILED";
  encontradas: number;
  creadas: number;
  actualizadas: number;
  omitidas: number;
  error?: string;
  inicio: Date;
  fin: Date;
  duracionMs: number;
}
