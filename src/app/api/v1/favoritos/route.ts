import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { filtroBecaPublica } from "@/lib/becas/publica";

/**
 * GET /api/favoritos - Listar favoritos del usuario autenticado
 */
export async function GET() {
  try {
    const user = await requireUser();

    const favorites = await db.favorite.findMany({
      where: { userId: user.id },
      include: {
        scholarship: {
          include: {
            source: { select: { id: true, name: true, type: true } },
            categories: { include: { category: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ favorites });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if ((error as Error & { code?: string }).code === "EMAIL_NOT_CONFIRMED") {
        return NextResponse.json({ error: error.message }, { status: 403 });
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
 * POST /api/favoritos - Agregar una beca a favoritos
 * Body: { scholarshipId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { scholarshipId } = body;

    if (!scholarshipId) {
      return NextResponse.json(
        { error: "scholarshipId es requerido" },
        { status: 400 },
      );
    }

    // Verificar que la beca existe y es públicamente visible
    // (ACTIVE no vencida). No se permite guardar DRAFT/PENDING_REVIEW/CLOSED.
    const scholarship = await db.scholarship.findFirst({
      where: {
        id: scholarshipId,
        ...filtroBecaPublica(),
      },
    });

    if (!scholarship) {
      return NextResponse.json(
        { error: "Beca no encontrada" },
        { status: 404 },
      );
    }

    // Crear favorito (upsert para evitar duplicados)
    const favorite = await db.favorite.upsert({
      where: {
        userId_scholarshipId: {
          userId: user.id,
          scholarshipId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        scholarshipId,
      },
    });

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if ((error as Error & { code?: string }).code === "EMAIL_NOT_CONFIRMED") {
        return NextResponse.json({ error: error.message }, { status: 403 });
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
 * DELETE /api/favoritos - Eliminar una beca de favoritos
 * Body: { scholarshipId: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { scholarshipId } = body;

    if (!scholarshipId) {
      return NextResponse.json(
        { error: "scholarshipId es requerido" },
        { status: 400 },
      );
    }

    // Eliminar favorito (ignora si no existe)
    await db.favorite.deleteMany({
      where: {
        userId: user.id,
        scholarshipId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if ((error as Error & { code?: string }).code === "EMAIL_NOT_CONFIRMED") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
