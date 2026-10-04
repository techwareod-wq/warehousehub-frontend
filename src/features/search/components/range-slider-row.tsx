"use client"

import { useState } from "react"
import { Slider } from "@/components/ui"
import type { Bounds, MinMax } from "../entities/search.entity"
import { MinMaxRow } from "./min-max-row"

/** A round step giving ~100 positions across the span (1, 2 or 5 × a power of ten). */
function niceStep(span: number): number {
  const raw = span / 100
  const pow = 10 ** Math.floor(Math.log10(raw))
  const m = raw / pow
  return (m < 2 ? 1 : m < 5 ? 2 : 5) * pow
}

function fmt(v: number): string {
  return Number(v.toFixed(2)).toLocaleString("en-IN")
}

/**
 * A two-thumb bar over the values seen in results; the search runs when a
 * thumb is let go. A thumb left at its end means "no limit" on that side.
 * Without known bounds it falls back to min – max boxes.
 */
export function RangeSliderRow({
  label,
  unit,
  value,
  bounds,
  onChange,
}: {
  label: string
  unit?: string
  value: MinMax
  bounds: Bounds | null
  onChange: (v: MinMax) => void
}) {
  // The bar always covers the current selection, even past the seen values.
  const lo = bounds ? Math.min(bounds.min, value.min ?? bounds.min) : 0
  const hi = bounds ? Math.max(bounds.max, value.max ?? bounds.max) : 0
  const from = value.min ?? lo
  const to = value.max ?? hi
  const [draft, setDraft] = useState<number[]>([from, to])
  const [draftFor, setDraftFor] = useState(`${from}~${to}`)
  if (draftFor !== `${from}~${to}`) {
    setDraftFor(`${from}~${to}`)
    setDraft([from, to])
  }

  if (!bounds || lo >= hi) return <MinMaxRow label={label} unit={unit} value={value} onChange={onChange} />

  const step = niceStep(hi - lo)
  const [a, b] = draft
  const any = a <= lo && b >= hi
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium">
          {label}
          {unit && <span className="font-normal text-muted-foreground"> ({unit})</span>}
        </span>
        <span className="shrink-0 text-muted-foreground tabular-nums">{any ? "Any" : `${fmt(a)} – ${fmt(b)}`}</span>
      </div>
      <Slider
        min={lo}
        max={hi}
        step={step}
        value={draft}
        minStepsBetweenValues={0}
        onValueChange={(v) => setDraft([...(v as readonly number[])])}
        onValueCommitted={(v) => {
          const [x, y] = v as readonly number[]
          onChange({ min: x <= lo ? undefined : x, max: y >= hi ? undefined : y })
        }}
        getAriaLabel={(i) => `${label} ${i === 0 ? "minimum" : "maximum"}`}
      />
      <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>{fmt(lo)}</span>
        <span>{fmt(hi)}</span>
      </div>
    </div>
  )
}
