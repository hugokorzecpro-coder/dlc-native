import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ScanLine, Mail, Lock, LogIn, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', background: '#fff',
      padding: '0 28px',
      paddingTop: 'max(env(safe-area-inset-top, 0px), 60px)',
      paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 22,
          background: 'linear-gradient(135deg, #16A34A, #4ADE80)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 32px rgba(22,163,74,.35)', marginBottom: 18,
        }}>
          <ScanLine size={36} color="white" />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', letterSpacing: -0.5, margin: 0 }}>DLC Manager</h1>
        <p style={{ fontSize: 14, color: '#9CA3AF', marginTop: 6 }}>Gérez vos dates de consommation</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Email</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 14, padding: '15px 16px' }}>
            <Mail size={18} color="#9CA3AF" style={{ flexShrink: 0 }} />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="restaurant@exemple.fr" required
              style={{ flex: 1, background: 'transparent', fontSize: 15, color: '#111827', outline: 'none', border: 'none', fontFamily: 'inherit' }} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Mot de passe</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1.5px solid #16A34A', borderRadius: 14, padding: '15px 16px' }}>
            <Lock size={18} color="#9CA3AF" style={{ flexShrink: 0 }} />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••" required
              style={{ flex: 1, background: 'transparent', fontSize: 15, color: '#111827', outline: 'none', border: 'none', fontFamily: 'inherit' }} />
          </div>
        </div>

        {error && <p style={{ fontSize: 13, color: '#EF4444', textAlign: 'center', margin: 0 }}>{error}</p>}

        <button type="submit" disabled={loading} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: '#16A34A', color: '#fff', border: 'none', borderRadius: 14,
          padding: '16px', fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
          marginTop: 8, cursor: 'pointer', boxShadow: '0 8px 20px rgba(22,163,74,.3)',
          opacity: loading ? 0.6 : 1,
        }}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
          Se connecter
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 13, color: '#9CA3AF', marginTop: 24 }}>
        Pas de compte ?{' '}
        <Link to="/register" style={{ color: '#16A34A', fontWeight: 600, textDecoration: 'none' }}>Créer un établissement</Link>
      </p>
    </div>
  )
}
