# BecaHub

Plataforma web que agrega, categoriza y permite buscar oportunidades de becas.

## Stack

- Next.js 16 (App Router, `src/`)
- TypeScript estricto
- Tailwind CSS + shadcn/ui
- Prisma + PostgreSQL
- Redis (Upstash)
- NextAuth
- Zod

## Empezar

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para ver el resultado.

## Estructura

- `src/app/` — rutas (App Router): `(public)`, `(auth)`, `(admin)`, `api`
- `src/components/` — componentes UI (`ui/`, `scholarships/`, `layout/`)
- `src/lib/` — utilidades y clientes (DB, Redis, etc.)
- `src/scrapers/` — adaptadores y orquestador para extraer becas de fuentes externas
- `src/validators/` — esquemas de validación (Zod)
- `src/types/` — tipos compartidos de TypeScript
- `prisma/` — esquema y migraciones de base de datos
