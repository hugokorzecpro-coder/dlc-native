import { Building2, Mail, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/auth'
import { supabase } from '../lib/supabase'

export function Reglages() {
  const { user } = useAuth()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* Header sticky */}
      <div style={{
        flexShrink: 0,
        padding: 'max(env(safe-area-inset-top, 0px), 52px) 20px 16px',
        background: '#F2F2F7',
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', letterSpacing: -0.5, margin: 0 }}>Réglages</h1>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>

        <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderBottom: '1px solid #F9FAFB' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building2 size={18} color="#16A34A" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500, margin: 0 }}>Établissement</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.user_metadata?.establishment_name ?? '—'}
              </p>
            </div>
            <ChevronRight size={16} color="#D1D5DB" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Mail size={18} color="#3B82F6" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500, margin: 0 }}>Email</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: '#FEF2F2', color: '#EF4444', border: 'none', borderRadius: 18,
            padding: '16px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <LogOut size={18} />Se déconnecter
        </button>

      </div>
    </div>
  )
}
