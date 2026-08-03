import { useState } from 'react';
import { Loader2, Users, Search, Shield, Eye, BarChart3, UserPlus, X, ChevronDown, Trash2 } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useUsersQuery, useActivitiesQuery, useDeleteUserMutation, useInviteUserMutation, useUpdateUserRoleMutation } from '../hooks/useActivities';
import { useAuth } from '../context/useAuth';
import { useToast } from '../components/common/useToast';

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
  ADMIN: 'Administrador',
  MIEMBRO_EQUIPO: 'Miembro del equipo',
  OBSERVADOR: 'Observador',
};

const ROLE_STYLES = {
  ADMIN: { bg: '#FEF3C7', color: '#D97706', icon: Shield },
  MIEMBRO_EQUIPO: { bg: '#EEF2FF', color: '#4F46E5', icon: Shield },
  OBSERVADOR: { bg: '#F1F5F9', color: '#64748B', icon: Eye },
};

export default function TeamPage() {
  const [search, setSearch] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MIEMBRO_EQUIPO');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(null);
  const { data: users, isLoading, isError } = useUsersQuery();
  const { data: activities } = useActivitiesQuery();
  const { isAdmin, user: currentUser } = useAuth();
  const { showToast } = useToast();
  const deleteUserMutation = useDeleteUserMutation();
  const inviteUserMutation = useInviteUserMutation();
  const updateUserRoleMutation = useUpdateUserRoleMutation();

  const filtered = users?.filter(
    (u) => u.name?.toLowerCase().includes(search.toLowerCase())
      || u.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const admins = users?.filter((u) => u.role === 'ADMIN') || [];
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

  async function handleDeleteUser(userId, userName) {
    if (!window.confirm(`¿Eliminar a ${userName}? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteUserMutation.mutateAsync(userId);
      showToast('Usuario eliminado correctamente', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Error al eliminar usuario', 'error');
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      await updateUserRoleMutation.mutateAsync({ id: userId, role: newRole });
      showToast('Rol actualizado correctamente', 'success');
      setRoleDropdownOpen(null);
    } catch (error) {
      showToast(error.response?.data?.message || 'Error al actualizar rol', 'error');
    }
  }

  async function handleInvite(e) {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      showToast('Nombre y correo son obligatorios', 'error');
      return;
    }
    try {
      await inviteUserMutation.mutateAsync({ name: inviteName, email: inviteEmail, role: inviteRole });
      showToast('Usuario creado correctamente. Contraseña temporal: planify2026', 'success');
      setShowInviteModal(false);
      setInviteName('');
      setInviteEmail('');
      setInviteRole('MIEMBRO_EQUIPO');
    } catch (error) {
      showToast(error.response?.data?.message || 'Error al crear usuario', 'error');
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-[#F9FAFB] dark:bg-[#111827] transition-colors">
      <Navbar />

      <main className="flex-1 px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] dark:bg-[#312E81] flex items-center justify-center">
              <Users size={20} className="text-[#4F46E5] dark:text-[#818CF8]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1D2433] dark:text-white">Equipo</h1>
              <p className="text-sm text-[#64748B] dark:text-[#9CA3AF]">Miembros registrados en el proyecto</p>
            </div>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[13px] font-semibold px-4 py-2.5 rounded-lg transition"
            >
              <UserPlus size={16} />
              Invitar usuario
            </button>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#4F46E5]" />
          </div>
        )}

        {isError && (
          <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-2xl p-8 text-center">
            <p className="text-sm text-[#EF4444]">No se pudieron cargar los usuarios.</p>
          </div>
        )}

        {!isLoading && !isError && users && (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-[#4F46E5] dark:text-[#818CF8]" />
                  <span className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] uppercase">Total</span>
                </div>
                <p className="text-2xl font-bold text-[#1D2433] dark:text-white">{users.length}</p>
              </div>
              <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={16} className="text-[#D97706]" />
                  <span className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] uppercase">Admins</span>
                </div>
                <p className="text-2xl font-bold text-[#1D2433] dark:text-white">{admins.length}</p>
              </div>
              <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={16} className="text-[#4F46E5] dark:text-[#818CF8]" />
                  <span className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] uppercase">Miembros</span>
                </div>
                <p className="text-2xl font-bold text-[#1D2433] dark:text-white">{members.length}</p>
              </div>
              <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye size={16} className="text-[#64748B] dark:text-[#9CA3AF]" />
                  <span className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] uppercase">Observadores</span>
                </div>
                <p className="text-2xl font-bold text-[#1D2433] dark:text-white">{observers.length}</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0AEC0] dark:text-[#6B7280]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o email..."
                className="w-full bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#1D2433] dark:text-white placeholder-[#A0AEC0] dark:placeholder-[#6B7280] outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-colors"
              />
            </div>

            {/* Team grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered?.map((u) => {
                const roleStyle = ROLE_STYLES[u.role] || ROLE_STYLES.MIEMBRO_EQUIPO;
                const RoleIcon = roleStyle.icon;
                const stats = getStatsForUser(u.id);
                const isCurrentUser = u.id === currentUser?.id;
                return (
                  <div key={u.id} className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-2xl p-5 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 transition">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                          style={{ backgroundColor: getAvatarColor(u.name) }}
                        >
                          {getInitials(u.name)}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-[#1D2433] dark:text-white">{u.name}</h3>
                          <p className="text-xs text-[#64748B] dark:text-[#9CA3AF]">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isAdmin && !isCurrentUser && (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setRoleDropdownOpen(roleDropdownOpen === u.id ? null : u.id)}
                              className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full hover:opacity-80 transition cursor-pointer"
                              style={{ backgroundColor: roleStyle.bg, color: roleStyle.color }}
                            >
                              <RoleIcon size={12} />
                              {ROLE_LABELS[u.role] || u.role}
                              <ChevronDown size={10} />
                            </button>
                            {roleDropdownOpen === u.id && (
                              <div className="absolute z-50 right-0 mt-1 w-44 bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-lg shadow-lg py-1">
                                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                                  <button
                                    key={role}
                                    type="button"
                                    onClick={() => handleRoleChange(u.id, role)}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F8F9FB] dark:hover:bg-[#374151] ${u.role === role ? 'bg-[#EEF2FF] dark:bg-[#312E81] text-[#4F46E5] dark:text-[#818CF8]' : 'text-[#1D2433] dark:text-white'}`}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {!isAdmin && (
                          <span
                            className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: roleStyle.bg, color: roleStyle.color }}
                          >
                            <RoleIcon size={12} />
                            {ROLE_LABELS[u.role] || u.role}
                          </span>
                        )}
                        {isAdmin && !isCurrentUser && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1 text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#FEF2F2] dark:hover:bg-[#7F1D1D]/20 rounded transition"
                            title="Eliminar usuario"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {u.role === 'MIEMBRO_EQUIPO' && (
                      <div className="border-t border-[#F1F5F9] dark:border-[#374151] pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 size={14} className="text-[#64748B] dark:text-[#9CA3AF]" />
                          <span className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF]">Actividades asignadas</span>
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <p className="text-lg font-bold text-[#1D2433] dark:text-white">{stats.total}</p>
                            <p className="text-[10px] text-[#64748B] dark:text-[#9CA3AF]">Total</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-[#22C55E]">{stats.completed}</p>
                            <p className="text-[10px] text-[#64748B] dark:text-[#9CA3AF]">Completadas</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-[#3B82F6]">{stats.inProgress}</p>
                            <p className="text-[10px] text-[#64748B] dark:text-[#9CA3AF]">En progreso</p>
                          </div>
                        </div>
                        {stats.total > 0 && (
                          <div className="mt-2 w-full h-1.5 bg-[#E4E7EC] dark:bg-[#4B5563] rounded-full overflow-hidden">
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
              <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-2xl p-8 text-center text-sm text-[#64748B] dark:text-[#9CA3AF]">
                No se encontraron usuarios con "{search}".
              </div>
            )}
          </>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-[#1D2433] dark:text-white">Invitar usuario</h2>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="p-1 text-[#9CA3AF] hover:text-[#1D2433] dark:hover:text-white transition"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleInvite} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] mb-1">Nombre</label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Nombre completo"
                    className="w-full bg-[#F9FAFB] dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#374151] rounded-lg px-3 py-2 text-sm text-[#1D2433] dark:text-white placeholder-[#A0AEC0] dark:placeholder-[#6B7280] outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] mb-1">Correo</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full bg-[#F9FAFB] dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#374151] rounded-lg px-3 py-2 text-sm text-[#1D2433] dark:text-white placeholder-[#A0AEC0] dark:placeholder-[#6B7280] outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] mb-1">Rol</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-[#F9FAFB] dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#374151] rounded-lg px-3 py-2 text-sm text-[#1D2433] dark:text-white outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  >
                    <option value="MIEMBRO_EQUIPO">Miembro del equipo</option>
                    <option value="OBSERVADOR">Observador</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>

                <p className="text-xs text-[#64748B] dark:text-[#9CA3AF]">
                  La contraseña temporal será: <strong>planify2026</strong>
                </p>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-[#64748B] dark:text-[#9CA3AF] bg-[#F1F5F9] dark:bg-[#374151] rounded-lg hover:bg-[#E2E8F0] dark:hover:bg-[#4B5563] transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={inviteUserMutation.isPending}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-[#4F46E5] rounded-lg hover:bg-[#4338CA] transition disabled:opacity-50"
                  >
                    {inviteUserMutation.isPending ? 'Creando...' : 'Crear usuario'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
