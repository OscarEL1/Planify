import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ActivitiesPage from './pages/ActivitiesPage.jsx'
import KanbanPage from './pages/KanbanPage.jsx'
import ActivityDetailPage from './pages/ActivityDetailPage.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/activities/:id" element={<ActivityDetailPage />} />
        <Route path="/kanban" element={<KanbanPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App