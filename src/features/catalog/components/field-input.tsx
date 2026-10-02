"use client"

import { useState } from "react"
import { LocateFixed } from "lucide-react"
import { Button, Input, Textarea } from "@/components/ui"
import { Checkbox, NativeSelect } from "@/components/common"
import { PinPicker } from "@/components/maps/pin-picker"
import { majorToMinor, minorToMajor, formatNumber } from "@/lib/format"
import { UNIT_FAMILIES, unitLabel } from "@/lib/units"
import { cn } from "@/lib/utils"
import type { AttributeField } from "@/features/attributes"
import { RENT_BASES, type Address, type FieldValue, type GeoLocation, type Money } from "../entities/catalog.entity"

/** A number box that keeps what's typed ("1.", "-") until it parses. */
function NumberBox({
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: {
  value: number | undefined
  onChange: (v: number | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}) {
  const [text, setText] = useState(value === undefined ? "" : String(value))
  const [shown, setShown] = useState(value)
  if (shown !== value) {
    setShown(value)
    const parsed = text.trim() === "" ? undefined : Number(text)
    if (parsed !== value) setText(value === undefined ? "" : String(value))
  }
  return (
    <Input
      inputMode="decimal"
      value={text}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      onChange={(e) => {
        const t = e.target.value
        setText(t)
        if (t.trim() === "") onChange(undefined)
        else if (Number.isFinite(Number(t))) onChange(Number(t))
      }}
    />
  )
}

function UnitSelect({ units, value, onChange, disabled }: { units: string[]; value: string; onChange: (u: string) => void; disabled?: boolean }) {
  if (units.length <= 1) return units[0] ? <span className="px-2 text-sm text-muted-foreground">{unitLabel(units[0])}</span> : null
  return (
    <NativeSelect
      className="w-28"
      value={value}
      disabled={disabled}
      onChange={onChange}
      options={units.map((u) => ({ value: u, label: unitLabel(u) }))}
    />
  )
}

function unitsOf(field: AttributeField): { units: string[]; canonical: string } {
  if (field.type === "area") return { units: ["sqft", "sqm"], canonical: "sqm" }
  if (!field.unit) return { units: [], canonical: "" }
  const fam = UNIT_FAMILIES[field.unit.family]
  return { units: field.unit.input.length ? field.unit.input : (fam?.units ?? []), canonical: fam?.canonical ?? "" }
}

const asObj = <T,>(v: unknown): Partial<T> => (v && typeof v === "object" ? (v as Partial<T>) : {})

export interface FieldInputProps {
  field: AttributeField
  value: FieldValue | null
  onChange: (v: FieldValue | null) => void
  disabled?: boolean
  /** Ratio fields: the computed value from the last preview. */
  ratio?: number
  /** Location fields: geocode the address into a pin. */
  onGeocode?: () => Promise<GeoLocation | null>
}

/** The editor control for one attribute field, by type (crunch domain/canonical.go). */
export function FieldInput({ field, value, onChange, disabled, ratio, onGeocode }: FieldInputProps) {
  const v = value?.v
  switch (field.type) {
    case "bool":
      return (
        <NativeSelect
          value={v === true ? "yes" : v === false ? "no" : ""}
          disabled={disabled}
          onChange={(s) => onChange(s === "" ? null : { v: s === "yes" })}
          placeholder="Not set"
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          className="w-40"
        />
      )

    case "number": {
      const { units, canonical } = unitsOf(field)
      const unit = value?.raw?.unit || canonical
      const n = typeof value?.raw?.value === "number" ? (value.raw.value as number) : typeof v === "number" ? v : undefined
      const emit = (num: number | undefined, u: string) =>
        onChange(num === undefined ? null : field.unit ? { v: num, raw: { value: num, unit: u } } : { v: num })
      return (
        <div className="flex items-center gap-2">
          <NumberBox value={n} disabled={disabled} onChange={(x) => emit(x, unit)} className="w-40" />
          <UnitSelect units={units} value={unit} disabled={disabled} onChange={(u) => emit(n, u)} />
        </div>
      )
    }

    case "range": {
      const { units, canonical } = unitsOf(field)
      const unit = value?.raw?.unit || canonical
      const r = asObj<{ min: number; max: number }>(value?.raw?.value ?? v)
      return <RangeInput min={r.min} max={r.max} unit={unit} units={units} disabled={disabled} hasUnit={!!field.unit} onChange={onChange} />
    }

    case "area": {
      const a = asObj<{ value: number; unit: string }>(v)
      const unit = a.unit || "sqft"
      const emit = (num: number | undefined, u: string) => onChange(num === undefined ? null : { v: { value: num, unit: u } })
      return (
        <div className="flex items-center gap-2">
          <NumberBox value={a.value} disabled={disabled} onChange={(x) => emit(x, unit)} className="w-40" />
          <UnitSelect units={["sqft", "sqm"]} value={unit} disabled={disabled} onChange={(u) => emit(a.value, u)} />
        </div>
      )
    }

    case "pick":
      return (
        <NativeSelect
          value={typeof v === "string" ? v : ""}
          disabled={disabled}
          onChange={(s) => onChange(s ? { v: s } : null)}
          placeholder="Choose…"
          options={field.options.map((o) => ({ value: o.key, label: o.label }))}
          className="min-w-48"
        />
      )

    case "multi": {
      const picked = Array.isArray(v) ? (v as string[]) : []
      return (
        <div className="flex flex-wrap gap-1.5">
          {field.options.map((o) => {
            const on = picked.includes(o.key)
            return (
              <button
                key={o.key}
                type="button"
                disabled={disabled}
                onClick={() => {
                  const next = on ? picked.filter((k) => k !== o.key) : [...picked, o.key]
                  onChange(next.length ? { v: next } : null)
                }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-60",
                  on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
                )}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      )
    }

    case "text":
      return <Input value={typeof v === "string" ? v : ""} disabled={disabled} onChange={(e) => onChange(e.target.value ? { v: e.target.value } : null)} />

    case "longtext":
      return (
        <Textarea rows={4} value={typeof v === "string" ? v : ""} disabled={disabled} onChange={(e) => onChange(e.target.value ? { v: e.target.value } : null)} />
      )

    case "date":
      return (
        <Input
          type="date"
          className="w-48"
          value={typeof v === "string" ? v : ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value ? { v: e.target.value } : null)}
        />
      )

    case "money":
      return <MoneyInput value={v ? (asObj<Money>(v) as Money) : null} disabled={disabled} withBasis onChange={(m) => onChange(m ? { v: m } : null)} />

    case "address":
      return <AddressInput value={asObj<Address>(v)} disabled={disabled} onChange={(a) => onChange({ v: a })} />

    case "location":
      return <LocationInput value={v ? (asObj<GeoLocation>(v) as GeoLocation) : null} disabled={disabled} onChange={onChange} onGeocode={onGeocode} />

    case "ratio":
      return (
        <p className="text-sm text-muted-foreground">
          {ratio !== undefined ? formatNumber(ratio, 2) : "Calculated on save"}
          {field.ratio && <span className="ml-1 text-xs">(per {formatNumber(field.ratio.per)} {unitLabel(field.ratio.bottomUnit)})</span>}
        </p>
      )
  }
}

function RangeInput({
  min,
  max,
  unit,
  units,
  hasUnit,
  disabled,
  onChange,
}: {
  min?: number
  max?: number
  unit: string
  units: string[]
  hasUnit: boolean
  disabled?: boolean
  onChange: (v: FieldValue | null) => void
}) {
  const [lo, setLo] = useState(min)
  const [hi, setHi] = useState(max)
  const [shown, setShown] = useState({ min, max })
  if (shown.min !== min || shown.max !== max) {
    setShown({ min, max })
    setLo(min)
    setHi(max)
  }
  const emit = (a: number | undefined, b: number | undefined, u: string) => {
    if (a === undefined && b === undefined) return onChange(null)
    if (a === undefined || b === undefined) return
    const r = { min: a, max: b }
    onChange(hasUnit ? { v: r, raw: { value: r, unit: u } } : { v: r })
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <NumberBox value={lo} placeholder="Min" disabled={disabled} className="w-28" onChange={(x) => (setLo(x), emit(x, hi, unit))} />
      <span className="text-muted-foreground">–</span>
      <NumberBox value={hi} placeholder="Max" disabled={disabled} className="w-28" onChange={(x) => (setHi(x), emit(lo, x, unit))} />
      <UnitSelect units={units} value={unit} disabled={disabled} onChange={(u) => emit(lo, hi, u)} />
    </div>
  )
}

export function MoneyInput({
  value,
  onChange,
  disabled,
  withBasis,
}: {
  value: Money | null
  onChange: (m: Money | null) => void
  disabled?: boolean
  withBasis?: boolean
}) {
  const m: Money = value ?? { amount: 0, currency: "INR", basis: withBasis ? "per_sqft_month" : "", period: "", onRequest: false }
  const set = (patch: Partial<Money>) => onChange({ ...m, ...patch })
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={m.currency}
          disabled={disabled || m.onRequest}
          maxLength={3}
          onChange={(e) => set({ currency: e.target.value.toUpperCase() })}
          className="w-20 uppercase"
          aria-label="Currency"
        />
        <NumberBox
          value={value && !m.onRequest ? minorToMajor(m.amount) : undefined}
          disabled={disabled || m.onRequest}
          placeholder="Amount"
          className="w-36"
          onChange={(x) => (x === undefined ? onChange(null) : set({ amount: majorToMinor(x) }))}
        />
        {withBasis && (
          <NativeSelect
            value={m.basis}
            disabled={disabled}
            onChange={(basis) => set({ basis })}
            placeholder="Basis…"
            options={RENT_BASES.map((b) => ({ value: b.value, label: b.label }))}
          />
        )}
      </div>
      {withBasis && <Checkbox checked={m.onRequest} disabled={disabled} onChange={(onRequest) => set({ onRequest })} label="Price on request" />}
    </div>
  )
}

function AddressInput({ value, onChange, disabled }: { value: Partial<Address>; onChange: (a: Address) => void; disabled?: boolean }) {
  const a: Address = {
    line1: value.line1 ?? "",
    line2: value.line2 ?? "",
    locality: value.locality ?? "",
    city: value.city ?? "",
    region: value.region ?? "",
    postalCode: value.postalCode ?? "",
    country: value.country ?? "IN",
  }
  const set = (patch: Partial<Address>) => onChange({ ...a, ...patch })
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Input className="sm:col-span-2" placeholder="Address line 1 *" value={a.line1} disabled={disabled} onChange={(e) => set({ line1: e.target.value })} />
      <Input className="sm:col-span-2" placeholder="Address line 2" value={a.line2} disabled={disabled} onChange={(e) => set({ line2: e.target.value })} />
      <Input placeholder="Locality / area" value={a.locality} disabled={disabled} onChange={(e) => set({ locality: e.target.value })} />
      <Input placeholder="City *" value={a.city} disabled={disabled} onChange={(e) => set({ city: e.target.value })} />
      <Input placeholder="State" value={a.region} disabled={disabled} onChange={(e) => set({ region: e.target.value })} />
      <Input placeholder="Postal code" value={a.postalCode} disabled={disabled} onChange={(e) => set({ postalCode: e.target.value })} />
      <Input
        placeholder="Country (2 letters) *"
        value={a.country}
        maxLength={2}
        disabled={disabled}
        onChange={(e) => set({ country: e.target.value.toUpperCase() })}
        className="uppercase"
      />
    </div>
  )
}

function LocationInput({
  value,
  onChange,
  disabled,
  onGeocode,
}: {
  value: GeoLocation | null
  onChange: (v: FieldValue | null) => void
  disabled?: boolean
  onGeocode?: () => Promise<GeoLocation | null>
}) {
  const [busy, setBusy] = useState(false)
  const point = value && Number.isFinite(value.lat) && Number.isFinite(value.lng) ? { lat: value.lat, lng: value.lng } : null
  const manual = (p: { lat?: number; lng?: number }) => {
    const lat = p.lat ?? value?.lat
    const lng = p.lng ?? value?.lng
    if (lat === undefined || lng === undefined) return
    onChange({ v: { lat, lng, source: "manual" } })
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <NumberBox value={value?.lat} placeholder="Latitude" disabled={disabled} className="w-36" onChange={(lat) => lat !== undefined && manual({ lat })} />
        <NumberBox value={value?.lng} placeholder="Longitude" disabled={disabled} className="w-36" onChange={(lng) => lng !== undefined && manual({ lng })} />
        {onGeocode && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || busy}
            onClick={async () => {
              setBusy(true)
              try {
                const loc = await onGeocode()
                if (loc) onChange({ v: { lat: loc.lat, lng: loc.lng, source: "geocoded", accuracy: loc.accuracy, placeId: loc.placeId } })
              } finally {
                setBusy(false)
              }
            }}
          >
            <LocateFixed /> {busy ? "Finding…" : "Find from address"}
          </Button>
        )}
        {value?.source && <span className="text-xs text-muted-foreground">{value.source === "geocoded" ? "From address" : "Placed by hand"}</span>}
      </div>
      <PinPicker value={point} disabled={disabled} onChange={(p) => onChange({ v: { ...p, source: "manual" } })} />
    </div>
  )
}
