import type { HttpClient } from "@/core/api"
import type { FinderCitiesNetwork, FinderMatchResponseNetwork } from "../network/finder.network"
import type { FinderAnswers, FinderResult } from "../entities/finder.entity"
import { fromFinderAnswers, toCities, toFinderResult } from "../mappers/finder.mapper"

/** Experimental guided finder (/v1/public/finder/*): no sign-in needed. */
export function finderApi(client: HttpClient) {
  return {
    async cities(): Promise<string[]> {
      return toCities(await client.get<FinderCitiesNetwork>("/v1/public/finder/cities"))
    },

    async match(a: FinderAnswers, signal?: AbortSignal): Promise<FinderResult> {
      return toFinderResult(await client.post<FinderMatchResponseNetwork>("/v1/public/finder/match", fromFinderAnswers(a), { signal }))
    },
  }
}
