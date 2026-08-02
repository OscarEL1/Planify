import { User } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/useAuth';

const ROLE_LABELS = {
  MIEMBRO_EQUIPO: 'Miembro del equipo',
  OBSERVADOR: 'Observador',
};

const avatarColors = ['#4F46E5', '#0891B2', '#059669', '#D97706', '#DC2626', '#7C3AED', '#DB2777'];

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name) {
  if (!name) return avatarColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen w-full" style={{ backgroundColor: '#F9FAFB' }}>
      <Navbar />

      <main className="flex-1 px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
            <User size={20} className="text-[#4F46E5]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1D2433]">Mi perfil</h1>
            <p className="text-sm text-[#64748B]">Información de tu cuenta</p>
          </div>
        </div>

        <div className="bg-white border border-[#E4E7EC] rounded-2xl p-8 max-w-lg">
          <div className="flex items-center gap-4 mb-8">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: getAvatarColor(user?.name) }}
            >
              {getInitials(user?.name)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1D2433]">{user?.name}</h2>
              <span className="text-xs text-[#64748B]">
                {ROLE_LABELS[user?.role] || 'Miembro del equipo'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Nombre</label>
              <p className="text-sm text-[#1D2433] mt-1">{user?.name}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Email</label>
              <p className="text-sm text-[#1D2433] mt-1">{user?.email}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Rol</label>
              <p className="text-sm text-[#1D2433] mt-1">{ROLE_LABELS[user?.role] || 'Miembro del equipo'}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
