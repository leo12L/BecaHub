/**
 * Reglas de visibilidad pública de becas.
 *
 * Centraliza qué becas ve un usuario público (no admin/moderador) en listados,
 * detalles, favoritos, postulaciones, sitemap, contadores, etc.
 *
 * REGLA PRINCIPAL: Solo becas ACTIVE no vencidas son públicamente visibles en
 * listados. El detalle puede mostrar CLOSED/vencidas con aviso, pero DRAFT y
 * PENDING_REVIEW siempre dan 404.
 */

import type { Prisma } from "@/generated/prisma/client";
import { getTodayInMexicoCity } from "@/lib/fechas";

/**
 * Filtro WHERE de Prisma para becas públicamente visibles en listados.
 *
 * - Estado: ACTIVE únicamente
 * - Vigencia: deadline >= hoy (zona México) o sin deadline
 *
 * Usar en:
 * - Portada
 * - `/becas` (listado)
 * - Dashboard (recomendaciones, próximas)
 * - `/api/becas` (API pública)
 * - Sitemap
 * - Contadores de la portada
 * - Validación al CREAR favoritos o postulaciones
 *
 * @example
 * ```ts
 * await db.scholarship.findMany({
 *   where: filtroBecaPublica(),
 *   // ... resto de filtros
 * });
 * ```
 */
export function filtroBecaPublica(): Prisma.ScholarshipWhereInput {
  const todayMexico = getTodayInMexicoCity();

  return {
    status: "ACTIVE",
    OR: [{ deadline: { gte: todayMexico } }, { deadline: null }],
  };
}

/**
 * Verifica si una beca es visible en su página de detalle `/becas/[slug]`.
 *
 * - ACTIVE: siempre visible
 * - CLOSED o vencida: visible con aviso de "convocatoria cerrada"
 * - DRAFT o PENDING_REVIEW: no visible (debe devolver 404)
 *
 * @param scholarship - La beca a verificar (debe incluir `status` y `deadline`)
 * @returns `true` si debe mostrarse (aunque sea con aviso), `false` si debe dar 404
 *
 * @example
 * ```ts
 * const beca = await getBecaBySlug(slug);
 * if (!beca || !esVisibleEnDetalle(beca)) {
 *   return notFound();
 * }
 * ```
 */
export function esVisibleEnDetalle(scholarship: {
  status: string;
  deadline: Date | null;
}): boolean {
  // DRAFT y PENDING_REVIEW nunca son visibles
  if (
    scholarship.status === "DRAFT" ||
    scholarship.status === "PENDING_REVIEW"
  ) {
    return false;
  }

  // ACTIVE y CLOSED son visibles (aunque CLOSED/vencidas mostrarán aviso)
  return scholarship.status === "ACTIVE" || scholarship.status === "CLOSED";
}

/**
 * Determina si una beca debe mostrar aviso de "convocatoria cerrada" en su detalle.
 *
 * @param scholarship - La beca a verificar
 * @returns `true` si debe mostrarse el aviso de cierre
 *
 * @example
 * ```ts
 * {esCerrada(beca) && (
 *   <Alert variant="warning">
 *     Esta convocatoria ha cerrado
 *   </Alert>
 * )}
 * ```
 */
export function esCerrada(scholarship: {
  status: string;
  deadline: Date | null;
}): boolean {
  const todayMexico = getTodayInMexicoCity();

  return (
    scholarship.status === "CLOSED" ||
    (scholarship.deadline !== null && scholarship.deadline < todayMexico)
  );
}
