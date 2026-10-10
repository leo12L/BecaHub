/**
 * Tests para API de favoritos (Fase 3, criterio 3.3)
 * Verifica que los favoritos se guardan correctamente
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { GET, POST, DELETE } from "../route";
import type { User } from "@/generated/prisma/client";

const TEST_USER_ID = "test-user-favorites";
const TEST_SOURCE_ID = "test-source-favorites";
const TEST_SCHOLARSHIP_ID = "test-scholarship-favorites";

// Mock de requireUser
vi.mock("@/lib/supabase/server", () => ({
  requireUser: vi.fn(),
  getCurrentUser: vi.fn(),
  getSupabaseServerClient: vi.fn(),
}));

describe("API de favoritos", () => {
  let testUser: User;

  beforeAll(async () => {
    // Crear usuario de prueba
    testUser = await db.user.upsert({
      where: { id: TEST_USER_ID },
      create: {
        id: TEST_USER_ID,
        email: "favorites@test.com",
        role: "USER",
      },
      update: {},
    });

    // Crear fuente de prueba
    await db.source.upsert({
      where: { id: TEST_SOURCE_ID },
      create: {
        id: TEST_SOURCE_ID,
        name: "Fuente Favoritos Test",
        url: "https://example.com/favorites",
        type: "MANUAL",
      },
      update: {},
    });

    // Crear beca de prueba
    await db.scholarship.upsert({
      where: { id: TEST_SCHOLARSHIP_ID },
      create: {
        id: TEST_SCHOLARSHIP_ID,
        title: "Beca Favoritos Test",
        slug: "beca-favoritos-test",
        description: "Beca para probar favoritos",
        status: "ACTIVE",
        coverageType: "FULL",
        destinationCountries: ["MX"],
        academicLevel: "UNDERGRAD",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        applyUrl: "https://example.com/apply-favorites",
        sourceId: TEST_SOURCE_ID,
        isVerified: true,
      },
      update: {},
    });
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await db.favorite.deleteMany({ where: { userId: TEST_USER_ID } });
    await db.scholarship.deleteMany({ where: { id: TEST_SCHOLARSHIP_ID } });
    await db.source.deleteMany({ where: { id: TEST_SOURCE_ID } });
    await db.user.deleteMany({ where: { id: TEST_USER_ID } });
  });

  beforeEach(async () => {
    // Limpiar favoritos antes de cada test
    await db.favorite.deleteMany({ where: { userId: TEST_USER_ID } });

    // Configurar mock de requireUser
    const { requireUser } = await import("@/lib/supabase/server");
    vi.mocked(requireUser).mockResolvedValue(testUser);
  });

  it("POST /api/v1/favoritos crea un favorito", async () => {
    const request = new NextRequest("http://localhost/api/v1/favoritos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scholarshipId: TEST_SCHOLARSHIP_ID }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.favorite).toBeDefined();
    expect(data.favorite.userId).toBe(TEST_USER_ID);
    expect(data.favorite.scholarshipId).toBe(TEST_SCHOLARSHIP_ID);

    // Verificar en la base de datos
    const favorite = await db.favorite.findUnique({
      where: {
        userId_scholarshipId: {
          userId: TEST_USER_ID,
          scholarshipId: TEST_SCHOLARSHIP_ID,
        },
      },
    });
    expect(favorite).not.toBeNull();
  });

  it("GET /api/v1/favoritos lista los favoritos del usuario", async () => {
    // Crear un favorito primero
    await db.favorite.create({
      data: {
        userId: TEST_USER_ID,
        scholarshipId: TEST_SCHOLARSHIP_ID,
      },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.favorites).toBeDefined();
    expect(Array.isArray(data.favorites)).toBe(true);
    expect(data.favorites.length).toBeGreaterThan(0);
    expect(data.favorites[0].userId).toBe(TEST_USER_ID);
    expect(data.favorites[0].scholarship).toBeDefined();
  });

  it("DELETE /api/v1/favoritos elimina un favorito", async () => {
    // Crear un favorito primero
    await db.favorite.create({
      data: {
        userId: TEST_USER_ID,
        scholarshipId: TEST_SCHOLARSHIP_ID,
      },
    });

    const request = new NextRequest("http://localhost/api/v1/favoritos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scholarshipId: TEST_SCHOLARSHIP_ID }),
    });

    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verificar que fue eliminado de la base de datos
    const favorite = await db.favorite.findUnique({
      where: {
        userId_scholarshipId: {
          userId: TEST_USER_ID,
          scholarshipId: TEST_SCHOLARSHIP_ID,
        },
      },
    });
    expect(favorite).toBeNull();
  });

  it("POST /api/v1/favoritos sin scholarshipId retorna 400", async () => {
    const request = new NextRequest("http://localhost/api/v1/favoritos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("POST /api/v1/favoritos con scholarshipId inexistente retorna 404", async () => {
    const request = new NextRequest("http://localhost/api/v1/favoritos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scholarshipId: "nonexistent-id" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(404);
  });
});
