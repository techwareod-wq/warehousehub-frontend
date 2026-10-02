import { parseDate } from "@/lib/format"
import type { ConversionNetwork, OverviewNetwork, SearchEventNetwork, TopQueriesNetwork, ZeroQueriesNetwork } from "../network/analytics.network"
import type { Conversion, Overview, SearchEvent, TopQuery, ZeroQuery } from "../entities/analytics.entity"

export function toOverview(n: OverviewNetwork): Overview {
  return {
    from: n.from,
    to: n.to,
    totals: n.totals,
    daily: (n.daily ?? []).map((d) => ({
      date: d.date,
      searches: d.searches,
      aiSearches: d.aiSearches,
      zeroResult: d.zeroResult,
      fallbackUsed: d.fallbackUsed,
      enquiries: d.enquiries,
      enquiriesFromSearch: d.enquiriesFromSearch,
    })),
  }
}

export function toTopQueries(n: TopQueriesNetwork): TopQuery[] {
  return n.items ?? []
}

export function toZeroQueries(n: ZeroQueriesNetwork): ZeroQuery[] {
  return (n.items ?? []).map((i) => ({ q: i.q, place: i.place ?? "", n: i.n }))
}

export function toConversion(n: ConversionNetwork): Conversion {
  return {
    searches: n.searches,
    searchesWithResults: n.searchesWithResults,
    enquiries: n.enquiries,
    enquiriesFromSearch: n.enquiriesFromSearch,
    rate: n.rate,
    byQuery: n.byQuery ?? [],
    byListing: n.byListing ?? [],
  }
}

export function toSearchEvent(n: SearchEventNetwork): SearchEvent {
  return {
    id: n.id,
    at: parseDate(n.at),
    kind: n.kind,
    text: n.rawText ?? "",
    place: n.placeLabel ?? "",
    resultCount: n.resultCount,
    fallbackUsed: n.fallbackUsed,
    fallbackReason: n.fallbackReason ?? "",
    aiParsed: n.ai ? n.ai.parsed : null,
    latencyMs: n.latencyMs,
    radiusKm: n.radius?.usedKm ?? null,
    expanded: !!n.radius?.expanded,
    degraded: n.degraded ?? [],
    isStaff: n.isStaff,
    filters: n.filters ?? {},
  }
}
