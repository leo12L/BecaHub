/**
 * Tests para búsqueda con unaccent (Fase 3, criterio 3.1)
 * Verifica que buscar "mexico" encuentra "Becas México"
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { getBecas } from "@/lib/becas/queries";

const TEST_SOURCE_ID = "test-source-search";
const TEST_SCHOLARSHIP_ID = "test-scholarship-search-mexico";

describe("Búsqueda con unaccent", () => {
  beforeAll(async () => {
    // Crear una fuente de prueba
    await db.source.upsert({
      where: { id: TEST_SOURCE_ID },
      create: {
        id: TEST_SOURCE_ID,
        name: "Fuente de Prueba Búsqueda",
        url: "https://example.com/search",
        type: "MANUAL",
      },
      update: {},
    });

    // Crear una beca con acento en el título
    await db.scholarship.upsert({
      where: { id: TEST_SCHOLARSHIP_ID },
      create: {
        id: TEST_SCHOLARSHIP_ID,
        title: "Becas para estudiar en México 2026",
        slug: "becas-mexico-2026-search-test",
        description: "Oportunidades de becas para estudiantes en México",
        status: "ACTIVE",
        coverageType: "FULL",
        countryDestination: "México",
        academicLevel: "UNDERGRAD",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días en el futuro
        applyUrl: "https://example.com/apply-mexico",
        sourceId: TEST_SOURCE_ID,
        isVerified: true,
      },
      update: {},
    });
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await db.scholarship.deleteMany({
      where: { id: TEST_SCHOLARSHIP_ID },
    });
    await db.source.deleteMany({
      where: { id: TEST_SOURCE_ID },
    });
  });

  it("buscar 'mexico' (sin acento) encuentra 'México' (con acento)", async () => {
    const result = await getBecas({
      search: "mexico",
      page: 1,
      limit: 10,
    });

    // Debe encontrar la beca con "México" en el título
    expect(result.data.length).toBeGreaterThan(0);
    const found = result.data.find((s) => s.id === TEST_SCHOLARSHIP_ID);
    expect(found).toBeDefined();
    expect(found?.title).toContain("México");
  });

  it("buscar 'México' (con acento) encuentra 'Mexico' (sin acento) si existe", async () => {
    // Crear otra beca sin acento
    const scholarshipNoAccent = await db.scholarship.create({
      data: {
        title: "Becas Mexico 2026 Sin Acento",
        slug: "becas-mexico-2026-no-accent",
        description: "Becas para Mexico sin acento",
        status: "ACTIVE",
        coverageType: "FULL",
        countryDestination: "Mexico",
        academicLevel: "UNDERGRAD",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        applyUrl: "https://example.com/apply-mexico-no-accent",
        sourceId: TEST_SOURCE_ID,
        isVerified: true,
      },
    });

    const result = await getBecas({
      search: "México",
      page: 1,
      limit: 10,
    });

    // Debe encontrar ambas becas
    expect(result.data.length).toBeGreaterThan(0);
    const foundWithAccent = result.data.find((s) => s.id === TEST_SCHOLARSHIP_ID);
    const foundWithoutAccent = result.data.find((s) => s.id === scholarshipNoAccent.id);
    
    expect(foundWithAccent).toBeDefined();
    expect(foundWithoutAccent).toBeDefined();

    // Limpiar
    await db.scholarship.delete({ where: { id: scholarshipNoAccent.id } });
  });

  it("búsqueda vacía no retorna error", async () => {
    const result = await getBecas({
      search: "términoquenoexisteenningunabeca123xyz",
      page: 1,
      limit: 10,
    });

    expect(result.data).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });
});
