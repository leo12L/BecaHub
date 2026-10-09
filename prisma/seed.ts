import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { SourceType, CategoryAxis } from "../src/generated/prisma/enums";

// El seed corre vía CLI (no en el runtime de la app), así que usa la
// conexión directa para evitar particularidades del pooler en operaciones masivas.
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const db = new PrismaClient({ adapter });

async function main() {
  // ---------------------------------------------------------------------
  // Fuentes
  // ---------------------------------------------------------------------

  await db.source.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "SECIHTI (API JSON)",
      url: "https://secihti.mx/",
      type: SourceType.GOVERNMENT,
      scraperAdapter: "secihti-api",
    },
  });

  await db.source.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Jina Reader (HTML)",
      url: "https://r.jina.ai/",
      type: SourceType.DISCOVERY,
      scraperAdapter: "jina-reader",
    },
  });

  await db.source.upsert({
    where: { id: "00000000-0000-0000-0000-000000000004" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000004",
      name: "Curación manual (admin)",
      url: "https://becahub.local/admin",
      type: SourceType.MANUAL,
      scraperAdapter: null,
    },
  });

  // ---------------------------------------------------------------------
  // Categorías
  // ---------------------------------------------------------------------
  const categoriasData = [
    {
      slug: "monetaria",
      name: "Monetaria",
      axis: CategoryAxis.TYPE,
      colorHex: "#22C55E",
    },
    {
      slug: "viaje",
      name: "Viaje",
      axis: CategoryAxis.TYPE,
      colorHex: "#3B82F6",
    },
    {
      slug: "deportiva",
      name: "Deportiva",
      axis: CategoryAxis.TYPE,
      colorHex: "#F97316",
    },
    {
      slug: "stem",
      name: "STEM",
      axis: CategoryAxis.AREA,
      colorHex: "#6366F1",
    },
    {
      slug: "humanidades",
      name: "Humanidades",
      axis: CategoryAxis.AREA,
      colorHex: "#EC4899",
    },
    {
      slug: "artes",
      name: "Artes",
      axis: CategoryAxis.AREA,
      colorHex: "#A855F7",
    },
  ];

  for (const cat of categoriasData) {
    await db.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log(
    `Seed completado: ${categoriasData.length} categorías, 3 fuentes (SECIHTI, Jina Reader, Manual). Sin becas de ejemplo — cárgalas vía ingesta (npm run ingesta) o el panel de admin.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
