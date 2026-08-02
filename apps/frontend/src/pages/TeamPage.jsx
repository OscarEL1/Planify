import { Loader2, Users } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useUsersQuery } from '../hooks/useActivities';

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

const ROLE_LABELS = {
  MIEMBRO_EQUIPO: 'Miembro del equipo',
  OBSERVADOR: 'Observador',
};

const ROLE_STYLES = {
  MIEMBRO_EQUIPO: { bg: '#EEF2FF', color: '#4F46E5' },
  OBSERVADOR: { bg: '#F1F5F9', color: '#64748B' },
};

export default function TeamPage() {
  const { data: users, isLoading, isError } = useUsersQuery();

  return (
    <div className="flex min-h-screen w-full" style={{ backgroundColor: '#F9FAFB' }}>
      <Navbar />

      <main className="flex-1 px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
            <Users size={20} className="text-[#4F46E5]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1D2433]">Equipo</h1>
            <p className="text-sm text-[#64748B]">Miembros registrados en el proyecto</p>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#4F46E5]" />
          </div>
        )}

        {isError && (
          <div className="bg-white border border-[#E4E7EC] rounded-2xl p-8 text-center">
            <p className="text-sm text-[#EF4444]">No se pudieron cargar los usuarios.</p>
          </div>
        )}

        {!isLoading && !isError && users && (
          <div className="bg-white border border-[#E4E7EC] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E4E7EC] bg-[#F8F9FB]">
                  <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide px-6 py-3">Usuario</th>
                  <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide px-6 py-3">Email</th>
                  <th className="text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide px-6 py-3">Rol</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const roleStyle = ROLE_STYLES[u.role] || ROLE_STYLES.MIEMBRO_EQUIPO;
                  return (
                    <tr key={u.id} className="border-b border-[#F1F5F9] last:border-b-0 hover:bg-[#F8F9FB] transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: getAvatarColor(u.name) }}
                          >
                            {getInitials(u.name)}
                          </div>
                          <span className="text-sm font-medium text-[#1D2433]">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-[#64748B]">{u.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="text-xs font-medium px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: roleStyle.bg, color: roleStyle.color }}
                        >
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-[#64748B]">
                No hay usuarios registrados.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
