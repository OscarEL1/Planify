import { User, BarChart3, CheckCircle2, Clock, ListChecks, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/useAuth';
import { useActivitiesQuery } from '../hooks/useActivities';

const ROLE_LABELS = {
  MIEMBRO_EQUIPO: 'Miembro del equipo',
  OBSERVADOR: 'Observador',
};

const ROLE_STYLES = {
  MIEMBRO_EQUIPO: { bg: '#EEF2FF', color: '#4F46E5' },
  OBSERVADOR: { bg: '#F1F5F9', color: '#64748B' },
};

const STATUS_LABELS = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En proceso',
  EN_REVISION: 'En revisión',
  COMPLETADA: 'Completada',
};

const STATUS_COLORS = {
  PENDIENTE: '#94A3B8',
  EN_PROCESO: '#3B82F6',
  EN_REVISION: '#8B5CF6',
  COMPLETADA: '#22C55E',
};

const PRIORITY_STYLES = {
  ALTA: { bg: '#FEF2F2', color: '#EF4444' },
  MEDIA: { bg: '#FFFBEB', color: '#F59E0B' },
  BAJA: { bg: '#F0FDF4', color: '#22C55E' },
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

function formatDate(dateStr) {
  if (!dateStr) return 'Sin fecha';
  return new Date(dateStr).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: activities } = useActivitiesQuery();

  const roleStyle = ROLE_STYLES[user?.role] || ROLE_STYLES.MIEMBRO_EQUIPO;

  const myActivities = activities?.filter((a) => a.assigneeId === user?.id) || [];
  const completed = myActivities.filter((a) => a.status === 'COMPLETADA').length;
  const inProgress = myActivities.filter((a) => a.status === 'EN_PROCESO' || a.status === 'EN_REVISION').length;
  const pending = myActivities.filter((a) => a.status === 'PENDIENTE').length;
  const recentActivities = myActivities.slice(0, 5);

  return (
    <div className="flex min-h-screen w-full bg-[#F9FAFB] dark:bg-[#111827] transition-colors">
      <Navbar />

      <main className="flex-1 px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] dark:bg-[#312E81] flex items-center justify-center">
            <User size={20} className="text-[#4F46E5] dark:text-[#818CF8]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1D2433] dark:text-white">Mi perfil</h1>
            <p className="text-sm text-[#64748B] dark:text-[#9CA3AF]">Información de tu cuenta y actividad</p>
          </div>
        </div>

        {/* Profile header */}
        <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-5">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
              style={{ backgroundColor: getAvatarColor(user?.name) }}
            >
              {getInitials(user?.name)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1D2433] dark:text-white">{user?.name}</h2>
              <p className="text-sm text-[#64748B] dark:text-[#9CA3AF] mb-2">{user?.email}</p>
              <span
                className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ backgroundColor: roleStyle.bg, color: roleStyle.color }}
              >
                {ROLE_LABELS[user?.role] || 'Miembro del equipo'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ListChecks size={16} className="text-[#4F46E5] dark:text-[#818CF8]" />
              <span className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF]">Total</span>
            </div>
            <p className="text-2xl font-bold text-[#1D2433] dark:text-white">{myActivities.length}</p>
          </div>
          <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={16} className="text-[#22C55E]" />
              <span className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF]">Completadas</span>
            </div>
            <p className="text-2xl font-bold text-[#22C55E]">{completed}</p>
          </div>
          <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-[#3B82F6]" />
              <span className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF]">En progreso</span>
            </div>
            <p className="text-2xl font-bold text-[#3B82F6]">{inProgress}</p>
          </div>
          <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={16} className="text-[#F59E0B]" />
              <span className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF]">Pendientes</span>
            </div>
            <p className="text-2xl font-bold text-[#F59E0B]">{pending}</p>
          </div>
        </div>

        {/* Progress bar */}
        {myActivities.length > 0 && (
          <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#1D2433] dark:text-white">Progreso general</h3>
              <span className="text-sm font-bold text-[#4F46E5] dark:text-[#818CF8]">
                {Math.round((completed / myActivities.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-3 bg-[#E4E7EC] dark:bg-[#4B5563] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4F46E5] rounded-full transition-all"
                style={{ width: `${(completed / myActivities.length) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-[#64748B] dark:text-[#9CA3AF]">
              <span>{completed} completadas</span>
              <span>{myActivities.length} total</span>
            </div>
          </div>
        )}

        {/* Recent activities */}
        <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#1D2433] dark:text-white">Mis actividades recientes</h3>
            <button
              type="button"
              onClick={() => navigate('/activities')}
              className="text-xs text-[#4F46E5] dark:text-[#818CF8] hover:underline"
            >
              Ver todas
            </button>
          </div>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-[#64748B] dark:text-[#9CA3AF]">No tienes actividades asignadas.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentActivities.map((a) => {
                const stColor = STATUS_COLORS[a.status] || '#94A3B8';
                const prStyle = PRIORITY_STYLES[a.priority] || PRIORITY_STYLES.MEDIA;
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F8F9FB] dark:hover:bg-[#374151] cursor-pointer transition"
                    onClick={() => navigate(`/activities/${a.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: stColor }} />
                      <div>
                        <p className="text-sm font-medium text-[#1D2433] dark:text-white">{a.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-[#64748B] dark:text-[#9CA3AF]">{STATUS_LABELS[a.status]}</span>
                          {a.dueDate && (
                            <>
                              <span className="text-[#A0AEC0] dark:text-[#6B7280]">·</span>
                              <span className="flex items-center gap-1 text-xs text-[#64748B] dark:text-[#9CA3AF]">
                                <Calendar size={10} />
                                {formatDate(a.dueDate)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: prStyle.bg, color: prStyle.color }}
                    >
                      {a.priority}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
