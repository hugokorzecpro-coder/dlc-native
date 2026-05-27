import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/auth'
import { SpaceProvider, useSpace } from './context/space'
import { useTheme } from './context/theme'
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute'
import { TabBar } from './components/TabBar'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { Stock } from './pages/Stock'
import { Scanner } from './pages/Scanner'
import { Alertes } from './pages/Alertes'
import { Reglages } from './pages/Reglages'
import { SpaceSelect } from './pages/SpaceSelect'
import { getProducts, statusFromDLC } from './lib/storage'
import './index.css'

const TAB_H = 58

function AppLayout() {
  const [alertCount, setAlertCount] = useState(0)
  const { space } = useSpace()

  useEffect(() => {
    getProducts(space?.id ?? null).then(products => {
      setAlertCount(products.filter(p => {
        const s = statusFromDLC(p.dlc)
        return s === 'j1' || s === 'expired'
      }).length)
    })
  }, [space?.id])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
      <div style={{ flexShrink: 0, height: `calc(${TAB_H}px + env(safe-area-inset-bottom, 16px))` }} />
      <div style={{
        position: 'fixed', bottom: 0,
        left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        zIndex: 100,
      }}>
        <TabBar alertCount={alertCount} />
      </div>
    </div>
  )
}

function SpaceGuard({ children }: { children: React.ReactNode }) {
  const { selected } = useSpace()
  if (!selected) return <SpaceSelect />
  return <>{children}</>
}

function AppWrapper({ children }: { children: React.ReactNode }) {
  const { c } = useTheme()
  return (
    <div style={{
      width: '100%', maxWidth: 430, height: '100%',
      margin: '0 auto', background: c.bg,
      position: 'relative', overflow: 'hidden',
    }}>
      {children}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SpaceProvider>
          <AppWrapper>
            <Routes>
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route element={
                <ProtectedRoute>
                  <SpaceGuard>
                    <AppLayout />
                  </SpaceGuard>
                </ProtectedRoute>
              }>
                <Route path="/" element={<Dashboard />} />
                <Route path="/stock" element={<Stock />} />
                <Route path="/scanner" element={<Scanner />} />
                <Route path="/alertes" element={<Alertes />} />
                <Route path="/reglages" element={<Reglages />} />
              </Route>
            </Routes>
          </AppWrapper>
        </SpaceProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
