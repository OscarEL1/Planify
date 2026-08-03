import { useState } from 'react';
import { Settings, Bell, Palette, Shield, Save, CheckCircle2, User, Mail, Lock } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/useAuth';
import { useSettings, useTranslations } from '../context/SettingsContext';

const SECTIONS = [
  { id: 'account', icon: Shield },
  { id: 'notifications', icon: Bell },
  { id: 'display', icon: Palette },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, language, notifications, setTheme, setLanguage, setNotifications } = useSettings();
  const { t } = useTranslations();
  const [activeSection, setActiveSection] = useState('account');
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  // Pending state — only applied on save
  const [pendingTheme, setPendingTheme] = useState(theme);
  const [pendingLanguage, setPendingLanguage] = useState(language);
  const [pendingNotifications, setPendingNotifications] = useState(notifications);

  const handleSave = () => {
    if (activeSection === 'account') {
      if (user) {
        const updatedUser = { ...user, name, email };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('planify-auth-changed'));
      }
    }
    if (activeSection === 'display') {
      setTheme(pendingTheme);
      setLanguage(pendingLanguage);
    }
    if (activeSection === 'notifications') {
      setNotifications(pendingNotifications);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sectionLabels = {
    account: t('account'),
    notifications: t('notifications'),
    display: t('appearance'),
  };

  const roleLabel = user?.role === 'OBSERVADOR' ? t('observer') : t('member');

  return (
    <div className="flex min-h-screen w-full bg-[#F9FAFB] dark:bg-[#111827] transition-colors">
      <Navbar />

      <main className="flex-1 px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] dark:bg-[#312E81] flex items-center justify-center">
            <Settings size={20} className="text-[#4F46E5] dark:text-[#818CF8]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1D2433] dark:text-white">{t('settings')}</h1>
            <p className="text-sm text-[#64748B] dark:text-[#9CA3AF]">
              {activeSection === 'account' && t('accountSettings')}
              {activeSection === 'notifications' && t('notificationSettings')}
              {activeSection === 'display' && t('appearanceSettings')}
            </p>
          </div>
        </div>

        <div className="flex gap-6 items-start">
          {/* Sidebar */}
          <div className="w-56 flex-shrink-0">
            <div className="bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-2xl overflow-hidden">
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
                        ? 'bg-[#EEF2FF] dark:bg-[#312E81] text-[#4F46E5] dark:text-[#818CF8] border-l-2 border-[#4F46E5] dark:border-[#818CF8]'
                        : 'text-[#64748B] dark:text-[#9CA3AF] hover:bg-[#F8F9FB] dark:hover:bg-[#374151] border-l-2 border-transparent'
                    }`}
                  >
                    <Icon size={16} />
                    {sectionLabels[s.id]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 bg-white dark:bg-[#1F2937] border border-[#E4E7EC] dark:border-[#374151] rounded-2xl p-6 transition-colors">

            {/* === ACCOUNT === */}
            {activeSection === 'account' && (
              <div>
                <h2 className="text-lg font-bold text-[#1D2433] dark:text-white mb-1">{t('account')}</h2>
                <p className="text-sm text-[#64748B] dark:text-[#9CA3AF] mb-6">{t('accountSettings')}</p>

                <div className="flex flex-col gap-5 max-w-md">
                  <div>
                    <label className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] uppercase tracking-wide">{t('name')}</label>
                    <div className="relative mt-1">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0AEC0]" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#F8F9FB] dark:bg-[#374151] border border-[#E4E7EC] dark:border-[#4B5563] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#1D2433] dark:text-white outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] uppercase tracking-wide">{t('email')}</label>
                    <div className="relative mt-1">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0AEC0]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#F8F9FB] dark:bg-[#374151] border border-[#E4E7EC] dark:border-[#4B5563] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#1D2433] dark:text-white outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] uppercase tracking-wide">{t('password')}</label>
                    <div className="relative mt-1">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0AEC0]" />
                      <input
                        type="password"
                        value="••••••••"
                        readOnly
                        className="w-full bg-[#F8F9FB] dark:bg-[#374151] border border-[#E4E7EC] dark:border-[#4B5563] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#1D2433] dark:text-white outline-none cursor-not-allowed opacity-70"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] uppercase tracking-wide">{t('role')}</label>
                    <div className="mt-1 w-full bg-[#F8F9FB] dark:bg-[#374151] border border-[#E4E7EC] dark:border-[#4B5563] rounded-lg px-4 py-2.5 text-sm text-[#1D2433] dark:text-white opacity-70">
                      {roleLabel}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* === NOTIFICATIONS === */}
            {activeSection === 'notifications' && (
              <div>
                <h2 className="text-lg font-bold text-[#1D2433] dark:text-white mb-1">{t('notifications')}</h2>
                <p className="text-sm text-[#64748B] dark:text-[#9CA3AF] mb-6">{t('notificationSettings')}</p>

                <div className="flex flex-col gap-4 max-w-md">
                  <ToggleRow
                    label={t('emailNotifications')}
                    description={t('emailNotificationsDesc')}
                    checked={pendingNotifications.email}
                    onChange={(v) => setPendingNotifications({ ...pendingNotifications, email: v })}
                  />
                  <ToggleRow
                    label={t('pushNotifications')}
                    description={t('pushNotificationsDesc')}
                    checked={pendingNotifications.push}
                    onChange={(v) => setPendingNotifications({ ...pendingNotifications, push: v })}
                  />
                  <div className="border-t border-[#F1F5F9] dark:border-[#374151] pt-4 mt-2">
                    <p className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] uppercase tracking-wide mb-3">{t('events')}</p>
                  </div>
                  <ToggleRow
                    label={t('newAssignments')}
                    description={t('newAssignmentsDesc')}
                    checked={pendingNotifications.assignments}
                    onChange={(v) => setPendingNotifications({ ...pendingNotifications, assignments: v })}
                  />
                  <ToggleRow
                    label={t('newComments')}
                    description={t('newCommentsDesc')}
                    checked={pendingNotifications.comments}
                    onChange={(v) => setPendingNotifications({ ...pendingNotifications, comments: v })}
                  />
                  <ToggleRow
                    label={t('deadlines')}
                    description={t('deadlinesDesc')}
                    checked={pendingNotifications.deadlines}
                    onChange={(v) => setPendingNotifications({ ...pendingNotifications, deadlines: v })}
                  />
                </div>
              </div>
            )}

            {/* === DISPLAY === */}
            {activeSection === 'display' && (
              <div>
                <h2 className="text-lg font-bold text-[#1D2433] dark:text-white mb-1">{t('appearance')}</h2>
                <p className="text-sm text-[#64748B] dark:text-[#9CA3AF] mb-6">{t('appearanceSettings')}</p>

                <div className="flex flex-col gap-6 max-w-md">
                  <div>
                    <label className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] uppercase tracking-wide mb-3 block">{t('theme')}</label>
                    <div className="flex gap-3">
                      {[
                        { id: 'light', label: t('light'), bg: '#F9FAFB', border: '#E4E7EC' },
                        { id: 'dark', label: t('dark'), bg: '#1F2937', border: '#374151' },
                      ].map((th) => (
                        <button
                          key={th.id}
                          type="button"
                          onClick={() => setPendingTheme(th.id)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition ${
                            pendingTheme === th.id
                              ? 'border-[#4F46E5] dark:border-[#818CF8] bg-[#EEF2FF] dark:bg-[#312E81]'
                              : 'border-[#E4E7EC] dark:border-[#4B5563] hover:border-[#A0AEC0] dark:hover:border-[#6B7280]'
                          }`}
                        >
                          <div
                            className="w-20 h-12 rounded-lg border"
                            style={{ backgroundColor: th.bg, borderColor: th.border }}
                          >
                            <div className="flex gap-1 p-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#A0AEC0]" />
                              <div className="w-1.5 h-1.5 rounded-full bg-[#A0AEC0]" />
                              <div className="w-1.5 h-1.5 rounded-full bg-[#A0AEC0]" />
                            </div>
                          </div>
                          <span className="text-xs font-medium text-[#1D2433] dark:text-white">{th.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#64748B] dark:text-[#9CA3AF] uppercase tracking-wide mb-2 block">{t('language')}</label>
                    <div className="flex gap-3">
                      {[
                        { id: 'es', label: 'Español', flag: '🇲🇽' },
                        { id: 'en', label: 'English', flag: '🇺🇸' },
                      ].map((lang) => (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => setPendingLanguage(lang.id)}
                          className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition ${
                            pendingLanguage === lang.id
                              ? 'border-[#4F46E5] dark:border-[#818CF8] bg-[#EEF2FF] dark:bg-[#312E81]'
                              : 'border-[#E4E7EC] dark:border-[#4B5563] hover:border-[#A0AEC0] dark:hover:border-[#6B7280]'
                          }`}
                        >
                          <span className="text-lg">{lang.flag}</span>
                          <span className="text-sm font-medium text-[#1D2433] dark:text-white">{lang.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save button */}
            <div className="border-t border-[#F1F5F9] dark:border-[#374151] mt-8 pt-5">
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#4F46E5] text-white text-sm font-medium rounded-lg hover:bg-[#4338CA] transition"
              >
                {saved ? (
                  <>
                    <CheckCircle2 size={16} />
                    {t('saved')}
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {t('save')}
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
        <p className="text-sm font-medium text-[#1D2433] dark:text-white">{label}</p>
        <p className="text-xs text-[#64748B] dark:text-[#9CA3AF]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-[#4F46E5]' : 'bg-[#E4E7EC] dark:bg-[#4B5563]'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`}
        />
      </button>
    </div>
  );
}
