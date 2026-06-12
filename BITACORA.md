# Bitácora del proyecto — BecaHub

> Documento vivo. Registra el estado real del proyecto fase por fase: lo completado, las desviaciones respecto al plan original, los hallazgos técnicos y lo pendiente. Sirve como memoria compartida entre la planeación (chat de diseño) y la implementación (Claude Code / Claude Desktop).
>
> **Cómo usarlo:** al iniciar cada sesión de Claude Code, pega este archivo (o pídele que lo lea desde la raíz del repo) para que tenga contexto del estado actual antes de codear.

- **Proyecto:** BecaHub — plataforma de agregación y búsqueda de becas
- **Ubicación:** `C:\opbecaas` (la carpeta raíz NO se ha renombrado todavía; pendiente manual del usuario)
- **Stack confirmado:** Next.js 16.2.9 · TypeScript · Tailwind · Prisma 7 · PostgreSQL · Redis (Upstash) · NextAuth · Zod
- **Última actualización:** Fase 2 cerrada (pendiente commit)

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

## Fase 3 — Sistema de scraping ⏳ PENDIENTE

- [ ] Interfaz `ScraperAdapter` en `src/scrapers/types.ts`
- [ ] `BaseAdapter` con retry, logging, dedup por URL
- [ ] Adaptadores reales (empezar por `becas.gob.mx`)
- [ ] `ScraperOrchestrator` con concurrencia controlada (`p-queue`)
- [ ] Tabla `scraper_logs` en Prisma
- [ ] Cron job (inngest o Vercel Cron)
- [ ] Descargar browsers de Playwright cuando se use (`npx playwright install`)
- [ ] Integración con Claude AI para parsear texto pegado de redes sociales

---

## Fase 4 — Frontend completo ⏳ PENDIENTE

- [ ] Home, listado `/becas` con filtros, detalle `/becas/[slug]`, perfil, admin
- [ ] Búsqueda con debounce
- [ ] SEO: sitemap dinámico + meta tags OG por beca

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
