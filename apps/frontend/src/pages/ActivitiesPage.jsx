import { useState } from 'react';
import { Plus } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import ActivityFormModal from '../components/activities/ActivityFormModal';

export default function ActivitiesPage() {
  const [modalMode, setModalMode] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const openCreate = () => {
    setSelectedActivity(null);
    setModalMode('create');
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedActivity(null);
  };

  return (
    <div
      className="flex min-h-screen w-full"
      style={{ backgroundColor: '#F9FAFB' }}
    >
      <Navbar />

      <main className="flex-1 px-8 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-['Plus_Jakarta_Sans'] mb-1 text-2xl font-bold text-[#1D2433]">
              Actividades
            </h1>

            <p className="text-sm text-[#64748B]">
              Gestiona las actividades de tu equipo escolar.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-[#4F46E5] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#4338CA]"
          >
            <Plus size={16} />
            Nueva actividad
          </button>
        </div>

        <div className="rounded-2xl border border-[#E4E7EC] bg-white p-8 text-center">
          <h2 className="mb-2 text-base font-semibold text-[#1D2433]">
            Crear actividad
          </h2>

          <p className="mb-5 text-sm text-[#64748B]">
            Registra una nueva actividad y asigna un responsable del equipo.
          </p>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-[#4F46E5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4338CA]"
          >
            <Plus size={16} />
            Crear actividad
          </button>
        </div>

        <ActivityFormModal
          mode={modalMode || 'create'}
          initialData={selectedActivity}
          isOpen={Boolean(modalMode)}
          onClose={closeModal}
          onSuccess={closeModal}
        />
      </main>
    </div>
  );
}