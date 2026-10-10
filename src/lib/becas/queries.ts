import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import type { BecasQuery } from "@/validators/becas.validator";
import { getTodayInMexicoCity } from "@/lib/fechas";
import { filtroBecaPublica } from "@/lib/becas/publica";

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
 * Catálogo de becas con filtrado automático de vencidas.
 *
 * Por defecto, muestra solo becas ACTIVE no vencidas (seguridad: evita exponer
 * DRAFT/PENDING_REVIEW). Otros estados solo son accesibles si se especifica
 * explícitamente `query.status` (reservado para admin/moderador).
 */
export async function getBecas(
  query: BecasQuery,
  options?: { sort?: SortOrder },
) {
  const where: Prisma.ScholarshipWhereInput = {};

  // Filtro de status: ACTIVE por defecto (seguridad)
  // Si se especifica explícitamente otro status, se respeta (solo admin/moderador)
  const status = query.status ?? "ACTIVE";
  where.status = status;

  // Ocultar becas vencidas para status ACTIVE (vistas públicas)
  // Para otros estados (admin), se muestran incluso si están vencidas
  if (status === "ACTIVE") {
    const todayMexico = getTodayInMexicoCity();
    where.AND = where.AND || [];
    (where.AND as Prisma.ScholarshipWhereInput[]).push({
      OR: [{ deadline: { gte: todayMexico } }, { deadline: null }],
    });
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

/** Paises de destino distintos entre todas las becas públicas, para el filtro de pais. */
export const getFilterCountries = unstable_cache(
  async () => {
    const rows = await db.scholarship.findMany({
      where: filtroBecaPublica(),
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
  const filtroPublico = filtroBecaPublica();

  const [totalCount, activeCount, countries, verifiedCount] = await Promise.all(
    [
      db.scholarship.count(),
      db.scholarship.count({ where: filtroPublico }),
      db.scholarship.findMany({
        where: filtroPublico,
        select: { countryDestination: true },
        distinct: ["countryDestination"],
      }),
      db.scholarship.count({ where: { ...filtroPublico, isVerified: true } }),
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
