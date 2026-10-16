"use client"

import { NativeSelect } from "@/components/common"
import { cn } from "@/lib/utils"
import {
  FEATURE_OPTIONS,
  RADIUS_OPTIONS,
  TYPE_OPTIONS,
  type FinderFilters,
  type StorageUnit,
} from "../entities/finder.entity"
import { PlaceSelect } from "./place-select"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="text-[11px] font-semibold tracking-[0.2em] text-white/60 uppercase">{title}</h3>
      {children}
    </section>
  )
}

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
}

const UNITS: { value: StorageUnit; label: string }[] = [
  { value: "sqft", label: "Sqft" },
  { value: "pallets", label: "Pallets" },
]

const NEAR = [
  { key: "nearPort", label: "Port" },
  { key: "nearAirport", label: "Airport" },
  { key: "nearRail", label: "Railway" },
] as const

/** The finder's filters, top to bottom in the sketch's order. */
export function FiltersPanel({
  filters,
  onChange,
  onClear,
  cities,
  citiesLoading,
}: {
  filters: FinderFilters
  onChange: (patch: Partial<FinderFilters>) => void
  onClear: () => void
  cities: string[]
  citiesLoading: boolean
}) {
  return (
    <div className="flex flex-col gap-7">
      <Section title="Place">
        <PlaceSelect cities={cities} value={filters.place} onChange={(place) => onChange({ place })} loading={citiesLoading} />
      </Section>

      <Section title="Storage need">
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            aria-label={filters.unit === "pallets" ? "Pallets needed" : "Area needed in sq ft"}
            placeholder={filters.unit === "pallets" ? "e.g. 500" : "e.g. 20000"}
            value={filters.amount ?? ""}
            onChange={(e) => {
              const v = e.target.valueAsNumber
              onChange({ amount: Number.isFinite(v) && v > 0 ? v : null })
            }}
            className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#F5B82E]/60"
          />
          <div role="radiogroup" aria-label="Unit" className="flex shrink-0 rounded-xl border border-white/10 bg-white/5 p-1">
            {UNITS.map((u) => (
              <button
                key={u.value}
                type="button"
                role="radio"
                aria-checked={filters.unit === u.value}
                onClick={() => onChange({ unit: u.value })}
                className={cn(
                  "rounded-lg px-3 text-xs font-semibold transition-colors",
                  filters.unit === u.value ? "bg-[#F5B82E] text-[#05070d]" : "text-white/60 hover:text-white",
                )}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Radius">
        <NativeSelect
          aria-label="Radius"
          value={String(filters.radiusKm)}
          onChange={(v) => onChange({ radiusKm: Number(v) })}
          options={RADIUS_OPTIONS}
          className="w-full"
          disabled={!filters.place}
        />
        {!filters.place && <p className="text-[11px] text-white/45">Pick a place to search around it.</p>}
      </Section>

      <Section title="Near">
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {NEAR.map((n) => (
            <label key={n.key} className="flex cursor-pointer items-center gap-2 text-sm text-white/85">
              <input
                type="checkbox"
                className="size-4 accent-[#F5B82E]"
                checked={filters[n.key]}
                onChange={(e) => onChange({ [n.key]: e.target.checked })}
              />
              {n.label}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Type">
        <div className="grid grid-cols-3 gap-2">
          {TYPE_OPTIONS.map((t) => {
            const on = filters.type === t.value
            return (
              <button
                key={t.value}
                type="button"
                aria-pressed={on}
                onClick={() => onChange({ type: on ? "" : t.value })}
                className={cn(
                  "h-12 rounded-xl border text-sm font-semibold transition-colors",
                  on ? "border-[#F5B82E] bg-[#F5B82E] text-[#05070d]" : "border-white/10 bg-white/5 text-white/80 hover:border-white/25",
                )}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Features">
        <div className="flex flex-wrap gap-2">
          {FEATURE_OPTIONS.map((f) => {
            const on = filters.features.includes(f.value)
            return (
              <button
                key={f.value}
                type="button"
                aria-pressed={on}
                onClick={() => onChange({ features: toggle(filters.features, f.value) })}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                  on ? "border-[#F5B82E] bg-[#F5B82E] text-[#05070d]" : "border-white/15 bg-white/5 text-white/80 hover:border-white/30",
                )}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </Section>

      <button
        type="button"
        onClick={onClear}
        className="self-start text-sm font-medium text-[#F5B82E] underline-offset-4 hover:underline"
      >
        Clear filters
      </button>
    </div>
  )
}
