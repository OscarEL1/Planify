# CONTEXTO — Planify (Proyecto Universitario EAR)

**Materia:** EAR (Entorno de Aplicaciones Robustes)
**Repositorio:** https://github.com/OscarEL1/Planify
**Última actualización:** 2026-08-03

---

## 1. Descripción del Proyecto

Planify es un sistema web de administración de actividades escolares. Permite a un equipo de trabajo crear, asignar, gestionar y dar seguimiento a actividades académicas con roles diferenciados (administrador, miembro del equipo y observador).

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4 (class-based dark mode), react-router-dom v7 |
| **Backend** | Node.js (ES modules), Express, Prisma ORM |
| **Base de datos** | PostgreSQL (Supabase) |
| **Autenticación** | JWT (JSON Web Tokens) + blacklist en memoria |
| **Drag & Drop** | @hello-pangea/dnd |
| **Gráficos** | SVG propio (sin librería externa) |
| **Validación** | Zod (frontend), validación manual (backend) |
| **Testing backend** | Node.js test runner (node:test) |
| **Monorepo** | npm workspaces |
| **CI/CD** | Husky + Commitlint (convencional commits) |
| **Deploy frontend** | Netlify |
| **Deploy backend** | Render |
| **Base de datos prod** | Supabase (pooler: puerto 6543) |

---

## 3. Deploy — URLs de Producción

| Servicio | URL |
|----------|-----|
| **Frontend** | `https://planify-frontend.netlify.app` |
| **Backend** | `https://planify-backend.onrender.com` |
| **Supabase Dashboard** | https://supabase.com/dashboard |

### Variables de Entorno — Producción

**Render (Backend):**
```
DATABASE_URL=postgresql://postgres.PROJECT:PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres
JWT_SECRET=<generado con openssl rand -base64 32>
FRONTEND_URL=https://planify-frontend.netlify.app
PORT=3000
NODE_ENV=production
```

**Netlify (Frontend):**
```
VITE_API_URL=https://planify-backend.onrender.com
```

### Build Commands

**Render:**
```
Build: cd apps/backend && npm install --ignore-scripts && npx prisma generate && npx prisma migrate deploy
Start: cd apps/backend && npm start
```

**Netlify:**
```
Base directory: /
Package directory: apps/frontend
Build command: cd apps/frontend && npm install --ignore-scripts && npm run build
Publish directory: apps/frontend/dist
```

### Migración de BD en Supabase

```sql
-- Ejecutar en SQL Editor después de crear la BD
ALTER TYPE "Role" ADD VALUE 'ADMIN' BEFORE 'MIEMBRO_EQUIPO';
```

---

## 4. Estructura del Monorepo

```
Planify/
├── apps/
│   ├── frontend/                    # React + Vite + Tailwind
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── activities/      # ActivityFormModal
│   │   │   │   ├── auth/            # LoginForm, RegisterForm, ProtectedRoute
│   │   │   │   ├── kanban/          # KanbanBoard, KanbanCard
│   │   │   │   ├── layout/          # Navbar
│   │   │   │   └── common/          # ToastProvider, useToast
│   │   │   ├── pages/               # Todas las páginas
│   │   │   ├── hooks/               # useActivities (React Query)
│   │   │   ├── services/            # activityService, authService, api
│   │   │   ├── context/             # AuthContext, SettingsContext
│   │   │   └── App.jsx              # Router principal
│   │   ├── netlify.toml             # SPA redirect para Netlify
│   │   └── package.json
│   └── backend/                     # Express + Prisma
│       ├── src/
│       │   ├── controllers/         # activity, activity-stats, auth, comment, me, register, users
│       │   ├── middleware/          # authenticate-token, require-team-member, enforce-admin
│       │   ├── routes/              # activity.routes, auth.routes, users.routes
│       │   ├── services/            # token-blacklist
│       │   ├── lib/                 # prisma (client singleton)
│       │   ├── app.js
│       │   └── index.js
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── test/                    # 14 archivos de test
│       └── package.json
├── netlify.toml                     # SPA redirect (raíz del repo)
├── package.json                     # workspaces config
└── CONTEXTO_PO_PLANIFY.md           # Este archivo
```

---

## 5. Modelo de Base de Datos (Prisma)

### Enums

| Enum | Valores |
|------|---------|
| **Role** | `ADMIN`, `MIEMBRO_EQUIPO`, `OBSERVADOR` |
| **TaskStatus** | `PENDIENTE`, `EN_PROCESO`, `EN_REVISION`, `COMPLETADA` |
| **Priority** | `ALTA`, `MEDIA`, `BAJA` |

### Modelos

| Modelo | Campos principales | Relaciones |
|--------|-------------------|------------|
| **User** | id, name, email, password, role | assignedTasks[], comments[] |
| **Task** | id, title, description, status, priority, dueDate, evidenceUrl, assigneeId | assignee (User), comments[], subtasks[] |
| **Subtask** | id, text, done, taskId | task (Task) — cascade delete |
| **Comment** | id, text, taskId, userId | task (Task) — cascade delete, user (User) |

---

## 6. Roles y Permisos

| Rol | Leer | Crear | Editar | Eliminar | Cambiar estado | Gestionar usuarios | Ver Equipo/Config |
|-----|------|-------|--------|----------|----------------|-------------------|-------------------|
| **ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **MIEMBRO_EQUIPO** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **OBSERVADOR** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

- El middleware `enforceWriteRole` bloquea POST, PATCH, DELETE para observadores
- El middleware `enforceAdmin` restringe gestión de usuarios a ADMIN
- El observador no ve las secciones "Equipo" ni "Configuración" en el Navbar

---

## 7. Endpoints de la API

### Autenticación

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/auth/login` | Iniciar sesión, retorna JWT + role | No |
| POST | `/auth/register` | Registrar nuevo usuario (siempre MIEMBRO_EQUIPO) | No |
| POST | `/auth/logout` | Cerrar sesión (revoca token) | Sí |
| GET | `/auth/me` | Obtener datos del usuario autenticado | Sí |

### Actividades

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/activities` | Listar (filtros: `?assigneeId=X&priority=Y`) | Todos |
| GET | `/activities/stats` | Estadísticas y progreso | Todos |
| GET | `/activities/:id` | Obtener actividad por ID | Todos |
| POST | `/activities` | Crear actividad | MIEMBRO_EQUIPO / ADMIN |
| PATCH | `/activities/:id/status` | Cambiar estado (drag-and-drop) | MIEMBRO_EQUIPO / ADMIN |
| PATCH | `/activities/:id/evidence` | Actualizar evidencia | MIEMBRO_EQUIPO / ADMIN |
| PATCH | `/activities/:id` | Actualizar actividad | MIEMBRO_EQUIPO / ADMIN |
| DELETE | `/activities/:id` | Eliminar actividad | MIEMBRO_EQUIPO / ADMIN |

### Comentarios

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/activities/:id/comments` | Listar comentarios | Todos |
| POST | `/activities/:id/comments` | Agregar comentario | MIEMBRO_EQUIPO / ADMIN |

### Usuarios (Admin)

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/users` | Listar todos los usuarios | Todos autenticados |
| POST | `/users` | Invitar/crear usuario (contraseña temporal: planify2026) | ADMIN |
| DELETE | `/users/:id` | Eliminar miembro | ADMIN |
| PATCH | `/users/:id/role` | Cambiar rol de usuario | ADMIN |

### Health Check

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/health` | Verificar que el server está vivo | No |

---

## 8. Reglas de Negocio

### Estados de Actividad (flujo)
```
PENDIENTE → EN_PROCESO → EN_REVISION → COMPLETADA
```

### RN-04: Evidencia para completar
No se puede marcar una actividad como `COMPLETADA` si no tiene `evidenceUrl` registrado.

### Validaciones
- **Título**: obligatorio, no puede estar vacío
- **Prioridad**: solo ALTA, MEDIA, BAJA
- **Fecha límite**: no puede ser en el pasado (al crear)
- **Evidencia**: debe ser URL HTTP/HTTPS válida
- **Responsable**: debe ser un MIEMBRO_EQUIPO o ADMIN registrado
- **Registro**: siempre crea usuario como MIEMBRO_EQUIPO (nunca ADMIN)
- **Admin self-delete**: un ADMIN no puede eliminarse a sí mismo

---

## 9. Frontend — Páginas y Rutas

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/login` | LoginPage | Inicio de sesión |
| `/register` | RegisterPage | Registro de nuevos usuarios |
| `/dashboard` | DashboardPage | Panel de avance con estadísticas (SVG) |
| `/activities` | ActivitiesPage | Lista de actividades con filtros (responsable + prioridad) |
| `/kanban` | KanbanPage | Tablero Kanban con drag-and-drop |
| `/activities/:id` | ActivityDetailPage | Detalle de actividad con comentarios |
| `/team` | TeamPage | Gestión de miembros (admin) / ver miembros |
| `/settings` | SettingsPage | Tema oscuro, idioma (ES/EN), notificaciones |
| `/profile` | ProfilePage | Perfil del usuario autenticado |

### Contextos

| Contexto | Uso |
|----------|-----|
| `AuthContext` | `user`, `role`, `isAdmin`, `isObserver`, `canWrite`, `isTeamMember` |
| `SettingsContext` | Tema (light/dark), idioma (ES/EN), notificaciones. Persiste en `localStorage` key `planify_settings`. Los cambios solo se aplican al guardar. |

### Tema Oscuro
- Tailwind CSS 4 con `@custom-variant dark (&:where(.dark, .dark *));` en `index.css`
- La clase `dark` se aplica al `<html>` según SettingsContext
- Colores del Kanban: columnas usan tonos claros en light y oscuros en dark

### Navbar — Visibilidad por Rol
- **Admin**: ve todo (Equipo, Configuración, Workspace)
- **Miembro**: ve todo excepto sección de gestión de usuarios
- **Observador**: NO ve "Equipo", NO ve "Configuración", NO ve "Workspace"

---

## 10. Historias de Usuario — Estado

### Sprint 1 — Auth ✅

| HU | Descripción | Estado |
|----|-------------|--------|
| HU-01 | Login | ✅ POST /auth/login, LoginForm, JWT |
| HU-02 | Registro | ✅ POST /auth/register, RegisterForm |
| HU-17 | Logout | ✅ POST /auth/logout, blacklist |

### Sprint 2 — CRUD ✅

| HU | Descripción | Estado |
|----|-------------|--------|
| HU-03 | Crear actividad | ✅ POST /activities, ActivityFormModal |
| HU-04 | Editar actividad | ✅ PATCH /activities/:id |
| HU-05 | Eliminar actividad | ✅ DELETE /activities/:id, confirmación |
| HU-06 | Ver detalle de actividad | ✅ GET /activities/:id, ActivityDetailPage |
| HU-16 | Subtareas | ✅ Modelo Subtask, cascade delete |

### Sprint 3 — Kanban + Evidencia ✅

| HU | Descripción | Estado |
|----|-------------|--------|
| HU-07 | Cambiar estatus | ✅ PATCH /:id/status, drag-and-drop |
| HU-10 | Registrar evidencia | ✅ evidenceUrl, PATCH /:id/evidence |
| HU-11 | Vista tipo tablero Kanban | ✅ KanbanBoard, KanbanPage, 4 columnas |

### Sprint 4 — Features + Panel ✅

| HU | Descripción | Estado |
|----|-------------|--------|
| HU-09 | Agregar comentarios | ✅ POST/GET comments, UI en detalle |
| HU-12 | Panel de avance | ✅ GET /stats, DashboardPage con SVG |
| HU-14 | Modo observador (solo lectura) | ✅ Middleware, UI restrictions, Navbar |

### Sprint 5 — UI + Settings ✅

| HU | Descripción | Estado |
|----|-------------|--------|
| HU-13 | Página de Equipo | ✅ TeamPage, listar miembros |
| HU-18 | Configuración (tema/idioma) | ✅ SettingsPage, SettingsContext |
| HU-19 | Perfil de usuario | ✅ ProfilePage, cuenta editable |
| HU-20 | Dark mode | ✅ Tailwind v4 class-based, persistencia |
| HU-21 | Multi-idioma (ES/EN) | ✅ SettingsContext con traducciones |

### Sprint 6 — Admin + Deploy ✅

| HU | Descripción | Estado |
|----|-------------|--------|
| HU-15 | Filtrar actividades | ✅ Query params assigneeId/priority, dropdowns |
| HU-22 | Rol de Administrador | ✅ 3 roles, enforceAdmin, gestión completa |
| HU-23 | Invitar miembros | ✅ POST /users, modal en TeamPage |
| HU-24 | Cambiar rol de usuario | ✅ PATCH /users/:id/role, dropdown |
| HU-25 | Eliminar miembro | ✅ DELETE /users/:id, confirmación |
| — | Deploy producción | ✅ Netlify + Render + Supabase |

---

## 11. Testing

### Archivos de Test (14)

| Archivo | Cobertura | Tests |
|---------|-----------|-------|
| `activities.create.test.js` | Creación de actividades | — |
| `activities.update.test.js` | Actualización de campos | — |
| `activities.update-status.test.js` | Cambio de estado + RN-04 | — |
| `activities.update-evidence.test.js` | Actualización de evidencia | — |
| `activities.delete.test.js` | Eliminación de actividades | — |
| `activities.list.test.js` | Listado + filtros (assigneeId, priority) | 11 |
| `activities.stats.test.js` | Estadísticas y progreso | — |
| `activities.comments.test.js` | Crear y listar comentarios | — |
| `auth.login.test.js` | Login | — |
| `auth.register.test.js` | Registro | — |
| `auth.logout.test.js` | Logout + blacklist | — |
| `auth.me.test.js` | Datos del usuario | — |
| `users.admin.test.js` | CRUD de usuarios admin | 11 |
| `write-role.middleware.test.js` | Control de roles | — |

**Total: ~95 tests, 0 fallos**

### Comandos de Verificación
```bash
# Backend — tests
cd apps/backend && node --test

# Frontend — lint
cd apps/frontend && npx eslint src/

# Frontend — build
cd apps/frontend && npx vite build
```

---

## 12. Convenciones del Proyecto

### Commits (Husky + Commitlint)
```
tipo(alcance): descripción en minúsculas
```
- **Tipos**: feat, fix, docs, style, refactor, test, chore, ci
- **Alcances permitidos**: auth, activities, kanban, panel, comments, evidence, roles, ui, db, api, setup, deps, docs, ci

### Ramas
- `main` — producción (protegida, solo via PR)
- `develop` — desarrollo principal (protegida, solo via PR)
- `feat/*` — ramas de feature
- `fix/*` — ramas de corrección

### Nota sobre bcrypt
Se usa `bcryptjs` (puro JS) en lugar de `bcrypt` (nativo) para evitar problemas de compilación en CI/CD (Render). La API es idéntica.

### Nota sobre husky
El script `prepare: "husky"` fue eliminado del package.json raíz para evitar errores en CI/CD. Husky sigue funcionando localmente por la carpeta `.husky/`.

---

## 13. Variables de Entorno Requeridas

### Backend (.env)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=tu-secreto-jwt
FRONTEND_URL=http://localhost:5173   # Producción: https://planify-frontend.netlify.app
PORT=3001                            # Producción: 3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001   # Producción: https://planify-backend.onrender.com
VITE_APP_NAME=Planify                # No se usa en código, muerto
```

---

## 14. Comandos Útiles

```bash
# Instalar dependencias
npm install

# Levantar frontend (dev)
cd apps/frontend && npm run dev

# Levantar backend (dev)
cd apps/backend && npm run dev

# Base de datos
cd apps/backend && npm run db:studio     # Ver BD visualmente
cd apps/backend && npm run db:migrate    # Sincronizar esquemas (dev)
cd apps/backend && npm run db:deploy     # Aplicar migraciones (prod)

# Tests
cd apps/backend && node --test

# Lint
cd apps/frontend && npx eslint src/

# Build
cd apps/frontend && npx vite build

# Generar JWT_SECRET
openssl rand -base64 32
```

---

## 15. Incidencias Conocidas y Soluciones

| Incidencia | Solución |
|------------|----------|
| husky: `sh: 1: husky: not found` en CI/CD | Agregar `--ignore-scripts` a `npm install` o eliminar `prepare` del root package.json |
| bcrypt: `Cannot find module bcrypt_lib.node` | Reemplazar `bcrypt` por `bcryptjs` (puro JS, sin compilación nativa) |
| Prisma: `enum label "ADMIN" already exists` | Ejecutar `npx prisma migrate resolve --applied 20260802000000_add_admin_role` |
| Netlify: 404 al refrescar rutas SPA | Asegurar `netlify.toml` en la raíz del repo con `[[redirects]]` |
| Netlify: `unrecognized Git contributor` | Hacer el repo público o reconectar el repo en Netlify |
| Render: no encuentra `apps/backend` | No usar Root Directory, usar `cd apps/backend &&` en build/start commands |

---

## 16. Próximos Pasos / Backlog

- Tests de componentes React (frontend)
- Filtros en backend por status de actividad
- Paginación de actividades
- Notificaciones en tiempo real (Socket.io ya está como dependencia)
- Tests de integración E2E
- Docker Compose para desarrollo local con BD
