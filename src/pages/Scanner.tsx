import { useRef, useState } from 'react'
import {
  MultiFormatReader, BinaryBitmap, HTMLCanvasElementLuminanceSource,
  HybridBinarizer, BarcodeFormat, DecodeHintType,
} from '@zxing/library'
import { Camera, CheckCircle, Calendar, Hash, Package, Plus, PenLine, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { addProduct } from '../lib/storage'

type Product = { name: string; brand: string; quantity: string }
type FormState = { name: string; dlc: string; qty: string }

const UNITS = ['unités', 'kg', 'g', 'L', 'cl', 'pcs']

// ── GS1-128 parser ───────────────────────────────────────────────
const GS1_FIXED: Record<string, number> = {
  '00': 18, '01': 14, '02': 14,
  '11': 6, '12': 6, '13': 6, '15': 6, '16': 6, '17': 6, '20': 2,
}
type GS1Data = { gtin?: string; dlc?: string; batch?: string; qty?: string }

function parseGS1(raw: string): GS1Data {
  const result: GS1Data = {}
  let s = raw.startsWith('\x1D') ? raw.slice(1) : raw
  let i = 0
  while (i < s.length) {
    if (s[i] === '\x1D') { i++; continue }
    const ai2 = s.slice(i, i + 2)
    if (GS1_FIXED[ai2] !== undefined) {
      const len = GS1_FIXED[ai2]
      const val = s.slice(i + 2, i + 2 + len)
      if (ai2 === '01') result.gtin = val
      if (ai2 === '17') result.dlc = val
      if (ai2 === '15' && !result.dlc) result.dlc = val
      i += 2 + len
    } else {
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

function gtinToEan(gtin: string): string {
  return gtin.length === 14 && gtin.startsWith('0') ? gtin.slice(1) : gtin
}

function isGS1(raw: string): boolean {
  return raw.includes('\x1D') || (raw.length > 20 && /^0[01]/.test(raw))
}
// ─────────────────────────────────────────────────────────────────

function fetchOpenFoodFacts(barcode: string): Promise<Product | null> {
  return fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    .then(r => r.json())
    .then(data => {
      if (data.status !== 1) return null
      const p = data.product
      return { name: p.product_name || p.product_name_fr || '', brand: p.brands || '', quantity: p.quantity || '' }
    })
    .catch(() => null)
}

const hints = new Map()
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
])
hints.set(DecodeHintType.TRY_HARDER, true)
const zxingReader = new MultiFormatReader()
zxingReader.setHints(hints)

async function decodeImage(file: File): Promise<string | null> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('image load'))
    })

    // Downscale if huge (iPhone photos are 4032x3024 — too big for ZXing)
    const MAX = 1600
    const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.round(img.naturalWidth * scale)
    const h = Math.round(img.naturalHeight * scale)

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(img, 0, 0, w, h)

    try {
      const lum = new HTMLCanvasElementLuminanceSource(canvas)
      const bitmap = new BinaryBitmap(new HybridBinarizer(lum))
      const result = zxingReader.decode(bitmap)
      return result.getText()
    } catch {
      return null
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function Scanner() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [decoding, setDecoding] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [manual, setManual] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [barcode, setBarcode] = useState('')
  const [offProduct, setOffProduct] = useState<Product | null>(null)
  const [dlcFromScan, setDlcFromScan] = useState(false)
  const [decodeError, setDecodeError] = useState(false)
  const [form, setForm] = useState<FormState>({ name: '', dlc: '', qty: '' })
  const [unit, setUnit] = useState('unités')
  const [added, setAdded] = useState(false)

  async function handleScannedCode(raw: string) {
    if (navigator.vibrate) navigator.vibrate(40)
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

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // reset so same file can be picked twice
    if (!file) return

    setDecodeError(false)
    setDecoding(true)
    const code = await decodeImage(file)
    setDecoding(false)

    if (code) {
      void handleScannedCode(code)
    } else {
      setDecodeError(true)
    }
  }

  function triggerCamera() {
    fileInputRef.current?.click()
  }

  function openManual() {
    setDecodeError(false)
    setBarcode('')
    setOffProduct(null)
    setDlcFromScan(false)
    setForm({ name: '', dlc: '', qty: '' })
    setManual(true)
    setSheet(true)
  }

  function handleAdd() {
    addProduct({
      name: form.name.trim(),
      dlc: form.dlc,
      qty: form.qty.trim() || '1',
      unit,
      barcode: manual ? null : (barcode || null),
      brand: offProduct?.brand || undefined,
    })
    setAdded(true)
    setTimeout(() => navigate('/stock'), 900)
  }

  function resetScan() {
    setSheet(false)
    setManual(false)
    setBarcode('')
    setOffProduct(null)
    setDlcFromScan(false)
    setAdded(false)
    setDecodeError(false)
    setForm({ name: '', dlc: '', qty: '' })
  }

  return (
    <div style={{ flex: 1, position: 'relative', background: '#F2F2F7', display: 'flex', flexDirection: 'column' }}>

      {/* Hidden file input — triggers native camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        style={{ display: 'none' }}
      />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px' }}>

        {decoding ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, border: '4px solid #BBF7D0', borderTopColor: '#16A34A', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 20px' }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>Analyse de l'image…</p>
          </div>
        ) : decodeError ? (
          <div style={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertCircle size={24} color="#D97706" />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 24px' }}>Aucun code-barre détecté</p>
            <button onClick={triggerCamera} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: '#16A34A', color: '#fff', border: 'none', borderRadius: 16,
              padding: '18px', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
              boxShadow: '0 10px 28px rgba(22,163,74,.35)', marginBottom: 12,
            }}>
              <Camera size={20} />Scannez
            </button>
            <button onClick={openManual} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'transparent', color: '#6B7280', border: 'none',
              padding: '14px', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
            }}>
              <PenLine size={16} />Saisie manuelle
            </button>
          </div>
        ) : (
          // Idle state — just 2 buttons
          <div style={{ width: '100%', maxWidth: 360 }}>
            <button onClick={triggerCamera} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: '#16A34A', color: '#fff', border: 'none', borderRadius: 16,
              padding: '18px', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
              boxShadow: '0 10px 28px rgba(22,163,74,.35)', marginBottom: 12,
            }}>
              <Camera size={20} />Scannez
            </button>
            <button onClick={openManual} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'transparent', color: '#6B7280', border: 'none',
              padding: '14px', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
            }}>
              <PenLine size={16} />Saisie manuelle
            </button>
          </div>
        )}
      </div>

      {/* Bottom sheet */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: '#fff', borderRadius: '24px 24px 0 0',
        transform: sheet ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)',
        zIndex: 20,
        paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 20px)',
        overflowX: 'hidden',
        boxShadow: '0 -10px 40px rgba(0,0,0,.15)',
        boxSizing: 'border-box',
      }}>
        <div style={{ width: 36, height: 4, background: '#E5E7EB', borderRadius: 4, margin: '14px auto 0' }} />
        <div style={{ padding: '16px 20px 0', boxSizing: 'border-box' }}>

          {/* Header: title + barcode, badges below */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>
              {manual ? 'Ajout manuel' : 'Code-barre détecté'}
            </p>
            <p style={{
              fontSize: 16, fontWeight: 700, color: '#111827', margin: '2px 0 0',
              wordBreak: 'break-all',
            }}>
              {manual ? 'Nouveau produit' : barcode}
            </p>
            {!manual && !fetching && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {offProduct && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F0FDF4', borderRadius: 8, padding: '4px 10px' }}>
                    <CheckCircle size={12} color="#16A34A" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#16A34A' }}>Open Food Facts</span>
                  </div>
                )}
                {dlcFromScan && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#EFF6FF', borderRadius: 8, padding: '4px 10px' }}>
                    <Calendar size={12} color="#2563EB" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#2563EB' }}>DLC extraite</span>
                  </div>
                )}
                {!offProduct && !dlcFromScan && barcode && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#FEF3C7', borderRadius: 8, padding: '4px 10px' }}>
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
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Nom du produit</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '12px 14px', boxSizing: 'border-box' }}>
                  <Package size={16} color="#9CA3AF" style={{ flexShrink: 0 }} />
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ex. Crème fraîche épaisse"
                    style={{ flex: 1, minWidth: 0, fontSize: 14, color: '#111827', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit', padding: 0 }}
                  />
                </div>
              </div>

              {/* DLC */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Date limite de consommation</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F9FAFB', border: form.dlc ? '1.5px solid #16A34A' : '1.5px solid #E5E7EB', borderRadius: 12, padding: '12px 14px', boxSizing: 'border-box' }}>
                  <Calendar size={16} color={form.dlc ? '#16A34A' : '#9CA3AF'} style={{ flexShrink: 0 }} />
                  <input
                    type="date"
                    value={form.dlc}
                    onChange={e => setForm(f => ({ ...f, dlc: e.target.value }))}
                    style={{ flex: 1, minWidth: 0, fontSize: 14, color: form.dlc ? '#111827' : '#9CA3AF', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit', padding: 0 }}
                  />
                </div>
              </div>

              {/* Quantity + Unit — qty input + native select */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Quantité</label>
                <div style={{ display: 'flex', gap: 8, boxSizing: 'border-box' }}>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '12px 14px', boxSizing: 'border-box' }}>
                    <Hash size={16} color="#9CA3AF" style={{ flexShrink: 0 }} />
                    <input
                      value={form.qty}
                      onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
                      placeholder="1"
                      inputMode="decimal"
                      style={{ flex: 1, minWidth: 0, width: '100%', fontSize: 14, color: '#111827', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit', padding: 0 }}
                    />
                  </div>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    style={{
                      flexShrink: 0, width: 100,
                      background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 12,
                      padding: '12px 14px', fontSize: 14, fontWeight: 600, color: '#111827',
                      fontFamily: 'inherit', appearance: 'none', WebkitAppearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239CA3AF\' stroke-width=\'2.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'/%3e%3c/svg%3e")',
                      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
                      paddingRight: 32, boxSizing: 'border-box',
                    }}
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
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
                  transition: 'all .2s', marginBottom: 10, boxSizing: 'border-box',
                }}
              >
                {added ? <CheckCircle size={18} /> : <Plus size={18} />}
                {added ? 'Ajouté au stock !' : 'Ajouter au stock'}
              </button>

              <button onClick={resetScan} style={{
                width: '100%', padding: '13px', background: 'transparent', border: 'none',
                fontSize: 14, color: '#9CA3AF', fontWeight: 500, cursor: 'pointer',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}>
                Scanner un autre produit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
