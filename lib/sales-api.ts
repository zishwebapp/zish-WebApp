import type { ApiResponse } from './types'
import type { DateRangeParams } from './inventory-api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export interface SaleDto {
  id: string
  amount: number
  sale_date: string
  notes: string
  created_by: string
  created_at: string
}

export async function fetchSales(params?: Partial<DateRangeParams> & { search?: string }): Promise<SaleDto[]> {
  const qs = new URLSearchParams()
  if (params?.range) qs.set('range', params.range)
  if (params?.start) qs.set('start', params.start)
  if (params?.end) qs.set('end', params.end)
  if (params?.search) qs.set('search', params.search)
  const s = qs.toString()

  const res = await fetch(`${API_BASE_URL}/sales${s ? `?${s}` : ''}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data: ApiResponse<SaleDto[]> = await res.json()
  if (!data.success) throw new Error(data.message || 'Failed to load sales')
  return data.data
}

export async function createSale(payload: {
  amount: number
  sale_date?: string
  notes?: string
  created_by?: string
}): Promise<SaleDto> {
  const res = await fetch(`${API_BASE_URL}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data: ApiResponse<SaleDto> = await res.json()
  if (!data.success) throw new Error(data.message || 'Failed to log sale')
  return data.data
}

export async function deleteSale(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/sales/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}
