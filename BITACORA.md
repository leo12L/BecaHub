# Bitácora del proyecto — BecaHub

> Documento vivo. Registra el estado real del proyecto fase por fase: lo completado, las desviaciones respecto al plan original, los hallazgos técnicos y lo pendiente. Sirve como memoria compartida entre la planeación (chat de diseño) y la implementación (Claude Code / Claude Desktop).
>
> **Cómo usarlo:** al iniciar cada sesión de Claude Code, pega este archivo (o pídele que lo lea desde la raíz del repo) para que tenga contexto del estado actual antes de codear.

- **Proyecto:** BecaHub — plataforma de agregación y búsqueda de becas
- **Ubicación:** `C:\opbecaas` (la carpeta raíz NO se ha renombrado todavía; pendiente manual del usuario)
- **Stack confirmado:** Next.js 16.2.9 · TypeScript · Tailwind · Prisma 7 · PostgreSQL · Redis (Upstash) · NextAuth · Zod
- **Última actualización:** Fase 1 cerrada (sin commit aún)

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

## Fase 2 — Base de datos + API core ⏳ PENDIENTE

**Objetivo:** esquema Prisma completo, seed con datos reales, y los Route Handlers de `/api/becas` con filtros, paginación, caché y rate limiting.

### Tareas pendientes

- [ ] Hacer primero el **commit de la Fase 1** (`chore: configurar fundación del proyecto BecaHub`)
- [ ] Definir todos los modelos en `schema.prisma` según el ERD: `User`, `Scholarship`, `Source`, `Category`, `Favorite`, `Application`, `Notification` + tabla intermedia `scholarship_categories`
- [ ] Correr `npx prisma migrate dev --name init` y verificar tablas
- [ ] Correr `npx prisma generate` (recordar: cliente sale en `src/generated/prisma`)
- [ ] Crear `prisma/seed.ts` con ~15 becas de ejemplo en categorías distintas, 3 categorías, 2 fuentes
- [ ] Implementar validators Zod en `src/validators/`
- [ ] Implementar Route Handlers de `/api/becas` (GET con filtros + paginación)
- [ ] Crear `src/lib/cache.ts` (wrappers Redis get/set/invalidate)
- [ ] Crear `src/lib/rate-limit.ts` y aplicarlo a rutas públicas
- [ ] Probar endpoints con Bruno/Postman

### Decisiones a tomar antes de empezar

- [!] **Versión de NextAuth:** está instalada la **v4** por defecto. Decidir si se mantiene v4 o se migra a **Auth.js v5** (afecta toda la config de auth de Fase 2/3). La v5 tiene mejor integración con App Router y con la nueva convención `proxy.ts`.
- [!] Al integrar auth, recordar usar **`proxy.ts`** (no `middleware.ts`) por el cambio de Next 16.

### Recordatorios técnicos heredados de Fase 1

- Escribir el código pensando en las **APIs de request asíncronas** de Next 15/16 (params, searchParams, cookies, headers son `await`).
- Auditar el comportamiento de caché por defecto (cambió en Next 15+); usar directivas explícitas donde se dependa de caché.

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
