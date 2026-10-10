import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { SourceType } from "@/generated/prisma/enums";
import { ejecutarIngesta, LECTORES_REGISTRY } from "../ejecutar";
import type { BecaCandidata, FuenteLector } from "../types";

const ADAPTER = "test-destino-vacio";

describe.skipIf(!process.env.DATABASE_URL)(
  "Ingesta: destino vacío o no reconocido nunca es México",
  () => {
    let sourceId: string;
    let originalFetch: typeof fetch;

    beforeEach(async () => {
      const leftovers = await db.source.findMany({
        where: { scraperAdapter: ADAPTER },
      });
      if (leftovers.length > 0) {
        await db.scholarship.deleteMany({
          where: { sourceId: { in: leftovers.map((s) => s.id) } },
        });
        await db.scraperLog.deleteMany({
          where: { sourceId: { in: leftovers.map((s) => s.id) } },
        });
        await db.source.deleteMany({
          where: { id: { in: leftovers.map((s) => s.id) } },
        });
      }

      const source = await db.source.create({
        data: {
          name: "Test destino vacío",
          url: "https://test-destino-vacio.example.com",
          type: SourceType.GOVERNMENT,
          scraperAdapter: ADAPTER,
          isActive: true,
        },
      });
      sourceId = source.id;
      originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      }) as typeof fetch;
    });

    afterEach(async () => {
      delete LECTORES_REGISTRY[ADAPTER];
      vi.restoreAllMocks();
      global.fetch = originalFetch;
      await db.scholarship.deleteMany({ where: { sourceId } });
      await db.scraperLog.deleteMany({ where: { sourceId } });
      await db.source.deleteMany({ where: { id: sourceId } });
    });

    function registrar(beca: BecaCandidata) {
      class Lector implements FuenteLector {
        readonly nombre = "Test destino";
        readonly sourceSlug = ADAPTER;
        async obtener() {
          return Promise.resolve([]);
        }
        normalizar(): BecaCandidata[] {
          return [beca];
        }
      }
      LECTORES_REGISTRY[ADAPTER] = Lector;
    }

    function base(over: Partial<BecaCandidata>): BecaCandidata {
      return {
        title: "Beca destino test",
        description: "Ingesta destino",
        applyUrl: "https://example.com/destino-test",
        deadline: "2027-12-31",
        amount: null,
        coverageType: "RESEARCH",
        academicLevel: "PHD",
        countryDestination: null,
        language: null,
        convocante: "Test destino",
        rawData: { year: 2027 },
        ...over,
      };
    }

    it("destino vacío queda {} con validationError, nunca [MX]", async () => {
      registrar(
        base({
          title: "Beca destino vacío",
          countryDestination: "",
        }),
      );

      await ejecutarIngesta(sourceId);
      const beca = await db.scholarship.findFirst({
        where: { sourceId, title: "Beca destino vacío" },
      });

      expect(beca).toBeTruthy();
      expect(beca!.destinationCountries).toEqual([]);
      expect(beca!.destinationCountries).not.toEqual(["MX"]);
      const errors = (beca!.validationErrors as string[]) ?? [];
      expect(
        errors.some((e) => e.includes("No se pudo mapear el país de destino")),
      ).toBe(true);
      expect(errors.some((e) => /suposici[oó]n: país m[eé]xico/i.test(e))).toBe(
        false,
      );
    });

    it("Europa queda {} con validationError, nunca [MX]", async () => {
      registrar(
        base({
          title: "Beca destino Europa",
          countryDestination: "Europa",
        }),
      );

      await ejecutarIngesta(sourceId);
      const beca = await db.scholarship.findFirst({
        where: { sourceId, title: "Beca destino Europa" },
      });

      expect(beca).toBeTruthy();
      expect(beca!.destinationCountries).toEqual([]);
      expect(beca!.destinationCountries).not.toContain("MX");
      const errors = (beca!.validationErrors as string[]) ?? [];
      expect(
        errors.some((e) =>
          e.includes('No se pudo mapear el país de destino: "Europa"'),
        ),
      ).toBe(true);
    });
  },
);
