/**
 * Tests para aislamiento de datos entre usuarios (Fase 3, criterio 3.4)
 * Verifica que el estudiante A no puede leer ni cambiar nada del B
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { GET as getFavorites, DELETE as deleteFavorite } from "../v1/favoritos/route";
import { GET as getApplications, POST as postApplication } from "../v1/postulaciones/route";
import { GET as getProfile } from "../perfil/me/route";
import type { User } from "@/generated/prisma/client";

const USER_A_ID = "test-user-a-isolation";
const USER_B_ID = "test-user-b-isolation";
const TEST_SOURCE_ID = "test-source-isolation";
const SCHOLARSHIP_A_ID = "test-scholarship-a-isolation";
const SCHOLARSHIP_B_ID = "test-scholarship-b-isolation";

// Mock de requireUser
vi.mock("@/lib/supabase/server", () => ({
  requireUser: vi.fn(),
  getCurrentUser: vi.fn(),
  getSupabaseServerClient: vi.fn(),
}));

describe("Aislamiento de datos entre usuarios", () => {
  let userA: User;
  let userB: User;

  beforeAll(async () => {
    // Crear dos usuarios de prueba
    userA = await db.user.upsert({
      where: { id: USER_A_ID },
      create: {
        id: USER_A_ID,
        email: "usera@isolation.test",
        role: "USER",
      },
      update: {},
    });

    userB = await db.user.upsert({
      where: { id: USER_B_ID },
      create: {
        id: USER_B_ID,
        email: "userb@isolation.test",
        role: "USER",
      },
      update: {},
    });

    // Crear fuente de prueba
    await db.source.upsert({
      where: { id: TEST_SOURCE_ID },
      create: {
        id: TEST_SOURCE_ID,
        name: "Fuente Isolation Test",
        url: "https://example.com/isolation",
        type: "MANUAL",
      },
      update: {},
    });

    // Crear dos becas de prueba
    await db.scholarship.upsert({
      where: { id: SCHOLARSHIP_A_ID },
      create: {
        id: SCHOLARSHIP_A_ID,
        title: "Beca A Isolation",
        slug: "beca-a-isolation",
        description: "Beca para usuario A",
        status: "ACTIVE",
        coverageType: "FULL",
        countryDestination: "México",
        academicLevel: "UNDERGRAD",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        applyUrl: "https://example.com/apply-a",
        sourceId: TEST_SOURCE_ID,
        isVerified: true,
      },
      update: {},
    });

    await db.scholarship.upsert({
      where: { id: SCHOLARSHIP_B_ID },
      create: {
        id: SCHOLARSHIP_B_ID,
        title: "Beca B Isolation",
        slug: "beca-b-isolation",
        description: "Beca para usuario B",
        status: "ACTIVE",
        coverageType: "FULL",
        countryDestination: "México",
        academicLevel: "UNDERGRAD",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        applyUrl: "https://example.com/apply-b",
        sourceId: TEST_SOURCE_ID,
        isVerified: true,
      },
      update: {},
    });

    // Crear favorito para usuario A
    await db.favorite.create({
      data: {
        userId: USER_A_ID,
        scholarshipId: SCHOLARSHIP_A_ID,
      },
    });

    // Crear favorito para usuario B
    await db.favorite.create({
      data: {
        userId: USER_B_ID,
        scholarshipId: SCHOLARSHIP_B_ID,
      },
    });

    // Crear postulación para usuario A
    await db.application.create({
      data: {
        userId: USER_A_ID,
        scholarshipId: SCHOLARSHIP_A_ID,
        status: "INTERESTED",
      },
    });

    // Crear postulación para usuario B
    await db.application.create({
      data: {
        userId: USER_B_ID,
        scholarshipId: SCHOLARSHIP_B_ID,
        status: "APPLIED",
      },
    });

    // Crear perfil para usuario A
    await db.profile.create({
      data: {
        userId: USER_A_ID,
        academicLevel: "UNDERGRAD",
        fieldOfInterest: "Ingeniería",
        countryOrigin: "México",
      },
    });

    // Crear perfil para usuario B
    await db.profile.create({
      data: {
        userId: USER_B_ID,
        academicLevel: "GRAD",
        fieldOfInterest: "Medicina",
        countryOrigin: "Colombia",
      },
    });
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await db.favorite.deleteMany({
      where: { userId: { in: [USER_A_ID, USER_B_ID] } },
    });
    await db.application.deleteMany({
      where: { userId: { in: [USER_A_ID, USER_B_ID] } },
    });
    await db.profile.deleteMany({
      where: { userId: { in: [USER_A_ID, USER_B_ID] } },
    });
    await db.scholarship.deleteMany({
      where: { id: { in: [SCHOLARSHIP_A_ID, SCHOLARSHIP_B_ID] } },
    });
    await db.source.deleteMany({ where: { id: TEST_SOURCE_ID } });
    await db.user.deleteMany({
      where: { id: { in: [USER_A_ID, USER_B_ID] } },
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("usuario A solo ve sus propios favoritos, no los de B", async () => {
    const { requireUser } = await import("@/lib/supabase/server");
    vi.mocked(requireUser).mockResolvedValue(userA);

    const response = await getFavorites();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.favorites).toBeDefined();
    expect(data.favorites.length).toBe(1);
    expect(data.favorites[0].userId).toBe(USER_A_ID);
    expect(data.favorites[0].scholarshipId).toBe(SCHOLARSHIP_A_ID);

    // No debe ver el favorito de B
    const hasBFavorite = data.favorites.some(
      (f: { userId: string; scholarshipId: string }) =>
        f.userId === USER_B_ID || f.scholarshipId === SCHOLARSHIP_B_ID,
    );
    expect(hasBFavorite).toBe(false);
  });

  it("usuario B solo ve sus propios favoritos, no los de A", async () => {
    const { requireUser } = await import("@/lib/supabase/server");
    vi.mocked(requireUser).mockResolvedValue(userB);

    const response = await getFavorites();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.favorites).toBeDefined();
    expect(data.favorites.length).toBe(1);
    expect(data.favorites[0].userId).toBe(USER_B_ID);
    expect(data.favorites[0].scholarshipId).toBe(SCHOLARSHIP_B_ID);

    // No debe ver el favorito de A
    const hasAFavorite = data.favorites.some(
      (f: { userId: string; scholarshipId: string }) =>
        f.userId === USER_A_ID || f.scholarshipId === SCHOLARSHIP_A_ID,
    );
    expect(hasAFavorite).toBe(false);
  });

  it("usuario A solo ve sus propias postulaciones, no las de B", async () => {
    const { requireUser } = await import("@/lib/supabase/server");
    vi.mocked(requireUser).mockResolvedValue(userA);

    const response = await getApplications();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.applications).toBeDefined();
    expect(data.applications.length).toBe(1);
    expect(data.applications[0].userId).toBe(USER_A_ID);
    expect(data.applications[0].scholarshipId).toBe(SCHOLARSHIP_A_ID);

    // No debe ver la postulación de B
    const hasBApplication = data.applications.some(
      (a: { userId: string; scholarshipId: string }) =>
        a.userId === USER_B_ID || a.scholarshipId === SCHOLARSHIP_B_ID,
    );
    expect(hasBApplication).toBe(false);
  });

  it("usuario A solo ve su propio perfil, no el de B", async () => {
    const { requireUser } = await import("@/lib/supabase/server");
    vi.mocked(requireUser).mockResolvedValue(userA);

    const response = await getProfile();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.profile).toBeDefined();
    expect(data.profile.userId).toBe(USER_A_ID);
    expect(data.profile.fieldOfInterest).toBe("Ingeniería");

    // No debe ver el perfil de B
    expect(data.profile.userId).not.toBe(USER_B_ID);
    expect(data.profile.fieldOfInterest).not.toBe("Medicina");
  });

  it("usuario B solo ve su propio perfil, no el de A", async () => {
    const { requireUser } = await import("@/lib/supabase/server");
    vi.mocked(requireUser).mockResolvedValue(userB);

    const response = await getProfile();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.profile).toBeDefined();
    expect(data.profile.userId).toBe(USER_B_ID);
    expect(data.profile.fieldOfInterest).toBe("Medicina");

    // No debe ver el perfil de A
    expect(data.profile.userId).not.toBe(USER_A_ID);
    expect(data.profile.fieldOfInterest).not.toBe("Ingeniería");
  });

  it("usuario A NO puede borrar favorito de B", async () => {
    const { requireUser } = await import("@/lib/supabase/server");
    
    // Usuario A intenta borrar el favorito de B
    vi.mocked(requireUser).mockResolvedValue(userA);

    const request = new NextRequest("http://localhost/api/v1/favoritos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scholarshipId: SCHOLARSHIP_B_ID }),
    });

    await deleteFavorite(request);

    // Verificar que el favorito de B sigue existiendo
    const favoriteB = await db.favorite.findUnique({
      where: {
        userId_scholarshipId: {
          userId: USER_B_ID,
          scholarshipId: SCHOLARSHIP_B_ID,
        },
      },
    });

    expect(favoriteB).not.toBeNull();
    expect(favoriteB?.userId).toBe(USER_B_ID);
  });

  it("usuario A NO puede modificar postulación de B", async () => {
    const { requireUser } = await import("@/lib/supabase/server");
    
    // Usuario A intenta modificar la postulación de B
    vi.mocked(requireUser).mockResolvedValue(userA);

    const request = new NextRequest("http://localhost/api/v1/postulaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scholarshipId: SCHOLARSHIP_B_ID,
        status: "REJECTED",
        notes: "Intento de A de modificar postulación de B",
      }),
    });

    await postApplication(request);

    // Verificar que la postulación de B no cambió
    const applicationB = await db.application.findUnique({
      where: {
        userId_scholarshipId: {
          userId: USER_B_ID,
          scholarshipId: SCHOLARSHIP_B_ID,
        },
      },
    });

    expect(applicationB).not.toBeNull();
    expect(applicationB?.status).toBe("APPLIED"); // No cambió a REJECTED
    expect(applicationB?.notes).not.toContain("Intento de A");
  });
});
