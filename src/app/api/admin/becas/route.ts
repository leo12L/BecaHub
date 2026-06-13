import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import { slugify } from "@/scrapers/normalize";
import { assertCanPublish } from "@/lib/becas/admin";
import { adminBecaInputSchema } from "@/validators/admin-becas.validator";
import type { CoverageType, AcademicLevel } from "@/generated/prisma/enums";

/** Resuelve colisiones de slug agregando un sufijo numérico. */
async function resolveSlug(base: string): Promise<string> {
  let slug = base;
  let suffix = 1;
  while (await db.scholarship.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

/** Lista de becas para el panel "Gestionar becas", con filtro opcional por estado. */
export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");

  const where =
    status && ["ACTIVE", "DRAFT", "PENDING_REVIEW", "CLOSED"].includes(status)
      ? { status: status as "ACTIVE" | "DRAFT" | "PENDING_REVIEW" | "CLOSED" }
      : {};

  const scholarships = await db.scholarship.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }],
    include: {
      source: { select: { id: true, name: true } },
      categories: { include: { category: true } },
    },
  });

  return NextResponse.json({ data: scholarships });
}

/** Crea una beca desde el panel de admin. */
export async function POST(request: NextRequest) {
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

  const slug = await resolveSlug(slugify(body.title));

  const scholarship = await db.scholarship.create({
    data: {
      title: body.title,
      slug,
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
      isVerified: body.status === "ACTIVE",
      scrapedAt: null,
      categories: {
        create: body.categoryIds.map((categoryId) => ({ categoryId })),
      },
    },
    include: { categories: { include: { category: true } } },
  });

  return NextResponse.json({ data: scholarship }, { status: 201 });
}
