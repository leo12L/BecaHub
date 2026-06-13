import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getBecas } from "@/lib/becas/queries";
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

  const response = await getBecas(query);

  await setCached(cacheKey, response, LIST_CACHE_TTL);

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": `public, s-maxage=${LIST_CACHE_TTL}, stale-while-revalidate=60`,
    },
  });
}
