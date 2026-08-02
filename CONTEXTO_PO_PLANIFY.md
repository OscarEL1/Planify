# CONTEXTO — Planify (Proyecto Universitario)

**Materia:** EAR (Entorno de Aplicaciones Robustes)
**Repositorio:** https://github.com/OscarEL1/Planify
**Última actualización:** 2026-08-02

---

## 1. Descripción del Proyecto

Planify es un sistema web de administración de actividades escolares. Permite a un equipo de trabajo crear, asignar, gestionar y dar seguimiento a actividades académicas con roles diferenciados (miembro del equipo y observador).

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, react-router-dom v7 |
| **Backend** | Node.js, Express, Prisma ORM |
| **Base de datos** | PostgreSQL (Supabase) |
| **Autenticación** | JWT (JSON Web Tokens) |
| **Drag & Drop** | @hello-pangea/dnd |
| **Gráficos** | SVG propio (sin librería externa) |
| **Validación** | Zod (frontend), validación manual (backend) |
| **Testing backend** | Node.js test runner (node:test) |
| **Monorepo** | npm workspaces |
| **CI/CD** | Husky + Commitlint (convencional commits) |

---

## 3. Estructura del Monorepo

```
Planify/
├── apps/
│   ├── frontend/          # React + Vite
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── activities/    # ActivityFormModal
│   │   │   │   ├── kanban/        # KanbanBoard, KanbanCard
│   │   │   │   ├── layout/        # Navbar
│   │   │   │   └── common/        # useToast
│   │   │   ├── pages/             # DashboardPage, KanbanPage, ActivitiesPage, LoginPage, ActivityDetailPage
│   │   │   ├── hooks/             # useActivities (React Query)
│   │   │   ├── services/          # activityService, authService, api
│   │   │   ├── context/           # AuthContext, useAuth
│   │   │   └── App.jsx            # Router principal
│   │   └── ...
│   └── backend/           # Express + Prisma
│       ├── src/
│       │   ├── controllers/       # activity, activity-stats, auth, comment, me
│       │   ├── middleware/        # authenticate-token, require-team-member
│       │   ├── routes/            # activity.routes, auth.routes
│       │   ├── services/          # token-blacklist
│       │   └── app.js
│       ├── prisma/
│       │   └── schema.prisma
│       ├── test/                  # 12 archivos de test
│       └── ...
└── package.json           # Configuración de workspaces
```

---

## 4. Modelo de Base de Datos (Prisma)

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
| **Task** | id, title, description, status, priority, dueDate, evidenceUrl, assigneeId | assignee (User), comments[], subtasks[] |
| **Subtask** | id, text, done, taskId | task (Task) — cascade delete |
| **Comment** | id, text, taskId, userId | task (Task) — cascade delete, user (User) |

---

## 5. Endpoints de la API

### Autenticación

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/auth/login` | Iniciar sesión, retorna JWT | No |
| POST | `/auth/register` | Registrar nuevo usuario | No |
| POST | `/auth/logout` | Cerrar sesión (revoca token) | Sí |
| GET | `/auth/me` | Obtener datos del usuario autenticado | Sí |

### Actividades

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/activities` | Listar todas las actividades | Todos |
| GET | `/activities/stats` | Estadísticas y progreso | Todos |
| GET | `/activities/:id` | Obtener actividad por ID | Todos |
| POST | `/activities` | Crear actividad | MIEMBRO_EQUIPO |
| PATCH | `/activities/:id` | Actualizar actividad | MIEMBRO_EQUIPO |
| PATCH | `/activities/:id/status` | Cambiar estado (drag-and-drop) | MIEMBRO_EQUIPO |
| PATCH | `/activities/:id/evidence` | Actualizar evidencia | MIEMBRO_EQUIPO |
| DELETE | `/activities/:id` | Eliminar actividad | MIEMBRO_EQUIPO |

### Comentarios

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/activities/:id/comments` | Listar comentarios | Todos |
| POST | `/activities/:id/comments` | Agregar comentario | MIEMBRO_EQUIPO |

---

## 6. Reglas de Negocio

### Roles y Permisos
- **MIEMBRO_EQUIPO**: puede crear, editar, eliminar actividades, cambiar estados, agregar comentarios y evidencia
- **OBSERVADOR**: solo puede **leer**. No puede modificar nada. El middleware `enforceWriteRole` bloquea POST, PATCH, DELETE

### Estados de Actividad (flujo)
```
PENDIENTE → EN_PROCESO → EN_REVISION → COMPLETADA
```

### Regla RN-04: Evidencia para completar
- No se puede marcar una actividad como `COMPLETADA` si no tiene `evidenceUrl` registrado
- El endpoint PATCH `/activities/:id/status` valida esto automáticamente

### Validaciones
- **Título**: obligatorio, no puede estar vacío
- **Prioridad**: solo ALTA, MEDIA, BAJA
- **Fecha límite**: no puede ser en el pasado (al crear)
- **Evidencia**: debe ser URL HTTP/HTTPS válida
- **Responsable**: debe ser un MIEMBRO_EQUIPO registrado

---

## 7. Frontend — Páginas y Componentes

### Páginas

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/login` | LoginPage | Inicio de sesión |
| `/dashboard` | DashboardPage | Panel de avance con estadísticas |
| `/activities` | ActivitiesPage | Lista de actividades (vista de tabla) |
| `/kanban` | KanbanPage | Tablero Kanban con drag-and-drop |
| `/activities/:id` | ActivityDetailPage | Detalle de actividad con comentarios |

### Componentes Principales

| Componente | Ubicación | Función |
|------------|-----------|---------|
| KanbanBoard | `components/kanban/` | Tablero con 4 columnas, drag-and-drop |
| ActivityFormModal | `components/activities/` | Modal para crear/editar actividades |
| Navbar | `components/layout/` | Barra de navegación lateral |
| useToast | `components/common/` | Sistema de notificaciones toast |

### Contexto de Autenticación
- `AuthContext` provee: `user`, `role`, `isObserver`, `isTeamMember`, `canWrite`
- `useAuth()` hook para acceder al contexto desde cualquier componente

---

## 8. Historias de Usuario — Estado de Implementación

### Sprint 3 — Kanban + Evidencia (22-27 jul) ✅ COMPLETO

| HU | Descripción | Estado |
|----|-------------|--------|
| HU-07 | Cambiar estatus de actividad | ✅ PATCH /:id/status, drag-and-drop, tests |
| HU-10 | Registrar evidencia de entrega | ✅ evidenceUrl, PATCH /:id/evidence, tests |
| HU-11 | Vista tipo tablero Kanban | ✅ KanbanBoard, KanbanPage, filtros |

### Sprint 4 — Features + Panel (28 jul-2 ago) ✅ COMPLETO

| HU | Descripción | Estado |
|----|-------------|--------|
| HU-05 | Eliminar actividad | ✅ DELETE /:id, confirmación, tests |
| HU-09 | Agregar comentarios | ✅ POST/GET comments, UI, tests |
| HU-12 | Panel de avance del proyecto | ✅ GET /stats, DashboardPage, tests |
| HU-14 | Acceso de Observador (solo lectura) | ✅ Middleware, UI restrictions, tests |

### Sprint 5 — Próximamente

| HU | Descripción | Estado |
|----|-------------|--------|
| TBD | Por definir | 🔲 Pendiente |

---

## 9. Testing

### Archivos de Test (12)

| Archivo | Cobertura |
|---------|-----------|
| `activities.create.test.js` | Creación de actividades |
| `activities.update.test.js` | Actualización de campos |
| `activities.update-status.test.js` | Cambio de estado + RN-04 |
| `activities.update-evidence.test.js` | Actualización de evidencia |
| `activities.delete.test.js` | Eliminación de actividades |
| `activities.stats.test.js` | Estadísticas y progreso |
| `activities.comments.test.js` | Crear y listar comentarios |
| `auth.login.test.js` | Login |
| `auth.register.test.js` | Registro |
| `auth.logout.test.js` | Logout |
| `auth.me.test.js` | Datos del usuario |
| `write-role.middleware.test.js` | Control de roles |

### Comandos de Verificación
```bash
# Backend — tests
cd apps/backend && node --test

# Frontend — lint
cd apps/frontend && npx eslint src/

# Frontend — build
cd apps/frontend && npx vite build
```

### Cobertura de Tests por HU

| HU | Tests |
|----|-------|
| HU-05 (Eliminar) | 5 tests |
| HU-07 (Cambiar estatus) | 6 tests |
| HU-09 (Comentarios) | 7 tests |
| HU-10 (Evidencia) | 7 tests |
| HU-12 (Estadísticas) | 6 tests |
| HU-14 (Observador) | 5 tests |
| Auth (login/register/logout/me) | 9 tests |
| **Total** | **73 tests, 0 fallos** |

---

## 10. Convenciones del Proyecto

### Commits (Husky + Commitlint)
```
tipo(alcance): descripción en minúsculas
```
- **Tipos**: feat, fix, docs, style, refactor, test, chore, ci
- **Alcances**: auth, activities, kanban, panel, comments, evidence, roles, ui, db, api, setup, deps, docs, ci

### Ramas
- `develop` — rama principal de desarrollo
- `feat/*` — ramas de feature
- `fix/*` — ramas de corrección

---

## 11. Endpoints Pendientes / No Implementados

| Endpoint | Estado | Notas |
|----------|--------|-------|
| `GET /activities` con filtro por status | ❌ | El backend retorna todas las actividades; el frontend filtra con `useMemo` |
| `GET /activities/:id/comments` desde frontend | ⚠️ | El endpoint existe pero el frontend carga comentarios via `getActivityById` |
| Tests en frontend | ❌ | No existen tests de componentes React |

---

## 12. Variables de Entorno Requeridas

```env
DATABASE_URL=postgresql://...
JWT_SECRET=tu-secreto-jwt
PORT=3000
```

---

## 13. Comandos Útiles

```bash
# Instalar dependencias
npm install

# Levantar frontend
cd apps/frontend && npm run dev

# Levantar backend
cd apps/backend && npm run dev

# Base de datos
cd apps/backend && npm run db:studio    # Ver BD visualmente
cd apps/backend && npm run db:migrate   # Sincronizar esquemas

# Tests
cd apps/backend && node --test

# Lint
cd apps/frontend && npx eslint src/

# Build
cd apps/frontend && npx vite build
```
