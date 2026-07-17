import { Plus } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import KanbanBoard from '../components/kanban/KanbanBoard';
import { useActivitiesQuery } from '../hooks/useActivities';
import { useState } from 'react';
import ActivityFormModal from '../components/activities/ActivityFormModal';

export default function KanbanPage() {
  const { data: activities } = useActivitiesQuery();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const total = activities?.length || 0;
  const pending = activities?.filter((a) => a.status === 'PENDIENTE').length || 0;
  const inProgress = activities?.filter((a) => a.status === 'EN_PROCESO').length || 0;
  const inReview = activities?.filter((a) => a.status === 'EN_REVISION').length || 0;
  const completed = activities?.filter((a) => a.status === 'COMPLETADA').length || 0;

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
        </div>

        <KanbanBoard />

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
