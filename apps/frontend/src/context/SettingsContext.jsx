import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const SettingsContext = createContext(null);

const STORAGE_KEY = 'planify_settings';

const DEFAULTS = {
  theme: 'light',
  language: 'es',
  notifications: {
    email: true,
    push: false,
    assignments: true,
    comments: true,
    deadlines: true,
  },
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULTS };
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  const setTheme = (theme) => setSettings((s) => ({ ...s, theme }));
  const setLanguage = (language) => setSettings((s) => ({ ...s, language }));
  const setNotifications = (notifications) => setSettings((s) => ({ ...s, notifications }));

  const value = useMemo(() => ({
    ...settings,
    setTheme,
    setLanguage,
    setNotifications,
  }), [settings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

const translations = {
  es: {
    dashboard: 'Panel de inicio',
    kanban: 'Tablero Kanban',
    activities: 'Actividades',
    team: 'Equipo',
    settings: 'Configuración',
    profile: 'Mi perfil',
    logout: 'Cerrar sesión',
    workspace: 'Espacio de trabajo',
    principal: 'Principal',
    search: 'Buscar...',
    save: 'Guardar cambios',
    saved: 'Guardado',
    account: 'Cuenta',
    notifications: 'Notificaciones',
    appearance: 'Apariencia',
    name: 'Nombre',
    email: 'Email',
    password: 'Contraseña',
    role: 'Rol',
    member: 'Miembro del equipo',
    observer: 'Observador',
    theme: 'Tema',
    light: 'Claro',
    dark: 'Oscuro',
    language: 'Idioma',
    spanish: 'Español',
    english: 'English',
    total: 'Total',
    completed: 'Completadas',
    inProgress: 'En progreso',
    pending: 'Pendientes',
    recentActivities: 'Mis actividades recientes',
    seeAll: 'Ver todas',
    noActivities: 'No tienes actividades asignadas.',
    progress: 'Progreso general',
    teamMembers: 'Miembros',
    observers: 'Observadores',
    registeredMembers: 'Miembros registrados en el proyecto',
    searchByNameOrEmail: 'Buscar por nombre o email...',
    noUsersFound: 'No se encontraron usuarios con',
    assignedActivities: 'Actividades asignadas',
    myProfile: 'Información de tu cuenta y actividad',
    accountSettings: 'Gestiona la información de tu cuenta.',
    notificationSettings: 'Configura cómo recibes las alertas.',
    appearanceSettings: 'Personaliza la visualización de la app.',
    emailNotifications: 'Notificaciones por email',
    emailNotificationsDesc: 'Recibe resúmenes en tu correo',
    pushNotifications: 'Notificaciones push',
    pushNotificationsDesc: 'Alertas en el navegador',
    events: 'Eventos',
    newAssignments: 'Nuevas asignaciones',
    newAssignmentsDesc: 'Cuando te asignen una actividad',
    newComments: 'Nuevos comentarios',
    newCommentsDesc: 'Cuando comenten en tu actividad',
    deadlines: 'Fechas límite',
    deadlinesDesc: 'Recordatorios antes de la fecha',
    contactAdmin: 'Para cambiar tu información, contacta al administrador.',
  },
  en: {
    dashboard: 'Dashboard',
    kanban: 'Kanban Board',
    activities: 'Activities',
    team: 'Team',
    settings: 'Settings',
    profile: 'My Profile',
    logout: 'Log out',
    workspace: 'Workspace',
    principal: 'Main',
    search: 'Search...',
    save: 'Save changes',
    saved: 'Saved',
    account: 'Account',
    notifications: 'Notifications',
    appearance: 'Appearance',
    name: 'Name',
    email: 'Email',
    password: 'Password',
    role: 'Role',
    member: 'Team member',
    observer: 'Observer',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    language: 'Language',
    spanish: 'Español',
    english: 'English',
    total: 'Total',
    completed: 'Completed',
    inProgress: 'In progress',
    pending: 'Pending',
    recentActivities: 'My recent activities',
    seeAll: 'See all',
    noActivities: 'No activities assigned to you.',
    progress: 'Overall progress',
    teamMembers: 'Members',
    observers: 'Observers',
    registeredMembers: 'Team members registered in the project',
    searchByNameOrEmail: 'Search by name or email...',
    noUsersFound: 'No users found with',
    assignedActivities: 'Assigned activities',
    myProfile: 'Your account information and activity',
    accountSettings: 'Manage your account information.',
    notificationSettings: 'Configure how you receive alerts.',
    appearanceSettings: 'Customize the app display.',
    emailNotifications: 'Email notifications',
    emailNotificationsDesc: 'Receive summaries in your inbox',
    pushNotifications: 'Push notifications',
    pushNotificationsDesc: 'Browser alerts',
    events: 'Events',
    newAssignments: 'New assignments',
    newAssignmentsDesc: 'When an activity is assigned to you',
    newComments: 'New comments',
    newCommentsDesc: 'When someone comments on your activity',
    deadlines: 'Deadlines',
    deadlinesDesc: 'Reminders before the due date',
    contactAdmin: 'To change your information, contact the administrator.',
  },
};

export function useTranslations() {
  const { language } = useSettings();
  const t = (key) => translations[language]?.[key] || translations.es[key] || key;
  return { t, language };
}
