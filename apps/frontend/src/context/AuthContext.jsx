import { useEffect, useMemo, useState } from 'react';
import { getSessionUser } from '../services/authService';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSessionUser());

  useEffect(() => {
    const refreshSession = () => {
      setUser(getSessionUser());
    };

    window.addEventListener('storage', refreshSession);
    window.addEventListener('planify-auth-changed', refreshSession);

    return () => {
      window.removeEventListener('storage', refreshSession);
      window.removeEventListener('planify-auth-changed', refreshSession);
    };
  }, []);

  const value = useMemo(() => {
    const role = user?.role ?? null;

    return {
      user,
      role,
      isObserver: role === 'OBSERVADOR',
      isTeamMember: role === 'MIEMBRO_EQUIPO',
      canWrite: role === 'MIEMBRO_EQUIPO',
    };
  }, [user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}