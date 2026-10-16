import type { HttpClient } from "@/core/api"
import { EMPTY_QUERY, searchApi, type ListingCard, type SearchContext } from "@/features/search"
import type { ClusterOverview } from "../entities/clusters.entity"
import { buildClusters } from "../lib/clusters"

/** Search pages read per overview (same cap as the explore map). */
const MAX_PAGES = 15

/**
 * Featured clusters, derived from every live listing: pages through
 * POST /v1/public/search (no filters) and groups the cards with
 * buildClusters. No dedicated endpoint exists for this.
 *
 * TODO(data): no state on clusters yet. Search cards carry only city and
 * locality, and the public listing's address omits region. Add it here
 * once the API sends it.
 */
export function clustersApi(client: HttpClient) {
  const search = searchApi(client)
  return {
    async overview(ctx: Omit<SearchContext, "sessionId">): Promise<ClusterOverview> {
      // No session id: these page-throughs aren't visitor searches.
      const sctx = { ...ctx, sessionId: "" }
      const first = await search.search(EMPTY_QUERY, sctx)
      const rest = await Promise.all(
        Array.from({ length: Math.min(first.pages, MAX_PAGES) - 1 }, (_, i) => search.search({ ...EMPTY_QUERY, page: i + 2 }, sctx)),
      )
      const cards: ListingCard[] = [first, ...rest].flatMap((r) => r.results)
      const overview = buildClusters(cards)
      // Prefer the server's total: the page-through is capped.
      overview.warehouses = Math.max(first.total, cards.length)
      return overview
    },
  }
}
