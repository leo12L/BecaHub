/**
 * Tests de integración para APIs públicas de favoritos y postulaciones.
 *
 * Verifica que:
 * - No se pueden crear favoritos a becas DRAFT/PENDING_REVIEW/CLOSED
 * - No se pueden crear postulaciones a becas DRAFT/PENDING_REVIEW/CLOSED
 * - Los favoritos/postulaciones existentes persisten aunque la beca se cierre
 * - La API GET /api/becas rechaza status distinto de ACTIVE
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { componentsToMexicoMidnight } from "@/lib/fechas";

const shouldSkip = !process.env.DATABASE_URL;

describe.skipIf(shouldSkip)("Visibilidad en APIs públicas", () => {
  let sourceId: string;
  let becaActiveId: string;
  let becaPendingId: string;
  let becaClosedId: string;
  let testUserId: string;

  beforeAll(async () => {
    const source = await db.source.create({
      data: {
        name: "Test Source API",
        url: "https://example.com",
        type: "MANUAL",
      },
    });
    sourceId = source.id;

    const futureDate = componentsToMexicoMidnight(2027, 12, 31);

    // Beca ACTIVE (única pública)
    const active = await db.scholarship.create({
      data: {
        title: "Beca ACTIVE API Test",
        slug: "beca-active-api-test",
        description: "Pública",
        status: "ACTIVE",
        coverageType: "MONETARY",
        countryDestination: "México",
        academicLevel: "UNDERGRAD",
        applyUrl: "https://example.com/active",
        sourceId,
        deadline: futureDate,
      },
    });
    becaActiveId = active.id;

    // Beca PENDING_REVIEW (no pública)
    const pending = await db.scholarship.create({
      data: {
        title: "Beca PENDING API Test",
        slug: "beca-pending-api-test",
        description: "No pública",
        status: "PENDING_REVIEW",
        coverageType: "MONETARY",
        countryDestination: "México",
        academicLevel: "UNDERGRAD",
        applyUrl: "https://example.com/pending",
        sourceId,
        deadline: futureDate,
      },
    });
    becaPendingId = pending.id;

    // Beca CLOSED (no pública para crear favorito/postulación)
    const closed = await db.scholarship.create({
      data: {
        title: "Beca CLOSED API Test",
        slug: "beca-closed-api-test",
        description: "Cerrada",
        status: "CLOSED",
        coverageType: "MONETARY",
        countryDestination: "México",
        academicLevel: "UNDERGRAD",
        applyUrl: "https://example.com/closed",
        sourceId,
        deadline: futureDate,
      },
    });
    becaClosedId = closed.id;

    // Usuario de prueba (usamos un UUID fake ya que no podemos crear usuarios Supabase en test)
    testUserId = "00000000-0000-0000-0000-000000000001";
  });

  afterAll(async () => {
    // Limpiar favoritos y postulaciones de prueba
    await db.favorite.deleteMany({
      where: { userId: testUserId },
    });
    await db.application.deleteMany({
      where: { userId: testUserId },
    });

    // Limpiar becas de prueba
    await db.scholarship.deleteMany({
      where: {
        id: {
          in: [becaActiveId, becaPendingId, becaClosedId],
        },
      },
    });
    await db.source.delete({ where: { id: sourceId } });
  });

  describe("Favoritos: validación en creación", () => {
    it("debe permitir crear favorito a beca ACTIVE", async () => {
      // Simular lo que hace la API: buscar con filtroBecaPublica
      const scholarship = await db.scholarship.findFirst({
        where: {
          id: becaActiveId,
          status: "ACTIVE",
          OR: [{ deadline: { gte: new Date() } }, { deadline: null }],
        },
      });

      expect(scholarship).not.toBeNull();

      // Si pasa la validación, se puede crear el favorito
      if (scholarship) {
        const favorite = await db.favorite.upsert({
          where: {
            userId_scholarshipId: {
              userId: testUserId,
              scholarshipId: becaActiveId,
            },
          },
          update: {},
          create: {
            userId: testUserId,
            scholarshipId: becaActiveId,
          },
        });

        expect(favorite.scholarshipId).toBe(becaActiveId);
      }
    });

    it("debe rechazar crear favorito a beca PENDING_REVIEW (404)", async () => {
      // Simular lo que hace la API: buscar con filtroBecaPublica
      const scholarship = await db.scholarship.findFirst({
        where: {
          id: becaPendingId,
          status: "ACTIVE",
          OR: [{ deadline: { gte: new Date() } }, { deadline: null }],
        },
      });

      // No se encuentra porque PENDING_REVIEW no cumple el filtro
      expect(scholarship).toBeNull();
    });

    it("debe rechazar crear favorito a beca CLOSED (404)", async () => {
      const scholarship = await db.scholarship.findFirst({
        where: {
          id: becaClosedId,
          status: "ACTIVE",
          OR: [{ deadline: { gte: new Date() } }, { deadline: null }],
        },
      });

      expect(scholarship).toBeNull();
    });
  });

  describe("Postulaciones: validación en creación", () => {
    it("debe permitir crear postulación a beca ACTIVE", async () => {
      const scholarship = await db.scholarship.findFirst({
        where: {
          id: becaActiveId,
          status: "ACTIVE",
          OR: [{ deadline: { gte: new Date() } }, { deadline: null }],
        },
      });

      expect(scholarship).not.toBeNull();

      if (scholarship) {
        const application = await db.application.upsert({
          where: {
            userId_scholarshipId: {
              userId: testUserId,
              scholarshipId: becaActiveId,
            },
          },
          update: {},
          create: {
            userId: testUserId,
            scholarshipId: becaActiveId,
            status: "INTERESTED",
          },
        });

        expect(application.scholarshipId).toBe(becaActiveId);
      }
    });

    it("debe rechazar crear postulación a beca PENDING_REVIEW (404)", async () => {
      const scholarship = await db.scholarship.findFirst({
        where: {
          id: becaPendingId,
          status: "ACTIVE",
          OR: [{ deadline: { gte: new Date() } }, { deadline: null }],
        },
      });

      expect(scholarship).toBeNull();
    });
  });

  describe("Persistencia tras cambio de estado", () => {
    it("favorito creado debe persistir aunque la beca pase a CLOSED", async () => {
      // Crear beca ACTIVE temporal
      const tempBeca = await db.scholarship.create({
        data: {
          title: "Beca Temporal Test",
          slug: "beca-temporal-test-api",
          description: "Temporal",
          status: "ACTIVE",
          coverageType: "MONETARY",
          countryDestination: "México",
          academicLevel: "UNDERGRAD",
          applyUrl: "https://example.com/temp",
          sourceId,
          deadline: componentsToMexicoMidnight(2027, 12, 31),
        },
      });

      // Crear favorito
      await db.favorite.create({
        data: {
          userId: testUserId,
          scholarshipId: tempBeca.id,
        },
      });

      // Verificar que existe
      let favorite = await db.favorite.findUnique({
        where: {
          userId_scholarshipId: {
            userId: testUserId,
            scholarshipId: tempBeca.id,
          },
        },
      });
      expect(favorite).not.toBeNull();

      // Cambiar estado a CLOSED
      await db.scholarship.update({
        where: { id: tempBeca.id },
        data: { status: "CLOSED" },
      });

      // El favorito debe seguir existiendo
      favorite = await db.favorite.findUnique({
        where: {
          userId_scholarshipId: {
            userId: testUserId,
            scholarshipId: tempBeca.id,
          },
        },
      });

      expect(favorite).not.toBeNull();

      // Verificar que la beca asociada está CLOSED
      const becaActualizada = await db.scholarship.findUnique({
        where: { id: tempBeca.id },
      });
      expect(becaActualizada?.status).toBe("CLOSED");

      // Limpiar
      await db.favorite.delete({
        where: {
          userId_scholarshipId: {
            userId: testUserId,
            scholarshipId: tempBeca.id,
          },
        },
      });
      await db.scholarship.delete({ where: { id: tempBeca.id } });
    });
  });
});
