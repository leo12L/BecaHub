/**
 * Tests para recomendaciones con BD (Fase 3, criterio 3.2)
 * Verifica que recomendarBecas NO recomienda becas de otro nivel ni vencidas
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { recomendarBecas } from "../recommend";

const TEST_SOURCE_ID = "test-source-recommend";
const SCHOLARSHIP_UNDERGRAD_VALID_ID = "test-scholarship-undergrad-valid";
const SCHOLARSHIP_GRAD_VALID_ID = "test-scholarship-grad-valid";
const SCHOLARSHIP_UNDERGRAD_EXPIRED_ID = "test-scholarship-undergrad-expired";

describe("recomendarBecas con BD", () => {
  beforeAll(async () => {
    // Crear fuente de prueba
    await db.source.upsert({
      where: { id: TEST_SOURCE_ID },
      create: {
        id: TEST_SOURCE_ID,
        name: "Fuente Recomendaciones Test",
        url: "https://example.com/recommend",
        type: "MANUAL",
      },
      update: {},
    });

    // Crear beca de licenciatura vigente (cierra en 30 días)
    await db.scholarship.upsert({
      where: { id: SCHOLARSHIP_UNDERGRAD_VALID_ID },
      create: {
        id: SCHOLARSHIP_UNDERGRAD_VALID_ID,
        title: "Beca Licenciatura Vigente",
        slug: "beca-licenciatura-vigente-recommend",
        description: "Beca vigente para estudiantes de licenciatura",
        status: "ACTIVE",
        coverageType: "FULL",
        countryDestination: "México",
        academicLevel: "UNDERGRAD",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 días
        applyUrl: "https://example.com/apply-undergrad-valid",
        sourceId: TEST_SOURCE_ID,
        isVerified: true,
      },
      update: {},
    });

    // Crear beca de posgrado vigente (no debe aparecer para licenciatura)
    await db.scholarship.upsert({
      where: { id: SCHOLARSHIP_GRAD_VALID_ID },
      create: {
        id: SCHOLARSHIP_GRAD_VALID_ID,
        title: "Beca Posgrado Vigente",
        slug: "beca-posgrado-vigente-recommend",
        description: "Beca vigente para estudiantes de posgrado",
        status: "ACTIVE",
        coverageType: "FULL",
        countryDestination: "México",
        academicLevel: "GRAD",
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 días
        applyUrl: "https://example.com/apply-grad-valid",
        sourceId: TEST_SOURCE_ID,
        isVerified: true,
      },
      update: {},
    });

    // Crear beca de licenciatura vencida (no debe aparecer)
    await db.scholarship.upsert({
      where: { id: SCHOLARSHIP_UNDERGRAD_EXPIRED_ID },
      create: {
        id: SCHOLARSHIP_UNDERGRAD_EXPIRED_ID,
        title: "Beca Licenciatura Vencida",
        slug: "beca-licenciatura-vencida-recommend",
        description: "Beca vencida para estudiantes de licenciatura",
        status: "ACTIVE", // ACTIVE pero con deadline pasado
        coverageType: "FULL",
        countryDestination: "México",
        academicLevel: "UNDERGRAD",
        deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // -1 día (ayer)
        applyUrl: "https://example.com/apply-undergrad-expired",
        sourceId: TEST_SOURCE_ID,
        isVerified: true,
      },
      update: {},
    });
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await db.scholarship.deleteMany({
      where: {
        id: {
          in: [
            SCHOLARSHIP_UNDERGRAD_VALID_ID,
            SCHOLARSHIP_GRAD_VALID_ID,
            SCHOLARSHIP_UNDERGRAD_EXPIRED_ID,
          ],
        },
      },
    });
    await db.source.deleteMany({ where: { id: TEST_SOURCE_ID } });
  });

  it("perfil de licenciatura NO recibe becas de posgrado", async () => {
    const recommendations = await recomendarBecas({
      academicLevel: "UNDERGRAD",
    });

    // No debe incluir la beca de posgrado
    const hasGradScholarship = recommendations.some(
      (s) => s.id === SCHOLARSHIP_GRAD_VALID_ID,
    );
    expect(hasGradScholarship).toBe(false);

    // Todas las recomendaciones deben ser de UNDERGRAD
    const allUndergrad = recommendations.every(
      (s) => s.academicLevel === "UNDERGRAD",
    );
    expect(allUndergrad).toBe(true);
  });

  it("perfil de licenciatura NO recibe becas vencidas", async () => {
    const recommendations = await recomendarBecas({
      academicLevel: "UNDERGRAD",
    });

    // No debe incluir la beca vencida
    const hasExpiredScholarship = recommendations.some(
      (s) => s.id === SCHOLARSHIP_UNDERGRAD_EXPIRED_ID,
    );
    expect(hasExpiredScholarship).toBe(false);
  });

  it("perfil de licenciatura SÍ recibe beca vigente de su nivel", async () => {
    const recommendations = await recomendarBecas({
      academicLevel: "UNDERGRAD",
    });

    // Debe incluir la beca vigente de licenciatura
    const hasValidScholarship = recommendations.some(
      (s) => s.id === SCHOLARSHIP_UNDERGRAD_VALID_ID,
    );
    expect(hasValidScholarship).toBe(true);
  });

  it("todas las becas recomendadas tienen deadline futuro o null", async () => {
    const recommendations = await recomendarBecas({
      academicLevel: "UNDERGRAD",
    });

    const todayMexico = new Date();
    todayMexico.setHours(0, 0, 0, 0);

    const allValidDeadlines = recommendations.every((s) => {
      if (s.deadline === null) return true;
      return new Date(s.deadline) >= todayMexico;
    });

    expect(allValidDeadlines).toBe(true);
  });
});
