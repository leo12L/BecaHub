import PQueue from "p-queue";
import { db } from "@/lib/db";
import { ScraperRunStatus, ScholarshipStatus } from "@/generated/prisma/enums";
import type { BecaCandidata, FuenteLector, ResultadoIngesta } from "./types";
import {
  generateFingerprint,
  validateBecaCandidata,
  validateUrlLiveness,
} from "./utils";
import { parseSpanishDate } from "@/scrapers/normalize";
import { SECIHTILector } from "./fuentes/secihti";
import { JinaLector } from "./fuentes/jina";

/** Registro de lectores disponibles por slug */
const LECTORES_REGISTRY: Record<string, new () => FuenteLector> = {
  "secihti-api": SECIHTILector,
  "jina-reader": JinaLector,
};

/** Cuántas fuentes se procesan en paralelo */
const CONCURRENCY = 3;

/**
 * Ejecuta la ingesta automática para todas las fuentes activas
 * o para una fuente específica.
 *
 * @param target - ID de fuente específica o "all" para todas
 * @returns Array de resultados por fuente
 */
export async function ejecutarIngesta(
  target: string | "all" = "all",
): Promise<ResultadoIngesta[]> {
  const sources = await db.source.findMany({
    where: {
      isActive: true,
      ...(target === "all" ? {} : { id: target }),
    },
  });

  if (sources.length === 0) {
    console.log("[Ingesta] No hay fuentes activas para procesar");
    return [];
  }

  const queue = new PQueue({ concurrency: CONCURRENCY });

  const resultados = await Promise.all(
    sources.map(
      (source) =>
        queue.add(() => procesarFuente(source)) as Promise<ResultadoIngesta>,
    ),
  );

  return resultados;
}

async function procesarFuente(source: {
  id: string;
  name: string;
  scraperAdapter: string | null;
}): Promise<ResultadoIngesta> {
  const inicio = new Date();
  console.log(`[Ingesta] Iniciando: ${source.name}`);

  // Crear log de scraper
  const scraperLog = await db.scraperLog.create({
    data: {
      sourceId: source.id,
      status: ScraperRunStatus.RUNNING,
      startedAt: inicio,
    },
  });

  let encontradas = 0;
  let creadas = 0;
  let actualizadas = 0;
  let omitidas = 0;
  let error: string | undefined;
  let status: ResultadoIngesta["status"] = "SUCCESS";

  try {
    const LectorClass = source.scraperAdapter
      ? LECTORES_REGISTRY[source.scraperAdapter]
      : undefined;

    if (!LectorClass) {
      throw new Error(
        `No hay lector registrado para "${source.scraperAdapter ?? "(sin asignar)"}"`,
      );
    }

    const lector = new LectorClass();
    console.log(`[Ingesta] Obteniendo datos de ${lector.nombre}...`);

    const rawData = await lector.obtener();
    const becasCandidatas = lector.normalizar(rawData);
    encontradas = becasCandidatas.length;

    console.log(`[Ingesta] ${source.name}: ${encontradas} becas encontradas`);

    for (const beca of becasCandidatas) {
      try {
        const resultado = await procesarBeca(beca, source.id);
        if (resultado === "created") creadas++;
        else if (resultado === "updated") actualizadas++;
        else omitidas++;
      } catch (err) {
        console.warn(
          `[Ingesta] Error procesando beca "${beca.title}":`,
          err instanceof Error ? err.message : String(err),
        );
        omitidas++;
      }
    }

    // Determinar status final
    if (encontradas === 0) {
      status = "PARTIAL";
      error = "No se encontraron becas";
    } else if (omitidas === encontradas) {
      status = "FAILED";
      error = "Todas las becas fueron omitidas";
    } else if (omitidas > 0) {
      status = "PARTIAL";
    }
  } catch (err) {
    status = "FAILED";
    error = err instanceof Error ? err.message : String(err);
    console.error(`[Ingesta] Error en ${source.name}:`, error);
  }

  const fin = new Date();
  const duracionMs = fin.getTime() - inicio.getTime();

  // Actualizar log de scraper
  await db.scraperLog.update({
    where: { id: scraperLog.id },
    data: {
      status:
        status === "SUCCESS"
          ? ScraperRunStatus.SUCCESS
          : status === "PARTIAL"
            ? ScraperRunStatus.PARTIAL
            : ScraperRunStatus.FAILED,
      itemsFound: encontradas,
      itemsCreated: creadas,
      itemsUpdated: actualizadas,
      itemsSkipped: omitidas,
      errorMessage: error,
      finishedAt: fin,
      durationMs: duracionMs,
    },
  });

  // Actualizar lastScrapedAt de la fuente
  await db.source.update({
    where: { id: source.id },
    data: { lastScrapedAt: fin },
  });

  console.log(
    `[Ingesta] ${source.name} completado: ${creadas} creadas, ${actualizadas} actualizadas, ${omitidas} omitidas`,
  );

  return {
    sourceId: source.id,
    fuente: source.name,
    status,
    encontradas,
    creadas,
    actualizadas,
    omitidas,
    error,
    inicio,
    fin,
    duracionMs,
  };
}

type ProcesarResult = "created" | "updated" | "skipped";

async function procesarBeca(
  beca: BecaCandidata,
  sourceId: string,
): Promise<ProcesarResult> {
  // Validar estructura básica
  const validation = validateBecaCandidata(beca);
  const validationErrors: string[] = validation.errors ?? [];

  // Validar URL viva (no bloquear si falla, solo registrar)
  const urlCheck = await validateUrlLiveness(beca.applyUrl);
  if (!urlCheck.valid) {
    validationErrors.push(
      `URL no accesible: ${urlCheck.error ?? "desconocido"}`,
    );
  }

  // Validar deadline (si está presente y es parseable)
  let parsedDeadline: Date | null = null;
  if (beca.deadline) {
    parsedDeadline = parseSpanishDate(beca.deadline);
    if (!parsedDeadline) {
      validationErrors.push(`Formato de fecha no reconocido: ${beca.deadline}`);
    }
  } else {
    validationErrors.push("Fecha de cierre ausente");
  }

  // Generar fingerprint
  const fingerprint = generateFingerprint(beca);

  // Buscar si ya existe (por fingerprint)
  const existing = await db.scholarship.findUnique({
    where: { fingerprint },
  });

  const baseData = {
    title: beca.title,
    description: beca.description,
    status: ScholarshipStatus.PENDING_REVIEW,
    coverageType: mapCoverageType(beca.coverageType),
    amountMin: extractAmount(beca.amount)?.[0] ?? null,
    amountMax: extractAmount(beca.amount)?.[1] ?? null,
    currency: "MXN",
    countryOrigin: null,
    countryDestination: beca.countryDestination ?? "México",
    academicLevel: mapAcademicLevel(beca.academicLevel),
    language: beca.language ?? null,
    deadline: parsedDeadline,
    applyUrl: beca.applyUrl,
    sourceId,
    isVerified: false,
    scrapedAt: new Date(),
    fingerprint,
  };

  const data = {
    ...baseData,
    ...(beca.rawData && { rawPayload: beca.rawData as unknown }),
    ...(validationErrors.length > 0 && {
      validationErrors: validationErrors as unknown,
    }),
  };

  if (existing) {
    // Actualizar existente
    await db.scholarship.update({
      where: { id: existing.id },
      data: {
        ...data,
        slug: existing.slug, // Mantener slug original
      } as never,
    });
    return "updated";
  }

  // Crear nueva beca
  let slug = slugify(beca.title);
  let suffix = 1;

  // Resolver colisiones de slug
  while (await db.scholarship.findUnique({ where: { slug } })) {
    slug = `${slugify(beca.title)}-${suffix}`;
    suffix += 1;
  }

  await db.scholarship.create({
    data: { ...data, slug } as never,
  });

  return "created";
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function mapCoverageType(raw: string | null): string {
  if (!raw) return "MONETARY";

  const normalized = raw.toLowerCase();
  if (normalized.includes("completa") || normalized.includes("full"))
    return "FULL";
  if (normalized.includes("colegiatura") || normalized.includes("tuition"))
    return "TUITION";
  if (normalized.includes("viaje") || normalized.includes("movilidad"))
    return "TRAVEL";
  if (normalized.includes("investigaci") || normalized.includes("research"))
    return "RESEARCH";
  if (normalized.includes("deport")) return "SPORTS";
  if (normalized.includes("liderazgo") || normalized.includes("leadership"))
    return "LEADERSHIP";

  return "MONETARY";
}

function mapAcademicLevel(raw: string | null): string {
  if (!raw) return "UNDERGRAD";

  const normalized = raw.toLowerCase();
  if (
    normalized.includes("bachillerato") ||
    normalized.includes("preparatoria") ||
    normalized.includes("media superior")
  )
    return "HIGH_SCHOOL";
  if (
    normalized.includes("licenciatura") ||
    normalized.includes("undergraduate") ||
    normalized.includes("pregrado")
  )
    return "UNDERGRAD";
  if (
    normalized.includes("maestr") ||
    normalized.includes("master") ||
    normalized.includes("posgrado")
  )
    return "GRAD";
  if (normalized.includes("doctor")) return "PHD";
  if (normalized.includes("posdoc")) return "POSTDOC";
  if (normalized.includes("profesional")) return "PROFESSIONAL";

  return "UNDERGRAD";
}

function extractAmount(raw: string | null): [number | null, number | null] {
  if (!raw) return [null, null];

  const numbers = raw.replace(/,/g, "").match(/\d+(\.\d+)?/g);
  if (!numbers || numbers.length === 0) return [null, null];

  if (numbers.length === 1) {
    const value = Number(numbers[0]);
    return [value, value];
  }

  return [Number(numbers[0]), Number(numbers[1])];
}
