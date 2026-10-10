-- countryDestination (texto libre) → destinationCountries (ISO-3166 alpha-2[])
-- Replica parseCountryDestination() de src/lib/geo.ts:
--   1. Recorta whitespace JS (espacios, tabs, saltos, NBSP U+00A0) del valor y de cada token.
--   2. Parte por coma, ;, /, y/o/e/u como palabra completa.
--   3. Normaliza (minúsculas, sin acentos, ñ→n) y busca el mapa exacto.
--   4. Dedup con GROUP BY conservando el primer orden (MIN ord).
--   5. Vacío o no reconocido → {} (nunca México).

-- 1. Nueva columna
ALTER TABLE "Scholarship" ADD COLUMN "destinationCountries" TEXT[] NOT NULL DEFAULT '{}';

-- 2. Convertir cada valor con el mismo mapa y el mismo split que JS
WITH name_to_code(name, code) AS (
  VALUES
    ('mexico', 'MX'),
    ('mx', 'MX'),
    ('estados unidos', 'US'),
    ('united states', 'US'),
    ('usa', 'US'),
    ('us', 'US'),
    ('eeuu', 'US'),
    ('canada', 'CA'),
    ('ca', 'CA'),
    ('espana', 'ES'),
    ('spain', 'ES'),
    ('es', 'ES'),
    ('reino unido', 'GB'),
    ('united kingdom', 'GB'),
    ('uk', 'GB'),
    ('gb', 'GB'),
    ('inglaterra', 'GB'),
    ('england', 'GB'),
    ('alemania', 'DE'),
    ('germany', 'DE'),
    ('de', 'DE'),
    ('francia', 'FR'),
    ('france', 'FR'),
    ('fr', 'FR'),
    ('italia', 'IT'),
    ('italy', 'IT'),
    ('it', 'IT'),
    ('china', 'CN'),
    ('cn', 'CN'),
    ('japon', 'JP'),
    ('japan', 'JP'),
    ('jp', 'JP'),
    ('argentina', 'AR'),
    ('ar', 'AR'),
    ('brasil', 'BR'),
    ('brazil', 'BR'),
    ('br', 'BR'),
    ('chile', 'CL'),
    ('cl', 'CL'),
    ('colombia', 'CO'),
    ('co', 'CO'),
    ('peru', 'PE'),
    ('pe', 'PE'),
    ('australia', 'AU'),
    ('au', 'AU'),
    ('nueva zelanda', 'NZ'),
    ('new zealand', 'NZ'),
    ('nz', 'NZ'),
    ('paises bajos', 'NL'),
    ('netherlands', 'NL'),
    ('holanda', 'NL'),
    ('holland', 'NL'),
    ('nl', 'NL'),
    ('belgica', 'BE'),
    ('belgium', 'BE'),
    ('be', 'BE'),
    ('suiza', 'CH'),
    ('switzerland', 'CH'),
    ('ch', 'CH'),
    ('suecia', 'SE'),
    ('sweden', 'SE'),
    ('se', 'SE'),
    ('noruega', 'NO'),
    ('norway', 'NO'),
    ('no', 'NO'),
    ('portugal', 'PT'),
    ('pt', 'PT'),
    ('corea del sur', 'KR'),
    ('south korea', 'KR'),
    ('corea', 'KR'),
    ('korea', 'KR'),
    ('kr', 'KR')
),
converted AS (
  SELECT
    sch.id,
    ARRAY(
      SELECT m.code
      FROM regexp_split_to_table(
        regexp_replace(
          COALESCE(sch."countryDestination", ''),
          E'^[\\s\\u00A0]+|[\\s\\u00A0]+$',
          '',
          'g'
        ),
        '[,;/]|\y[yYoOeEuU]\y'
      ) WITH ORDINALITY AS t(part, ord)
      JOIN name_to_code m
        ON m.name = lower(unaccent(replace(replace(
          regexp_replace(t.part, E'^[\\s\\u00A0]+|[\\s\\u00A0]+$', '', 'g'),
          'ñ', 'n'
        ), 'Ñ', 'n')))
      WHERE regexp_replace(t.part, E'^[\\s\\u00A0]+|[\\s\\u00A0]+$', '', 'g') <> ''
      GROUP BY m.code
      ORDER BY MIN(t.ord)
    ) AS codes
  FROM "Scholarship" sch
)
UPDATE "Scholarship" AS s
SET "destinationCountries" = c.codes
FROM converted c
WHERE s.id = c.id;

-- 3. Anotar valores no vacíos que no se pudieron mapear (el arreglo queda {})
UPDATE "Scholarship"
SET "validationErrors" =
  CASE
    WHEN "validationErrors" IS NULL THEN
      jsonb_build_array(jsonb_build_object(
        'field', 'destinationCountries',
        'message', 'No se pudo mapear el país de destino',
        'originalValue', "countryDestination"
      ))
    ELSE
      "validationErrors"::jsonb || jsonb_build_array(jsonb_build_object(
        'field', 'destinationCountries',
        'message', 'No se pudo mapear el país de destino',
        'originalValue', "countryDestination"
      ))
  END
WHERE "destinationCountries" = '{}'
  AND "countryDestination" IS NOT NULL
  AND regexp_replace("countryDestination", E'^[\\s\\u00A0]+|[\\s\\u00A0]+$', '', 'g') <> '';

-- 4. Quitar la columna e índice viejos
ALTER TABLE "Scholarship" DROP COLUMN "countryDestination";
DROP INDEX IF EXISTS "Scholarship_countryDestination_academicLevel_idx";

-- 5. Índice GIN para consultas has / hasSome sobre el arreglo
CREATE INDEX "Scholarship_destinationCountries_idx"
  ON "Scholarship" USING GIN ("destinationCountries");
