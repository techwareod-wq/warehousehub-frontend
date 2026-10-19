"use client"

// EXPLORE-FILTERS: redesigned as glass sections (Location, Space, Near, Type, Features),
// with larger controls, active-section dots and a removable active-filters row.

import { Check, ChevronDown, X } from "lucide-react"
import { formatNumber } from "@/lib/format"
import {
  EMPTY_FILTERS,
  FEATURE_OPTIONS,
  RADIUS_OPTIONS,
  TYPE_LABELS,
  TYPE_OPTIONS,
  type FinderFilters,
  type StorageUnit,
} from "../entities/finder.entity"
import { PlaceSelect } from "./place-select"

function Section({ title, active, children }: { title: string; active: boolean; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3.5" aria-label={title}>
      <h3 className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.14em] text-white/90 uppercase">
        {title}
        {active && (
          <span className="size-1.5 rounded-full bg-[#F5B82E] shadow-[0_0_8px_rgb(245_184_46/80%)]">
            <span className="sr-only">(active)</span>
          </span>
        )}
      </h3>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-white/80">{label}</span>
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

/** One removable entry per active filter; `clear` is null for the radius at its default (it only qualifies the place). */
function activeChips(f: FinderFilters): { key: string; label: string; clear: Partial<FinderFilters> | null }[] {
  const chips: { key: string; label: string; clear: Partial<FinderFilters> | null }[] = []
  if (f.place) {
    chips.push({ key: "place", label: f.place, clear: { place: "" } })
    const radius = RADIUS_OPTIONS.find((o) => o.value === String(f.radiusKm))
    if (radius) chips.push({ key: "radius", label: radius.label, clear: f.radiusKm === EMPTY_FILTERS.radiusKm ? null : { radiusKm: EMPTY_FILTERS.radiusKm } })
  }
  if (f.amount !== null) chips.push({ key: "amount", label: `${formatNumber(f.amount)} ${f.unit === "pallets" ? "pallets" : "sqft"}`, clear: { amount: null } })
  if (f.type) chips.push({ key: "type", label: TYPE_LABELS[f.type] ?? f.type, clear: { type: "" } })
  for (const n of NEAR) if (f[n.key]) chips.push({ key: n.key, label: n.label, clear: { [n.key]: false } })
  for (const o of FEATURE_OPTIONS) {
    if (f.features.includes(o.value)) chips.push({ key: o.value, label: o.label, clear: { features: f.features.filter((x) => x !== o.value) } })
  }
  return chips
}

/** EXPLORE-FILTERS: a gold chip per active filter; each "x" removes just that one. Renders nothing when none are active. */
export function ActiveFilters({ filters, onChange }: { filters: FinderFilters; onChange: (patch: Partial<FinderFilters>) => void }) {
  const chips = activeChips(filters)
  if (!chips.length) return null
  return (
    <ul aria-label="Active filters" className="flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <li key={c.key} className="xf-chip inline-flex h-8 items-center gap-1 rounded-full pr-1 pl-3 text-[13px] font-semibold">
          {c.label}
          {c.clear ? (
            <button
              type="button"
              onClick={() => onChange(c.clear!)}
              aria-label={`Remove ${c.label}`}
              className="flex size-6 items-center justify-center rounded-full"
            >
              <X aria-hidden className="size-3.5" />
            </button>
          ) : (
            <span className="w-2" title="Default radius around the place" />
          )}
        </li>
      ))}
    </ul>
  )
}

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
      <Section title="Location" active={!!filters.place}>
        <Field label="Place">
          <PlaceSelect cities={cities} value={filters.place} onChange={(place) => onChange({ place })} loading={citiesLoading} />
        </Field>
        <Field label="Radius">
          <span className="relative">
            <select
              value={String(filters.radiusKm)}
              onChange={(e) => onChange({ radiusKm: Number(e.target.value) })}
              disabled={!filters.place}
              className="xf-input h-12 w-full appearance-none rounded-[14px] pr-10 pl-4 text-base outline-none"
            >
              {RADIUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-white/60" />
          </span>
          {!filters.place && <span className="text-xs text-white/65">Pick a place to search around it.</span>}
        </Field>
      </Section>

      <Section title="Space" active={filters.amount !== null}>
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
              className="xf-input h-12 min-w-0 flex-1 rounded-[14px] px-4 text-base outline-none"
            />
            <span role="radiogroup" aria-label="Unit" className="xf-seg flex h-12 shrink-0 gap-0.5 rounded-full p-1">
              {UNITS.map((u) => (
                <button
                  key={u.value}
                  type="button"
                  role="radio"
                  aria-checked={filters.unit === u.value}
                  onClick={() => onChange({ unit: u.value })}
                  className="rounded-full px-3.5 text-[15px] font-semibold"
                >
                  {u.label}
                </button>
              ))}
            </span>
          </span>
        </Field>
      </Section>

      <Section title="Near" active={filters.nearPort || filters.nearAirport || filters.nearRail}>
        <div className="flex flex-wrap gap-2">
          {NEAR.map((n) => (
            <button
              key={n.key}
              type="button"
              aria-pressed={filters[n.key]}
              onClick={() => onChange({ [n.key]: !filters[n.key] })}
              className="xf-pill inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[15px] font-medium"
            >
              {filters[n.key] && <Check aria-hidden className="size-3.5" />}
              {n.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Type" active={!!filters.type}>
        <div role="group" aria-label="Warehouse type" className="xf-seg grid h-12 grid-cols-3 gap-0.5 rounded-full p-1">
          {TYPE_OPTIONS.map((t) => {
            const on = filters.type === t.value
            return (
              <button
                key={t.value}
                type="button"
                aria-pressed={on}
                title={on ? "Tap again to clear" : undefined}
                onClick={() => onChange({ type: on ? "" : t.value })}
                className="rounded-full text-[15px] font-semibold"
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Features" active={filters.features.length > 0}>
        <div className="flex flex-wrap gap-2">
          {FEATURE_OPTIONS.map((f) => {
            const on = filters.features.includes(f.value)
            return (
              <button
                key={f.value}
                type="button"
                aria-pressed={on}
                onClick={() => onChange({ features: toggle(filters.features, f.value) })}
                className="xf-pill inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[15px]"
              >
                {on && <Check aria-hidden className="size-3.5" />}
                {f.label}
              </button>
            )
          })}
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
