/**
 * Ejercita las funciones exportadas de scripts/limpiar-becas.ts contra la BD.
 * Si se copia el filtro aquí en vez de importarlo, estos casos dejan de
 * fallar cuando el script cambia.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import type { Source, User } from "@/generated/prisma/client";
import {
  clasificarBecasParaLimpieza,
  filtroBecasLimpiables,
  limpiarBecas,
  shouldExecuteDelete,
} from "../../../../scripts/limpiar-becas";

const PREFIX = "limpiar-beca-qa-";

describe("limpiar-becas (funciones del script)", () => {
  let testUser: User;
  let manualSource: Source;
  let discoverySource: Source;

  beforeEach(async () => {
    testUser = await db.user.create({
      data: {
        id: `${PREFIX}user-${Date.now()}`,
        email: `${PREFIX}${Date.now()}@example.com`,
        role: "USER",
      },
    });
    manualSource = await db.source.create({
      data: {
        name: `${PREFIX}manual`,
        url: `https://example.com/${PREFIX}manual-${Date.now()}`,
        type: "MANUAL",
      },
    });
    discoverySource = await db.source.create({
      data: {
        name: `${PREFIX}discovery`,
        url: `https://example.com/${PREFIX}discovery-${Date.now()}`,
        type: "DISCOVERY",
      },
    });
  });

  afterEach(async () => {
    await db.application.deleteMany({
      where: { userId: { startsWith: PREFIX } },
    });
    await db.favorite.deleteMany({
      where: { userId: { startsWith: PREFIX } },
    });
    await db.scholarship.deleteMany({
      where: { slug: { startsWith: PREFIX } },
    });
    await db.source.deleteMany({
      where: { name: { startsWith: PREFIX } },
    });
    await db.user.deleteMany({
      where: { id: { startsWith: PREFIX } },
    });
  });

  async function crearBeca(opts: {
    slug: string;
    status: "ACTIVE" | "CLOSED" | "DRAFT" | "PENDING_REVIEW";
    sourceId: string;
  }) {
    return db.scholarship.create({
      data: {
        title: opts.slug,
        slug: `${PREFIX}${opts.slug}`,
        description: "test limpiar",
        applyUrl: `https://example.com/${opts.slug}`,
        deadline: new Date("2030-12-31"),
        status: opts.status,
        coverageType: "MONETARY",
        academicLevel: "UNDERGRAD",
        sourceId: opts.sourceId,
        destinationCountries: ["MX"],
      },
    });
  }

  it("shouldExecuteDelete solo es true con --yes", () => {
    expect(shouldExecuteDelete(["node", "limpiar-becas.ts"])).toBe(false);
    expect(shouldExecuteDelete(["node", "limpiar-becas.ts", "--yes"])).toBe(
      true,
    );
  });

  it("CLOSED con favorito sobrevive y se reporta como omitida", async () => {
    const closed = await crearBeca({
      slug: "closed-fav",
      status: "CLOSED",
      sourceId: discoverySource.id,
    });
    await db.favorite.create({
      data: { userId: testUser.id, scholarshipId: closed.id },
    });

    const result = await limpiarBecas({ yes: true });

    expect(
      await db.scholarship.findUnique({ where: { id: closed.id } }),
    ).not.toBeNull();
    expect(result.toDelete.map((b) => b.id)).not.toContain(closed.id);
    expect(
      await db.scholarship.findMany({ where: filtroBecasLimpiables() }),
    ).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: closed.id })]),
    );
  });

  it("PENDING_REVIEW con postulación sobrevive y se reporta en skipped", async () => {
    const pending = await crearBeca({
      slug: "pending-app",
      status: "PENDING_REVIEW",
      sourceId: discoverySource.id,
    });
    await db.application.create({
      data: {
        userId: testUser.id,
        scholarshipId: pending.id,
        status: "INTERESTED",
      },
    });

    const classified = await clasificarBecasParaLimpieza();
    expect(classified.toDelete.map((b) => b.id)).not.toContain(pending.id);
    const omitida = classified.skipped.find((b) => b.id === pending.id);
    expect(omitida?.reason).toMatch(/postulacion/i);

    const result = await limpiarBecas({ yes: true });
    expect(result.skipped.some((b) => b.id === pending.id)).toBe(true);
    expect(
      await db.scholarship.findUnique({ where: { id: pending.id } }),
    ).not.toBeNull();
    expect(
      await db.application.findFirst({ where: { scholarshipId: pending.id } }),
    ).not.toBeNull();
  });

  it("DRAFT de ingesta sin relaciones se borra con --yes", async () => {
    const draft = await crearBeca({
      slug: "draft-free",
      status: "DRAFT",
      sourceId: discoverySource.id,
    });

    const result = await limpiarBecas({ yes: true });
    expect(result.deletedCount).toBeGreaterThanOrEqual(1);
    expect(result.toDelete.map((b) => b.id)).toContain(draft.id);
    expect(
      await db.scholarship.findUnique({ where: { id: draft.id } }),
    ).toBeNull();
  });

  it("ACTIVE sobrevive", async () => {
    const active = await crearBeca({
      slug: "active-ok",
      status: "ACTIVE",
      sourceId: discoverySource.id,
    });

    await limpiarBecas({ yes: true });
    expect(
      await db.scholarship.findUnique({ where: { id: active.id } }),
    ).not.toBeNull();
  });

  it("sin --yes no borra nada (dry-run)", async () => {
    const draft = await crearBeca({
      slug: "draft-dry",
      status: "DRAFT",
      sourceId: discoverySource.id,
    });

    const result = await limpiarBecas({ yes: false });
    expect(result.deletedCount).toBe(0);
    expect(result.toDelete.map((b) => b.id)).toContain(draft.id);
    expect(
      await db.scholarship.findUnique({ where: { id: draft.id } }),
    ).not.toBeNull();
  });

  it("DRAFT manual no se borra", async () => {
    const manualDraft = await crearBeca({
      slug: "manual-draft",
      status: "DRAFT",
      sourceId: manualSource.id,
    });
    await limpiarBecas({ yes: true });
    expect(
      await db.scholarship.findUnique({ where: { id: manualDraft.id } }),
    ).not.toBeNull();
  });
});
