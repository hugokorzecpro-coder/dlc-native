import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '../context/auth'

const URGENTS = [
  { id: 1, name: 'Filet de cabillaud', cat: 'Poissons', dlc: '15 mai', status: 'j1' },
  { id: 2, name: 'Entrecôte Black Angus', cat: 'Viandes', dlc: '15 mai', status: 'j1' },
]
const SOON = [
  { id: 3, name: 'Brie de Meaux AOP', cat: 'Fromages', dlc: '16 mai', status: 'j2' },
]

const SC: Record<string, { label: string; bg: string; color: string; dlcColor: string; msg: string; iconBg: string }> = {
  j1: { label: 'J-1', bg: '#FEE2E2', color: '#DC2626', dlcColor: '#EF4444', msg: 'Expire demain', iconBg: '#FEF2F2' },
  j2: { label: 'J-2', bg: '#FEF3C7', color: '#D97706', dlcColor: '#F59E0B', msg: 'Dans 2 jours', iconBg: '#FFFBEB' },
  ok: { label: 'OK', bg: '#DCFCE7', color: '#16A34A', dlcColor: '#16A34A', msg: 'OK', iconBg: '#F0FDF4' },
}

function ProductCard({ p, s }: { p: { id: number; name: string; cat: string; dlc: string; status: string }; s: typeof SC['j1'] }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: '#fff', borderRadius: 18,
      padding: '14px 16px', marginBottom: 10,
      boxShadow: '0 1px 4px rgba(0,0,0,.06)',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: s.iconBg, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ fontSize: 22 }}>📦</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>{p.cat}</p>
        <p style={{ fontSize: 11, fontWeight: 500, color: s.dlcColor, margin: '4px 0 0' }}>{s.msg} · {p.dlc}</p>
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 8, background: s.bg, color: s.color, flexShrink: 0 }}>{s.label}</span>
    </div>
  )
}

export function Dashboard() {
  const { user } = useAuth()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* Header sticky */}
      <div style={{
        flexShrink: 0,
        padding: 'max(env(safe-area-inset-top, 0px), 52px) 20px 16px',
        background: '#F2F2F7',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', letterSpacing: -0.5, margin: 0 }}>Bonjour</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: '3px 0 0' }}>{user?.email}</p>
        </div>
        <Link to="/alertes" style={{
          width: 42, height: 42, background: '#fff', borderRadius: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,.08)', position: 'relative',
          textDecoration: 'none', flexShrink: 0,
        }}>
          <Bell size={20} color="#374151" />
          <span style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: '50%', background: '#EF4444', border: '1.5px solid white' }} />
        </Link>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {[
            { n: 47, label: 'En stock', accent: '#16A34A' },
            { n: 6, label: 'Attention', accent: '#F59E0B' },
            { n: 2, label: 'Urgents', accent: '#EF4444' },
          ].map(({ n, label, accent }) => (
            <div key={label} style={{ flex: 1, background: '#fff', borderRadius: 18, padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <div style={{ width: 28, height: 4, borderRadius: 4, background: accent, marginBottom: 10 }} />
              <div style={{ fontSize: 26, fontWeight: 800, color: '#111827', lineHeight: 1, letterSpacing: -0.5 }}>{n}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Urgents */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Urgents</h2>
          <Link to="/stock" style={{ fontSize: 13, fontWeight: 600, color: '#16A34A', textDecoration: 'none' }}>Voir tout</Link>
        </div>
        {URGENTS.map(p => <ProductCard key={p.id} p={p} s={SC[p.status]} />)}

        {/* Bientôt */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0 12px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Bientôt</h2>
          <Link to="/stock" style={{ fontSize: 13, fontWeight: 600, color: '#16A34A', textDecoration: 'none' }}>Voir tout</Link>
        </div>
        {SOON.map(p => <ProductCard key={p.id} p={p} s={SC[p.status]} />)}

      </div>
    </div>
  )
}
