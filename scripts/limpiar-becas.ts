#!/usr/bin/env tsx
/**
 * Script para limpiar becas de ingesta no aprobadas.
 * Uso:
 *   npm run limpiar-becas          # Modo dry-run: muestra cuántas y cuáles borraría
 *   npm run limpiar-becas -- --yes # Borra las becas encontradas
 *
 * Criterio de borrado:
 * - Solo becas de ingesta (source.type != "MANUAL")
 * - Solo becas no aprobadas (status != "ACTIVE")
 * - Las relaciones (favoritos, postulaciones) se borran por onDelete: Cascade
 */

import { db } from "@/lib/db";

const EXECUTE_DELETE = process.argv.includes("--yes");

async function main() {
  console.log("🧹 Script de limpieza de becas de ingesta\n");

  // Buscar becas de ingesta no aprobadas
  // Criterio: becas de fuentes no manuales (DISCOVERY, GOVERNMENT, etc.)
  // en estado diferente de ACTIVE (típicamente DRAFT o PENDING_REVIEW)
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
    include: {
      source: {
        select: {
          name: true,
          type: true,
        },
      },
      _count: {
        select: {
          favorites: true,
          applications: true,
        },
      },
    },
  });

  const count = scholarshipsToDelete.length;
  const favoritesCount = scholarshipsToDelete.reduce(
    (sum, s) => sum + s._count.favorites,
    0
  );
  const applicationsCount = scholarshipsToDelete.reduce(
    (sum, s) => sum + s._count.applications,
    0
  );

  if (count === 0) {
    console.log("✨ No se encontraron becas de ingesta sin aprobar.");
    console.log(
      "\nLa base de datos está limpia o solo contiene becas manuales/aprobadas.\n"
    );
    return;
  }

  console.log(`📊 Becas de ingesta no aprobadas encontradas: ${count}\n`);
  console.log(`   • Becas: ${count}`);
  console.log(`   • Favoritos asociados: ${favoritesCount}`);
  console.log(`   • Postulaciones asociadas: ${applicationsCount}\n`);

  if (scholarshipsToDelete.length <= 10) {
    console.log("Detalle de becas:");
    for (const scholarship of scholarshipsToDelete) {
      console.log(
        `   - ${scholarship.title} (${scholarship.slug})`
      );
      console.log(
        `     Fuente: ${scholarship.source.name} (${scholarship.source.type}), Status: ${scholarship.status}`
      );
    }
    console.log();
  } else {
    console.log(`   (Lista completa omitida: ${count} becas)\n`);
  }

  console.log(
    "ℹ️  Criterio: source.type != 'MANUAL' && status != 'ACTIVE'"
  );
  console.log(
    "⚠️  Los favoritos y postulaciones se borrarán automáticamente (CASCADE)."
  );
  console.log("✅ Los usuarios y fuentes NO se tocarán.\n");

  if (!EXECUTE_DELETE) {
    console.log("🔍 MODO DRY-RUN: No se borrará nada.");
    console.log("   Para ejecutar el borrado, corre: npm run limpiar-becas -- --yes\n");
    return;
  }

  // Ejecutar el borrado
  console.log("🚀 Flag --yes detectado, ejecutando borrado...\n");

  const result = await db.scholarship.deleteMany({
    where: {
      id: {
        in: scholarshipsToDelete.map((s) => s.id),
      },
    },
  });

  console.log(`✅ ${result.count} becas borradas exitosamente.`);
  console.log(
    `   Favoritos y postulaciones asociados fueron borrados por CASCADE.\n`
  );

  await db.$disconnect();
}

main()
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
