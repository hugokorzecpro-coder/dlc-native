import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/auth'

function SplashScreen() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', background: '#fff', gap: 0,
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 22, background: '#16A34A',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16, boxShadow: '0 8px 32px rgba(22,163,74,.25)',
      }}>
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
          <path d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 4px', letterSpacing: -0.5 }}>DLC Manager</p>
      <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 40px' }}>Gestion des dates de péremption</p>

      {/* Progress bar */}
      <div style={{ width: 160, height: 3, background: '#E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: '#16A34A', borderRadius: 8,
          animation: 'progress 1.4s ease-in-out infinite',
        }} />
      </div>

      <style>{`
        @keyframes progress {
          0%   { width: 0%;   margin-left: 0%; }
          50%  { width: 70%;  margin-left: 15%; }
          100% { width: 0%;   margin-left: 100%; }
        }
      `}</style>
    </div>
  )
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <SplashScreen />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <SplashScreen />
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}
