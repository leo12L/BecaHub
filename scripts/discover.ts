import "dotenv/config";
import { runAutoDiscovery } from "../src/scrapers/discovery/auto-discovery";

/**
 * Corre el descubrimiento automático de becas con Tavily de punta a punta:
 * busca, valida links, filtra México+vigente y guarda como `PENDING_REVIEW`.
 * Uso: `npm run discover`.
 */
async function main() {
  console.log("Iniciando descubrimiento automático (Tavily)...");
  const result = await runAutoDiscovery();

  console.log(`\nQueries ejecutadas (${result.queries.length}):`);
  result.queries.forEach((q) => console.log(`  - ${q}`));
  console.log(`\nDominios priorizados: ${result.includeDomains.join(", ")}`);
  console.log(`Créditos de Tavily consumidos: ${result.creditsUsed}`);

  console.log("\nResultado:");
  console.log(JSON.stringify(result, null, 2));

  if (result.status === "FAILED") {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
