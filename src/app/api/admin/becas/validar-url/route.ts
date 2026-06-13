import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { validarUrlSchema } from "@/validators/admin-becas.validator";
import { checkUrlHealth } from "@/lib/validation/url-health";

/**
 * Verifica que la URL de una convocatoria esté viva (sigue redirecciones,
 * detecta soft-404/contenido vencido). Usado por el panel de admin antes de
 * permitir publicar una beca como `ACTIVE`.
 */
export async function POST(request: NextRequest) {
  let body;
  try {
    const json = await request.json().catch(() => ({}));
    body = validarUrlSchema.parse(json);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Cuerpo inválido", details: error.issues },
        { status: 400 },
      );
    }
    throw error;
  }

  const result = await checkUrlHealth(body.url);
  return NextResponse.json(result);
}
