/**
 * Test de BD para el script de limpieza de becas de ingesta.
 * Verifica que:
 * 1. Solo borra becas de ingesta (source.type != 'MANUAL') no aprobadas (status != 'ACTIVE')
 * 2. No borra becas manuales ni becas activas
 * 3. El borrado en cascada funciona correctamente (no deja favoritos/aplicaciones huérfanos)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import type { Scholarship, Source, User } from "@/generated/prisma/client";

describe("limpiar-becas script logic", () => {
  let testUser: User;
  let manualSource: Source;
  let discoverySource: Source;

  beforeEach(async () => {
    // Crear usuario de prueba
    testUser = await db.user.create({
      data: {
        id: `test-user-${Date.now()}`,
        email: `test-${Date.now()}@example.com`,
        role: "USER",
      },
    });

    // Crear fuentes de prueba
    manualSource = await db.source.create({
      data: {
        name: "Manual Test Source",
        url: "https://example.com/manual",
        type: "MANUAL",
      },
    });

    discoverySource = await db.source.create({
      data: {
        name: "Discovery Test Source",
        url: "https://example.com/discovery",
        type: "DISCOVERY",
      },
    });
  });

  it("should only find ingested unapproved scholarships", async () => {
    // Crear becas de prueba
    const manualActive = await db.scholarship.create({
      data: {
        title: "Manual Active Scholarship",
        slug: `manual-active-${Date.now()}`,
        description: "Should NOT be deleted",
        applyUrl: "https://example.com/manual-active",
        deadline: new Date("2030-12-31"),
        status: "ACTIVE",
        coverageType: "MONETARY",
        academicLevel: "UNDERGRAD",
        sourceId: manualSource.id,
        destinationCountries: ["MX"],
      },
    });

    const manualPending = await db.scholarship.create({
      data: {
        title: "Manual Pending Scholarship",
        slug: `manual-pending-${Date.now()}`,
        description: "Should NOT be deleted (manual source)",
        applyUrl: "https://example.com/manual-pending",
        deadline: new Date("2030-12-31"),
        status: "PENDING_REVIEW",
        coverageType: "MONETARY",
        academicLevel: "UNDERGRAD",
        sourceId: manualSource.id,
        destinationCountries: ["MX"],
      },
    });

    const discoveryActive = await db.scholarship.create({
      data: {
        title: "Discovery Active Scholarship",
        slug: `discovery-active-${Date.now()}`,
        description: "Should NOT be deleted (active status)",
        applyUrl: "https://example.com/discovery-active",
        deadline: new Date("2030-12-31"),
        status: "ACTIVE",
        coverageType: "MONETARY",
        academicLevel: "UNDERGRAD",
        sourceId: discoverySource.id,
        destinationCountries: ["US"],
      },
    });

    const discoveryPending = await db.scholarship.create({
      data: {
        title: "Discovery Pending Scholarship",
        slug: `discovery-pending-${Date.now()}`,
        description: "SHOULD be deleted",
        applyUrl: "https://example.com/discovery-pending",
        deadline: new Date("2030-12-31"),
        status: "PENDING_REVIEW",
        coverageType: "MONETARY",
        academicLevel: "UNDERGRAD",
        sourceId: discoverySource.id,
        destinationCountries: ["ES"],
      },
    });

    const discoveryDraft = await db.scholarship.create({
      data: {
        title: "Discovery Draft Scholarship",
        slug: `discovery-draft-${Date.now()}`,
        description: "SHOULD be deleted",
        applyUrl: "https://example.com/discovery-draft",
        deadline: new Date("2030-12-31"),
        status: "DRAFT",
        coverageType: "MONETARY",
        academicLevel: "UNDERGRAD",
        sourceId: discoverySource.id,
        destinationCountries: ["DE"],
      },
    });

    // Aplicar el filtro del script (lógica de limpiar-becas.ts)
    const scholarshipsToDelete = await db.scholarship.findMany({
      where: {
        source: {
          type: {
            not: "MANUAL",
          },
        },
        status: {
          not: "ACTIVE",
        },
      },
      select: {
        id: true,
        title: true,
      },
    });

    // Verificar que encuentra las becas de ingesta no aprobadas
    const foundIds = scholarshipsToDelete.map((s) => s.id);
    expect(foundIds).toContain(discoveryPending.id);
    expect(foundIds).toContain(discoveryDraft.id);
    
    // Verificar que NO encuentra las becas manuales ni las activas
    expect(foundIds).not.toContain(manualActive.id);
    expect(foundIds).not.toContain(manualPending.id);
    expect(foundIds).not.toContain(discoveryActive.id);

    // Limpiar
    await db.scholarship.deleteMany({
      where: {
        id: {
          in: [
            manualActive.id,
            manualPending.id,
            discoveryActive.id,
            discoveryPending.id,
            discoveryDraft.id,
          ],
        },
      },
    });
  });

  it("should cascade delete favorites and applications without leaving orphans", async () => {
    // Crear beca de ingesta pendiente
    const pendingScholarship = await db.scholarship.create({
      data: {
        title: "Pending Scholarship with Relations",
        slug: `pending-relations-${Date.now()}`,
        description: "Has favorites and applications",
        applyUrl: "https://example.com/pending-relations",
        deadline: new Date("2030-12-31"),
        status: "PENDING_REVIEW",
        coverageType: "MONETARY",
        academicLevel: "UNDERGRAD",
        sourceId: discoverySource.id,
        destinationCountries: ["MX"],
      },
    });

    // Crear favorito y aplicación
    const favorite = await db.favorite.create({
      data: {
        userId: testUser.id,
        scholarshipId: pendingScholarship.id,
      },
    });

    const application = await db.application.create({
      data: {
        userId: testUser.id,
        scholarshipId: pendingScholarship.id,
        status: "INTERESTED",
      },
    });

    // Verificar que existen
    expect(
      await db.favorite.findUnique({ where: { id: favorite.id } })
    ).toBeTruthy();
    expect(
      await db.application.findUnique({ where: { id: application.id } })
    ).toBeTruthy();

    // Borrar la beca (simula el script)
    await db.scholarship.delete({
      where: { id: pendingScholarship.id },
    });

    // Verificar que el favorito y la aplicación fueron borrados en cascada
    expect(
      await db.favorite.findUnique({ where: { id: favorite.id } })
    ).toBeNull();
    expect(
      await db.application.findUnique({ where: { id: application.id } })
    ).toBeNull();

    // Verificar que el usuario sigue existiendo
    expect(
      await db.user.findUnique({ where: { id: testUser.id } })
    ).toBeTruthy();
  });

  it("should not delete anything when no unapproved ingested scholarships exist", async () => {
    // Solo crear becas que NO deben borrarse
    const safeScholarship = await db.scholarship.create({
      data: {
        title: "Manual Active Only",
        slug: `manual-only-${Date.now()}`,
        description: "Safe scholarship",
        applyUrl: "https://example.com/manual-only",
        deadline: new Date("2030-12-31"),
        status: "ACTIVE",
        coverageType: "MONETARY",
        academicLevel: "UNDERGRAD",
        sourceId: manualSource.id,
        destinationCountries: ["MX"],
      },
    });

    // Aplicar el filtro
    const scholarshipsToDelete = await db.scholarship.findMany({
      where: {
        source: {
          type: {
            not: "MANUAL",
          },
        },
        status: {
          not: "ACTIVE",
        },
      },
      select: {
        id: true,
      },
    });

    // No debe encontrar la beca manual activa
    const safeScholarshipIds = scholarshipsToDelete.map((s) => s.id);
    expect(safeScholarshipIds).not.toContain(safeScholarship.id);

    // Limpiar
    await db.scholarship.delete({
      where: { id: safeScholarship.id },
    });
  });
});
