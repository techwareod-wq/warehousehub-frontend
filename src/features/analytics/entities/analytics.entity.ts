export interface DateRange {
  /** YYYY-MM-DD, inclusive. */
  from: string
  to: string
}

export interface Totals {
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

export interface DayPoint {
  date: string
  searches: number
  aiSearches: number
  zeroResult: number
  fallbackUsed: number
  enquiries: number
  enquiriesFromSearch: number
}

export interface Overview {
  from: string
  to: string
  totals: Totals
  daily: DayPoint[]
}

export interface TopQuery {
  q: string
  searches: number
  zeroResults: number
  zeroShare: number
  enquiries: number
}

export interface ZeroQuery {
  q: string
  place: string
  n: number
}

export interface Conversion {
  searches: number
  searchesWithResults: number
  enquiries: number
  enquiriesFromSearch: number
  rate: number
  byQuery: { q: string; searches: number; enquiries: number; rate: number }[]
  byListing: { warehouseId: string; shortId: string; name: string; enquiries: number; fromSearch: number }[]
}

export interface SearchEvent {
  id: string
  at?: Date
  kind: string
  text: string
  place: string
  resultCount: number
  fallbackUsed: boolean
  fallbackReason: string
  aiParsed: boolean | null
  latencyMs: number
  radiusKm: number | null
  expanded: boolean
  degraded: string[]
  isStaff: boolean
  filters: Record<string, unknown>
}

export interface SearchLogFilter {
  q?: string
  zero?: boolean
  from?: string
  to?: string
}
