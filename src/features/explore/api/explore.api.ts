import type { HttpClient } from "@/core/api"
import { searchApi, type ListingCard, type SearchContext } from "@/features/search"
import type { ExploreFilters, ExploreWarehouse } from "../entities/explore.entity"
import { toExploreQuery, toExploreWarehouses } from "../mappers/explore.mapper"

/** Search pages fetched per load (the map shows at most this many pages of cards). */
const MAX_PAGES = 15

/**
 * The explore map's data: GET /v1/public/search/map for coordinates plus
 * every page of POST /v1/public/search for the card fields, joined by shortId.
 */
export function exploreApi(client: HttpClient) {
  const search = searchApi(client)
  return {
    async warehouses(f: ExploreFilters, ctx: Omit<SearchContext, "sessionId">, signal?: AbortSignal): Promise<ExploreWarehouse[]> {
      const q = toExploreQuery(f)
      // No session id: these page-throughs aren't visitor searches.
      const sctx = { ...ctx, sessionId: "" }
      const [map, first] = await Promise.all([search.map(q, sctx), search.search(q, sctx, signal)])
      const rest = await Promise.all(
        Array.from({ length: Math.min(first.pages, MAX_PAGES) - 1 }, (_, i) => search.search({ ...q, page: i + 2 }, sctx, signal)),
      )
      const cards: ListingCard[] = [first, ...rest].flatMap((r) => r.results)
      return toExploreWarehouses(cards, map.points)
    },
  }
}
