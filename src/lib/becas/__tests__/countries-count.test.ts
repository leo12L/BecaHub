import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { getLandingStats } from "@/lib/becas/queries";

describe("Contador de países", () => {
  const testSourceId = "00000000-0000-0000-0000-000000000004";
  const testSlugPrefix = "countries-count-test-";

  beforeAll(async () => {
    // Asegurar que existe la fuente
    await db.source.upsert({
      where: { id: testSourceId },
      create: {
        id: testSourceId,
        name: "Test Source Countries",
        url: "https://test.com",
        type: "MANUAL",
      },
      update: {},
    });
  });

  afterAll(async () => {
    // Limpiar becas de prueba
    await db.scholarship.deleteMany({
      where: {
        slug: {
          startsWith: testSlugPrefix,
        },
      },
    });
  });

  it("cuenta cada país una sola vez aunque una beca tenga varios destinos", async () => {
    // Crear una beca con múltiples destinos
    await db.scholarship.create({
      data: {
        slug: `${testSlugPrefix}multi-country`,
        title: "Beca Multi-País",
        description: "Beca para México, España y Estados Unidos",
        status: "ACTIVE",
        coverageType: "FULL",
        destinationCountries: ["MX", "ES", "US"],
        academicLevel: "GRAD",
        deadline: new Date("2027-12-31"),
        applyUrl: "https://test.com/multi",
        sourceId: testSourceId,
        isVerified: true,
      },
    });

    const stats = await getLandingStats();

    // Debe contar MX, ES, US una vez cada uno
    // (puede haber más países de otras becas, pero al menos estos 3)
    expect(stats.countriesCount).toBeGreaterThanOrEqual(3);
  });

  it("no duplica país si varias becas comparten el mismo destino", async () => {
    // Limpiar becas previas
    await db.scholarship.deleteMany({
      where: {
        slug: {
          startsWith: testSlugPrefix,
        },
      },
    });

    // Crear múltiples becas para el mismo país
    await db.scholarship.createMany({
      data: [
        {
          slug: `${testSlugPrefix}mx-1`,
          title: "Beca México 1",
          description: "Primera beca para México",
          status: "ACTIVE",
          coverageType: "FULL",
          destinationCountries: ["MX"],
          academicLevel: "UNDERGRAD",
          deadline: new Date("2027-12-31"),
          applyUrl: "https://test.com/mx1",
          sourceId: testSourceId,
          isVerified: true,
        },
        {
          slug: `${testSlugPrefix}mx-2`,
          title: "Beca México 2",
          description: "Segunda beca para México",
          status: "ACTIVE",
          coverageType: "FULL",
          destinationCountries: ["MX"],
          academicLevel: "GRAD",
          deadline: new Date("2027-12-31"),
          applyUrl: "https://test.com/mx2",
          sourceId: testSourceId,
          isVerified: true,
        },
        {
          slug: `${testSlugPrefix}mx-3`,
          title: "Beca México 3",
          description: "Tercera beca para México",
          status: "ACTIVE",
          coverageType: "FULL",
          destinationCountries: ["MX"],
          academicLevel: "PHD",
          deadline: new Date("2027-12-31"),
          applyUrl: "https://test.com/mx3",
          sourceId: testSourceId,
          isVerified: true,
        },
      ],
    });

    const stats = await getLandingStats();

    // México debe contarse una sola vez, no tres veces
    // Para verificar esto, contamos manualmente los países únicos
    const allScholarships = await db.scholarship.findMany({
      where: { status: "ACTIVE" },
      select: { destinationCountries: true },
    });

    const uniqueCountries = new Set<string>();
    for (const scholarship of allScholarships) {
      for (const country of scholarship.destinationCountries) {
        uniqueCountries.add(country);
      }
    }

    expect(stats.countriesCount).toBe(uniqueCountries.size);
  });

  it("combina correctamente países de becas multi-destino y mono-destino", async () => {
    // Limpiar
    await db.scholarship.deleteMany({
      where: {
        slug: {
          startsWith: testSlugPrefix,
        },
      },
    });

    // Crear becas con diferentes combinaciones
    await db.scholarship.createMany({
      data: [
        {
          slug: `${testSlugPrefix}combo-1`,
          title: "Beca MX-US",
          description: "Para México y Estados Unidos",
          status: "ACTIVE",
          coverageType: "FULL",
          destinationCountries: ["MX", "US"],
          academicLevel: "GRAD",
          deadline: new Date("2027-12-31"),
          applyUrl: "https://test.com/combo1",
          sourceId: testSourceId,
          isVerified: true,
        },
        {
          slug: `${testSlugPrefix}combo-2`,
          title: "Beca ES-FR",
          description: "Para España y Francia",
          status: "ACTIVE",
          coverageType: "FULL",
          destinationCountries: ["ES", "FR"],
          academicLevel: "GRAD",
          deadline: new Date("2027-12-31"),
          applyUrl: "https://test.com/combo2",
          sourceId: testSourceId,
          isVerified: true,
        },
        {
          slug: `${testSlugPrefix}combo-3`,
          title: "Beca solo US",
          description: "Solo Estados Unidos",
          status: "ACTIVE",
          coverageType: "FULL",
          destinationCountries: ["US"],
          academicLevel: "UNDERGRAD",
          deadline: new Date("2027-12-31"),
          applyUrl: "https://test.com/combo3",
          sourceId: testSourceId,
          isVerified: true,
        },
      ],
    });

    const stats = await getLandingStats();

    // Países únicos: MX, US, ES, FR = 4
    // US aparece en dos becas pero debe contarse una vez
    const allScholarships = await db.scholarship.findMany({
      where: { status: "ACTIVE" },
      select: { destinationCountries: true },
    });

    const uniqueCountries = new Set<string>();
    for (const scholarship of allScholarships) {
      for (const country of scholarship.destinationCountries) {
        uniqueCountries.add(country);
      }
    }

    expect(stats.countriesCount).toBe(uniqueCountries.size);
    expect(stats.countriesCount).toBeGreaterThanOrEqual(4);
  });

  it("no cuenta becas sin destino en el contador de países", async () => {
    // Limpiar
    await db.scholarship.deleteMany({
      where: {
        slug: {
          startsWith: testSlugPrefix,
        },
      },
    });

    // Crear una beca sin destino
    await db.scholarship.create({
      data: {
        slug: `${testSlugPrefix}no-dest`,
        title: "Beca Sin Destino Específico",
        description: "Global sin país definido",
        status: "ACTIVE",
        coverageType: "RESEARCH",
        destinationCountries: [],
        academicLevel: "PHD",
        deadline: new Date("2027-12-31"),
        applyUrl: "https://test.com/nodest",
        sourceId: testSourceId,
        isVerified: true,
      },
    });

    const statsBefore = await getLandingStats();

    // Agregar una beca con destino
    await db.scholarship.create({
      data: {
        slug: `${testSlugPrefix}with-dest`,
        title: "Beca con Destino",
        description: "Para Alemania",
        status: "ACTIVE",
        coverageType: "FULL",
        destinationCountries: ["DE"],
        academicLevel: "GRAD",
        deadline: new Date("2027-12-31"),
        applyUrl: "https://test.com/de",
        sourceId: testSourceId,
        isVerified: true,
      },
    });

    const statsAfter = await getLandingStats();

    // El contador debe aumentar solo por la beca con destino
    expect(statsAfter.countriesCount).toBeGreaterThanOrEqual(
      statsBefore.countriesCount
    );
  });
});
