import PQueue from "p-queue";
import { db } from "@/lib/db";
import { ScraperRunStatus, ScholarshipStatus } from "@/generated/prisma/enums";
import type { BecaCandidata, FuenteLector, ResultadoIngesta } from "./types";
import {
  generateFingerprint,
  validateBecaCandidata,
  validateUrlLiveness,
  normalizeForFingerprint,
} from "./utils";
import { parseSpanishDate } from "@/scrapers/normalize";
import { SECIHTILector } from "./fuentes/secihti";
import { JinaLector } from "./fuentes/jina";

/** Registro de lectores disponibles por slug */
export const LECTORES_REGISTRY: Record<string, new () => FuenteLector> = {
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

  let encontradas = 0;
  let creadas = 0;
  let actualizadas = 0;
  let omitidas = 0;
  let error: string | undefined;
  let status: ResultadoIngesta["status"] = "SUCCESS";

  // Crear log de scraper (E: con manejo de errores)
  let scraperLogId: string | null = null;
  try {
    const scraperLog = await db.scraperLog.create({
      data: {
        sourceId: source.id,
        status: ScraperRunStatus.RUNNING,
        startedAt: inicio,
      },
    });
    scraperLogId = scraperLog.id;
  } catch (err) {
    console.error(
      `[Ingesta] Error creando ScraperLog para ${source.name}:`,
      err,
    );
    // Continuar sin log
  }

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

  // Actualizar log de scraper (E: con manejo de errores)
  if (scraperLogId) {
    try {
      await db.scraperLog.update({
        where: { id: scraperLogId },
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
    } catch (err) {
      console.error(
        `[Ingesta] Error actualizando ScraperLog para ${source.name}:`,
        err,
      );
    }
  }

  // Actualizar lastScrapedAt de la fuente (con manejo de errores)
  try {
    await db.source.update({
      where: { id: source.id },
      data: { lastScrapedAt: fin },
    });
  } catch (err) {
    console.error(
      `[Ingesta] Error actualizando lastScrapedAt para ${source.name}:`,
      err,
    );
  }

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

  // Anotar suposiciones por defecto (F)
  if (!beca.academicLevel) {
    validationErrors.push(
      "Suposición: nivel académico UNDERGRAD (no especificado)",
    );
  }
  if (!beca.coverageType) {
    validationErrors.push("Suposición: cobertura MONETARY (no especificada)");
  }
  if (!beca.countryDestination) {
    validationErrors.push("Suposición: país México (no especificado)");
  }

  // Extraer año de la fuente si existe (SECIHTI conv_year)
  const yearFromSource = beca.rawData?.year as number | undefined;

  // Generar fingerprint con prioridad correcta (D)
  let fingerprint = generateFingerprint(beca, yearFromSource);

  // Buscar existente
  let existing = null;

  if (fingerprint) {
    // Buscar por fingerprint
    existing = await db.scholarship.findUnique({
      where: { fingerprint },
    });
  } else {
    // Sin año: buscar por título normalizado + convocante
    const titleNorm = normalizeForFingerprint(beca.title);
    const convocanteNorm = beca.convocante
      ? normalizeForFingerprint(beca.convocante)
      : "";

    const candidates = await db.scholarship.findMany({
      where: {
        title: {
          contains: titleNorm.split(" ")[0], // Buscar por primera palabra
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        title: true,
        fingerprint: true,
        sourceId: true,
      },
    });

    // Buscar coincidencia exacta de título+convocante normalizados
    for (const candidate of candidates) {
      const candTitleNorm = normalizeForFingerprint(candidate.title);
      if (candTitleNorm === titleNorm) {
        // Obtener source para verificar convocante
        const source = await db.source.findUnique({
          where: { id: candidate.sourceId },
        });
        const candConvocanteNorm = source?.name
          ? normalizeForFingerprint(source.name)
          : "";

        if (candConvocanteNorm === convocanteNorm) {
          existing = await db.scholarship.findUnique({
            where: { id: candidate.id },
          });
          // Actualizar el fingerprint del existente si ahora tenemos año
          if (existing && !existing.fingerprint && parsedDeadline) {
            fingerprint = `${titleNorm}|${convocanteNorm}|${parsedDeadline.getFullYear()}`;
          }
          break;
        }
      }
    }
  }

  if (existing) {
    // Actualizar solo campos permitidos (A)
    const updateData: {
      rawPayload?: unknown;
      scrapedAt: Date;
      validationErrors: unknown;
      fingerprint?: string;
    } = {
      scrapedAt: new Date(),
      validationErrors:
        validationErrors.length > 0 ? (validationErrors as unknown) : null,
    };

    if (beca.rawData) {
      updateData.rawPayload = beca.rawData as unknown;
    }

    if (fingerprint && fingerprint !== existing.fingerprint) {
      updateData.fingerprint = fingerprint;
    }

    // Detectar cambios en deadline o applyUrl
    if (existing.deadline && parsedDeadline) {
      const existingDate = new Date(existing.deadline).getTime();
      const newDate = parsedDeadline.getTime();
      if (Math.abs(existingDate - newDate) > 86400000) {
        // Diferencia >1 día
        validationErrors.push(
          `La fecha de cierre cambió: antes ${new Date(existing.deadline).toISOString().split("T")[0]}, ahora ${parsedDeadline.toISOString().split("T")[0]}`,
        );
        updateData.validationErrors = validationErrors as unknown;
      }
    }

    if (existing.applyUrl !== beca.applyUrl) {
      validationErrors.push(
        `El link cambió: antes ${existing.applyUrl}, ahora ${beca.applyUrl}`,
      );
      updateData.validationErrors = validationErrors as unknown;
    }

    await db.scholarship.update({
      where: { id: existing.id },
      data: updateData as never,
    });

    return "updated";
  }

  // Crear nueva beca
  let slug = slugify(beca.title);
  let suffix = 1;

  while (await db.scholarship.findUnique({ where: { slug } })) {
    slug = `${slugify(beca.title)}-${suffix}`;
    suffix += 1;
  }

  const createData = {
    title: beca.title,
    slug,
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
    ...(beca.rawData && { rawPayload: beca.rawData as unknown }),
    validationErrors:
      validationErrors.length > 0 ? (validationErrors as unknown) : null,
  };

  await db.scholarship.create({
    data: createData as never,
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
