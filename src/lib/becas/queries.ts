import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import type { BecasQuery } from "@/validators/becas.validator";

const LIST_INCLUDE = {
  source: { select: { id: true, name: true, type: true } },
  categories: { include: { category: true } },
} satisfies Prisma.ScholarshipInclude;

const DETAIL_INCLUDE = {
  source: { select: { id: true, name: true, url: true, type: true } },
  categories: { include: { category: true } },
} satisfies Prisma.ScholarshipInclude;

const LIST_ORDER_BY = {
  deadline: [
    { deadline: { sort: "asc", nulls: "last" } },
    { createdAt: "desc" },
  ],
  recent: [{ createdAt: "desc" }],
} satisfies Record<string, Prisma.ScholarshipOrderByWithRelationInput[]>;

export type SortOrder = keyof typeof LIST_ORDER_BY;

function flattenCategories<T extends { categories: { category: unknown }[] }>(
  scholarship: T,
): Omit<T, "categories"> & {
  categories: T["categories"][number]["category"][];
} {
  const { categories, ...rest } = scholarship;
  return {
    ...rest,
    categories: categories.map((sc) => sc.category),
  } as Omit<T, "categories"> & {
    categories: T["categories"][number]["category"][];
  };
}

/**
 * Becas activas por defecto: el listado público nunca debe exponer
 * DRAFT/PENDING_REVIEW salvo que se pida explícitamente otro status.
 */
export async function getBecas(
  query: BecasQuery,
  options?: { sort?: SortOrder },
) {
  const where: Prisma.ScholarshipWhereInput = {
    status: query.status ?? "ACTIVE",
  };

  if (query.country) {
    where.countryDestination = {
      contains: query.country,
      mode: "insensitive",
    };
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
  const orderBy = LIST_ORDER_BY[options?.sort ?? "deadline"];

  const [scholarships, total] = await Promise.all([
    db.scholarship.findMany({
      where,
      skip,
      take: query.limit,
      orderBy,
      include: LIST_INCLUDE,
    }),
    db.scholarship.count({ where }),
  ]);

  return {
    data: scholarships.map(flattenCategories),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getBecaBySlug(slug: string) {
  const scholarship = await db.scholarship.findUnique({
    where: { slug },
    include: DETAIL_INCLUDE,
  });

  if (!scholarship) {
    return null;
  }

  return flattenCategories(scholarship);
}

export async function getFeaturedBecas() {
  const scholarships = await db.scholarship.findMany({
    where: { isFeatured: true, status: "ACTIVE" },
    orderBy: LIST_ORDER_BY.deadline,
    include: LIST_INCLUDE,
  });

  return scholarships.map(flattenCategories);
}

export type BecaListItem = Awaited<ReturnType<typeof getBecas>>["data"][number];
export type BecaDetail = NonNullable<Awaited<ReturnType<typeof getBecaBySlug>>>;

/** Categorías para los selectores del panel de filtros, agrupadas por eje. */
export async function getFilterCategories() {
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
  });

  return {
    type: categories.filter((c) => c.axis === "TYPE"),
    area: categories.filter((c) => c.axis === "AREA"),
  };
}

/** Países de destino distintos entre becas activas, para el filtro de país. */
export async function getFilterCountries() {
  const rows = await db.scholarship.findMany({
    where: { status: "ACTIVE" },
    select: { countryDestination: true },
    distinct: ["countryDestination"],
    orderBy: { countryDestination: "asc" },
  });

  return rows.map((r) => r.countryDestination);
}
