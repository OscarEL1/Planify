import { Search, Bell } from 'lucide-react';
import { getInitials } from '../../hooks/useCurrentUser';

export default function Topbar({ title, user, action }) {
  return (
    <header className="h-16 bg-white border-b border-[#E4E7EC] flex items-center justify-between px-8 sticky top-0 z-10">
      <h1 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1D2433]">{title}</h1>

      <div className="flex items-center gap-3">
        {action}

        {/* 🔧 Aún sin funcionalidad — solo visual, como estaban antes */}
        <button
          aria-label="Buscar"
          className="w-9 h-9 rounded-lg border border-[#E4E7EC] flex items-center justify-center text-[#64748B] hover:bg-[#F8F9FB] transition"
        >
          <Search size={17} />
        </button>
        <button
          aria-label="Notificaciones"
          className="relative w-9 h-9 rounded-lg border border-[#E4E7EC] flex items-center justify-center text-[#64748B] hover:bg-[#F8F9FB] transition"
        >
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full" />
        </button>
        <div className="w-9 h-9 rounded-full bg-[#5B50D6] flex items-center justify-center text-white text-xs font-bold">
          {getInitials(user?.name)}
        </div>
      </div>
    </header>
  );
}