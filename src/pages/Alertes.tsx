import { useEffect, useState } from 'react'
import { AlertTriangle, Clock, Bell as BellIcon } from 'lucide-react'
import { getProducts, statusFromDLC, daysUntil, formatDLC, type StoredProduct } from '../lib/storage'

type Enriched = StoredProduct & { status: string; daysLeft: number }

const C = {
  expired: { label: 'Expiré', tagBg: '#FEE2E2', tagColor: '#DC2626', iconBg: '#FEF2F2', border: '#EF4444', Icon: AlertTriangle, msg: (p: Enriched) => `Expiré il y a ${-p.daysLeft} jour${-p.daysLeft > 1 ? 's' : ''}` },
  j1:      { label: 'J-1',    tagBg: '#FEE2E2', tagColor: '#DC2626', iconBg: '#FEF2F2', border: '#EF4444', Icon: AlertTriangle, msg: (p: Enriched) => p.daysLeft === 0 ? "Expire aujourd'hui" : 'Expire demain' },
  j2:      { label: 'J-2',    tagBg: '#FEF3C7', tagColor: '#D97706', iconBg: '#FFFBEB', border: '#F59E0B', Icon: Clock,         msg: (p: Enriched) => `Expire dans 2 jours · ${formatDLC(p.dlc)}` },
  j5:      { label: 'J-5',    tagBg: '#DBEAFE', tagColor: '#2563EB', iconBg: '#EFF6FF', border: '#60A5FA', Icon: BellIcon,      msg: (p: Enriched) => `Expire dans ${p.daysLeft} jours · ${formatDLC(p.dlc)}` },
}

function AlertCard({ p }: { p: Enriched }) {
  const c = C[p.status as keyof typeof C]
  if (!c) return null
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: '#fff', borderRadius: 18,
      padding: '14px 16px', marginBottom: 10,
      boxShadow: '0 2px 8px rgba(0,0,0,.05)',
      borderLeft: `3px solid ${c.border}`,
    }}>
      <div style={{ width: 42, height: 42, borderRadius: 13, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <c.Icon size={18} color={c.tagColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
        <p style={{ fontSize: 12, color: '#6B7280', margin: '3px 0 0' }}>{c.msg(p)}</p>
        {p.qty && p.unit && (
          <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>{p.qty} {p.unit}</p>
        )}
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 9px', borderRadius: 8, background: c.tagBg, color: c.tagColor, flexShrink: 0, alignSelf: 'flex-start' }}>{c.label}</span>
    </div>
  )
}

export function Alertes() {
  const [products, setProducts] = useState<Enriched[]>([])

  useEffect(() => {
    const all = getProducts()
    const enriched = all
      .map(p => ({ ...p, status: statusFromDLC(p.dlc), daysLeft: daysUntil(p.dlc) }))
      .filter(p => p.status !== 'ok')
    setProducts(enriched)
  }, [])

  const today    = products.filter(p => p.status === 'j1' || p.status === 'expired')
  const upcoming = products.filter(p => p.status === 'j2' || p.status === 'j5')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

      <div style={{
        flexShrink: 0,
        padding: 'max(env(safe-area-inset-top, 0px), 16px) 20px 20px',
        background: '#F2F2F7',
      }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: '#111827', letterSpacing: -1, margin: 0 }}>Alertes</h1>
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: '4px 0 0' }}>
          {products.length > 0
            ? `${products.length} produit${products.length > 1 ? 's' : ''} à surveiller`
            : 'Tout est OK'}
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: '#F0FDF4', border: '3px solid #16A34A',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <BellIcon size={28} color="#16A34A" />
            </div>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Aucune alerte</p>
            <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0 }}>Tous vos produits sont OK</p>
          </div>
        ) : (
          <>
            {today.length > 0 && (
              <>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.2, margin: '4px 0 10px' }}>Aujourd'hui</p>
                {today.map(p => <AlertCard key={p.id} p={p} />)}
              </>
            )}
            {upcoming.length > 0 && (
              <>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.2, margin: `${today.length > 0 ? '20px' : '4px'} 0 10px` }}>Cette semaine</p>
                {upcoming.map(p => <AlertCard key={p.id} p={p} />)}
              </>
            )}
          </>
        )}

      </div>
    </div>
  )
}
