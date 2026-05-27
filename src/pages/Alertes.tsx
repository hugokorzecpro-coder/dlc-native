import { useEffect, useState } from 'react'
import { AlertTriangle, Clock, Bell as BellIcon, CheckCheck, Loader2 } from 'lucide-react'
import { useTheme } from '../context/theme'
import { useSpace } from '../context/space'
import { useIsMobile } from '../hooks/useBreakpoint'
import { supabase } from '../lib/supabase'
import { getProducts, closeLot, statusFromDLC, daysUntil, formatDLC, type StoredProduct } from '../lib/storage'

type Enriched = StoredProduct & { status: string; daysLeft: number }

const C = {
  expired: { label: 'Expiré', tagBg: '#FEE2E2', tagColor: '#DC2626', iconBg: '#FEF2F2', border: '#EF4444', Icon: AlertTriangle, msg: (p: Enriched) => `Expiré il y a ${-p.daysLeft} jour${-p.daysLeft > 1 ? 's' : ''}` },
  j1:      { label: 'J-1',    tagBg: '#FEE2E2', tagColor: '#DC2626', iconBg: '#FEF2F2', border: '#EF4444', Icon: AlertTriangle, msg: (p: Enriched) => p.daysLeft === 0 ? "Expire aujourd'hui" : 'Expire demain' },
  j2:      { label: 'J-2',    tagBg: '#FEF3C7', tagColor: '#D97706', iconBg: '#FFFBEB', border: '#F59E0B', Icon: Clock,         msg: (p: Enriched) => `Expire dans 2 jours · ${formatDLC(p.dlc)}` },
  j5:      { label: 'J-5',    tagBg: '#DBEAFE', tagColor: '#2563EB', iconBg: '#EFF6FF', border: '#60A5FA', Icon: BellIcon,      msg: (p: Enriched) => `Expire dans ${p.daysLeft} jours · ${formatDLC(p.dlc)}` },
}

function AlertCard({
  p,
  onClose,
}: {
  p: Enriched
  onClose: (id: string, lotId: string | null | undefined) => void
}) {
  const { c } = useTheme()
  const conf = C[p.status as keyof typeof C]
  const [closing, setClosing] = useState(false)
  if (!conf) return null

  async function handleClose(e: React.MouseEvent) {
    e.stopPropagation()
    setClosing(true)
    await onClose(p.id, p.lot_id)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: c.card, borderRadius: 18,
      padding: '14px 16px', marginBottom: 10,
      boxShadow: '0 1px 4px rgba(0,0,0,.06)',
      borderLeft: `3px solid ${conf.border}`,
    }}>
      <div style={{ width: 42, height: 42, borderRadius: 13, background: conf.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <conf.Icon size={18} color={conf.tagColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: c.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
        <p style={{ fontSize: 12, color: c.textSub, margin: '3px 0 0' }}>{conf.msg(p)}</p>
        {p.qty && p.unit && (
          <p style={{ fontSize: 11, color: c.textMuted, margin: '2px 0 0' }}>{p.qty} {p.unit}</p>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 9px', borderRadius: 8, background: conf.tagBg, color: conf.tagColor }}>{conf.label}</span>
        <button
          onClick={handleClose}
          disabled={closing}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: '#F0FDF4', border: 'none', borderRadius: 8,
            padding: '5px 9px', cursor: closing ? 'default' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {closing
            ? <Loader2 size={11} color="#16A34A" style={{ animation: 'spin .7s linear infinite' }} />
            : <CheckCheck size={11} color="#16A34A" />
          }
          <span style={{ fontSize: 10, fontWeight: 700, color: '#16A34A' }}>Tout consommé</span>
        </button>
      </div>
    </div>
  )
}

export function Alertes() {
  const { c } = useTheme()
  const { space } = useSpace()
  const isMobile = useIsMobile()
  const [products, setProducts] = useState<Enriched[]>([])

  async function load() {
    const all = await getProducts(space?.id ?? null)
    setProducts(
      all
        .map(p => ({ ...p, status: statusFromDLC(p.dlc), daysLeft: daysUntil(p.dlc) }))
        .filter(p => p.status !== 'ok')
    )
  }

  useEffect(() => { load() }, [space?.id])

  async function handleClose(productId: string, lotId: string | null | undefined) {
    if (lotId) {
      await closeLot(lotId)
    } else {
      await supabase.from('products').update({ status: 'consumed' }).eq('id', productId)
    }
    await load()
  }

  const today    = products.filter(p => p.status === 'j1' || p.status === 'expired')
  const upcoming = products.filter(p => p.status === 'j2' || p.status === 'j5')
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
        <div style={{ maxWidth: maxW, margin: '0 auto', padding: isMobile ? '0 20px 20px' : '0 32px 20px' }}>
          <h1 style={{ fontSize: isMobile ? 28 : 32, fontWeight: 800, color: c.text, letterSpacing: -0.5, margin: '0 0 2px' }}>Alertes</h1>
          <p style={{ fontSize: 13, color: c.textMuted, margin: 0 }}>
            {products.length > 0
              ? `${products.length} produit${products.length > 1 ? 's' : ''} à surveiller`
              : 'Tout est OK'}
          </p>
        </div>
      </div>

      {/* Scrollable */}
      <div style={{ flex: 1, overflowY: isMobile ? 'auto' : undefined, minHeight: 0, padding: isMobile ? '4px 20px 24px' : '20px 32px 40px' }}>
        <div style={{ maxWidth: maxW, margin: '0 auto' }}>
          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: isMobile ? '60px 0' : '80px 0' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: '#F0FDF4', border: '3px solid #16A34A',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              }}>
                <BellIcon size={28} color="#16A34A" />
              </div>
              <p style={{ fontSize: 17, fontWeight: 700, color: c.text, margin: '0 0 8px' }}>Aucune alerte</p>
              <p style={{ fontSize: 14, color: c.textMuted, margin: 0 }}>Tous vos produits sont OK</p>
            </div>
          ) : (
            <>
              {today.length > 0 && (
                <>
                  <p style={{ fontSize: 11, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, margin: '4px 0 10px' }}>Aujourd'hui</p>
                  {today.map(p => <AlertCard key={p.id} p={p} onClose={handleClose} />)}
                </>
              )}
              {upcoming.length > 0 && (
                <>
                  <p style={{ fontSize: 11, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, margin: `${today.length > 0 ? '20px' : '4px'} 0 10px` }}>Cette semaine</p>
                  {upcoming.map(p => <AlertCard key={p.id} p={p} onClose={handleClose} />)}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
