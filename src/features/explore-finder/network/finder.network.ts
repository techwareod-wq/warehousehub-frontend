import type { PublicRateNetwork } from "@/features/search"

/** POST /v1/public/finder/search body. Exactly one of areaSqft / pallets is sent. */
export interface FinderSearchRequestNetwork {
  place: string
  /** 0 = same city */
  radiusKm: number
  areaSqft?: number
  pallets?: number
  /** "" (any) | "bonded" | "general" | "ftwz" */
  type: string
  nearPort: boolean
  nearAirport: boolean
  nearRail: boolean
  /** "dg" | "food_grade" | "open_yard" | "cold" | "racked" | "pharma" | "transport" | "fire_noc" */
  features: string[]
  /** "distance" | "area" | "rate" */
  sort: string
  limit: number
}

export interface LatLngNetwork {
  lat: number
  lng: number
}

export interface FinderSearchResultNetwork {
  shortId: string
  slug: string
  name: string
  city?: string
  locality?: string
  loc?: LatLngNetwork | null
  distKm?: number | null
  totalSqft: number
  rate?: PublicRateNetwork | null
  coverUrl?: string
  type?: string
  clearHeight?: { value: number; unit: string } | null
  dockDoors?: number | null
  holdCapacityMt?: number | null
  tags: string[] | null
  nearPort: boolean
  nearAirport: boolean
  nearRail: boolean
}

/** POST /v1/public/finder/search */
export interface FinderSearchResponseNetwork {
  total: number
  totalSqft: number
  centroid?: LatLngNetwork | null
  message?: string
  results: FinderSearchResultNetwork[] | null
}

/** GET /v1/public/finder/cities (crunch answers `{cities}`; a bare list is accepted too). */
export type FinderCitiesNetwork = { cities: string[] | null } | string[] | null
