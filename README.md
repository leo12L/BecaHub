# BecaHub

Plataforma web para buscar y gestionar oportunidades de becas para estudiantes universitarios mexicanos.

> **📖 [Documentación de Arquitectura](docs/ARQUITECTURA.md)** — visión general, decisiones técnicas, módulos del sistema, modelo de datos, flujos principales, infraestructura y fases de desarrollo.

## Stack

- **Next.js 16** (App Router, React 19, TypeScript)
- **Tailwind CSS 4** + shadcn/ui
- **Prisma 7** + PostgreSQL (Supabase)
- **Redis** (Upstash, opcional en desarrollo)
- **Supabase Auth** (autenticación)
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

Crea un archivo `.env.local` en la raíz del proyecto copiando `.env.example`:

```powershell
Copy-Item .env.example .env.local
```

Edita `.env.local` y configura las variables necesarias. Consulta la sección [Configurar Supabase](#configurar-supabase-para-desarrollo-local) más abajo para obtener las llaves de tu proyecto.

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

---

## Configurar Supabase para desarrollo local

### 1. Crear un proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta gratuita
2. Crea un nuevo proyecto (elige la región más cercana, por ejemplo `us-east-1`)
3. Espera a que el proyecto termine de configurarse (1-2 minutos)

### 2. Obtener las credenciales de conexión

**Para `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`:**

1. En el dashboard de Supabase, ve a **Project Settings** → **API**
2. Copia `URL` → pégalo en `NEXT_PUBLIC_SUPABASE_URL` en tu `.env.local`
3. Copia `anon public` → pégalo en `NEXT_PUBLIC_SUPABASE_ANON_KEY` en tu `.env.local`

**Para `DATABASE_URL` y `DIRECT_URL`:**

1. En el dashboard de Supabase, ve a **Project Settings** → **Database**
2. Busca la sección **Connection string** → selecciona **URI** y copia el string
3. Reemplaza `[YOUR-PASSWORD]` con la contraseña de tu base de datos

4. Para `DATABASE_URL` (conexión pooled para la aplicación):
   - Cambia el puerto `:5432` por `:6543`
   - Agrega `?pgbouncer=true` al final
   - Ejemplo final:
     ```
     postgresql://postgres.abc123:tu-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
     ```

5. Para `DIRECT_URL` (conexión directa para migraciones):
   - Usa el puerto `:5432` (sin cambios)
   - No agregues `?pgbouncer=true`
   - Ejemplo final:
     ```
     postgresql://postgres.abc123:tu-password@db.abc123.supabase.co:5432/postgres
     ```

**Si necesitas rotar la contraseña de la base de datos:**

1. Ve a **Project Settings** → **Database** → **Database Password**
2. Haz clic en **Reset database password**
3. Copia la nueva contraseña
4. Actualiza `DATABASE_URL` y `DIRECT_URL` en tu `.env.local` con la nueva contraseña

### 3. Configurar autenticación por email

1. En el dashboard de Supabase, ve a **Authentication** → **Providers**
2. Habilita **Email** (debe estar activado por defecto)
3. Ve a **Authentication** → **URL Configuration**
4. En **Redirect URLs**, agrega:
   ```
   http://localhost:3000
   ```
5. Guarda los cambios

### 4. Probar el login

Después de configurar las variables de entorno y ejecutar las migraciones (paso 4 arriba):

1. Inicia el servidor de desarrollo:
   ```powershell
   npm run dev
   ```

2. Ve a [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

3. Crea una cuenta de prueba con tu email

4. Revisa tu bandeja de entrada para confirmar el email (revisa spam si no llega)

5. Una vez confirmado, actualiza el rol de tu usuario a `ADMIN`:
   - Ve al dashboard de Supabase → **Table Editor** → tabla `User`
   - Busca tu usuario por email
   - Cambia el campo `role` de `USER` a `ADMIN`
   - Guarda los cambios

6. Ahora puedes acceder a `/admin` con tu cuenta

---

## Scripts disponibles

```powershell
npm run dev                # Inicia el servidor de desarrollo
npm run build              # Compila la aplicación para producción
npm start                  # Inicia el servidor de producción
npm run lint               # Ejecuta el linter
npm test                   # Ejecuta las pruebas
npm run ingesta            # Ejecuta la ingesta automática de becas
npm run limpiar-becas      # Vista previa: muestra qué becas de ingesta no aprobadas borraría
npm run limpiar-becas -- --yes  # Ejecuta el borrado
```

### Después de fusionar PR #8 (migración destinationCountries)

Los datos actuales de la Supabase del dueño son de prueba. Hay que resetear y volver a sembrar (no se añade una migración de parche):

```powershell
npx prisma migrate reset --force
npx prisma db seed
```

Luego inicia sesión una vez (eso recrea tu fila en `User`). Sustituye el correo y ejecuta:

```powershell
'UPDATE "User" SET role = ''ADMIN'' WHERE email = ''TU_CORREO@dominio.com'';' | npx prisma db execute --stdin
```

El script `limpiar-becas` sigue disponible para borrar solo ingesta no publicada (`npm run limpiar-becas` / `--yes`).

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
- ✅ Autenticación con Supabase Auth
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
