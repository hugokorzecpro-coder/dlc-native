import { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library'
import { ArrowLeft, Zap, ZapOff, CheckCircle, Calendar, Hash, Package, Plus, PenLine } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type Product = {
  name: string
  brand: string
  quantity: string
}

type FormState = {
  name: string
  dlc: string
  qty: string
}

const UNITS = ['unités', 'kg', 'g', 'L', 'cl', 'pcs']

// ── GS1-128 parser ──────────────────────────────────────────────
// Fixed-length AIs: AI → value length (digits after AI)
const GS1_FIXED: Record<string, number> = {
  '00': 18, '01': 14, '02': 14,
  '11': 6, '12': 6, '13': 6, '15': 6, '16': 6, '17': 6,
  '20': 2,
}

type GS1Data = { gtin?: string; dlc?: string; batch?: string; qty?: string }

function parseGS1(raw: string): GS1Data {
  const result: GS1Data = {}
  // ZXing encodes FNC1 separator as \x1D (ASCII Group Separator)
  let s = raw.startsWith('\x1D') ? raw.slice(1) : raw
  let i = 0
  while (i < s.length) {
    if (s[i] === '\x1D') { i++; continue }
    const ai2 = s.slice(i, i + 2)
    if (GS1_FIXED[ai2] !== undefined) {
      const len = GS1_FIXED[ai2]
      const val = s.slice(i + 2, i + 2 + len)
      if (ai2 === '01') result.gtin = val
      if (ai2 === '17') result.dlc = val          // expiry YYMMDD
      if (ai2 === '15' && !result.dlc) result.dlc = val // best-before fallback
      i += 2 + len
    } else {
      // Variable-length AI — read until \x1D or end
      const sep = s.indexOf('\x1D', i + 2)
      const val = sep === -1 ? s.slice(i + 2) : s.slice(i + 2, sep)
      if (ai2 === '10') result.batch = val
      if (ai2 === '37') result.qty = val
      i = sep === -1 ? s.length : sep + 1
    }
  }
  return result
}

function gs1DateToISO(yymmdd: string): string {
  if (yymmdd.length !== 6) return ''
  const yy = parseInt(yymmdd.slice(0, 2))
  const mm = yymmdd.slice(2, 4)
  const dd = yymmdd.slice(4, 6)
  const year = yy > 50 ? 1900 + yy : 2000 + yy
  return `${year}-${mm}-${dd}`
}

// GTIN-14 → EAN-13 (strip leading check digit padding)
function gtinToEan(gtin: string): string {
  return gtin.length === 14 && gtin.startsWith('0') ? gtin.slice(1) : gtin
}

function isGS1(raw: string): boolean {
  return raw.includes('\x1D') || (raw.length > 20 && /^0[01]/.test(raw))
}
// ────────────────────────────────────────────────────────────────

function fetchOpenFoodFacts(barcode: string): Promise<Product | null> {
  return fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    .then(r => r.json())
    .then(data => {
      if (data.status !== 1) return null
      const p = data.product
      return {
        name: p.product_name || p.product_name_fr || '',
        brand: p.brands || '',
        quantity: p.quantity || '',
      }
    })
    .catch(() => null)
}

export function Scanner() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [torchOn, setTorchOn] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [manual, setManual] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [barcode, setBarcode] = useState('')
  const [offProduct, setOffProduct] = useState<Product | null>(null)
  const [dlcFromScan, setDlcFromScan] = useState(false)
  const [form, setForm] = useState<FormState>({ name: '', dlc: '', qty: '' })
  const [unit, setUnit] = useState('unités')
  const [added, setAdded] = useState(false)

  const startScanner = useCallback(() => {
    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
    ])
    const reader = new BrowserMultiFormatReader(hints)
    readerRef.current = reader

    reader.decodeFromConstraints(
      { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } },
      videoRef.current!,
      async (result, _err) => {
        if (!result) return
        const raw = result.getText()
        reader.reset()
        if (navigator.vibrate) navigator.vibrate(40)

        // Try GS1-128 first (cartons livraison pro)
        if (isGS1(raw)) {
          const gs1 = parseGS1(raw)
          const dlc = gs1.dlc ? gs1DateToISO(gs1.dlc) : ''
          const ean = gs1.gtin ? gtinToEan(gs1.gtin) : ''
          setBarcode(ean || raw)
          setDlcFromScan(!!dlc)
          setSheet(true)
          setFetching(true)
          const p = ean ? await fetchOpenFoodFacts(ean) : null
          setOffProduct(p)
          setForm({ name: p?.name ?? '', dlc, qty: gs1.qty ?? p?.quantity ?? '' })
          setFetching(false)
        } else {
          // EAN-13 / UPC classique
          setBarcode(raw)
          setDlcFromScan(false)
          setSheet(true)
          setFetching(true)
          const p = await fetchOpenFoodFacts(raw)
          setOffProduct(p)
          setForm({ name: p?.name ?? '', dlc: '', qty: p?.quantity ?? '' })
          setFetching(false)
        }
      }
    )
  }, [])

  useEffect(() => {
    startScanner()
    return () => { readerRef.current?.reset() }
  }, [startScanner])

  function handleAdd() {
    setAdded(true)
    setTimeout(() => navigate(-1), 900)
  }

  function openManual() {
    readerRef.current?.reset()
    setBarcode('')
    setOffProduct(null)
    setForm({ name: '', dlc: '', qty: '' })
    setManual(true)
    setSheet(true)
  }

  function resetScan() {
    setSheet(false)
    setManual(false)
    setBarcode('')
    setOffProduct(null)
    setDlcFromScan(false)
    setAdded(false)
    setForm({ name: '', dlc: '', qty: '' })
    startScanner()
  }

  return (
    <div style={{ position: 'relative', height: '100%', background: '#000', overflow: 'hidden' }}>

      {/* Camera */}
      <video
        ref={videoRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        muted
        playsInline
      />

      {/* Dark vignette overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 42%, transparent 28%, rgba(0,0,0,.65) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Top controls */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: 'max(env(safe-area-inset-top, 0px), 52px) 20px 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: 10,
      }}>
        <button onClick={() => navigate(-1)} style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(8px)',
          border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <ArrowLeft size={20} color="#fff" />
        </button>

        <button onClick={() => setTorchOn(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: torchOn ? 'rgba(255,220,0,.2)' : 'rgba(0,0,0,.45)',
          backdropFilter: 'blur(8px)',
          border: torchOn ? '1px solid rgba(255,220,0,.5)' : 'none',
          borderRadius: 20, padding: '8px 14px', cursor: 'pointer',
        }}>
          {torchOn
            ? <Zap size={15} color="#FFE000" fill="#FFE000" />
            : <ZapOff size={15} color="rgba(255,255,255,.7)" />}
          <span style={{ fontSize: 12, color: torchOn ? '#FFE000' : 'rgba(255,255,255,.7)', fontWeight: 600 }}>Flash</span>
        </button>
      </div>

      {/* Scan frame */}
      {!sheet && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -54%)',
          width: 220, height: 220,
          zIndex: 10,
        }}>
          {/* Corners */}
          {[
            { top: 0, left: 0, borderTop: '3px solid #4ADE80', borderLeft: '3px solid #4ADE80', borderRadius: '8px 0 0 0' },
            { top: 0, right: 0, borderTop: '3px solid #4ADE80', borderRight: '3px solid #4ADE80', borderRadius: '0 8px 0 0' },
            { bottom: 0, left: 0, borderBottom: '3px solid #4ADE80', borderLeft: '3px solid #4ADE80', borderRadius: '0 0 0 8px' },
            { bottom: 0, right: 0, borderBottom: '3px solid #4ADE80', borderRight: '3px solid #4ADE80', borderRadius: '0 0 8px 0' },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', width: 28, height: 28, ...s }} />
          ))}
          {/* Scan line */}
          <div style={{
            position: 'absolute', top: '50%', left: 8, right: 8, height: 2,
            background: 'linear-gradient(to right, transparent, #4ADE80, transparent)',
            boxShadow: '0 0 10px rgba(74,222,128,.8)',
            animation: 'scanline 1.8s ease-in-out infinite',
          }} />
        </div>
      )}

      {/* Hint + manual button */}
      {!sheet && (
        <div style={{
          position: 'absolute', bottom: '14%', left: 0, right: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          zIndex: 10,
        }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', margin: 0 }}>
            Pointez le code-barre vers le cadre
          </p>
          <button onClick={openManual} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,.12)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,.2)', borderRadius: 24,
            padding: '10px 20px', cursor: 'pointer',
          }}>
            <PenLine size={15} color="#fff" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Saisie manuelle</span>
          </button>
        </div>
      )}

      {/* Bottom sheet */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: '#fff',
        borderRadius: '24px 24px 0 0',
        transform: sheet ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)',
        zIndex: 20,
        paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 20px)',
        maxHeight: '80%',
        overflowY: 'auto',
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: '#E5E7EB', borderRadius: 4, margin: '14px auto 0' }} />

        <div style={{ padding: '16px 20px 0' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>
                {manual ? 'Ajout manuel' : 'Code-barre détecté'}
              </p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '2px 0 0' }}>
                {manual ? 'Nouveau produit' : barcode}
              </p>
            </div>
            {!manual && !fetching && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                {offProduct && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F0FDF4', borderRadius: 8, padding: '4px 10px' }}>
                    <CheckCircle size={12} color="#16A34A" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#16A34A' }}>Open Food Facts</span>
                  </div>
                )}
                {dlcFromScan && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#EFF6FF', borderRadius: 8, padding: '4px 10px' }}>
                    <Calendar size={12} color="#2563EB" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#2563EB' }}>DLC extraite</span>
                  </div>
                )}
                {!offProduct && !dlcFromScan && barcode && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#FEF3C7', borderRadius: 8, padding: '4px 10px' }}>
                    <PenLine size={12} color="#D97706" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#D97706' }}>Saisie requise</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {fetching ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
              <div style={{ width: 28, height: 28, border: '3px solid #BBF7D0', borderTopColor: '#16A34A', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            </div>
          ) : (
            <>
              {/* Name */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Nom du produit
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '12px 14px' }}>
                  <Package size={16} color="#9CA3AF" style={{ flexShrink: 0 }} />
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ex. Crème fraîche épaisse"
                    style={{ flex: 1, fontSize: 14, color: '#111827', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              {/* DLC */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Date limite de consommation
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F9FAFB', border: form.dlc ? '1.5px solid #16A34A' : '1.5px solid #E5E7EB', borderRadius: 12, padding: '12px 14px' }}>
                  <Calendar size={16} color={form.dlc ? '#16A34A' : '#9CA3AF'} style={{ flexShrink: 0 }} />
                  <input
                    type="date"
                    value={form.dlc}
                    onChange={e => setForm(f => ({ ...f, dlc: e.target.value }))}
                    style={{ flex: 1, fontSize: 14, color: form.dlc ? '#111827' : '#9CA3AF', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              {/* Quantity */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Quantité
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '12px 14px' }}>
                    <Hash size={16} color="#9CA3AF" style={{ flexShrink: 0 }} />
                    <input
                      value={form.qty}
                      onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
                      placeholder="1"
                      inputMode="decimal"
                      style={{ flex: 1, fontSize: 14, color: '#111827', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {UNITS.map(u => (
                      <button key={u} onClick={() => setUnit(u)} style={{
                        padding: '0 10px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                        background: unit === u ? '#111827' : '#F3F4F6',
                        color: unit === u ? '#fff' : '#6B7280',
                        border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                      }}>{u}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={handleAdd}
                disabled={!form.name || !form.dlc}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: added ? '#16A34A' : (!form.name || !form.dlc ? '#E5E7EB' : '#16A34A'),
                  color: (!form.name || !form.dlc) && !added ? '#9CA3AF' : '#fff',
                  border: 'none', borderRadius: 14, padding: '16px',
                  fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                  boxShadow: form.name && form.dlc ? '0 8px 20px rgba(22,163,74,.3)' : 'none',
                  transition: 'all .2s',
                  marginBottom: 10,
                }}
              >
                {added ? <CheckCircle size={18} /> : <Plus size={18} />}
                {added ? 'Ajouté au stock !' : 'Ajouter au stock'}
              </button>

              <button onClick={resetScan} style={{
                width: '100%', padding: '13px', background: 'transparent',
                border: 'none', fontSize: 14, color: '#9CA3AF', fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Scanner un autre produit
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scanline {
          0%, 100% { transform: translateY(-50px); opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { transform: translateY(50px); }
        }
      `}</style>
    </div>
  )
}
