import { NavLink } from 'react-router-dom'
import { House, Package, Bell, Settings } from 'lucide-react'
import { useTheme } from '../context/theme'

const tabs = [
  { to: '/',         icon: House,    label: 'Accueil',  end: true  },
  { to: '/stock',    icon: Package,  label: 'Stock',    end: false },
  { to: '/alertes',  icon: Bell,     label: 'Alertes',  end: false },
  { to: '/reglages', icon: Settings, label: 'Réglages', end: false },
]

export function TabBar({ alertCount = 0 }: { alertCount?: number }) {
  const { c, dark } = useTheme()
  return (
    <nav style={{
      display: 'flex', alignItems: 'center',
      padding: '8px 8px',
      paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)',
      background: dark ? 'rgba(28,28,30,0.94)' : 'rgba(255,255,255,0.94)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: `1px solid ${c.border}`,
      flexShrink: 0,
    }}>
      {tabs.map(({ to, icon: Icon, label, end }) => (
        <NavLink key={to} to={to} end={end} style={{ flex: 1, textDecoration: 'none' }}>
          {({ isActive }) => (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 0', position: 'relative' }}>
              <Icon size={22} color={isActive ? '#16A34A' : c.textMuted} />
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 500, color: isActive ? '#16A34A' : c.textMuted }}>{label}</span>
              {label === 'Alertes' && alertCount > 0 && (
                <span style={{ position: 'absolute', top: 4, left: '50%', marginLeft: 4, width: 7, height: 7, borderRadius: '50%', background: '#EF4444', border: `1.5px solid ${c.card}` }} />
              )}
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
