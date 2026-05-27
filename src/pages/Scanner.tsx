import { useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import {
  BinaryBitmap, HTMLCanvasElementLuminanceSource,
  HybridBinarizer, GlobalHistogramBinarizer, BarcodeFormat, DecodeHintType,
} from '@zxing/library'
import { Camera, CheckCircle, Calendar, Hash, Package, Plus, PenLine, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { useSpace } from '../context/space'
import { addProduct, getOrCreateLot } from '../lib/storage'
import { useTheme } from '../context/theme'

function AnimatedCamera() {
  return (
    <div style={{ position: 'relative', width: 22, height: 22, flexShrink: 0 }}>
      <Camera size={22} color="#16A34A" strokeWidth={1.8}
        style={{ position: 'absolute', top: 0, left: 0 }} />
      <div style={{
        position: 'absolute', top: 0, left: 0,
        clipPath: 'inset(100% 0 0 0)',
        animation: 'cameraFill 0.65s ease-in-out forwards',
      }}>
        <Camera size={22} color="#16A34A" fill="#16A34A" strokeWidth={0}
          style={{ display: 'block' }} />
      </div>
    </div>
  )
}

type Product = { name: string; brand: string; quantity: string }
type FormState = { name: string; dlc: string; qty: string }

const UNITS = ['unités', 'pcs', 'boîtes', 'bouteilles', 'sachets', 'portions']

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

// ── Barcode detection ────────────────────────────────────────────
const hints = new Map<DecodeHintType, unknown>()
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
])
hints.set(DecodeHintType.TRY_HARDER, true)
const browserReader = new BrowserMultiFormatReader(hints)

function tryDecodeCanvas(canvas: HTMLCanvasElement): string | null {
  for (const mkBin of [
    (s: HTMLCanvasElementLuminanceSource) => new HybridBinarizer(s),
    (s: HTMLCanvasElementLuminanceSource) => new GlobalHistogramBinarizer(s),
  ]) {
    try {
      const lum = new HTMLCanvasElementLuminanceSource(canvas)
      const result = browserReader.decodeBitmap(new BinaryBitmap(mkBin(lum)))
      return result.getText()
    } catch { /* try next */ }
  }
  return null
}

function croppedCenter(src: HTMLCanvasElement, ratio = 0.6): HTMLCanvasElement {
  const cw = Math.round(src.width * ratio)
  const ch = Math.round(src.height * ratio)
  const x = Math.round((src.width - cw) / 2)
  const y = Math.round((src.height - ch) / 2)
  const dst = document.createElement('canvas')
  dst.width = cw; dst.height = ch
  dst.getContext('2d', { willReadFrequently: true })!
    .drawImage(src, x, y, cw, ch, 0, 0, cw, ch)
  return dst
}

async function decodeImage(file: File): Promise<string | null> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej() })

    for (const MAX of [1600, 1000, 640]) {
      const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight))
      const w = Math.round(img.naturalWidth * scale)
      const h = Math.round(img.naturalHeight * scale)

      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d', { willReadFrequently: true })!.drawImage(img, 0, 0, w, h)

      const r = tryDecodeCanvas(canvas)
      if (r) return r
      const r2 = tryDecodeCanvas(croppedCenter(canvas))
      if (r2) return r2
    }
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}
// ─────────────────────────────────────────────────────────────────

export function Scanner() {
  const navigate = useNavigate()
  const { c } = useTheme()
  const { user } = useAuth()
  const { space } = useSpace()
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
  const [addError, setAddError] = useState(false)

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
      setForm({ name: p?.name ?? '', dlc, qty: gs1.qty ?? '1' })
      setFetching(false)
    } else {
      setBarcode(raw)
      setDlcFromScan(false)
      setSheet(true)
      setFetching(true)
      const p = await fetchOpenFoodFacts(raw)
      setOffProduct(p)
      setForm({ name: p?.name ?? '', dlc: '', qty: '1' })
      setFetching(false)
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setDecodeError(false)
    setDecoding(true)
    try {
      const code = await decodeImage(file)
      if (code) void handleScannedCode(code)
      else setDecodeError(true)
    } catch {
      setDecodeError(true)
    } finally {
      setDecoding(false)
    }
  }

  function triggerCamera() { fileInputRef.current?.click() }

  function openManual() {
    setDecodeError(false)
    setBarcode('')
    setOffProduct(null)
    setDlcFromScan(false)
    setForm({ name: '', dlc: '', qty: '' })
    setManual(true)
    setSheet(true)
  }

  async function handleAdd() {
    setAddError(false)
    try {
      const qty = parseInt(form.qty.trim() || '1') || 1
      const establishmentId = user!.id
      let lot_id: string | null = null

      // Create or attach to existing lot when space is selected
      if (space?.id) {
        const lot = await getOrCreateLot({
          space_id: space.id,
          establishment_id: establishmentId,
          product_name: form.name.trim(),
          barcode: manual ? null : (barcode || null),
          dlc: form.dlc,
          quantity: qty,
        })
        lot_id = lot.id
      }

      await addProduct({
        name: form.name.trim(),
        dlc: form.dlc,
        qty: String(qty),
        unit,
        barcode: manual ? null : (barcode || null),
        brand: offProduct?.brand || undefined,
        space_id: space?.id ?? null,
        establishment_id: establishmentId,
        lot_id,
      })

      setAdded(true)
      setTimeout(() => navigate('/stock'), 900)
    } catch {
      setAddError(true)
    }
  }

  function resetScan() {
    setSheet(false)
    setManual(false)
    setBarcode('')
    setOffProduct(null)
    setDlcFromScan(false)
    setAdded(false)
    setAddError(false)
    setDecodeError(false)
    setForm({ name: '', dlc: '', qty: '' })
  }

  return (
    <div style={{ flex: 1, minHeight: 0 }}>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        style={{ display: 'none' }}
      />

      <div style={{
        position: 'fixed',
        top: 'env(safe-area-inset-top, 0px)',
        bottom: 'calc(58px + env(safe-area-inset-bottom, 16px))',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        background: c.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 28px',
        zIndex: 10,
      }}>

        {decoding ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, border: '4px solid #BBF7D0', borderTopColor: '#16A34A', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 20px' }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: c.text, margin: 0 }}>Analyse de l'image…</p>
          </div>
        ) : decodeError ? (
          <div style={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertCircle size={24} color="#D97706" />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: c.text, margin: '0 0 28px' }}>Aucun code-barre détecté</p>
            <button onClick={triggerCamera} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'transparent', color: '#16A34A',
              border: '1.5px solid #16A34A', borderRadius: 14,
              padding: '14px 32px', fontSize: 16, fontWeight: 700,
              fontFamily: 'inherit', cursor: 'pointer', marginBottom: 20,
            }}>
              <AnimatedCamera />Réessayer
            </button>
            <button onClick={openManual} style={{
              background: 'transparent', border: 'none',
              color: c.textMuted, fontSize: 14, fontWeight: 500,
              fontFamily: 'inherit', cursor: 'pointer', padding: 0,
            }}>
              Saisie manuelle
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            {/* Space indicator */}
            {space && (
              <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '6px 12px' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#16A34A' }}>
                  Espace : {space.name}
                </span>
              </div>
            )}
            <button onClick={triggerCamera} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'transparent', color: '#16A34A',
              border: '1.5px solid #16A34A', borderRadius: 14,
              padding: '14px 32px', fontSize: 16, fontWeight: 700,
              fontFamily: 'inherit', cursor: 'pointer',
            }}>
              <AnimatedCamera />Scannez
            </button>
            <button onClick={openManual} style={{
              background: 'transparent', border: 'none',
              color: c.textMuted, fontSize: 14, fontWeight: 500,
              fontFamily: 'inherit', cursor: 'pointer', padding: 0,
            }}>
              Saisie manuelle
            </button>
          </div>
        )}
      </div>

      {/* Bottom sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: sheet ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(100%)',
        width: '100%', maxWidth: 430,
        background: c.card, borderRadius: '24px 24px 0 0',
        transition: 'transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)',
        zIndex: 150,
        maxHeight: '88vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -10px 40px rgba(0,0,0,.15)',
      }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, background: c.borderStrong, borderRadius: 4, margin: '14px auto 0' }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '16px 20px', paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 20px)', boxSizing: 'border-box' }}>

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: c.textMuted, fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>
              {manual ? 'Ajout manuel' : 'Code-barre détecté'}
            </p>
            <p style={{ fontSize: 16, fontWeight: 700, color: c.text, margin: '2px 0 0', wordBreak: 'break-all' }}>
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
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: c.textSub, display: 'block', marginBottom: 6 }}>Nom du produit</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: c.input, border: `1.5px solid ${c.border}`, borderRadius: 12, padding: '12px 14px', boxSizing: 'border-box' }}>
                  <Package size={16} color={c.textMuted} style={{ flexShrink: 0 }} />
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ex. Crème fraîche épaisse"
                    style={{ flex: 1, minWidth: 0, fontSize: 14, color: c.text, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit', padding: 0 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: c.textSub, display: 'block', marginBottom: 6 }}>Date limite de consommation</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: c.input, border: form.dlc ? '1.5px solid #16A34A' : `1.5px solid ${c.border}`, borderRadius: 12, padding: '12px 14px', boxSizing: 'border-box' }}>
                  <Calendar size={16} color={form.dlc ? '#16A34A' : c.textMuted} style={{ flexShrink: 0 }} />
                  <input
                    type="date"
                    value={form.dlc}
                    onChange={e => setForm(f => ({ ...f, dlc: e.target.value }))}
                    style={{ flex: 1, minWidth: 0, fontSize: 14, color: form.dlc ? c.text : c.textMuted, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit', padding: 0 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: c.textSub, display: 'block', marginBottom: 6 }}>Nb. d'unités en stock</label>
                <div style={{ display: 'flex', gap: 8, boxSizing: 'border-box' }}>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, background: c.input, border: `1.5px solid ${c.border}`, borderRadius: 12, padding: '12px 14px', boxSizing: 'border-box' }}>
                    <Hash size={16} color={c.textMuted} style={{ flexShrink: 0 }} />
                    <input
                      value={form.qty}
                      onChange={e => setForm(f => ({ ...f, qty: e.target.value.replace(/[^0-9]/g, '') }))}
                      placeholder="1"
                      inputMode="numeric"
                      style={{ flex: 1, minWidth: 0, width: '100%', fontSize: 14, color: c.text, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit', padding: 0 }}
                    />
                  </div>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    style={{
                      flexShrink: 0, width: 110,
                      background: c.input, border: `1.5px solid ${c.border}`, borderRadius: 12,
                      padding: '12px 14px', fontSize: 14, fontWeight: 600, color: c.text,
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

              {addError && (
                <div style={{ background: '#FEF2F2', borderRadius: 10, padding: '10px 14px', marginBottom: 10 }}>
                  <p style={{ fontSize: 13, color: '#DC2626', margin: 0, fontWeight: 500 }}>Erreur lors de l'ajout. Vérifiez votre connexion.</p>
                </div>
              )}
              <button
                onClick={handleAdd}
                disabled={!form.name || !form.dlc || added}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: added ? '#16A34A' : (!form.name || !form.dlc ? c.borderStrong : '#16A34A'),
                  color: (!form.name || !form.dlc) && !added ? c.textMuted : '#fff',
                  border: 'none', borderRadius: 14, padding: '16px',
                  fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: form.name && form.dlc && !added ? 'pointer' : 'default',
                  boxShadow: form.name && form.dlc ? '0 8px 20px rgba(22,163,74,.3)' : 'none',
                  transition: 'all .2s', marginBottom: 10, boxSizing: 'border-box',
                }}
              >
                {added ? <CheckCircle size={18} /> : <Plus size={18} />}
                {added ? 'Ajouté au stock !' : 'Ajouter au stock'}
              </button>

              <button onClick={resetScan} style={{
                width: '100%', padding: '13px', background: 'transparent', border: 'none',
                fontSize: 14, color: c.textMuted, fontWeight: 500, cursor: 'pointer',
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
