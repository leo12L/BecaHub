import { db } from "@/lib/db";
import {
  AcademicLevel,
  CoverageType,
  ScholarshipStatus,
  type AcademicLevel as AcademicLevelType,
  type CoverageType as CoverageTypeType,
  type ScholarshipStatus as ScholarshipStatusType,
} from "@/generated/prisma/enums";
import type { RawScholarship } from "./types";
import { componentsToMexicoMidnight, dateToMexicoMidnight } from "@/lib/fechas";

/**
 * Forma normalizada de una beca, lista para `prisma.scholarship.upsert`.
 * Siempre entra como `PENDING_REVIEW` / `isVerified: false` — un admin la
 * valida después.
 */
export interface NormalizedScholarship {
  title: string;
  slug: string;
  description: string;
  status: ScholarshipStatusType;
  coverageType: CoverageTypeType;
  amountMin: number | null;
  amountMax: number | null;
  currency: string;
  countryOrigin: string | null;
  countryDestination: string;
  academicLevel: AcademicLevelType;
  language: string | null;
  deadline: Date | null;
  applyUrl: string;
  sourceId: string;
  isVerified: boolean;
  scrapedAt: Date;
  fingerprint: string;
  rawPayload: Record<string, unknown> | null;
  validationErrors: string[] | null;
}

const MONTHS_ES: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

const COVERAGE_SYNONYMS: Record<string, CoverageTypeType> = {
  "beca completa": CoverageType.FULL,
  completa: CoverageType.FULL,
  full: CoverageType.FULL,
  manutencion: CoverageType.MONETARY,
  economica: CoverageType.MONETARY,
  monetaria: CoverageType.MONETARY,
  mensualidad: CoverageType.MONETARY,
  apoyo: CoverageType.MONETARY,
  colegiatura: CoverageType.TUITION,
  matricula: CoverageType.TUITION,
  inscripcion: CoverageType.TUITION,
  tuition: CoverageType.TUITION,
  viaje: CoverageType.TRAVEL,
  transporte: CoverageType.TRAVEL,
  movilidad: CoverageType.TRAVEL,
  intercambio: CoverageType.TRAVEL,
  deportiva: CoverageType.SPORTS,
  deporte: CoverageType.SPORTS,
  investigacion: CoverageType.RESEARCH,
  research: CoverageType.RESEARCH,
  liderazgo: CoverageType.LEADERSHIP,
  leadership: CoverageType.LEADERSHIP,
};

const LEVEL_SYNONYMS: Record<string, AcademicLevelType> = {
  bachillerato: AcademicLevel.HIGH_SCHOOL,
  preparatoria: AcademicLevel.HIGH_SCHOOL,
  "media superior": AcademicLevel.HIGH_SCHOOL,
  "high school": AcademicLevel.HIGH_SCHOOL,
  licenciatura: AcademicLevel.UNDERGRAD,
  pregrado: AcademicLevel.UNDERGRAD,
  undergraduate: AcademicLevel.UNDERGRAD,
  "educacion superior": AcademicLevel.UNDERGRAD,
  maestria: AcademicLevel.GRAD,
  master: AcademicLevel.GRAD,
  posgrado: AcademicLevel.GRAD,
  graduate: AcademicLevel.GRAD,
  doctorado: AcademicLevel.PHD,
  phd: AcademicLevel.PHD,
  doctorate: AcademicLevel.PHD,
  posdoctorado: AcademicLevel.POSTDOC,
  postdoctoral: AcademicLevel.POSTDOC,
  profesional: AcademicLevel.PROFESSIONAL,
};

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Genera un slug a partir de un texto, manejando acentos y espacios. */
export function slugify(value: string): string {
  return stripAccents(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Parsea fechas en formatos comunes: ISO (`2026-03-15`),
 * `dd/mm/yyyy`/`dd-mm-yyyy` y español (`15 de marzo de 2026`).
 * Devuelve la fecha como medianoche en hora de México (-06:00).
 * Devuelve `null` si no se reconoce el formato.
 */
export function parseSpanishDate(raw: string): Date | null {
  const trimmed = raw.trim();

  // Formato dd/mm/yyyy o dd-mm-yyyy
  const numeric = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (numeric) {
    const [, day, month, year] = numeric;
    const yearNum = Number(year);
    const monthNum = Number(month);
    const dayNum = Number(day);
    
    // Validar rangos básicos
    if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
      return null;
    }
    
    return componentsToMexicoMidnight(yearNum, monthNum, dayNum);
  }

  // Formato ISO YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return componentsToMexicoMidnight(Number(year), Number(month), Number(day));
  }

  // Formato español: dd de mes de yyyy
  const spanish = stripAccents(trimmed.toLowerCase()).match(
    /^(\d{1,2})\s+de\s+([a-z]+)\s+de\s+(\d{4})$/,
  );
  if (spanish) {
    const [, day, monthName, year] = spanish;
    const monthIndex = MONTHS_ES[monthName ?? ""];
    if (monthIndex === undefined) return null;
    
    // MONTHS_ES usa índices 0-11 (estilo JS Date), pero componentsToMexicoMidnight espera 1-12
    return componentsToMexicoMidnight(Number(year), monthIndex + 1, Number(day));
  }

  return null;
}

function mapBySynonym<T extends string>(
  raw: string | undefined,
  synonyms: Record<string, T>,
  fallback: T,
): T {
  if (!raw) return fallback;
  const normalized = stripAccents(raw.toLowerCase());

  for (const [key, value] of Object.entries(synonyms)) {
    if (normalized.includes(key)) return value;
  }

  return fallback;
}

/** Extrae montos numéricos de strings como "$1,000 - $2,400 MXN". */
function parseAmountRange(raw?: string): [number | null, number | null] {
  if (!raw) return [null, null];
  const numbers = raw.replace(/,/g, "").match(/\d+(\.\d+)?/g);
  if (!numbers || numbers.length === 0) return [null, null];
  if (numbers.length === 1) {
    const value = Number(numbers[0]);
    return [value, value];
  }
  return [Number(numbers[0]), Number(numbers[1])];
}

/**
 * Convierte una `RawScholarship` en `NormalizedScholarship`. Devuelve
 * `null` si faltan campos mínimos (título o URL).
 */
export function normalize(
  raw: RawScholarship,
  sourceId: string,
): NormalizedScholarship | null {
  const title = raw.title?.trim();
  const url = raw.url?.trim();
  if (!title || !url) return null;

  const [amountMin, amountMax] = parseAmountRange(raw.amountRaw);
  const deadline = raw.deadlineRaw ? parseSpanishDate(raw.deadlineRaw) : null;

  // Generar fingerprint básico (título + sourceId + año)
  const year = deadline?.getFullYear() ?? new Date().getFullYear();
  const fingerprint = `${stripAccents(title).toLowerCase().replace(/\s+/g, " ")}|${sourceId}|${year}`;

  return {
    title,
    slug: slugify(title),
    description: raw.descriptionRaw?.trim() || title,
    status: ScholarshipStatus.PENDING_REVIEW,
    coverageType: mapBySynonym(
      raw.coverageRaw,
      COVERAGE_SYNONYMS,
      CoverageType.MONETARY,
    ),
    amountMin,
    amountMax,
    currency: "MXN",
    countryOrigin: null,
    countryDestination: raw.countryRaw?.trim() || "No especificado",
    academicLevel: mapBySynonym(
      raw.levelRaw,
      LEVEL_SYNONYMS,
      AcademicLevel.UNDERGRAD,
    ),
    language: raw.languageRaw?.trim() || null,
    deadline,
    applyUrl: url,
    sourceId,
    isVerified: false,
    scrapedAt: new Date(),
    fingerprint,
    rawPayload: null,
    validationErrors: null,
  };
}

export type UpsertResult = "created" | "updated";

/**
 * Inserta o actualiza una beca normalizada. Usa `fingerprint` como clave de
 * deduplicación (estable entre corridas); si es nueva, resuelve colisiones
 * de `slug` agregando un sufijo numérico.
 */
export async function upsertScholarship(
  normalized: NormalizedScholarship,
): Promise<UpsertResult> {
  const existing = await db.scholarship.findFirst({
    where: { fingerprint: normalized.fingerprint },
  });

  if (existing) {
    await db.scholarship.update({
      where: { id: existing.id },
      data: { ...normalized, slug: existing.slug } as never,
    });
    return "updated";
  }

  let slug = normalized.slug;
  let suffix = 1;
  while (await db.scholarship.findUnique({ where: { slug } })) {
    slug = `${normalized.slug}-${suffix}`;
    suffix += 1;
  }

  await db.scholarship.create({ data: { ...normalized, slug } as never });
  return "created";
}
