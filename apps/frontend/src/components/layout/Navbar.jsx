import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LayoutPanelLeft,
  ListChecks,
  Users,
  Settings,
  LogOut,
  MoreVertical,
  User,
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  return (
    <aside className="relative w-[220px] h-screen sticky top-0 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
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

      <div ref={menuRef} className="relative border-t border-gray-100 p-3">
        {isMenuOpen && (
          <div className="absolute bottom-16 left-4 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
            {/* Header con email */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            {/* Opciones */}
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <User size={16} />
              Mi perfil
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Settings size={16} />
              Configuración
            </button>
            <div className="border-t border-gray-100 mt-1">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 transition"
        >
          {/* Avatar con iniciales */}
          <div className="w-8 h-8 rounded-full bg-[#5B50D6] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">{getInitials(user?.name)}</span>
          </div>
          {/* Nombre y rol */}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">
              {ROLE_LABELS[user?.role] ?? 'Integrante del equipo'}
            </p>
          </div>
          {/* Ícono de tres puntos */}
          <MoreVertical size={16} className="text-gray-400 flex-shrink-0" />
        </button>
      </div>
    </aside>
  );
}
