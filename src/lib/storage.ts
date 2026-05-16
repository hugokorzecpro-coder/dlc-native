export type StoredProduct = {
  id: string
  name: string
  dlc: string // ISO date YYYY-MM-DD
  qty: string
  unit: string
  barcode: string | null
  brand?: string
  addedAt: string // ISO datetime
}

const KEY = 'dlc-products'

export function getProducts(): StoredProduct[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function addProduct(p: Omit<StoredProduct, 'id' | 'addedAt'>): StoredProduct {
  const product: StoredProduct = {
    ...p,
    id: crypto.randomUUID(),
    addedAt: new Date().toISOString(),
  }
  const all = getProducts()
  localStorage.setItem(KEY, JSON.stringify([product, ...all]))
  return product
}

export function removeProduct(id: string) {
  const all = getProducts().filter(p => p.id !== id)
  localStorage.setItem(KEY, JSON.stringify(all))
}

export function daysUntil(isoDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(isoDate)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

export function statusFromDLC(isoDate: string): 'j1' | 'j2' | 'j5' | 'ok' | 'expired' {
  const d = daysUntil(isoDate)
  if (d < 0) return 'expired'
  if (d <= 1) return 'j1'
  if (d <= 2) return 'j2'
  if (d <= 5) return 'j5'
  return 'ok'
}

export function formatDLC(isoDate: string): string {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
