import "dotenv/config";
import { runScraper } from "../src/scrapers/orchestrator";

/**
 * Ejecuta el scraping manualmente desde la línea de comandos.
 * Uso: `npm run scrape` (todas las fuentes activas) o `npm run scrape -- <sourceId>`.
 */
async function main() {
  const target = process.argv[2] ?? "all";
  console.log(`Iniciando scraping (target: ${target})...`);

  const results = await runScraper(target);
  console.log(JSON.stringify(results, null, 2));

  if (results.some((result) => result.status === "FAILED")) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
