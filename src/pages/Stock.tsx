import { useState, useEffect } from 'react'
import { Search, Trash2, Package, Plus } from 'lucide-react'
import { useTheme } from '../context/theme'
import { useSpace } from '../context/space'
import { useIsMobile } from '../hooks/useBreakpoint'
import { AddProductModal } from '../components/AddProductModal'
import { getProducts, removeProduct, statusFromDLC, formatDLC, daysUntil, type StoredProduct } from '../lib/storage'

const SC: Record<string, { label: string; bg: string; color: string; dlcColor: string; cardBg: string }> = {
  expired: { label: 'Expiré', bg: '#FEE2E2', color: '#991B1B', dlcColor: '#991B1B', cardBg: '#FEF2F2' },
  j1:      { label: 'J-1',   bg: '#FEE2E2', color: '#DC2626', dlcColor: '#EF4444', cardBg: '#FEF2F2' },
  j2:      { label: 'J-2',   bg: '#FEF3C7', color: '#D97706', dlcColor: '#F59E0B', cardBg: '#FFFBEB' },
  j5:      { label: 'J-5',   bg: '#DBEAFE', color: '#2563EB', dlcColor: '#3B82F6', cardBg: '#EFF6FF' },
  ok:      { label: 'OK',    bg: '#DCFCE7', color: '#16A34A', dlcColor: '#16A34A', cardBg: '#F0FDF4' },
}

type FilterKey = 'all' | 'urgent' | 'soon' | 'ok'

export function Stock() {
  const { c } = useTheme()
  const { space } = useSpace()
  const isMobile = useIsMobile()
  const [filter, setFilter] = useState<FilterKey>('all')
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<StoredProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  async function load() {
    setLoading(true)
    await getProducts(space?.id ?? null).then(setProducts)
    setLoading(false)
  }

  useEffect(() => { load() }, [space?.id])

  async function handleRemove(id: string) {
    setProducts(prev => prev.filter(p => p.id !== id))
    await removeProduct(id)
  }

  const enriched = products.map(p => ({ ...p, status: statusFromDLC(p.dlc), daysLeft: daysUntil(p.dlc) }))

  const counts = {
    all:    enriched.length,
    urgent: enriched.filter(p => p.status === 'j1' || p.status === 'expired').length,
    soon:   enriched.filter(p => p.status === 'j2' || p.status === 'j5').length,
    ok:     enriched.filter(p => p.status === 'ok').length,
  }

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all',    label: `Tous · ${counts.all}` },
    { key: 'urgent', label: `Urgent · ${counts.urgent}` },
    { key: 'soon',   label: `Bientôt · ${counts.soon}` },
    { key: 'ok',     label: `OK · ${counts.ok}` },
  ]

  const visible = enriched.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'urgent') return p.status === 'j1' || p.status === 'expired'
    if (filter === 'soon')   return p.status === 'j2' || p.status === 'j5'
    if (filter === 'ok')     return p.status === 'ok'
    return true
  })

  const maxW = isMobile ? '100%' : 900

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: isMobile ? 0 : 'auto', background: c.bg }}>

      {/* Header */}
      <div style={{
        flexShrink: 0, background: c.bg,
        paddingTop: isMobile ? 'max(env(safe-area-inset-top, 0px), 16px)' : 32,
        position: isMobile ? undefined : 'sticky', top: 0, zIndex: 10,
        borderBottom: isMobile ? 'none' : `1px solid ${c.border}`,
      }}>
        <div style={{ maxWidth: maxW, margin: '0 auto', padding: isMobile ? '0 20px 12px' : '0 32px 20px' }}>

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: isMobile ? 28 : 32, fontWeight: 800, color: c.text, letterSpacing: -0.5, margin: '0 0 2px' }}>Stock</h1>
              <p style={{ fontSize: 13, color: c.textMuted, margin: 0 }}>{counts.all} produit{counts.all !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#16A34A', color: '#fff', border: 'none',
                borderRadius: 12, padding: isMobile ? '10px 14px' : '11px 20px',
                fontSize: isMobile ? 13 : 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 14px rgba(22,163,74,.35)',
              }}
            >
              <Plus size={16} />
              {!isMobile && 'Ajouter un produit'}
            </button>
          </div>

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: c.card, border: `1.5px solid ${c.borderStrong}`,
            borderRadius: 14, padding: '12px 16px', marginBottom: 12,
          }}>
            <Search size={18} color={c.textMuted} style={{ flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              style={{ flex: 1, minWidth: 0, fontSize: 14, color: c.text, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit' }}
            />
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: '6px 14px', borderRadius: 999,
                fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
                border: filter === f.key ? 'none' : `1.5px solid ${c.borderStrong}`,
                background: filter === f.key ? c.text : c.card,
                color: filter === f.key ? c.bg : c.textSub,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: isMobile ? 'auto' : undefined, minHeight: 0, padding: isMobile ? '4px 20px 24px' : '20px 32px 40px' }}>
        <div style={{ maxWidth: maxW, margin: '0 auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: c.textMuted, fontSize: 14 }}>Chargement…</div>
          ) : visible.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: c.card, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
                <Package size={28} color={c.textMuted} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: c.text, margin: '0 0 6px' }}>
                {search ? 'Aucun résultat' : products.length === 0 ? 'Stock vide' : 'Aucun produit dans ce filtre'}
              </p>
              <p style={{ fontSize: 13, color: c.textMuted, margin: '0 0 20px' }}>
                {search ? `Pas de produit pour "${search}"` : products.length === 0 ? 'Ajoutez votre premier produit' : 'Essayez un autre filtre'}
              </p>
              {products.length === 0 && (
                <button onClick={() => setShowAdd(true)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#16A34A', color: '#fff', border: 'none', borderRadius: 12,
                  padding: '12px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 4px 14px rgba(22,163,74,.3)',
                }}>
                  <Plus size={16} /> Ajouter un produit
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {visible.map(p => {
                const s = SC[p.status]
                const dlcLabel = p.daysLeft < 0
                  ? `Expiré il y a ${-p.daysLeft}j`
                  : p.daysLeft === 0 ? "Expire aujourd'hui"
                  : p.daysLeft === 1 ? 'Expire demain'
                  : `${formatDLC(p.dlc)} · J-${p.daysLeft}`
                return (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: c.card, borderRadius: 18, padding: '14px 18px',
                    boxShadow: '0 1px 4px rgba(0,0,0,.06)',
                  }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: s.cardBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 22 }}>📦</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: c.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                      <p style={{ fontSize: 12, color: c.textMuted, margin: '2px 0 0' }}>
                        {Number(p.qty) > 1 ? `× ${p.qty} ` : ''}{p.unit}
                        {p.space_id && !isMobile ? '' : ''}
                      </p>
                      <p style={{ fontSize: 11, fontWeight: 500, color: s.dlcColor, margin: '4px 0 0' }}>{dlcLabel}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 8, background: s.bg, color: s.color }}>{s.label}</span>
                      <button onClick={() => handleRemove(p.id)} style={{
                        width: 28, height: 28, borderRadius: 8, border: 'none', background: c.input,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      }}>
                        <Trash2 size={14} color={c.textMuted} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile FAB */}
      {isMobile && (
        <div style={{ position: 'fixed', bottom: `calc(${TAB_H}px + env(safe-area-inset-bottom, 16px) + 16px)`, right: 20, zIndex: 90 }}>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              width: 52, height: 52, borderRadius: 16, border: 'none',
              background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 6px 20px rgba(22,163,74,.45)',
            }}
          >
            <Plus size={24} color="white" />
          </button>
        </div>
      )}

      <AddProductModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={load}
      />
    </div>
  )
}

const TAB_H = 58
