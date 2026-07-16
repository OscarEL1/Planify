import { useNavigate } from 'react-router-dom';
import { ListChecks, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { getUser } from '../services/authService';

// HU-17: dashboard real, layout sidebar + contenido
const STATS = [
  { label: 'Total actividades', value: 0, icon: ListChecks, bg: '#EEF2FF', color: '#4F46E5' },
  { label: 'Pendientes', value: 0, icon: Clock, bg: '#FEF3C7', color: '#D97706' },
  { label: 'En proceso', value: 0, icon: Loader2, bg: '#DBEAFE', color: '#2563EB' },
  { label: 'Completadas', value: 0, icon: CheckCircle2, bg: '#DCFCE7', color: '#16A34A' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = getUser();

  return (
    <div className="flex min-h-screen w-full" style={{ backgroundColor: '#F9FAFB' }}>
      <Navbar />

      <main className="flex-1 px-8 py-10">
        <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#1D2433] mb-1">
          Bienvenido, {user?.name ?? 'usuario'}
        </h1>
        <p className="text-sm text-[#64748B] mb-8">
          Este es tu espacio de trabajo en Planify.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STATS.map(({ label, value, icon: Icon, bg, color }) => (
            <div key={label} className="bg-white border border-[#E4E7EC] rounded-2xl p-5 flex flex-col gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: bg }}
              >
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1D2433]">{value}</p>
                <p className="text-[13px] text-[#64748B]">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => navigate('/kanban')}
          className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[13px] font-semibold px-4 py-2.5 rounded-lg transition"
        >
          Ir al tablero
        </button>
      </main>
    </div>
  );
}
