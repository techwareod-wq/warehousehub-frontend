"use client"

// EXPLORE-FILTERS: redesigned as glass sections (Location, Space, Near, Type, Features).

import { ChevronDown } from "lucide-react"
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
    <section className="flex flex-col gap-3" aria-label={title}>
      <h3 className="text-xs font-semibold tracking-[0.14em] text-white/70 uppercase">{title}</h3>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-white/70">{label}</span>
      {children}
    </label>
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

/** The finder's filters, grouped into sections. Every change applies at once. */
export function FiltersPanel({
  filters,
  onChange,
  onClear,
  cities,
  citiesLoading,
}: {
  filters: FinderFilters
  onChange: (patch: Partial<FinderFilters>) => void
  /** Renders a "Clear filters" link at the bottom (callers with a header put it there instead). */
  onClear?: () => void
  cities: string[]
  citiesLoading: boolean
}) {
  return (
    <div className="flex flex-col gap-7">
      <Section title="Location">
        <Field label="Place">
          <PlaceSelect cities={cities} value={filters.place} onChange={(place) => onChange({ place })} loading={citiesLoading} />
        </Field>
        <Field label="Radius">
          <span className="relative">
            <select
              value={String(filters.radiusKm)}
              onChange={(e) => onChange({ radiusKm: Number(e.target.value) })}
              disabled={!filters.place}
              className="xf-input h-11 w-full appearance-none rounded-[14px] pr-10 pl-4 text-sm outline-none"
            >
              {RADIUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-white/60" />
          </span>
          {!filters.place && <span className="text-xs text-white/60">Pick a place to search around it.</span>}
        </Field>
      </Section>

      <Section title="Space">
        <Field label="Storage need">
          <span className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              placeholder={filters.unit === "pallets" ? "e.g. 500" : "e.g. 20000"}
              value={filters.amount ?? ""}
              onChange={(e) => {
                const v = e.target.valueAsNumber
                onChange({ amount: Number.isFinite(v) && v > 0 ? v : null })
              }}
              className="xf-input h-11 min-w-0 flex-1 rounded-[14px] px-4 text-sm outline-none"
            />
            <span role="radiogroup" aria-label="Unit" className="xf-seg flex shrink-0 gap-0.5 rounded-full p-1">
              {UNITS.map((u) => (
                <button
                  key={u.value}
                  type="button"
                  role="radio"
                  aria-checked={filters.unit === u.value}
                  onClick={() => onChange({ unit: u.value })}
                  className="rounded-full px-3 text-xs font-semibold"
                >
                  {u.label}
                </button>
              ))}
            </span>
          </span>
        </Field>
      </Section>

      <Section title="Near">
        <div className="flex flex-wrap gap-2">
          {NEAR.map((n) => (
            <button
              key={n.key}
              type="button"
              aria-pressed={filters[n.key]}
              onClick={() => onChange({ [n.key]: !filters[n.key] })}
              className="xf-pill h-9 rounded-full px-4 text-sm font-medium"
            >
              {n.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Type">
        <div role="group" aria-label="Warehouse type" className="xf-seg grid grid-cols-3 gap-0.5 rounded-full p-1">
          {TYPE_OPTIONS.map((t) => {
            const on = filters.type === t.value
            return (
              <button
                key={t.value}
                type="button"
                aria-pressed={on}
                title={on ? "Tap again to clear" : undefined}
                onClick={() => onChange({ type: on ? "" : t.value })}
                className="h-9 rounded-full text-sm font-semibold"
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Features">
        <div className="flex flex-wrap gap-2">
          {FEATURE_OPTIONS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filters.features.includes(f.value)}
              onClick={() => onChange({ features: toggle(filters.features, f.value) })}
              className="xf-pill rounded-full px-3.5 py-1.5 text-sm"
            >
              {f.label}
            </button>
          ))}
        </div>
      </Section>

      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="self-start rounded-md text-sm font-medium text-[#f9cc63] underline-offset-4 hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
