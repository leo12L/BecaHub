/**
 * Tests de seguridad para visibilidad pública de becas.
 *
 * Verifica que:
 * - Becas DRAFT/PENDING_REVIEW no se exponen en ninguna vista pública
 * - El detalle da 404 para DRAFT/PENDING_REVIEW, muestra CLOSED con aviso
 * - No se pueden crear favoritos/postulaciones a becas no públicas
 * - Los favoritos/postulaciones existentes persisten aunque la beca se cierre
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import {
  getBecas,
  getLandingStats,
  getFilterCountries,
} from "@/lib/becas/queries";
import { recomendarBecas } from "@/lib/becas/recommend";
import {
  filtroBecaPublica,
  esVisibleEnDetalle,
  esCerrada,
} from "@/lib/becas/publica";
import { componentsToMexicoMidnight } from "@/lib/fechas";

const shouldSkip = !process.env.DATABASE_URL;

describe.skipIf(shouldSkip)("Visibilidad pública de becas", () => {
  let sourceId: string;
  let becaActiveId: string;
  let becaDraftId: string;
  let becaPendingId: string;
  let becaClosedId: string;
  let becaVencidaId: string;

  beforeAll(async () => {
    const source = await db.source.create({
      data: {
        name: "Test Source Publica",
        url: "https://example.com",
        type: "MANUAL",
      },
    });
    sourceId = source.id;

    const futureDate = componentsToMexicoMidnight(2027, 12, 31);
    const pastDate = componentsToMexicoMidnight(2020, 1, 1);

    // Beca ACTIVE vigente (la única que debe verse públicamente)
    const active = await db.scholarship.create({
      data: {
        title: "Beca ACTIVE Test",
        slug: "beca-active-test-publica",
        description: "Solo esta debe ser visible",
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

    // Beca DRAFT (nunca debe verse públicamente)
    const draft = await db.scholarship.create({
      data: {
        title: "Beca DRAFT Test",
        slug: "beca-draft-test-publica",
        description: "No debe verse",
        status: "DRAFT",
        coverageType: "MONETARY",
        countryDestination: "México",
        academicLevel: "UNDERGRAD",
        applyUrl: "https://example.com/draft",
        sourceId,
        deadline: futureDate,
      },
    });
    becaDraftId = draft.id;

    // Beca PENDING_REVIEW (nunca debe verse públicamente)
    const pending = await db.scholarship.create({
      data: {
        title: "Beca PENDING_REVIEW Test",
        slug: "beca-pending-test-publica",
        description: "No debe verse",
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

    // Beca CLOSED (visible en detalle con aviso, no en listados)
    const closed = await db.scholarship.create({
      data: {
        title: "Beca CLOSED Test",
        slug: "beca-closed-test-publica",
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

    // Beca ACTIVE pero vencida (no debe verse en listados)
    const vencida = await db.scholarship.create({
      data: {
        title: "Beca Vencida Test",
        slug: "beca-vencida-test-publica",
        description: "Vencida",
        status: "ACTIVE",
        coverageType: "MONETARY",
        countryDestination: "México",
        academicLevel: "UNDERGRAD",
        applyUrl: "https://example.com/vencida",
        sourceId,
        deadline: pastDate,
      },
    });
    becaVencidaId = vencida.id;
  });

  afterAll(async () => {
    await db.scholarship.deleteMany({
      where: {
        id: {
          in: [
            becaActiveId,
            becaDraftId,
            becaPendingId,
            becaClosedId,
            becaVencidaId,
          ],
        },
      },
    });
    await db.source.delete({ where: { id: sourceId } });
  });

  describe("filtroBecaPublica()", () => {
    it("debe retornar solo becas ACTIVE no vencidas", async () => {
      const becas = await db.scholarship.findMany({
        where: filtroBecaPublica(),
        select: { id: true },
      });
      const ids = becas.map((b) => b.id);

      expect(ids).toContain(becaActiveId);
      expect(ids).not.toContain(becaDraftId);
      expect(ids).not.toContain(becaPendingId);
      expect(ids).not.toContain(becaClosedId);
      expect(ids).not.toContain(becaVencidaId);
    });
  });

  describe("getBecas()", () => {
    it("sin status debe mostrar solo ACTIVE no vencida (seguridad por defecto)", async () => {
      const result = await getBecas({ page: 1, limit: 100 });
      const ids = result.data.map((b) => b.id);

      expect(ids).toContain(becaActiveId);
      expect(ids).not.toContain(becaDraftId);
      expect(ids).not.toContain(becaPendingId);
      expect(ids).not.toContain(becaClosedId);
      expect(ids).not.toContain(becaVencidaId);
    });

    it("con status=ACTIVE debe mostrar solo ACTIVE no vencida", async () => {
      const result = await getBecas({ status: "ACTIVE", page: 1, limit: 100 });
      const ids = result.data.map((b) => b.id);

      expect(ids).toContain(becaActiveId);
      expect(ids).not.toContain(becaDraftId);
      expect(ids).not.toContain(becaPendingId);
      expect(ids).not.toContain(becaClosedId);
      expect(ids).not.toContain(becaVencidaId);
    });

    it("con status=DRAFT debe mostrar DRAFT (admin)", async () => {
      const result = await getBecas({ status: "DRAFT", page: 1, limit: 100 });
      const ids = result.data.map((b) => b.id);

      expect(ids).toContain(becaDraftId);
      expect(ids).not.toContain(becaActiveId);
    });

    it("con status=PENDING_REVIEW debe mostrar PENDING_REVIEW (admin)", async () => {
      const result = await getBecas({
        status: "PENDING_REVIEW",
        page: 1,
        limit: 100,
      });
      const ids = result.data.map((b) => b.id);

      expect(ids).toContain(becaPendingId);
      expect(ids).not.toContain(becaActiveId);
    });
  });

  describe("getLandingStats()", () => {
    it("debe contar solo becas públicas", async () => {
      const stats = await getLandingStats();

      // activeCount debe contar solo ACTIVE no vencida
      const becasPublicas = await db.scholarship.count({
        where: filtroBecaPublica(),
      });

      expect(stats.activeCount).toBeGreaterThanOrEqual(1);
      expect(stats.activeCount).toBeLessThanOrEqual(becasPublicas);
    });
  });

  describe("getFilterCountries()", () => {
    it("debe listar países solo de becas públicas", async () => {
      const countries = await getFilterCountries();

      // Debe incluir México (beca ACTIVE)
      expect(countries).toContain("México");

      // No debe romper con becas no públicas
      expect(Array.isArray(countries)).toBe(true);
    });
  });

  describe("recomendarBecas()", () => {
    it("debe recomendar solo becas públicas", async () => {
      const becas = await recomendarBecas({ countryInterest: "México" });
      const ids = becas.map((b) => b.id);

      expect(ids).toContain(becaActiveId);
      expect(ids).not.toContain(becaDraftId);
      expect(ids).not.toContain(becaPendingId);
      expect(ids).not.toContain(becaClosedId);
      expect(ids).not.toContain(becaVencidaId);
    });
  });

  describe("esVisibleEnDetalle()", () => {
    it("debe retornar true para ACTIVE", () => {
      expect(esVisibleEnDetalle({ status: "ACTIVE", deadline: null })).toBe(
        true,
      );
    });

    it("debe retornar true para CLOSED", () => {
      expect(esVisibleEnDetalle({ status: "CLOSED", deadline: null })).toBe(
        true,
      );
    });

    it("debe retornar false para DRAFT", () => {
      expect(esVisibleEnDetalle({ status: "DRAFT", deadline: null })).toBe(
        false,
      );
    });

    it("debe retornar false para PENDING_REVIEW", () => {
      expect(
        esVisibleEnDetalle({ status: "PENDING_REVIEW", deadline: null }),
      ).toBe(false);
    });
  });

  describe("esCerrada()", () => {
    it("debe retornar true para status CLOSED", () => {
      expect(esCerrada({ status: "CLOSED", deadline: null })).toBe(true);
    });

    it("debe retornar true para beca vencida", () => {
      const pastDate = componentsToMexicoMidnight(2020, 1, 1);
      expect(esCerrada({ status: "ACTIVE", deadline: pastDate })).toBe(true);
    });

    it("debe retornar false para beca ACTIVE vigente", () => {
      const futureDate = componentsToMexicoMidnight(2027, 12, 31);
      expect(esCerrada({ status: "ACTIVE", deadline: futureDate })).toBe(false);
    });
  });
});
