/**
 * Tests para API de postulaciones (Fase 3, criterio 3.3)
 * Verifica que las postulaciones se guardan correctamente
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { GET, POST } from "../route";
import type { User } from "@/generated/prisma/client";

const TEST_USER_ID = "test-user-applications";
const TEST_SOURCE_ID = "test-source-applications";
const TEST_SCHOLARSHIP_ID = "test-scholarship-applications";

// Mock de requireUser
vi.mock("@/lib/supabase/server", () => ({
  requireUser: vi.fn(),
  getCurrentUser: vi.fn(),
  getSupabaseServerClient: vi.fn(),
}));

describe("API de postulaciones", () => {
  let testUser: User;

  beforeAll(async () => {
    // Crear usuario de prueba
    testUser = await db.user.upsert({
      where: { id: TEST_USER_ID },
      create: {
        id: TEST_USER_ID,
        email: "applications@test.com",
        role: "USER",
      },
      update: {},
    });

    // Crear fuente de prueba
    await db.source.upsert({
      where: { id: TEST_SOURCE_ID },
      create: {
        id: TEST_SOURCE_ID,
        name: "Fuente Postulaciones Test",
        url: "https://example.com/applications",
        type: "MANUAL",
      },
      update: {},
    });

    // Crear beca de prueba
    await db.scholarship.upsert({
      where: { id: TEST_SCHOLARSHIP_ID },
      create: {
        id: TEST_SCHOLARSHIP_ID,
        title: "Beca Postulaciones Test",
        slug: "beca-postulaciones-test",
        description: "Beca para probar postulaciones",
        status: "ACTIVE",
        coverageType: "FULL",
        countryDestination: "México",
        academicLevel: "UNDERGRAD",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        applyUrl: "https://example.com/apply-applications",
        sourceId: TEST_SOURCE_ID,
        isVerified: true,
      },
      update: {},
    });
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await db.application.deleteMany({ where: { userId: TEST_USER_ID } });
    await db.scholarship.deleteMany({ where: { id: TEST_SCHOLARSHIP_ID } });
    await db.source.deleteMany({ where: { id: TEST_SOURCE_ID } });
    await db.user.deleteMany({ where: { id: TEST_USER_ID } });
  });

  beforeEach(async () => {
    // Limpiar postulaciones antes de cada test
    await db.application.deleteMany({ where: { userId: TEST_USER_ID } });

    // Configurar mock de requireUser
    const { requireUser } = await import("@/lib/supabase/server");
    vi.mocked(requireUser).mockResolvedValue(testUser);
  });

  it("POST /api/postulaciones crea una postulación con estado INTERESTED", async () => {
    const request = new Request("http://localhost/api/postulaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scholarshipId: TEST_SCHOLARSHIP_ID,
        status: "INTERESTED",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.application).toBeDefined();
    expect(data.application.userId).toBe(TEST_USER_ID);
    expect(data.application.scholarshipId).toBe(TEST_SCHOLARSHIP_ID);
    expect(data.application.status).toBe("INTERESTED");

    // Verificar en la base de datos
    const application = await db.application.findUnique({
      where: {
        userId_scholarshipId: {
          userId: TEST_USER_ID,
          scholarshipId: TEST_SCHOLARSHIP_ID,
        },
      },
    });
    expect(application).not.toBeNull();
    expect(application?.status).toBe("INTERESTED");
  });

  it("POST /api/postulaciones con status APPLIED marca appliedAt", async () => {
    const request = new Request("http://localhost/api/postulaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scholarshipId: TEST_SCHOLARSHIP_ID,
        status: "APPLIED",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.application.status).toBe("APPLIED");
    expect(data.application.appliedAt).not.toBeNull();

    // Verificar en la base de datos
    const application = await db.application.findUnique({
      where: {
        userId_scholarshipId: {
          userId: TEST_USER_ID,
          scholarshipId: TEST_SCHOLARSHIP_ID,
        },
      },
    });
    expect(application?.appliedAt).not.toBeNull();
  });

  it("POST /api/postulaciones actualiza una postulación existente", async () => {
    // Crear una postulación primero
    await db.application.create({
      data: {
        userId: TEST_USER_ID,
        scholarshipId: TEST_SCHOLARSHIP_ID,
        status: "INTERESTED",
      },
    });

    // Actualizar a APPLIED
    const request = new Request("http://localhost/api/postulaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scholarshipId: TEST_SCHOLARSHIP_ID,
        status: "APPLIED",
        notes: "Ya envié la solicitud",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.application.status).toBe("APPLIED");
    expect(data.application.notes).toBe("Ya envié la solicitud");

    // Verificar que solo existe una postulación (no se duplicó)
    const applications = await db.application.findMany({
      where: {
        userId: TEST_USER_ID,
        scholarshipId: TEST_SCHOLARSHIP_ID,
      },
    });
    expect(applications.length).toBe(1);
  });

  it("GET /api/postulaciones lista las postulaciones del usuario", async () => {
    // Crear una postulación primero
    await db.application.create({
      data: {
        userId: TEST_USER_ID,
        scholarshipId: TEST_SCHOLARSHIP_ID,
        status: "APPLIED",
      },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.applications).toBeDefined();
    expect(Array.isArray(data.applications)).toBe(true);
    expect(data.applications.length).toBeGreaterThan(0);
    expect(data.applications[0].userId).toBe(TEST_USER_ID);
    expect(data.applications[0].scholarship).toBeDefined();
  });

  it("POST /api/postulaciones sin scholarshipId retorna 400", async () => {
    const request = new Request("http://localhost/api/postulaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("POST /api/postulaciones con status inválido retorna 400", async () => {
    const request = new Request("http://localhost/api/postulaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scholarshipId: TEST_SCHOLARSHIP_ID,
        status: "INVALID_STATUS",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
