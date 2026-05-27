import { NavLink } from 'react-router-dom'
import { House, Package, Bell, Settings, ScanLine, LogOut, Shield } from 'lucide-react'
import { useAuth } from '../context/auth'
import { useTheme } from '../context/theme'
import { useSpace, SPACE_ICONS } from '../context/space'
import { supabase } from '../lib/supabase'

const NAV = [
  { to: '/',         icon: House,    label: 'Accueil',  end: true  },
  { to: '/stock',    icon: Package,  label: 'Stock',    end: false },
  { to: '/alertes',  icon: Bell,     label: 'Alertes',  end: false },
  { to: '/reglages', icon: Settings, label: 'Réglages', end: false },
]

export function Sidebar({ alertCount = 0 }: { alertCount?: number }) {
  const { user } = useAuth()
  const { c, dark } = useTheme()
  const { space, selected, clearSelection } = useSpace()
  const isAdmin = selected && space === null

  return (
    <aside style={{
      width: 240,
      flexShrink: 0,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: c.card,
      borderRight: `1px solid ${c.border}`,
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #16A34A, #22C55E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(22,163,74,.3)',
          }}>
            <ScanLine size={18} color="white" />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: c.text, margin: 0, letterSpacing: -0.3 }}>DLC Manager</p>
            <p style={{ fontSize: 11, color: c.textMuted, margin: 0, fontWeight: 500 }}>
              {user?.user_metadata?.establishment_name ?? ''}
            </p>
          </div>
        </div>
      </div>

      {/* Space badge */}
      <div style={{ padding: '0 14px 16px', flexShrink: 0 }}>
        <button
          onClick={clearSelection}
          title="Changer d'espace"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '8px 12px', borderRadius: 10,
            background: isAdmin ? '#EFF6FF' : '#F0FDF4',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            textAlign: 'left',
          }}
        >
          {isAdmin ? (
            <>
              <Shield size={14} color="#2563EB" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#2563EB' }}>Mode Admin</span>
            </>
          ) : space ? (
            <>
              <span style={{ fontSize: 14 }}>{SPACE_ICONS[space.type] || '🏢'}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A' }}>{space.name}</span>
            </>
          ) : null}
        </button>
      </div>

      <div style={{ height: 1, background: c.border, marginBottom: 8, flexShrink: 0 }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 12,
                background: isActive ? (dark ? '#1A2E1A' : '#F0FDF4') : 'transparent',
                transition: 'background .12s',
              }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Icon size={18} color={isActive ? '#16A34A' : c.textSub} />
                  {label === 'Alertes' && alertCount > 0 && (
                    <span style={{
                      position: 'absolute', top: -3, right: -4,
                      width: 7, height: 7, borderRadius: '50%',
                      background: '#EF4444', border: `1.5px solid ${c.card}`,
                    }} />
                  )}
                </div>
                <span style={{
                  fontSize: 14, fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#16A34A' : c.text,
                }}>
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 10px 20px', flexShrink: 0, borderTop: `1px solid ${c.border}` }}>
        <p style={{
          fontSize: 11, color: c.textMuted, margin: '0 0 10px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          padding: '0 4px',
        }}>
          {user?.email}
        </p>
        <button
          onClick={() => { clearSelection(); supabase.auth.signOut() }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '10px 14px', borderRadius: 12, border: 'none',
            background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <LogOut size={16} color="#EF4444" />
          <span style={{ fontSize: 14, fontWeight: 500, color: '#EF4444' }}>Se déconnecter</span>
        </button>
      </div>
    </aside>
  )
}
