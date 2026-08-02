import { useState } from 'react';
import { Settings, Bell, Palette, Shield, Save, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/layout/Navbar';

const SECTIONS = [
  { id: 'account', label: 'Cuenta', icon: Shield },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
  { id: 'display', label: 'Apariencia', icon: Palette },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('account');
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    assignments: true,
    comments: true,
    deadlines: true,
  });
  const [theme, setTheme] = useState('light');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
            <p className="text-sm text-[#64748B]">Ajustes generales de tu cuenta</p>
          </div>
        </div>

        <div className="flex gap-6 items-start">
          {/* Sidebar */}
          <div className="w-56 flex-shrink-0">
            <div className="bg-white border border-[#E4E7EC] rounded-2xl overflow-hidden">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const isActive = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveSection(s.id)}
                    className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition text-left ${
                      isActive
                        ? 'bg-[#EEF2FF] text-[#4F46E5] border-l-2 border-[#4F46E5]'
                        : 'text-[#64748B] hover:bg-[#F8F9FB] border-l-2 border-transparent'
                    }`}
                  >
                    <Icon size={16} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 bg-white border border-[#E4E7EC] rounded-2xl p-6">
            {activeSection === 'account' && (
              <div>
                <h2 className="text-lg font-bold text-[#1D2433] mb-1">Cuenta</h2>
                <p className="text-sm text-[#64748B] mb-6">Gestiona la información de tu cuenta.</p>

                <div className="flex flex-col gap-5 max-w-md">
                  <div>
                    <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Nombre</label>
                    <input
                      type="text"
                      readOnly
                      value="QA Tester"
                      className="mt-1 w-full bg-[#F8F9FB] border border-[#E4E7EC] rounded-lg px-4 py-2.5 text-sm text-[#1D2433] outline-none cursor-not-allowed opacity-70"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Email</label>
                    <input
                      type="email"
                      readOnly
                      value="qa@planify.com"
                      className="mt-1 w-full bg-[#F8F9FB] border border-[#E4E7EC] rounded-lg px-4 py-2.5 text-sm text-[#1D2433] outline-none cursor-not-allowed opacity-70"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Contraseña</label>
                    <input
                      type="password"
                      readOnly
                      value="password123"
                      className="mt-1 w-full bg-[#F8F9FB] border border-[#E4E7EC] rounded-lg px-4 py-2.5 text-sm text-[#1D2433] outline-none cursor-not-allowed opacity-70"
                    />
                  </div>
                  <p className="text-xs text-[#A0AEC0]">Para cambiar tu información, contacta al administrador.</p>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div>
                <h2 className="text-lg font-bold text-[#1D2433] mb-1">Notificaciones</h2>
                <p className="text-sm text-[#64748B] mb-6">Configura cómo recibes las alertas.</p>

                <div className="flex flex-col gap-4 max-w-md">
                  <ToggleRow
                    label="Notificaciones por email"
                    description="Recibe resúmenes en tu correo"
                    checked={notifications.email}
                    onChange={(v) => setNotifications({ ...notifications, email: v })}
                  />
                  <ToggleRow
                    label="Notificaciones push"
                    description="Alertas en el navegador"
                    checked={notifications.push}
                    onChange={(v) => setNotifications({ ...notifications, push: v })}
                  />
                  <div className="border-t border-[#F1F5F9] pt-4 mt-2">
                    <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">Eventos</p>
                  </div>
                  <ToggleRow
                    label="Nuevas asignaciones"
                    description="Cuando te asignen una actividad"
                    checked={notifications.assignments}
                    onChange={(v) => setNotifications({ ...notifications, assignments: v })}
                  />
                  <ToggleRow
                    label="Nuevos comentarios"
                    description="Cuando comenten en tu actividad"
                    checked={notifications.comments}
                    onChange={(v) => setNotifications({ ...notifications, comments: v })}
                  />
                  <ToggleRow
                    label="Fechas límite"
                    description="Recordatorios antes de la fecha"
                    checked={notifications.deadlines}
                    onChange={(v) => setNotifications({ ...notifications, deadlines: v })}
                  />
                </div>
              </div>
            )}

            {activeSection === 'display' && (
              <div>
                <h2 className="text-lg font-bold text-[#1D2433] mb-1">Apariencia</h2>
                <p className="text-sm text-[#64748B] mb-6">Personaliza la visualización de la app.</p>

                <div className="flex flex-col gap-5 max-w-md">
                  <div>
                    <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3 block">Tema</label>
                    <div className="flex gap-3">
                      {[
                        { id: 'light', label: 'Claro', color: '#F9FAFB', border: '#E4E7EC' },
                        { id: 'dark', label: 'Oscuro', color: '#1D2433', border: '#374151' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTheme(t.id)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition ${
                            theme === t.id
                              ? 'border-[#4F46E5] bg-[#EEF2FF]'
                              : 'border-[#E4E7EC] hover:border-[#A0AEC0]'
                          }`}
                        >
                          <div
                            className="w-16 h-10 rounded-lg border"
                            style={{ backgroundColor: t.color, borderColor: t.border }}
                          />
                          <span className="text-xs font-medium text-[#1D2433]">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2 block">Idioma</label>
                    <select className="w-full bg-[#F8F9FB] border border-[#E4E7EC] rounded-lg px-4 py-2.5 text-sm text-[#1D2433] outline-none focus:ring-2 focus:ring-[#4F46E5]">
                      <option value="es">Español</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Save button */}
            <div className="border-t border-[#F1F5F9] mt-8 pt-5">
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#4F46E5] text-white text-sm font-medium rounded-lg hover:bg-[#4338CA] transition"
              >
                {saved ? (
                  <>
                    <CheckCircle2 size={16} />
                    Guardado
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Guardar cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-[#1D2433]">{label}</p>
        <p className="text-xs text-[#64748B]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-[#4F46E5]' : 'bg-[#E4E7EC]'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`}
        />
      </button>
    </div>
  );
}
