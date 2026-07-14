import { ShieldCheck, LayoutPanelLeft, Users, TrendingUp, CircleCheck } from 'lucide-react';
import RegisterForm from '../components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full border-t-4 border-black flex flex-col lg:flex-row font-['Inter']">
      {/* PANEL IZQUIERDO */}
      <div className="w-full lg:w-[40%] bg-white flex flex-col justify-center px-8 sm:px-16 py-12">
        <div className="w-full max-w-sm mx-auto lg:mx-0">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#4F46E5] flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <p className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#1D2433] leading-tight">Planify</p>
              <p className="text-[11px] text-[#64748B] leading-tight">Gestor de Actividades Escolares para Equipos</p>
            </div>
          </div>

          <h1 className="font-['Plus_Jakarta_Sans'] text-[28px] leading-[1.15] font-bold text-[#1D2433] mb-2">
            Crea tu cuenta
          </h1>
          <p className="text-[#64748B] text-sm mb-6">Únete a tu equipo escolar en Planify</p>

          <RegisterForm />

          <p className="text-sm text-[#64748B] text-center mt-5">
            ¿Ya tienes una cuenta?{' '}
            <a href="/login" className="text-[#4F46E5] font-semibold hover:text-[#4338CA]">
              Iniciar sesión
            </a>
          </p>
        </div>
      </div>

      {/* PANEL DERECHO (idéntico al de LoginPage) */}
      <div className="hidden lg:flex relative w-[60%] overflow-hidden bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#0D9488]">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute -top-16 -left-16 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-20 left-1/3 w-8 h-8 bg-white/20 rounded-full" />
        <div className="absolute top-48 right-16 w-10 h-10 bg-white/20 rounded-full" />
        <div className="absolute top-10 right-1/4 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-[#0D9488]/30 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />
        <div className="absolute bottom-24 left-0 w-80 h-80 bg-[#7C3AED]/30 rounded-full blur-3xl -translate-x-1/3" />
        <div className="absolute top-1/3 left-10 w-56 h-56 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-16 left-1/2 w-6 h-6 bg-white/20 rounded-full" />
        <div className="absolute top-1/2 right-8 w-4 h-4 bg-white/25 rounded-full" />

        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12">
          <div className="w-full max-w-md bg-white/15 backdrop-blur-xl border border-white/25 rounded-2xl shadow-2xl shadow-black/20 p-5 mb-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                  <LayoutPanelLeft size={16} className="text-white" />
                </div>
                <div>
                  <p className="font-['Plus_Jakarta_Sans'] font-bold text-white text-[13px]">Feria de Ciencias 2025</p>
                  <p className="text-[11px] text-white/70">4 actividades · 5 integrantes</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded-full whitespace-nowrap">
                En marcha
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <ProgressRow label="Encuesta a la comunidad" percent={100} color="bg-[#22C55E]" />
              <ProgressRow label="Logística del evento" percent={65} color="bg-gradient-to-r from-[#3B82F6] to-[#0D9488]" />
              <ProgressRow label="Contacto con patrocinadores" percent={30} color="bg-gradient-to-r from-[#8B5CF6] to-[#EC4899]" />
            </div>
          </div>

          <h2 className="font-['Plus_Jakarta_Sans'] text-3xl xl:text-4xl font-extrabold text-white text-center mb-3">
            Organiza. Rastrea. Logra.
          </h2>
          <p className="text-indigo-100 text-center max-w-md mb-10 text-sm">
            Planify ayuda a los equipos escolares a mantenerse alineados en cada actividad, desde la planificación hasta la entrega.
          </p>

          <div className="flex gap-14">
            <FeatureIcon icon={<CircleCheck size={18} className="text-white" />} label="Seguimiento" />
            <FeatureIcon icon={<Users size={18} className="text-white" />} label="Colaboración" />
            <FeatureIcon icon={<TrendingUp size={18} className="text-white" />} label="Progreso" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressRow({ label, percent, color }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] text-white/80 mb-1">
        <span>{label}</span>
        <span className="font-semibold text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{percent}%</span>
      </div>
      <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function FeatureIcon({ icon, label }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">{icon}</div>
      <span className="text-[11px] text-indigo-100 font-medium">{label}</span>
    </div>
  );
}