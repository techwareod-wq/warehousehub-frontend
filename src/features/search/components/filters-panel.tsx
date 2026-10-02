"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button, Input } from "@/components/ui"
import { Checkbox } from "@/components/common"
import { unitLabel } from "@/lib/units"
import { cn } from "@/lib/utils"
import type { FilterCatalog, MinMax, SearchQuery, SearchResult } from "../entities/search.entity"

function NumberInput({ value, onCommit, placeholder }: { value?: number; onCommit: (v?: number) => void; placeholder: string }) {
  const [text, setText] = useState(value === undefined ? "" : String(value))
  const [shown, setShown] = useState(value)
  if (shown !== value) {
    setShown(value)
    setText(value === undefined ? "" : String(value))
  }
  const commit = () => {
    const t = text.trim()
    const n = t === "" ? undefined : Number(t)
    if (n === undefined || Number.isFinite(n)) onCommit(n)
  }
  return (
    <Input
      inputMode="decimal"
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
      className="h-8"
    />
  )
}

function MinMaxRow({ label, unit, value, onChange }: { label: string; unit?: string; value: MinMax; onChange: (v: MinMax) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium">
        {label}
        {unit && <span className="font-normal text-muted-foreground"> ({unit})</span>}
      </span>
      <div className="flex items-center gap-2">
        <NumberInput value={value.min} placeholder="Min" onCommit={(min) => onChange({ ...value, min })} />
        <span className="text-muted-foreground">–</span>
        <NumberInput value={value.max} placeholder="Max" onCommit={(max) => onChange({ ...value, max })} />
      </div>
    </div>
  )
}

/**
 * Filters generated from the admin's attribute setup (GET /v1/public/catalog):
 * chip rows, numeric ranges and industries, with live counts from the last
 * result's facets. Zero-count chips are greyed out (D-072).
 */
export function FiltersPanel({
  catalog,
  query,
  result,
  onChange,
}: {
  catalog: FilterCatalog
  query: SearchQuery
  result: SearchResult | null
  onChange: (q: SearchQuery) => void
}) {
  const set = (patch: Partial<SearchQuery>) => onChange({ ...query, ...patch, page: 1 })
  const toggle = (list: string[], key: string) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key])
  const active =
    query.chips.length +
    query.industries.length +
    Object.values(query.ranges).filter((r) => r.min !== undefined || r.max !== undefined).length +
    (query.areaSqft.min !== undefined || query.areaSqft.max !== undefined ? 1 : 0) +
    (query.pricePerSqft.min !== undefined || query.pricePerSqft.max !== undefined ? 1 : 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filters</h2>
        {active > 0 && (
          <Button
            size="xs"
            variant="ghost"
            onClick={() => set({ chips: [], industries: [], ranges: {}, areaSqft: {}, pricePerSqft: {}, includeUnverified: false })}
          >
            <X /> Clear {active}
          </Button>
        )}
      </div>

      <MinMaxRow label="Total area" unit="sq ft" value={query.areaSqft} onChange={(areaSqft) => set({ areaSqft })} />
      <MinMaxRow label="Rent" unit="₹ / sq ft / month" value={query.pricePerSqft} onChange={(pricePerSqft) => set({ pricePerSqft })} />

      {catalog.industries.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium">Suitable for</span>
          <div className="flex flex-wrap gap-1.5">
            {catalog.industries.map((ind) => {
              const on = query.industries.includes(ind.key)
              const count = result?.facets.industries[ind.key]
              return (
                <button
                  key={ind.key}
                  type="button"
                  onClick={() => set({ industries: toggle(query.industries, ind.key) })}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
                  )}
                >
                  {ind.name}
                  {count && !on && <span className="ml-1 opacity-60">{count.fit}</span>}
                </button>
              )
            })}
          </div>
          {query.industries.length > 0 && (
            <Checkbox
              checked={query.includeUnverified}
              onChange={(includeUnverified) => set({ includeUnverified })}
              label="Include listings we haven't verified yet"
              className="text-xs"
            />
          )}
        </div>
      )}

      {catalog.chipRows.map((row) => (
        <div key={row.row} className="flex flex-col gap-2">
          <span className="text-xs font-medium capitalize">{row.row.replace(/_/g, " ")}</span>
          <div className="flex flex-wrap gap-1.5">
            {row.chips.map((chip) => {
              const on = query.chips.includes(chip.key)
              const count = result?.facets.chips[chip.key]
              const dead = !on && result !== null && (count ?? 0) === 0
              return (
                <button
                  key={chip.key}
                  type="button"
                  disabled={dead}
                  onClick={() => set({ chips: toggle(query.chips, chip.key) })}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
                    dead && "cursor-not-allowed opacity-40 hover:bg-transparent",
                  )}
                >
                  {chip.label}
                  {!on && count !== undefined && <span className="ml-1 opacity-60">{count}</span>}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {catalog.ranges
        .filter((r) => r.key !== "warehouse.total_area")
        .map((r) => (
          <MinMaxRow
            key={r.key}
            label={r.label}
            unit={unitLabel(r.unit) || undefined}
            value={query.ranges[r.key] ?? {}}
            onChange={(v) => set({ ranges: { ...query.ranges, [r.key]: v } })}
          />
        ))}
    </div>
  )
}
