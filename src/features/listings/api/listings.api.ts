import type { HttpClient } from "@/core/api"
import { parseDate } from "@/lib/format"
import type { ListingGoneNetwork, ListingRedirectNetwork, PublicListingNetwork, SlugPageNetwork } from "../network/listings.network"
import { toListing, toListingCard } from "../mappers/listings.mapper"
import type { ListingLookup, SitemapEntry } from "../entities/listings.entity"

/** Public listing pages (server-side: SSR + sitemap). */
export function listingsApi(client: HttpClient) {
  return {
    /** 200 listing · 301 moved slug · 410 archived (with nearby) · 404. */
    async lookup(slug: string): Promise<ListingLookup> {
      const res = await client.send<unknown>("/v1/public/listing", { query: { slug } })
      if (res.status === 200 && res.ok) return { kind: "found", listing: toListing(res.data as PublicListingNetwork) }
      if (res.status === 301) return { kind: "moved", path: (res.data as ListingRedirectNetwork).redirectTo }
      if (res.status === 410) {
        const gone = res.data as ListingGoneNetwork | undefined
        return { kind: "gone", nearby: (gone?.nearby ?? []).map(toListingCard) }
      }
      if (res.status === 404) return { kind: "missing" }
      throw new Error(res.error ?? `listing lookup failed (${res.status})`)
    },

    /** One page of the sitemap feed (empty page = done). */
    async sitemapPage(page: number): Promise<SitemapEntry[]> {
      const res = await client.get<SlugPageNetwork>("/v1/public/sitemap", { page })
      return (res.items ?? []).map((i) => ({ slug: i.slug, updatedAt: parseDate(i.updatedAt) }))
    },
  }
}
