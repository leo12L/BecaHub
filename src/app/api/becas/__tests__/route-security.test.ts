/**
 * Seguridad de GET /api/becas y GET /api/becas/[slug].
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { GET as GET_LIST } from "../route";
import { GET as GET_SLUG } from "../[slug]/route";
import { db } from "@/lib/db";
import { componentsToMexicoMidnight } from "@/lib/fechas";
import {
  AVISO_CONVOCATORIA_CERRADA,
  estadoDetallePublico,
} from "@/lib/becas/publica";

const SOURCE_ID = "test-source-api-becas-security";
const PENDING_ID = "test-beca-api-sec-pending";
const DRAFT_ID = "test-beca-api-sec-draft";
const CLOSED_ID = "test-beca-api-sec-closed";
const VENCIDA_ID = "test-beca-api-sec-vencida";
const ACTIVE_ID = "test-beca-api-sec-active";

const PENDING_SLUG = "test-beca-api-sec-pending";
const DRAFT_SLUG = "test-beca-api-sec-draft";
const CLOSED_SLUG = "test-beca-api-sec-closed";
const VENCIDA_SLUG = "test-beca-api-sec-vencida";
const ACTIVE_SLUG = "test-beca-api-sec-active";

function createListRequest(
  searchParams: Record<string, string> = {},
): NextRequest {
  const url = new URL("http://localhost:3000/api/becas");
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new NextRequest(url);
}

describe("GET /api/becas — status público", () => {
  it("rechaza status=DRAFT con 400", async () => {
    const response = await GET_LIST(createListRequest({ status: "DRAFT" }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/activas/i);
  });

  it("rechaza status=PENDING_REVIEW con 400", async () => {
    const response = await GET_LIST(
      createListRequest({ status: "PENDING_REVIEW" }),
    );
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/activas/i);
  });

  it("rechaza status=CLOSED con 400", async () => {
    const response = await GET_LIST(createListRequest({ status: "CLOSED" }));
    expect(response.status).toBe(400);
  });

  it("rechaza status inválido con 400", async () => {
    const response = await GET_LIST(createListRequest({ status: "INVALID" }));
    expect(response.status).toBe(400);
  });
});

describe("GET /api/becas y /api/becas/[slug] con BD", () => {
  beforeAll(async () => {
    await db.source.upsert({
      where: { id: SOURCE_ID },
      create: {
        id: SOURCE_ID,
        name: "Fuente API security",
        url: "https://example.com/api-sec",
        type: "MANUAL",
      },
      update: {},
    });

    const futureDate = componentsToMexicoMidnight(2027, 12, 31);
    const pastDate = componentsToMexicoMidnight(2020, 1, 1);

    await db.scholarship.upsert({
      where: { id: ACTIVE_ID },
      create: {
        id: ACTIVE_ID,
        title: "ACTIVE api sec",
        slug: ACTIVE_SLUG,
        description: "Pública",
        status: "ACTIVE",
        coverageType: "MONETARY",
        countryDestination: "México",
        academicLevel: "UNDERGRAD",
        applyUrl: "https://example.com/api-sec-active",
        sourceId: SOURCE_ID,
        deadline: futureDate,
      },
      update: { status: "ACTIVE", deadline: futureDate },
    });

    await db.scholarship.upsert({
      where: { id: PENDING_ID },
      create: {
        id: PENDING_ID,
        title: "PENDING api sec",
        slug: PENDING_SLUG,
        description: "No pública",
        status: "PENDING_REVIEW",
        coverageType: "MONETARY",
        countryDestination: "México",
        academicLevel: "UNDERGRAD",
        applyUrl: "https://example.com/api-sec-pending",
        sourceId: SOURCE_ID,
        deadline: futureDate,
      },
      update: { status: "PENDING_REVIEW", deadline: futureDate },
    });

    await db.scholarship.upsert({
      where: { id: DRAFT_ID },
      create: {
        id: DRAFT_ID,
        title: "DRAFT api sec",
        slug: DRAFT_SLUG,
        description: "No pública",
        status: "DRAFT",
        coverageType: "MONETARY",
        countryDestination: "México",
        academicLevel: "UNDERGRAD",
        applyUrl: "https://example.com/api-sec-draft",
        sourceId: SOURCE_ID,
        deadline: futureDate,
      },
      update: { status: "DRAFT", deadline: futureDate },
    });

    await db.scholarship.upsert({
      where: { id: CLOSED_ID },
      create: {
        id: CLOSED_ID,
        title: "CLOSED api sec",
        slug: CLOSED_SLUG,
        description: "Cerrada",
        status: "CLOSED",
        coverageType: "MONETARY",
        countryDestination: "México",
        academicLevel: "UNDERGRAD",
        applyUrl: "https://example.com/api-sec-closed",
        sourceId: SOURCE_ID,
        deadline: futureDate,
      },
      update: { status: "CLOSED", deadline: futureDate },
    });

    await db.scholarship.upsert({
      where: { id: VENCIDA_ID },
      create: {
        id: VENCIDA_ID,
        title: "Vencida api sec",
        slug: VENCIDA_SLUG,
        description: "Vencida",
        status: "ACTIVE",
        coverageType: "MONETARY",
        countryDestination: "México",
        academicLevel: "UNDERGRAD",
        applyUrl: "https://example.com/api-sec-vencida",
        sourceId: SOURCE_ID,
        deadline: pastDate,
      },
      update: { status: "ACTIVE", deadline: pastDate },
    });
  });

  afterAll(async () => {
    await db.scholarship.deleteMany({
      where: {
        id: { in: [ACTIVE_ID, PENDING_ID, DRAFT_ID, CLOSED_ID, VENCIDA_ID] },
      },
    });
    await db.source.deleteMany({ where: { id: SOURCE_ID } });
  });

  it("GET /api/becas sin status no incluye PENDING_REVIEW (falla si se quita ACTIVE)", async () => {
    const response = await GET_LIST(createListRequest({ limit: "100" }));
    expect(response.status).toBe(200);
    const body = await response.json();
    const ids = body.data.map((b: { id: string }) => b.id);

    expect(ids).toContain(ACTIVE_ID);
    expect(ids).not.toContain(PENDING_ID);
    expect(ids).not.toContain(DRAFT_ID);
    expect(ids).not.toContain(CLOSED_ID);
    expect(ids).not.toContain(VENCIDA_ID);
  });

  it("GET /api/becas/[slug] da 404 para DRAFT y PENDING_REVIEW", async () => {
    const draft = await GET_SLUG(new Request("http://localhost/api/becas/x"), {
      params: Promise.resolve({ slug: DRAFT_SLUG }),
    });
    const pending = await GET_SLUG(
      new Request("http://localhost/api/becas/x"),
      {
        params: Promise.resolve({ slug: PENDING_SLUG }),
      },
    );

    expect(draft.status).toBe(404);
    expect(pending.status).toBe(404);
  });

  it("GET /api/becas/[slug] da 200 para CLOSED y vencida (aviso en la regla de detalle)", async () => {
    const closed = await GET_SLUG(new Request("http://localhost/api/becas/x"), {
      params: Promise.resolve({ slug: CLOSED_SLUG }),
    });
    const vencida = await GET_SLUG(
      new Request("http://localhost/api/becas/x"),
      {
        params: Promise.resolve({ slug: VENCIDA_SLUG }),
      },
    );

    expect(closed.status).toBe(200);
    expect(vencida.status).toBe(200);

    const closedBody = await closed.json();
    const vencidaBody = await vencida.json();
    expect(estadoDetallePublico(closedBody)).toBe("cerrada");
    expect(estadoDetallePublico(vencidaBody)).toBe("cerrada");
    expect(AVISO_CONVOCATORIA_CERRADA.length).toBeGreaterThan(0);
  });
});
