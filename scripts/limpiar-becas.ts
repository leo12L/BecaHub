#!/usr/bin/env tsx
/**
 * Script para limpiar becas de prueba o migradas con datos obsoletos.
 * Uso: npm run limpiar-becas [-- --yes]
 *
 * Sin el flag --yes, el script pide confirmación interactiva antes de borrar.
 * Las relaciones (favoritos, postulaciones) se borran por el onDelete: Cascade del schema.
 */

import { db } from "@/lib/db";
import * as readline from "readline";

const DRY_RUN = !process.argv.includes("--yes");

async function promptConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (s/n): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "s" || answer.toLowerCase() === "y");
    });
  });
}

async function main() {
  console.log("🧹 Script de limpieza de becas\n");

  // Contar becas que serían borradas
  // Criterio: becas con destinationCountries vacío y status DRAFT o PENDING_REVIEW
  // (probablemente son becas de prueba o migraciones incompletas)
  const scholarshipsToDelete = await db.scholarship.findMany({
    where: {
      OR: [
        {
          // Becas sin destino en estado borrador o pendiente
          destinationCountries: { isEmpty: true },
          status: { in: ["DRAFT", "PENDING_REVIEW"] },
        },
        {
          // Becas de prueba (identificables por URLs de ejemplo)
          applyUrl: { contains: "ejemplo" },
        },
        {
          // Becas con slugs de prueba comunes
          slug: { contains: "test" },
        },
        {
          slug: { contains: "screenshot" },
        },
      ],
    },
    include: {
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
    console.log("✨ No se encontraron becas para limpiar.");
    console.log(
      "\nLa base de datos está limpia o solo contiene becas verificadas.\n"
    );
    return;
  }

  console.log(`📊 Se encontraron ${count} becas para borrar:\n`);
  console.log(`   • Becas: ${count}`);
  console.log(`   • Favoritos asociados: ${favoritesCount}`);
  console.log(`   • Postulaciones asociadas: ${applicationsCount}\n`);

  if (scholarshipsToDelete.length <= 10) {
    console.log("Becas a borrar:");
    for (const scholarship of scholarshipsToDelete) {
      console.log(
        `   - ${scholarship.title} (${scholarship.slug}) [${scholarship.status}]`
      );
    }
    console.log();
  }

  console.log(
    "⚠️  Los favoritos y postulaciones se borrarán automáticamente (CASCADE)."
  );
  console.log("✅ Los usuarios y fuentes NO se tocarán.\n");

  if (DRY_RUN) {
    const confirmed = await promptConfirmation(
      "¿Deseas continuar con el borrado?"
    );

    if (!confirmed) {
      console.log("\n❌ Operación cancelada por el usuario.\n");
      return;
    }
  } else {
    console.log("🚀 Flag --yes detectado, procediendo sin confirmación...\n");
  }

  // Ejecutar el borrado
  console.log("🗑️  Borrando becas...");

  const result = await db.scholarship.deleteMany({
    where: {
      id: {
        in: scholarshipsToDelete.map((s) => s.id),
      },
    },
  });

  console.log(`\n✅ ${result.count} becas borradas exitosamente.`);
  console.log(
    `   Favoritos y postulaciones asociados fueron borrados por CASCADE.\n`
  );
  console.log("💡 Tip: Corre 'npm run ingesta' para cargar becas reales.\n");

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
