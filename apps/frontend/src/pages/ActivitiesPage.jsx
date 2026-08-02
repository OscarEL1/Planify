import { useState } from 'react';
import { Plus, Calendar, Link2, CircleUserRound, AlertTriangle } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useActivitiesQuery } from '../hooks/useActivities';
import ActivityFormModal from '../components/activities/ActivityFormModal';
import { useAuth } from '../context/useAuth';

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
  const [modalMode, setModalMode] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const { isObserver } = useAuth();

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
    <div className="flex min-h-screen w-full" style={{ backgroundColor: '#F9FAFB' }}>
      <Navbar />

      <main className="flex-1 px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#1D2433] mb-1">
              Actividades
            </h1>
            <p className="text-sm text-[#64748B]">
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

        {isLoading && (
          <div className="bg-white border border-[#E4E7EC] rounded-2xl p-8 text-center text-sm text-[#64748B]">
            Cargando actividades...
          </div>
        )}

        {isError && (
          <div className="bg-[#FEF2F2] border border-red-200 rounded-2xl p-8 text-center text-sm text-[#EF4444]">
            No se pudieron cargar las actividades. Verifica la conexión con el backend.
          </div>
        )}

        {!isLoading && !isError && activities?.length === 0 && (
          <div className="bg-white border border-[#E4E7EC] rounded-2xl p-8 text-center text-sm text-[#64748B]">
            Aún no hay actividades. Crea la primera con el botón de arriba.
          </div>
        )}

        {!isLoading && !isError && activities?.length > 0 && (
          <div className="bg-white border border-[#E4E7EC] rounded-2xl divide-y divide-[#E4E7EC]">
            {activities.map((activity) => (
              <button
                key={activity.id}
                onClick={() => { if (!isObserver) {openEdit(activity); } }}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#F8F9FB] transition"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1D2433] truncate">{activity.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[#64748B]">
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