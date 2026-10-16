import type { HttpClient } from "@/core/api"
import type { FinderCitiesNetwork, FinderSearchResponseNetwork } from "../network/finder.network"
import type { FinderFilters, FinderSearchResult } from "../entities/finder.entity"
import { fromFinderFilters, toCities, toFinderSearchResult } from "../mappers/finder.mapper"

/** Experimental warehouse finder (/v1/public/finder/*): no sign-in needed. */
export function finderApi(client: HttpClient) {
  return {
    async cities(): Promise<string[]> {
      return toCities(await client.get<FinderCitiesNetwork>("/v1/public/finder/cities"))
    },

    async search(f: FinderFilters, signal?: AbortSignal): Promise<FinderSearchResult> {
      const body = fromFinderFilters(f)
      return toFinderSearchResult(await client.post<FinderSearchResponseNetwork>("/v1/public/finder/search", body, { signal }))
    },
  }
}
