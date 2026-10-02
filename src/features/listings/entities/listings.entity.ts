import type { ListingCard, Rate } from "@/features/search"

export interface PublicField {
  key: string
  name: string
  type: string
  /** Display text, already formatted (units, option labels, yes/no). */
  display: string
}

export interface PublicNode {
  key: string
  name: string
  fields: PublicField[]
  children: PublicNode[]
}

export interface PublicMedia {
  kind: "photo" | "doc"
  docType: string
  url: string
  caption: string
  isCover: boolean
}

export interface Listing {
  shortId: string
  slug: string
  name: string
  description: string
  address: { locality: string; city: string; region: string; postalCode: string; country: string }
  point: { lat: number; lng: number } | null
  totalSqm: number | null
  totalAreaDisplay: string
  rate: Rate | null
  attributes: PublicNode[]
  industries: string[]
  photos: PublicMedia[]
  docs: PublicMedia[]
  seo: { title: string; description: string; canonicalPath: string; ogImage: string; jsonLd: Record<string, unknown> | null }
  updatedAt?: Date
}

/** The slug lookup outcome (spec 03 Slugs). */
export type ListingLookup =
  | { kind: "found"; listing: Listing }
  | { kind: "moved"; path: string }
  | { kind: "gone"; nearby: ListingCard[] }
  | { kind: "missing" }

export interface SitemapEntry {
  slug: string
  updatedAt?: Date
}
