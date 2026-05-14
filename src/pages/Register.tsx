import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ScanLine, Building2, Mail, Lock, UserPlus, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { establishment_name: name } } })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) await supabase.from('establishments').insert({ id: data.user.id, name, email })
    navigate('/login')
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', background: '#fff',
      padding: '0 28px',
      paddingTop: 'max(env(safe-area-inset-top, 0px), 48px)',
      paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
      overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 22,
          background: 'linear-gradient(135deg, #16A34A, #4ADE80)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 32px rgba(22,163,74,.35)', marginBottom: 18,
        }}>
          <ScanLine size={36} color="white" />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: -0.5, margin: 0 }}>Créer un compte</h1>
        <p style={{ fontSize: 14, color: '#9CA3AF', marginTop: 6 }}>Un compte par établissement</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { label: "Nom de l'établissement", type: 'text', value: name, onChange: setName, placeholder: 'Le Bistrot Parisien', Icon: Building2 },
          { label: 'Email', type: 'email', value: email, onChange: setEmail, placeholder: 'contact@restaurant.fr', Icon: Mail },
          { label: 'Mot de passe', type: 'password', value: password, onChange: setPassword, placeholder: 'Min. 6 caractères', Icon: Lock },
        ].map(({ label, type, value, onChange, placeholder, Icon }) => (
          <div key={label}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>{label}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 14, padding: '15px 16px' }}>
              <Icon size={18} color="#9CA3AF" style={{ flexShrink: 0 }} />
              <input
                type={type} value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                required
                minLength={type === 'password' ? 6 : undefined}
                style={{ flex: 1, background: 'transparent', fontSize: 15, color: '#111827', outline: 'none', border: 'none', fontFamily: 'inherit' }}
              />
            </div>
          </div>
        ))}

        {error && <p style={{ fontSize: 13, color: '#EF4444', textAlign: 'center', margin: 0 }}>{error}</p>}

        <button type="submit" disabled={loading} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: '#16A34A', color: '#fff', border: 'none', borderRadius: 14,
          padding: '16px', fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
          marginTop: 8, cursor: 'pointer', boxShadow: '0 8px 20px rgba(22,163,74,.3)',
          opacity: loading ? 0.6 : 1,
        }}>
          {loading ? <Loader2 size={18} /> : <UserPlus size={18} />}
          Créer le compte
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 13, color: '#9CA3AF', marginTop: 24 }}>
        Déjà un compte ?{' '}
        <Link to="/login" style={{ color: '#16A34A', fontWeight: 600, textDecoration: 'none' }}>Se connecter</Link>
      </p>
    </div>
  )
}
