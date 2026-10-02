import type { HttpClient } from "@/core/api"
import type {
  AISearchRequestNetwork,
  GeoResolvedNetwork,
  MapResponseNetwork,
  PublicCatalogNetwork,
  SearchResponseNetwork,
} from "../network/search.network"
import { fromSearchQuery, toFilterCatalog, toLocation, toMapData, toSearchResult } from "../mappers/search.mapper"
import type { FilterCatalog, MapData, SearchQuery, SearchResult } from "../entities/search.entity"

export interface SearchContext {
  country: string
  currency: string
  sessionId: string
}

/** Public search API (/v1/public/*): no sign-in needed. */
export function searchApi(client: HttpClient) {
  return {
    async catalog(country: string): Promise<FilterCatalog> {
      return toFilterCatalog(await client.get<PublicCatalogNetwork>("/v1/public/catalog", { country }))
    },

    async search(q: SearchQuery, ctx: SearchContext, signal?: AbortSignal): Promise<SearchResult> {
      return toSearchResult(await client.post<SearchResponseNetwork>("/v1/public/search", fromSearchQuery(q, ctx), { signal }))
    },

    /** Natural-language search: the server turns `text` into filters (05). */
    async aiSearch(text: string, place: string, ctx: SearchContext, signal?: AbortSignal): Promise<SearchResult> {
      const body: AISearchRequestNetwork = {
        q: text,
        location: toLocation(place, ctx.country),
        page: 1,
        sessionId: ctx.sessionId || undefined,
      }
      return toSearchResult(await client.post<SearchResponseNetwork>("/v1/public/search/ai", body, { signal }))
    },

    async map(q: SearchQuery, ctx: SearchContext): Promise<MapData> {
      const filters = fromSearchQuery({ ...q, page: 1 }, { ...ctx, sessionId: "" })
      return toMapData(await client.get<MapResponseNetwork>("/v1/public/search/map", { country: ctx.country, filters: JSON.stringify(filters) }))
    },

    async whereAmI(): Promise<string> {
      return (await client.get<{ country: string }>("/v1/public/geo/whereami")).country
    },

    async resolve(q: string, country: string): Promise<GeoResolvedNetwork> {
      return client.get<GeoResolvedNetwork>("/v1/public/geo/resolve", { q, country })
    },
  }
}
