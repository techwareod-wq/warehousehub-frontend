export type SortKey = "relevance" | "distance" | "price_asc" | "price_desc" | "area_desc"

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Best match" },
  { value: "distance", label: "Nearest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "area_desc", label: "Largest first" },
]

export interface MinMax {
  min?: number
  max?: number
}

/**
 * What the visitor asked for, in visitor units (sq ft, ₹ per sq ft per
 * month). The mapper converts to the API's canonical units.
 */
export interface SearchQuery {
  /** Free text: a place / pincode, or (AI mode) a whole description. */
  place: string
  radiusKm?: number
  areaSqft: MinMax
  /** Rupees per sq ft per month. */
  pricePerSqft: MinMax
  industries: string[]
  includeUnverified: boolean
  chips: string[]
  /** Numeric attribute filters by "node.field", canonical units. */
  ranges: Record<string, MinMax>
  sort?: SortKey
  page: number
}

export const EMPTY_QUERY: SearchQuery = {
  place: "",
  areaSqft: {},
  pricePerSqft: {},
  industries: [],
  includeUnverified: false,
  chips: [],
  ranges: {},
  page: 1,
}

export interface Rate {
  /** Minor units. */
  amount: number
  currency: string
  basis: string
  perSqmMonth: number
  approx: boolean
  onRequest: boolean
}

export interface ListingCard {
  shortId: string
  slug: string
  name: string
  city: string
  locality: string
  distKm: number | null
  totalSqm: number
  rate: Rate | null
  industries: string[]
  unverified: boolean
  coverUrl: string
}

export interface Bounds {
  min: number
  max: number
}

export interface SearchResult {
  searchId: string
  /** The filters the server applied, as a query (AI fills this in). */
  applied: SearchQuery
  appliedRaw: unknown
  dropped: string[]
  resolvedPoint: { lat: number; lng: number } | null
  radius: {
    requestedKm: number
    usedKm: number
    expanded: boolean
    exhausted: boolean
    message: string
    countryLink: boolean
  } | null
  results: ListingCard[]
  page: number
  limit: number
  total: number
  pages: number
  facets: {
    chips: Record<string, number>
    industries: Record<string, { fit: number; unverified: number }>
    ranges: Record<string, Bounds>
    price: Bounds | null
    area: Bounds | null
  }
  fallback: { reason: string; source: string; results: ListingCard[] } | null
  degraded: string[]
  ai: { parsed: boolean; notes: string[] } | null
}

export interface ChipRow {
  row: string
  chips: { key: string; label: string }[]
}

export interface RangeFilterDef {
  key: string
  label: string
  type: string
  unit: string
  row: string
}

/** The filters the admin set up (GET /v1/public/catalog). */
export interface FilterCatalog {
  rulesVersion: number
  country: string
  currency: string
  defaultRadiusKm: number
  radiusSteps: number[]
  chipRows: ChipRow[]
  ranges: RangeFilterDef[]
  industries: { key: string; name: string }[]
}

export interface MapPoint {
  shortId: string
  lat: number
  lng: number
  /** 0 = no price, 1–3 = cheapest → dearest third. */
  priceBand: number
}

export interface MapData {
  points: MapPoint[]
  bbox: [number, number, number, number] | null
  total: number
}
