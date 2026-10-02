import { SQM_PER_SQFT, sqftToSqm, sqmToSqft } from "@/lib/units"
import type {
  MapResponseNetwork,
  PublicCatalogNetwork,
  PublicRateNetwork,
  SearchCardNetwork,
  SearchFiltersNetwork,
  SearchResponseNetwork,
} from "../network/search.network"
import type { FilterCatalog, ListingCard, MapData, MinMax, Rate, SearchQuery, SearchResult, SortKey } from "../entities/search.entity"

const PINCODE = /^\d{6}$/

/** ₹/sq ft/month (major) → minor units per sq m per month. */
function perSqftToPerSqmMinor(v: number): number {
  return Math.round((v / SQM_PER_SQFT) * 100)
}

function perSqmMinorToPerSqft(v: number): number {
  return Math.round(v * SQM_PER_SQFT) / 100
}

function cleanMinMax(m: MinMax, convert: (v: number) => number = (v) => v): { min?: number; max?: number } | undefined {
  const out: { min?: number; max?: number } = {}
  if (m.min !== undefined && Number.isFinite(m.min)) out.min = convert(m.min)
  if (m.max !== undefined && Number.isFinite(m.max)) out.max = convert(m.max)
  return out.min === undefined && out.max === undefined ? undefined : out
}

export function toLocation(place: string, country: string): SearchFiltersNetwork["location"] {
  const p = place.trim()
  if (!p) return undefined
  return PINCODE.test(p) ? { postalCode: p, country } : { place: p, country }
}

export function fromSearchQuery(q: SearchQuery, ctx: { country: string; currency: string; sessionId: string }): SearchFiltersNetwork {
  const out: SearchFiltersNetwork = { page: q.page, sessionId: ctx.sessionId || undefined }
  out.location = toLocation(q.place, ctx.country)
  if (q.radiusKm) out.radiusKm = q.radiusKm
  const area = cleanMinMax(q.areaSqft, sqftToSqm)
  if (area) {
    out.areaSqm = area
    const typed = q.areaSqft.min ?? q.areaSqft.max
    if (typed !== undefined) out.areaInput = { value: typed, unit: "sqft", intent: q.areaSqft.min !== undefined ? "min" : "max" }
  }
  const price = cleanMinMax(q.pricePerSqft, perSqftToPerSqmMinor)
  if (price) out.price = { currency: ctx.currency, perSqmMonthMin: price.min, perSqmMonthMax: price.max }
  if (q.industries.length) out.industries = q.industries
  if (q.includeUnverified) out.includeUnverified = true
  if (q.chips.length) out.chips = q.chips
  const ranges: Record<string, { min?: number; max?: number }> = {}
  for (const [k, v] of Object.entries(q.ranges)) {
    const r = cleanMinMax(v)
    if (r) ranges[k] = r
  }
  if (Object.keys(ranges).length) out.ranges = ranges
  if (q.sort) out.sort = q.sort
  return out
}

/** The applied filters back into a query (so an AI parse fills the filter panel). */
export function toSearchQuery(f: SearchFiltersNetwork | undefined): SearchQuery {
  const loc = f?.location
  const ranges: Record<string, MinMax> = {}
  for (const [k, v] of Object.entries(f?.ranges ?? {})) ranges[k] = { min: v.min, max: v.max }
  return {
    place: loc?.postalCode ?? loc?.place ?? "",
    radiusKm: f?.radiusKm || undefined,
    areaSqft: {
      min: f?.areaSqm?.min !== undefined ? Math.round(sqmToSqft(f.areaSqm.min)) : undefined,
      max: f?.areaSqm?.max !== undefined ? Math.round(sqmToSqft(f.areaSqm.max)) : undefined,
    },
    pricePerSqft: {
      min: f?.price?.perSqmMonthMin !== undefined ? perSqmMinorToPerSqft(f.price.perSqmMonthMin) : undefined,
      max: f?.price?.perSqmMonthMax !== undefined ? perSqmMinorToPerSqft(f.price.perSqmMonthMax) : undefined,
    },
    industries: f?.industries ?? [],
    includeUnverified: !!f?.includeUnverified,
    chips: f?.chips ?? [],
    ranges,
    sort: (f?.sort as SortKey) || undefined,
    page: f?.page || 1,
  }
}

export function toRate(n: PublicRateNetwork | null | undefined): Rate | null {
  if (!n) return null
  return {
    amount: n.amount,
    currency: n.currency,
    basis: n.basis ?? "",
    perSqmMonth: n.perSqmMonth ?? 0,
    approx: n.approx,
    onRequest: n.onRequest,
  }
}

export function toListingCard(n: SearchCardNetwork): ListingCard {
  return {
    shortId: n.shortId,
    slug: n.slug,
    name: n.name,
    city: n.city ?? "",
    locality: n.locality ?? "",
    distKm: n.distKm ?? null,
    totalSqm: n.totalSqm,
    rate: toRate(n.rate),
    industries: n.industries ?? [],
    unverified: n.unverified,
    coverUrl: n.coverUrl ?? "",
  }
}

export function toSearchResult(n: SearchResponseNetwork): SearchResult {
  const limit = n.limit || 1
  return {
    searchId: n.searchId,
    applied: toSearchQuery(n.applied?.filters),
    appliedRaw: n.applied?.filters,
    dropped: n.applied?.dropped ?? [],
    resolvedPoint: n.applied?.resolvedPoint ?? null,
    radius: n.radius ? { ...n.radius, message: n.radius.message ?? "" } : null,
    results: (n.results ?? []).map(toListingCard),
    page: n.page,
    limit: n.limit,
    total: n.total,
    pages: Math.max(1, Math.ceil(n.total / limit)),
    facets: {
      chips: n.facets?.chips ?? {},
      industries: n.facets?.industries ?? {},
      ranges: n.facets?.ranges ?? {},
      price: n.facets?.price ?? null,
      area: n.facets?.area ?? null,
    },
    fallback:
      n.fallback && n.fallback.used
        ? { reason: n.fallback.reason, source: n.fallback.source, results: (n.fallback.results ?? []).map(toListingCard) }
        : null,
    degraded: n.degraded ?? [],
    ai: n.ai ? { parsed: n.ai.parsed, notes: n.ai.notes ?? [] } : null,
  }
}

export function toFilterCatalog(n: PublicCatalogNetwork): FilterCatalog {
  return {
    rulesVersion: n.rulesVersion,
    country: n.country,
    currency: n.currency,
    defaultRadiusKm: n.defaultRadiusKm,
    radiusSteps: n.radiusSteps ?? [],
    chipRows: (n.chipRows ?? []).map((r) => ({ row: r.row, chips: r.chips ?? [] })),
    ranges: (n.ranges ?? []).map((r) => ({ key: r.key, label: r.label, type: r.type, unit: r.unit ?? "", row: r.row ?? "" })),
    industries: n.industries ?? [],
  }
}

export function toMapData(n: MapResponseNetwork): MapData {
  const bbox = n.bbox && n.bbox.length === 4 ? (n.bbox as [number, number, number, number]) : null
  return {
    points: (n.points ?? []).map(([shortId, lat, lng, priceBand]) => ({ shortId, lat, lng, priceBand })),
    bbox,
    total: n.total,
  }
}
