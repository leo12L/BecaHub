import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Tests que tocan Postgres. Deben correr de a un archivo para no
 * interferir fixtures (conteos, upserts, limpiezas) entre sí.
 */
const dbTests = [
  "src/lib/becas/__tests__/publica.test.ts",
  "src/lib/becas/__tests__/search.test.ts",
  "src/lib/becas/__tests__/recommend.test.ts",
  "src/lib/becas/__tests__/queries.test.ts",
  "src/lib/becas/__tests__/filter-by-destination.test.ts",
  "src/lib/becas/__tests__/limpiar-becas.test.ts",
  "src/lib/becas/__tests__/countries-count.test.ts",
  "src/app/api/v1/__tests__/visibilidad-publica.test.ts",
  "src/app/api/v1/favoritos/__tests__/route.test.ts",
  "src/app/api/v1/postulaciones/__tests__/route.test.ts",
  "src/app/api/becas/__tests__/route-security.test.ts",
  "src/app/api/__tests__/user-isolation.test.ts",
  "src/app/api/perfil/__tests__/route.test.ts",
  "src/lib/ingesta/__tests__/ejecutar-db-full.test.ts",
  "src/lib/supabase/__tests__/server.test.ts",
  "prisma/__tests__/migrate-country.test.ts",
  "src/lib/__tests__/unconfirmed-email.test.ts",
  "src/lib/__tests__/user-roles.test.ts",
  "src/__tests__/proxy.test.ts",
];

const sharedTest = {
  environment: "node" as const,
  globals: true,
  env: { TZ: "UTC" },
  exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          ...sharedTest,
          name: "unit",
          include: ["src/**/*.test.ts"],
          exclude: [...sharedTest.exclude, ...dbTests],
        },
      },
      {
        extends: true,
        test: {
          ...sharedTest,
          name: "db",
          include: dbTests,
          fileParallelism: false,
        },
      },
    ],
  },
});
