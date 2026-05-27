import { useState } from 'react'
import { Package, Calendar, Hash, X, Plus, CheckCircle, Loader2, Barcode } from 'lucide-react'
import { useAuth } from '../context/auth'
import { useTheme } from '../context/theme'
import { useSpace } from '../context/space'
import { useIsMobile } from '../hooks/useBreakpoint'
import { addProduct, getOrCreateLot } from '../lib/storage'

const UNITS = ['unités', 'pcs', 'boîtes', 'bouteilles', 'sachets', 'portions', 'kg', 'g', 'L', 'cl']

interface Props {
  open: boolean
  onClose: () => void
  onAdded: () => void
}

export function AddProductModal({ open, onClose, onAdded }: Props) {
  const { c } = useTheme()
  const { user } = useAuth()
  const { space } = useSpace()
  const isMobile = useIsMobile()

  const [name, setName] = useState('')
  const [dlc, setDlc] = useState('')
  const [qty, setQty] = useState('1')
  const [unit, setUnit] = useState('unités')
  const [barcode, setBarcode] = useState('')
  const [showBarcode, setShowBarcode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(false)

  if (!open) return null

  function reset() {
    setName(''); setDlc(''); setQty('1'); setUnit('unités')
    setBarcode(''); setShowBarcode(false); setSaving(false); setDone(false); setError(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !dlc) return
    setSaving(true); setError(false)
    try {
      const quantity = parseInt(qty) || 1
      const establishmentId = user!.id
      let lot_id: string | null = null

      if (space?.id) {
        const lot = await getOrCreateLot({
          space_id: space.id,
          establishment_id: establishmentId,
          product_name: name.trim(),
          barcode: barcode.trim() || null,
          dlc,
          quantity,
        })
        lot_id = lot.id
      }

      await addProduct({
        name: name.trim(),
        dlc,
        qty: String(quantity),
        unit,
        barcode: barcode.trim() || null,
        space_id: space?.id ?? null,
        establishment_id: establishmentId,
        lot_id,
      })

      setDone(true)
      setTimeout(() => {
        reset()
        onAdded()
        onClose()
      }, 700)
    } catch {
      setError(true)
      setSaving(false)
    }
  }

  const valid = !!name.trim() && !!dlc

  const formContent = (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Name */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Nom du produit
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: c.input, border: `1.5px solid ${c.borderStrong}`, borderRadius: 12, padding: '12px 14px' }}>
          <Package size={16} color={c.textMuted} style={{ flexShrink: 0 }} />
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex. Crème fraîche épaisse"
            autoFocus
            required
            style={{ flex: 1, background: 'transparent', fontSize: 15, color: c.text, outline: 'none', border: 'none', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {/* DLC */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Date limite de consommation
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: c.input, border: `1.5px solid ${dlc ? '#16A34A' : c.borderStrong}`, borderRadius: 12, padding: '12px 14px' }}>
          <Calendar size={16} color={dlc ? '#16A34A' : c.textMuted} style={{ flexShrink: 0 }} />
          <input
            type="date"
            value={dlc}
            onChange={e => setDlc(e.target.value)}
            required
            style={{ flex: 1, background: 'transparent', fontSize: 15, color: dlc ? c.text : c.textMuted, outline: 'none', border: 'none', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {/* Qty + Unit */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Quantité
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: c.input, border: `1.5px solid ${c.borderStrong}`, borderRadius: 12, padding: '12px 14px' }}>
            <Hash size={16} color={c.textMuted} style={{ flexShrink: 0 }} />
            <input
              value={qty}
              onChange={e => setQty(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="1"
              inputMode="numeric"
              style={{ flex: 1, background: 'transparent', fontSize: 15, color: c.text, outline: 'none', border: 'none', fontFamily: 'inherit' }}
            />
          </div>
          <select
            value={unit}
            onChange={e => setUnit(e.target.value)}
            style={{
              width: 120, background: c.input, border: `1.5px solid ${c.borderStrong}`,
              borderRadius: 12, padding: '12px 14px', fontSize: 14, fontWeight: 600,
              color: c.text, fontFamily: 'inherit', appearance: 'none', WebkitAppearance: 'none',
              backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239CA3AF\' stroke-width=\'2.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'/%3e%3c/svg%3e")',
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32,
            }}
          >
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      {/* Barcode (optional, collapsible) */}
      {!showBarcode ? (
        <button type="button" onClick={() => setShowBarcode(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
          color: c.textMuted, fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: 0, fontFamily: 'inherit',
        }}>
          <Barcode size={14} />
          Ajouter un code-barre (optionnel)
        </button>
      ) : (
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            Code-barre
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: c.input, border: `1.5px solid ${c.borderStrong}`, borderRadius: 12, padding: '12px 14px' }}>
            <Barcode size={16} color={c.textMuted} style={{ flexShrink: 0 }} />
            <input
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
              placeholder="Ex. 3017620422003"
              inputMode="numeric"
              style={{ flex: 1, background: 'transparent', fontSize: 15, color: c.text, outline: 'none', border: 'none', fontFamily: 'inherit' }}
            />
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: '#FEF2F2', borderRadius: 10, padding: '10px 14px' }}>
          <p style={{ fontSize: 13, color: '#DC2626', margin: 0, fontWeight: 500 }}>Erreur lors de l'ajout. Réessayez.</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!valid || saving}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: done ? '#16A34A' : valid && !saving ? '#111827' : c.border,
          color: valid && !saving || done ? '#fff' : c.textMuted,
          border: 'none', borderRadius: 14, padding: '16px',
          fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
          cursor: valid && !saving ? 'pointer' : 'default',
          boxShadow: valid && !saving ? '0 4px 14px rgba(0,0,0,.15)' : 'none',
          transition: 'all .18s',
          marginTop: 4,
        }}
      >
        {done
          ? <><CheckCircle size={18} /> Ajouté !</>
          : saving
            ? <Loader2 size={18} style={{ animation: 'spin .7s linear infinite' }} />
            : <><Plus size={18} /> Ajouter au stock</>
        }
      </button>
    </form>
  )

  // ── Mobile: bottom sheet ──────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,.4)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}>
        <div style={{
          width: '100%', maxWidth: 430,
          background: c.card, borderRadius: '24px 24px 0 0',
          maxHeight: '92vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 -10px 40px rgba(0,0,0,.15)',
        }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, background: c.borderStrong, borderRadius: 4, margin: '14px auto 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 0' }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: c.text, margin: 0 }}>Ajouter un produit</p>
              <button onClick={handleClose} style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: c.input, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={16} color={c.textSub} />
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 20px)' }}>
            {formContent}
          </div>
        </div>
      </div>
    )
  }

  // ── Desktop: centered modal ───────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={e => e.target === e.currentTarget && handleClose()}>
      <div style={{
        width: '100%', maxWidth: 520,
        background: c.card, borderRadius: 20,
        boxShadow: '0 24px 64px rgba(0,0,0,.18)',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: `1px solid ${c.border}` }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: c.text, margin: 0 }}>Ajouter un produit</p>
          <button onClick={handleClose} style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: c.input, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color={c.textSub} />
          </button>
        </div>
        <div style={{ padding: '20px 24px 24px', overflowY: 'auto', maxHeight: 'calc(90vh - 80px)' }}>
          {formContent}
        </div>
      </div>
    </div>
  )
}
