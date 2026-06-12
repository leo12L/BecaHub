import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { getCached, setCached } from "@/lib/cache";
import { checkRateLimit } from "@/lib/rate-limit";
import { becasQuerySchema } from "@/validators/becas.validator";

const LIST_CACHE_TTL = 300; // 5 minutos

function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ?? "anonymous";
}

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const rateLimit = await checkRateLimit(identifier);

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta de nuevo más tarde." },
      { status: 429 },
    );
  }

  let query;
  try {
    query = becasQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Parámetros de búsqueda inválidos", details: error.issues },
        { status: 400 },
      );
    }
    throw error;
  }

  const cacheKey = `becas:list:${JSON.stringify(query)}`;
  const cached = await getCached<unknown>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        "Cache-Control": `public, s-maxage=${LIST_CACHE_TTL}, stale-while-revalidate=60`,
      },
    });
  }

  const where: Prisma.ScholarshipWhereInput = {
    status: query.status ?? "ACTIVE",
  };

  if (query.country) {
    where.countryDestination = { contains: query.country, mode: "insensitive" };
  }

  if (query.level) {
    where.academicLevel = query.level;
  }

  if (query.deadlineBefore) {
    where.deadline = { lte: query.deadlineBefore };
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const categoryFilters: Prisma.ScholarshipCategoryWhereInput[] = [];
  if (query.type) {
    categoryFilters.push({ category: { slug: query.type, axis: "TYPE" } });
  }
  if (query.area) {
    categoryFilters.push({ category: { slug: query.area, axis: "AREA" } });
  }
  if (categoryFilters.length > 0) {
    where.AND = categoryFilters.map((filter) => ({
      categories: { some: filter },
    }));
  }

  const skip = (query.page - 1) * query.limit;

  const [scholarships, total] = await Promise.all([
    db.scholarship.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: [
        { deadline: { sort: "asc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      include: {
        source: { select: { id: true, name: true, type: true } },
        categories: { include: { category: true } },
      },
    }),
    db.scholarship.count({ where }),
  ]);

  const data = scholarships.map((scholarship) => {
    const { categories, ...rest } = scholarship;
    return {
      ...rest,
      categories: categories.map((sc) => sc.category),
    };
  });

  const response = {
    data,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };

  await setCached(cacheKey, response, LIST_CACHE_TTL);

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": `public, s-maxage=${LIST_CACHE_TTL}, stale-while-revalidate=60`,
    },
  });
}
