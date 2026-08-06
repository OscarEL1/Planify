# CONTEXTO — Planify (Proyecto Universitario EAR)

**Materia:** EAR (Entorno de Aplicaciones Robustes)
**Repositorio:** https://github.com/OscarEL1/Planify
**Última actualización:** 2026-08-03

---

## 1. Descripción del Proyecto

Planify es un sistema web de administración de actividades escolares. Permite a un equipo de trabajo crear, asignar, gestionar y dar seguimiento a actividades académicas con roles diferenciados (miembro del equipo y observador).

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, react-router-dom v7 |
| **Backend** | Node.js (ES modules), Express, Prisma ORM |
| **Base de datos** | PostgreSQL (Supabase) |
| **Autenticación** | JWT (JSON Web Tokens) + blacklist en memoria |
| **Drag & Drop** | @hello-pangea/dnd |
| **Gráficos** | SVG propio (sin librería externa) |
| **Testing backend** | Node.js test runner (node:test) |
| **Monorepo** | npm workspaces |
| **CI/CD** | Husky + Commitlint (convencional commits) |
| **Deploy frontend** | Netlify |
| **Deploy backend** | Render |

---

## 3. Deploy — URLs de Producción

| Servicio | URL |
|----------|-----|
| **Frontend** | `https://planify-frontend.netlify.app` |
| **Backend** | `https://planify-backend.onrender.com` |

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
│   │   │   ├── pages/               # LoginPage, RegisterPage, DashboardPage, ActivitiesPage, KanbanPage, ActivityDetailPage
│   │   │   ├── hooks/               # useActivities (React Query)
│   │   │   ├── services/            # activityService, authService, api
│   │   │   ├── context/             # AuthContext
│   │   │   └── App.jsx              # Router principal
│   │   └── package.json
│   └── backend/                     # Express + Prisma
│       ├── src/
│       │   ├── controllers/         # activity, activity-stats, auth, comment, me, register, users
│       │   ├── middleware/          # authenticate-token, require-team-member
│       │   ├── routes/              # activity.routes, auth.routes, users.routes
│       │   ├── services/            # token-blacklist
│       │   ├── lib/                 # prisma (client singleton)
│       │   ├── app.js
│       │   └── index.js
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── test/                    # 13 archivos de test
│       └── package.json
├── netlify.toml                     # SPA redirect
├── package.json                     # workspaces config
└── CONTEXTO_PO_PLANIFY.md           # Este archivo
```

---

## 5. Modelo de Base de Datos (Prisma)

### Enums

| Enum | Valores |
|------|---------|
| **Role** | `MIEMBRO_EQUIPO`, `OBSERVADOR` |
| **TaskStatus** | `PENDIENTE`, `EN_PROCESO`, `EN_REVISION`, `COMPLETADA` |
| **Priority** | `ALTA`, `MEDIA`, `BAJA` |

### Modelos

| Modelo | Campos principales | Relaciones |
|--------|-------------------|------------|
| **User** | id, name, email, password, role | assignedTasks[], comments[] |
| **Task** | id, title, description, status, priority, dueDate, evidenceUrl, assigneeId | assignee (User), comments[] |
| **Comment** | id, text, taskId, userId | task (Task) — cascade delete, user (User) |

---

## 6. Roles y Permisos

| Rol | Leer | Crear | Editar | Eliminar | Cambiar estado |
|-----|------|-------|--------|----------|----------------|
| **MIEMBRO_EQUIPO** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **OBSERVADOR** | ✅ | ❌ | ❌ | ❌ | ❌ |

- El middleware `enforceWriteRole` bloquea POST, PATCH, DELETE para observadores

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
| POST | `/activities` | Crear actividad | MIEMBRO_EQUIPO |
| PATCH | `/activities/:id/status` | Cambiar estado (drag-and-drop) | MIEMBRO_EQUIPO |
| PATCH | `/activities/:id/evidence` | Actualizar evidencia | MIEMBRO_EQUIPO |
| PATCH | `/activities/:id` | Actualizar actividad | MIEMBRO_EQUIPO |
| DELETE | `/activities/:id` | Eliminar actividad | MIEMBRO_EQUIPO |

### Comentarios

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/activities/:id/comments` | Listar comentarios | Todos |
| POST | `/activities/:id/comments` | Agregar comentario | MIEMBRO_EQUIPO |

### Usuarios

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/users` | Listar todos los usuarios | Todos autenticados |

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
- **Responsable**: debe ser un MIEMBRO_EQUIPO registrado
- **Registro**: siempre crea usuario como MIEMBRO_EQUIPO

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

### Contexto de Autenticación
- `AuthContext` provee: `user`, `role`, `isObserver`, `isTeamMember`, `canWrite`

---

## 10. Historias de Usuario — ClickUp

### Sprint 1 — Autenticación ✅

| HU | Descripción | Estado |
|----|-------------|--------|
| HU-01 | Inicio de sesión | ✅ POST /auth/login, LoginForm, JWT |
| HU-16 | Registro de cuenta | ✅ POST /auth/register, RegisterForm |
| HU-17 | Dashboard con Navbar | ✅ GET /auth/me, ProtectedRoute, Navbar |
| HU-02 | Cierre de sesión | ✅ POST /auth/logout, blacklist |

### Sprint 2 — CRUD Actividades ✅

| HU | Descripción | Estado |
|----|-------------|--------|
| HU-03 | Crear actividad | ✅ POST /activities, ActivityFormModal |
| HU-08 | Definir prioridad | ✅ Campo priority, selector y badge |
| HU-06 | Asignar responsable | ✅ GET /users, selector de responsable |
| HU-04 | Editar actividad | ✅ PATCH /activities/:id |
| HU-13 | Fecha límite de entrega | ✅ Campo dueDate, date picker, estado vencido |

### Sprint 3 — Kanban + Evidencia ✅

| HU | Descripción | Estado |
|----|-------------|--------|
| HU-07 | Cambiar estatus de actividad | ✅ PATCH /:id/status, drag-and-drop |
| HU-10 | Registrar evidencia de entrega | ✅ evidenceUrl, PATCH /:id/evidence |
| HU-11 | Vista tipo tablero Kanban | ✅ KanbanBoard, KanbanPage, 4 columnas |

### Sprint 4 — Features + Panel ✅

| HU | Descripción | Estado |
|----|-------------|--------|
| HU-05 | Eliminar actividad | ✅ DELETE /:id, confirmación |
| HU-09 | Agregar comentarios | ✅ POST/GET comments, UI en detalle |
| HU-12 | Panel de avance del proyecto | ✅ GET /stats, DashboardPage con SVG |
| HU-14 | Acceso de Observador (solo lectura) | ✅ Middleware, UI restrictions, Navbar |

### Sprint 5 — QA + Filtros + Deploy ✅

| HU | Descripción | Estado |
|----|-------------|--------|
| HU-15 | Filtrar actividades por responsable o prioridad | ✅ Query params assigneeId/priority, dropdowns |

---

## 11. Testing

### Archivos de Test (13)

| Archivo | Cobertura |
|---------|-----------|
| `activities.create.test.js` | Creación de actividades |
| `activities.update.test.js` | Actualización de campos |
| `activities.update-status.test.js` | Cambio de estado + RN-04 |
| `activities.update-evidence.test.js` | Actualización de evidencia |
| `activities.delete.test.js` | Eliminación de actividades |
| `activities.list.test.js` | Listado + filtros (assigneeId, priority) |
| `activities.stats.test.js` | Estadísticas y progreso |
| `activities.comments.test.js` | Crear y listar comentarios |
| `auth.login.test.js` | Login |
| `auth.register.test.js` | Registro |
| `auth.logout.test.js` | Logout + blacklist |
| `auth.me.test.js` | Datos del usuario |
| `write-role.middleware.test.js` | Control de roles |

**Total: 84 tests, 0 fallos**

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
Se usa `bcryptjs` (puro JS) en lugar de `bcrypt` (nativo) para evitar problemas de compilación en CI/CD.

---

## 13. Variables de Entorno

### Backend (.env)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=tu-secreto-jwt
FRONTEND_URL=http://localhost:5173
PORT=3001
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
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
cd apps/backend && npm run db:studio
cd apps/backend && npm run db:migrate

# Tests
cd apps/backend && node --test

# Lint
cd apps/frontend && npx eslint src/

# Build
cd apps/frontend && npx vite build
```
