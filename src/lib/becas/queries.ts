import { unstable_cache } from "next/cache";
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
 * Catalogo completo por defecto. Si no llega `status`, no se filtra por estado.
 */
export async function getBecas(
  query: BecasQuery,
  options?: { sort?: SortOrder },
) {
  const where: Prisma.ScholarshipWhereInput = {};
  if (query.status) {
    where.status = query.status;
  }

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
    where: { isFeatured: true },
    orderBy: LIST_ORDER_BY.deadline,
    include: LIST_INCLUDE,
  });

  return scholarships.map(flattenCategories);
}

export type BecaListItem = Awaited<ReturnType<typeof getBecas>>["data"][number];
export type BecaDetail = NonNullable<Awaited<ReturnType<typeof getBecaBySlug>>>;

/** Categorías para los selectores del panel de filtros, agrupadas por eje. */
export const getFilterCategories = unstable_cache(
  async () => {
    const categories = await db.category.findMany({
      orderBy: { name: "asc" },
    });
    return {
      type: categories.filter((c) => c.axis === "TYPE"),
      area: categories.filter((c) => c.axis === "AREA"),
    };
  },
  ["filter-categories"],
  { revalidate: 3600 },
);

/** Paises de destino distintos entre todas las becas, para el filtro de pais. */
export const getFilterCountries = unstable_cache(
  async () => {
    const rows = await db.scholarship.findMany({
      select: { countryDestination: true },
      distinct: ["countryDestination"],
      orderBy: { countryDestination: "asc" },
    });
    return rows.map((r) => r.countryDestination).filter(Boolean);
  },
  ["filter-countries-all"],
  { revalidate: 600 },
);

/** Metricas reales para los chips de la landing y el dashboard. */
export async function getLandingStats() {
  const [totalCount, activeCount, countries, verifiedCount] = await Promise.all(
    [
      db.scholarship.count(),
      db.scholarship.count({ where: { status: "ACTIVE" } }),
      db.scholarship.findMany({
        select: { countryDestination: true },
        distinct: ["countryDestination"],
      }),
      db.scholarship.count({ where: { isVerified: true } }),
    ],
  );

  return {
    totalCount,
    activeCount,
    countriesCount: countries.length,
    verifiedPercentage:
      totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0,
  };
}
