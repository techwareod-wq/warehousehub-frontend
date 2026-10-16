import type { PublicRateNetwork } from "@/features/search"

/** POST /v1/public/finder/match body */
export interface FinderMatchRequestNetwork {
  city: string
  /** "" (any) | "general" | "bonded" | "ftwz" */
  type: string
  areaSqft: number
  /** "general" | "dg" | "cold" */
  goods: string[]
  /** "pharma" | "ecommerce" | "chemicals" */
  industries: string[]
  nearPort: boolean
  nearRail: boolean
}

export interface FinderResultNetwork {
  shortId: string
  slug: string
  name: string
  city?: string
  locality?: string
  totalSqm: number
  rate?: PublicRateNetwork | null
  coverUrl?: string
  matchPercent: number
  matched: string[] | null
  typeUnknown: boolean
  reason?: string
}

/** POST /v1/public/finder/match */
export interface FinderMatchResponseNetwork {
  results: FinderResultNetwork[] | null
  message?: string
}

/** GET /v1/public/finder/cities (crunch answers `{cities}`; a bare list is accepted too). */
export type FinderCitiesNetwork = { cities: string[] | null } | string[] | null
