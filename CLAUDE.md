@AGENTS.md

## Pipeline de becas: sin LLM (Tavily + heurísticas)

Desde Fase 6, **ningún LLM toca el pipeline de becas**. El descubrimiento y
scraping construyen `RawScholarship` directamente con
`buildRawScholarship()` (`src/scrapers/discovery/heuristics.ts`): extracción
por regex de `deadline` (`DATE_PATTERNS`/`DEADLINE_KEYWORDS`) y montos
(`AMOUNT_PATTERN`), filtro México (`MEXICO_PATTERN` de `src/lib/geo.ts`) y
vigencia (descarta si el deadline detectado ya pasó). Campos que la heurística
no puede determinar con confianza quedan `null` para revisión del admin.

### Invariante: `applyUrl` siempre es una URL real y validada

`buildRawScholarship()` **no** inventa ni decide `applyUrl` — recibe la URL
que el adapter ya fetcheó/validó como viva
(`checkUrlHealth()`/`validateUrlIsLive()`), solo estructura el `title`/`text`
de esa página. No se guarda ninguna beca cuyo `applyUrl` no haya pasado la
validación de link vivo. Ver Fase 6 en `BITACORA.md`.

## Descubrimiento de becas (`TavilyDiscoveryAdapter` + `runAutoDiscovery`)

La búsqueda web para descubrir convocatorias nuevas vive aislada en
`src/lib/discovery/tavily.ts` (función `tavilySearch`), vía **API de Tavily**
(hosted) con `fetch`, sin SDK (`TAVILY_API_KEY`). El adapter
`src/scrapers/adapters/tavily-discovery.adapter.ts` combina esa búsqueda
(`SEARCH_QUERIES` sobre `INCLUDE_DOMAINS`: gob.mx, secihti.mx, .edu.mx, etc.)
con `checkUrlHealth()` (`src/lib/validation/url-health.ts`), dedupe contra
`applyUrl` existentes, el filtro México/vigente y `buildRawScholarship()` para
producir `RawScholarship[]`, entrando como `PENDING_REVIEW` para curación en
`/admin`. `runAutoDiscovery()` (`src/scrapers/discovery/auto-discovery.ts`)
envuelve `runScraper()` y reporta `queries`/`includeDomains`/`creditsUsed`.
Se ejecuta con `npm run discover` o `POST /api/admin/scraper/descubrir`
(token admin). Si cambias de proveedor de búsqueda, toca solo `tavily.ts`. Ver
Fase 6 en `BITACORA.md`.

## Scraper de SECIHTI (`BecasGobAdapter`)

`src/scrapers/adapters/becas-gob.adapter.ts` scrapea un listado de
convocatorias, sigue cada enlace, valida que esté vivo
(`validateUrlIsLive()`), extrae `<main>` y el título (`extractMainText`/
`extractTitle`) y los pasa a `buildRawScholarship()` — mismo patrón sin LLM
que `TavilyDiscoveryAdapter`. Para probar el pipeline etapa por etapa sin
escribir en la DB: `npm run scrape:test` (`scripts/test-scraper.ts`). Ver Fase
6 en `BITACORA.md`.

> [!] `gob.mx/becasbenitojuarez` ahora devuelve 404 (cambio reciente del
> sitio) — el adapter necesita revisión antes de volver a correrse.

## Asistente de perfil con Groq (`/api/perfil/asistente`)

Groq (`GROQ_API_KEY`/`GROQ_MODEL`, OpenAI-compatible vía `fetch`, sin SDK)
**ya no participa en el pipeline de becas** — ahora vive en
`src/lib/ai/profile-assistant.ts` (función `chatWithAssistant`) como asistente
conversacional: hace preguntas (una a la vez, en español), asesora al
estudiante y, cuando tiene suficiente info, devuelve `profileReady: true` +
un `ProfileDraft` (Zod, `src/validators/profile-assistant.validator.ts`) con
`academicLevel`, `fieldOfInterest`, `countryOrigin`, `countryInterest`,
`scholarshipTypes`, `language`, `situation`, `goals`. Página de chat:
`(auth)/perfil/asistente`. `POST /api/perfil` guarda el perfil (modelo
`Profile` en `prisma/schema.prisma`, migración `add_profile`) — interino sin
auth real, recibe `userId` en el body (TODO: migrar a sesión). Si Groq falla,
degrada con 503 y el usuario puede llenar el perfil manualmente. Ver Fase 6 en
`BITACORA.md`.

## Recomendación de becas (`recomendarBecas`)

`src/lib/becas/recommend.ts` exporta `recomendarBecas(profile, limit?)`: filtro
básico de becas `ACTIVE` por `academicLevel`, `scholarshipTypes` (→
`coverageType`) y `countryInterest` (→ `countryDestination`), ordenado por
`deadline`. Base intencional para una mejora futura con scoring por área de
interés/idioma/situación. Ver Fase 6 en `BITACORA.md`.

## Datos: sin becas de ejemplo

`prisma/seed.ts` **ya no inserta becas ficticias** — solo crea las 4 `Source`
y las 6 `Category`. Las becas actuales en DB (8, `status: ACTIVE`,
`isVerified: true`) se cargaron manualmente desde convocatorias reales de
SECIHTI (`enbc.secihti.mx`/`secihti.mx`), cada una con `applyUrl` verificado
con `curl -IL` → 200. Ver Fase 4D en `BITACORA.md`. Para añadir más becas,
usa el panel `/admin` o repite el mismo proceso de verificación manual — nunca
insertes `applyUrl` sin verificarlo en vivo.
