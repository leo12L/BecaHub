import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import type { Role } from "@/generated/prisma/enums";
import type { BecasQuery } from "@/validators/becas.validator";
import {
  filtroBecaDetallePublico,
  filtroBecaPublica,
  puedePedirEstadoNoPublico,
} from "@/lib/becas/publica";

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

export type GetBecasOptions = {
  sort?: SortOrder;
  /** Solo ADMIN y MODERATOR pueden pedir un status distinto de ACTIVE. */
  viewerRole?: Role;
};

/**
 * Catálogo de becas. Por defecto (y para cualquier caller que no sea
 * admin/moderador) aplica `filtroBecaPublica()`: ACTIVE y no vencida.
 */
export async function getBecas(query: BecasQuery, options?: GetBecasOptions) {
  const where: Prisma.ScholarshipWhereInput =
    puedePedirEstadoNoPublico(options?.viewerRole) &&
    query.status &&
    query.status !== "ACTIVE"
      ? { status: query.status }
      : { ...filtroBecaPublica() };

  if (query.country) {
    where.destinationCountries = {
      has: query.country,
    };
  }

  if (query.level) {
    where.academicLevel = query.level;
  }

  if (query.deadlineBefore) {
    where.deadline = { lte: query.deadlineBefore };
  }

  // Búsqueda de texto - usa la extensión unaccent de Postgres para ignorar acentos
  // unaccent(campo) ILIKE unaccent('%término%') permite buscar "mexico" y encontrar "México"
  if (query.search) {
    const searchTerm = query.search.trim();
    // Escapar % y _ para que no actúen como comodines
    const escapedTerm = searchTerm.replace(/[%_]/g, "\\$&");
    // Buscar IDs que coincidan con el término (con unaccent para ignorar acentos)
    const matchingIds = await db.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Scholarship" 
      WHERE unaccent(LOWER(title)) LIKE unaccent(LOWER(${"%" + escapedTerm + "%"}))
         OR unaccent(LOWER(description)) LIKE unaccent(LOWER(${"%" + escapedTerm + "%"}))
    `;

    // Si no hay coincidencias, retornar vacío
    if (matchingIds.length === 0) {
      return {
        data: [],
        pagination: {
          page: query.page,
          limit: query.limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    // Filtrar por los IDs que coinciden
    where.id = { in: matchingIds.map((r) => r.id) };
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
  const scholarship = await db.scholarship.findFirst({
    where: { slug, ...filtroBecaDetallePublico() },
    include: DETAIL_INCLUDE,
  });

  if (!scholarship) {
    return null;
  }

  return flattenCategories(scholarship);
}

export async function getFeaturedBecas() {
  const scholarships = await db.scholarship.findMany({
    where: {
      ...filtroBecaPublica(),
      isFeatured: true,
    },
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

/** Países de destino distintos entre las becas públicas (sin caché). */
export async function fetchPublicCountries(): Promise<string[]> {
  const rows = await db.scholarship.findMany({
    where: filtroBecaPublica(),
    select: { destinationCountries: true },
  });
  const allCountries = rows.flatMap((r) => r.destinationCountries);
  return [...new Set(allCountries)].sort();
}

/** Países de destino para el filtro de país. En tests no se cachea. */
export const getFilterCountries =
  process.env.VITEST || process.env.NODE_ENV === "test"
    ? fetchPublicCountries
    : unstable_cache(fetchPublicCountries, ["filter-countries-all"], {
        revalidate: 600,
      });

/** Métricas reales para los chips de la landing y el dashboard. */
export async function getLandingStats() {
  const filtroPublico = filtroBecaPublica();

  const [totalCount, countryDestinations, verifiedCount] = await Promise.all([
    db.scholarship.count({ where: filtroPublico }),
    fetchPublicCountries(),
    db.scholarship.count({ where: { ...filtroPublico, isVerified: true } }),
  ]);

  return {
    totalCount,
    activeCount: totalCount,
    countriesCount: countryDestinations.length,
    countryDestinations,
    verifiedPercentage:
      totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0,
  };
}
