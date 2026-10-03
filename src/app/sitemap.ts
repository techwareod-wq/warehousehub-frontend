import type { MetadataRoute } from "next"
import { publicServerApi } from "@/core/api/server-client"
import { env } from "@/core/config/env"
import { listingsApi } from "@/features/listings"

// Rebuilt at most hourly; the backend feed pages at publicPageSize (1000).
export const revalidate = 3600

const MAX_PAGES = 50

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: `${env.siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${env.siteUrl}/search`, changeFrequency: "daily", priority: 0.8 },
  ]
  try {
    const api = listingsApi(publicServerApi(3600))
    for (let page = 1; page <= MAX_PAGES; page++) {
      const items = await api.sitemapPage(page)
      if (items.length === 0) break
      for (const i of items) {
        entries.push({ url: `${env.siteUrl}/warehouses/${i.slug}`, lastModified: i.updatedAt, changeFrequency: "weekly", priority: 0.7 })
      }
    }
  } catch {
    // The API being down must not break the sitemap: serve the static part.
    // While the site is feature-gated the feed answers 401 (no visitor here),
    // so only the static part is served.
  }
  return entries
}
