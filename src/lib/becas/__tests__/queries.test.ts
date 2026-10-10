import { describe, it, expect, beforeAll, afterAll, vi, beforeEach, afterEach } from "vitest";
import { db } from "@/lib/db";
import { getBecas } from "../queries";
import { componentsToMexicoMidnight } from "@/lib/fechas";

// Skip tests if DATABASE_URL is not set
const shouldSkip = !process.env.DATABASE_URL;

describe.skipIf(shouldSkip)("getBecas - deadline filtering", () => {
  let sourceId: string;
  let todayBecaId: string;
  let tomorrowBecaId: string;
  let yesterdayBecaId: string;

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
    // Crear una fuente de prueba
    const source = await db.source.create({
      data: {
        name: "Test Source",
        url: "https://example.com",
        type: "MANUAL",
      },
    });
    sourceId = source.id;

    // Usar componentsToMexicoMidnight para crear fechas consistentes
    // Hoy: 2026-10-09 (fijado por vi.setSystemTime)
    const todayMexico = componentsToMexicoMidnight(2026, 10, 9);
    const yesterday = componentsToMexicoMidnight(2026, 10, 8);
    const tomorrow = componentsToMexicoMidnight(2026, 10, 10);

    // Crear becas de prueba
    const todayBeca = await db.scholarship.create({
      data: {
        title: "Beca que cierra hoy",
        slug: "beca-cierra-hoy-test",
        description: "Test",
        status: "ACTIVE",
        coverageType: "MONETARY",
        countryDestination: "México",
        academicLevel: "UNDERGRAD",
        applyUrl: "https://example.com/today",
        sourceId,
        deadline: todayMexico,
      },
    });
    todayBecaId = todayBeca.id;

    const tomorrowBeca = await db.scholarship.create({
      data: {
        title: "Beca que cierra mañana",
        slug: "beca-cierra-manana-test",
        description: "Test",
        status: "ACTIVE",
        coverageType: "MONETARY",
        countryDestination: "México",
        academicLevel: "UNDERGRAD",
        applyUrl: "https://example.com/tomorrow",
        sourceId,
        deadline: tomorrow,
      },
    });
    tomorrowBecaId = tomorrowBeca.id;

    const yesterdayBeca = await db.scholarship.create({
      data: {
        title: "Beca que cerró ayer",
        slug: "beca-cerro-ayer-test",
        description: "Test",
        status: "ACTIVE",
        coverageType: "MONETARY",
        countryDestination: "México",
        academicLevel: "UNDERGRAD",
        applyUrl: "https://example.com/yesterday",
        sourceId,
        deadline: yesterday,
      },
    });
    yesterdayBecaId = yesterdayBeca.id;
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await db.scholarship.deleteMany({
      where: { id: { in: [todayBecaId, tomorrowBecaId, yesterdayBecaId] } },
    });
    await db.source.delete({ where: { id: sourceId } });
  });

  it("debe mostrar beca que cierra hoy", async () => {
    const result = await getBecas({ status: "ACTIVE", page: 1, limit: 100 });
    const ids = result.data.map((b) => b.id);
    expect(ids).toContain(todayBecaId);
  });

  it("debe mostrar beca que cierra mañana", async () => {
    const result = await getBecas({ status: "ACTIVE", page: 1, limit: 100 });
    const ids = result.data.map((b) => b.id);
    expect(ids).toContain(tomorrowBecaId);
  });

  it("NO debe mostrar beca que cerró ayer", async () => {
    const result = await getBecas({ status: "ACTIVE", page: 1, limit: 100 });
    const ids = result.data.map((b) => b.id);
    expect(ids).not.toContain(yesterdayBecaId);
  });

  it("debe ocultar becas vencidas incluso sin especificar status", async () => {
    const result = await getBecas({ page: 1, limit: 100 });
    const ids = result.data.map((b) => b.id);
    expect(ids).toContain(todayBecaId);
    expect(ids).toContain(tomorrowBecaId);
    expect(ids).not.toContain(yesterdayBecaId);
  });

  it("debe ocultar becas vencidas con búsqueda de texto", async () => {
    const result = await getBecas({
      page: 1,
      limit: 100,
      search: "beca",
    });
    const ids = result.data.map((b) => b.id);
    expect(ids).toContain(todayBecaId);
    expect(ids).toContain(tomorrowBecaId);
    expect(ids).not.toContain(yesterdayBecaId);
  });

  it("debe combinar búsqueda de texto con filtro de fecha usando AND", async () => {
    const result = await getBecas({
      page: 1,
      limit: 100,
      search: "mañana",
    });
    const ids = result.data.map((b) => b.id);
    // Solo la beca de mañana contiene "mañana" en el título
    expect(ids).toContain(tomorrowBecaId);
    expect(ids).not.toContain(todayBecaId);
    expect(ids).not.toContain(yesterdayBecaId);
  });
});
