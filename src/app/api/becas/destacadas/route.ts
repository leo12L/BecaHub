import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCached, setCached } from "@/lib/cache";

const FEATURED_CACHE_TTL = 1800; // 30 minutos

export async function GET() {
  const cacheKey = "becas:destacadas";
  const cached = await getCached<unknown>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        "Cache-Control": `public, s-maxage=${FEATURED_CACHE_TTL}, stale-while-revalidate=60`,
      },
    });
  }

  const scholarships = await db.scholarship.findMany({
    where: { isFeatured: true, status: "ACTIVE" },
    orderBy: [
      { deadline: { sort: "asc", nulls: "last" } },
      { createdAt: "desc" },
    ],
    include: {
      source: { select: { id: true, name: true, type: true } },
      categories: { include: { category: true } },
    },
  });

  const data = scholarships.map((scholarship) => {
    const { categories, ...rest } = scholarship;
    return {
      ...rest,
      categories: categories.map((sc) => sc.category),
    };
  });

  await setCached(cacheKey, { data }, FEATURED_CACHE_TTL);

  return NextResponse.json(
    { data },
    {
      headers: {
        "Cache-Control": `public, s-maxage=${FEATURED_CACHE_TTL}, stale-while-revalidate=60`,
      },
    },
  );
}
