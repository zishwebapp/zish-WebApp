import type { ApiResponse } from './types'
import type { DateRangeParams } from './inventory-api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export interface DashboardSummaryDto {
  today: {
    sales: number
    inventory_expense: number
    net_profit: number
  }
  period: {
    range: string
    start: string
    end: string
    sales: number
    inventory_expense: number
    net_profit: number
  }
  pending_inventory: {
    count: number
    amount: number
  }
  purchased_inventory: {
    count: number
    amount: number
  }
}

/** Shared SWR key builder — used by the dashboard cards AND by the
 * Inventory/Sales tabs to invalidate the cards after a mutation, so they
 * stay in sync without prop-drilling a refetch callback everywhere. */
export function dashboardSummaryKey(params: DateRangeParams) {
  return ["dashboard-summary", params.range, params.start, params.end] as const
}

export async function fetchDashboardSummary(params: DateRangeParams): Promise<DashboardSummaryDto> {
  const qs = new URLSearchParams()
  qs.set('range', params.range)
  if (params.start) qs.set('start', params.start)
  if (params.end) qs.set('end', params.end)

  const res = await fetch(`${API_BASE_URL}/dashboard/summary?${qs.toString()}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data: ApiResponse<DashboardSummaryDto> = await res.json()
  if (!data.success) throw new Error(data.message || 'Failed to load dashboard summary')
  return data.data
}
