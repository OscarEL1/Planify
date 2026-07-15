import { Link, useNavigate } from 'react-router-dom';
import { getUser, logout } from '../../services/authService';

// HU-17: navegación principal del área autenticada
function getInitials(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

const NAV_LINKS = [
  { to: '/kanban', label: 'Tablero' },
  { to: '/activities', label: 'Actividades' },
  { to: '/panel', label: 'Panel' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-10 w-full bg-white border-b border-[#E4E7EC]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#1D2433]">
            Planify
          </span>

          <div className="hidden sm:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-[13px] font-medium text-[#64748B] hover:text-[#1D2433] transition"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[13px] font-medium text-[#1D2433] hidden sm:inline">
            {user?.name ?? 'Usuario'}
          </span>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
            style={{ backgroundColor: '#5B50D6' }}
          >
            {getInitials(user?.name)}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-[13px] font-medium text-[#64748B] hover:text-[#EF4444] transition"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  );
}
