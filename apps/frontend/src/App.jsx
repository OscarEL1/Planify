import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'

function DashboardTemporal() {
  return (
    <main style={{ padding: '40px' }}>
      <h1>Dashboard de Planify</h1>
      <p>El inicio de sesión fue exitoso.</p>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardTemporal />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App