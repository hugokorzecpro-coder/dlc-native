import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/auth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #BBF7D0', borderTopColor: '#16A34A', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #BBF7D0', borderTopColor: '#16A34A', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}
