import { NavLink } from 'react-router-dom'
import { House, Package, ScanLine, Bell, Settings } from 'lucide-react'

const tabs = [
  { to: '/', icon: House, label: 'Accueil' },
  { to: '/stock', icon: Package, label: 'Stock' },
  { to: '/scanner', icon: ScanLine, label: 'Scanner', fab: true },
  { to: '/alertes', icon: Bell, label: 'Alertes' },
  { to: '/reglages', icon: Settings, label: 'Réglages' },
]

export function TabBar({ alertCount = 0 }: { alertCount?: number }) {
  return (
    <nav style={{
      display: 'flex', alignItems: 'flex-end',
      padding: '10px 8px',
      paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)',
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(0,0,0,.06)',
      flexShrink: 0,
    }}>
      {tabs.map(({ to, icon: Icon, label, fab }) => {
        if (fab) return (
          <NavLink key={to} to={to} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginTop: -20, textDecoration: 'none' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(22,163,74,.45)',
            }}>
              <Icon size={24} color="white" />
            </div>
            <span style={{ fontSize: 10, fontWeight: 500, color: '#9CA3AF' }}>{label}</span>
          </NavLink>
        )
        return (
          <NavLink key={to} to={to} end style={{ flex: 1, textDecoration: 'none' }}>
            {({ isActive }) => (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative' }}>
                <Icon size={22} color={isActive ? '#16A34A' : '#9CA3AF'} />
                <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 500, color: isActive ? '#16A34A' : '#9CA3AF' }}>{label}</span>
                {label === 'Alertes' && alertCount > 0 && (
                  <span style={{ position: 'absolute', top: -2, right: 14, width: 7, height: 7, borderRadius: '50%', background: '#EF4444', border: '1.5px solid white' }} />
                )}
              </div>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
