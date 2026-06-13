import { NextResponse, type NextRequest } from "next/server";
import { isAdminSessionRequest } from "@/lib/admin-auth";

/**
 * TODO: reemplazar por autenticación real (NextAuth).
 *
 * Gate provisional para el panel `/admin` y sus endpoints de datos
 * (`/api/admin/becas/*`). Las páginas sin sesión válida se redirigen a
 * `/admin/login`; los endpoints de API responden 401 JSON.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (isAdminSessionRequest(request)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/becas/:path*"],
};
