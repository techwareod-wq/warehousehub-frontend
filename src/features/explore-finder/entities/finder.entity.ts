import type { Rate } from "@/features/search"

export type WarehouseType = "" | "bonded" | "general" | "ftwz"
export type StorageUnit = "sqft" | "pallets"
export type FinderSort = "distance" | "area" | "rate"
export type FeatureKey = "dg" | "food_grade" | "open_yard" | "cold" | "racked" | "pharma" | "transport" | "fire_noc"

export const RADIUS_OPTIONS: { value: string; label: string }[] = [
  { value: "0", label: "Same city" },
  { value: "50", label: "Under 50 km" },
  { value: "100", label: "Under 100 km" },
]

/** Single-select, tap again to clear (empty = any). */
export const TYPE_OPTIONS: { value: Exclude<WarehouseType, "">; label: string }[] = [
  { value: "bonded", label: "Bonded" },
  { value: "general", label: "General" },
  { value: "ftwz", label: "FTWZ" },
]

export const TYPE_LABELS: Record<string, string> = { bonded: "Bonded", general: "General", ftwz: "FTWZ" }

/** In the sketch's order. */
export const FEATURE_OPTIONS: { value: FeatureKey; label: string }[] = [
  { value: "dg", label: "DG capable" },
  { value: "food_grade", label: "Food grade / HACCP" },
  { value: "open_yard", label: "Open yard" },
  { value: "cold", label: "Cold storage" },
  { value: "racked", label: "Racked" },
  { value: "pharma", label: "Pharma" },
  { value: "transport", label: "Transport available" },
  { value: "fire_noc", label: "Fire NOC" },
]

export const SORT_OPTIONS: { value: FinderSort; label: string }[] = [
  { value: "distance", label: "Distance" },
  { value: "area", label: "Area" },
  { value: "rate", label: "Rate" },
]

export interface FinderFilters {
  place: string
  radiusKm: number
  /** In `unit`; null when blank. */
  amount: number | null
  unit: StorageUnit
  type: WarehouseType
  nearPort: boolean
  nearAirport: boolean
  nearRail: boolean
  features: FeatureKey[]
  sort: FinderSort
}

export const EMPTY_FILTERS: FinderFilters = {
  place: "",
  radiusKm: 50,
  amount: null,
  unit: "sqft",
  type: "",
  nearPort: false,
  nearAirport: false,
  nearRail: false,
  features: [],
  sort: "distance",
}

export interface LatLng {
  lat: number
  lng: number
}

export interface FinderWarehouse {
  shortId: string
  slug: string
  name: string
  city: string
  locality: string
  loc: LatLng | null
  distKm: number | null
  totalSqft: number
  rate: Rate | null
  coverUrl: string
  type: string
  clearHeight: { value: number; unit: string } | null
  dockDoors: number | null
  holdCapacityMt: number | null
  tags: string[]
  nearPort: boolean
  nearAirport: boolean
  nearRail: boolean
}

export interface FinderSearchResult {
  total: number
  totalSqft: number
  centroid: LatLng | null
  message: string
  results: FinderWarehouse[]
}
