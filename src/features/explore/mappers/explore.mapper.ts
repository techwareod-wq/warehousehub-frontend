import { SQM_PER_SQFT } from "@/lib/units"
import { EMPTY_QUERY, type ListingCard, type MapPoint, type Rate, type SearchQuery } from "@/features/search"
import type { ExploreFilters, ExploreWarehouse } from "../entities/explore.entity"

function validPoint(p: MapPoint): boolean {
  return (
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    Math.abs(p.lat) <= 90 &&
    Math.abs(p.lng) <= 180 &&
    !(p.lat === 0 && p.lng === 0)
  )
}

/** Minor units per sq m per month → ₹ per sq ft per month. */
function ratePerSqft(rate: Rate | null): number | null {
  if (!rate || rate.onRequest || rate.perSqmMonth <= 0) return null
  return Math.round(rate.perSqmMonth * SQM_PER_SQFT) / 100
}

export function toExploreQuery(f: ExploreFilters): SearchQuery {
  return {
    ...EMPTY_QUERY,
    pricePerSqft: { max: f.maxRate ?? undefined },
    industries: f.industry ? [f.industry] : [],
  }
}

/** Cards joined to their map point by shortId; cards without a valid point are skipped. */
export function toExploreWarehouses(cards: ListingCard[], points: MapPoint[]): ExploreWarehouse[] {
  const at = new Map(points.filter(validPoint).map((p) => [p.shortId, p]))
  const out: ExploreWarehouse[] = []
  for (const c of cards) {
    const p = at.get(c.shortId)
    if (!p) continue
    out.push({
      shortId: c.shortId,
      slug: c.slug,
      name: c.name,
      city: c.city,
      locality: c.locality,
      lat: p.lat,
      lng: p.lng,
      totalSqm: c.totalSqm,
      rate: c.rate,
      ratePerSqft: ratePerSqft(c.rate),
      industries: c.industries,
      coverUrl: c.coverUrl,
    })
  }
  return out
}
