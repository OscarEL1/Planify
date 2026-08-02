import { Settings } from 'lucide-react';
import Navbar from '../components/layout/Navbar';

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen w-full" style={{ backgroundColor: '#F9FAFB' }}>
      <Navbar />

      <main className="flex-1 px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center">
            <Settings size={20} className="text-[#4F46E5]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1D2433]">Configuración</h1>
            <p className="text-sm text-[#64748B]">Ajustes generales del proyecto</p>
          </div>
        </div>

        <div className="bg-white border border-[#E4E7EC] rounded-2xl p-8">
          <p className="text-sm text-[#64748B]">
            Sección de configuración en desarrollo.
          </p>
        </div>
      </main>
    </div>
  );
}
