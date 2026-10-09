import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { ApplicationStatus } from "@/generated/prisma/client";

/**
 * GET /api/postulaciones - Listar postulaciones del usuario autenticado
 */
export async function GET() {
  try {
    const user = await requireUser();

    const applications = await db.application.findMany({
      where: { userId: user.id },
      include: {
        scholarship: {
          include: {
            source: { select: { id: true, name: true, type: true } },
            categories: { include: { category: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if ((error as Error & { code?: string }).code === "EMAIL_NOT_CONFIRMED") {
        return NextResponse.json(
          { error: error.message },
          { status: 403 },
        );
      }
    }
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/postulaciones - Crear o actualizar una postulación
 * Body: { scholarshipId: string, status: ApplicationStatus, notes?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { scholarshipId, status, notes } = body;

    if (!scholarshipId) {
      return NextResponse.json(
        { error: "scholarshipId es requerido" },
        { status: 400 },
      );
    }

    // Validar status
    const validStatuses: ApplicationStatus[] = [
      "INTERESTED",
      "APPLIED",
      "INTERVIEW",
      "AWARDED",
      "REJECTED",
    ];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "status inválido" },
        { status: 400 },
      );
    }

    // Verificar que la beca existe
    const scholarship = await db.scholarship.findUnique({
      where: { id: scholarshipId },
    });

    if (!scholarship) {
      return NextResponse.json(
        { error: "Beca no encontrada" },
        { status: 404 },
      );
    }

    // Crear o actualizar postulación
    const application = await db.application.upsert({
      where: {
        userId_scholarshipId: {
          userId: user.id,
          scholarshipId,
        },
      },
      update: {
        status: status || undefined,
        notes: notes !== undefined ? notes : undefined,
        appliedAt: status === "APPLIED" ? new Date() : undefined,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        scholarshipId,
        status: status || "INTERESTED",
        notes: notes || null,
        appliedAt: status === "APPLIED" ? new Date() : null,
      },
      include: {
        scholarship: true,
      },
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if ((error as Error & { code?: string }).code === "EMAIL_NOT_CONFIRMED") {
        return NextResponse.json(
          { error: error.message },
          { status: 403 },
        );
      }
    }
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
