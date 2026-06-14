# BecaHub

Plataforma web que agrega, categoriza y permite buscar oportunidades de becas.

## Stack

- Next.js 16 (App Router, `src/`)
- TypeScript estricto
- Tailwind CSS + shadcn/ui
- Prisma + PostgreSQL
- Redis (Upstash, opcional en desarrollo)
- Zod

## Configuración rápida

### 1. Prerrequisitos

```bash
node --version  # v20 o superior
git --version
```

### 2. Clonar el proyecto

```bash
git clone https://github.com/leo12L/BecaHub.git
cd BecaHub
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto (o renombra `.env.example` si existe):

```env
# Base de datos
DATABASE_URL="postgres://..."      # conexión pooled (Supavisor)
DIRECT_URL="postgres://..."        # conexión directa para migraciones

# Redis (opcional — sin esto la caché y rate-limiting se desactivan)
REDIS_URL=
REDIS_TOKEN=

# NextAuth
NEXTAUTH_SECRET=                   # genera con: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# OAuth de Google
GOOGLE_CLIENT_ID=                  # opcional hasta habilitar login con Google
GOOGLE_CLIENT_SECRET=              # opcional hasta habilitar login con Google

# Emails transaccionales
RESEND_API_KEY=                    # opcional, fase posterior

# IA
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
TAVILY_API_KEY=

# Admin
ADMIN_SCRAPER_TOKEN=               # token para /api/admin/scraper/* y /api/admin/ai/*
ADMIN_PASSWORD=                    # contraseña del panel /admin
```

> Los valores reales te los comparte el mantenedor del proyecto por privado.

### 5. Generar el cliente de Prisma

```bash
npx prisma generate
```

### 6. Levantar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Para detener: `Ctrl + C`.

> **Windows**: puedes usar el archivo `start.bat` incluido en la raíz para levantar el servidor con doble clic.

### 7. Crear tu rama de trabajo

```bash
git checkout -b feat/nombre-de-tu-tarea
```

### 8. Subir cambios

```bash
git add .
git commit -m "feat: descripcion corta"
git push origin feat/nombre-de-tu-rama
```

Luego abre un Pull Request en [github.com/leo12L/BecaHub](https://github.com/leo12L/BecaHub).

## Estructura

- `src/app/` — rutas (App Router): `(public)`, `(auth)`, `(admin)`, `api`
- `src/components/` — componentes UI (`ui/`, `scholarships/`, `layout/`)
- `src/lib/` — utilidades y clientes (DB, Redis, etc.)
- `src/scrapers/` — adaptadores y orquestador para extraer becas de fuentes externas
- `src/validators/` — esquemas de validación (Zod)
- `src/types/` — tipos compartidos de TypeScript
- `prisma/` — esquema y migraciones de base de datos
