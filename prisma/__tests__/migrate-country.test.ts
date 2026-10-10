/**
 * Aplica la migración REAL `20261010005900_migrate_country_destination_to_array`
 * sobre una base en el estado de `main` (columna `countryDestination` texto)
 * y comprueba que cada valor queda igual que `parseCountryDestination()`.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { parseCountryDestination } from "@/lib/geo";

const TARGET_MIGRATION = "20261010005900_migrate_country_destination_to_array";
const OLD_VALUES = [
  "México",
  "MX",
  "USA",
  "México y España",
  "Europa",
  "",
] as const;

const connectionString =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";
const shouldSkip = !connectionString;

function withDatabase(url: string, database: string): string {
  const parsed = new URL(url);
  parsed.pathname = `/${database}`;
  return parsed.toString();
}

function migrationDirs(root: string): string[] {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d+_/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

async function applySqlFile(client: Client, filePath: string) {
  const sql = readFileSync(filePath, "utf8");
  await client.query(sql);
}

describe.skipIf(shouldSkip)(
  "migración real countryDestination → destinationCountries",
  () => {
    const dbName = `becahub_mig_country_${process.pid}_${Date.now()}`;
    const migrationsRoot = join(process.cwd(), "prisma/migrations");
    const admin = new Client({
      connectionString: withDatabase(connectionString, "postgres"),
    });
    let migrated: Client | null = null;

    beforeAll(async () => {
      await admin.connect();
      await admin.query(`CREATE DATABASE ${dbName}`);

      migrated = new Client({
        connectionString: withDatabase(connectionString, dbName),
      });
      await migrated.connect();

      const dirs = migrationDirs(migrationsRoot);
      expect(dirs).toContain(TARGET_MIGRATION);

      for (const dir of dirs) {
        if (dir === TARGET_MIGRATION) break;
        await applySqlFile(
          migrated,
          join(migrationsRoot, dir, "migration.sql"),
        );
      }

      const countryColumn = await migrated.query<{ exists: boolean }>(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'Scholarship'
            AND column_name = 'countryDestination'
        ) AS exists
      `);
      expect(countryColumn.rows[0]?.exists).toBe(true);

      await migrated.query(`
        INSERT INTO "Source" (id, name, url, type)
        VALUES (
          'mig-country-source',
          'Fuente estado main',
          'https://example.com/mig-country',
          'MANUAL'
        )
      `);

      for (const [index, countryDestination] of OLD_VALUES.entries()) {
        await migrated.query(
          `
          INSERT INTO "Scholarship" (
            id, title, slug, description, status, "coverageType",
            "countryDestination", "academicLevel", "applyUrl", "sourceId",
            "updatedAt"
          ) VALUES (
            $1, $2, $3, 'texto de prueba', 'ACTIVE', 'MONETARY',
            $4, 'UNDERGRAD', $5, 'mig-country-source', NOW()
          )
        `,
          [
            `mig-country-${index}`,
            `Beca ${countryDestination || "(vacío)"}`,
            `mig-country-${index}`,
            countryDestination,
            `https://example.com/mig-country/${index}`,
          ],
        );
      }

      await applySqlFile(
        migrated,
        join(migrationsRoot, TARGET_MIGRATION, "migration.sql"),
      );
    }, 60_000);

    afterAll(async () => {
      if (migrated) {
        await migrated.end().catch(() => undefined);
      }
      try {
        await admin.query(
          `
          SELECT pg_terminate_backend(pid)
          FROM pg_stat_activity
          WHERE datname = $1 AND pid <> pg_backend_pid()
        `,
          [dbName],
        );
        await admin.query(`DROP DATABASE IF EXISTS ${dbName}`);
      } finally {
        await admin.end().catch(() => undefined);
      }
    }, 30_000);

    it("deja en cada beca los mismos códigos que parseCountryDestination()", async () => {
      expect(migrated).not.toBeNull();
      const result = await migrated!.query<{
        slug: string;
        destinationCountries: string[];
      }>(
        `
        SELECT slug, "destinationCountries"
        FROM "Scholarship"
        ORDER BY slug
      `,
      );

      expect(result.rows).toHaveLength(OLD_VALUES.length);

      for (const [index, oldValue] of OLD_VALUES.entries()) {
        const row = result.rows.find((r) => r.slug === `mig-country-${index}`);
        expect(row, `faltó la beca de "${oldValue}"`).toBeDefined();
        expect(row!.destinationCountries).toEqual(
          parseCountryDestination(oldValue),
        );
      }
    });

    it("no convierte vacío ni 'Europa' en México", async () => {
      expect(parseCountryDestination("")).toEqual([]);
      expect(parseCountryDestination("Europa")).toEqual([]);

      const result = await migrated!.query<{ destinationCountries: string[] }>(
        `
        SELECT "destinationCountries"
        FROM "Scholarship"
        WHERE slug IN ('mig-country-4', 'mig-country-5')
      `,
      );

      for (const row of result.rows) {
        expect(row.destinationCountries).toEqual([]);
        expect(row.destinationCountries).not.toContain("MX");
      }
    });

    it("crea el índice GIN sobre destinationCountries", async () => {
      const result = await migrated!.query<{ indexdef: string }>(
        `
        SELECT indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'Scholarship'
          AND indexname = 'Scholarship_destinationCountries_idx'
      `,
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]!.indexdef.toLowerCase()).toContain("using gin");
    });
  },
);
