/**
 * Tests para recomendaciones con BD (Fase 3, criterio 3.2)
 * Verifica que recomendarBecas NO recomienda becas de otro nivel ni vencidas
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach, afterEach } from "vitest";
import { db } from "@/lib/db";
import { recomendarBecas } from "../recommend";
import { componentsToMexicoMidnight } from "@/lib/fechas";

const TEST_SOURCE_ID = "test-source-recommend";
const SCHOLARSHIP_UNDERGRAD_VALID_ID = "test-scholarship-undergrad-valid";
const SCHOLARSHIP_GRAD_VALID_ID = "test-scholarship-grad-valid";
const SCHOLARSHIP_UNDERGRAD_EXPIRED_ID = "test-scholarship-undergrad-expired";

describe("recomendarBecas con BD", () => {
  beforeEach(() => {
    // Fijar hora del sistema a 23:30 de México (05:30 UTC del día siguiente)
    // En México: 2026-10-09 23:30
    // En UTC: 2026-10-10 05:30
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-10T05:30:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

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

    // Crear beca de licenciatura que cierra HOY (2026-10-09 en México)
    // Usando la función compartida para garantizar medianoche de México
    await db.scholarship.upsert({
      where: { id: SCHOLARSHIP_UNDERGRAD_VALID_ID },
      create: {
        id: SCHOLARSHIP_UNDERGRAD_VALID_ID,
        title: "Beca Licenciatura Vigente (cierra hoy)",
        slug: "beca-licenciatura-vigente-recommend",
        description: "Beca que cierra hoy, aún debe aparecer",
        status: "ACTIVE",
        coverageType: "FULL",
        destinationCountries: ["MX"],
        academicLevel: "UNDERGRAD",
        deadline: componentsToMexicoMidnight(2026, 10, 9), // Cierra HOY en México
        applyUrl: "https://example.com/apply-undergrad-valid",
        sourceId: TEST_SOURCE_ID,
        isVerified: true,
      },
      update: {},
    });

    // Crear beca de posgrado que cierra HOY (no debe aparecer para UNDERGRAD por nivel)
    await db.scholarship.upsert({
      where: { id: SCHOLARSHIP_GRAD_VALID_ID },
      create: {
        id: SCHOLARSHIP_GRAD_VALID_ID,
        title: "Beca Posgrado Vigente",
        slug: "beca-posgrado-vigente-recommend",
        description: "Beca vigente para estudiantes de posgrado",
        status: "ACTIVE",
        coverageType: "FULL",
        destinationCountries: ["MX"],
        academicLevel: "GRAD",
        deadline: componentsToMexicoMidnight(2026, 10, 9), // Cierra HOY
        applyUrl: "https://example.com/apply-grad-valid",
        sourceId: TEST_SOURCE_ID,
        isVerified: true,
      },
      update: {},
    });

    // Crear beca de licenciatura que cerró AYER (2026-10-08 en México)
    // NO debe aparecer porque el deadline ya pasó
    await db.scholarship.upsert({
      where: { id: SCHOLARSHIP_UNDERGRAD_EXPIRED_ID },
      create: {
        id: SCHOLARSHIP_UNDERGRAD_EXPIRED_ID,
        title: "Beca Licenciatura Vencida (cerró ayer)",
        slug: "beca-licenciatura-vencida-recommend",
        description: "Beca que cerró ayer, no debe aparecer",
        status: "ACTIVE", // ACTIVE pero con deadline pasado
        coverageType: "FULL",
        destinationCountries: ["MX"],
        academicLevel: "UNDERGRAD",
        deadline: componentsToMexicoMidnight(2026, 10, 8), // Cerró AYER en México
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

  it("todas las becas recomendadas tienen deadline de hoy o futuro (o null)", async () => {
    const recommendations = await recomendarBecas({
      academicLevel: "UNDERGRAD",
    });

    // Hoy es 2026-10-09 en México (fijado por vi.setSystemTime)
    // Deadline válidos: >= 2026-10-09T00:00:00-06:00 o null
    const todayMexicoMs = componentsToMexicoMidnight(2026, 10, 9).getTime();

    const allValidDeadlines = recommendations.every((s) => {
      if (s.deadline === null) return true;
      return new Date(s.deadline).getTime() >= todayMexicoMs;
    });

    expect(allValidDeadlines).toBe(true);
  });
});
