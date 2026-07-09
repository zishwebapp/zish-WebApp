"use client"

import useSWR from "swr"
import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, Package, TrendingUp, Clock, CheckCircle } from "lucide-react"
import { fetchDashboardSummary, dashboardSummaryKey } from "@/lib/dashboard-api"
import type { DateRangeParams } from "@/lib/inventory-api"

interface InventorySalesDashboardProps {
  dateRangeParams: DateRangeParams
  isReady: boolean
}

function formatCurrency(value: number | undefined) {
  return `₹${(value ?? 0).toFixed(2)}`
}

function periodLabel(range: DateRangeParams["range"]) {
  if (range === "week") return "This Week"
  if (range === "custom") return "Selected Period"
  return "This Month"
}

export function InventorySalesDashboard({ dateRangeParams, isReady }: InventorySalesDashboardProps) {
  const { data, isLoading } = useSWR(
    isReady ? dashboardSummaryKey(dateRangeParams) : null,
    () => fetchDashboardSummary(dateRangeParams)
  )

  const label = periodLabel(dateRangeParams.range)

  const moneyCards = [
    { key: "today-sales", label: "Today's Sales", value: data?.today.sales, icon: DollarSign, color: "text-green-600" },
    { key: "today-expense", label: "Today's Inventory Expense", value: data?.today.inventory_expense, icon: Package, color: "text-red-600" },
    { key: "today-profit", label: "Today's Net Profit", value: data?.today.net_profit, icon: TrendingUp, color: "text-blue-600" },
    { key: "period-sales", label: `${label} Sales`, value: data?.period.sales, icon: DollarSign, color: "text-green-600" },
    { key: "period-expense", label: `${label} Inventory Expense`, value: data?.period.inventory_expense, icon: Package, color: "text-red-600" },
    { key: "period-profit", label: `${label} Net Profit`, value: data?.period.net_profit, icon: TrendingUp, color: "text-blue-600" },
  ]

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {moneyCards.map((card) => (
          <Card key={card.key}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs font-medium text-gray-600 mb-1 truncate">{card.label}</p>
                  <p className={`text-base sm:text-2xl font-bold truncate ${card.color}`}>
                    {isLoading ? "…" : formatCurrency(card.value)}
                  </p>
                </div>
                <card.icon className={`h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 ${card.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-medium text-gray-600 mb-1">Pending Inventory</p>
                <p className="text-base sm:text-2xl font-bold text-yellow-600">
                  {isLoading ? "…" : data?.pending_inventory.count ?? 0}
                </p>
                <p className="text-[11px] text-gray-500 truncate">{formatCurrency(data?.pending_inventory.amount)}</p>
              </div>
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-medium text-gray-600 mb-1 truncate">Purchased ({label})</p>
                <p className="text-base sm:text-2xl font-bold text-green-600">
                  {isLoading ? "…" : data?.purchased_inventory.count ?? 0}
                </p>
                <p className="text-[11px] text-gray-500 truncate">{formatCurrency(data?.purchased_inventory.amount)}</p>
              </div>
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
