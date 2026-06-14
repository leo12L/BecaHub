import PQueue from "p-queue";
import { db } from "@/lib/db";
import { ScraperRunStatus } from "@/generated/prisma/enums";
import { normalize, upsertScholarship } from "./normalize";
import type { ScraperAdapter, ScraperRunResult } from "./types";
import { BecasGobAdapter } from "./adapters/becas-gob.adapter";
import { TavilyDiscoveryAdapter } from "./adapters/tavily-discovery.adapter";
import { PerplexityDiscoveryAdapter } from "./adapters/perplexity-discovery.adapter";

/** Mapa de `Source.scraperAdapter` -> clase de adapter concreta. */
const ADAPTER_REGISTRY: Record<string, new () => ScraperAdapter> = {
  "becas-gob-mx": BecasGobAdapter,
  "tavily-discovery": TavilyDiscoveryAdapter,
  "perplexity-discovery": PerplexityDiscoveryAdapter,
};

/** Cuántas fuentes distintas se procesan en paralelo (el throttle de
 * 1 req/seg por dominio dentro de cada adapter sigue aplicando). */
const ORCHESTRATOR_CONCURRENCY = 3;

/**
 * Ejecuta el scraping para una fuente (`sourceId`) o para todas las fuentes
 * activas (`"all"`). Crea y actualiza un `ScraperLog` por fuente procesada
 * y actualiza `source.lastScrapedAt`. Una fuente que falla no detiene al
 * resto.
 */
export async function runScraper(
  target: string | "all",
): Promise<ScraperRunResult[]> {
  const sources = await db.source.findMany({
    where: {
      isActive: true,
      ...(target === "all" ? {} : { id: target }),
    },
  });

  const queue = new PQueue({ concurrency: ORCHESTRATOR_CONCURRENCY });

  return Promise.all(
    sources.map((source) => queue.add(() => runForSource(source))),
  ) as Promise<ScraperRunResult[]>;
}

async function runForSource(source: {
  id: string;
  scraperAdapter: string | null;
}): Promise<ScraperRunResult> {
  const startedAt = new Date();
  const log = await db.scraperLog.create({
    data: {
      sourceId: source.id,
      status: ScraperRunStatus.RUNNING,
      startedAt,
    },
  });

  let itemsFound = 0;
  let itemsCreated = 0;
  let itemsUpdated = 0;
  let itemsSkipped = 0;
  let errorMessage: string | undefined;
  let status: (typeof ScraperRunStatus)[keyof typeof ScraperRunStatus] =
    ScraperRunStatus.SUCCESS;

  try {
    const AdapterClass = source.scraperAdapter
      ? ADAPTER_REGISTRY[source.scraperAdapter]
      : undefined;

    if (!AdapterClass) {
      throw new Error(
        `No hay adapter registrado para "${source.scraperAdapter ?? "(sin asignar)"}"`,
      );
    }

    const adapter = new AdapterClass();
    const rawItems = await adapter.scrape();
    itemsFound = rawItems.length;

    for (const raw of rawItems) {
      const normalized = normalize(raw, source.id);
      if (!normalized) {
        itemsSkipped += 1;
        continue;
      }

      try {
        const outcome = await upsertScholarship(normalized);
        if (outcome === "created") itemsCreated += 1;
        else itemsUpdated += 1;
      } catch {
        itemsSkipped += 1;
      }
    }

    if (itemsFound === 0) {
      status = ScraperRunStatus.PARTIAL;
    } else if (itemsSkipped === itemsFound) {
      status = ScraperRunStatus.FAILED;
    } else if (itemsSkipped > 0) {
      status = ScraperRunStatus.PARTIAL;
    }
  } catch (error) {
    status = ScraperRunStatus.FAILED;
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  const finishedAt = new Date();
  const result: ScraperRunResult = {
    sourceId: source.id,
    status,
    itemsFound,
    itemsCreated,
    itemsUpdated,
    itemsSkipped,
    errorMessage,
    startedAt,
    finishedAt,
    durationMs: finishedAt.getTime() - startedAt.getTime(),
  };

  await db.scraperLog.update({
    where: { id: log.id },
    data: {
      status: result.status,
      itemsFound: result.itemsFound,
      itemsCreated: result.itemsCreated,
      itemsUpdated: result.itemsUpdated,
      itemsSkipped: result.itemsSkipped,
      errorMessage: result.errorMessage,
      finishedAt: result.finishedAt,
      durationMs: result.durationMs,
    },
  });

  await db.source.update({
    where: { id: source.id },
    data: { lastScrapedAt: finishedAt },
  });

  return result;
}
