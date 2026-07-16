import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LayoutPanelLeft,
  ListChecks,
  Users,
  Settings,
  LogOut,
} from 'lucide-react';
import { getUser, logout } from '../../services/authService';

// HU-17: sidebar de navegación del área autenticada (diseño Figma de Abraham)
function getInitials(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

const ROLE_LABELS = {
  MIEMBRO_EQUIPO: 'Integrante del equipo',
  OBSERVADOR: 'Observador',
};

const NAV_SECTIONS = [
  {
    title: 'Principal',
    links: [
      { to: '/dashboard', label: 'Panel de inicio', icon: LayoutDashboard },
      { to: '/kanban', label: 'Tablero Kanban', icon: LayoutPanelLeft },
      { to: '/activities', label: 'Actividades', icon: ListChecks },
    ],
  },
  {
    title: 'Espacio de trabajo',
    links: [
      { to: '/team', label: 'Equipo', icon: Users },
      { to: '/settings', label: 'Configuración', icon: Settings },
    ],
  },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-[220px] h-screen sticky top-0 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-[#5B50D6] flex items-center justify-center flex-shrink-0">
          <LayoutPanelLeft size={16} className="text-white" />
        </div>
        <div>
          <p className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#1D2433] leading-tight">
            Planify
          </p>
          <p className="text-[10px] text-[#64748B] leading-tight">Gestor de Actividades</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#A0AEC0]">
              {section.title}
            </p>
            <div className="flex flex-col gap-1">
              {section.links.map((link) => {
                const isActive = location.pathname === link.to;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition ${
                      isActive
                        ? 'bg-[#F0EEF8] text-[#5B50D6]'
                        : 'text-[#64748B] hover:bg-[#F8F9FB] hover:text-[#1D2433]'
                    }`}
                  >
                    <Icon size={16} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
            style={{ backgroundColor: '#5B50D6' }}
          >
            {getInitials(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-[#1D2433] truncate">
              {user?.name ?? 'Usuario'}
            </p>
            <p className="text-[11px] text-[#64748B] truncate">
              {ROLE_LABELS[user?.role] ?? 'Miembro'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="text-[#A0AEC0] hover:text-[#EF4444] transition flex-shrink-0"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
