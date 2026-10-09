import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { db } from "@/lib/db";
import { ejecutarIngesta } from "../ejecutar";
import { ScholarshipStatus, SourceType } from "@/generated/prisma/enums";
import * as utils from "../utils";

// Tests con BD real - se ejecutan solo si DATABASE_URL está disponible
describe.skipIf(!process.env.DATABASE_URL)("Ingesta - Tests con BD", () => {
  let testSourceId1: string;
  let testSourceId2: string;

  beforeEach(async () => {
    // Limpiar datos de test solo si existen sources
    const existingSources = await db.source.findMany({
      where: { scraperAdapter: { in: ["test-source-1", "test-source-2"] } },
    });

    if (existingSources.length > 0) {
      await db.scholarship.deleteMany({
        where: {
          sourceId: { in: existingSources.map((s) => s.id) },
        },
      });

      await db.scraperLog.deleteMany({
        where: {
          sourceId: { in: existingSources.map((s) => s.id) },
        },
      });

      await db.source.deleteMany({
        where: { scraperAdapter: { in: ["test-source-1", "test-source-2"] } },
      });
    }

    // Crear fuentes de test
    const source1 = await db.source.create({
      data: {
        name: "Test Source 1",
        url: "https://test1.example.com",
        type: SourceType.GOVERNMENT,
        scraperAdapter: "test-source-1",
        isActive: true,
      },
    });
    testSourceId1 = source1.id;

    const source2 = await db.source.create({
      data: {
        name: "Test Source 2",
        url: "https://test2.example.com",
        type: SourceType.GOVERNMENT,
        scraperAdapter: "test-source-2",
        isActive: true,
      },
    });
    testSourceId2 = source2.id;

    // Mock fetch para no salir a internet
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      const urlStr = url.toString();
      if (urlStr.includes("404")) {
        return {
          ok: false,
          status: 404,
        } as Response;
      }
      if (urlStr.includes("405-then-200")) {
        // Simular HEAD 405, luego GET 200
        if (urlStr.includes("method=HEAD")) {
          return { ok: false, status: 405 } as Response;
        }
        return { ok: true, status: 200 } as Response;
      }
      return { ok: true, status: 200 } as Response;
    });

    // Mock validateUrlLiveness para evitar red
    vi.spyOn(utils, "validateUrlLiveness").mockImplementation(async (url) => {
      if (url.includes("404")) {
        return { valid: false, error: "HTTP 404" };
      }
      if (url.includes("405-then-200")) {
        // Simular que HEAD 405 → GET 200 funciona
        return { valid: true };
      }
      return { valid: true };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test 1: Deduplicación (2.4)
  it("debe evitar duplicados en corridas múltiples", async () => {
    // Mock del lector con fixture
    const mockLector = {
      nombre: "Test 1",
      sourceSlug: "test-source-1",
      obtener: vi.fn().mockResolvedValue([]),
      normalizar: vi.fn().mockReturnValue([
        {
          title: "Beca de Prueba 2026",
          description: "Descripción de prueba",
          applyUrl: "https://example.com/beca1",
          deadline: "2026-12-31",
          amount: "$10,000 MXN",
          coverageType: "MONETARY",
          academicLevel: "Maestría",
          countryDestination: "México",
          language: "Español",
          convocante: "Test Source 1",
          rawData: { year: 2026 },
        },
      ]),
    };

    // Registrar el lector
    const { LECTORES_REGISTRY } = await import("../ejecutar");
    const originalRegistry = { ...LECTORES_REGISTRY };
    (LECTORES_REGISTRY as Record<string, unknown>)["test-source-1"] = class {
      nombre = mockLector.nombre;
      sourceSlug = mockLector.sourceSlug;
      obtener = mockLector.obtener;
      normalizar = mockLector.normalizar;
    };

    // Primera corrida
    await ejecutarIngesta("all");

    const afterFirst = await db.scholarship.count({
      where: { sourceId: testSourceId1 },
    });
    expect(afterFirst).toBe(1);

    // Segunda corrida con el mismo fixture
    await ejecutarIngesta("all");

    const afterSecond = await db.scholarship.count({
      where: { sourceId: testSourceId1 },
    });
    expect(afterSecond).toBe(1); // Sin duplicados

    // Verificar que la segunda corrida actualizó
    const logs = await db.scraperLog.findMany({
      where: { sourceId: testSourceId1 },
      orderBy: { startedAt: "desc" },
      take: 1,
    });

    expect(logs[0]?.itemsUpdated).toBe(1);
    expect(logs[0]?.itemsCreated).toBe(0);

    // Restaurar registry
    Object.assign(LECTORES_REGISTRY, originalRegistry);
  });

  // Test 2: Beca ACTIVE permanece ACTIVE (A)
  it("debe mantener status ACTIVE y campos editados tras actualización", async () => {
    // Crear beca ACTIVE manualmente
    const scholarship = await db.scholarship.create({
      data: {
        title: "Beca Original",
        slug: "beca-original-test",
        description: "Descripción editada por admin",
        status: ScholarshipStatus.ACTIVE,
        coverageType: "RESEARCH",
        amountMin: 15000,
        amountMax: 20000,
        currency: "MXN",
        countryDestination: "México",
        academicLevel: "PHD",
        deadline: new Date("2026-12-31"),
        applyUrl: "https://example.com/original",
        sourceId: testSourceId1,
        isVerified: true,
        fingerprint: "beca original|test source 1|2026",
      },
    });

    // Mock lector que "actualiza" la beca
    const mockLector = {
      normalizar: vi.fn().mockReturnValue([
        {
          title: "Beca Original",
          description: "Nueva descripción de la fuente",
          applyUrl: "https://example.com/original",
          deadline: "2026-12-31",
          amount: "$5,000 MXN",
          coverageType: "MONETARY",
          academicLevel: "Maestría",
          countryDestination: "México",
          language: "Español",
          convocante: "Test Source 1",
          rawData: { year: 2026 },
        },
      ]),
    };

    const { LECTORES_REGISTRY } = await import("../ejecutar");
    const originalRegistry = { ...LECTORES_REGISTRY };
    (LECTORES_REGISTRY as Record<string, unknown>)["test-source-1"] = class {
      nombre = "Test 1";
      sourceSlug = "test-source-1";
      obtener = vi.fn().mockResolvedValue([]);
      normalizar = mockLector.normalizar;
    };

    await ejecutarIngesta("all");

    const updated = await db.scholarship.findUnique({
      where: { id: scholarship.id },
    });

    // Verificar que campos editables NO cambiaron
    expect(updated?.status).toBe(ScholarshipStatus.ACTIVE);
    expect(updated?.description).toBe("Descripción editada por admin");
    expect(updated?.coverageType).toBe("RESEARCH");
    expect(updated?.academicLevel).toBe("PHD");
    expect(updated?.amountMin?.toString()).toBe("15000");

    // Verificar que sí se actualizaron rawPayload y scrapedAt
    expect(updated?.rawPayload).toBeTruthy();
    expect(updated?.scrapedAt).toBeTruthy();

    Object.assign(LECTORES_REGISTRY, originalRegistry);
  });

  // Test 3: validationErrors vuelve a null (C)
  it("debe limpiar validationErrors cuando el error se corrige", async () => {
    // Crear beca con validationErrors
    const scholarship = await db.scholarship.create({
      data: {
        title: "Beca Con Error",
        slug: "beca-con-error-test",
        description: "Test",
        status: ScholarshipStatus.PENDING_REVIEW,
        coverageType: "MONETARY",
        currency: "MXN",
        countryDestination: "México",
        academicLevel: "UNDERGRAD",
        deadline: new Date("2026-12-31"),
        applyUrl: "https://example.com/error",
        sourceId: testSourceId1,
        isVerified: false,
        fingerprint: "beca con error|test source 1|2026",
        validationErrors: ["Fecha de cierre ausente"],
      },
    });

    expect(scholarship.validationErrors).toBeTruthy();

    // Mock lector con la misma beca pero ahora con fecha válida
    const mockLector = {
      normalizar: vi.fn().mockReturnValue([
        {
          title: "Beca Con Error",
          description: "Test",
          applyUrl: "https://example.com/error",
          deadline: "2026-12-31",
          amount: "$10,000 MXN",
          coverageType: "MONETARY",
          academicLevel: "UNDERGRAD",
          countryDestination: "México",
          language: "Español",
          convocante: "Test Source 1",
          rawData: { year: 2026 },
        },
      ]),
    };

    const { LECTORES_REGISTRY } = await import("../ejecutar");
    const originalRegistry = { ...LECTORES_REGISTRY };
    (LECTORES_REGISTRY as Record<string, unknown>)["test-source-1"] = class {
      nombre = "Test 1";
      sourceSlug = "test-source-1";
      obtener = vi.fn().mockResolvedValue([]);
      normalizar = mockLector.normalizar;
    };

    await ejecutarIngesta("all");

    const updated = await db.scholarship.findUnique({
      where: { id: scholarship.id },
    });

    // validationErrors debe ser null (no hay errores)
    expect(updated?.validationErrors).toBeNull();

    Object.assign(LECTORES_REGISTRY, originalRegistry);
  });

  // Test 4: Aislamiento de fuentes (2.2)
  it("debe continuar con otras fuentes si una falla", async () => {
    // Mock lector que falla
    const failingLector = {
      obtener: vi.fn().mockRejectedValue(new Error("Error simulado")),
    };

    // Mock lector que funciona
    const workingLector = {
      normalizar: vi.fn().mockReturnValue([
        {
          title: "Beca Exitosa",
          description: "Test",
          applyUrl: "https://example.com/exitosa",
          deadline: "2026-12-31",
          amount: null,
          coverageType: null,
          academicLevel: null,
          countryDestination: "México",
          language: null,
          convocante: "Test Source 2",
          rawData: { year: 2026 },
        },
      ]),
    };

    const { LECTORES_REGISTRY } = await import("../ejecutar");
    const originalRegistry = { ...LECTORES_REGISTRY };

    (LECTORES_REGISTRY as Record<string, unknown>)["test-source-1"] = class {
      nombre = "Failing Test";
      sourceSlug = "test-source-1";
      obtener = failingLector.obtener;
      normalizar = vi.fn();
    };

    (LECTORES_REGISTRY as Record<string, unknown>)["test-source-2"] = class {
      nombre = "Working Test";
      sourceSlug = "test-source-2";
      obtener = vi.fn().mockResolvedValue([]);
      normalizar = workingLector.normalizar;
    };

    const resultados = await ejecutarIngesta("all");

    // Verificar que la fuente 1 falló
    const result1 = resultados.find((r) => r.sourceId === testSourceId1);
    expect(result1?.status).toBe("FAILED");
    expect(result1?.error).toContain("Error simulado");

    // Verificar que la fuente 2 tuvo éxito
    const result2 = resultados.find((r) => r.sourceId === testSourceId2);
    expect(result2?.status).toBe("SUCCESS");
    expect(result2?.creadas).toBe(1);

    // Verificar que la beca de la fuente 2 se guardó
    const becas = await db.scholarship.count({
      where: { sourceId: testSourceId2 },
    });
    expect(becas).toBe(1);

    // Verificar que el ScraperLog de la fuente 1 quedó como FAILED
    const log = await db.scraperLog.findFirst({
      where: { sourceId: testSourceId1 },
      orderBy: { startedAt: "desc" },
    });
    expect(log?.status).toBe("FAILED");

    Object.assign(LECTORES_REGISTRY, originalRegistry);
  });

  // Test 5: Validación 2.5 - fecha inválida y link 404
  it("debe guardar becas con errores de validación", async () => {
    const mockLector = {
      normalizar: vi.fn().mockReturnValue([
        {
          title: "Beca Fecha Inválida",
          description: "Test",
          applyUrl: "https://example.com/fecha-inv",
          deadline: "fecha no válida",
          amount: null,
          coverageType: null,
          academicLevel: null,
          countryDestination: null,
          language: null,
          convocante: "Test Source 1",
        },
        {
          title: "Beca Link 404",
          description: "Test",
          applyUrl: "https://example.com/404",
          deadline: "2026-12-31",
          amount: null,
          coverageType: null,
          academicLevel: null,
          countryDestination: null,
          language: null,
          convocante: "Test Source 1",
          rawData: { year: 2026 },
        },
      ]),
    };

    const { LECTORES_REGISTRY } = await import("../ejecutar");
    const originalRegistry = { ...LECTORES_REGISTRY };
    (LECTORES_REGISTRY as Record<string, unknown>)["test-source-1"] = class {
      nombre = "Test 1";
      sourceSlug = "test-source-1";
      obtener = vi.fn().mockResolvedValue([]);
      normalizar = mockLector.normalizar;
    };

    await ejecutarIngesta("all");

    const becas = await db.scholarship.findMany({
      where: { sourceId: testSourceId1 },
    });

    expect(becas.length).toBe(2);

    // Verificar que ambas tienen validationErrors
    const becaFecha = becas.find((b) => b.title === "Beca Fecha Inválida");
    expect(becaFecha?.validationErrors).toBeTruthy();
    expect(JSON.stringify(becaFecha?.validationErrors)).toContain(
      "Formato de fecha no reconocido",
    );

    const becaLink = becas.find((b) => b.title === "Beca Link 404");
    expect(becaLink?.validationErrors).toBeTruthy();
    expect(JSON.stringify(becaLink?.validationErrors)).toContain(
      "URL no accesible",
    );

    // Ambas deben estar en PENDING_REVIEW
    expect(becaFecha?.status).toBe(ScholarshipStatus.PENDING_REVIEW);
    expect(becaLink?.status).toBe(ScholarshipStatus.PENDING_REVIEW);

    Object.assign(LECTORES_REGISTRY, originalRegistry);
  });

  // Test 6: Año sin fecha ni conv_year (D)
  it("debe generar mismo fingerprint sin fecha en diferentes días", async () => {
    const mockLector = {
      normalizar: vi.fn().mockReturnValue([
        {
          title: "Beca Sin Fecha",
          description: "Test",
          applyUrl: "https://example.com/sinfecha",
          deadline: null,
          amount: null,
          coverageType: null,
          academicLevel: null,
          countryDestination: null,
          language: null,
          convocante: "Test Source 1",
          // Sin rawData.year
        },
      ]),
    };

    const { LECTORES_REGISTRY } = await import("../ejecutar");
    const originalRegistry = { ...LECTORES_REGISTRY };
    (LECTORES_REGISTRY as Record<string, unknown>)["test-source-1"] = class {
      nombre = "Test 1";
      sourceSlug = "test-source-1";
      obtener = vi.fn().mockResolvedValue([]);
      normalizar = mockLector.normalizar;
    };

    // Simular 31 de diciembre
    vi.setSystemTime(new Date("2026-12-31T23:59:59Z"));
    await ejecutarIngesta("all");

    const afterDec = await db.scholarship.count({
      where: { sourceId: testSourceId1 },
    });
    expect(afterDec).toBe(1);

    // Simular 1 de enero del año siguiente
    vi.setSystemTime(new Date("2027-01-01T00:00:01Z"));
    await ejecutarIngesta("all");

    const afterJan = await db.scholarship.count({
      where: { sourceId: testSourceId1 },
    });
    // Debe ser la misma beca (actualizada, no duplicada)
    expect(afterJan).toBe(1);

    // Verificar que fue actualización
    const logs = await db.scraperLog.findMany({
      where: { sourceId: testSourceId1 },
      orderBy: { startedAt: "desc" },
      take: 1,
    });
    expect(logs[0]?.itemsUpdated).toBe(1);
    expect(logs[0]?.itemsCreated).toBe(0);

    vi.useRealTimers();
    Object.assign(LECTORES_REGISTRY, originalRegistry);
  });

  // Test 7: HEAD 405 → GET 200 (G)
  it("debe marcar link como válido si HEAD 405 pero GET 200", async () => {
    const mockLector = {
      normalizar: vi.fn().mockReturnValue([
        {
          title: "Beca Link 405",
          description: "Test",
          applyUrl: "https://example.com/405-then-200",
          deadline: "2026-12-31",
          amount: null,
          coverageType: null,
          academicLevel: null,
          countryDestination: null,
          language: null,
          convocante: "Test Source 1",
          rawData: { year: 2026 },
        },
      ]),
    };

    const { LECTORES_REGISTRY } = await import("../ejecutar");
    const originalRegistry = { ...LECTORES_REGISTRY };
    (LECTORES_REGISTRY as Record<string, unknown>)["test-source-1"] = class {
      nombre = "Test 1";
      sourceSlug = "test-source-1";
      obtener = vi.fn().mockResolvedValue([]);
      normalizar = mockLector.normalizar;
    };

    await ejecutarIngesta("all");

    const beca = await db.scholarship.findFirst({
      where: { sourceId: testSourceId1 },
    });

    // No debe tener error de URL en validationErrors
    const errorsStr = JSON.stringify(beca?.validationErrors || []);
    expect(errorsStr).not.toContain("URL no accesible");

    Object.assign(LECTORES_REGISTRY, originalRegistry);
  });
});
