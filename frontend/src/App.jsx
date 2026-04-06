import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AuthPage from './pages/AuthPage'
import ChatPage from './pages/ChatPage'
import Dashboard from './pages/Dashboard'
import FaqPage from './pages/FaqPage'
import Sidebar from './components/Sidebar'

function AppShell() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-slate-200 border-t-srm-600 rounded-full animate-spin-slow mx-auto mb-4" style={{borderWidth:'3px'}} />
        <p className="text-slate-400 text-sm">Loading SRM Insider AI...</p>
      </div>
    </div>
  )

  if (!user) {
    if (location.pathname !== '/auth') return <Navigate to="/auth" replace />
    return <AuthPage />
  }

  if (location.pathname === '/auth') return <Navigate to="/chat" replace />

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col">
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<Dashboard />} />
          <Route path="/chat/:convId" element={<ChatPage />} />
          <Route path="/faqs" element={<FaqPage />} />
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/*" element={<AppShell />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
