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
  /** Admin search only: add archived warehouses. */
  includeArchived?: boolean
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

/** An admin search result: the card plus the warehouse's search projection. */
export interface AdminListingCard extends ListingCard {
  id: string
  status: string
  /** Chip keys the warehouse has ("node", "node.field", "node.field:option"). */
  chips: string[]
  /** Known numbers by key, canonical units (range fields: "<path>_min" / "_max"). */
  nums: Record<string, number>
  /** Keys whose value is unknown (node or field path). */
  unk: string[]
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
    /** ₹ per sq ft per month. */
    price: Bounds | null
    /** sq ft. */
    area: Bounds | null
  }
  fallback: { reason: string; source: string; results: ListingCard[] } | null
  degraded: string[]
  ai: { parsed: boolean; notes: string[] } | null
}

export type AdminSearchResult = Omit<SearchResult, "results"> & { results: AdminListingCard[] }

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

export interface FilterFieldDef {
  /** "node.field" */
  key: string
  name: string
  /** bool | pick | multi | number | area | ratio | range */
  type: string
  unit: string
  /** Shown on the public listing (false = staff only). */
  public: boolean
  /** pick / multi options; key is the chip ("node.field:option"). */
  options: { key: string; label: string }[]
}

/** One attribute and its filterable fields, for the "add a filter" picker. */
export interface FilterGroupDef {
  key: string
  name: string
  parentName: string
  /** Parent attribute keys, nearest first: a filter inside this one implies them. */
  ancestors: string[]
  /** The attribute itself is a filter ("has cold storage"). */
  selectable: boolean
  public: boolean
  fields: FilterFieldDef[]
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
  groups: FilterGroupDef[]
  industries: { key: string; name: string }[]
}

export interface MapPoint {
  shortId: string
  lat: number
  lng: number
  /** 0 = no price, 1–3 = cheapest → dearest third. */
  priceBand: number
  /** Admin map only. */
  id?: string
  status?: string
}

export interface MapData {
  points: MapPoint[]
  bbox: [number, number, number, number] | null
  total: number
}
