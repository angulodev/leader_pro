# Area Leader Pro

Plataforma web de gestión de proyectos diseñada para líderes de área. Permite gestionar proyectos, equipos, tareas, riesgos y reportes en un solo lugar, con datos en tiempo real desde Supabase.

**Demo en vivo:** [angulodev.github.io/leader_pro](https://angulodev.github.io/leader_pro/)

---

## Índice

1. [Stack tecnológico](#stack-tecnológico)
2. [Funcionalidades](#funcionalidades)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Instalación local](#instalación-local)
5. [Configuración de Supabase](#configuración-de-supabase)
6. [Schema completo de base de datos](#schema-completo-de-base-de-datos)
7. [Variables de entorno](#variables-de-entorno)
8. [Deploy en producción](#deploy-en-producción)
9. [CI/CD con GitHub Actions](#cicd-con-github-actions)

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite |
| Base de datos | Supabase (PostgreSQL 17) |
| Iconos | Material Symbols Rounded (Google Fonts) |
| Tipografía | Inter (Google Fonts) |
| Estilos | CSS custom (sin framework de CSS) |
| Deploy | GitHub Pages via GitHub Actions |

---

## Funcionalidades

### Dashboard
- KPIs ejecutivos: total de proyectos, tasa de completitud, tareas bloqueadas, equipo activo
- Cards interactivos que navegan a la sección correspondiente

### Proyectos
- CRUD completo: crear, editar y eliminar proyectos
- Estados: Backlog → Planificación → En desarrollo → En riesgo → En pausa → Completado
- Sliders de progreso real vs estimado
- Filtros por estado y búsqueda por nombre/cliente
- Métricas de resumen en tiempo real

### Detalle de Proyecto (4 tabs)
- **Overview**: descripción, barras de progreso, resumen de tareas, comentarios con fecha y hora exacta
- **Tareas**: CRUD completo, asignación a miembros, estados y fechas límite
- **Riesgos**: registro de riesgos con severidad (Alto/Medio/Bajo), impacto en tiempo y costo
- **Equipo**: asignación/desasignación visual de personas al proyecto

### Equipo
- CRUD de personas: nombre, iniciales, rol, email, color de avatar
- Estado Activo/Inactivo (soft delete — preserva integridad referencial)
- Confirmación antes de cambiar estado + toast de confirmación
- Tabla + tarjetas con toggle de inactivos

### Carga de Trabajo
- Mapa de calor semanal por persona
- Indicadores de utilización con alertas de sobrecarga

### Reportes
- KPIs ejecutivos con datos reales
- Gráfico de barras: progreso real vs estimado por proyecto
- Donut: distribución de estados de proyectos y tareas
- Sparkline de actividad del equipo (7/14/30 días)
- Carga del equipo por persona

### Notificaciones
- Panel desplegable con actividad en tiempo real
- Marca como leída individual o todas
- Contador de no leídas persistido en localStorage

---

## Estructura del proyecto

```
area-leader-pro/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx       # Vista ejecutiva con KPIs
│   │   ├── Projects.jsx        # Cartera y tabla de proyectos
│   │   ├── ProjectDetail.jsx   # Detalle: tareas, riesgos, equipo, comentarios
│   │   ├── ProjectModal.jsx    # Modal crear/editar proyecto
│   │   ├── Team.jsx            # Gestión de equipo con CRUD
│   │   ├── Workload.jsx        # Carga de trabajo semanal
│   │   ├── Reports.jsx         # Reportes y analytics
│   │   ├── Notifications.jsx   # Panel de notificaciones
│   │   └── UI.jsx              # Componentes compartidos (Avatar, StatusTag, etc.)
│   ├── lib/
│   │   └── supabase.js         # Cliente Supabase + todas las queries/RPCs
│   ├── App.jsx                 # Shell: layout, navegación, routing
│   ├── index.css               # Estilos globales (design system completo)
│   └── main.jsx                # Entry point React
├── supabase/
│   └── migrations/
│       └── 001_full_schema.sql # Schema completo (ver sección abajo)
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD: build + deploy a GitHub Pages
├── .env.example                # Template de variables de entorno
├── vite.config.js              # Config Vite (base path para GitHub Pages)
└── README.md
```

---

## Instalación local

### Requisitos previos
- Node.js 18 o superior
- npm 9 o superior
- Cuenta en [Supabase](https://supabase.com) (plan gratuito funciona)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/angulodev/leader_pro.git
cd leader_pro

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales (ver sección de Supabase abajo)

# 4. Aplicar el schema en Supabase
# Ir al SQL Editor de tu proyecto y ejecutar supabase/migrations/001_full_schema.sql

# 5. Correr en modo desarrollo
npm run dev
# La app estará en http://localhost:5173
```

---

## Configuración de Supabase

### 1. Crear proyecto

1. Ir a [supabase.com](https://supabase.com) → New project
2. Elegir nombre, contraseña y región (recomendado: `us-east-1`)
3. Esperar ~2 minutos a que el proyecto esté listo

### 2. Obtener credenciales

En el panel de Supabase: **Settings → API**

- **Project URL**: `https://TU_ID.supabase.co`
- **anon/public key**: la clave que empieza con `eyJ...`

### 3. Aplicar el schema

En el panel de Supabase: **SQL Editor → New query**

Pegar y ejecutar el contenido de `supabase/migrations/001_full_schema.sql`

> El schema crea el schema `area_leader` con todas las tablas, las vistas públicas para PostgREST, las funciones RPC y las políticas RLS.

---

## Schema completo de base de datos

El schema `area_leader` contiene las siguientes tablas:

### Tablas

| Tabla | Descripción |
|-------|-------------|
| `team_members` | Personas del equipo con soft delete (campo `active`) |
| `projects` | Proyectos con estado, progreso real/estimado y líder asignado |
| `project_members` | Relación many-to-many entre proyectos y miembros |
| `tasks` | Tareas de cada proyecto con asignación y estado |
| `risks` | Riesgos registrados por proyecto con severidad e impacto |
| `activity` | Feed de eventos: comentarios, cambios de estado, hitos |
| `workload` | Horas asignadas por persona/día/proyecto |

### Vistas públicas (PostgREST)

PostgREST solo expone el schema `public` por defecto. Para que el cliente JavaScript pueda leer los datos, se crean vistas en `public` que apuntan al schema `area_leader`:

| Vista | Descripción |
|-------|-------------|
| `al_team_members` | Miembros activos |
| `al_team_members_all` | Todos los miembros (incluyendo inactivos) |
| `al_projects` | Proyectos con datos del líder embebidos |
| `al_tasks` | Tareas con datos del asignado |
| `al_risks` / `al_risks_by_project` | Riesgos con nombre del proyecto |
| `al_activity` | Actividad con actor y proyecto |
| `al_workload` | Carga con datos de miembro y proyecto |
| `al_project_members` | Miembros asignados a cada proyecto |

### Funciones RPC

Todas las operaciones de escritura se hacen via RPC con `SECURITY DEFINER`:

| Función | Operación |
|---------|-----------|
| `al_upsert_member` | Crear/editar miembro |
| `al_deactivate_member` / `al_activate_member` | Soft delete |
| `al_upsert_project` | Crear/editar proyecto |
| `al_delete_project` | Eliminar proyecto y dependencias en cascada |
| `al_add_project_member` / `al_remove_project_member` | Asignación de equipo |
| `al_upsert_task` / `al_delete_task` | CRUD de tareas |
| `al_upsert_risk` / `al_delete_risk` | CRUD de riesgos |
| `al_add_activity` | Registrar comentario/evento |
| `al_report_summary` | KPIs del dashboard de reportes |
| `al_report_progress` | Progreso vs estimación por proyecto |
| `al_report_activity` | Actividad agrupada por día |
| `al_report_team_load` | Carga de trabajo por miembro |

---

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Importante:** el archivo `.env` está en `.gitignore` y nunca debe subirse al repositorio. Usar `.env.example` como referencia.

Para producción (GitHub Pages), las variables se configuran como **Repository Secrets** en GitHub:
`Settings → Secrets and variables → Actions → New repository secret`

---

## Deploy en producción

### GitHub Pages (configuración actual)

El proyecto está configurado para hacer deploy automático a GitHub Pages en cada push a `main`.

**Prerequisitos:**
1. Habilitar GitHub Pages: `Settings → Pages → Source: Deploy from branch → gh-pages`
2. Agregar los secrets de Supabase en el repositorio

**URL resultante:** `https://TU_USUARIO.github.io/NOMBRE_REPO/`

> Si el nombre del repo cambia, actualizar `base` en `vite.config.js`.

### Vercel / Netlify

```bash
# Build command
npm run build

# Output directory
dist

# Variables de entorno
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Self-hosted (nginx)

```bash
npm run build
# Copiar contenido de dist/ al directorio web
# Configurar nginx para SPA: todas las rutas apuntan a index.html
```

---

## CI/CD con GitHub Actions

El archivo `.github/workflows/deploy.yml` automatiza el proceso completo:

```
Push a main
    ↓
Checkout código
    ↓
Setup Node.js 20
    ↓
npm ci (install limpio)
    ↓
npm run build (con secrets de Supabase)
    ↓
Push a rama gh-pages
    ↓
GitHub Pages sirve el sitio
```

**El deploy tarda aproximadamente 30–40 segundos desde el push hasta que el sitio se actualiza.**

---

## Desarrollo

```bash
# Modo desarrollo con hot reload
npm run dev

# Build de producción
npm run build

# Preview del build local
npm run preview
```

---

## Licencia

MIT — Angulodev · Francisco Angulo
