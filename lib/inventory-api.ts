import type { ApiResponse } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export type InventoryEntryStatus = 'pending' | 'purchased'

export interface InventoryEntryDto {
  id: string
  item_name: string
  quantity: number
  total_cost: number
  entry_date: string
  status: InventoryEntryStatus
  purchased_at: string | null
  created_by: string
}

export type DateRangeFilter = 'week' | 'month' | 'custom'

export interface DateRangeParams {
  range: DateRangeFilter
  start?: string // required when range === 'custom' (YYYY-MM-DD)
  end?: string
}

function rangeQuery(params?: Partial<DateRangeParams> & { status?: string; search?: string }): string {
  const qs = new URLSearchParams()
  if (params?.range) qs.set('range', params.range)
  if (params?.start) qs.set('start', params.start)
  if (params?.end) qs.set('end', params.end)
  if (params?.status) qs.set('status', params.status)
  if (params?.search) qs.set('search', params.search)
  const s = qs.toString()
  return s ? `?${s}` : ''
}

export async function fetchInventoryEntries(
  params?: Partial<DateRangeParams> & { status?: InventoryEntryStatus | 'all'; search?: string }
): Promise<InventoryEntryDto[]> {
  const res = await fetch(`${API_BASE_URL}/inventory/entries${rangeQuery(params)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data: ApiResponse<InventoryEntryDto[]> = await res.json()
  if (!data.success) throw new Error(data.message || 'Failed to load inventory entries')
  return data.data
}

export async function createInventoryEntry(payload: {
  item_name: string
  quantity: number
  total_cost: number
  entry_date?: string
  status?: InventoryEntryStatus
  created_by?: string
}): Promise<InventoryEntryDto> {
  const res = await fetch(`${API_BASE_URL}/inventory/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data: ApiResponse<InventoryEntryDto> = await res.json()
  if (!data.success) throw new Error(data.message || 'Failed to add inventory entry')
  return data.data
}

export async function updateInventoryEntry(
  id: string,
  payload: Partial<Pick<InventoryEntryDto, 'item_name' | 'quantity' | 'total_cost' | 'entry_date' | 'status'>>
): Promise<InventoryEntryDto> {
  const res = await fetch(`${API_BASE_URL}/inventory/entries/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data: ApiResponse<InventoryEntryDto> = await res.json()
  if (!data.success) throw new Error(data.message || 'Failed to update inventory entry')
  return data.data
}

export async function markInventoryEntryPurchased(id: string): Promise<InventoryEntryDto> {
  const res = await fetch(`${API_BASE_URL}/inventory/entries/${id}/purchase`, { method: 'PATCH' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data: ApiResponse<InventoryEntryDto> = await res.json()
  if (!data.success) throw new Error(data.message || 'Failed to mark entry as purchased')
  return data.data
}

export async function deleteInventoryEntry(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/inventory/entries/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

export async function duplicateInventoryEntry(id: string): Promise<InventoryEntryDto> {
  const res = await fetch(`${API_BASE_URL}/inventory/entries/${id}/duplicate`, { method: 'POST' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data: ApiResponse<InventoryEntryDto> = await res.json()
  if (!data.success) throw new Error(data.message || 'Failed to duplicate inventory entry')
  return data.data
}
