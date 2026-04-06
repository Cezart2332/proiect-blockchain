import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import AdminPage from './pages/AdminPage.tsx'
import CandidatesPage from './pages/CandidatesPage.tsx'
import DashboardPage from './pages/DashboardPage'
import VotePage from './pages/VotePage.tsx'
import './App.css'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/vote" element={<VotePage />} />
        <Route path="/candidates" element={<CandidatesPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
