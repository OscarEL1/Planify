import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LayoutPanelLeft,
  ListChecks,
  Settings,
  LogOut,
  MoreVertical,
  User,
} from 'lucide-react';
import { logout } from '../../services/authService';
import { useAuth } from '../../context/useAuth';
import { useTranslations } from '../../context/SettingsContext';

function getInitials(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslations();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const ROLE_LABELS = {
    ADMIN: t('admin'),
    MIEMBRO_EQUIPO: t('member'),
    OBSERVADOR: t('observer'),
  };

  const NAV_SECTIONS = [
    {
      title: t('principal'),
      links: [
        { to: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
        { to: '/kanban', label: t('kanban'), icon: LayoutPanelLeft },
        { to: '/activities', label: t('activities'), icon: ListChecks },
      ],
    },
    {
      title: t('workspace'),
      links: [
        { to: '/team', label: t('team'), icon: User },
        { to: '/settings', label: t('settings'), icon: Settings },
      ],
    },
  ];

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
    <aside className="relative w-[220px] h-screen sticky top-0 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col transition-colors">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-[#5B50D6] flex items-center justify-center flex-shrink-0">
          <LayoutPanelLeft size={18} className="text-white" />
        </div>
        <div>
          <p className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#1D2433] leading-tight">
            Planify
          </p>
          <p className="text-[10px] text-[#64748B] leading-tight">Gestor de Actividades</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-2.5 text-[10px] font-semibold uppercase tracking-wide text-[#A0AEC0]">
              {section.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {section.links.map((link) => {
                const isActive = location.pathname === link.to;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition ${
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
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => { setIsMenuOpen(false); navigate('/profile'); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <User size={16} />
              {t('profile')}
            </button>
            <button
              type="button"
              onClick={() => { setIsMenuOpen(false); navigate('/settings'); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Settings size={16} />
              {t('settings')}
            </button>
            <div className="border-t border-gray-100 mt-1">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} />
                {t('logout')}
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
          <div className="w-8 h-8 rounded-full bg-[#5B50D6] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">{getInitials(user?.name)}</span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">
              {ROLE_LABELS[user?.role] ?? t('member')}
            </p>
          </div>
          <MoreVertical size={16} className="text-gray-400 flex-shrink-0" />
        </button>
      </div>
    </aside>
  );
}
