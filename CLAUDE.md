@AGENTS.md

## Curación asistida por IA (`/api/admin/ai/parse-beca`)

La extracción de campos de becas vive aislada en `src/lib/ai/parse-scholarship.ts`
(función `parseScholarshipText`). Proveedor actual: **API de Groq** (hosted,
OpenAI-compatible) vía `fetch` (`GROQ_API_KEY`, `GROQ_MODEL`, default
`llama-3.3-70b-versatile`), sin SDK. Planeado para después: capa intermedia con
n8n + modelo hosted (no implementado todavía). Si cambias de proveedor, toca
solo ese módulo. Ver Fase 3 en `BITACORA.md` para el detalle.

### Invariante: `applyUrl` nunca lo decide el modelo

`parseScholarshipText()` **no** acepta ni devuelve `applyUrl`/`url` — el
esquema/prompt de Groq solo cubre `title`, `description`, `deadline`,
`coverageType`, `country`, `level`. En todo el pipeline de scraping,
`applyUrl` es siempre la URL que el adapter fetcheó y validó como viva
(`validateUrlIsLive()`); el modelo solo estructura el texto de esa página. No
se guarda ninguna beca cuyo `applyUrl` no haya pasado la validación de link
vivo. Ver Fase 3C en `BITACORA.md`.

## Descubrimiento de becas (`TavilyDiscoveryAdapter`)

La búsqueda web para descubrir convocatorias nuevas vive aislada en
`src/lib/discovery/tavily.ts` (función `searchTavily`), vía **API de Tavily**
(hosted) con `fetch`, sin SDK (`TAVILY_API_KEY`). El adapter
`src/scrapers/adapters/tavily-discovery.adapter.ts` combina esa búsqueda con
`validateUrlIsLive()` (`src/scrapers/url-liveness.ts`), un filtro México/vigente,
y `parseScholarshipText()` para producir `RawScholarship[]`. Si cambias de
proveedor de búsqueda, toca solo `tavily.ts`. Ver Fase 3B en `BITACORA.md`.

## Primer scraper real con Groq (`BecasGobAdapter`)

`src/scrapers/adapters/becas-gob.adapter.ts` scrapea el listado de
convocatorias de `gob.mx/becasbenitojuarez`, sigue cada enlace, valida que
esté vivo (`validateUrlIsLive()`), extrae el texto de `<main>` y lo pasa a
`parseScholarshipText()` (Groq) para estructurarlo — mismo patrón que
`TavilyDiscoveryAdapter`, con el invariante de `applyUrl` arriba. Para probar
el pipeline etapa por etapa sin escribir en la DB: `npm run scrape:test`
(`scripts/test-scraper.ts`). Ver Fase 3C en `BITACORA.md`.
