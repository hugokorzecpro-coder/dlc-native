import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ScanLine, Mail, Lock, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
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
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#09090D',
      backgroundImage: 'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(22,163,74,.22), transparent 65%)',
      padding: '48px 24px',
      overflowY: 'auto',
    }}>
      <div style={{ width: '100%', maxWidth: 396, animation: 'fadeIn .35s ease-out' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{
            width: 78, height: 78, borderRadius: 24,
            background: 'linear-gradient(145deg, #16A34A 0%, #22C55E 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 22px',
            boxShadow: '0 0 0 1px rgba(34,197,94,.25), 0 8px 32px rgba(22,163,74,.4), 0 0 80px rgba(22,163,74,.18)',
          }}>
            <ScanLine size={36} color="white" strokeWidth={2} />
          </div>
          <h1 style={{
            fontSize: 34, fontWeight: 800, color: '#fff',
            letterSpacing: -1.4, margin: '0 0 8px', lineHeight: 1.1,
          }}>
            DLC Manager
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.38)', margin: 0, fontWeight: 400 }}>
            Gérez vos dates de consommation
          </p>
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 11,
            background: 'rgba(255,255,255,.07)',
            border: '1px solid rgba(255,255,255,.11)',
            borderRadius: 14, padding: '15px 20px',
            fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.88)',
            cursor: 'pointer', fontFamily: 'inherit',
            marginBottom: 18, transition: 'background .15s',
            opacity: googleLoading ? 0.6 : 1,
          }}
        >
          {googleLoading
            ? <Loader2 size={18} style={{ animation: 'spin .7s linear infinite' }} />
            : <GoogleIcon />
          }
          Continuer avec Google
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,.22)', fontWeight: 700, letterSpacing: 2 }}>OU</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(255,255,255,.06)',
            border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 14, padding: '15px 18px',
            transition: 'border-color .15s',
          }}>
            <Mail size={16} color="rgba(255,255,255,.3)" style={{ flexShrink: 0 }} />
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="input-dark"
              style={{
                flex: 1, background: 'transparent', fontSize: 15,
                outline: 'none', border: 'none', fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(255,255,255,.06)',
            border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 14, padding: '15px 18px',
          }}>
            <Lock size={16} color="rgba(255,255,255,.3)" style={{ flexShrink: 0 }} />
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mot de passe"
              required
              className="input-dark"
              style={{
                flex: 1, background: 'transparent', fontSize: 15,
                outline: 'none', border: 'none', fontFamily: 'inherit',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,.12)',
              border: '1px solid rgba(239,68,68,.22)',
              borderRadius: 12, padding: '10px 14px',
            }}>
              <p style={{ fontSize: 13, color: '#FCA5A5', margin: 0, fontWeight: 500 }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: loading
                ? 'rgba(22,163,74,.45)'
                : 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)',
              color: '#fff', border: 'none', borderRadius: 14,
              padding: '16px', fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
              marginTop: 6, cursor: loading ? 'default' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 24px rgba(22,163,74,.4), 0 1px 0 rgba(255,255,255,.15) inset',
              transition: 'all .15s',
            }}
          >
            {loading
              ? <Loader2 size={18} style={{ animation: 'spin .7s linear infinite' }} />
              : 'Se connecter'
            }
          </button>
        </form>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,.32)', marginTop: 32 }}>
          Pas de compte ?{' '}
          <Link to="/register" style={{ color: '#4ADE80', fontWeight: 700, textDecoration: 'none' }}>
            Créer un compte
          </Link>
        </p>

      </div>
    </div>
  )
}
