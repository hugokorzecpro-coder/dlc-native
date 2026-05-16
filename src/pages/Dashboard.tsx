import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ScanLine, Package, ChevronRight, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/auth'
import { getProducts, statusFromDLC, daysUntil, formatDLC, type StoredProduct } from '../lib/storage'

type Enriched = StoredProduct & { status: 'expired' | 'j1' | 'j2' | 'j5' | 'ok'; daysLeft: number }

const ST = {
  expired: { label: 'Expiré', color: '#DC2626', bg: '#FEE2E2', light: '#FEF2F2', accent: '#EF4444' },
  j1:      { label: 'J-1',    color: '#DC2626', bg: '#FEE2E2', light: '#FEF2F2', accent: '#EF4444' },
  j2:      { label: 'J-2',    color: '#D97706', bg: '#FEF3C7', light: '#FFFBEB', accent: '#F59E0B' },
  j5:      { label: 'J-5',    color: '#2563EB', bg: '#DBEAFE', light: '#EFF6FF', accent: '#3B82F6' },
  ok:      { label: 'OK',     color: '#16A34A', bg: '#DCFCE7', light: '#F0FDF4', accent: '#16A34A' },
}

function dlcMsg(p: Enriched): string {
  if (p.daysLeft < 0) return `Expiré il y a ${-p.daysLeft}j`
  if (p.daysLeft === 0) return "Expire aujourd'hui"
  if (p.daysLeft === 1) return 'Expire demain'
  return `${formatDLC(p.dlc)} · J-${p.daysLeft}`
}

function ProductRow({ p }: { p: Enriched }) {
  const s = ST[p.status]
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: '#fff', borderRadius: 18, padding: '14px 16px',
      boxShadow: '0 2px 8px rgba(0,0,0,.05)', marginBottom: 10,
    }}>
      <div style={{
        width: 46, height: 46, borderRadius: 14, background: s.light,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Package size={20} color={s.accent} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
        <p style={{ fontSize: 12, fontWeight: 500, color: s.color, margin: '4px 0 0' }}>{dlcMsg(p)}</p>
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 9px', borderRadius: 8, background: s.bg, color: s.color, flexShrink: 0 }}>{s.label}</span>
    </div>
  )
}

export function Dashboard() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Enriched[]>([])

  useEffect(() => {
    const all = getProducts()
    setProducts(all.map(p => ({ ...p, status: statusFromDLC(p.dlc) as Enriched['status'], daysLeft: daysUntil(p.dlc) })))
  }, [])

  const urgent = products.filter(p => p.status === 'j1' || p.status === 'expired')
  const soon   = products.filter(p => p.status === 'j2' || p.status === 'j5')

  const name = (user?.user_metadata?.establishment_name ?? user?.email?.split('@')[0] ?? 'Chef') as string

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

      <div style={{
        flexShrink: 0,
        padding: 'max(env(safe-area-inset-top, 0px), 16px) 20px 20px',
        background: '#F2F2F7',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500, margin: '0 0 2px' }}>Bonjour</p>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#111827', letterSpacing: -1, margin: 0 }}>{name}</h1>
        </div>
        <Link to="/alertes" style={{
          width: 44, height: 44, background: '#fff', borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,.08)', position: 'relative',
          textDecoration: 'none', flexShrink: 0,
        }}>
          <Bell size={20} color="#374151" />
          {urgent.length > 0 && (
            <span style={{
              position: 'absolute', top: 9, right: 9,
              width: 8, height: 8, borderRadius: '50%',
              background: '#EF4444', border: '2px solid #F2F2F7',
            }} />
          )}
        </Link>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }}>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
          {[
            { n: products.length, label: 'En stock', dot: '#16A34A' },
            { n: soon.length,     label: 'Bientôt',  dot: '#F59E0B' },
            { n: urgent.length,   label: 'Urgents',  dot: '#EF4444' },
          ].map(({ n, label, dot }) => (
            <div key={label} style={{ flex: 1, background: '#fff', borderRadius: 20, padding: '16px 14px', boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot, marginBottom: 12 }} />
              <div style={{ fontSize: 30, fontWeight: 800, color: '#111827', lineHeight: 1, letterSpacing: -1 }}>{n}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginTop: 6 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Urgent stories row */}
        {urgent.length > 0 && (
          <div style={{ marginLeft: -20, marginRight: -20, marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 20, marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: 0 }}>Urgents</h2>
              <Link to="/stock" style={{ fontSize: 13, fontWeight: 600, color: '#16A34A', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
                Voir tout <ChevronRight size={14} />
              </Link>
            </div>
            <div style={{ overflowX: 'auto', scrollbarWidth: 'none', display: 'flex', gap: 16, paddingLeft: 20, paddingRight: 20 }}>
              {urgent.map(p => {
                const s = ST[p.status]
                return (
                  <div key={p.id} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 58, height: 58, borderRadius: '50%',
                      background: s.accent,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 0 0 3px #F2F2F7, 0 0 0 5.5px ${s.accent}`,
                      fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: -0.5,
                    }}>
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, color: '#374151',
                      width: 64, textAlign: 'center',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {p.name.split(' ')[0]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Bientôt */}
        {soon.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: 0 }}>Bientôt</h2>
              <Link to="/stock" style={{ fontSize: 13, fontWeight: 600, color: '#16A34A', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
                Voir tout <ChevronRight size={14} />
              </Link>
            </div>
            {soon.slice(0, 3).map(p => <ProductRow key={p.id} p={p} />)}
          </>
        )}

        {/* All good */}
        {products.length > 0 && urgent.length === 0 && soon.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', background: '#F0FDF4', border: '3px solid #16A34A',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <CheckCircle size={32} color="#16A34A" />
            </div>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Tout est OK</p>
            <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0 }}>{products.length} produit{products.length > 1 ? 's' : ''} en stock</p>
          </div>
        )}

        {/* Empty stock */}
        {products.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 22, background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', boxShadow: '0 2px 8px rgba(0,0,0,.06)',
            }}>
              <Package size={30} color="#9CA3AF" />
            </div>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Stock vide</p>
            <p style={{ fontSize: 14, color: '#9CA3AF', margin: '0 0 28px' }}>Scannez votre premier produit</p>
            <Link to="/scanner" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#16A34A', color: '#fff', borderRadius: 14,
              padding: '14px 24px', fontSize: 15, fontWeight: 700,
              textDecoration: 'none', boxShadow: '0 8px 20px rgba(22,163,74,.3)',
            }}>
              <ScanLine size={18} /> Scanner
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
