import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import { assertCanPublish } from "@/lib/becas/admin";
import {
  adminBecaInputSchema,
  adminBecaPatchSchema,
} from "@/validators/admin-becas.validator";
import type { CoverageType, AcademicLevel } from "@/generated/prisma/enums";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const scholarship = await db.scholarship.findUnique({
    where: { id },
    include: {
      source: { select: { id: true, name: true } },
      categories: { include: { category: true } },
    },
  });

  if (!scholarship) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  return NextResponse.json({ data: scholarship });
}

/** Edita una beca existente (no cambia `slug`). */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const existing = await db.scholarship.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  let body;
  try {
    const json = await request.json().catch(() => ({}));
    body = adminBecaInputSchema.parse(json);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Cuerpo inválido", details: error.issues },
        { status: 400 },
      );
    }
    throw error;
  }

  let deadline: Date | null = null;
  if (body.deadline) {
    deadline = new Date(body.deadline);
    if (Number.isNaN(deadline.getTime())) {
      return NextResponse.json({ error: "deadline inválido" }, { status: 400 });
    }
  }

  if (body.status === "ACTIVE") {
    const check = await assertCanPublish({
      countryDestination: body.countryDestination,
      deadline,
      applyUrl: body.applyUrl,
    });
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 422 });
    }
  }

  const source = await db.source.findUnique({ where: { id: body.sourceId } });
  if (!source) {
    return NextResponse.json({ error: "sourceId no existe" }, { status: 400 });
  }

  const scholarship = await db.scholarship.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      status: body.status,
      coverageType: body.coverageType as CoverageType,
      amountMin: body.amountMin ?? null,
      amountMax: body.amountMax ?? null,
      currency: body.currency,
      countryOrigin: body.countryOrigin ?? null,
      countryDestination: body.countryDestination,
      academicLevel: body.academicLevel as AcademicLevel,
      language: body.language ?? null,
      deadline,
      applyUrl: body.applyUrl,
      sourceId: body.sourceId,
      isVerified: body.status === "ACTIVE" ? true : existing.isVerified,
      categories: {
        deleteMany: {},
        create: body.categoryIds.map((categoryId) => ({ categoryId })),
      },
    },
    include: { categories: { include: { category: true } } },
  });

  return NextResponse.json({ data: scholarship });
}

/** Acciones rápidas de estado (p. ej. "archivar" -> DRAFT) desde la tabla de gestión. */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const existing = await db.scholarship.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  let body;
  try {
    const json = await request.json().catch(() => ({}));
    body = adminBecaPatchSchema.parse(json);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Cuerpo inválido", details: error.issues },
        { status: 400 },
      );
    }
    throw error;
  }

  if (body.status === "ACTIVE") {
    const check = await assertCanPublish({
      countryDestination: existing.countryDestination,
      deadline: existing.deadline,
      applyUrl: existing.applyUrl,
    });
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 422 });
    }
  }

  const scholarship = await db.scholarship.update({
    where: { id },
    data: {
      status: body.status,
      isVerified: body.status === "ACTIVE" ? true : existing.isVerified,
    },
  });

  return NextResponse.json({ data: scholarship });
}
