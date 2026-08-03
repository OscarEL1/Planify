import { useState, useMemo } from 'react';
import { Plus, Calendar, Link2, CircleUserRound, AlertTriangle, Filter, ChevronDown } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useActivitiesQuery, useUsersQuery } from '../hooks/useActivities';
import ActivityFormModal from '../components/activities/ActivityFormModal';
import { useAuth } from '../context/useAuth';

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

const statusStyles = {
  PENDIENTE: 'bg-[#F1F5F9] text-[#64748B]',
  EN_PROCESO: 'bg-[#EFF6FF] text-[#3B82F6]',
  EN_REVISION: 'bg-[#F5F3FF] text-[#8B5CF6]',
  COMPLETADA: 'bg-[#F0FDF4] text-[#22C55E]',
};

const statusLabels = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En proceso',
  EN_REVISION: 'En revisión',
  COMPLETADA: 'Completada',
};

const priorityStyles = {
  ALTA: 'bg-[#FEF2F2] text-[#EF4444]',
  MEDIA: 'bg-[#FFFBEB] text-[#F59E0B]',
  BAJA: 'bg-[#F0FDF4] text-[#22C55E]',
};

function isOverdue(dueDate, status) {
  if (!dueDate || status === 'COMPLETADA') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate) < today;
}

export default function ActivitiesPage() {
  const { data: activities, isLoading, isError } = useActivitiesQuery();
  const { data: users } = useUsersQuery();
  const [modalMode, setModalMode] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const { isObserver } = useAuth();
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);

  const filteredActivities = useMemo(() => {
    if (!activities) return [];
    return activities.filter((a) => {
      if (filterAssignee !== 'all' && a.assigneeId !== filterAssignee) return false;
      if (filterPriority !== 'all' && a.priority !== filterPriority) return false;
      return true;
    });
  }, [activities, filterAssignee, filterPriority]);

  const selectedAssigneeName = filterAssignee === 'all'
    ? 'Todos'
    : users?.find((u) => u.id === filterAssignee)?.name || 'Todos';

  const openCreate = () => {
    setSelectedActivity(null);
    setModalMode('create');
  };

  const openEdit = (activity) => {
    setSelectedActivity(activity);
    setModalMode('edit');
  };

  const closeModal = () => setModalMode(null);

  return (
    <div className="flex min-h-screen w-full bg-[#F9FAFB] dark:bg-[#111827] transition-colors">
      <Navbar />

      <main className="flex-1 px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#1D2433] dark:text-white mb-1">
              Actividades
            </h1>
            <p className="text-sm text-[#64748B] dark:text-[#9CA3AF]">
              Gestiona las actividades de tu equipo escolar.
            </p>
          </div>
          {!isObserver && (
        <button
         type="button"
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[13px] font-semibold px-4 py-2.5 rounded-lg transition"
          >
          <Plus size={16} />
          Nueva actividad
          </button>
      )}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-[#64748B] dark:text-[#9CA3AF]">
            <Filter size={16} />
            Filtrar por:
          </div>

          {/* Filtro Responsable */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setAssigneeDropdownOpen(!assigneeDropdownOpen); setPriorityDropdownOpen(false); }}
              className="flex items-center gap-2 bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-lg px-3 py-2 text-sm text-[#1D2433] dark:text-white hover:bg-[#F8F9FB] dark:hover:bg-[#374151] transition"
            >
              Responsable: {selectedAssigneeName}
              <ChevronDown size={14} className="text-[#A0AEC0]" />
            </button>
            {assigneeDropdownOpen && (
              <div className="absolute z-50 mt-1 w-56 bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-lg shadow-lg py-1">
                <button
                  type="button"
                  onClick={() => { setFilterAssignee('all'); setAssigneeDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F8F9FB] dark:hover:bg-[#374151] ${filterAssignee === 'all' ? 'bg-[#EEF2FF] dark:bg-[#312E81] text-[#4F46E5] dark:text-[#818CF8]' : 'text-[#1D2433] dark:text-white'}`}
                >
                  Todos
                </button>
                {users?.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => { setFilterAssignee(u.id); setAssigneeDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#F8F9FB] dark:hover:bg-[#374151] ${filterAssignee === u.id ? 'bg-[#EEF2FF] dark:bg-[#312E81] text-[#4F46E5] dark:text-[#818CF8]' : 'text-[#1D2433] dark:text-white'}`}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                      style={{ backgroundColor: getAvatarColor(u.name) }}
                    >
                      {getInitials(u.name)}
                    </div>
                    {u.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filtro Prioridad */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setPriorityDropdownOpen(!priorityDropdownOpen); setAssigneeDropdownOpen(false); }}
              className="flex items-center gap-2 bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-lg px-3 py-2 text-sm text-[#1D2433] dark:text-white hover:bg-[#F8F9FB] dark:hover:bg-[#374151] transition"
            >
              Prioridad: {filterPriority === 'all' ? 'Todas' : filterPriority === 'ALTA' ? 'Alta' : filterPriority === 'MEDIA' ? 'Media' : 'Baja'}
              <ChevronDown size={14} className="text-[#A0AEC0]" />
            </button>
            {priorityDropdownOpen && (
              <div className="absolute z-50 mt-1 w-40 bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-lg shadow-lg py-1">
                <button
                  type="button"
                  onClick={() => { setFilterPriority('all'); setPriorityDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F8F9FB] dark:hover:bg-[#374151] ${filterPriority === 'all' ? 'bg-[#EEF2FF] dark:bg-[#312E81] text-[#4F46E5] dark:text-[#818CF8]' : 'text-[#1D2433] dark:text-white'}`}
                >
                  Todas
                </button>
                {['ALTA', 'MEDIA', 'BAJA'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => { setFilterPriority(p); setPriorityDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F8F9FB] dark:hover:bg-[#374151] ${filterPriority === p ? 'bg-[#EEF2FF] dark:bg-[#312E81] text-[#4F46E5] dark:text-[#818CF8]' : 'text-[#1D2433] dark:text-white'}`}
                  >
                    {p === 'ALTA' ? 'Alta' : p === 'MEDIA' ? 'Media' : 'Baja'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-2xl p-8 text-center text-sm text-[#64748B] dark:text-[#9CA3AF]">
            Cargando actividades...
          </div>
        )}

        {isError && (
          <div className="bg-[#FEF2F2] border border-red-200 rounded-2xl p-8 text-center text-sm text-[#EF4444]">
            No se pudieron cargar las actividades. Verifica la conexión con el backend.
          </div>
        )}

        {!isLoading && !isError && activities?.length === 0 && (
          <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-2xl p-8 text-center text-sm text-[#64748B] dark:text-[#9CA3AF]">
            Aún no hay actividades. Crea la primera con el botón de arriba.
          </div>
        )}

        {!isLoading && !isError && activities?.length > 0 && filteredActivities.length === 0 && (
          <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-2xl p-8 text-center text-sm text-[#64748B] dark:text-[#9CA3AF]">
            No hay actividades que coincidan con los filtros seleccionados.
          </div>
        )}

        {!isLoading && !isError && filteredActivities.length > 0 && (
          <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-2xl divide-y divide-[#E4E7EC] dark:divide-[#374151]">
            {filteredActivities.map((activity) => (
              <button
                key={activity.id}
                onClick={() => { if (!isObserver) {openEdit(activity); } }}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#F8F9FB] dark:hover:bg-[#374151] transition"
              >
                <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1D2433] dark:text-white truncate">{activity.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[#64748B] dark:text-[#9CA3AF]">
                    {activity.assignee && (
                      <span className="flex items-center gap-1">
                        <CircleUserRound size={12} />
                        {activity.assignee.name}
                      </span>
                    )}
                    {activity.dueDate && (
                      <span className={`flex items-center gap-1 ${isOverdue(activity.dueDate, activity.status) ? 'text-[#EF4444] font-medium' : ''}`}>
                        {isOverdue(activity.dueDate, activity.status) ? (
                          <AlertTriangle size={12} />
                        ) : (
                          <Calendar size={12} />
                        )}
                        {new Date(activity.dueDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {isOverdue(activity.dueDate, activity.status) && ' (Vencida)'}
                      </span>
                    )}
                    {activity.evidenceUrl && (
                      <span className="flex items-center gap-1">
                        <Link2 size={12} />
                        Evidencia
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${priorityStyles[activity.priority]}`}>
                    {activity.priority}
                  </span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[activity.status]}`}>
                    {statusLabels[activity.status]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        <ActivityFormModal
          mode={modalMode || 'create'}
          initialData={selectedActivity}
          isOpen={!!modalMode}
          onClose={closeModal}
          onSuccess={closeModal}
        />
      </main>
    </div>
  );
}