"use client"

import { useId, useMemo, useState } from "react"
import { Check, MapPin } from "lucide-react"
import { GlassInput, glassSurface } from "@/components/glass"
import { cn } from "@/lib/utils"

/** A type-to-filter city list. The chosen city is `value`; typing alone doesn't pick one. */
export function CityPicker({ cities, value, onChange }: { cities: string[]; value: string; onChange: (city: string) => void }) {
  const [text, setText] = useState(value)
  const listId = useId()
  const shown = useMemo(() => {
    const q = text.trim().toLowerCase()
    return q && q !== value.toLowerCase() ? cities.filter((c) => c.toLowerCase().includes(q)) : cities
  }, [cities, text, value])

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <GlassInput
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            if (value) onChange("")
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && shown.length > 0) {
              e.preventDefault()
              setText(shown[0])
              onChange(shown[0])
            }
          }}
          placeholder="Search cities"
          aria-label="City"
          aria-controls={listId}
          className="rounded-full pl-10"
          autoFocus
        />
        <MapPin className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-glass-text-3" />
      </div>
      <ul id={listId} role="listbox" aria-label="Cities" className={cn(glassSurface({ level: "subtle" }), "max-h-64 overflow-y-auto rounded-[18px] p-1.5")}>
        {shown.length === 0 ? (
          <li className="px-3 py-2.5 text-sm text-glass-text-3">No city matches “{text.trim()}”.</li>
        ) : (
          shown.map((c) => {
            const on = c === value
            return (
              <li key={c} role="option" aria-selected={on}>
                <button
                  type="button"
                  onClick={() => {
                    setText(c)
                    onChange(c)
                  }}
                  className={cn(
                    "gl-focus flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                    on ? "gl-accent" : "border-transparent text-glass-text-2 hover:bg-white/5",
                  )}
                >
                  {c}
                  {on && <Check className="size-4" />}
                </button>
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}
