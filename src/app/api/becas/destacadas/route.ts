import { NextResponse } from "next/server";
import { getFeaturedBecas } from "@/lib/becas/queries";
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

  const data = await getFeaturedBecas();

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
