import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkUrlHealth } from "@/lib/validation/url-health";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Re-verifica el `applyUrl` de una beca. Si está caído y la beca estaba
 * `ACTIVE`, la archiva automáticamente (-> `DRAFT`) para cumplir el
 * invariante de "no ACTIVE sin link vivo".
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const existing = await db.scholarship.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  const health = await checkUrlHealth(existing.applyUrl);

  let archived = false;
  if (!health.valid && existing.status === "ACTIVE") {
    await db.scholarship.update({
      where: { id },
      data: { status: "DRAFT" },
    });
    archived = true;
  }

  return NextResponse.json({ data: { health, archived } });
}
