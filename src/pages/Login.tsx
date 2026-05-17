import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ScanLine, Mail, Lock, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleGoogle() {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email ou mot de passe incorrect'); setLoading(false) }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#fff',
      paddingTop: 'max(env(safe-area-inset-top, 0px), 48px)',
      paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)',
      overflowY: 'auto',
    }}>

      {/* Top section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 48 }}>
          <div style={{
            width: 84, height: 84, borderRadius: 26,
            background: 'linear-gradient(145deg, #16A34A 0%, #22C55E 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 20px 50px rgba(22,163,74,.28)', marginBottom: 22,
          }}>
            <ScanLine size={40} color="white" />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#111827', letterSpacing: -1.2, margin: 0 }}>DLC Manager</h1>
          <p style={{ fontSize: 14, color: '#9CA3AF', margin: '8px 0 0', fontWeight: 500 }}>Gérez vos dates de consommation</p>
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16,
            padding: '16px 20px', fontSize: 15, fontWeight: 600, color: '#111827',
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 2px 12px rgba(0,0,0,.07)', marginBottom: 20,
            transition: 'box-shadow .15s', opacity: googleLoading ? 0.7 : 1,
          }}
        >
          {googleLoading ? <Loader2 size={20} style={{ animation: 'spin .7s linear infinite' }} /> : <GoogleIcon />}
          Continuer avec Google
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#F3F4F6' }} />
          <span style={{ fontSize: 12, color: '#C1C8D0', fontWeight: 600, letterSpacing: 0.5 }}>OU</span>
          <div style={{ flex: 1, height: 1, background: '#F3F4F6' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: '#F9FAFB', border: '1.5px solid #E5E7EB',
            borderRadius: 14, padding: '15px 16px',
          }}>
            <Mail size={18} color="#9CA3AF" style={{ flexShrink: 0 }} />
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@exemple.fr"
              required
              style={{ flex: 1, background: 'transparent', fontSize: 15, color: '#111827', outline: 'none', border: 'none', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: '#F9FAFB', border: '1.5px solid #E5E7EB',
            borderRadius: 14, padding: '15px 16px',
          }}>
            <Lock size={18} color="#9CA3AF" style={{ flexShrink: 0 }} />
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mot de passe"
              required
              style={{ flex: 1, background: 'transparent', fontSize: 15, color: '#111827', outline: 'none', border: 'none', fontFamily: 'inherit' }}
            />
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ fontSize: 13, color: '#DC2626', margin: 0, fontWeight: 500 }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#111827', color: '#fff', border: 'none', borderRadius: 14,
              padding: '16px', fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
              marginTop: 4, cursor: 'pointer',
              opacity: loading ? 0.6 : 1, transition: 'opacity .15s',
            }}
          >
            {loading
              ? <Loader2 size={18} style={{ animation: 'spin .7s linear infinite' }} />
              : 'Se connecter'
            }
          </button>
        </form>

      </div>

      {/* Footer */}
      <p style={{ textAlign: 'center', fontSize: 13, color: '#9CA3AF', padding: '0 28px 8px' }}>
        Pas de compte ?{' '}
        <Link to="/register" style={{ color: '#16A34A', fontWeight: 700, textDecoration: 'none' }}>Créer un compte</Link>
      </p>

    </div>
  )
}
