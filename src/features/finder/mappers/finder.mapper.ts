import { toRate } from "@/features/search"
import type {
  FinderCitiesNetwork,
  FinderMatchRequestNetwork,
  FinderMatchResponseNetwork,
  FinderResultNetwork,
} from "../network/finder.network"
import type { FinderAnswers, FinderMatch, FinderResult } from "../entities/finder.entity"

export function toCities(n: FinderCitiesNetwork | undefined): string[] {
  if (!n) return []
  return Array.isArray(n) ? n : (n.cities ?? [])
}

export function fromFinderAnswers(a: FinderAnswers): FinderMatchRequestNetwork {
  return {
    city: a.city,
    type: a.type,
    areaSqft: a.areaSqft ?? 0,
    goods: a.goods,
    industries: a.industries,
    nearPort: a.nearPort,
    nearRail: a.nearRail,
  }
}

export function toFinderMatch(n: FinderResultNetwork): FinderMatch {
  return {
    shortId: n.shortId,
    slug: n.slug,
    name: n.name,
    city: n.city ?? "",
    locality: n.locality ?? "",
    totalSqm: n.totalSqm,
    rate: toRate(n.rate),
    coverUrl: n.coverUrl ?? "",
    matchPercent: n.matchPercent,
    matched: n.matched ?? [],
    typeUnknown: n.typeUnknown,
    reason: n.reason ?? "",
  }
}

export function toFinderResult(n: FinderMatchResponseNetwork | undefined): FinderResult {
  return {
    results: (n?.results ?? []).slice(0, 3).map(toFinderMatch),
    message: n?.message ?? "",
  }
}
