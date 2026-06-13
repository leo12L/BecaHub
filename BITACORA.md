# Bitácora del proyecto — BecaHub

> Documento vivo. Registra el estado real del proyecto fase por fase: lo completado, las desviaciones respecto al plan original, los hallazgos técnicos y lo pendiente. Sirve como memoria compartida entre la planeación (chat de diseño) y la implementación (Claude Code / Claude Desktop).
>
> **Cómo usarlo:** al iniciar cada sesión de Claude Code, pega este archivo (o pídele que lo lea desde la raíz del repo) para que tenga contexto del estado actual antes de codear.

- **Proyecto:** BecaHub — plataforma de agregación y búsqueda de becas
- **Ubicación:** `C:\opbecaas` (la carpeta raíz NO se ha renombrado todavía; pendiente manual del usuario)
- **Stack confirmado:** Next.js 16.2.9 · TypeScript · Tailwind · Prisma 7 · PostgreSQL · Redis (Upstash) · NextAuth · Zod
- **Última actualización:** Fase 3 cerrada y commiteada (`d9ea29d`); Fase 4A cerrada (pendiente commit); Fase 3B (descubrimiento Tavily) cerrada (pendiente commit); Fase 4B (UI de admin) en curso, parte sustancial completada (pendiente commit); Fase 3C (invariante `applyUrl` + primer scraper real con Groq) cerrada y commiteada parcialmente (`c098818`, falta commit de Parte B)

---

## Convenciones de esta bitácora

- **Estado de cada ítem:** `[x]` hecho · `[ ]` pendiente · `[~]` hecho con desviación · `[!]` requiere decisión
- Cada fase lista: lo completado, las desviaciones del plan original, los hallazgos técnicos relevantes para fases futuras, y lo que se dejó pendiente a propósito.

---

## Fase 1 — Fundación del proyecto ✅ COMPLETADA

**Resultado:** el proyecto compila (`npm run build` OK con Turbopack) y arranca (`npm run dev` responde HTTP 200). Toda la fundación está lista. **Falta hacer el commit.**

### Completado

- [x] Repo respetado (ya existía con commit previo "Initial commit from Create Next App")
- [x] Proyecto adaptado a estructura `src/` (se movió `app/` → `src/app/` con `git mv`, preservando historial)
- [x] `tsconfig.json` actualizado: alias `"@/*"` → `["./src/*"]`, `strict: true` confirmado
- [x] `package.json`: `name` cambiado de `opbecaas` → `becahub`
- [x] `README.md` reescrito con descripción, stack y estructura
- [x] Estructura de carpetas creada bajo `src/` (cada una con `README.md` de 1 línea):
  - `app/(public)/`, `app/(auth)/`, `app/(admin)/`, `app/api/`
  - `components/ui/`, `components/scholarships/`, `components/layout/`
  - `lib/` (con `utils.ts` de shadcn), `scrapers/`, `scrapers/adapters/`, `validators/`, `types/`
  - `prisma/` queda en la **raíz** (convención de Prisma, no dentro de `src/`)
- [x] Dependencias instaladas y agrupadas (ver detalle abajo)
- [x] Tooling de calidad: `.prettierrc`, Husky pre-commit, lint-staged, Vitest, `vitest.config.ts`
- [x] `.env.example` y `.env.local` con las 8 claves comentadas
- [x] Prisma inicializado (datasource PostgreSQL + generator, sin modelos)
- [x] Verificación final: `npm run build` y `npm run dev` exitosos

### Desviaciones respecto al prompt original (importantes)

- [~] **No se hizo `git init` ni commit vacío** — el repo ya existía. Se respetó el historial.
- [~] **No se ejecutó `create-next-app becahub --src-dir`** — habría creado un proyecto anidado duplicado. Se adaptó el existente.
- [~] **Next.js 16, no 14+** — el proyecto ya venía en 16.2.9. El usuario confirmó mantenerlo (decisión correcta; 14/15 pierden soporte LTS en oct. 2026).
- [~] **Carpeta raíz NO renombrada** — sigue siendo `C:\opbecaas`. Solo se cambió el nombre lógico en `package.json`. El usuario la renombrará manualmente más adelante.
- [~] **shadcn/ui usa nuevo sistema de presets** — ya no existe "style: New York + base color: neutral". Ahora son presets (Nova, Vega, Maia, Lyra, Mira, Luma, Sera, Rhea, Custom). Se eligió **Nova** (default, Lucide + fuente Geist). Resultado en `components.json`: `"style": "radix-nova"`, `"baseColor": "neutral"`.
- [~] **Dependencia extra no planeada: `dotenv`** (devDependency) — necesaria porque `prisma.config.ts` (Prisma 7) carga variables de entorno manualmente.

### Dependencias instaladas

1. **Core/datos:** `prisma`, `@prisma/client`, `zod`
2. **Auth/seguridad:** `next-auth` (**v4.24.14** — NO v5/Auth.js), `@upstash/redis`, `@upstash/ratelimit`
3. **Scraping:** `cheerio`, `playwright`, `rss-parser`, `p-queue` *(no se descargaron binarios de browsers de Playwright, solo el paquete npm)*
4. **Dev/calidad:** `prettier`, `prettier-plugin-tailwindcss`, `husky`, `lint-staged`, `vitest`, `@vitejs/plugin-react`
5. **Extra:** `dotenv` (devDependency)

### 🔑 Hallazgos técnicos de Next 16 / Prisma 7 (críticos para fases futuras)

- [!] **`middleware.ts` ya no existe en Next 16 → ahora se llama `proxy.ts`.** Relevante para NextAuth en Fase 2/3 (protección de rutas, redirecciones por sesión). Usar la convención `proxy.ts` en la raíz o en `src/`.
- [!] **`AGENTS.md` del repo advierte** que Next 16 tiene breaking changes respecto al entrenamiento del modelo. Revisar `node_modules/next/dist/docs/` antes de codear features nuevas.
- **Prisma 7:** genera un `prisma.config.ts` nuevo (no existía antes). Se corrigió manualmente para que cargue `.env.local` vía `dotenv` (se eliminó un `.env` duplicado que Prisma creó con un `DATABASE_URL` de ejemplo distinto).
- **Prisma 7:** el cliente se genera en `../src/generated/prisma` (dentro del proyecto, no en `node_modules`). Esa ruta ya está en `.gitignore`.

### Lo que NO se hizo (a propósito, por alcance de la fase)

- [ ] Ningún componente React con contenido real
- [ ] Ningún endpoint con lógica de negocio
- [ ] Ningún modelo de Prisma
- [ ] No se corrió `prisma generate` (sin modelos no tiene sentido)
- [ ] No se descargaron browsers de Playwright (`npx playwright install`)
- [ ] No se resolvieron las **7 vulnerabilidades moderadas** de `npm audit` (transitivas)

### Estado de git al cierre

Cambios **sin commit** (esperando confirmación para Fase 2). `git status` muestra:
- Modificados: `.gitignore`, `README.md`, `package.json`, `package-lock.json`, `tsconfig.json`
- Renombrados (`git mv`): `app/*` → `src/app/*`
- Nuevos: `.husky/`, `.prettierrc`, `components.json`, `prisma/`, `prisma.config.ts`, `vitest.config.ts`, toda la estructura bajo `src/`

**Commit sugerido:** `chore: configurar fundación del proyecto BecaHub`

---

## Fase 2 — Base de datos + API core ✅ COMPLETADA

**Objetivo:** esquema Prisma completo, seed con datos reales, y los Route Handlers de `/api/becas` con filtros, paginación, caché y rate limiting.

**Resultado:** schema migrado y aplicado en Supabase (Postgres), seed con 15 becas / 6 categorías / 2 fuentes, 3 endpoints REST funcionando con filtros, paginación, caché (Redis con degradación) y rate limiting. `npm run build` OK. **Falta hacer el commit.**

### Completado

- [x] Commit de los restos de la Fase 1 (`chore: configurar fundación del proyecto BecaHub`)
- [x] `schema.prisma` completo: enums (`Role`, `AcademicLevel`, `ScholarshipStatus`, `CoverageType`, `SourceType`, `CategoryAxis`, `ApplicationStatus`) + modelos `User`, `Account`, `Session`, `VerificationToken` (compatibles con `@auth/prisma-adapter`, sirven para NextAuth v4 o Auth.js v5), `Source`, `Category`, `Scholarship`, `ScholarshipCategory` (tabla intermedia), `Favorite`, `Application`, `Notification`. Índices en `Scholarship`: `deadline`, `[status, deadline]`, `[countryDestination, academicLevel]`, `createdAt`.
- [x] **Conexión a Supabase con Prisma 7 + driver adapters** (`@prisma/adapter-pg` + `pg`): `DATABASE_URL` (pooled, Supavisor puerto 6543, `pgbouncer=true`) para runtime; `DIRECT_URL` (puerto 5432) para el CLI de migraciones, configurada en `prisma.config.ts` → `datasource.url`.
- [x] `npx prisma migrate dev --name init` ejecutado contra Supabase → migración `20260612193704_init` aplicada. **No se ejecutó SQL manual**: las 11 tablas + `_prisma_migrations` fueron creadas íntegramente por Prisma.
- [x] `npx prisma generate` → cliente en `src/generated/prisma` (gitignored)
- [x] `src/lib/db.ts`: singleton de `PrismaClient` con `PrismaPg` adapter sobre `DATABASE_URL`, patrón `globalThis` para evitar múltiples instancias en dev
- [x] `src/validators/becas.validator.ts`: `becasQuerySchema` (Zod v4) con `page`, `limit`, `status`, `type`, `area`, `country`, `level`, `deadlineBefore`, `search`
- [x] `src/lib/cache.ts`: wrappers `getCached`/`setCached`/`invalidateCache` sobre Upstash Redis, con degradación a no-op si `REDIS_URL`/`REDIS_TOKEN` no están configurados
- [x] `src/lib/rate-limit.ts`: `checkRateLimit` con Upstash Ratelimit (30 req/min por IP), también degrada a "siempre permitido" sin Redis
- [x] `prisma/seed.ts`: 2 `Source` (gob.mx GOVERNMENT, Chevening EDUCATIONAL), 6 `Category` (3 eje TYPE: monetaria/viaje/deportiva; 3 eje AREA: stem/humanidades/artes), 15 `Scholarship` variadas (10 ACTIVE, 4 CLOSED, 1 DRAFT) conectadas a fuentes y categorías. Seed ejecutado y verificado contra Supabase (conteos: 2/6/15/23 filas).
- [x] Route Handlers:
  - `GET /api/becas` — filtros dinámicos + paginación, caché Redis (TTL 5 min, clave por filtros), header `Cache-Control: public, s-maxage=300, stale-while-revalidate=60`, rate limiting por IP
  - `GET /api/becas/[slug]` — detalle con `source` y `categories`, `await params` (Next 16), 404 si no existe, caché 1h
  - `GET /api/becas/destacadas` — `isFeatured: true AND status: ACTIVE`, caché 30 min
  - Formato de error uniforme: `{ error, details? }`
- [x] Probado manualmente con `curl` (ver ejemplos abajo) y `npm run build` exitoso

### Desviaciones respecto al plan original

- [~] **Pivote a Supabase a mitad de fase**: el plan original no especificaba proveedor de base de datos. El usuario decidió usar Supabase Postgres con Prisma 7 + driver adapters (`@prisma/adapter-pg`, `pg`). Esto cambió `prisma.config.ts` (datasource ahora apunta a `DIRECT_URL`) y `src/lib/db.ts` (usa `PrismaPg` con `DATABASE_URL`).
- [~] **Dependencia extra no planeada: `tsx`** (devDependency). El cliente generado por Prisma 7 (`src/generated/prisma/client.ts`) usa imports relativos sin extensión (`./enums`, `./internal/class`, etc.), lo cual **no es resoluble por el ESM nativo de Node** aunque Node 24 soporte type-stripping de `.ts`. Se confirmó empíricamente: `node prisma/seed.ts` falla con `ERR_MODULE_NOT_FOUND`. `tsx` (basado en esbuild) resuelve extensiones de TS automáticamente. Se configuró `prisma.config.ts` → `migrations.seed: "tsx prisma/seed.ts"`.
- [~] **Default de `status` en `GET /api/becas`**: si no se especifica `status` en la query, se filtra por `ACTIVE` (no se muestran becas `DRAFT`/`PENDING_REVIEW`/`CLOSED` por defecto). Esto no estaba explícito en el plan, pero es el comportamiento esperable de un buscador público; `CLOSED` y otros estados siguen siendo accesibles pasando `status` explícitamente.
- [~] **Filtros `type`/`area`**: se implementaron como slugs de `Category` filtrando por `axis` (`TYPE` / `AREA` respectivamente) vía `categories.some`.
- [~] **Conexión Supabase**: el host correcto del pooler resultó ser `aws-1-us-west-2.pooler.supabase.com` (no `aws-0-`), dato que solo se pudo confirmar pegando el diálogo "Connect" real de Supabase. Documentado por si se reconecta el proyecto o se crea uno nuevo.

### 🔑 Hallazgos técnicos para fases futuras

- [!] El TODO de índice `tsvector` para búsqueda de texto completo en `Scholarship` sigue pendiente (comentado en `schema.prisma`); el filtro `search` actual usa `contains`/`insensitive` de Prisma, suficiente para el volumen actual.
- [!] Pendiente decidir versión de NextAuth (v4 instalada vs Auth.js v5) antes de implementar login — el schema ya es compatible con ambas.
- [!] Recordar **`proxy.ts`** (no `middleware.ts`) si se protege `/api/becas/*` u otras rutas con auth en fases futuras.

### Ejemplos de uso (curl)

```bash
# Listado con paginación
curl "http://localhost:3000/api/becas?limit=2"
# → { "data": [...], "pagination": { "page": 1, "limit": 2, "total": 10, "totalPages": 5 } }

# Filtro por área (categoría eje AREA) + país
curl "http://localhost:3000/api/becas?area=stem&country=M%C3%A9xico"

# Becas cerradas
curl "http://localhost:3000/api/becas?status=CLOSED"

# Detalle por slug
curl "http://localhost:3000/api/becas/chevening-uk-masters"
# → 404 { "error": "Beca no encontrada" } si no existe

# Destacadas
curl "http://localhost:3000/api/becas/destacadas"

# Validación de query inválida
curl "http://localhost:3000/api/becas?level=INVALID"
# → 400 { "error": "Parámetros de búsqueda inválidos", "details": [...] }
```

### Recordatorios técnicos heredados de Fase 1

- Escribir el código pensando en las **APIs de request asíncronas** de Next 15/16 (params, searchParams, cookies, headers son `await`). ✅ aplicado en `/api/becas/[slug]`.
- Auditar el comportamiento de caché por defecto (cambió en Next 15+); usar directivas explícitas donde se dependa de caché. ✅ `Cache-Control` explícito en los 3 endpoints.

---

## Fase 3 — Sistema de scraping ✅ COMPLETADA

**Objetivo:** arquitectura de adaptadores, orquestador, normalización/dedup, endpoints de admin y curación asistida por IA.

**Resultado:** `npx tsc --noEmit` y `npm run build` OK. Orquestador probado contra `becas.gob.mx` real (6 items, upsert OK). Endpoints admin probados con `ADMIN_SCRAPER_TOKEN` (401 sin token / 200 con token). `POST /api/admin/ai/parse-beca` probado en vivo contra Groq (200, JSON válido, pasó `parsedScholarshipSchema`) y en degradación (key inválida → 401 de Groq → 503 sin filtrar la key). Commit `d9ea29d` — `feat: sistema de scraping y curacion asistida por IA`.

### Completado

- [x] **Modelo `ScraperLog` + enum `ScraperRunStatus`** en `schema.prisma` (campos: `sourceId?`, `status`, `itemsFound/Created/Updated/Skipped`, `errorMessage?`, `startedAt`, `finishedAt?`, `durationMs?`, índice `[sourceId, startedAt]`). Relación `Source.scraperLogs[]`. Migración `20260613010804_add_scraper_logs` aplicada y `prisma generate` corrido.
- [x] **`src/scrapers/types.ts`**: `RawScholarship`, `ScraperAdapter` (interfaz: `name`, `sourceSlug`, `scrape()`), `ScraperRunResult`.
- [x] **`src/scrapers/base.adapter.ts`**: clase abstracta `BaseAdapter` con:
  - User-Agent honesto: `BecaHubBot/1.0 (+https://becahub.example/about-bot)` (constante `SCRAPER_USER_AGENT`)
  - Chequeo de `robots.txt` cacheado por dominio (parser propio minimalista, sin librería externa)
  - Throttle 1 req/seg por dominio vía `p-queue` (`intervalCap: 1, interval: 1000`), una cola estática compartida por dominio
  - `fetchPage(url)`: valida robots.txt → encola → `fetchWithRetry` (3 intentos, backoff 1s/2s/4s, timeout 15s)
  - `log()` estructurado en JSON (info/warn/error)
- [x] **`src/scrapers/normalize.ts`**:
  - `slugify()` (maneja acentos vía NFD)
  - `parseSpanishDate()`: soporta ISO, `dd/mm/yyyy`/`dd-mm-yyyy` y "15 de marzo de 2026"
  - `normalize(raw, sourceId)`: mapea `coverageRaw`/`levelRaw` con diccionarios de sinónimos (default `MONETARY`/`UNDERGRAD` si no hay match), `countryRaw` → `countryDestination` (default "No especificado"), parsea montos tipo "$1,000 - $2,400". Devuelve `null` si falta `title` o `url`. Siempre `status: PENDING_REVIEW`, `isVerified: false`.
  - `upsertScholarship(normalized)`: dedup por `applyUrl` (no por slug — más estable entre corridas); si es nuevo, resuelve colisión de slug con sufijo numérico. Devuelve `"created" | "updated"`.

- [x] **Objetivo 6 — Orquestador (`src/scrapers/orchestrator.ts`)**: `runScraper(target)` (`"all"` o `sourceId`), registro `ADAPTER_REGISTRY` (slug → clase de adapter), concurrencia 3 fuentes en paralelo vía `p-queue` (el throttle de 1 req/seg por dominio sigue aplicando dentro de cada adapter). Crea/actualiza un `ScraperLog` por fuente con conteos (`itemsFound/Created/Updated/Skipped`), `status` (`SUCCESS`/`PARTIAL`/`FAILED`) y `lastScrapedAt` en `Source`. Una fuente que falla no detiene al resto.
- [x] **Objetivo 7 — Endpoints admin**: `POST /api/admin/scraper/ejecutar` (body `{ sourceId? }`, sin `sourceId` = todas las fuentes activas) y `GET /api/admin/scraper/logs` (paginado). Ambos protegidos con `isAdminScraperRequest` (header `x-admin-scraper-token` vs `ADMIN_SCRAPER_TOKEN`, provisional hasta NextAuth real).
- [x] **Objetivo 8 — `POST /api/admin/ai/parse-beca`**: recibe `{ text: string }` (Zod, `src/validators/ai.validator.ts`), delega a `parseScholarshipText()` en `src/lib/ai/parse-scholarship.ts` — único módulo que conoce al proveedor de IA. Implementación actual: **Groq API** (hosted, OpenAI-compatible) vía `fetch` a `POST https://api.groq.com/openai/v1/chat/completions` (`GROQ_API_KEY` + `GROQ_MODEL`, default `llama-3.3-70b-versatile`), con `response_format: { type: "json_schema", strict: true }` para forzar `{ title, description, deadline, coverageType, country, level, applyUrl }`; si el modelo no soporta `json_schema` estricto (Groq devuelve 400 con `error.param === "response_format"`), reintenta automáticamente con `response_format: { type: "json_object" }`. La respuesta se re-valida con `parsedScholarshipSchema` (Zod) — si no es JSON válido o no cumple el esquema, el endpoint responde 422 (parseo automático falló, curador llena el formulario a mano). Si Groq no responde, da error 401/5xx o falta `GROQ_API_KEY`, responde 503 (sin exponer la key en logs ni en la respuesta). **No escribe en la base de datos** — devuelve el JSON para curación humana.
- [x] **Objetivo 9 — Script `npm run scrape`**: `scripts/scrape.ts` (tsx, carga `.env` vía `dotenv/config`) llama a `runScraper("all")` o `runScraper(<sourceId>)` si se pasa como argumento, imprime los `ScraperRunResult[]` y sale con código 1 si alguna fuente terminó en `FAILED`.

### [!] Decisión: proveedor de IA para curación (`parse-beca`)

La extracción de campos vive aislada en `src/lib/ai/parse-scholarship.ts` (única función `parseScholarshipText(text)`) para que cambiar de proveedor solo toque ese archivo.

- **Actual: API de Groq** (hosted, OpenAI-compatible), modelo `llama-3.3-70b-versatile` vía `GROQ_MODEL`, sin SDK (`fetch` nativo). Recorrido de decisiones: `@anthropic-ai/sdk` (instalado y desinstalado) → Ollama local (probado, descartado por requerir instalación/hardware local) → Groq.
- **Planeado (después):** capa intermedia con **n8n** + modelo hosted — fuera de alcance de este cambio, no implementado.
- Validación: la respuesta de Groq se re-valida con Zod (`parsedScholarshipSchema`); si no cumple, 422 con mensaje de fallback manual.
- Fallback de `response_format`: si el modelo configurado no soporta `json_schema` estricto, el módulo reintenta automáticamente con `json_object`.
- Degradación: Groq caído/timeout/401/5xx → 503 `{ error: "El servicio de parseo IA no está disponible; completa el formulario manualmente." }`. La key nunca se expone en logs ni en la respuesta. El flujo manual de curación nunca se bloquea.
- **Probado en esta sesión**: `POST /api/admin/ai/parse-beca` con texto real de una convocatoria de ejemplo devolvió `{ title, description, deadline: "2026-03-15", coverageType: "TUITION", country: "Mexico", level: "UNDERGRAD", applyUrl }` (HTTP 200, pasó `parsedScholarshipSchema` vía fallback a `json_object`); con `GROQ_API_KEY` inválida, Groq respondió 401 y el endpoint devolvió 503 sin filtrar la key.

### [!] Decisión pendiente: ejecución programada (cron)

`npm run scrape` solo se ejecuta manualmente. **No se instaló ningún SDK de cron** (ni Inngest, ni `@vercel/cron`, etc.) — queda como decisión explícita para Fase 5:

- **Opción A — Vercel Cron**: simple, declarativo (`vercel.json`), pero requiere que el endpoint `/api/admin/scraper/ejecutar` esté expuesto con auth compatible con cron jobs (sin sesión de usuario).
- **Opción B — Inngest**: más control (reintentos, observabilidad, steps), pero añade una dependencia y un servicio externo nuevo.

Por ahora, correr `npm run scrape` manualmente (o vía un cron externo simple) es suficiente para curar datos durante Fase 4.

### 🔑 Hallazgos técnicos para fases futuras

- `Source` con `scraperAdapter: "chevening"` (fuenteChevening) existe en el seed pero **no tiene adapter registrado** en `ADAPTER_REGISTRY` — al correr `npm run scrape` esa fuente termina en `FAILED` con `"No hay adapter registrado para \"chevening\""`. No bloquea (el orquestador sigue con el resto), pero falta implementar o quitar esa fuente del seed.
- `ADMIN_SCRAPER_TOKEN` no estaba documentado en `.env.example` a pesar de que `src/lib/admin-auth.ts` lo requiere desde el Objetivo 7 — **resuelto en Fase 3B**, agregado a `.env.example`.

---

## Fase 3B — Capa de descubrimiento con Tavily ✅ COMPLETADA

**Objetivo:** agregar una fuente de descubrimiento automático de becas que no depende de un sitio fijo, usando búsqueda web (Tavily) + validación de liveness + filtro México/vigente + extracción estructurada con Groq.

**Resultado:** `npx tsc --noEmit` OK. Migración `20260613074649_add_source_type_discovery` aplicada (nuevo valor de enum `SourceType.DISCOVERY`, no destructiva). Seed actualizado con la 3ra fuente (`tavily-discovery`).

### Completado

- [x] **`src/lib/discovery/tavily.ts`**: módulo aislado para la API de Tavily Search (hosted) vía `fetch`, sin SDK — mismo patrón que `src/lib/ai/parse-scholarship.ts`. Función `searchTavily(query, maxResults)`, env var `TAVILY_API_KEY`. Lanza `TavilyUnavailableError` si falta la key, hay timeout (20s) o Tavily responde con error.
- [x] **`src/scrapers/url-liveness.ts`**: `validateUrlIsLive(url)` — `HEAD` (con fallback a `GET` si el servidor responde 403/404/405 o rechaza `HEAD`), timeout 10s, nunca lanza (cualquier fallo de red = "no vivo").
- [x] **`enum SourceType.DISCOVERY`** agregado en `schema.prisma` (migración `add_source_type_discovery`, solo `ALTER TYPE ... ADD VALUE`, no destructiva).
- [x] **`src/scrapers/adapters/tavily-discovery.adapter.ts`** (`TavilyDiscoveryAdapter`, `sourceSlug: "tavily-discovery"`), pipeline por resultado:
  1. Tres queries fijas en español orientadas a "becas vigentes México 2026" (`SEARCH_QUERIES`, `MAX_RESULTS_PER_QUERY = 5`).
  2. `validateUrlIsLive()` descarta URLs muertas.
  3. Descarga la página vía `fetchPage()` (hereda robots.txt + throttle 1 req/seg de `BaseAdapter`) y extrae texto plano con `cheerio` (quita `script`/`style`); si falla la descarga, usa el snippet de Tavily como fallback.
  4. `parseScholarshipText()` (Groq) extrae `{ title, description, deadline, coverageType, country, level, applyUrl }` del texto.
  5. **Filtro México**: descarta si ni `country` ni el snippet de Tavily mencionan "méxico"/"mexico"/"mx" (regex `MEXICO_PATTERN`, insensible a mayúsculas/acentos).
  6. **Filtro vigente**: si `deadline` es una fecha parseable y ya pasó (`< Date.now()`), se descarta.
  7. Resultado mapeado a `RawScholarship` (mismo contrato que los demás adapters) → pasa por `normalize()`/`upsertScholarship()` del orquestador sin cambios, siempre `PENDING_REVIEW`/`isVerified: false`.
- [x] **Registrado en `ADAPTER_REGISTRY`** (`src/scrapers/orchestrator.ts`) y en el seed (`Source` id `00000000-0000-0000-0000-000000000003`, `type: DISCOVERY`, `url: "https://tavily.com/"`).
- [x] **Env vars**: `TAVILY_API_KEY` agregada a `.env` y `.env.example`; de paso se documentó `ADMIN_SCRAPER_TOKEN` en `.env.example` (hallazgo pendiente de Fase 3).

### Degradación y errores

- Si falta `TAVILY_API_KEY` o Tavily no responde, `searchTavily()` lanza `TavilyUnavailableError` en la primera query — el adapter la deja propagar y el orquestador marca la fuente como `FAILED` con el mensaje (no tiene sentido reintentar las otras queries: fallarían igual).
- Si Groq no está disponible o la respuesta no cumple el esquema para un resultado puntual (`AiUnavailableError`/`AiParseError`), ese resultado se omite (log `warn`) pero la corrida continúa con el resto.
- Cualquier otro error por resultado (descarga, parseo) se captura y loguea como `warn`, sin abortar la corrida.

### Desviaciones / pendientes

- [~] El mapeo `coverageRaw`/`levelRaw` pasa los valores del enum de Groq (`TUITION`, `PHD`, etc.) directamente a `normalize()`, que los matchea contra los diccionarios de sinónimos en español de Fase 3 (`COVERAGE_SYNONYMS`/`LEVEL_SYNONYMS`). Algunos valores en inglés coinciden (`tuition`, `phd`, `research`, `leadership`) pero otros no (p. ej. `GRAD` no matchea `"graduate"` por `.includes()`) y caen al default (`MONETARY`/`UNDERGRAD`). No bloquea — el curador humano revisa y corrige en `PENDING_REVIEW`.
- [ ] No probado en vivo contra la API real de Tavily (requiere `TAVILY_API_KEY` válida) — pendiente de prueba manual con `npm run scrape <sourceId-tavily-discovery>`.
- [ ] Las 3 queries de búsqueda son fijas en el código; si se quiere variarlas por temporada (becas de verano vs. anuales) habría que parametrizarlas — fuera de alcance por ahora.

### [!] Fix: `applyUrl` debía usar la fuente verificada, no la URL extraída por la IA

**Bug:** la primera versión usaba `url: parsed.applyUrl?.trim() || item.url` — si Groq extraía del texto cualquier URL (mencionada como "más información en...", un enlace roto, una ruta vieja, etc.), esa URL **alucinada/no verificada** sobrescribía `item.url`, que sí pasó por `validateUrlIsLive()`. Resultado: el botón "Ir a la convocatoria" en `/becas/[slug]` podía apuntar a un 404 aunque la página fuente estuviera viva.

**Reproducido con curl**: texto sintético con `item.url = https://www.gob.mx/` (200) mencionando `https://www.gob.mx/conacyt/becas-posgrado-nacional-2026-pagina-que-no-existe` (404) como "portal oficial" → con la lógica vieja, `applyUrl` final = la URL rota (404).

**Fix** (`resolveApplyUrl(sourceUrl, candidate)`): `item.url` (ya verificado vivo) es el valor por defecto. Solo se usa `parsed.applyUrl` si, resuelto como absoluto contra `sourceUrl`, es una **URL distinta** y además **`validateUrlIsLive()` confirma que responde**. Verificado con el mismo caso: ahora `applyUrl` final = `https://www.gob.mx/` (200).

---

## Fase 3C — Invariante `applyUrl` + primer scraper real con Groq ✅ COMPLETADA

**Objetivo:** (A) cerrar la migración de `parse-scholarship.ts` a Groq quitando `applyUrl` del contrato del modelo, y (B) construir y probar por etapas un scraper real (`BecasGobAdapter`) que alimente a Groq, respetando el invariante: `applyUrl` siempre es la URL fetcheada y validada como viva, nunca una URL del modelo.

**Resultado:** `npx tsc --noEmit` y `npm run build` OK. Endpoint probado en vivo. Script `npm run scrape:test` corrido con éxito (7 etapas). Corrida real `npm run scrape -- <sourceId-becas-gob-mx>` → `ScraperLog` `SUCCESS`, 3 becas `PENDING_REVIEW`/`isVerified: false` con `applyUrl` verificado (200 con `curl`).

### Parte A — Migración a Groq cerrada

- [x] `src/lib/ai/parse-scholarship.ts` ya llamaba correctamente a Groq (`POST https://api.groq.com/openai/v1/chat/completions`, `Authorization: Bearer ${GROQ_API_KEY}`, `GROQ_MODEL` con default `llama-3.3-70b-versatile`, `response_format: json_schema strict: true` con fallback a `json_object`, re-validación con `parsedScholarshipSchema`, degradación a `AiUnavailableError`/503 sin filtrar la key). Lo único pendiente era el contrato de `applyUrl`.
- [x] **`applyUrl` eliminado del prompt, `RESPONSE_SCHEMA` y `parsedScholarshipSchema`** (`src/validators/ai.validator.ts`): el modelo ya no genera ni rellena URLs. El prompt ahora indica explícitamente que la URL la determina el pipeline.
- [x] `src/scrapers/adapters/tavily-discovery.adapter.ts` simplificado: se eliminó `resolveApplyUrl` (la lógica de Fase 3B que a veces prefería una URL "candidata" del modelo); `applyUrl` ahora es siempre `item.url` (ya validado vivo por `validateUrlIsLive`).
- [x] `GROQ_API_KEY`/`GROQ_MODEL` ya estaban configuradas en `.env` y `.env.example`; no quedan referencias a Ollama/Anthropic en `src/`.
- [x] **Prueba en vivo** `POST /api/admin/ai/parse-beca` con texto real de una convocatoria → 200, JSON sin `applyUrl`, pasa `parsedScholarshipSchema`. Body inválido (`{"text":""}`) → 400 con detalle Zod.
- [x] Commit `c098818` — `refactor: completar migracion de extraccion IA a Groq`.

### Parte B — `BecasGobAdapter` reconstruido sobre el nuevo invariante

- [x] **B0 — Fuente elegida**: `gob.mx/becasbenitojuarez` (Becas Benito Juárez), la misma fuente ya registrada como `Source` `becas-gob-mx` desde Fase 3. Se re-verificó en vivo con `curl`/`cheerio` antes de codear: el listado (`https://www.gob.mx/becasbenitojuarez`) sigue devolviendo 200 y el selector `a[href*="/articulos/"]` con filtro `/beca/i` sigue encontrando **6 enlaces**. Las páginas de detalle exponen el contenido relevante dentro de `<main>` (el `<body>` completo trae mucho ruido de navegación/sidebar).
- [x] **B1 — Script de prueba standalone**: `scripts/test-scraper.ts` (`npm run scrape:test`), dry-run, no escribe en la DB.
- [x] **B2 — Pipeline reconstruido por etapas** en `BecasGobAdapter` (`src/scrapers/adapters/becas-gob.adapter.ts`), mismo patrón que `TavilyDiscoveryAdapter`:
  1. `fetchListing()` — descarga `https://www.gob.mx/becasbenitojuarez`.
  2. `extractScholarshipLinks(html)` — extrae los 6 URLs absolutos de convocatorias (selector heredado de Fase 3, sigue funcionando).
  3. `fetchDetailText(url)` — descarga la convocatoria y extrae texto plano de `<main>` (en vez de `<body>` completo o selectores `field--name-body` que ya no existen en el HTML actual).
  4. `validateUrlIsLive(url)` — valida que el link de la convocatoria responda antes de procesarla.
  5. `parseScholarshipText(text)` (Groq) — estructura el texto; `applyUrl` se inyecta como `url` (la URL fetcheada), nunca desde el modelo.
  6. Filtro México (`MEXICO_PATTERN` sobre `país extraído + texto`) y filtro vigente (descarta si `deadline` extraída ya pasó; si no hay `deadline`, pasa).
  7. `processDetail(url)` — pipeline completo por convocatoria; `scrape()` lo corre sobre los 6 enlaces.
- [x] **Salida de `npm run scrape:test`** (resumen): de los 6 enlaces, las 7 etapas se ejecutaron sobre la primera convocatoria con éxito (fetch 200, texto extraído de `<main>`, link vivo, Groq devolvió JSON válido sin `applyUrl`, pasó ambos filtros) y el dry-run de 3 convocatorias mostró los 3 `RawScholarship` que se guardarían, cada uno con `url` = URL real fetcheada.
- [x] **B3 — Integración**: el adapter ya estaba registrado en `ADAPTER_REGISTRY` (`"becas-gob-mx"`) y la `Source` ya existe en el seed desde Fase 3 — no requirió cambios de registro. Corrida real `npm run scrape -- 00000000-0000-0000-0000-000000000001`:
  - `ScraperLog`: `status: SUCCESS`, `itemsFound: 3`, `itemsUpdated: 3`, `itemsCreated: 0` (ya existían de una corrida previa de Fase 3, dedup por `applyUrl`), `itemsSkipped: 0`.
  - De los 6 enlaces: 1 descartado por **convocatoria vencida** (`deadline: 2026-02-27 < hoy`), 1 omitido por **Groq 429** (rate limit transitorio, log `warn`, no rompe la corrida), 1 omitido porque **la IA no extrajo título** (página "¿Qué es la Contraloría Social?", no es una beca), y 3 procesados con éxito → `PENDING_REVIEW` / `isVerified: false`.
  - **Verificado con `curl`**: los 3 `applyUrl` resultantes responden `200`.

### 🔑 Hallazgos técnicos para fases futuras

- [!] El HTML actual de `gob.mx/becasbenitojuarez` ya no tiene `[class*="field--name-body"]` ni `article p` (selectores de Fase 3, que devolvían texto vacío); el contenido útil está en `<main>`. Si el sitio cambia de plantilla de nuevo, revisar `extractMainText()`.
- [!] Groq (plan gratuito) puede devolver **429** bajo ráfagas de requests (6 convocatorias en ~9s en esta corrida ya disparó uno). El adapter lo trata como `AiUnavailableError` y omite ese ítem sin romper la corrida — aceptable para volumen bajo, pero si se escala a más fuentes/convocatorias por corrida convendría espaciar las llamadas a Groq o añadir retry/backoff específico (hoy solo `fetchPage` reintenta, no `parseScholarshipText`).
- [!] No toda página enlazada desde el listado es una convocatoria de beca (p. ej. "¿Qué es la Contraloría Social?") — el filtro "la IA no extrajo título" actúa como red de seguridad, pero genera una llamada a Groq "desperdiciada" por cada página irrelevante.

---

## Fase 4A — Frontend público ✅ COMPLETADA

**Objetivo:** capa de datos compartida, identidad visual propia, layout público (header/footer), home, listado `/becas` con filtros/búsqueda/paginación, detalle `/becas/[slug]` con SEO dinámico, y SEO global (`sitemap.xml`, `robots.txt`).

**Resultado:** `npm run build` OK (Turbopack), todas las rutas verificadas en dev (`/`, `/becas`, `/becas/[slug]`, `/sitemap.xml`, `/robots.txt`) responden 200. **Falta hacer el commit.**

### Completado

- [x] **Objetivo 0 — refactor a capa de datos compartida**: `src/lib/becas/queries.ts` con `getBecas`, `getBecaBySlug`, `getFeaturedBecas`, `getFilterCategories`, `getFilterCountries`. Los Route Handlers `/api/becas`, `/api/becas/[slug]` y `/api/becas/destacadas` ahora llaman a estas funciones (mismo comportamiento, caché/rate-limit/Zod sin cambios). Las páginas RSC llaman a `queries.ts` directamente — **no** hacen fetch a su propia API.
- [x] **Identidad visual**: paleta violeta como color primario (`--primary: oklch(0.5 0.21 292)`) + acento ámbar (`--highlight`) para urgencia de fechas límite, definida en `globals.css` (`:root` + `.dark` + `@theme inline`). Tipografía Geist heredada de Fase 1.
- [x] **Layout público**: `src/components/layout/header.tsx` (sticky, brand "BecaHub" + ícono, nav Inicio/Explorar becas, acceso a búsqueda, menú hamburguesa móvil con `Sheet`) y `src/components/layout/footer.tsx` (enlaces, aviso de fuentes oficiales, copyright dinámico). Integrados en `src/app/(public)/layout.tsx`. Se eliminó `src/app/page.tsx` (starter de create-next-app).
- [x] **Home `/`**: hero con `HeroSearchForm` (client island → `/becas?search=...`), sección de becas destacadas (`getFeaturedBecas()`), exploración por categoría (ejes TYPE y AREA vía `getFilterCategories()`), sección "Cómo funciona" (3 pasos) y CTA final a `/becas`.
- [x] **Listado `/becas`**: `await searchParams` → Zod (`becasQuerySchema`) → `getBecas(query, { sort })`. Grid de `ScholarshipCard`, `SearchBar` (debounce ~300ms, actualiza `search` en la URL y resetea `page`), `FilterPanel` (type/area/country/level/deadlineBefore/sort, todo vía URL params, sin localStorage), `Pagination` vía `page`, `loading.tsx` con skeletons, estado vacío "No encontramos becas con estos filtros" / "No se encontraron becas".
- [x] **Detalle `/becas/[slug]`**: `await params` → `getBecaBySlug(slug)`, `notFound()` si no existe o `status !== "ACTIVE"`. Muestra todos los campos, `DeadlineBadge` con urgencia, botón "Ir a la convocatoria" (`target="_blank"`, `rel="noopener noreferrer"`), botones "Guardar"/"Ya postulé" deshabilitados con `TODO(auth)`. `generateMetadata` async con OG/Twitter dinámicos por beca.
- [x] **Componentes reutilizables** en `src/components/scholarships/`: `ScholarshipCard`, `FilterPanel`, `SearchBar`, `HeroSearchForm`, `Pagination`, `CategoryBadge`, `DeadlineBadge`, `CoverageBadge`. Helpers de formato en `src/lib/becas/format.ts` (`coverageLabels`, `academicLevelLabels`, `statusLabels`, `formatAmount`, `getDeadlineInfo`, `formatDate`).
- [x] **SEO**: `src/app/sitemap.ts` (rutas estáticas + una entrada por beca `ACTIVE`), `src/app/robots.ts` (`disallow: ["/api/"]`, referencia al sitemap), metadata base en `src/app/layout.tsx` (`metadataBase`, `title.template`, `description`, OG/Twitter defaults, `lang="es"`). Constantes centralizadas en `src/lib/site.ts`.

### Verificación manual

- `npm run build` → compila sin errores (Turbopack).
- `/`, `/becas`, `/becas/chevening-uk-masters`, `/sitemap.xml`, `/robots.txt` → HTTP 200.
- `<head>` del detalle incluye `title`, `meta description`, `og:title`, `og:description`, `og:type=article`, `twitter:card=summary`, `twitter:title`, `twitter:description`, todos generados dinámicamente desde `generateMetadata`.
- Filtros vía URL: `/becas?search=chevening` → "2 becas encontradas"; `/becas?area=stem` → "4 becas encontradas".
- Estado vacío: `/becas?search=xyzxyznoexiste` → "No encontramos becas con estos filtros" / "No se encontraron becas".
- Paginación: `/becas?limit=20&page=1` → HTTP 200.

### Desviaciones respecto al plan original

- [~] **Solo shadcn + Lucide**, sin librerías de fechas adicionales (no se necesitó `date-fns`; `Intl`/`Date` nativos fueron suficientes para `formatAmount`/`formatDate`/`getDeadlineInfo`).
- [~] `formatAmount` tipa los montos como `number | string | { toString(): string }` (no `Prisma.Decimal` directo) para evitar acoplar `src/lib/becas/format.ts` al cliente generado de Prisma.

### 🔑 Hallazgos técnicos para fases futuras

- [!] El ícono `ArrowSquareOut` **no existe** en la versión instalada de `lucide-react` — usar `ExternalLink`.
- [!] Los botones "Guardar" y "Ya postulé" del detalle están deshabilitados con comentarios `TODO(auth)` — quedan listos para conectarse en Fase 4B (auth + UI protegida).

### Pendiente (Fase 4B — auth y UI protegida)

- [ ] NextAuth (login/registro), rutas `(auth)`
- [ ] Favoritos ("Guardar") y postulaciones ("Ya postulé") — modelos `Favorite`/`Application` ya existen en el schema
- [ ] Perfil de usuario
- [ ] UI de admin (curación de becas scrapeadas, gestión de fuentes)

---

## Fase 4B — UI de admin (curación de becas) 🚧 EN CURSO

**Objetivo:** panel `/admin` para curar becas (crear, editar, publicar/archivar) con apoyo de IA y verificación de URLs, protegido con un gate de sesión provisional.

**Resultado parcial:** `npx tsc --noEmit` aplicado sobre los archivos nuevos (sin errores reportados por la exploración). Flujo de curación completo implementado end-to-end (login → tabla → alta/edición con IA → verificación de link → publicar/archivar). **No hay commit todavía** y falta la verificación manual en navegador (`npm run dev`) y la prueba de build completa.

### Completado

- [x] **Autenticación interina del panel** — gate de sesión por cookie, distinto del token `x-admin-scraper-token` usado por los endpoints de scraper:
  - `src/proxy.ts` (nuevo, reemplaza `middleware.ts` en Next 16): protege `/admin/*` (excepto `/admin/login`) y los endpoints de `/api/admin/becas*`; sin sesión válida, las páginas redirigen a `/admin/login?from=/path` y las APIs responden 401 JSON.
  - `src/lib/admin-auth.ts`: nuevas `ADMIN_SESSION_COOKIE = "becahub_admin_session"` e `isAdminSessionRequest()` — compara la cookie contra `ADMIN_PASSWORD` (env var, ya documentada en `.env.example`). Si falta `ADMIN_PASSWORD`, el panel queda **inaccesible por defecto** (falla cerrado). `isAdminScraperRequest()` (token) se mantiene intacta para los endpoints de scraper existentes.
  - `POST /api/admin/login`: valida password contra `ADMIN_PASSWORD`, fija cookie httpOnly/sameSite=lax (8h). `POST /api/admin/logout`: la borra.
  - `POST /api/admin/ai/parse-beca` ahora acepta **ambos** mecanismos (`isAdminScraperRequest` **o** `isAdminSessionRequest`), para que el panel pueda reusar el endpoint de extracción IA de Fase 3.
- [x] **`src/lib/geo.ts`**: helper minimalista `MEXICO_PATTERN`-like (regex `/m[eé]xic|\bmx\b/i`) para detectar si un texto refiere a México — usado por las validaciones de publicación.
- [x] **`src/lib/validation/url-health.ts`**: `checkUrlHealth(url)`, verificación de URL más estricta que `validateUrlIsLive` (Fase 3B) pensada para el flujo de curación humana: `GET` siguiendo redirects, reporta la URL final, rechaza respuestas no-2xx, contenido vacío y **soft-404** (heurística de frases tipo "no encontrado", "convocatoria cerrada", "enlace roto", etc.).
- [x] **`src/lib/becas/admin.ts`**: `assertCanPublish(beca)` — invariante central para permitir `status: ACTIVE`: país de destino debe incluir México (`geo.ts`), `deadline` presente y `>= hoy`, y URL viva según `checkUrlHealth`. Se usa tanto en el endpoint de CRUD como en el formulario (validación duplicada cliente/servidor).
- [x] **`src/validators/admin-becas.validator.ts`** (Zod): `adminBecaInputSchema` (alta/edición completa; `status` solo `DRAFT`/`ACTIVE`, nunca `PENDING_REVIEW` desde el panel) y `adminBecaPatchSchema` (PATCH rápido de `status`: `DRAFT`/`ACTIVE`/`CLOSED`), con validación de URL, enums y campos numéricos.
- [x] **Endpoints `/api/admin/becas`**:
  - `GET` (listado con filtro por `status`), `POST` (alta), `PUT` (edición completa) y `PATCH` (cambio rápido de estado) — todos via `adminBecaInputSchema`/`adminBecaPatchSchema` + `assertCanPublish` cuando el resultado es `ACTIVE`.
  - `POST /api/admin/becas/[id]/reverify`: re-corre `checkUrlHealth` sobre el `applyUrl` de una beca; si el link cayó y la beca estaba `ACTIVE`, la **archiva automáticamente** (`ACTIVE` → `DRAFT`), sin notificación adicional.
  - `POST /api/admin/becas/validar-url`: expone `checkUrlHealth` standalone para el formulario (botón "verificar link").
- [x] **Páginas `/admin`**:
  - `/admin/login`: formulario de password → `POST /api/admin/login`.
  - `/admin/becas`: tabla con filtro por `status` (ACTIVE/DRAFT/PENDING_REVIEW/CLOSED), acciones editar / re-verificar link / archivar.
  - `/admin/becas/nueva` y `/admin/becas/[id]/editar`: formulario de 3 pasos — (1) pegar texto de la convocatoria → análisis IA (`POST /api/admin/ai/parse-beca`) rellena título/descripción/deadline/cobertura/nivel; (2) editar/completar campos manualmente (fuente, categorías, montos, etc.); (3) verificar link (`validar-url`) y publicar (`ACTIVE`) o guardar como `DRAFT`.
- [x] **Componentes `src/components/admin/`**: `beca-form.tsx` (formulario de 3 pasos, maneja estados `analyzing` / `linkCheck: idle|checking|valid|invalid` / `saving`), `becas-table.tsx` (tabla con health-check de link y archivado), `logout-button.tsx`. Nuevo primitivo `src/components/ui/textarea.tsx` (shadcn-style).
- [x] **Seed actualizado** (`prisma/seed.ts`): nueva 4ª `Source` ("Curación manual (admin)", `type: MANUAL`) como punto de entrada de las becas creadas desde el panel.
- [x] **`prisma/schema.prisma`**: solo el valor de enum `SourceType.DISCOVERY` (heredado de Fase 3B, migración `20260613074649_add_source_type_discovery` ya aplicada).
- [x] **`src/scrapers/orchestrator.ts`**: registro de `"tavily-discovery"` → `TavilyDiscoveryAdapter` en `ADAPTER_REGISTRY` (parte de Fase 3B, agrupado aquí por estar en el mismo diff sin commit).

### [!] Decisiones / deuda técnica explícita

- [!] **Autenticación de un solo usuario por password** (`ADMIN_PASSWORD` en cookie, sin hashing ni expiración revocable más allá de las 8h del cookie): marcado con `TODO: reemplazar por NextAuth` en `admin-auth.ts`, `proxy.ts`, login/logout. Suficiente para curación interna mientras no haya múltiples admins.
- [!] **Archivado automático silencioso**: si `reverify` detecta que una beca `ACTIVE` quedó con link muerto, la pasa a `DRAFT` sin generar notificación. Si en el futuro se agregan alertas (Fase 5), considerar loguear o notificar este evento.
- [ ] Falta verificación manual en navegador (`npm run dev` + recorrido de `/admin/login` → `/admin/becas` → alta/edición) y `npm run build` completo antes de cerrar la fase y commitear.

### Pendiente para cerrar Fase 4B

- [ ] Probar el flujo completo en dev (login, listar, crear con IA, verificar link, publicar, archivar, reverify)
- [ ] `npm run build` y `npx tsc --noEmit` sobre todo el proyecto
- [ ] Commit (agrupar junto con Fase 3B, que comparte el mismo diff sin commitear)
- [ ] Decidir si el resto de Fase 4B (NextAuth real, favoritos/postulaciones, perfil de usuario) se hace en esta misma fase o se separa

---

## Fase 5 — Notificaciones, refinamiento y deploy ⏳ PENDIENTE

- [ ] Sistema de alertas por email (Resend)
- [ ] Deploy en Vercel + Sentry + Analytics
- [ ] Audit de accesibilidad y Core Web Vitals
- [ ] **Resolver vulnerabilidades de `npm audit`** (arrastradas desde Fase 1)

---

## Registro de cambios de esta bitácora

| Fecha | Cambio |
|-------|--------|
| Fase 1 | Documento creado. Registrada Fase 1 completa con desviaciones y hallazgos de Next 16 / Prisma 7. |
| Fase 2 | Schema Prisma completo + conexión a Supabase (Prisma 7 + adapter-pg), migración `init` aplicada, seed (2 fuentes/6 categorías/15 becas), validators Zod, caché/rate-limit con degradación, Route Handlers `/api/becas`, `/api/becas/[slug]` y `/api/becas/destacadas` probados. Dependencia extra: `tsx` (para correr el seed). |
| Fase 4A | Refactor a `src/lib/becas/queries.ts`, identidad visual violeta/ámbar, layout público (header/footer), home, listado `/becas` (filtros, búsqueda con debounce, paginación, loading/empty states), detalle `/becas/[slug]` con OG dinámico, sitemap/robots. `npm run build` OK. |
| Fase 3 (ajuste) | Migración de la curación IA de `@anthropic-ai/sdk` a **Ollama local** (`src/lib/ai/parse-scholarship.ts`, `fetch` sin SDK), re-validación Zod de la respuesta, degradación 503 si Ollama no responde. Decisión documentada: n8n + modelo hosted queda planeado para después. |
| Fase 3 (ajuste 2) | Migración de la curación IA de Ollama local a **API de Groq** (`llama-3.3-70b-versatile`, `response_format: json_schema` con fallback a `json_object`), sin SDK. Probado en vivo: extracción real (200 + Zod OK) y degradación con key inválida (401 de Groq → 503 sin filtrar la key). |
| Fase 3B | Capa de descubrimiento con **Tavily** (`src/lib/discovery/tavily.ts`, sin SDK), `validateUrlIsLive()` (`src/scrapers/url-liveness.ts`), `TavilyDiscoveryAdapter` con filtro México/vigente y extracción vía Groq, nuevo `SourceType.DISCOVERY` (migración no destructiva), registrado en `ADAPTER_REGISTRY` y seed (3ra fuente). `ADMIN_SCRAPER_TOKEN` documentado en `.env.example`. |
| Fase 4B (en curso) | Panel `/admin` de curación: gate de sesión por cookie (`proxy.ts`, `ADMIN_SESSION_COOKIE`/`isAdminSessionRequest`, `ADMIN_PASSWORD`), login/logout, CRUD `/api/admin/becas` (+ `reverify`/`validar-url`) con invariante `assertCanPublish` (México + deadline vigente + link vivo), formulario de 3 pasos con extracción IA, tabla con health-check y archivado, 4ª fuente `MANUAL` en seed. Falta probar en dev, `npm run build` y commit. |
| Fase 3C | Cierre de migración a Groq: `applyUrl` eliminado del contrato del modelo (prompt/schema/Zod); invariante "applyUrl = URL fetcheada y validada viva, nunca del modelo" aplicado también en `TavilyDiscoveryAdapter` (se quitó `resolveApplyUrl`). `BecasGobAdapter` reconstruido con el mismo pipeline que Tavily (fetch listado → enlaces → `<main>` texto → `validateUrlIsLive` → Groq → filtros México/vigente). Nuevo `scripts/test-scraper.ts` (`npm run scrape:test`, dry-run por etapas). Corrida real: `ScraperLog SUCCESS`, 3 becas `PENDING_REVIEW` con `applyUrl` verificado (200). Commit Parte A: `c098818`. |
