import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import type { AcademicLevel, CoverageType } from "@/generated/prisma/enums";
import { savePerfilSchema } from "@/validators/profile.validator";

/**
 * Guarda (crea o actualiza) el perfil del estudiante.
 *
 * TODO: `userId` viene en el body como mecanismo interino mientras no hay
 * autenticación real (NextAuth). Cuando esté lista, este endpoint debe leer
 * el usuario de la sesión y dejar de aceptar `userId` por body.
 */
export async function POST(request: NextRequest) {
  let body;
  try {
    const json = await request.json().catch(() => ({}));
    body = savePerfilSchema.parse(json);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Cuerpo inválido", details: error.issues },
        { status: 400 },
      );
    }
    throw error;
  }

  const user = await db.user.findUnique({ where: { id: body.userId } });
  if (!user) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 },
    );
  }

  const { profile } = body;
  const data = {
    academicLevel: profile.academicLevel as AcademicLevel | null,
    fieldOfInterest: profile.fieldOfInterest,
    countryOrigin: profile.countryOrigin,
    countryInterest: profile.countryInterest,
    scholarshipTypes: profile.scholarshipTypes as CoverageType[],
    language: profile.language,
    situation: profile.situation,
    goals: profile.goals,
  };

  const saved = await db.profile.upsert({
    where: { userId: body.userId },
    update: data,
    create: { userId: body.userId, ...data },
  });

  return NextResponse.json({ profile: saved });
}
