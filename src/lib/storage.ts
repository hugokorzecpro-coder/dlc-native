import { supabase } from './supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export type StoredProduct = {
  id: string
  name: string
  dlc: string
  qty: string
  unit: string
  barcode: string | null
  brand?: string
  addedAt: string
  lot_id?: string | null
  space_id?: string | null
  establishment_id?: string | null
  category?: string | null
  status?: string
}

export type Lot = {
  id: string
  space_id: string
  establishment_id: string
  product_name: string
  barcode: string | null
  quantity_initial: number
  quantity_remaining: number
  dlc: string
  status: 'open' | 'closed'
  closed_at: string | null
  created_at: string
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function fromRow(row: Record<string, unknown>): StoredProduct {
  return {
    id: row.id as string,
    name: row.name as string,
    dlc: row.dlc as string,
    qty: row.qty as string,
    unit: row.unit as string,
    barcode: row.barcode as string | null,
    brand: row.brand as string | undefined,
    addedAt: (row.added_at ?? row.scanned_at ?? '') as string,
    lot_id: row.lot_id as string | null,
    space_id: row.space_id as string | null,
    establishment_id: row.establishment_id as string | null,
    category: row.category as string | null,
    status: (row.status ?? 'active') as string,
  }
}

function lotFromRow(row: Record<string, unknown>): Lot {
  return {
    id: row.id as string,
    space_id: row.space_id as string,
    establishment_id: row.establishment_id as string,
    product_name: row.product_name as string,
    barcode: row.barcode as string | null,
    quantity_initial: row.quantity_initial as number,
    quantity_remaining: row.quantity_remaining as number,
    dlc: row.dlc as string,
    status: row.status as 'open' | 'closed',
    closed_at: row.closed_at as string | null,
    created_at: row.created_at as string,
  }
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(spaceId?: string | null): Promise<StoredProduct[]> {
  let q = supabase
    .from('products')
    .select('*')
    .neq('status', 'consumed')

  if (spaceId) {
    // Show products for this space + legacy products without space_id
    q = q.or(`space_id.eq.${spaceId},space_id.is.null`)
  }
  // null spaceId = admin mode, no space filter

  const { data, error } = await q.order('added_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function addProduct(
  p: Omit<StoredProduct, 'id' | 'addedAt'>
): Promise<StoredProduct> {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: p.name,
      dlc: p.dlc,
      qty: p.qty,
      unit: p.unit,
      barcode: p.barcode,
      brand: p.brand,
      user_id: user!.id,
      space_id: p.space_id ?? null,
      establishment_id: p.establishment_id ?? user!.id,
      category: p.category ?? null,
      lot_id: p.lot_id ?? null,
      status: 'active',
      scanned_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return fromRow(data)
}

export async function removeProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

export async function consumeProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ status: 'consumed' })
    .eq('id', id)
  if (error) throw error
}

// ─── Lots ─────────────────────────────────────────────────────────────────────

export async function getLots(spaceId: string): Promise<Lot[]> {
  const { data, error } = await supabase
    .from('lots')
    .select('*')
    .eq('space_id', spaceId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(lotFromRow)
}

export async function getOrCreateLot(params: {
  space_id: string
  establishment_id: string
  product_name: string
  barcode: string | null
  dlc: string
  quantity: number
}): Promise<Lot> {
  // Look for an open lot with same space + (barcode or name) + dlc
  const match = params.barcode
    ? supabase.from('lots').select('*')
        .eq('space_id', params.space_id)
        .eq('barcode', params.barcode)
        .eq('dlc', params.dlc)
        .eq('status', 'open')
        .limit(1)
    : supabase.from('lots').select('*')
        .eq('space_id', params.space_id)
        .eq('product_name', params.product_name)
        .eq('dlc', params.dlc)
        .eq('status', 'open')
        .limit(1)

  const { data: existing } = await match

  if (existing && existing.length > 0) {
    const lot = existing[0] as Record<string, unknown>
    const newQty = (lot.quantity_initial as number) + params.quantity
    const newRemaining = (lot.quantity_remaining as number) + params.quantity
    const { data, error } = await supabase
      .from('lots')
      .update({ quantity_initial: newQty, quantity_remaining: newRemaining })
      .eq('id', lot.id as string)
      .select()
      .single()
    if (error) throw error
    return lotFromRow(data)
  }

  const { data, error } = await supabase
    .from('lots')
    .insert({
      space_id: params.space_id,
      establishment_id: params.establishment_id,
      product_name: params.product_name,
      barcode: params.barcode,
      quantity_initial: params.quantity,
      quantity_remaining: params.quantity,
      dlc: params.dlc,
      status: 'open',
    })
    .select()
    .single()
  if (error) throw error
  return lotFromRow(data)
}

export async function closeLot(lotId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()

  // Mark lot as closed
  const { error: lotErr } = await supabase
    .from('lots')
    .update({ status: 'closed', closed_at: new Date().toISOString(), closed_by: user?.id ?? null, quantity_remaining: 0 })
    .eq('id', lotId)
  if (lotErr) throw lotErr

  // Mark all products in this lot as consumed
  const { error: prodErr } = await supabase
    .from('products')
    .update({ status: 'consumed' })
    .eq('lot_id', lotId)
  if (prodErr) throw prodErr
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  return new Date(isoDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
