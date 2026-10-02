import type { PublicRateNetwork, SearchCardNetwork } from "@/features/search"

export interface PublicFieldNetwork {
  key: string
  name: string
  type: string
  value: unknown
  unit?: string
  labels?: string[] | null
}

export interface PublicNodeNetwork {
  key: string
  name: string
  fields: PublicFieldNetwork[] | null
  children: PublicNodeNetwork[] | null
}

/** GET /v1/public/listing?slug= (200) */
export interface PublicListingNetwork {
  shortId: string
  slug: string
  name: string
  description?: string
  address: { locality?: string; city?: string; region?: string; postalCode?: string; country?: string }
  loc?: { lat: number; lng: number } | null
  totalArea?: { value: number; unit: string; sqm: number } | null
  rate?: PublicRateNetwork | null
  attributes: PublicNodeNetwork[] | null
  industries: string[] | null
  media: { kind: string; docType?: string; url: string; caption?: string; isCover: boolean }[] | null
  seo: { title: string; metaDescription: string; canonicalPath: string; ogImage?: string; jsonLd: Record<string, unknown> | null }
  updatedAt: string
}

/** 301 body */
export interface ListingRedirectNetwork {
  redirectTo: string
}

/** 410 error data */
export interface ListingGoneNetwork {
  nearby: SearchCardNetwork[] | null
}

/** GET /v1/public/sitemap and /listing/slugs */
export interface SlugPageNetwork {
  items: { slug: string; updatedAt: string; coverUrl?: string }[] | null
  page: number
}
