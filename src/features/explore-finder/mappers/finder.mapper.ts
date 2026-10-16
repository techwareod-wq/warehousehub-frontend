import { toRate } from "@/features/search"
import type {
  FinderCitiesNetwork,
  FinderSearchRequestNetwork,
  FinderSearchResponseNetwork,
  FinderSearchResultNetwork,
} from "../network/finder.network"
import type { FinderFilters, FinderSearchResult, FinderWarehouse } from "../entities/finder.entity"

/** Results per search: every live warehouse fits (the API caps at 500). */
const LIMIT = 500

export function toCities(n: FinderCitiesNetwork | undefined): string[] {
  if (!n) return []
  return Array.isArray(n) ? n : (n.cities ?? [])
}

export function fromFinderFilters(f: FinderFilters): FinderSearchRequestNetwork {
  const out: FinderSearchRequestNetwork = {
    place: f.place,
    radiusKm: f.radiusKm,
    type: f.type,
    nearPort: f.nearPort,
    nearAirport: f.nearAirport,
    nearRail: f.nearRail,
    features: f.features,
    sort: f.sort,
    limit: LIMIT,
  }
  if (f.amount !== null && f.amount > 0) {
    if (f.unit === "pallets") out.pallets = f.amount
    else out.areaSqft = f.amount
  }
  return out
}

export function toFinderWarehouse(n: FinderSearchResultNetwork): FinderWarehouse {
  return {
    shortId: n.shortId,
    slug: n.slug,
    name: n.name,
    city: n.city ?? "",
    locality: n.locality ?? "",
    loc: n.loc ?? null,
    distKm: n.distKm ?? null,
    totalSqft: n.totalSqft,
    rate: toRate(n.rate),
    coverUrl: n.coverUrl ?? "",
    type: n.type ?? "",
    clearHeight: n.clearHeight ?? null,
    dockDoors: n.dockDoors ?? null,
    holdCapacityMt: n.holdCapacityMt ?? null,
    tags: n.tags ?? [],
    nearPort: n.nearPort,
    nearAirport: n.nearAirport,
    nearRail: n.nearRail,
  }
}

export function toFinderSearchResult(n: FinderSearchResponseNetwork | undefined): FinderSearchResult {
  return {
    total: n?.total ?? 0,
    totalSqft: n?.totalSqft ?? 0,
    centroid: n?.centroid ?? null,
    message: n?.message ?? "",
    results: (n?.results ?? []).map(toFinderWarehouse),
  }
}
