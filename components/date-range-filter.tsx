"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { DateRangeFilter as RangeType } from "@/lib/inventory-api"

interface DateRangeFilterBarProps {
  range: RangeType
  onRangeChange: (r: RangeType) => void
  customStart: string
  customEnd: string
  onCustomStartChange: (v: string) => void
  onCustomEndChange: (v: string) => void
}

const PRESETS: { value: RangeType; label: string }[] = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "custom", label: "Custom" },
]

export function DateRangeFilterBar({
  range,
  onRangeChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
}: DateRangeFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
      <div className="grid grid-cols-3 sm:flex gap-2 w-full sm:w-auto">
        {PRESETS.map((preset) => (
          <Button
            key={preset.value}
            type="button"
            size="sm"
            variant={range === preset.value ? "default" : "outline"}
            onClick={() => onRangeChange(preset.value)}
            className="w-full sm:w-auto"
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {range === "custom" && (
        <div className="flex gap-2 w-full sm:w-auto">
          <Input
            type="date"
            value={customStart}
            onChange={(e) => onCustomStartChange(e.target.value)}
            className="w-full sm:w-auto"
            aria-label="Start date"
          />
          <Input
            type="date"
            value={customEnd}
            onChange={(e) => onCustomEndChange(e.target.value)}
            className="w-full sm:w-auto"
            aria-label="End date"
          />
        </div>
      )}
    </div>
  )
}
