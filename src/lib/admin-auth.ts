import type { NextRequest } from "next/server";

/**
 * Verificación provisional para endpoints de admin del scraper: compara el
 * header `x-admin-scraper-token` contra `ADMIN_SCRAPER_TOKEN`. Se migrará a
 * la autenticación real (NextAuth) en una fase posterior.
 */
export function isAdminScraperRequest(request: NextRequest): boolean {
  const expected = process.env.ADMIN_SCRAPER_TOKEN;
  if (!expected) return false;

  const token = request.headers.get("x-admin-scraper-token");
  return token === expected;
}

/**
 * TODO: reemplazar por autenticación real (NextAuth) cuando esté disponible.
 *
 * Nombre de la cookie que guarda la sesión interina del panel `/admin`. Su
 * valor es directamente `ADMIN_PASSWORD` — suficiente como gate provisional
 * de un solo usuario, no para producción multiusuario.
 */
export const ADMIN_SESSION_COOKIE = "becahub_admin_session";

/**
 * TODO: reemplazar por autenticación real (NextAuth).
 *
 * Verifica la cookie de sesión interina del panel `/admin` contra
 * `ADMIN_PASSWORD`. Si `ADMIN_PASSWORD` no está configurada, el panel queda
 * inaccesible (falla cerrado).
 */
export function isAdminSessionRequest(request: NextRequest): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;

  const cookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return cookie === expected;
}
