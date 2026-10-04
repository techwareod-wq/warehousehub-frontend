import type { MinMax, SearchQuery, SortKey } from "../entities/search.entity"

/**
 * SearchQuery ⇄ URL search params, so a search is linkable and the back
 * button works. Short keys: q, r, amin/amax (sq ft), pmin/pmax (₹/sq ft),
 * ind, chips, uv, arch (admin: include archived), sort, page, ai
 * (natural-language text), rg.<path>=min~max.
 */
function num(v: string | null): number | undefined {
  if (v === null || v.trim() === "") return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

function list(v: string | null): string[] {
  return v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []
}

export function queryFromParams(p: URLSearchParams): SearchQuery {
  const ranges: Record<string, MinMax> = {}
  p.forEach((value, key) => {
    if (!key.startsWith("rg.")) return
    const [min, max] = value.split("~")
    ranges[key.slice(3)] = { min: num(min ?? null), max: num(max ?? null) }
  })
  return {
    place: p.get("q") ?? "",
    radiusKm: num(p.get("r")),
    areaSqft: { min: num(p.get("amin")), max: num(p.get("amax")) },
    pricePerSqft: { min: num(p.get("pmin")), max: num(p.get("pmax")) },
    industries: list(p.get("ind")),
    includeUnverified: p.get("uv") === "1",
    chips: list(p.get("chips")),
    ranges,
    includeArchived: p.get("arch") === "1",
    sort: (p.get("sort") as SortKey) || undefined,
    page: Math.max(1, num(p.get("page")) ?? 1),
  }
}

export function queryToParams(q: SearchQuery, extra: Record<string, string> = {}): URLSearchParams {
  const p = new URLSearchParams()
  const set = (k: string, v: string | number | undefined) => {
    if (v !== undefined && v !== "") p.set(k, String(v))
  }
  set("q", q.place.trim())
  set("r", q.radiusKm)
  set("amin", q.areaSqft.min)
  set("amax", q.areaSqft.max)
  set("pmin", q.pricePerSqft.min)
  set("pmax", q.pricePerSqft.max)
  if (q.industries.length) p.set("ind", q.industries.join(","))
  if (q.includeUnverified) p.set("uv", "1")
  if (q.chips.length) p.set("chips", q.chips.join(","))
  if (q.includeArchived) p.set("arch", "1")
  for (const [k, v] of Object.entries(q.ranges)) {
    if (v.min === undefined && v.max === undefined) continue
    p.set(`rg.${k}`, `${v.min ?? ""}~${v.max ?? ""}`)
  }
  set("sort", q.sort)
  if (q.page > 1) p.set("page", String(q.page))
  for (const [k, v] of Object.entries(extra)) if (v) p.set(k, v)
  return p
}
