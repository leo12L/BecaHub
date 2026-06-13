import { z } from "zod";
import { CoverageType, AcademicLevel } from "@/generated/prisma/enums";

const coverageTypeValues = Object.values(CoverageType) as [string, ...string[]];
const academicLevelValues = Object.values(AcademicLevel) as [
  string,
  ...string[],
];

/** Body de `POST /api/admin/becas/validar-url`. */
export const validarUrlSchema = z.object({
  url: z.string().url(),
});

/**
 * Body de `POST /api/admin/becas` y `PUT /api/admin/becas/[id]`.
 *
 * `status` solo admite `DRAFT`/`ACTIVE` desde el panel de admin — las becas
 * scrapeadas usan `PENDING_REVIEW` y `CLOSED` se decide al re-verificar.
 * El enforcement de "México + vigente + link vivo para ACTIVE" se hace en
 * el route handler (necesita I/O: `checkUrlHealth`).
 */
export const adminBecaInputSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10),
  status: z.enum(["DRAFT", "ACTIVE"]),
  coverageType: z.enum(coverageTypeValues),
  amountMin: z.number().nonnegative().nullable().optional(),
  amountMax: z.number().nonnegative().nullable().optional(),
  currency: z.string().trim().min(1).max(10).default("MXN"),
  countryOrigin: z.string().trim().min(1).max(100).nullable().optional(),
  countryDestination: z.string().trim().min(1).max(100).default("México"),
  academicLevel: z.enum(academicLevelValues),
  language: z.string().trim().min(1).max(50).nullable().optional(),
  deadline: z.string().trim().min(1).nullable().optional(),
  applyUrl: z.string().trim().url(),
  sourceId: z.string().uuid(),
  categoryIds: z.array(z.string().uuid()).default([]),
});

export type AdminBecaInput = z.infer<typeof adminBecaInputSchema>;

/** Body de `PATCH /api/admin/becas/[id]` (acciones rápidas: archivar). */
export const adminBecaPatchSchema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]),
});
