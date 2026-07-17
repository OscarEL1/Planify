import { Plus, Filter, ChevronDown } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import KanbanBoard from '../components/kanban/KanbanBoard';
import { useActivitiesQuery, useUsersQuery } from '../hooks/useActivities';
import { useState, useMemo } from 'react';
import ActivityFormModal from '../components/activities/ActivityFormModal';

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

export default function KanbanPage() {
  const { data: activities } = useActivitiesQuery();
  const { data: users } = useUsersQuery();
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  const total = filteredActivities.length;
  const pending = filteredActivities.filter((a) => a.status === 'PENDIENTE').length;
  const inProgress = filteredActivities.filter((a) => a.status === 'EN_PROCESO').length;
  const inReview = filteredActivities.filter((a) => a.status === 'EN_REVISION').length;
  const completed = filteredActivities.filter((a) => a.status === 'COMPLETADA').length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const selectedAssigneeName = filterAssignee === 'all'
    ? 'Todos'
    : users?.find((u) => u.id === filterAssignee)?.name || 'Todos';

  return (
    <div className="flex min-h-screen w-full" style={{ backgroundColor: '#F9FAFB' }}>
      <Navbar />

      <main className="flex-1 px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#1D2433] mb-1">
              Tablero
            </h1>
            <p className="text-sm text-[#64748B]">
              Gestiona las actividades de tu equipo escolar.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[13px] font-semibold px-4 py-2.5 rounded-lg transition"
          >
            <Plus size={16} />
            Nueva actividad
          </button>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-[#64748B]">
            <Filter size={16} />
            Filtrar por:
          </div>

          {/* Filtro Responsable */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setAssigneeDropdownOpen(!assigneeDropdownOpen); setPriorityDropdownOpen(false); }}
              className="flex items-center gap-2 bg-white border border-[#E4E7EC] rounded-lg px-3 py-2 text-sm text-[#1D2433] hover:bg-[#F8F9FB] transition"
            >
              Responsable: {selectedAssigneeName}
              <ChevronDown size={14} className="text-[#A0AEC0]" />
            </button>
            {assigneeDropdownOpen && (
              <div className="absolute z-50 mt-1 w-56 bg-white border border-[#E4E7EC] rounded-lg shadow-lg py-1">
                <button
                  type="button"
                  onClick={() => { setFilterAssignee('all'); setAssigneeDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F8F9FB] ${filterAssignee === 'all' ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-[#1D2433]'}`}
                >
                  Todos
                </button>
                {users?.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => { setFilterAssignee(u.id); setAssigneeDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#F8F9FB] ${filterAssignee === u.id ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-[#1D2433]'}`}
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
              className="flex items-center gap-2 bg-white border border-[#E4E7EC] rounded-lg px-3 py-2 text-sm text-[#1D2433] hover:bg-[#F8F9FB] transition"
            >
              Prioridad: {filterPriority === 'all' ? 'Todas' : filterPriority === 'ALTA' ? 'Alta' : filterPriority === 'MEDIA' ? 'Media' : 'Baja'}
              <ChevronDown size={14} className="text-[#A0AEC0]" />
            </button>
            {priorityDropdownOpen && (
              <div className="absolute z-50 mt-1 w-40 bg-white border border-[#E4E7EC] rounded-lg shadow-lg py-1">
                <button
                  type="button"
                  onClick={() => { setFilterPriority('all'); setPriorityDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F8F9FB] ${filterPriority === 'all' ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-[#1D2433]'}`}
                >
                  Todas
                </button>
                {['ALTA', 'MEDIA', 'BAJA'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => { setFilterPriority(p); setPriorityDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F8F9FB] ${filterPriority === p ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-[#1D2433]'}`}
                  >
                    {p === 'ALTA' ? 'Alta' : p === 'MEDIA' ? 'Media' : 'Baja'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Indicadores */}
        <div className="flex items-center gap-6 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-[#64748B]">Total:</span>
            <span className="font-semibold text-[#1D2433]">{total}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#94A3B8]" />
            <span className="text-[#64748B]">Pendientes:</span>
            <span className="font-semibold text-[#1D2433]">{pending}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
            <span className="text-[#64748B]">En proceso:</span>
            <span className="font-semibold text-[#1D2433]">{inProgress}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
            <span className="text-[#64748B]">En revisión:</span>
            <span className="font-semibold text-[#1D2433]">{inReview}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
            <span className="text-[#64748B]">Completadas:</span>
            <span className="font-semibold text-[#1D2433]">{completed}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#64748B]">Avance:</span>
            <div className="w-24 h-2 bg-[#E4E7EC] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4F46E5] rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-semibold text-[#1D2433]">{progressPercent}%</span>
          </div>
        </div>

        <KanbanBoard activities={filteredActivities} />

        <ActivityFormModal
          mode="create"
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      </main>
    </div>
  );
}
