import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@/lib/db";
import { LECTORES_REGISTRY } from "../ejecutar";
import type { FuenteLector, BecaCandidata } from "../types";
import { SourceType, ScholarshipStatus } from "@/generated/prisma/enums";

// Helper para crear lectores de test
function crearLectorTest(
  nombre: string,
  sourceSlug: string,
  becas: BecaCandidata[],
): new () => FuenteLector {
  return class {
    readonly nombre = nombre;
    readonly sourceSlug = sourceSlug;

    async obtener() {
      return Promise.resolve([]);
    }

    normalizar() {
      return becas;
    }
  };
}

// Tests simplificados con BD
describe.skipIf(!process.env.DATABASE_URL)(
  "Ingesta - Tests BD (simplificados)",
  () => {
    let testSourceId: string;

    beforeAll(async () => {
      // Limpiar y crear fuente de test
      await db.scholarship.deleteMany({
        where: { source: { scraperAdapter: "test-simple" } },
      });
      await db.scraperLog.deleteMany({
        where: { source: { scraperAdapter: "test-simple" } },
      });
      await db.source.deleteMany({
        where: { scraperAdapter: "test-simple" },
      });

      const source = await db.source.create({
        data: {
          name: "Test Simple",
          url: "https://test.example.com",
          type: SourceType.GOVERNMENT,
          scraperAdapter: "test-simple",
          isActive: true,
        },
      });
      testSourceId = source.id;

      // Mock fetch y validateUrlLiveness
      vi.spyOn(global, "fetch").mockImplementation(
        async () =>
          ({
            ok: true,
            status: 200,
          }) as Response,
      );
    });

    afterAll(async () => {
      // Limpiar
      delete LECTORES_REGISTRY["test-simple"];
      vi.restoreAllMocks();

      // Limpiar datos
      await db.scholarship.deleteMany({
        where: { sourceId: testSourceId },
      });
      await db.scraperLog.deleteMany({
        where: { sourceId: testSourceId },
      });
      await db.source.delete({
        where: { id: testSourceId },
      });
    });

    it("debe verificar que el sistema básico funciona", async () => {
      // Registrar lector simple
      LECTORES_REGISTRY["test-simple"] = crearLectorTest(
        "Test Simple",
        "test-simple",
        [
          {
            title: "Beca Test",
            description: "Test",
            applyUrl: "https://example.com/test",
            deadline: "2026-12-31",
            amount: null,
            coverageType: null,
            academicLevel: null,
            countryDestination: "México",
            language: null,
            convocante: "Test Simple",
            rawData: { year: 2026 },
          },
        ],
      );

      // Ejecutar ingesta usando el sourceId específico
      const { ejecutarIngesta } = await import("../ejecutar");
      await ejecutarIngesta(testSourceId);

      // Verificar que se creó la beca
      const count = await db.scholarship.count({
        where: { sourceId: testSourceId },
      });

      expect(count).toBe(1);

      const beca = await db.scholarship.findFirst({
        where: { sourceId: testSourceId },
      });

      expect(beca).toBeTruthy();
      expect(beca?.status).toBe(ScholarshipStatus.PENDING_REVIEW);
      expect(beca?.fingerprint).toContain("2026");
    });
  },
);
