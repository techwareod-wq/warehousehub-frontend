import { mapPage, type HttpClient, type Page, type PageNetwork } from "@/core/api"
import type { ConversionNetwork, OverviewNetwork, SearchEventNetwork, TopQueriesNetwork, ZeroQueriesNetwork } from "../network/analytics.network"
import { toConversion, toOverview, toSearchEvent, toTopQueries, toZeroQueries } from "../mappers/analytics.mapper"
import type { Conversion, DateRange, Overview, SearchEvent, SearchLogFilter, TopQuery, ZeroQuery } from "../entities/analytics.entity"

/** Search analytics (/v1/admin/analytics/search/*, approver). */
export function analyticsApi(client: HttpClient) {
  return {
    async overview(r: DateRange): Promise<Overview> {
      return toOverview(await client.get<OverviewNetwork>("/v1/admin/analytics/search/overview", { ...r }))
    },
    async top(r: DateRange, limit?: number): Promise<TopQuery[]> {
      return toTopQueries(await client.get<TopQueriesNetwork>("/v1/admin/analytics/search/top", { ...r, limit }))
    },
    async zeroResults(r: DateRange, limit?: number): Promise<ZeroQuery[]> {
      return toZeroQueries(await client.get<ZeroQueriesNetwork>("/v1/admin/analytics/search/zero-results", { ...r, limit }))
    },
    async conversion(r: DateRange, limit?: number): Promise<Conversion> {
      return toConversion(await client.get<ConversionNetwork>("/v1/admin/analytics/search/conversion", { ...r, limit }))
    },
    async log(f: SearchLogFilter, page = 1, limit?: number): Promise<Page<SearchEvent>> {
      return mapPage(
        await client.get<PageNetwork<SearchEventNetwork>>("/v1/admin/analytics/search/log", {
          q: f.q,
          zero: f.zero ? "true" : undefined,
          from: f.from,
          to: f.to,
          page,
          limit,
        }),
        toSearchEvent,
      )
    },
  }
}
