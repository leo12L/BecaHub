import { db } from "@/lib/db";

async function main() {
  console.log("Seeding screenshots test data...");

  const manualSource = await db.source.findFirst({
    where: { name: "Curación manual (admin)" },
  });

  if (!manualSource) {
    throw new Error("Manual source not found. Run migrations first.");
  }

  const scholarships = [
    {
      slug: "beca-mexico-screenshot",
      title: "Beca de Licenciatura en México",
      description:
        "Programa de apoyo para estudiantes mexicanos en instituciones nacionales.",
      status: "ACTIVE" as const,
      coverageType: "FULL" as const,
      destinationCountries: ["MX"],
      academicLevel: "UNDERGRAD" as const,
      deadline: new Date("2027-06-30"),
      applyUrl: "https://ejemplo.mx/becas",
      sourceId: manualSource.id,
      isVerified: true,
    },
    {
      slug: "fulbright-usa-screenshot",
      title: "Maestría en Estados Unidos - Fulbright",
      description: "Beca completa para posgrado en universidades estadounidenses.",
      status: "ACTIVE" as const,
      coverageType: "FULL" as const,
      destinationCountries: ["US"],
      academicLevel: "GRAD" as const,
      deadline: new Date("2027-03-15"),
      applyUrl: "https://ejemplo.com/fulbright",
      sourceId: manualSource.id,
      isVerified: true,
    },
    {
      slug: "doctorado-espana-screenshot",
      title: "Doctorado en España - MAEC",
      description: "Programa de becas para doctorado en España.",
      status: "ACTIVE" as const,
      coverageType: "FULL" as const,
      destinationCountries: ["ES"],
      academicLevel: "PHD" as const,
      deadline: new Date("2027-01-31"),
      applyUrl: "https://ejemplo.es/becas",
      sourceId: manualSource.id,
      isVerified: true,
    },
    {
      slug: "alemania-daad-screenshot",
      title: "Intercambio en Alemania - DAAD",
      description: "Programa de intercambio en universidades alemanas.",
      status: "ACTIVE" as const,
      coverageType: "MONETARY" as const,
      destinationCountries: ["DE"],
      academicLevel: "UNDERGRAD" as const,
      deadline: new Date("2026-12-15"),
      applyUrl: "https://ejemplo.de/daad",
      sourceId: manualSource.id,
      isVerified: true,
    },
    {
      slug: "china-cgs-screenshot",
      title: "Posgrado en China - CSC",
      description: "Beca del gobierno chino para estudiantes internacionales.",
      status: "ACTIVE" as const,
      coverageType: "FULL" as const,
      destinationCountries: ["CN"],
      academicLevel: "GRAD" as const,
      deadline: new Date("2027-04-30"),
      applyUrl: "https://ejemplo.cn/scholarships",
      sourceId: manualSource.id,
      isVerified: true,
    },
    {
      slug: "investigacion-sin-destino",
      title: "Beca de Investigación Global",
      description: "Programa sin destino específico definido.",
      status: "ACTIVE" as const,
      coverageType: "RESEARCH" as const,
      destinationCountries: [],
      academicLevel: "PHD" as const,
      deadline: new Date("2027-08-31"),
      applyUrl: "https://ejemplo.org/research",
      sourceId: manualSource.id,
      isVerified: true,
    },
    {
      slug: "cierra-pronto",
      title: "Beca que Cierra Pronto",
      description: "Convocatoria con deadline cercano.",
      status: "ACTIVE" as const,
      coverageType: "TUITION" as const,
      destinationCountries: ["MX"],
      academicLevel: "UNDERGRAD" as const,
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      applyUrl: "https://ejemplo.mx/urgente",
      sourceId: manualSource.id,
      isVerified: true,
    },
  ];

  for (const scholarship of scholarships) {
    await db.scholarship.upsert({
      where: { slug: scholarship.slug },
      create: scholarship,
      update: scholarship,
    });
    console.log(`✓ ${scholarship.title}`);
  }

  console.log("\n✅ Screenshots test data seeded!");
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
