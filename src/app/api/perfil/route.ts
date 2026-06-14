import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { AcademicLevel, CoverageType } from "@/generated/prisma/enums";
import { savePerfilSchema } from "@/validators/profile.validator";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

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

  // Session userId takes precedence over body userId
  const userId = session?.user?.id ?? body.userId;
  if (!userId) {
    return NextResponse.json({ error: "Se requiere autenticación" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
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
    where: { userId },
    update: data,
    create: { userId, ...data },
  });

  return NextResponse.json({ profile: saved });
}
