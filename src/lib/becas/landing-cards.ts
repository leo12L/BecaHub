import {
  academicLevelLabels,
  coverageLabels,
  formatAmount,
} from "@/lib/becas/format";
import type {
  AcademicLevel,
  CoverageType,
  ScholarshipStatus,
} from "@/generated/prisma/enums";

/** Mínimo de tarjetas en las tiras del hero. Si hay menos becas públicas, se rellena con ejemplos. */
export const MIN_LANDING_STRIP_CARDS = 12;

export type LandingBecaInput = {
  id: string;
  slug: string;
  title: string;
  status: ScholarshipStatus;
  coverageType: CoverageType;
  amountMin?: number | string | { toString(): string } | null;
  amountMax?: number | string | { toString(): string } | null;
  currency: string;
  academicLevel: AcademicLevel;
  countryDestination: string;
  deadline: Date | string | null;
  source: { name: string };
};

export type LandingStripCard = {
  kind: "real" | "example";
  id: string;
  title: string;
  sourceName: string;
  coverageLabel: string;
  levelLabel: string;
  country: string;
  deadlineLabel: string;
  href?: string;
};

export type ExampleLandingBeca = Omit<LandingStripCard, "kind" | "href">;

function deadlineLabel(deadline: Date | string | null): string {
  if (!deadline) return "Sin fecha de cierre";
  const date = typeof deadline === "string" ? new Date(deadline) : deadline;
  return `Cierra el ${date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  })}`;
}

function coverageLabelFor(beca: LandingBecaInput): string {
  return (
    formatAmount(beca.amountMin, beca.amountMax, beca.currency) ??
    coverageLabels[beca.coverageType]
  );
}

export const EXAMPLE_LANDING_BECAS: ExampleLandingBeca[] = [
  {
    id: "ejemplo-1",
    title: "Ejemplo: movilidad nacional (no es una convocatoria real)",
    sourceName: "BecaHub · ejemplo",
    coverageLabel: "Apoyo monetario",
    levelLabel: "Licenciatura",
    country: "México",
    deadlineLabel: "Solo demostración",
  },
  {
    id: "ejemplo-2",
    title: "Ejemplo: posgrado en el extranjero (tarjeta de relleno)",
    sourceName: "BecaHub · ejemplo",
    coverageLabel: "Colegiatura",
    levelLabel: "Maestría",
    country: "España",
    deadlineLabel: "Solo demostración",
  },
  {
    id: "ejemplo-3",
    title: "Ejemplo: investigación de verano (no se puede abrir)",
    sourceName: "BecaHub · ejemplo",
    coverageLabel: "Investigación",
    levelLabel: "Licenciatura",
    country: "México",
    deadlineLabel: "Solo demostración",
  },
  {
    id: "ejemplo-4",
    title: "Ejemplo: liderazgo estudiantil (relleno visual)",
    sourceName: "BecaHub · ejemplo",
    coverageLabel: "Liderazgo",
    levelLabel: "Licenciatura",
    country: "México",
    deadlineLabel: "Solo demostración",
  },
  {
    id: "ejemplo-5",
    title: "Ejemplo: apoyo de colegiatura (no cuenta en totales)",
    sourceName: "BecaHub · ejemplo",
    coverageLabel: "Colegiatura",
    levelLabel: "Bachillerato",
    country: "México",
    deadlineLabel: "Solo demostración",
  },
  {
    id: "ejemplo-6",
    title: "Ejemplo: estancia de investigación (demostración)",
    sourceName: "BecaHub · ejemplo",
    coverageLabel: "Investigación",
    levelLabel: "Doctorado",
    country: "Alemania",
    deadlineLabel: "Solo demostración",
  },
  {
    id: "ejemplo-7",
    title: "Ejemplo: beca deportiva universitaria (relleno)",
    sourceName: "BecaHub · ejemplo",
    coverageLabel: "Deportiva",
    levelLabel: "Licenciatura",
    country: "México",
    deadlineLabel: "Solo demostración",
  },
  {
    id: "ejemplo-8",
    title: "Ejemplo: viaje de estudios (no es postulación)",
    sourceName: "BecaHub · ejemplo",
    coverageLabel: "Viaje",
    levelLabel: "Licenciatura",
    country: "Canadá",
    deadlineLabel: "Solo demostración",
  },
  {
    id: "ejemplo-9",
    title: "Ejemplo: formación profesional (tarjeta ilustrativa)",
    sourceName: "BecaHub · ejemplo",
    coverageLabel: "Apoyo monetario",
    levelLabel: "Profesional",
    country: "México",
    deadlineLabel: "Solo demostración",
  },
  {
    id: "ejemplo-10",
    title: "Ejemplo: posdoctorado (no aparece en el catálogo)",
    sourceName: "BecaHub · ejemplo",
    coverageLabel: "Beca completa",
    levelLabel: "Posdoctorado",
    country: "Francia",
    deadlineLabel: "Solo demostración",
  },
  {
    id: "ejemplo-11",
    title: "Ejemplo: maestría en ciencias (relleno del hero)",
    sourceName: "BecaHub · ejemplo",
    coverageLabel: "Colegiatura",
    levelLabel: "Maestría",
    country: "México",
    deadlineLabel: "Solo demostración",
  },
  {
    id: "ejemplo-12",
    title: "Ejemplo: intercambio académico (solo portada)",
    sourceName: "BecaHub · ejemplo",
    coverageLabel: "Viaje",
    levelLabel: "Licenciatura",
    country: "Japón",
    deadlineLabel: "Solo demostración",
  },
];

export function toLandingStripCard(beca: LandingBecaInput): LandingStripCard {
  return {
    kind: "real",
    id: beca.id,
    title: beca.title,
    sourceName: beca.source.name,
    coverageLabel: coverageLabelFor(beca),
    levelLabel: academicLevelLabels[beca.academicLevel],
    country: beca.countryDestination,
    deadlineLabel: deadlineLabel(beca.deadline),
    href: `/becas/${beca.slug}`,
  };
}

export function toExampleStripCard(
  example: ExampleLandingBeca,
): LandingStripCard {
  return { ...example, kind: "example" };
}

/**
 * Arma las tarjetas de las tiras. No filtra estado: el caller debe pasar
 * solo becas de `filtroBecaPublica()` / `getBecas()`.
 */
export function buildLandingStripCards(
  becas: LandingBecaInput[],
): LandingStripCard[] {
  const reals = becas.slice(0, MIN_LANDING_STRIP_CARDS).map(toLandingStripCard);
  if (reals.length >= MIN_LANDING_STRIP_CARDS) {
    return reals;
  }

  const needed = MIN_LANDING_STRIP_CARDS - reals.length;
  const examples = EXAMPLE_LANDING_BECAS.slice(0, needed).map(
    toExampleStripCard,
  );
  return [...reals, ...examples];
}

export function countPublicLandingCards(cards: LandingStripCard[]): number {
  return cards.filter((card) => card.kind === "real").length;
}

export function splitIntoColumns<T>(items: T[], columns: number): T[][] {
  const cols: T[][] = Array.from({ length: columns }, () => []);
  items.forEach((item, index) => {
    cols[index % columns].push(item);
  });
  return cols;
}
