import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../../services/authService';

// HU-01/HU-17: bloquea rutas privadas si no hay sesión activa
export default function ProtectedRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
