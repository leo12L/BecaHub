import "dotenv/config";
import { BecasGobAdapter } from "../src/scrapers/adapters/becas-gob.adapter";
import { validateUrlIsLive } from "../src/scrapers/url-liveness";
import { buildRawScholarship } from "../src/scrapers/discovery/heuristics";

/**
 * Script de prueba standalone (dry-run, sin DB) para `BecasGobAdapter`.
 * Ejecuta el pipeline etapa por etapa e imprime el resultado de cada una.
 * Sin LLM: los campos ricos se infieren con heurísticas
 * (`src/scrapers/discovery/heuristics.ts`).
 *
 * Uso: `npm run scrape:test` (procesa hasta `SAMPLE_SIZE` convocatorias).
 */
const SAMPLE_SIZE = 3;

function section(title: string) {
  console.log(`\n${"=".repeat(70)}\n${title}\n${"=".repeat(70)}`);
}

async function main() {
  const adapter = new BecasGobAdapter();

  // --- Etapa 1: fetch del listado ---------------------------------------
  section("ETAPA 1 — Fetch del listado");
  const html = await adapter.fetchListing();
  console.log(`OK — ${html.length} bytes descargados`);
  console.log("Fragmento:", html.slice(0, 300).replace(/\s+/g, " "));

  // --- Etapa 2: extracción de enlaces -------------------------------------
  section("ETAPA 2 — Extracción de enlaces a convocatorias");
  const links = [...adapter.extractScholarshipLinks(html)];
  console.log(`Encontrados ${links.length} enlaces:`);
  links.forEach((url) => console.log(" -", url));

  if (links.length === 0) {
    console.log("Sin enlaces, deteniendo.");
    return;
  }

  // --- Etapa 3: fetch de una convocatoria ---------------------------------
  section("ETAPA 3 — Fetch de una convocatoria (texto extraído)");
  const sampleUrl = links[0];
  const sampleText = await adapter.fetchDetailText(sampleUrl);
  console.log(`URL: ${sampleUrl}`);
  console.log(`Texto extraído (${sampleText.length} chars):`);
  console.log(sampleText.slice(0, 600), "...");

  // --- Etapa 4: validación de link vivo -----------------------------------
  section("ETAPA 4 — Validación de link vivo");
  const isLive = await validateUrlIsLive(sampleUrl);
  console.log(`validateUrlIsLive(${sampleUrl}) =>`, isLive);

  // --- Etapa 5: heurísticas (sin LLM) --------------------------------------
  section(
    "ETAPA 5 — Heurísticas + filtros México/vigente (applyUrl = URL fetcheada)",
  );
  const heuristicResult = buildRawScholarship({
    title: sampleText.slice(0, 120),
    url: sampleUrl,
    text: sampleText,
  });
  console.log("Resultado:", JSON.stringify(heuristicResult, null, 2));

  // --- Etapa 6: pipeline completo (dry-run) sobre varias convocatorias -----
  section(`ETAPA 6 — Pipeline completo (dry-run, hasta ${SAMPLE_SIZE} becas)`);
  const dryRunResults = [];
  for (const url of links.slice(0, SAMPLE_SIZE)) {
    console.log(`\n--- procesando: ${url}`);
    const raw = await adapter.processDetail(url);
    if (raw) {
      console.log("=> SE GUARDARÍA:", JSON.stringify(raw, null, 2));
      dryRunResults.push(raw);
    } else {
      console.log("=> DESCARTADA (ver log anterior)");
    }
  }

  section(`RESUMEN — ${dryRunResults.length} beca(s) se guardarían`);
  dryRunResults.forEach((r) => console.log(`- [${r.url}] ${r.title}`));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
