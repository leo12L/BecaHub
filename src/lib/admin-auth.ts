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
