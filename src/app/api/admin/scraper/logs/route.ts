import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import { isAdminScraperRequest } from "@/lib/admin-auth";
import { scraperLogsQuerySchema } from "@/validators/scraper.validator";

export async function GET(request: NextRequest) {
  if (!isAdminScraperRequest(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let query;
  try {
    query = scraperLogsQuerySchema.parse(
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

  const skip = (query.page - 1) * query.limit;

  const [logs, total] = await Promise.all([
    db.scraperLog.findMany({
      skip,
      take: query.limit,
      orderBy: { startedAt: "desc" },
      include: { source: { select: { id: true, name: true } } },
    }),
    db.scraperLog.count(),
  ]);

  return NextResponse.json({
    data: logs,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  });
}
