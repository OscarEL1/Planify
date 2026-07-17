import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { useCurrentUser } from '../hooks/useCurrentUser';

const pageTitles = {
  '/panel': 'Progreso del equipo',
  '/dashboard': 'Progreso del equipo',
  '/kanban': 'Tablero Kanban',
  '/activities': 'Actividades',
  '/team': 'Equipo',
  '/settings': 'Configuración',
};

export default function DashboardLayout() {
  const { user } = useCurrentUser();
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Planify';

  // Cada página puede registrar un botón/acción propio que aparece
  // en el Topbar (ej. "Nueva actividad" en /activities).
  const [headerAction, setHeaderAction] = useState(null);

  return (
    <div className="flex min-h-screen bg-[#F8F9FB] font-['Inter']">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} user={user} action={headerAction} />
        <main className="flex-1 p-8">
          <Outlet context={{ user, setHeaderAction }} />
        </main>
      </div>
    </div>
  );
}