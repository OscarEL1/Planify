import { useNavigate } from 'react-router-dom';
import { LayoutPanelLeft, ListChecks } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { getUser } from '../services/authService';

// HU-17: dashboard real que reemplaza al DashboardTemporal
export default function DashboardPage() {
  const navigate = useNavigate();
  const user = getUser();

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: '#F9FAFB' }}>
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#1D2433] mb-1">
          Bienvenido, {user?.name ?? 'usuario'}
        </h1>
        <p className="text-sm text-[#64748B] mb-8">
          Este es tu espacio de trabajo en Planify.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-[#E4E7EC] rounded-2xl p-6 flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
              <LayoutPanelLeft size={18} className="text-[#4F46E5]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#1D2433] mb-1">Tablero de actividades</h2>
              <p className="text-[13px] text-[#64748B]">
                Revisa el estado de las actividades del equipo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/kanban')}
              className="self-start bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[13px] font-semibold px-4 py-2 rounded-lg transition"
            >
              Ver tablero
            </button>
          </div>

          <div className="bg-white border border-[#E4E7EC] rounded-2xl p-6 flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] flex items-center justify-center">
              <ListChecks size={18} className="text-[#0D9488]" />
            </div>
            <div>
              <h2 className="font-semibold text-[#1D2433] mb-1">Actividades pendientes</h2>
              <p className="text-2xl font-bold text-[#1D2433]">0</p>
              <p className="text-[13px] text-[#64748B]">actividades pendientes</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
