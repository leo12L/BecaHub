# BecaHub

Plataforma web para buscar y gestionar oportunidades de becas para estudiantes universitarios mexicanos.

> **📖 [Documentación de Arquitectura](docs/ARQUITECTURA.md)** — visión general, decisiones técnicas, módulos del sistema, modelo de datos, flujos principales, infraestructura y fases de desarrollo.

## Stack

- **Next.js 16** (App Router, React 19, TypeScript)
- **Tailwind CSS 4** + shadcn/ui
- **Prisma 7** + PostgreSQL (Supabase)
- **Redis** (Upstash, opcional en desarrollo)
- **NextAuth v4** (autenticación)
- **Zod** (validación)
- **Vitest** (pruebas)

## Requisitos

- Node.js 20 o superior
- Git
- Una cuenta de Supabase (Postgres) o PostgreSQL local

## Configuración local (Windows PowerShell)

### 1. Clonar el repositorio

```powershell
git clone https://github.com/leo12L/BecaHub.git
cd BecaHub
```

### 2. Instalar dependencias

```powershell
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto copiando `.env.example`:

```powershell
Copy-Item .env.example .env
```

Edita `.env` y configura al menos estas variables obligatorias:

```env
# Base de datos (obtén estos valores de tu proyecto de Supabase)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth (genera NEXTAUTH_SECRET con el comando de abajo)
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Admin (crea una contraseña segura)
ADMIN_PASSWORD="..."
ADMIN_SCRAPER_TOKEN="..."
```

Para generar `NEXTAUTH_SECRET` en PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Nota:** Las claves de Groq (`GROQ_API_KEY`) y Tavily (`TAVILY_API_KEY`) son opcionales. Sin ellas, el asistente de perfil y el descubrimiento automático no funcionarán, pero el resto de la aplicación sí.

### 4. Configurar la base de datos

Genera el cliente de Prisma:

```powershell
npx prisma generate
```

Aplica las migraciones:

```powershell
npx prisma migrate deploy
```

Carga los datos iniciales (categorías y fuentes):

```powershell
npx prisma db seed
```

### 5. Iniciar el servidor de desarrollo

```powershell
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

Para detener el servidor, presiona `Ctrl + C` en la terminal.

## Scripts disponibles

```powershell
npm run dev           # Inicia el servidor de desarrollo
npm run build         # Compila la aplicación para producción
npm start             # Inicia el servidor de producción
npm run lint          # Ejecuta el linter
npm test              # Ejecuta las pruebas
npm run scrape        # Ejecuta el scraper manual (requiere sourceId)
npm run discover      # Ejecuta el descubrimiento automático con Tavily
```

## Estructura del proyecto

```
├── src/
│   ├── app/              # Rutas de Next.js
│   │   ├── (public)/     # Rutas públicas (home, listado de becas)
│   │   ├── (auth)/       # Rutas protegidas (dashboard, perfil)
│   │   ├── (admin)/      # Panel de administración
│   │   └── api/          # Endpoints de la API
│   ├── components/       # Componentes React
│   │   ├── ui/           # Componentes base de shadcn
│   │   ├── scholarships/ # Componentes de becas
│   │   ├── layout/       # Header, footer, etc.
│   │   └── dashboard/    # Componentes del dashboard
│   ├── lib/              # Utilidades y configuración
│   │   ├── becas/        # Lógica de negocio de becas
│   │   ├── ai/           # Integración con Groq (asistente)
│   │   ├── discovery/    # Integración con Tavily
│   │   └── validation/   # Validación de URLs
│   ├── scrapers/         # Sistema de scraping
│   │   ├── adapters/     # Adaptadores por fuente
│   │   └── discovery/    # Heurísticas de extracción
│   ├── validators/       # Esquemas de validación (Zod)
│   └── types/            # Tipos compartidos de TypeScript
├── prisma/               # Esquema y migraciones de base de datos
├── public/               # Archivos estáticos
└── scripts/              # Scripts de utilidad
```

## Desarrollo

### Flujo de trabajo con Git

1. Crea una rama para tu tarea:

```powershell
git checkout -b feat/nombre-de-tu-tarea
```

2. Realiza tus cambios y haz commits descriptivos:

```powershell
git add .
git commit -m "feat: descripción corta del cambio"
```

3. Sube tu rama:

```powershell
git push origin feat/nombre-de-tu-rama
```

4. Abre un Pull Request en GitHub.

### Convenciones de commits

- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de errores
- `chore:` - Tareas de mantenimiento
- `docs:` - Cambios en documentación
- `refactor:` - Refactorización de código
- `test:` - Añadir o modificar pruebas
- `style:` - Cambios de formato (no afectan la lógica)

## Estado del proyecto

Este proyecto está en **Fase 0** (limpieza) tras un período de inactividad. Las siguientes funcionalidades están implementadas:

- ✅ Listado y búsqueda de becas
- ✅ Sistema de scraping con adaptadores
- ✅ Panel de administración básico
- ✅ Descubrimiento automático con Tavily (requiere clave)
- ✅ Asistente de perfil con Groq (requiere clave)
- ⚠️ Autenticación (provisoria, pendiente de migrar a NextAuth)
- ⚠️ Dashboard (esqueleto, no conectado a datos reales)

### Servicios desactivados

Los siguientes servicios fueron desactivados porque el propietario ya no tiene acceso:

- ❌ Perplexity (descubrimiento alternativo)
- ❌ Scraper de gob.mx/becasbenitojuarez (URL da 404)

## Contribuir

1. Revisa los issues abiertos o crea uno nuevo
2. Haz fork del repositorio
3. Crea una rama para tu contribución
4. Realiza tus cambios
5. Abre un Pull Request

## Licencia

Este proyecto es privado. Todos los derechos reservados.
