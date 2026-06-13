import "dotenv/config";
import { BecasGobAdapter } from "../src/scrapers/adapters/becas-gob.adapter";
import { validateUrlIsLive } from "../src/scrapers/url-liveness";
import { parseScholarshipText } from "../src/lib/ai/parse-scholarship";
import { MEXICO_PATTERN } from "../src/lib/geo";

/**
 * Script de prueba standalone (dry-run, sin DB) para `BecasGobAdapter`.
 * Ejecuta el pipeline etapa por etapa e imprime el resultado de cada una.
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

  // --- Etapa 5: parseo con Groq --------------------------------------------
  section("ETAPA 5 — Parseo con Groq (applyUrl inyectado por el pipeline)");
  const parsed = await parseScholarshipText(sampleText.slice(0, 20_000));
  console.log("Resultado de Groq:", JSON.stringify(parsed, null, 2));
  console.log(`applyUrl (= URL fetcheada, no del modelo): ${sampleUrl}`);

  // --- Etapa 6: filtros (México + vigente) ---------------------------------
  section("ETAPA 6 — Filtros México / vigente");
  const countryText = `${parsed.country ?? ""} ${sampleText}`;
  const passesMexico = MEXICO_PATTERN.test(countryText);
  console.log(`Filtro México: ${passesMexico ? "PASA" : "DESCARTA"}`);

  let passesVigente = true;
  if (parsed.deadline) {
    const deadline = new Date(parsed.deadline);
    if (!Number.isNaN(deadline.getTime()) && deadline.getTime() < Date.now()) {
      passesVigente = false;
    }
  }
  console.log(
    `Filtro vigente (deadline=${parsed.deadline ?? "null"}): ${
      passesVigente ? "PASA" : "DESCARTA"
    }`,
  );

  // --- Etapa 7: pipeline completo (dry-run) sobre varias convocatorias -----
  section(`ETAPA 7 — Pipeline completo (dry-run, hasta ${SAMPLE_SIZE} becas)`);
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
