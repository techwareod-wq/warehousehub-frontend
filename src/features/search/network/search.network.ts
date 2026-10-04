/** crunch domain.SearchFilters (POST /v1/public/search body) */
export interface SearchFiltersNetwork {
  location?: { postalCode?: string; place?: string; point?: { lat: number; lng: number }; country?: string }
  radiusKm?: number
  autoExpand?: boolean
  areaSqm?: { min?: number; max?: number }
  areaInput?: { value: number; unit: string; intent: string }
  price?: { currency?: string; perSqmMonthMin?: number; perSqmMonthMax?: number }
  priceInput?: unknown
  industries?: string[]
  includeUnverified?: boolean
  chips?: string[]
  ranges?: Record<string, { min?: number; max?: number }>
  /** Admin search only: add archived warehouses. */
  includeArchived?: boolean
  text?: string
  sessionId?: string
  sort?: string
  page?: number
  limit?: number
}

export interface PublicRateNetwork {
  amount: number
  currency: string
  basis?: string
  perSqmMonth?: number
  approx: boolean
  onRequest: boolean
}

export interface SearchCardNetwork {
  shortId: string
  slug: string
  name: string
  city?: string
  locality?: string
  distKm?: number
  totalSqm: number
  totalDisplay?: string
  rate?: PublicRateNetwork | null
  industries: string[] | null
  unverified: boolean
  coverUrl?: string
  /** Admin search only (POST /v1/admin/search). */
  id?: string
  status?: string
  chips?: string[] | null
  nums?: { k: string; v: number }[] | null
  unk?: string[] | null
}

export interface BoundsNetwork {
  min: number
  max: number
}

/** crunch domain.SearchResponse (+ `ai` on the AI endpoint) */
export interface SearchResponseNetwork {
  searchId: string
  applied: {
    filters: SearchFiltersNetwork
    resolvedPoint?: { lat: number; lng: number }
    geocodeSource?: string
    dropped: string[] | null
  }
  radius: {
    requestedKm: number
    usedKm: number
    expanded: boolean
    exhausted: boolean
    message?: string
    countryLink: boolean
  } | null
  results: SearchCardNetwork[] | null
  page: number
  limit: number
  total: number
  facets: {
    chips: Record<string, number> | null
    industries: Record<string, { fit: number; unverified: number }> | null
    ranges: Record<string, BoundsNetwork> | null
    price: BoundsNetwork | null
    area: BoundsNetwork | null
  }
  fallback: { used: boolean; reason: string; source: string; results: SearchCardNetwork[] | null } | null
  degraded: string[] | null
  ai?: { parsed: boolean; model: string; latencyMs: number; notes: string[] | null }
}

/** POST /v1/public/search/ai body */
export interface AISearchRequestNetwork {
  q: string
  location?: SearchFiltersNetwork["location"]
  page?: number
  sessionId?: string
}

/** crunch dto.FilterGroup: one attribute node and its filterable fields */
export interface FilterGroupNetwork {
  key: string
  name: string
  parentName?: string
  ancestors: string[] | null
  selectable: boolean
  public: boolean
  fields:
    | {
        key: string
        name: string
        type: string
        unit?: string
        public: boolean
        options?: { key: string; label: string }[] | null
      }[]
    | null
}

/** GET /v1/public/catalog (and GET /v1/admin/search/catalog: every attribute) */
export interface PublicCatalogNetwork {
  rulesVersion: number
  country: string
  currency: string
  defaultRadiusKm: number
  radiusSteps: number[] | null
  chipRows: { row: string; chips: { key: string; label: string }[] | null }[] | null
  ranges: { key: string; label: string; type: string; unit?: string; row?: string }[] | null
  groups: FilterGroupNetwork[] | null
  industries: { key: string; name: string }[] | null
}

/** GET /v1/public/search/map */
export interface MapResponseNetwork {
  points: [string, number, number, number][] | null
  bbox: number[] | null
  total: number
  /** GET /v1/admin/search/map only: warehouse id + status, in points order. */
  adminPoints?: { id: string; status: string }[] | null
}

/** GET /v1/public/geo/resolve */
export interface GeoResolvedNetwork {
  lat: number
  lng: number
  label: string
  source: string
}
