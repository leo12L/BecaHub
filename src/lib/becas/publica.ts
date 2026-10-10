/**
 * Reglas de visibilidad pública de becas.
 *
 * Único lugar donde vive qué ve un usuario que no es admin/moderador.
 * Ninguna consulta pública debe armar su propio filtro de estado: usa estas
 * funciones, igual que las fechas pasan por `src/lib/fechas.ts`.
 *
 * - Listados, portada, recomendaciones, sitemap, contadores y alta de
 *   favorito/postulación: `filtroBecaPublica()` (ACTIVE y no vencida).
 * - Detalle `/becas/[slug]`: `filtroBecaDetallePublico()` / `estadoDetallePublico()`.
 *   ACTIVE, CLOSED y vencidas se muestran; DRAFT y PENDING_REVIEW dan 404.
 */

import type { Prisma } from "@/generated/prisma/client";
import type { Role } from "@/generated/prisma/enums";
import { getTodayInMexicoCity } from "@/lib/fechas";

export const AVISO_CONVOCATORIA_CERRADA =
  "Esta convocatoria ha cerrado y ya no acepta postulaciones.";

/**
 * Filtro WHERE de Prisma para becas visibles en listados públicos.
 *
 * - Estado: ACTIVE
 * - Vigencia: deadline >= hoy (America/Mexico_City) o sin deadline
 */
export function filtroBecaPublica(): Prisma.ScholarshipWhereInput {
  const todayMexico = getTodayInMexicoCity();

  return {
    status: "ACTIVE",
    OR: [{ deadline: { gte: todayMexico } }, { deadline: null }],
  };
}

/**
 * Filtro WHERE de Prisma para la ficha pública `/becas/[slug]`.
 *
 * ACTIVE y CLOSED (incluidas las vencidas). DRAFT y PENDING_REVIEW quedan fuera
 * y el caller debe responder 404.
 */
export function filtroBecaDetallePublico(): Prisma.ScholarshipWhereInput {
  return {
    status: { in: ["ACTIVE", "CLOSED"] },
  };
}

export function puedePedirEstadoNoPublico(role?: Role | null): boolean {
  return role === "ADMIN" || role === "MODERATOR";
}

/**
 * El listado público `/becas` nunca acepta `?status`.
 * Admin filtra estados en `/admin/becas`, no aquí.
 */
export function queryListadoPublico<T extends { status?: unknown }>(
  query: T,
): Omit<T, "status"> & { status: undefined } {
  return { ...query, status: undefined };
}

type BecaParaDetalle = {
  status: string;
  deadline: Date | string | null;
};

function toDeadlineDate(deadline: Date | string | null): Date | null {
  if (deadline === null) return null;
  return typeof deadline === "string" ? new Date(deadline) : deadline;
}

export function esVisibleEnDetalle(scholarship: BecaParaDetalle): boolean {
  return scholarship.status === "ACTIVE" || scholarship.status === "CLOSED";
}

export function esCerrada(scholarship: BecaParaDetalle): boolean {
  if (scholarship.status === "CLOSED") {
    return true;
  }

  const deadline = toDeadlineDate(scholarship.deadline);
  return deadline !== null && deadline < getTodayInMexicoCity();
}

/**
 * Resultado de la regla de detalle público.
 *
 * - `not_found`: DRAFT / PENDING_REVIEW (o estado desconocido) → 404
 * - `abierta`: ACTIVE vigente
 * - `cerrada`: CLOSED o vencida → 200 con aviso
 */
export function estadoDetallePublico(
  scholarship: BecaParaDetalle,
): "not_found" | "abierta" | "cerrada" {
  if (!esVisibleEnDetalle(scholarship)) {
    return "not_found";
  }
  return esCerrada(scholarship) ? "cerrada" : "abierta";
}
