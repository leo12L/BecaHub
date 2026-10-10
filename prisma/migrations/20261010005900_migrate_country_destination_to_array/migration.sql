-- AlterTable
-- 1. Add new destinationCountries column as TEXT[] (array of strings)
ALTER TABLE "Scholarship" ADD COLUMN "destinationCountries" TEXT[] NOT NULL DEFAULT '{}';

-- 2. Migrate data from countryDestination to destinationCountries
-- México / Mexico / mx → {MX}
UPDATE "Scholarship"
SET "destinationCountries" = ARRAY['MX']
WHERE LOWER("countryDestination") SIMILAR TO '%(mexico|méxico|^mx$)%';

-- Estados Unidos / USA / US → {US}
UPDATE "Scholarship"
SET "destinationCountries" = ARRAY['US']
WHERE "destinationCountries" = '{}'
  AND LOWER("countryDestination") SIMILAR TO '%(estados unidos|united states|^usa$|^us$|eeuu)%';

-- España / Spain / ES → {ES}
UPDATE "Scholarship"
SET "destinationCountries" = ARRAY['ES']
WHERE "destinationCountries" = '{}'
  AND (LOWER("countryDestination") SIMILAR TO '%(españa|espana|spain|^es$)%');

-- Canadá / Canada / CA → {CA}
UPDATE "Scholarship"
SET "destinationCountries" = ARRAY['CA']
WHERE "destinationCountries" = '{}'
  AND LOWER("countryDestination") SIMILAR TO '%(canadá|canada|^ca$)%';

-- Reino Unido / UK / GB → {GB}
UPDATE "Scholarship"
SET "destinationCountries" = ARRAY['GB']
WHERE "destinationCountries" = '{}'
  AND LOWER("countryDestination") SIMILAR TO '%(reino unido|united kingdom|^uk$|^gb$|inglaterra|england)%';

-- Alemania / Germany / DE → {DE}
UPDATE "Scholarship"
SET "destinationCountries" = ARRAY['DE']
WHERE "destinationCountries" = '{}'
  AND LOWER("countryDestination") SIMILAR TO '%(alemania|germany|^de$)%';

-- Francia / France / FR → {FR}
UPDATE "Scholarship"
SET "destinationCountries" = ARRAY['FR']
WHERE "destinationCountries" = '{}'
  AND LOWER("countryDestination") SIMILAR TO '%(francia|france|^fr$)%';

-- Italia / Italy / IT → {IT}
UPDATE "Scholarship"
SET "destinationCountries" = ARRAY['IT']
WHERE "destinationCountries" = '{}'
  AND LOWER("countryDestination") SIMILAR TO '%(italia|italy|^it$)%';

-- China / CN → {CN}
UPDATE "Scholarship"
SET "destinationCountries" = ARRAY['CN']
WHERE "destinationCountries" = '{}'
  AND LOWER("countryDestination") SIMILAR TO '%(china|^cn$)%';

-- Japón / Japan / JP → {JP}
UPDATE "Scholarship"
SET "destinationCountries" = ARRAY['JP']
WHERE "destinationCountries" = '{}'
  AND LOWER("countryDestination") SIMILAR TO '%(japón|japon|japan|^jp$)%';

-- Argentina / AR → {AR}
UPDATE "Scholarship"
SET "destinationCountries" = ARRAY['AR']
WHERE "destinationCountries" = '{}'
  AND LOWER("countryDestination") SIMILAR TO '%(argentina|^ar$)%';

-- Brasil / Brazil / BR → {BR}
UPDATE "Scholarship"
SET "destinationCountries" = ARRAY['BR']
WHERE "destinationCountries" = '{}'
  AND LOWER("countryDestination") SIMILAR TO '%(brasil|brazil|^br$)%';

-- 3. For any remaining empty arrays, add validation error
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
WHERE "destinationCountries" = '{}' AND "countryDestination" IS NOT NULL AND "countryDestination" != '';

-- 4. Drop the old countryDestination column
ALTER TABLE "Scholarship" DROP COLUMN "countryDestination";

-- 5. Drop the old index that referenced countryDestination
DROP INDEX IF EXISTS "Scholarship_countryDestination_academicLevel_idx";

-- 6. Create new index on destinationCountries
CREATE INDEX "Scholarship_destinationCountries_idx" ON "Scholarship"("destinationCountries");
