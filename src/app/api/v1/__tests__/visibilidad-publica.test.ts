/**
 * Favoritos y postulaciones: el filtro público aplica al CREAR.
 * Al LISTAR, una beca que después se cierra sigue en el tablero.
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { componentsToMexicoMidnight } from "@/lib/fechas";
import {
  GET as GET_FAVORITOS,
  POST as POST_FAVORITOS,
} from "@/app/api/v1/favoritos/route";
import {
  GET as GET_POSTULACIONES,
  POST as POST_POSTULACIONES,
} from "@/app/api/v1/postulaciones/route";
import { getBecaBySlug } from "@/lib/becas/queries";
import { estadoDetallePublico } from "@/lib/becas/publica";
import type { User } from "@/generated/prisma/client";

const USER_ID = "test-user-visibilidad-fav";
const SOURCE_ID = "test-source-visibilidad-fav";
const PENDING_ID = "test-beca-vis-fav-pending";
const ACTIVE_ID = "test-beca-vis-fav-active";
const ACTIVE_SLUG = "test-beca-vis-fav-active";

vi.mock("@/lib/supabase/server", () => ({
  requireUser: vi.fn(),
  getCurrentUser: vi.fn(),
  getSupabaseServerClient: vi.fn(),
}));

describe("Favoritos y postulaciones — visibilidad al crear vs al listar", () => {
  let testUser: User;

  beforeAll(async () => {
    testUser = await db.user.upsert({
      where: { id: USER_ID },
      create: {
        id: USER_ID,
        email: "visibilidad-fav@test.com",
        role: "USER",
      },
      update: {},
    });

    await db.source.upsert({
      where: { id: SOURCE_ID },
      create: {
        id: SOURCE_ID,
        name: "Fuente visibilidad fav",
        url: "https://example.com/vis-fav",
        type: "MANUAL",
      },
      update: {},
    });

    const futureDate = componentsToMexicoMidnight(2027, 12, 31);

    await db.scholarship.upsert({
      where: { id: PENDING_ID },
      create: {
        id: PENDING_ID,
        title: "PENDING favoritos",
        slug: "test-beca-vis-fav-pending",
        description: "No se puede guardar",
        status: "PENDING_REVIEW",
        coverageType: "MONETARY",
        countryDestination: "México",
        academicLevel: "UNDERGRAD",
        applyUrl: "https://example.com/vis-fav-pending",
        sourceId: SOURCE_ID,
        deadline: futureDate,
      },
      update: { status: "PENDING_REVIEW", deadline: futureDate },
    });

    await db.scholarship.upsert({
      where: { id: ACTIVE_ID },
      create: {
        id: ACTIVE_ID,
        title: "ACTIVE favoritos",
        slug: ACTIVE_SLUG,
        description: "Se puede guardar y luego cerrar",
        status: "ACTIVE",
        coverageType: "MONETARY",
        countryDestination: "México",
        academicLevel: "UNDERGRAD",
        applyUrl: "https://example.com/vis-fav-active",
        sourceId: SOURCE_ID,
        deadline: futureDate,
      },
      update: { status: "ACTIVE", deadline: futureDate },
    });
  });

  afterAll(async () => {
    await db.favorite.deleteMany({ where: { userId: USER_ID } });
    await db.application.deleteMany({ where: { userId: USER_ID } });
    await db.scholarship.deleteMany({
      where: { id: { in: [PENDING_ID, ACTIVE_ID] } },
    });
    await db.source.deleteMany({ where: { id: SOURCE_ID } });
    await db.user.deleteMany({ where: { id: USER_ID } });
  });

  beforeEach(async () => {
    await db.favorite.deleteMany({ where: { userId: USER_ID } });
    await db.application.deleteMany({ where: { userId: USER_ID } });
    await db.scholarship.update({
      where: { id: ACTIVE_ID },
      data: { status: "ACTIVE" },
    });

    const { requireUser } = await import("@/lib/supabase/server");
    vi.mocked(requireUser).mockResolvedValue(testUser);
  });

  it("POST favorito con id PENDING_REVIEW da 404 y no guarda nada", async () => {
    const request = new NextRequest("http://localhost/api/v1/favoritos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scholarshipId: PENDING_ID }),
    });

    const response = await POST_FAVORITOS(request);
    expect(response.status).toBe(404);

    const saved = await db.favorite.findUnique({
      where: {
        userId_scholarshipId: {
          userId: USER_ID,
          scholarshipId: PENDING_ID,
        },
      },
    });
    expect(saved).toBeNull();
  });

  it("POST postulación con id PENDING_REVIEW da 404 y no guarda nada", async () => {
    const request = new NextRequest("http://localhost/api/v1/postulaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scholarshipId: PENDING_ID,
        status: "INTERESTED",
      }),
    });

    const response = await POST_POSTULACIONES(request);
    expect(response.status).toBe(404);

    const saved = await db.application.findUnique({
      where: {
        userId_scholarshipId: {
          userId: USER_ID,
          scholarshipId: PENDING_ID,
        },
      },
    });
    expect(saved).toBeNull();
  });

  it("una ACTIVE guardada que pasa a CLOSED sigue en el tablero y su detalle abre", async () => {
    const favReq = new NextRequest("http://localhost/api/v1/favoritos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scholarshipId: ACTIVE_ID }),
    });
    expect((await POST_FAVORITOS(favReq)).status).toBe(201);

    const postReq = new NextRequest("http://localhost/api/v1/postulaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scholarshipId: ACTIVE_ID,
        status: "INTERESTED",
      }),
    });
    expect((await POST_POSTULACIONES(postReq)).status).toBe(201);

    await db.scholarship.update({
      where: { id: ACTIVE_ID },
      data: { status: "CLOSED" },
    });

    const favList = await GET_FAVORITOS();
    expect(favList.status).toBe(200);
    const favBody = await favList.json();
    const fav = favBody.favorites.find(
      (f: { scholarshipId: string }) => f.scholarshipId === ACTIVE_ID,
    );
    expect(fav).toBeDefined();
    expect(fav.scholarship.status).toBe("CLOSED");

    const postList = await GET_POSTULACIONES();
    expect(postList.status).toBe(200);
    const postBody = await postList.json();
    const application = postBody.applications.find(
      (a: { scholarshipId: string }) => a.scholarshipId === ACTIVE_ID,
    );
    expect(application).toBeDefined();
    expect(application.scholarship.status).toBe("CLOSED");

    const detalle = await getBecaBySlug(ACTIVE_SLUG);
    expect(detalle).not.toBeNull();
    expect(estadoDetallePublico(detalle!)).toBe("cerrada");
  });
});
