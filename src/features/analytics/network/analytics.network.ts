export interface TotalsNetwork {
  searches: number
  aiSearches: number
  zeroResult: number
  fallbackUsed: number
  expanded: number
  aiParseFailures: number
  enquiries: number
  enquiriesFromSearch: number
  zeroResultPct: number
  fallbackPct: number
  aiParseFailurePct: number
  aiLatencyP50: number
  aiLatencyP95: number
}

export interface DayPointNetwork extends Omit<TotalsNetwork, "zeroResultPct" | "fallbackPct" | "aiParseFailurePct"> {
  date: string
}

export interface OverviewNetwork {
  from: string
  to: string
  totals: TotalsNetwork
  daily: DayPointNetwork[] | null
}

export interface TopQueriesNetwork {
  from: string
  to: string
  items: { q: string; searches: number; zeroResults: number; zeroShare: number; enquiries: number }[] | null
}

export interface ZeroQueriesNetwork {
  from: string
  to: string
  items: { q: string; place?: string; n: number }[] | null
}

export interface ConversionNetwork {
  from: string
  to: string
  searches: number
  searchesWithResults: number
  enquiries: number
  enquiriesFromSearch: number
  rate: number
  byQuery: { q: string; searches: number; enquiries: number; rate: number }[] | null
  byListing: { warehouseId: string; shortId: string; name: string; enquiries: number; fromSearch: number }[] | null
}

/** crunch models.SearchEvent */
export interface SearchEventNetwork {
  id: string
  at: string
  sessionId?: string
  userId?: string
  isStaff: boolean
  kind: string
  rawText?: string
  normQuery?: string
  filters: Record<string, unknown> | null
  placeLabel?: string
  geocodeSource?: string
  radius?: { requestedKm: number; usedKm: number; expanded: boolean; exhausted: boolean } | null
  resultCount: number
  fallbackUsed: boolean
  fallbackReason?: string
  fallbackCount?: number
  ai?: { parsed: boolean; model: string; latencyMs: number; notes: string[] | null } | null
  latencyMs: number
  page: number
  country: string
  degraded: string[] | null
}
