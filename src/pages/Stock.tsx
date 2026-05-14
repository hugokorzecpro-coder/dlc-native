import { useState } from 'react'
import { Search } from 'lucide-react'

const PRODUCTS = [
  { id: 1, name: 'Filet de cabillaud', cat: 'Poissons', dlc: '15 mai 2026', qty: '3 kg', status: 'j1' },
  { id: 2, name: 'Entrecôte Black Angus', cat: 'Viandes', dlc: '15 mai 2026', qty: '5 pcs', status: 'j1' },
  { id: 3, name: 'Brie de Meaux AOP', cat: 'Fromages', dlc: '16 mai 2026', qty: '1 pièce', status: 'j2' },
  { id: 4, name: 'Crème fraîche', cat: 'Laitiers', dlc: '18 mai 2026', qty: '2 unités', status: 'j2' },
  { id: 5, name: 'Mesclun bio', cat: 'Légumes', dlc: '22 mai 2026', qty: '500g', status: 'ok' },
  { id: 6, name: 'Beurre demi-sel', cat: 'Laitiers', dlc: '30 mai 2026', qty: '3 plaques', status: 'ok' },
]

const SC: Record<string, { label: string; bg: string; color: string; dlcColor: string }> = {
  j1: { label: 'J-1', bg: '#FEE2E2', color: '#DC2626', dlcColor: '#EF4444' },
  j2: { label: 'J-2', bg: '#FEF3C7', color: '#D97706', dlcColor: '#F59E0B' },
  ok: { label: 'OK', bg: '#DCFCE7', color: '#16A34A', dlcColor: '#16A34A' },
}

const FILTERS = [
  { key: 'all', label: 'Tous · 47' },
  { key: 'ok', label: 'OK · 39' },
  { key: 'j2', label: 'Attention · 6' },
  { key: 'j1', label: 'Urgent · 2' },
]

export function Stock() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const visible = PRODUCTS.filter(p =>
    (filter === 'all' || p.status === filter) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* Header sticky */}
      <div style={{
        flexShrink: 0,
        padding: 'max(env(safe-area-inset-top, 0px), 52px) 20px 0',
        background: '#F2F2F7',
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', letterSpacing: -0.5, margin: '0 0 4px' }}>Stock</h1>
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 14px' }}>47 produits actifs</p>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: '#fff', border: '1.5px solid #F3F4F6',
          borderRadius: 14, padding: '12px 16px', marginBottom: 12,
        }}>
          <Search size={18} color="#9CA3AF" style={{ flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            style={{ flex: 1, fontSize: 14, color: '#111827', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit' }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '6px 14px', borderRadius: 999,
              fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
              border: filter === f.key ? 'none' : '1.5px solid #E5E7EB',
              background: filter === f.key ? '#111827' : '#fff',
              color: filter === f.key ? '#fff' : '#6B7280',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.map(p => {
            const s = SC[p.status]
            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: '#fff', borderRadius: 18,
                padding: '14px 16px',
                boxShadow: '0 1px 4px rgba(0,0,0,.06)',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: p.status === 'j1' ? '#FEF2F2' : p.status === 'j2' ? '#FFFBEB' : '#F0FDF4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span style={{ fontSize: 22 }}>📦</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                  <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>{p.cat} · {p.qty}</p>
                  <p style={{ fontSize: 11, fontWeight: 500, color: s.dlcColor, margin: '4px 0 0' }}>{p.dlc}</p>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 8, background: s.bg, color: s.color, flexShrink: 0 }}>{s.label}</span>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
