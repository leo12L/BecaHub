import { parseSpanishDate } from "@/scrapers/normalize";
import type { BecaCandidata, ValidationResult } from "./types";

/**
 * Quita acentos y normaliza texto para comparación.
 */
export function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Normaliza un texto para el fingerprint: sin acentos, minúsculas,
 * espacios colapsados, sin puntuación extra.
 */
export function normalizeForFingerprint(text: string): string {
  return stripAccents(text)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "");
}

/**
 * Genera un fingerprint único para deduplicación basado en:
 * - título normalizado (sin acentos, minúsculas, espacios colapsados)
 * - convocante normalizado
 * - año de la convocatoria (extraído de deadline si existe, o año actual)
 */
export function generateFingerprint(beca: BecaCandidata): string {
  const titleNorm = normalizeForFingerprint(beca.title);
  const convocanteNorm = beca.convocante
    ? normalizeForFingerprint(beca.convocante)
    : "";

  let year = new Date().getFullYear();
  if (beca.deadline) {
    const parsed = parseSpanishDate(beca.deadline);
    if (parsed) {
      year = parsed.getFullYear();
    }
  }

  return `${titleNorm}|${convocanteNorm}|${year}`;
}

/**
 * Valida una beca candidata: verifica campos obligatorios y formatos.
 * Retorna un objeto con el resultado y los errores si los hay.
 */
export function validateBecaCandidata(beca: unknown): ValidationResult {
  const errors: string[] = [];

  if (!beca || typeof beca !== "object") {
    return { valid: false, errors: ["La beca debe ser un objeto"] };
  }

  const b = beca as Record<string, unknown>;

  if (!b.title || typeof b.title !== "string" || b.title.trim().length === 0) {
    errors.push("El título es requerido");
  }

  if (
    !b.description ||
    typeof b.description !== "string" ||
    b.description.trim().length === 0
  ) {
    errors.push("La descripción es requerida");
  }

  if (!b.applyUrl || typeof b.applyUrl !== "string") {
    errors.push("La URL es requerida");
  } else {
    try {
      new URL(b.applyUrl);
    } catch {
      errors.push("La URL no es válida");
    }
  }

  // Validar deadline si existe
  if (b.deadline && typeof b.deadline === "string") {
    const parsed = parseSpanishDate(b.deadline);
    if (!parsed) {
      errors.push("Formato de fecha no reconocido");
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    beca: beca as BecaCandidata,
  };
}

/**
 * Valida que una URL esté viva (responde 200).
 * Retorna un objeto con el estado de validación.
 */
export async function validateUrlLiveness(
  url: string,
): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return {
        valid: false,
        error: `HTTP ${response.status}`,
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Error al validar la URL",
    };
  }
}
