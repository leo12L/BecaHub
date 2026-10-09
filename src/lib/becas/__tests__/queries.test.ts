import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { getBecas } from "../queries";

describe("getBecas - deadline filtering", () => {
  let sourceId: string;
  let todayBecaId: string;
  let tomorrowBecaId: string;
  let yesterdayBecaId: string;

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

    // Obtener fecha de hoy en Mexico City
    const now = new Date();
    const mexicoTimeString = now.toLocaleString("en-US", {
      timeZone: "America/Mexico_City",
    });
    const todayMexico = new Date(mexicoTimeString);
    todayMexico.setHours(0, 0, 0, 0);

    const yesterday = new Date(todayMexico);
    yesterday.setDate(yesterday.getDate() - 1);

    const tomorrow = new Date(todayMexico);
    tomorrow.setDate(tomorrow.getDate() + 1);

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

  it("debe mostrar todas las becas si no se especifica status ACTIVE", async () => {
    const result = await getBecas({ page: 1, limit: 100 });
    const ids = result.data.map((b) => b.id);
    expect(ids).toContain(todayBecaId);
    expect(ids).toContain(tomorrowBecaId);
    expect(ids).toContain(yesterdayBecaId);
  });
});
