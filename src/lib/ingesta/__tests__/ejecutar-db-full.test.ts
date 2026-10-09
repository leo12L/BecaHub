import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { ejecutarIngesta, LECTORES_REGISTRY } from "../ejecutar";
import {
  ScholarshipStatus,
  SourceType,
  ScraperRunStatus,
} from "@/generated/prisma/enums";
import type { FuenteLector, BecaCandidata } from "../types";

// Tests completos con BD real - demuestran bloqueantes A-E y requisitos 1-7
describe.skipIf(!process.env.DATABASE_URL)(
  "Ingesta - Tests completos con BD",
  () => {
    let testSourceId1: string;
    let testSourceId2: string;
    let originalFetch: typeof fetch;

    beforeEach(async () => {
      // Limpiar datos de test anteriores
      const existingSources = await db.source.findMany({
        where: { scraperAdapter: { in: ["test-db-1", "test-db-2"] } },
      });

      if (existingSources.length > 0) {
        await db.scholarship.deleteMany({
          where: { sourceId: { in: existingSources.map((s) => s.id) } },
        });
        await db.scraperLog.deleteMany({
          where: { sourceId: { in: existingSources.map((s) => s.id) } },
        });
        await db.source.deleteMany({
          where: { scraperAdapter: { in: ["test-db-1", "test-db-2"] } },
        });
      }

      // Crear fuentes de test
      const source1 = await db.source.create({
        data: {
          name: "Test DB Source 1",
          url: "https://test-db-1.example.com",
          type: SourceType.GOVERNMENT,
          scraperAdapter: "test-db-1",
          isActive: true,
        },
      });
      testSourceId1 = source1.id;

      const source2 = await db.source.create({
        data: {
          name: "Test DB Source 2",
          url: "https://test-db-2.example.com",
          type: SourceType.GOVERNMENT,
          scraperAdapter: "test-db-2",
          isActive: true,
        },
      });
      testSourceId2 = source2.id;

      // Guardar fetch original y mockear
      originalFetch = global.fetch;
    });

    afterEach(async () => {
      // Limpiar registry
      delete LECTORES_REGISTRY["test-db-1"];
      delete LECTORES_REGISTRY["test-db-2"];

      // Restaurar mocks
      vi.restoreAllMocks();
      global.fetch = originalFetch;
    });

    // Test 1: Deduplicación - dos corridas con mismo fixture
    it("Test 1: debe evitar duplicados en dos corridas con mismo fixture", async () => {
      // Mock fetch que siempre responde OK
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      }) as typeof fetch;

      // Crear lector con fixture específico
      class TestLector1 implements FuenteLector {
        readonly nombre = "Test DB 1";
        readonly sourceSlug = "test-db-1";

        async obtener() {
          return Promise.resolve([]);
        }

        normalizar(): BecaCandidata[] {
          return [
            {
              title: "Beca de Deduplicación 2026",
              description: "Descripción de prueba dedup",
              applyUrl: "https://example.com/dedup",
              deadline: "2026-12-31",
              amount: "$10,000 MXN",
              coverageType: "MONETARY",
              academicLevel: "MASTERS",
              countryDestination: "México",
              language: "Español",
              convocante: "Test DB Source 1",
              rawData: { year: 2026 },
            },
          ];
        }
      }

      LECTORES_REGISTRY["test-db-1"] = TestLector1;

      // Primera corrida - solo test-db-1
      const resultado1 = await ejecutarIngesta(testSourceId1);
      const result1 = resultado1[0];

      expect(result1?.encontradas).toBe(1);
      expect(result1?.creadas).toBe(1);
      expect(result1?.actualizadas).toBe(0);

      const countAfter1 = await db.scholarship.count({
        where: { sourceId: testSourceId1 },
      });
      expect(countAfter1).toBe(1);

      // Segunda corrida con el MISMO fixture
      const resultado2 = await ejecutarIngesta(testSourceId1);
      const result2 = resultado2[0];

      // La segunda corrida debe contar como actualizada, NO crear duplicado
      expect(result2?.encontradas).toBe(1);
      expect(result2?.creadas).toBe(0);
      expect(result2?.actualizadas).toBe(1);

      // Debe seguir habiendo solo 1 beca
      const countAfter2 = await db.scholarship.count({
        where: { sourceId: testSourceId1 },
      });
      expect(countAfter2).toBe(1);
    });

    // Test 2: Beca ACTIVE preserva campos editados
    it("Test 2: beca ACTIVE preserva campos editados tras actualización", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      }) as typeof fetch;

      // Crear beca ACTIVE con campos editados por moderador
      const beca = await db.scholarship.create({
        data: {
          title: "Beca Original Editada",
          slug: "beca-original-editada-test",
          description: "Descripción EDITADA por admin",
          status: ScholarshipStatus.ACTIVE,
          coverageType: "RESEARCH",
          amountMin: 15000,
          amountMax: 20000,
          currency: "MXN",
          countryDestination: "España",
          academicLevel: "PHD",
          deadline: new Date("2026-12-31"),
          applyUrl: "https://example.com/original-editada",
          sourceId: testSourceId1,
          isVerified: true,
          fingerprint: "beca original editada|test db source 1|2026",
          rawPayload: { version: 1 },
          validationErrors: Prisma.DbNull,
        },
      });

      // Lector que "actualiza" la misma beca con datos diferentes
      class TestLector2 implements FuenteLector {
        readonly nombre = "Test DB 1";
        readonly sourceSlug = "test-db-1";

        async obtener() {
          return Promise.resolve([]);
        }

        normalizar(): BecaCandidata[] {
          return [
            {
              title: "Beca Original Editada",
              description: "Nueva descripción de la fuente (debe ignorarse)",
              applyUrl: "https://example.com/original-editada",
              deadline: "2026-12-31",
              amount: "$5,000 MXN",
              coverageType: "MONETARY",
              academicLevel: "UNDERGRAD",
              countryDestination: "México",
              language: "Inglés",
              convocante: "Test DB Source 1",
              rawData: { year: 2026, version: 2 },
            },
          ];
        }
      }

      LECTORES_REGISTRY["test-db-1"] = TestLector2;

      await ejecutarIngesta(testSourceId1);

      const updated = await db.scholarship.findUnique({
        where: { id: beca.id },
      });

      // Campos editados NO deben cambiar
      expect(updated?.status).toBe(ScholarshipStatus.ACTIVE);
      expect(updated?.description).toBe("Descripción EDITADA por admin");
      expect(updated?.coverageType).toBe("RESEARCH");
      expect(updated?.academicLevel).toBe("PHD");
      expect(updated?.amountMin?.toString()).toBe("15000");
      expect(updated?.countryDestination).toBe("España");

      // Sí debe actualizar rawPayload y scrapedAt
      expect(updated?.rawPayload).toEqual({ year: 2026, version: 2 });
      expect(updated?.scrapedAt).toBeTruthy();
      expect(updated?.scrapedAt?.getTime()).toBeGreaterThan(
        beca.createdAt.getTime(),
      );
    });

    // Test 3: validationErrors vuelve a null cuando se corrige
    it("Test 3: validationErrors debe ser null cuando no hay errores", async () => {
      // Primera corrida: mock que responde 404
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }) as typeof fetch;

      // Lector con datos SIN suposiciones (nivel, cobertura y país explícitos)
      class TestLector3 implements FuenteLector {
        readonly nombre = "Test DB 1";
        readonly sourceSlug = "test-db-1";

        async obtener() {
          return Promise.resolve([]);
        }

        normalizar(): BecaCandidata[] {
          return [
            {
              title: "Beca Error Corregido",
              description: "Test validationErrors null",
              applyUrl: "https://example.com/error-corregido",
              deadline: "2026-12-31",
              amount: "$10,000 MXN",
              coverageType: "MONETARY",
              academicLevel: "MASTERS",
              countryDestination: "México",
              language: "Español",
              convocante: "Test DB Source 1",
              rawData: { year: 2026 },
            },
          ];
        }
      }

      LECTORES_REGISTRY["test-db-1"] = TestLector3;

      // Primera corrida: genera error de URL
      await ejecutarIngesta(testSourceId1);

      const becaConError = await db.scholarship.findFirst({
        where: { sourceId: testSourceId1 },
      });

      expect(becaConError?.validationErrors).toBeTruthy();
      const errors1 = becaConError?.validationErrors as string[];
      expect(errors1.some((e: string) => e.includes("URL no accesible"))).toBe(
        true,
      );

      // Segunda corrida: ahora mock responde OK
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      }) as typeof fetch;

      await ejecutarIngesta(testSourceId1);

      const becaCorregida = await db.scholarship.findFirst({
        where: { sourceId: testSourceId1 },
      });

      // validationErrors debe ser NULL (Prisma.DbNull)
      expect(becaCorregida?.validationErrors).toBeNull();
    });

    // Test 4: Aislamiento de fuentes
    it("Test 4: una fuente falla, otra guarda becas y ScraperLog FAILED", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      }) as typeof fetch;

      // Lector que falla en obtener()
      class TestLectorFallido implements FuenteLector {
        readonly nombre = "Test DB 1 Fail";
        readonly sourceSlug = "test-db-1";

        async obtener() {
          throw new Error("Error simulado en obtener()");
        }

        normalizar(): BecaCandidata[] {
          return [];
        }
      }

      // Lector que funciona
      class TestLectorExitoso implements FuenteLector {
        readonly nombre = "Test DB 2 Success";
        readonly sourceSlug = "test-db-2";

        async obtener() {
          return Promise.resolve([]);
        }

        normalizar(): BecaCandidata[] {
          return [
            {
              title: "Beca Exitosa Aislada",
              description: "Test aislamiento",
              applyUrl: "https://example.com/exitosa",
              deadline: "2026-12-31",
              amount: "$5,000 MXN",
              coverageType: "MONETARY",
              academicLevel: "UNDERGRAD",
              countryDestination: "México",
              language: null,
              convocante: "Test DB Source 2",
              rawData: { year: 2026 },
            },
          ];
        }
      }

      LECTORES_REGISTRY["test-db-1"] = TestLectorFallido;
      LECTORES_REGISTRY["test-db-2"] = TestLectorExitoso;

      // Ejecutar ambas fuentes específicamente
      const resultado1 = await ejecutarIngesta(testSourceId1);
      const resultado2 = await ejecutarIngesta(testSourceId2);
      const resultados = [...resultado1, ...resultado2];

      // Verificar que source 1 falló
      const result1 = resultados.find((r) => r.sourceId === testSourceId1);
      expect(result1?.status).toBe("FAILED");
      expect(result1?.error).toContain("Error simulado");

      // Verificar que source 2 tuvo éxito
      const result2 = resultados.find((r) => r.sourceId === testSourceId2);
      expect(result2?.status).toBe("SUCCESS");
      expect(result2?.creadas).toBe(1);

      // Verificar beca guardada de source 2
      const becas = await db.scholarship.count({
        where: { sourceId: testSourceId2 },
      });
      expect(becas).toBe(1);

      // Verificar ScraperLog de source 1 en FAILED
      const log1 = await db.scraperLog.findFirst({
        where: { sourceId: testSourceId1 },
        orderBy: { startedAt: "desc" },
      });
      expect(log1?.status).toBe(ScraperRunStatus.FAILED);
      expect(log1?.errorMessage).toContain("Error simulado");

      // Verificar ScraperLog de source 2 en SUCCESS
      const log2 = await db.scraperLog.findFirst({
        where: { sourceId: testSourceId2 },
        orderBy: { startedAt: "desc" },
      });
      expect(log2?.status).toBe(ScraperRunStatus.SUCCESS);
    });

    // Test 5: Fecha inválida y link 404 se guardan con validationErrors
    it("Test 5: fecha inválida y link 404 se guardan como PENDING_REVIEW", async () => {
      // Mock fetch que devuelve 404 para URLs específicos
      global.fetch = vi.fn().mockImplementation((url) => {
        const urlStr = url.toString();
        if (urlStr.includes("fecha-invalida") || urlStr.includes("link-404")) {
          return Promise.resolve({ ok: false, status: 404 });
        }
        return Promise.resolve({ ok: true, status: 200 });
      }) as typeof fetch;

      class TestLector5 implements FuenteLector {
        readonly nombre = "Test DB 1";
        readonly sourceSlug = "test-db-1";

        async obtener() {
          return Promise.resolve([]);
        }

        normalizar(): BecaCandidata[] {
          return [
            {
              title: "Beca Fecha Inválida",
              description: "Test fecha no parseable",
              applyUrl: "https://example.com/fecha-invalida",
              deadline: "fecha no válida xyz",
              amount: "$10,000 MXN",
              coverageType: "MONETARY",
              academicLevel: "MASTERS",
              countryDestination: "México",
              language: null,
              convocante: "Test DB Source 1",
              rawData: { year: 2026 },
            },
            {
              title: "Beca Link 404",
              description: "Test link roto",
              applyUrl: "https://example.com/link-404",
              deadline: "2026-12-31",
              amount: "$5,000 MXN",
              coverageType: "MONETARY",
              academicLevel: "UNDERGRAD",
              countryDestination: "México",
              language: null,
              convocante: "Test DB Source 1",
              rawData: { year: 2026 },
            },
          ];
        }
      }

      LECTORES_REGISTRY["test-db-1"] = TestLector5;

      await ejecutarIngesta(testSourceId1);

      const becas = await db.scholarship.findMany({
        where: { sourceId: testSourceId1 },
        orderBy: { title: "asc" },
      });

      expect(becas.length).toBe(2);

      // Beca con fecha inválida
      const becaFecha = becas.find((b) => b.title === "Beca Fecha Inválida");
      expect(becaFecha?.status).toBe(ScholarshipStatus.PENDING_REVIEW);
      expect(becaFecha?.validationErrors).toBeTruthy();
      const errorsFecha = becaFecha?.validationErrors as string[];
      expect(
        errorsFecha.some((e: string) => e.includes("Formato de fecha")),
      ).toBe(true);

      // Beca con link 404
      const becaLink = becas.find((b) => b.title === "Beca Link 404");
      expect(becaLink?.status).toBe(ScholarshipStatus.PENDING_REVIEW);
      expect(becaLink?.validationErrors).toBeTruthy();
      const errorsLink = becaLink?.validationErrors as string[];
      expect(
        errorsLink.some((e: string) => e.includes("URL no accesible")),
      ).toBe(true);
    });

    // Test 6: Año sin fecha ni conv_year - huella "sin-anio"
    it("Test 6: beca sin fecha usa huella sin-anio y no duplica", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      }) as typeof fetch;

      // Convocante DISTINTO del nombre de la fuente
      const convocante = "Fundación X";

      class TestLector6A implements FuenteLector {
        readonly nombre = "Test DB 1";
        readonly sourceSlug = "test-db-1";

        async obtener() {
          return Promise.resolve([]);
        }

        normalizar(): BecaCandidata[] {
          return [
            {
              title: "Beca Sin Fecha Test",
              description: "Test año sin deadline",
              applyUrl: "https://example.com/sin-fecha",
              deadline: null,
              amount: "$10,000 MXN",
              coverageType: "MONETARY",
              academicLevel: "MASTERS",
              countryDestination: "México",
              language: null,
              convocante,
              // Sin rawData.year
            },
          ];
        }
      }

      LECTORES_REGISTRY["test-db-1"] = TestLector6A;

      // Simular 31 de diciembre de 2026
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-12-31T23:59:59Z"));

      await ejecutarIngesta(testSourceId1);

      const countDic = await db.scholarship.count({
        where: { sourceId: testSourceId1 },
      });
      expect(countDic).toBe(1);

      // Verificar huella sin-anio
      const becaDic = await db.scholarship.findFirst({
        where: { sourceId: testSourceId1 },
      });
      expect(becaDic?.fingerprint).toContain("sin-anio");

      // Simular 1 de enero de 2027
      vi.setSystemTime(new Date("2027-01-01T00:00:01Z"));

      const resultado2 = await ejecutarIngesta(testSourceId1);
      const result2 = resultado2[0];

      // Debe contar como actualizada (no crear nueva)
      expect(result2?.creadas).toBe(0);
      expect(result2?.actualizadas).toBe(1);

      const countEne = await db.scholarship.count({
        where: { sourceId: testSourceId1 },
      });
      expect(countEne).toBe(1); // Sigue siendo solo 1

      // Simular un día normal
      vi.setSystemTime(new Date("2027-02-15T12:00:00Z"));

      const resultado3 = await ejecutarIngesta(testSourceId1);
      const result3 = resultado3[0];

      // Debe contar como actualizada (no crear nueva)
      expect(result3?.creadas).toBe(0);
      expect(result3?.actualizadas).toBe(1);

      const countFeb = await db.scholarship.count({
        where: { sourceId: testSourceId1 },
      });
      expect(countFeb).toBe(1); // Sigue siendo solo 1

      // Caso adicional: ahora la beca trae fecha
      class TestLector6B implements FuenteLector {
        readonly nombre = "Test DB 1";
        readonly sourceSlug = "test-db-1";

        async obtener() {
          return Promise.resolve([]);
        }

        normalizar(): BecaCandidata[] {
          return [
            {
              title: "Beca Sin Fecha Test",
              description: "Ahora con fecha",
              applyUrl: "https://example.com/sin-fecha",
              deadline: "2027-12-31", // AHORA tiene fecha
              amount: "$10,000 MXN",
              coverageType: "MONETARY",
              academicLevel: "MASTERS",
              countryDestination: "México",
              language: null,
              convocante,
            },
          ];
        }
      }

      LECTORES_REGISTRY["test-db-1"] = TestLector6B;

      const resultado4 = await ejecutarIngesta(testSourceId1);
      const result4 = resultado4[0];

      // Debe actualizar la beca existente (no crear nueva)
      expect(result4?.creadas).toBe(0);
      expect(result4?.actualizadas).toBe(1);

      const countFinal = await db.scholarship.count({
        where: { sourceId: testSourceId1 },
      });
      expect(countFinal).toBe(1); // SIGUE siendo solo 1

      // Verificar que la huella se actualizó con el año
      const becaFinal = await db.scholarship.findFirst({
        where: { sourceId: testSourceId1 },
      });
      expect(becaFinal?.fingerprint).toContain("2027");
      expect(becaFinal?.fingerprint).not.toContain("sin-anio");

      vi.useRealTimers();
    });

    // Test 7: HEAD 405 → GET 200 no marca link como roto
    it("Test 7: HEAD 405 seguido de GET 200 no marca link roto", async () => {
      // Mock que responde 405 a HEAD y 200 a GET
      global.fetch = vi.fn().mockImplementation((url, options) => {
        const method = (options as RequestInit)?.method || "GET";
        if (method === "HEAD") {
          return Promise.resolve({ ok: false, status: 405 });
        }
        // GET responde OK
        return Promise.resolve({ ok: true, status: 200 });
      }) as typeof fetch;

      class TestLector7 implements FuenteLector {
        readonly nombre = "Test DB 1";
        readonly sourceSlug = "test-db-1";

        async obtener() {
          return Promise.resolve([]);
        }

        normalizar(): BecaCandidata[] {
          return [
            {
              title: "Beca HEAD 405",
              description: "Test HEAD 405 → GET 200",
              applyUrl: "https://example.com/head-405",
              deadline: "2026-12-31",
              amount: "$10,000 MXN",
              coverageType: "MONETARY",
              academicLevel: "MASTERS",
              countryDestination: "México",
              language: null,
              convocante: "Test DB Source 1",
              rawData: { year: 2026 },
            },
          ];
        }
      }

      LECTORES_REGISTRY["test-db-1"] = TestLector7;

      await ejecutarIngesta(testSourceId1);

      const beca = await db.scholarship.findFirst({
        where: { sourceId: testSourceId1 },
      });

      // No debe tener error de URL en validationErrors
      const errors = (beca?.validationErrors as string[]) || [];
      const tieneErrorUrl = errors.some((e) =>
        e.toString().includes("URL no accesible"),
      );
      expect(tieneErrorUrl).toBe(false);

      // Debe estar guardada sin problema
      expect(beca).toBeTruthy();
      expect(beca?.title).toBe("Beca HEAD 405");
    });
  },
);
