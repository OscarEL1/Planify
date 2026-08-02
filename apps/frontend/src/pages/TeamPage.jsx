import { useState } from 'react';
import { Loader2, Users, Search, Shield, Eye, BarChart3 } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useUsersQuery, useActivitiesQuery } from '../hooks/useActivities';

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
  MIEMBRO_EQUIPO: { bg: '#EEF2FF', color: '#4F46E5', icon: Shield },
  OBSERVADOR: { bg: '#F1F5F9', color: '#64748B', icon: Eye },
};

export default function TeamPage() {
  const [search, setSearch] = useState('');
  const { data: users, isLoading, isError } = useUsersQuery();
  const { data: activities } = useActivitiesQuery();

  const filtered = users?.filter(
    (u) => u.name?.toLowerCase().includes(search.toLowerCase())
      || u.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const members = users?.filter((u) => u.role === 'MIEMBRO_EQUIPO') || [];
  const observers = users?.filter((u) => u.role === 'OBSERVADOR') || [];

  function getStatsForUser(userId) {
    if (!activities) return { total: 0, completed: 0, inProgress: 0 };
    const assigned = activities.filter((a) => a.assigneeId === userId);
    return {
      total: assigned.length,
      completed: assigned.filter((a) => a.status === 'COMPLETADA').length,
      inProgress: assigned.filter((a) => a.status === 'EN_PROCESO' || a.status === 'EN_REVISION').length,
    };
  }

  return (
    <div className="flex min-h-screen w-full" style={{ backgroundColor: '#F9FAFB' }}>
      <Navbar />

      <main className="flex-1 px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
              <Users size={20} className="text-[#4F46E5]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1D2433]">Equipo</h1>
              <p className="text-sm text-[#64748B]">Miembros registrados en el proyecto</p>
            </div>
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
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-[#E4E7EC] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-[#4F46E5]" />
                  <span className="text-xs font-semibold text-[#64748B] uppercase">Total</span>
                </div>
                <p className="text-2xl font-bold text-[#1D2433]">{users.length}</p>
              </div>
              <div className="bg-white border border-[#E4E7EC] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={16} className="text-[#4F46E5]" />
                  <span className="text-xs font-semibold text-[#64748B] uppercase">Miembros</span>
                </div>
                <p className="text-2xl font-bold text-[#1D2433]">{members.length}</p>
              </div>
              <div className="bg-white border border-[#E4E7EC] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye size={16} className="text-[#64748B]" />
                  <span className="text-xs font-semibold text-[#64748B] uppercase">Observadores</span>
                </div>
                <p className="text-2xl font-bold text-[#1D2433]">{observers.length}</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0AEC0]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o email..."
                className="w-full bg-white border border-[#E4E7EC] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#1D2433] placeholder-[#A0AEC0] outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              />
            </div>

            {/* Team grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered?.map((u) => {
                const roleStyle = ROLE_STYLES[u.role] || ROLE_STYLES.MIEMBRO_EQUIPO;
                const RoleIcon = roleStyle.icon;
                const stats = getStatsForUser(u.id);
                return (
                  <div key={u.id} className="bg-white border border-[#E4E7EC] rounded-2xl p-5 hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                          style={{ backgroundColor: getAvatarColor(u.name) }}
                        >
                          {getInitials(u.name)}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-[#1D2433]">{u.name}</h3>
                          <p className="text-xs text-[#64748B]">{u.email}</p>
                        </div>
                      </div>
                      <span
                        className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: roleStyle.bg, color: roleStyle.color }}
                      >
                        <RoleIcon size={12} />
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </div>

                    {u.role === 'MIEMBRO_EQUIPO' && (
                      <div className="border-t border-[#F1F5F9] pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 size={14} className="text-[#64748B]" />
                          <span className="text-xs font-semibold text-[#64748B]">Actividades asignadas</span>
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <p className="text-lg font-bold text-[#1D2433]">{stats.total}</p>
                            <p className="text-[10px] text-[#64748B]">Total</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-[#22C55E]">{stats.completed}</p>
                            <p className="text-[10px] text-[#64748B]">Completadas</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-[#3B82F6]">{stats.inProgress}</p>
                            <p className="text-[10px] text-[#64748B]">En progreso</p>
                          </div>
                        </div>
                        {stats.total > 0 && (
                          <div className="mt-2 w-full h-1.5 bg-[#E4E7EC] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#22C55E] rounded-full transition-all"
                              style={{ width: `${Math.round((stats.completed / stats.total) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filtered?.length === 0 && (
              <div className="bg-white border border-[#E4E7EC] rounded-2xl p-8 text-center text-sm text-[#64748B]">
                No se encontraron usuarios con "{search}".
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
