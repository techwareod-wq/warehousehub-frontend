/**
 * Unit families and conversions — mirrors crunch internal/warehousehub/domain/
 * units.go. The backend canonicalizes whatever unit is sent; the frontend only
 * converts for display and for search filters (always canonical).
 */
export type UnitFamily = "area" | "temp" | "load" | "mass" | "length" | "count"

export const SQM_PER_SQFT = 0.09290304
export const M_PER_FT = 0.3048

export const UNIT_FAMILIES: Record<UnitFamily, { canonical: string; units: string[]; label: string }> = {
  area: { canonical: "sqm", units: ["sqm", "sqft"], label: "Area" },
  temp: { canonical: "C", units: ["C", "F"], label: "Temperature" },
  load: { canonical: "t/m2", units: ["t/m2"], label: "Floor load" },
  mass: { canonical: "MT", units: ["MT"], label: "Mass" },
  length: { canonical: "m", units: ["m", "ft"], label: "Length" },
  count: { canonical: "", units: [""], label: "Count (no unit)" },
}

export const UNIT_LABELS: Record<string, string> = {
  sqm: "sq m",
  sqft: "sq ft",
  C: "°C",
  F: "°F",
  "t/m2": "t/m²",
  MT: "MT",
  m: "m",
  ft: "ft",
  "": "",
}

export function unitLabel(unit: string | undefined): string {
  return UNIT_LABELS[unit ?? ""] ?? unit ?? ""
}

export function sqftToSqm(v: number): number {
  return v * SQM_PER_SQFT
}

export function sqmToSqft(v: number): number {
  return v / SQM_PER_SQFT
}
