import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/auth'
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute'
import { TabBar } from './components/TabBar'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { Stock } from './pages/Stock'
import { Scanner } from './pages/Scanner'
import { Alertes } from './pages/Alertes'
import { Reglages } from './pages/Reglages'
import './index.css'

const TAB_H = 58

function AppLayout() {
  const { pathname } = useLocation()
  const isScanner = pathname === '/scanner'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
      {!isScanner && (
        <>
          <div style={{ flexShrink: 0, height: `calc(${TAB_H}px + env(safe-area-inset-bottom, 16px))` }} />
          <div style={{
            position: 'fixed', bottom: 0,
            left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: 430,
            zIndex: 100,
          }}>
            <TabBar alertCount={2} />
          </div>
        </>
      )}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{
          width: '100%',
          maxWidth: 430,
          height: '100%',
          margin: '0 auto',
          background: '#F2F2F7',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/stock" element={<Stock />} />
              <Route path="/scanner" element={<Scanner />} />
              <Route path="/alertes" element={<Alertes />} />
              <Route path="/reglages" element={<Reglages />} />
            </Route>
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
