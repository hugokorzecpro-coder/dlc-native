import { AlertTriangle, Clock, Bell } from 'lucide-react'

const ALERTS = [
  { id: 1, name: 'Filet de cabillaud', msg: "Expire demain — à utiliser aujourd'hui", time: 'Il y a 2h', type: 'j1' },
  { id: 2, name: 'Entrecôte Black Angus', msg: "Expire demain — planifiez l'utilisation", time: 'Il y a 2h', type: 'j1' },
  { id: 3, name: 'Brie de Meaux AOP', msg: 'Expire dans 2 jours · 16 mai', time: 'Hier à 8h00', type: 'j2' },
  { id: 4, name: 'Crème fraîche', msg: 'Expire dans 5 jours · 19 mai', time: 'Il y a 3 jours', type: 'j5' },
]

const C: Record<string, { label: string; tagBg: string; tagColor: string; iconBg: string; borderColor: string; Icon: typeof AlertTriangle }> = {
  j1: { label: 'J-1', tagBg: '#FEE2E2', tagColor: '#DC2626', iconBg: '#FEF2F2', borderColor: '#EF4444', Icon: AlertTriangle },
  j2: { label: 'J-2', tagBg: '#FEF3C7', tagColor: '#D97706', iconBg: '#FFFBEB', borderColor: '#F59E0B', Icon: Clock },
  j5: { label: 'J-5', tagBg: '#DBEAFE', tagColor: '#2563EB', iconBg: '#EFF6FF', borderColor: '#60A5FA', Icon: Bell },
}

function AlertCard({ a }: { a: typeof ALERTS[0] }) {
  const c = C[a.type]
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: '#fff', borderRadius: 18,
      padding: '14px 16px', marginBottom: 10,
      boxShadow: '0 1px 4px rgba(0,0,0,.06)',
      borderLeft: `3px solid ${c.borderColor}`,
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <c.Icon size={18} color={c.tagColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</p>
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>{a.msg}</p>
        <p style={{ fontSize: 11, color: '#D1D5DB', margin: '4px 0 0' }}>{a.time}</p>
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 8, background: c.tagBg, color: c.tagColor, flexShrink: 0, alignSelf: 'flex-start' }}>{c.label}</span>
    </div>
  )
}

export function Alertes() {
  const today = ALERTS.filter(a => a.type === 'j1')
  const week = ALERTS.filter(a => a.type !== 'j1')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* Header sticky */}
      <div style={{
        flexShrink: 0,
        padding: 'max(env(safe-area-inset-top, 0px), 52px) 20px 16px',
        background: '#F2F2F7',
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', letterSpacing: -0.5, margin: '0 0 4px' }}>Alertes</h1>
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>8 non lues</p>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.2, margin: '4px 0 10px' }}>Aujourd'hui</p>
        {today.map(a => <AlertCard key={a.id} a={a} />)}

        <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.2, margin: '16px 0 10px' }}>Cette semaine</p>
        {week.map(a => <AlertCard key={a.id} a={a} />)}
      </div>

    </div>
  )
}
