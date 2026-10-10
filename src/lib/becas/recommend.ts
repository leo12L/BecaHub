import { db } from "@/lib/db";
import type { Scholarship } from "@/generated/prisma/client";
import type { AcademicLevel, CoverageType } from "@/generated/prisma/enums";
import { filtroBecaPublica } from "@/lib/becas/publica";

/**
 * Subconjunto de `ProfileDraft`/`Profile` usado para recomendar becas. Acepta
 * tanto un perfil guardado (`db.profile`) como un borrador del asistente.
 */
export interface ProfileForRecommendation {
  academicLevel?: AcademicLevel | string | null;
  countryInterest?: string | null;
  scholarshipTypes?: (CoverageType | string)[];
  language?: string | null;
}

const DEFAULT_LIMIT = 10;

/**
 * Filtro básico de becas públicas (ACTIVE no vencidas) según el perfil del
 * estudiante: nivel académico, tipos de cobertura de interés y país de destino.
 * Sin autenticación necesaria — recibe el perfil directamente.
 *
 * Esto es una base intencionalmente simple; un matching más avanzado
 * (scoring por área de interés, idioma, situación socioeconómica, etc.) es
 * una mejora futura.
 */
export async function recomendarBecas(
  profile: ProfileForRecommendation,
  limit = DEFAULT_LIMIT,
): Promise<Scholarship[]> {
  return db.scholarship.findMany({
    where: {
      AND: [
        filtroBecaPublica(),
        ...(profile.academicLevel
          ? [{ academicLevel: profile.academicLevel as AcademicLevel }]
          : []),
        ...(profile.scholarshipTypes?.length
          ? [
              {
                coverageType: {
                  in: profile.scholarshipTypes as CoverageType[],
                },
              },
            ]
          : []),
        ...(profile.countryInterest
          ? [
              {
                countryDestination: {
                  contains: profile.countryInterest,
                  mode: "insensitive" as const,
                },
              },
            ]
          : []),
      ],
    },
    orderBy: { deadline: "asc" },
    take: limit,
  });
}
