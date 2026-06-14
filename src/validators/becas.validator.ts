import { z } from "zod";

export const scholarshipStatusValues = [
  "ACTIVE",
  "CLOSED",
  "DRAFT",
  "PENDING_REVIEW",
] as const;

export const academicLevelValues = [
  "HIGH_SCHOOL",
  "UNDERGRAD",
  "GRAD",
  "PHD",
  "POSTDOC",
  "PROFESSIONAL",
] as const;

/**
 * Query params soportados por GET /api/becas.
 * `type` y `area` son slugs de Category (ejes TYPE y AREA respectivamente).
 */
export const becasQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum(scholarshipStatusValues).optional(),
  type: z.string().min(1).optional(),
  area: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  level: z.enum(academicLevelValues).optional(),
  deadlineBefore: z.coerce.date().optional(),
  search: z.string().min(1).max(200).optional(),
});

export type BecasQuery = z.infer<typeof becasQuerySchema>;
