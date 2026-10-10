import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { REGIONS } from "@/lib/geo";

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)(
  "Scholarship filtering by destination country",
  () => {
    let testSourceId: string;
    let becaEspanaId: string;
    let becaMexicoId: string;
    let becaFranciaId: string;
    let becaUSAId: string;

    beforeAll(async () => {
      const source = await db.source.create({
        data: {
          name: "Test Source Destinations",
          url: "https://test.example.com",
          type: "MANUAL",
        },
      });
      testSourceId = source.id;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Create scholarship for Spain
      const becaEspana = await db.scholarship.create({
        data: {
          title: "Beca para España",
          slug: "beca-espana-test",
          description: "Una beca para estudiar en España",
          status: "ACTIVE",
          coverageType: "FULL",
          destinationCountries: ["ES"],
          academicLevel: "GRAD",
          deadline: tomorrow,
          applyUrl: "https://test.example.com/espana",
          sourceId: testSourceId,
        },
      });
      becaEspanaId = becaEspana.id;

      // Create scholarship for Mexico
      const becaMexico = await db.scholarship.create({
        data: {
          title: "Beca para México",
          slug: "beca-mexico-test",
          description: "Una beca para estudiar en México",
          status: "ACTIVE",
          coverageType: "TUITION",
          destinationCountries: ["MX"],
          academicLevel: "UNDERGRAD",
          deadline: tomorrow,
          applyUrl: "https://test.example.com/mexico",
          sourceId: testSourceId,
        },
      });
      becaMexicoId = becaMexico.id;

      // Create scholarship for France (Europe)
      const becaFrancia = await db.scholarship.create({
        data: {
          title: "Beca para Francia",
          slug: "beca-francia-test",
          description: "Una beca para estudiar en Francia",
          status: "ACTIVE",
          coverageType: "RESEARCH",
          destinationCountries: ["FR"],
          academicLevel: "PHD",
          deadline: tomorrow,
          applyUrl: "https://test.example.com/francia",
          sourceId: testSourceId,
        },
      });
      becaFranciaId = becaFrancia.id;

      // Create scholarship for USA
      const becaUSA = await db.scholarship.create({
        data: {
          title: "Beca para Estados Unidos",
          slug: "beca-usa-test",
          description: "Una beca para estudiar en USA",
          status: "ACTIVE",
          coverageType: "FULL",
          destinationCountries: ["US"],
          academicLevel: "POSTDOC",
          deadline: tomorrow,
          applyUrl: "https://test.example.com/usa",
          sourceId: testSourceId,
        },
      });
      becaUSAId = becaUSA.id;
    });

    afterAll(async () => {
      await db.scholarship.deleteMany({
        where: { sourceId: testSourceId },
      });
      await db.source.delete({
        where: { id: testSourceId },
      });
    });

    it("should filter scholarships by country code ES (España)", async () => {
      const result = await db.scholarship.findMany({
        where: {
          status: "ACTIVE",
          destinationCountries: {
            has: "ES",
          },
        },
      });

      const ids = result.map((s) => s.id);
      expect(ids).toContain(becaEspanaId);
      expect(ids).not.toContain(becaMexicoId);
      expect(ids).not.toContain(becaUSAId);
    });

    it("should filter scholarships by country code MX (México)", async () => {
      const result = await db.scholarship.findMany({
        where: {
          status: "ACTIVE",
          destinationCountries: {
            has: "MX",
          },
        },
      });

      const ids = result.map((s) => s.id);
      expect(ids).toContain(becaMexicoId);
      expect(ids).not.toContain(becaEspanaId);
      expect(ids).not.toContain(becaUSAId);
    });

    it("should filter scholarships by region Europa", async () => {
      const europeanCountries = REGIONS.europa;

      const result = await db.scholarship.findMany({
        where: {
          status: "ACTIVE",
          destinationCountries: {
            hasSome: europeanCountries,
          },
        },
      });

      const ids = result.map((s) => s.id);
      // España and Francia are in Europe
      expect(ids).toContain(becaEspanaId);
      expect(ids).toContain(becaFranciaId);
      // México and USA are not
      expect(ids).not.toContain(becaMexicoId);
      expect(ids).not.toContain(becaUSAId);
    });

    it("should filter scholarships by region América del Norte", async () => {
      const northAmericanCountries = REGIONS["américa del norte"];

      const result = await db.scholarship.findMany({
        where: {
          status: "ACTIVE",
          destinationCountries: {
            hasSome: northAmericanCountries,
          },
        },
      });

      const ids = result.map((s) => s.id);
      // USA is in North America
      expect(ids).toContain(becaUSAId);
      // España, Francia, and México are not
      expect(ids).not.toContain(becaEspanaId);
      expect(ids).not.toContain(becaFranciaId);
      expect(ids).not.toContain(becaMexicoId);
    });

    it("should find scholarships with multiple destination countries", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Create a scholarship for both Spain and France
      const multiCountry = await db.scholarship.create({
        data: {
          title: "Beca España y Francia",
          slug: "beca-multi-country-test",
          description: "Una beca para España o Francia",
          status: "ACTIVE",
          coverageType: "MONETARY",
          destinationCountries: ["ES", "FR"],
          academicLevel: "UNDERGRAD",
          deadline: tomorrow,
          applyUrl: "https://test.example.com/multi",
          sourceId: testSourceId,
        },
      });

      // Should appear in both ES and FR filters
      const resultES = await db.scholarship.findMany({
        where: {
          status: "ACTIVE",
          destinationCountries: {
            has: "ES",
          },
        },
      });

      const resultFR = await db.scholarship.findMany({
        where: {
          status: "ACTIVE",
          destinationCountries: {
            has: "FR",
          },
        },
      });

      const idsES = resultES.map((s) => s.id);
      const idsFR = resultFR.map((s) => s.id);

      expect(idsES).toContain(multiCountry.id);
      expect(idsFR).toContain(multiCountry.id);

      await db.scholarship.delete({ where: { id: multiCountry.id } });
    });
  },
);
