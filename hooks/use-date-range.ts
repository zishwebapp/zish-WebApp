"use client"

import { useState } from "react"
import type { DateRangeFilter, DateRangeParams } from "@/lib/inventory-api"

/**
 * Shared date-filter state for the Inventory/Sales/Dashboard tabs.
 * One hook instance, lifted to the admin page and passed down, so switching
 * "This Week" -> "This Month" refreshes every tab's data from the same source.
 */
export function useDateRange(initial: DateRangeFilter = "month") {
  const [range, setRange] = useState<DateRangeFilter>(initial)
  const [customStart, setCustomStart] = useState<string>("")
  const [customEnd, setCustomEnd] = useState<string>("")

  const params: DateRangeParams = {
    range,
    ...(range === "custom" ? { start: customStart, end: customEnd } : {}),
  }

  // For "custom", wait until both dates are picked before querying.
  const isReady = range !== "custom" || Boolean(customStart && customEnd)

  return { range, setRange, customStart, setCustomStart, customEnd, setCustomEnd, params, isReady }
}
