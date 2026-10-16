"use client"

import { useId, useMemo, useState } from "react"
import { Check, ChevronDown, MapPin, X } from "lucide-react"
import { cn } from "@/lib/utils"

/** A type-to-filter dropdown of cities. Typing alone doesn't choose one. */
export function PlaceSelect({
  cities,
  value,
  onChange,
  loading,
}: {
  cities: string[]
  value: string
  onChange: (city: string) => void
  loading?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [active, setActive] = useState(0)
  const listId = useId()
  const shown = useMemo(() => {
    const q = text.trim().toLowerCase()
    return q ? cities.filter((c) => c.toLowerCase().includes(q)) : cities
  }, [cities, text])

  const pick = (c: string) => {
    onChange(c)
    setText("")
    setOpen(false)
  }

  return (
    <div className="relative">
      <MapPin className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/50" />
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label="Place"
        value={open ? text : value}
        placeholder={loading ? "Loading cities…" : value || "All places"}
        onFocus={() => {
          setText("")
          setActive(0)
          setOpen(true)
        }}
        onBlur={() => setOpen(false)}
        onChange={(e) => {
          setText(e.target.value)
          setActive(0)
          setOpen(true)
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault()
            setActive((i) => Math.min(i + 1, shown.length - 1))
          } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setActive((i) => Math.max(i - 1, 0))
          } else if (e.key === "Enter" && open && shown[active]) {
            e.preventDefault()
            pick(shown[active])
            e.currentTarget.blur()
          } else if (e.key === "Escape") {
            setOpen(false)
            e.currentTarget.blur()
          }
        }}
        className="h-11 w-full rounded-xl border border-white/10 bg-white/5 pr-9 pl-10 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#F5B82E]/60"
      />
      {value && !open ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={`Clear place (${value})`}
          title="All places"
          className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" />
        </button>
      ) : (
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-white/50" />
      )}
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Cities"
          className="absolute inset-x-0 top-full z-30 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-site-panel p-1 shadow-2xl"
        >
          {shown.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">{loading ? "Loading…" : "No city matches."}</li>
          ) : (
            shown.map((c, i) => (
              <li key={c} role="option" aria-selected={c === value}>
                <button
                  type="button"
                  // Keep focus in the input so blur doesn't close before the click lands.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(c)}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm",
                    i === active ? "bg-white/10 text-white" : "text-white/80",
                    c === value && "text-[#F5B82E]",
                  )}
                >
                  {c}
                  {c === value && <Check className="size-4" />}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
