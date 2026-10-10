#!/usr/bin/env tsx
/**
 * Limpia becas de ingesta no aprobadas (DRAFT / PENDING_REVIEW).
 *
 *   npm run limpiar-becas          # dry-run: lista qué borraría y qué omite
 *   npm run limpiar-becas -- --yes # borra solo las que no tienen relaciones
 *
 * Nunca borra ACTIVE ni CLOSED. Omite cualquier beca con favoritos o
 * postulaciones (Restrict en Application). Usuarios y fuentes no se tocan.
 */

import { pathToFileURL } from "node:url";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export function shouldExecuteDelete(argv: string[] = process.argv): boolean {
  return argv.includes("--yes");
}

/** Solo ingesta (no MANUAL) en DRAFT o PENDING_REVIEW. CLOSED y ACTIVE fuera. */
export function filtroBecasLimpiables(): Prisma.ScholarshipWhereInput {
  return {
    source: { type: { not: "MANUAL" } },
    status: { in: ["DRAFT", "PENDING_REVIEW"] },
  };
}

export type BecaLimpieza = {
  id: string;
  title: string;
  slug: string;
  status: string;
  sourceName: string;
  sourceType: string;
  favorites: number;
  applications: number;
};

export type BecaOmitida = BecaLimpieza & { reason: string };

export type ResultadoLimpieza = {
  toDelete: BecaLimpieza[];
  skipped: BecaOmitida[];
  deletedCount: number;
};

function toBecaLimpieza(s: {
  id: string;
  title: string;
  slug: string;
  status: string;
  source: { name: string; type: string };
  _count: { favorites: number; applications: number };
}): BecaLimpieza {
  return {
    id: s.id,
    title: s.title,
    slug: s.slug,
    status: s.status,
    sourceName: s.source.name,
    sourceType: s.source.type,
    favorites: s._count.favorites,
    applications: s._count.applications,
  };
}

function motivoOmision(beca: BecaLimpieza): string | null {
  if (beca.applications > 0) {
    return "tiene postulaciones";
  }
  if (beca.favorites > 0) {
    return "tiene favoritos";
  }
  return null;
}

export async function clasificarBecasParaLimpieza(): Promise<{
  toDelete: BecaLimpieza[];
  skipped: BecaOmitida[];
}> {
  const candidates = await db.scholarship.findMany({
    where: filtroBecasLimpiables(),
    include: {
      source: { select: { name: true, type: true } },
      _count: { select: { favorites: true, applications: true } },
    },
  });

  const toDelete: BecaLimpieza[] = [];
  const skipped: BecaOmitida[] = [];

  for (const raw of candidates) {
    const beca = toBecaLimpieza(raw);
    const reason = motivoOmision(beca);
    if (reason) {
      skipped.push({ ...beca, reason });
    } else {
      toDelete.push(beca);
    }
  }

  return { toDelete, skipped };
}

function esErrorRestrict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2003" || error.code === "P2014")
  );
}

export async function limpiarBecas(
  options: { yes?: boolean } = {},
): Promise<ResultadoLimpieza> {
  const yes = options.yes ?? shouldExecuteDelete();
  const { toDelete, skipped } = await clasificarBecasParaLimpieza();

  if (!yes) {
    return { toDelete, skipped, deletedCount: 0 };
  }

  let deletedCount = 0;
  const skippedDuringDelete = [...skipped];

  for (const beca of toDelete) {
    try {
      await db.scholarship.delete({ where: { id: beca.id } });
      deletedCount += 1;
    } catch (error) {
      if (esErrorRestrict(error)) {
        skippedDuringDelete.push({
          ...beca,
          reason: "tiene postulaciones",
        });
        continue;
      }
      throw error;
    }
  }

  const deletedIds = new Set(
    toDelete
      .filter((b) => !skippedDuringDelete.some((s) => s.id === b.id))
      .map((b) => b.id),
  );

  return {
    toDelete: toDelete.filter((b) => deletedIds.has(b.id)),
    skipped: skippedDuringDelete,
    deletedCount,
  };
}

export function imprimirResultado(
  result: ResultadoLimpieza,
  yes: boolean,
): void {
  console.log("🧹 Limpieza de becas de ingesta no aprobadas\n");
  console.log(
    "   Criterio: source.type != MANUAL y status IN (DRAFT, PENDING_REVIEW)",
  );
  console.log(
    "   Se omiten becas con favoritos o postulaciones. ACTIVE y CLOSED no se tocan.\n",
  );

  if (result.toDelete.length === 0 && result.skipped.length === 0) {
    console.log("✨ No hay becas de ingesta sin aprobar para revisar.\n");
    return;
  }

  if (result.toDelete.length > 0) {
    console.log(
      yes
        ? `✅ Borradas (${result.deletedCount}):`
        : `📋 Se borrarían (${result.toDelete.length}):`,
    );
    for (const beca of result.toDelete) {
      console.log(
        `   - ${beca.title} (${beca.slug}) [${beca.status}] ${beca.sourceName}`,
      );
    }
    console.log();
  }

  if (result.skipped.length > 0) {
    console.log(`⏭️  Omitidas (${result.skipped.length}):`);
    for (const beca of result.skipped) {
      console.log(
        `   - ${beca.title} (${beca.slug}) [${beca.status}] — ${beca.reason}`,
      );
    }
    console.log();
  }

  if (!yes) {
    console.log(
      "🔍 DRY-RUN: no se borró nada. Para borrar: npm run limpiar-becas -- --yes\n",
    );
  }
}

async function main() {
  const yes = shouldExecuteDelete();
  const result = await limpiarBecas({ yes });
  imprimirResultado(result, yes);
}

const invokedDirectly =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main()
    .catch((error) => {
      console.error("\n❌ Error:", error);
      process.exit(1);
    })
    .finally(async () => {
      await db.$disconnect();
    });
}
