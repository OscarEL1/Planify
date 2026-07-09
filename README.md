# Planify - Sprint Six 🚀

Sistema web de administración de actividades escolares basado en un monorepo.

## 🛠 Requisitos Previos
- Node.js (v18+)
- PostgreSQL (Opcional si se usa la conexión a Supabase)
- Git

## 📦 Instalación
1. Clonar el repositorio: 
   ```bash
   git clone [https://github.com/OscarEL1/Planify.git](https://github.com/OscarEL1/Planify.git)
   ```
2. Instalar dependencias desde la raíz del proyecto: 
   ```bash
   npm install
   ```
3. Configurar variables de entorno: 
   Solicitar las credenciales al Product Owner y crear el archivo `.env` dentro de `apps/backend` basándose en el `.env.example` (si aplica).

## 🚀 Cómo levantar el entorno local

El proyecto está configurado como un monorepo usando npm workspaces. Puedes interactuar con los proyectos entrando a sus respectivas carpetas:

### Frontend (React + Vite + Tailwind v4)
```bash
cd apps/frontend
npm run dev
```
*Corre en http://localhost:5173*

### Backend (Node + Express + Prisma)
```bash
cd apps/backend
npm run dev
```
*Corre en http://localhost:3000*

## 🗄 Base de Datos (Prisma)
Para interactuar con la base de datos (Supabase), asegúrate de estar en la carpeta `apps/backend` y usa:
- **Ver la base de datos visualmente:** `npm run db:studio`
- **Sincronizar esquemas (si hay cambios en schema.prisma):** `npm run db:migrate`