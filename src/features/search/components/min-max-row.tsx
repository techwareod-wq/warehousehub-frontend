"use client"

import { useState } from "react"
import { Input } from "@/components/ui"
import type { MinMax } from "../entities/search.entity"

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

/** Min – max inputs; each side commits on blur / Enter. */
export function MinMaxRow({ label, unit, value, onChange }: { label?: string; unit?: string; value: MinMax; onChange: (v: MinMax) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-xs font-medium">
          {label}
          {unit && <span className="font-normal text-muted-foreground"> ({unit})</span>}
        </span>
      )}
      <div className="flex items-center gap-2">
        <NumberInput value={value.min} placeholder="Min" onCommit={(min) => onChange({ ...value, min })} />
        <span className="text-muted-foreground">–</span>
        <NumberInput value={value.max} placeholder="Max" onCommit={(max) => onChange({ ...value, max })} />
        {!label && unit && <span className="shrink-0 text-xs text-muted-foreground">{unit}</span>}
      </div>
    </div>
  )
}
