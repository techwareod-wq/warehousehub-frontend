import type { Rate } from "@/features/search"

/** A listing placed on the explore map: a search card joined with its map point. */
export interface ExploreWarehouse {
  shortId: string
  slug: string
  name: string
  city: string
  locality: string
  lat: number
  lng: number
  totalSqm: number
  rate: Rate | null
  /** ₹ per sq ft per month, null when there is no comparable price. */
  ratePerSqft: number | null
  industries: string[]
  coverUrl: string
}

/** Server-side filters (city is applied in the browser). */
export interface ExploreFilters {
  /** ₹ per sq ft per month; null = any. */
  maxRate: number | null
  /** Industry key; "" = all. */
  industry: string
}
