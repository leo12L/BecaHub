import { z } from "zod";
import { CoverageType, AcademicLevel } from "@/generated/prisma/enums";

/** Body de `POST /api/admin/ai/parse-beca`. */
export const parseBecaSchema = z.object({
  text: z.string().min(1).max(20000),
});

export type ParseBecaBody = z.infer<typeof parseBecaSchema>;

const coverageTypeValues = Object.values(CoverageType) as [string, ...string[]];
const academicLevelValues = Object.values(AcademicLevel) as [
  string,
  ...string[],
];

/**
 * Forma esperada del JSON devuelto por el modelo de IA al extraer una beca
 * de texto libre. Todos los campos son `nullable` porque el modelo puede no
 * encontrar el dato en el texto — el curador completa lo que falte a mano.
 */
export const parsedScholarshipSchema = z.object({
  title: z.string().nullable(),
  description: z.string().nullable(),
  deadline: z.string().nullable(),
  coverageType: z.enum(coverageTypeValues).nullable(),
  country: z.string().nullable(),
  level: z.enum(academicLevelValues).nullable(),
});

export type ParsedScholarship = z.infer<typeof parsedScholarshipSchema>;
