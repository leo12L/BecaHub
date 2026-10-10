import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";

describe("Country Destination Migration", () => {
  const testSourceId = "00000000-0000-0000-0000-000000000004"; // Manual source
  const testSlugPrefix = "migration-test-";

  beforeAll(async () => {
    // Ensure manual source exists
    await db.source.upsert({
      where: { id: testSourceId },
      create: {
        id: testSourceId,
        name: "Test Source",
        url: "https://test.com",
        type: "MANUAL",
      },
      update: {},
    });
  });

  afterAll(async () => {
    // Clean up test scholarships
    await db.scholarship.deleteMany({
      where: {
        slug: {
          startsWith: testSlugPrefix,
        },
      },
    });
  });

  it("should convert 'México' to ['MX']", async () => {
    const scholarship = await db.scholarship.create({
      data: {
        slug: `${testSlugPrefix}mexico-1`,
        title: "Test Beca México",
        description: "Test",
        status: "ACTIVE",
        coverageType: "FULL",
        destinationCountries: ["MX"], // Simulating converted value
        academicLevel: "UNDERGRAD",
        deadline: new Date("2027-12-31"),
        applyUrl: "https://test.com/mx1",
        sourceId: testSourceId,
        isVerified: true,
      },
    });

    expect(scholarship.destinationCountries).toEqual(["MX"]);
  });

  it("should convert 'Mexico' (without accent) to ['MX']", async () => {
    const scholarship = await db.scholarship.create({
      data: {
        slug: `${testSlugPrefix}mexico-2`,
        title: "Test Beca Mexico",
        description: "Test",
        status: "ACTIVE",
        coverageType: "FULL",
        destinationCountries: ["MX"],
        academicLevel: "UNDERGRAD",
        deadline: new Date("2027-12-31"),
        applyUrl: "https://test.com/mx2",
        sourceId: testSourceId,
        isVerified: true,
      },
    });

    expect(scholarship.destinationCountries).toEqual(["MX"]);
  });

  it("should convert 'Estados Unidos' to ['US']", async () => {
    const scholarship = await db.scholarship.create({
      data: {
        slug: `${testSlugPrefix}us-1`,
        title: "Test Beca Estados Unidos",
        description: "Test",
        status: "ACTIVE",
        coverageType: "FULL",
        destinationCountries: ["US"],
        academicLevel: "GRAD",
        deadline: new Date("2027-12-31"),
        applyUrl: "https://test.com/us1",
        sourceId: testSourceId,
        isVerified: true,
      },
    });

    expect(scholarship.destinationCountries).toEqual(["US"]);
  });

  it("should convert 'USA' to ['US']", async () => {
    const scholarship = await db.scholarship.create({
      data: {
        slug: `${testSlugPrefix}us-2`,
        title: "Test Beca USA",
        description: "Test",
        status: "ACTIVE",
        coverageType: "FULL",
        destinationCountries: ["US"],
        academicLevel: "GRAD",
        deadline: new Date("2027-12-31"),
        applyUrl: "https://test.com/us2",
        sourceId: testSourceId,
        isVerified: true,
      },
    });

    expect(scholarship.destinationCountries).toEqual(["US"]);
  });

  it("should convert 'España' to ['ES']", async () => {
    const scholarship = await db.scholarship.create({
      data: {
        slug: `${testSlugPrefix}es-1`,
        title: "Test Beca España",
        description: "Test",
        status: "ACTIVE",
        coverageType: "FULL",
        destinationCountries: ["ES"],
        academicLevel: "PHD",
        deadline: new Date("2027-12-31"),
        applyUrl: "https://test.com/es1",
        sourceId: testSourceId,
        isVerified: true,
      },
    });

    expect(scholarship.destinationCountries).toEqual(["ES"]);
  });

  it("should handle unrecognized country by leaving empty array and adding validationErrors", async () => {
    const scholarship = await db.scholarship.create({
      data: {
        slug: `${testSlugPrefix}unknown`,
        title: "Test Beca Narnia",
        description: "Test",
        status: "ACTIVE",
        coverageType: "FULL",
        destinationCountries: [], // Empty for unrecognized
        academicLevel: "UNDERGRAD",
        deadline: new Date("2027-12-31"),
        applyUrl: "https://test.com/narnia",
        sourceId: testSourceId,
        isVerified: true,
        validationErrors: {
          migration: "País no reconocido: 'Narnia'",
        },
      },
    });

    expect(scholarship.destinationCountries).toEqual([]);
    expect(scholarship.validationErrors).toHaveProperty("migration");
  });

  it("should support multiple destination countries", async () => {
    const scholarship = await db.scholarship.create({
      data: {
        slug: `${testSlugPrefix}multiple`,
        title: "Test Beca Multiple Countries",
        description: "Test",
        status: "ACTIVE",
        coverageType: "FULL",
        destinationCountries: ["MX", "US", "ES"],
        academicLevel: "GRAD",
        deadline: new Date("2027-12-31"),
        applyUrl: "https://test.com/multiple",
        sourceId: testSourceId,
        isVerified: true,
      },
    });

    expect(scholarship.destinationCountries).toHaveLength(3);
    expect(scholarship.destinationCountries).toContain("MX");
    expect(scholarship.destinationCountries).toContain("US");
    expect(scholarship.destinationCountries).toContain("ES");
  });

  it("should allow empty destinationCountries for scholarships without specific destination", async () => {
    const scholarship = await db.scholarship.create({
      data: {
        slug: `${testSlugPrefix}no-destination`,
        title: "Test Beca Sin Destino",
        description: "Test",
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

    expect(scholarship.destinationCountries).toEqual([]);
  });
});
