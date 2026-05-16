import { useState, useEffect } from 'react'
import { Search, Trash2, Package } from 'lucide-react'
import { getProducts, removeProduct, statusFromDLC, formatDLC, daysUntil, type StoredProduct } from '../lib/storage'

const SC: Record<string, { label: string; bg: string; color: string; dlcColor: string; cardBg: string }> = {
  expired: { label: 'Expiré', bg: '#FEE2E2', color: '#991B1B', dlcColor: '#991B1B', cardBg: '#FEF2F2' },
  j1: { label: 'J-1', bg: '#FEE2E2', color: '#DC2626', dlcColor: '#EF4444', cardBg: '#FEF2F2' },
  j2: { label: 'J-2', bg: '#FEF3C7', color: '#D97706', dlcColor: '#F59E0B', cardBg: '#FFFBEB' },
  j5: { label: 'J-5', bg: '#DBEAFE', color: '#2563EB', dlcColor: '#3B82F6', cardBg: '#EFF6FF' },
  ok: { label: 'OK', bg: '#DCFCE7', color: '#16A34A', dlcColor: '#16A34A', cardBg: '#F0FDF4' },
}

type FilterKey = 'all' | 'urgent' | 'soon' | 'ok'

export function Stock() {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<StoredProduct[]>([])

  useEffect(() => { setProducts(getProducts()) }, [])

  function handleRemove(id: string) {
    removeProduct(id)
    setProducts(getProducts())
  }

  const enriched = products.map(p => ({ ...p, status: statusFromDLC(p.dlc), daysLeft: daysUntil(p.dlc) }))

  const counts = {
    all: enriched.length,
    urgent: enriched.filter(p => p.status === 'j1' || p.status === 'expired').length,
    soon: enriched.filter(p => p.status === 'j2' || p.status === 'j5').length,
    ok: enriched.filter(p => p.status === 'ok').length,
  }

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: `Tous · ${counts.all}` },
    { key: 'urgent', label: `Urgent · ${counts.urgent}` },
    { key: 'soon', label: `Bientôt · ${counts.soon}` },
    { key: 'ok', label: `OK · ${counts.ok}` },
  ]

  const visible = enriched.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'all') return true
    if (filter === 'urgent') return p.status === 'j1' || p.status === 'expired'
    if (filter === 'soon') return p.status === 'j2' || p.status === 'j5'
    if (filter === 'ok') return p.status === 'ok'
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* Header sticky */}
      <div style={{
        flexShrink: 0,
        padding: 'max(env(safe-area-inset-top, 0px), 52px) 20px 0',
        background: '#F2F2F7',
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', letterSpacing: -0.5, margin: '0 0 4px' }}>Stock</h1>
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 14px' }}>{counts.all} produit{counts.all !== 1 ? 's' : ''}</p>

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
            style={{ flex: 1, minWidth: 0, fontSize: 14, color: '#111827', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit' }}
          />
        </div>

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
        {visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
              <Package size={28} color="#9CA3AF" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: '0 0 6px' }}>
              {search ? 'Aucun résultat' : products.length === 0 ? 'Stock vide' : 'Aucun produit dans ce filtre'}
            </p>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
              {search ? `Pas de produit pour "${search}"` : products.length === 0 ? 'Scannez votre premier produit' : 'Essayez un autre filtre'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visible.map(p => {
              const s = SC[p.status]
              const dlcLabel = p.daysLeft < 0
                ? `Expiré il y a ${-p.daysLeft}j`
                : p.daysLeft === 0
                ? "Expire aujourd'hui"
                : p.daysLeft === 1
                ? 'Expire demain'
                : `${formatDLC(p.dlc)} · J-${p.daysLeft}`
              return (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: '#fff', borderRadius: 18,
                  padding: '14px 16px',
                  boxShadow: '0 1px 4px rgba(0,0,0,.06)',
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, background: s.cardBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 22 }}>📦</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                    <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>{p.qty} {p.unit}</p>
                    <p style={{ fontSize: 11, fontWeight: 500, color: s.dlcColor, margin: '4px 0 0' }}>{dlcLabel}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 8, background: s.bg, color: s.color }}>{s.label}</span>
                    <button onClick={() => handleRemove(p.id)} style={{
                      width: 28, height: 28, borderRadius: 8, border: 'none', background: '#F9FAFB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    }}>
                      <Trash2 size={14} color="#9CA3AF" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
