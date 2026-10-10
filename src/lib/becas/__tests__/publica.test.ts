/**
 * Tests de visibilidad pública de becas (BD real).
 *
 * Si se quita el default ACTIVE de getBecas / filtroBecaPublica, varios de
 * estos casos fallan: PENDING_REVIEW aparecería en portada, recomendaciones,
 * sitemap y contadores.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import {
  getBecaBySlug,
  getBecas,
  getFeaturedBecas,
  getFilterCountries,
  getLandingStats,
} from "@/lib/becas/queries";
import { recomendarBecas } from "@/lib/becas/recommend";
import {
  AVISO_CONVOCATORIA_CERRADA,
  esCerrada,
  esVisibleEnDetalle,
  estadoDetallePublico,
  filtroBecaPublica,
  puedePedirEstadoNoPublico,
  queryListadoPublico,
} from "@/lib/becas/publica";
import { componentsToMexicoMidnight } from "@/lib/fechas";
import sitemap from "@/app/sitemap";

const SOURCE_ID = "test-source-visibilidad-publica";
const ACTIVE_ID = "test-beca-vis-active";
const DRAFT_ID = "test-beca-vis-draft";
const PENDING_ID = "test-beca-vis-pending";
const CLOSED_ID = "test-beca-vis-closed";
const VENCIDA_ID = "test-beca-vis-vencida";
const FEATURED_ACTIVE_ID = "test-beca-vis-featured-active";
const FEATURED_PENDING_ID = "test-beca-vis-featured-pending";

const ACTIVE_SLUG = "test-beca-vis-active";
const DRAFT_SLUG = "test-beca-vis-draft";
const PENDING_SLUG = "test-beca-vis-pending";
const CLOSED_SLUG = "test-beca-vis-closed";
const VENCIDA_SLUG = "test-beca-vis-vencida";

const PAIS_PENDING = "XZ";
const PAIS_FEATURED_PENDING = "ZY";

describe("Visibilidad pública de becas", () => {
  beforeAll(async () => {
    await db.source.upsert({
      where: { id: SOURCE_ID },
      create: {
        id: SOURCE_ID,
        name: "Fuente visibilidad pública",
        url: "https://example.com/vis-publica",
        type: "MANUAL",
      },
      update: {},
    });

    const futureDate = componentsToMexicoMidnight(2027, 12, 31);
    const pastDate = componentsToMexicoMidnight(2020, 1, 1);

    await db.scholarship.upsert({
      where: { id: ACTIVE_ID },
      create: {
        id: ACTIVE_ID,
        title: "Beca ACTIVE visibilidad",
        slug: ACTIVE_SLUG,
        description: "Solo esta debe salir en listados",
        status: "ACTIVE",
        coverageType: "MONETARY",
        destinationCountries: ["MX"],
        academicLevel: "UNDERGRAD",
        applyUrl: "https://example.com/active-vis",
        sourceId: SOURCE_ID,
        deadline: futureDate,
        isVerified: true,
      },
      update: {
        status: "ACTIVE",
        deadline: futureDate,
        destinationCountries: ["MX"],
      },
    });

    await db.scholarship.upsert({
      where: { id: DRAFT_ID },
      create: {
        id: DRAFT_ID,
        title: "Beca DRAFT visibilidad",
        slug: DRAFT_SLUG,
        description: "No debe verse",
        status: "DRAFT",
        coverageType: "MONETARY",
        destinationCountries: ["MX"],
        academicLevel: "UNDERGRAD",
        applyUrl: "https://example.com/draft-vis",
        sourceId: SOURCE_ID,
        deadline: futureDate,
      },
      update: { status: "DRAFT", deadline: futureDate },
    });

    await db.scholarship.upsert({
      where: { id: PENDING_ID },
      create: {
        id: PENDING_ID,
        title: "Beca PENDING_REVIEW visibilidad",
        slug: PENDING_SLUG,
        description: "No debe verse",
        status: "PENDING_REVIEW",
        coverageType: "MONETARY",
        destinationCountries: [PAIS_PENDING],
        academicLevel: "UNDERGRAD",
        applyUrl: "https://example.com/pending-vis",
        sourceId: SOURCE_ID,
        deadline: futureDate,
      },
      update: {
        status: "PENDING_REVIEW",
        deadline: futureDate,
        destinationCountries: [PAIS_PENDING],
      },
    });

    await db.scholarship.upsert({
      where: { id: CLOSED_ID },
      create: {
        id: CLOSED_ID,
        title: "Beca CLOSED visibilidad",
        slug: CLOSED_SLUG,
        description: "Cerrada, detalle con aviso",
        status: "CLOSED",
        coverageType: "MONETARY",
        destinationCountries: ["MX"],
        academicLevel: "UNDERGRAD",
        applyUrl: "https://example.com/closed-vis",
        sourceId: SOURCE_ID,
        deadline: futureDate,
      },
      update: { status: "CLOSED", deadline: futureDate },
    });

    await db.scholarship.upsert({
      where: { id: VENCIDA_ID },
      create: {
        id: VENCIDA_ID,
        title: "Beca vencida visibilidad",
        slug: VENCIDA_SLUG,
        description: "ACTIVE pero vencida",
        status: "ACTIVE",
        coverageType: "MONETARY",
        destinationCountries: ["MX"],
        academicLevel: "UNDERGRAD",
        applyUrl: "https://example.com/vencida-vis",
        sourceId: SOURCE_ID,
        deadline: pastDate,
      },
      update: { status: "ACTIVE", deadline: pastDate },
    });

    await db.scholarship.upsert({
      where: { id: FEATURED_ACTIVE_ID },
      create: {
        id: FEATURED_ACTIVE_ID,
        title: "Beca featured ACTIVE",
        slug: "test-beca-vis-featured-active",
        description: "Destacada pública",
        status: "ACTIVE",
        coverageType: "MONETARY",
        destinationCountries: ["MX"],
        academicLevel: "UNDERGRAD",
        applyUrl: "https://example.com/featured-active",
        sourceId: SOURCE_ID,
        deadline: futureDate,
        isFeatured: true,
      },
      update: { status: "ACTIVE", deadline: futureDate, isFeatured: true },
    });

    await db.scholarship.upsert({
      where: { id: FEATURED_PENDING_ID },
      create: {
        id: FEATURED_PENDING_ID,
        title: "Beca featured PENDING",
        slug: "test-beca-vis-featured-pending",
        description: "Destacada no pública",
        status: "PENDING_REVIEW",
        coverageType: "MONETARY",
        destinationCountries: [PAIS_FEATURED_PENDING],
        academicLevel: "UNDERGRAD",
        applyUrl: "https://example.com/featured-pending",
        sourceId: SOURCE_ID,
        deadline: futureDate,
        isFeatured: true,
      },
      update: {
        status: "PENDING_REVIEW",
        deadline: futureDate,
        isFeatured: true,
        destinationCountries: [PAIS_FEATURED_PENDING],
      },
    });
  });

  afterAll(async () => {
    await db.scholarship.deleteMany({
      where: {
        id: {
          in: [
            ACTIVE_ID,
            DRAFT_ID,
            PENDING_ID,
            CLOSED_ID,
            VENCIDA_ID,
            FEATURED_ACTIVE_ID,
            FEATURED_PENDING_ID,
          ],
        },
      },
    });
    await db.source.deleteMany({ where: { id: SOURCE_ID } });
  });

  describe("filtroBecaPublica / getBecas (listados y portada)", () => {
    it("PENDING_REVIEW no aparece en getBecas sin status (falla si se quita el default ACTIVE)", async () => {
      const result = await getBecas({ page: 1, limit: 100 });
      const ids = result.data.map((b) => b.id);

      expect(ids).toContain(ACTIVE_ID);
      expect(ids).not.toContain(PENDING_ID);
      expect(ids).not.toContain(DRAFT_ID);
      expect(ids).not.toContain(CLOSED_ID);
      expect(ids).not.toContain(VENCIDA_ID);
    });

    it("PENDING_REVIEW no aparece ni pidiendo status=PENDING_REVIEW sin rol admin", async () => {
      const result = await getBecas({
        status: "PENDING_REVIEW",
        page: 1,
        limit: 100,
      });
      const ids = result.data.map((b) => b.id);

      expect(ids).not.toContain(PENDING_ID);
      expect(ids).toContain(ACTIVE_ID);
    });

    it("ADMIN sí puede listar PENDING_REVIEW y DRAFT", async () => {
      const pending = await getBecas(
        { status: "PENDING_REVIEW", page: 1, limit: 100 },
        { viewerRole: "ADMIN" },
      );
      const draft = await getBecas(
        { status: "DRAFT", page: 1, limit: 100 },
        { viewerRole: "MODERATOR" },
      );

      expect(pending.data.map((b) => b.id)).toContain(PENDING_ID);
      expect(draft.data.map((b) => b.id)).toContain(DRAFT_ID);
    });

    it("filtroBecaPublica solo trae ACTIVE no vencidas", async () => {
      const becas = await db.scholarship.findMany({
        where: filtroBecaPublica(),
        select: { id: true },
      });
      const ids = becas.map((b) => b.id);

      expect(ids).toContain(ACTIVE_ID);
      expect(ids).not.toContain(PENDING_ID);
      expect(ids).not.toContain(DRAFT_ID);
      expect(ids).not.toContain(CLOSED_ID);
      expect(ids).not.toContain(VENCIDA_ID);
    });
  });

  describe("recomendaciones, sitemap y contadores", () => {
    it("recomendarBecas no incluye PENDING_REVIEW (falla si se quita ACTIVE)", async () => {
      const becas = await recomendarBecas({});
      const ids = becas.map((b) => b.id);

      expect(ids).toContain(ACTIVE_ID);
      expect(ids).not.toContain(PENDING_ID);
      expect(ids).not.toContain(DRAFT_ID);
      expect(ids).not.toContain(CLOSED_ID);
      expect(ids).not.toContain(VENCIDA_ID);
    });

    it("sitemap no incluye PENDING_REVIEW, DRAFT, CLOSED ni vencidas", async () => {
      const entries = await sitemap();
      const urls = entries.map((e) => e.url);

      expect(urls.some((u) => u.includes(ACTIVE_SLUG))).toBe(true);
      expect(urls.some((u) => u.includes(PENDING_SLUG))).toBe(false);
      expect(urls.some((u) => u.includes(DRAFT_SLUG))).toBe(false);
      expect(urls.some((u) => u.includes(CLOSED_SLUG))).toBe(false);
      expect(urls.some((u) => u.includes(VENCIDA_SLUG))).toBe(false);
    });

    it("getLandingStats no incluye SU beca PENDING ni SU país único (falla si se quita el filtro)", async () => {
      const stats = await getLandingStats();
      const publicas = await db.scholarship.findMany({
        where: filtroBecaPublica(),
        select: { id: true, destinationCountries: true },
      });

      expect(publicas.map((b) => b.id)).not.toContain(PENDING_ID);
      expect(
        publicas.flatMap((b) => b.destinationCountries),
      ).not.toContain(PAIS_PENDING);
      expect(stats.countryDestinations).not.toContain(PAIS_PENDING);
      expect(stats.countryDestinations).not.toContain(PAIS_FEATURED_PENDING);
    });

    it("getFeaturedBecas no incluye PENDING destacada (falla si se quita el filtro público)", async () => {
      const featured = await getFeaturedBecas();
      const ids = featured.map((b) => b.id);

      expect(ids).toContain(FEATURED_ACTIVE_ID);
      expect(ids).not.toContain(FEATURED_PENDING_ID);
    });

    it("getFilterCountries no incluye el país único de SU PENDING (falla si se quita el filtro)", async () => {
      const countries = await getFilterCountries();

      expect(countries).not.toContain(PAIS_PENDING);
      expect(countries).not.toContain(PAIS_FEATURED_PENDING);
      expect(countries).toContain("MX");
    });
  });

  describe("detalle /becas/[slug]", () => {
    it("DRAFT y PENDING_REVIEW no son visibles (404)", async () => {
      expect(await getBecaBySlug(DRAFT_SLUG)).toBeNull();
      expect(await getBecaBySlug(PENDING_SLUG)).toBeNull();
      expect(estadoDetallePublico({ status: "DRAFT", deadline: null })).toBe(
        "not_found",
      );
      expect(
        estadoDetallePublico({ status: "PENDING_REVIEW", deadline: null }),
      ).toBe("not_found");
      expect(esVisibleEnDetalle({ status: "DRAFT", deadline: null })).toBe(
        false,
      );
      expect(
        esVisibleEnDetalle({ status: "PENDING_REVIEW", deadline: null }),
      ).toBe(false);
    });

    it("CLOSED y vencida se pueden abrir con aviso de convocatoria cerrada", async () => {
      const closed = await getBecaBySlug(CLOSED_SLUG);
      const vencida = await getBecaBySlug(VENCIDA_SLUG);

      expect(closed).not.toBeNull();
      expect(vencida).not.toBeNull();
      expect(estadoDetallePublico(closed!)).toBe("cerrada");
      expect(estadoDetallePublico(vencida!)).toBe("cerrada");
      expect(esCerrada(closed!)).toBe(true);
      expect(esCerrada(vencida!)).toBe(true);
      expect(AVISO_CONVOCATORIA_CERRADA).toMatch(/cerrado/i);
    });

    it("ACTIVE vigente se abre sin aviso", async () => {
      const active = await getBecaBySlug(ACTIVE_SLUG);
      expect(active).not.toBeNull();
      expect(estadoDetallePublico(active!)).toBe("abierta");
      expect(esCerrada(active!)).toBe(false);
    });

    it("trata deadline serializado como string (respuesta JSON de la API)", () => {
      const past = componentsToMexicoMidnight(2020, 1, 1).toISOString();
      const future = componentsToMexicoMidnight(2027, 12, 31).toISOString();

      expect(estadoDetallePublico({ status: "ACTIVE", deadline: past })).toBe(
        "cerrada",
      );
      expect(estadoDetallePublico({ status: "ACTIVE", deadline: future })).toBe(
        "abierta",
      );
    });
  });

  describe("roles y listado /becas", () => {
    it("solo ADMIN y MODERATOR pueden pedir estados no públicos", () => {
      expect(puedePedirEstadoNoPublico("ADMIN")).toBe(true);
      expect(puedePedirEstadoNoPublico("MODERATOR")).toBe(true);
      expect(puedePedirEstadoNoPublico("USER")).toBe(false);
      expect(puedePedirEstadoNoPublico(undefined)).toBe(false);
    });

    it("queryListadoPublico descarta ?status (falla si /becas vuelve a aceptarlo)", () => {
      expect(
        queryListadoPublico({ status: "DRAFT", page: 1, limit: 50 }).status,
      ).toBeUndefined();
      expect(
        queryListadoPublico({ status: "PENDING_REVIEW", page: 1, limit: 10 })
          .status,
      ).toBeUndefined();
    });
  });
});
