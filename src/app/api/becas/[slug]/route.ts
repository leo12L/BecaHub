import { NextResponse } from "next/server";
import { getBecaBySlug } from "@/lib/becas/queries";
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

  const data = await getBecaBySlug(slug);

  if (!data) {
    return NextResponse.json({ error: "Beca no encontrada" }, { status: 404 });
  }

  await setCached(cacheKey, data, DETAIL_CACHE_TTL);

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": `public, s-maxage=${DETAIL_CACHE_TTL}, stale-while-revalidate=60`,
    },
  });
}
