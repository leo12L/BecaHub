import { z } from "zod";

/** Body de `POST /api/admin/scraper/ejecutar`. Sin `sourceId` = todas las fuentes activas. */
export const ejecutarScraperSchema = z.object({
  sourceId: z.string().uuid().optional(),
});

export type EjecutarScraperBody = z.infer<typeof ejecutarScraperSchema>;

/** Query params de `GET /api/admin/scraper/logs`. */
export const scraperLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ScraperLogsQuery = z.infer<typeof scraperLogsQuerySchema>;
