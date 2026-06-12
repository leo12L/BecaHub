import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCached, setCached } from "@/lib/cache";

const DETAIL_CACHE_TTL = 3600; // 1 hora

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const cacheKey = `becas:detail:${slug}`;
  const cached = await getCached<unknown>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        "Cache-Control": `public, s-maxage=${DETAIL_CACHE_TTL}, stale-while-revalidate=60`,
      },
    });
  }

  const scholarship = await db.scholarship.findUnique({
    where: { slug },
    include: {
      source: { select: { id: true, name: true, url: true, type: true } },
      categories: { include: { category: true } },
    },
  });

  if (!scholarship) {
    return NextResponse.json({ error: "Beca no encontrada" }, { status: 404 });
  }

  const { categories, ...rest } = scholarship;
  const data = {
    ...rest,
    categories: categories.map((sc) => sc.category),
  };

  await setCached(cacheKey, data, DETAIL_CACHE_TTL);

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": `public, s-maxage=${DETAIL_CACHE_TTL}, stale-while-revalidate=60`,
    },
  });
}
