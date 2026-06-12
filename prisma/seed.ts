import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  SourceType,
  CategoryAxis,
  CoverageType,
  AcademicLevel,
  ScholarshipStatus,
} from "../src/generated/prisma/enums";

// El seed corre vía CLI (no en el runtime de la app), así que usa la
// conexión directa para evitar particularidades del pooler en operaciones masivas.
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const db = new PrismaClient({ adapter });

async function main() {
  // ---------------------------------------------------------------------
  // Fuentes
  // ---------------------------------------------------------------------
  const fuenteGobierno = await db.source.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Becas Benito Juárez (gob.mx)",
      url: "https://www.becasbenitojuarez.sep.gob.mx/",
      type: SourceType.GOVERNMENT,
      scraperAdapter: "becas-gob-mx",
    },
  });

  const fuenteChevening = await db.source.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Chevening Scholarships",
      url: "https://www.chevening.org/",
      type: SourceType.EDUCATIONAL,
      scraperAdapter: "chevening",
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

  const categorias = new Map<string, string>();
  for (const cat of categoriasData) {
    const created = await db.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categorias.set(cat.slug, created.id);
  }

  // ---------------------------------------------------------------------
  // Becas
  // ---------------------------------------------------------------------
  const becas: Array<{
    title: string;
    slug: string;
    description: string;
    status: (typeof ScholarshipStatus)[keyof typeof ScholarshipStatus];
    coverageType: (typeof CoverageType)[keyof typeof CoverageType];
    amountMin?: number;
    amountMax?: number;
    currency?: string;
    countryOrigin?: string;
    countryDestination: string;
    academicLevel: (typeof AcademicLevel)[keyof typeof AcademicLevel];
    language?: string;
    deadline?: string;
    applyUrl: string;
    sourceId: string;
    isVerified?: boolean;
    isFeatured?: boolean;
    categories: string[];
  }> = [
    {
      title: "Beca Benito Juárez para Educación Superior",
      slug: "benito-juarez-educacion-superior",
      description:
        "Apoyo económico mensual para estudiantes de licenciatura en situación de vulnerabilidad económica en México.",
      status: ScholarshipStatus.ACTIVE,
      coverageType: CoverageType.MONETARY,
      amountMin: 1000,
      amountMax: 2400,
      currency: "MXN",
      countryOrigin: "México",
      countryDestination: "México",
      academicLevel: AcademicLevel.UNDERGRAD,
      language: "es",
      deadline: "2026-08-30",
      applyUrl:
        "https://www.becasbenitojuarez.sep.gob.mx/becas/educacion-superior",
      sourceId: fuenteGobierno.id,
      isVerified: true,
      isFeatured: true,
      categories: ["monetaria", "humanidades"],
    },
    {
      title: "Beca de Movilidad Internacional SEP",
      slug: "movilidad-internacional-sep",
      description:
        "Financiamiento para estudiantes mexicanos de licenciatura que realicen un semestre de intercambio en el extranjero.",
      status: ScholarshipStatus.ACTIVE,
      coverageType: CoverageType.TRAVEL,
      currency: "MXN",
      countryOrigin: "México",
      countryDestination: "Internacional",
      academicLevel: AcademicLevel.UNDERGRAD,
      language: "es",
      deadline: "2026-07-10",
      applyUrl: "https://www.gob.mx/sep/becas/movilidad-internacional",
      sourceId: fuenteGobierno.id,
      isVerified: true,
      categories: ["viaje", "stem"],
    },
    {
      title: "Programa Nacional de Becas de Posgrado CONAHCYT",
      slug: "conahcyt-posgrado",
      description:
        "Beca completa para estudios de maestría o doctorado en instituciones reconocidas por el padrón de excelencia.",
      status: ScholarshipStatus.ACTIVE,
      coverageType: CoverageType.FULL,
      amountMin: 15000,
      amountMax: 18000,
      currency: "MXN",
      countryOrigin: "México",
      countryDestination: "México",
      academicLevel: AcademicLevel.GRAD,
      language: "es",
      deadline: "2026-09-01",
      applyUrl: "https://conahcyt.mx/becas/posgrado-nacional",
      sourceId: fuenteGobierno.id,
      isVerified: true,
      isFeatured: true,
      categories: ["monetaria", "stem"],
    },
    {
      title: "Beca Deportiva CONADE Talento Nacional",
      slug: "conade-talento-nacional",
      description:
        "Apoyo para estudiantes de bachillerato con trayectoria destacada en disciplinas deportivas de alto rendimiento.",
      status: ScholarshipStatus.CLOSED,
      coverageType: CoverageType.SPORTS,
      currency: "MXN",
      countryOrigin: "México",
      countryDestination: "México",
      academicLevel: AcademicLevel.HIGH_SCHOOL,
      language: "es",
      deadline: "2026-05-01",
      applyUrl: "https://conade.gob.mx/becas/talento-nacional",
      sourceId: fuenteGobierno.id,
      categories: ["deportiva"],
    },
    {
      title: "Chevening Scholarship - UK Master's",
      slug: "chevening-uk-masters",
      description:
        "Beca completa del gobierno británico para estudios de maestría de un año en cualquier universidad del Reino Unido.",
      status: ScholarshipStatus.ACTIVE,
      coverageType: CoverageType.FULL,
      currency: "GBP",
      countryOrigin: "Internacional",
      countryDestination: "Reino Unido",
      academicLevel: AcademicLevel.GRAD,
      language: "en",
      deadline: "2026-11-03",
      applyUrl: "https://www.chevening.org/scholarship/",
      sourceId: fuenteChevening.id,
      isVerified: true,
      isFeatured: true,
      categories: ["humanidades", "viaje"],
    },
    {
      title: "Chevening Research Fellowship",
      slug: "chevening-research-fellowship",
      description:
        "Estancia de investigación de corto plazo en el Reino Unido para profesionales y académicos en etapa doctoral.",
      status: ScholarshipStatus.ACTIVE,
      coverageType: CoverageType.RESEARCH,
      currency: "GBP",
      countryOrigin: "Internacional",
      countryDestination: "Reino Unido",
      academicLevel: AcademicLevel.PHD,
      language: "en",
      deadline: "2026-10-15",
      applyUrl: "https://www.chevening.org/fellowships/research/",
      sourceId: fuenteChevening.id,
      isVerified: true,
      categories: ["stem"],
    },
    {
      title: "Beca de Liderazgo Juvenil Iberoamericano",
      slug: "liderazgo-juvenil-iberoamericano",
      description:
        "Programa de formación en liderazgo para jóvenes latinoamericanos con estancia académica en España.",
      status: ScholarshipStatus.ACTIVE,
      coverageType: CoverageType.LEADERSHIP,
      currency: "EUR",
      countryOrigin: "Latinoamérica",
      countryDestination: "España",
      academicLevel: AcademicLevel.UNDERGRAD,
      language: "es",
      deadline: "2027-01-20",
      applyUrl: "https://www.chevening.org/programas/liderazgo-iberoamericano",
      sourceId: fuenteChevening.id,
      categories: ["humanidades"],
    },
    {
      title: "Beca Talento Artístico FONCA",
      slug: "fonca-talento-artistico",
      description:
        "Apoyo económico para jóvenes creadores en artes visuales, música, danza y artes escénicas.",
      status: ScholarshipStatus.CLOSED,
      coverageType: CoverageType.MONETARY,
      amountMin: 5000,
      amountMax: 8000,
      currency: "MXN",
      countryOrigin: "México",
      countryDestination: "México",
      academicLevel: AcademicLevel.UNDERGRAD,
      language: "es",
      deadline: "2026-04-01",
      applyUrl: "https://fonca.cultura.gob.mx/becas/talento-artistico",
      sourceId: fuenteGobierno.id,
      categories: ["monetaria", "artes"],
    },
    {
      title: "Beca de Estudios en STEM - Mujeres en Ciencia",
      slug: "mujeres-en-ciencia-stem",
      description:
        "Cobertura de colegiatura para mujeres que cursen carreras de ciencia, tecnología, ingeniería o matemáticas en Canadá.",
      status: ScholarshipStatus.ACTIVE,
      coverageType: CoverageType.TUITION,
      currency: "CAD",
      countryOrigin: "Internacional",
      countryDestination: "Canadá",
      academicLevel: AcademicLevel.UNDERGRAD,
      language: "en",
      deadline: "2026-08-20",
      applyUrl: "https://www.chevening.org/programas/mujeres-en-ciencia",
      sourceId: fuenteChevening.id,
      isVerified: true,
      isFeatured: true,
      categories: ["stem"],
    },
    {
      title: "Programa de Intercambio Deportivo Panamericano",
      slug: "intercambio-deportivo-panamericano",
      description:
        "Estancia deportiva de un semestre en Brasil para atletas universitarios mexicanos, con apoyo de viaje y manutención.",
      status: ScholarshipStatus.ACTIVE,
      coverageType: CoverageType.TRAVEL,
      currency: "USD",
      countryOrigin: "México",
      countryDestination: "Brasil",
      academicLevel: AcademicLevel.UNDERGRAD,
      language: "es",
      deadline: "2026-07-01",
      applyUrl: "https://www.gob.mx/conade/becas/intercambio-panamericano",
      sourceId: fuenteGobierno.id,
      categories: ["deportiva", "viaje"],
    },
    {
      title: "Beca PRONABES Educación Media Superior",
      slug: "pronabes-educacion-media-superior",
      description:
        "Apoyo económico mensual para estudiantes de bachillerato de escasos recursos en instituciones públicas.",
      status: ScholarshipStatus.CLOSED,
      coverageType: CoverageType.MONETARY,
      amountMin: 750,
      amountMax: 750,
      currency: "MXN",
      countryOrigin: "México",
      countryDestination: "México",
      academicLevel: AcademicLevel.HIGH_SCHOOL,
      language: "es",
      deadline: "2026-02-01",
      applyUrl: "https://www.gob.mx/sep/becas/pronabes",
      sourceId: fuenteGobierno.id,
      categories: ["monetaria"],
    },
    {
      title: "Maestría en Artes Escénicas - Beca Completa España",
      slug: "maestria-artes-escenicas-espana",
      description:
        "Beca completa (colegiatura, manutención y viaje) para estudiar una maestría en artes escénicas en universidades españolas.",
      status: ScholarshipStatus.ACTIVE,
      coverageType: CoverageType.FULL,
      currency: "EUR",
      countryOrigin: "Internacional",
      countryDestination: "España",
      academicLevel: AcademicLevel.GRAD,
      language: "es",
      deadline: "2026-12-01",
      applyUrl: "https://www.chevening.org/programas/artes-escenicas-espana",
      sourceId: fuenteChevening.id,
      categories: ["artes", "viaje"],
    },
    {
      title: "Beca de Investigación Doctoral en Humanidades",
      slug: "investigacion-doctoral-humanidades",
      description:
        "Financiamiento para estudios doctorales en filosofía, historia y letras en universidades francesas.",
      status: ScholarshipStatus.ACTIVE,
      coverageType: CoverageType.RESEARCH,
      currency: "EUR",
      countryOrigin: "Internacional",
      countryDestination: "Francia",
      academicLevel: AcademicLevel.PHD,
      language: "fr",
      deadline: "2027-02-28",
      applyUrl:
        "https://www.chevening.org/programas/doctorado-humanidades-francia",
      sourceId: fuenteChevening.id,
      categories: ["humanidades"],
    },
    {
      title: "Beca Postdoctoral CONAHCYT Internacional",
      slug: "conahcyt-postdoctoral-internacional",
      description:
        "Estancia postdoctoral en instituciones internacionales para investigadores mexicanos en áreas STEM.",
      status: ScholarshipStatus.CLOSED,
      coverageType: CoverageType.FULL,
      currency: "USD",
      countryOrigin: "México",
      countryDestination: "Internacional",
      academicLevel: AcademicLevel.POSTDOC,
      language: "en",
      deadline: "2026-06-01",
      applyUrl: "https://conahcyt.mx/becas/postdoctoral-internacional",
      sourceId: fuenteGobierno.id,
      isVerified: true,
      categories: ["stem", "monetaria"],
    },
    {
      title: "Beca Profesional Empresarial Tecnológico",
      slug: "beca-profesional-empresarial-tec",
      description:
        "Beca de colegiatura para profesionales que cursen un diplomado en gestión empresarial y tecnología.",
      status: ScholarshipStatus.DRAFT,
      coverageType: CoverageType.TUITION,
      currency: "MXN",
      countryOrigin: "México",
      countryDestination: "México",
      academicLevel: AcademicLevel.PROFESSIONAL,
      language: "es",
      deadline: "2026-09-30",
      applyUrl: "https://www.gob.mx/sep/becas/profesional-empresarial-tec",
      sourceId: fuenteGobierno.id,
      categories: ["monetaria"],
    },
  ];

  for (const beca of becas) {
    const { categories, ...data } = beca;

    const scholarship = await db.scholarship.upsert({
      where: { slug: data.slug },
      update: {},
      create: {
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : null,
      },
    });

    for (const categorySlug of categories) {
      const categoryId = categorias.get(categorySlug);
      if (!categoryId) continue;

      await db.scholarshipCategory.upsert({
        where: {
          scholarshipId_categoryId: {
            scholarshipId: scholarship.id,
            categoryId,
          },
        },
        update: {},
        create: {
          scholarshipId: scholarship.id,
          categoryId,
        },
      });
    }
  }

  console.log(
    `Seed completado: ${becas.length} becas, ${categoriasData.length} categorías, 2 fuentes.`,
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
