import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";

const loginSchema = z.object({ password: z.string().min(1) });

/**
 * TODO: reemplazar por autenticación real (NextAuth).
 *
 * Login provisional del panel `/admin`: compara `password` contra
 * `ADMIN_PASSWORD` y, si coincide, fija una cookie httpOnly cuyo valor es la
 * misma contraseña (ver `isAdminSessionRequest`).
 */
export async function POST(request: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD no está configurada" },
      { status: 503 },
    );
  }

  const json = await request.json().catch(() => ({}));
  const parsed = loginSchema.safeParse(json);
  if (!parsed.success || parsed.data.password !== expected) {
    return NextResponse.json(
      { error: "Contraseña incorrecta" },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, expected, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
