import { unitLabel } from "@/lib/units"
import type { AdminListingCard, FilterCatalog, FilterFieldDef, FilterGroupDef, SearchQuery } from "../entities/search.entity"

/**
 * One addable attribute filter: the attribute itself ("has cold storage",
 * no field) or one of its fields. Its key is the node key or "node.field".
 */
export interface FilterItem {
  key: string
  group: FilterGroupDef
  field?: FilterFieldDef
}

const NUMERIC = new Set(["number", "area", "ratio", "range"])

export function isNumeric(f: FilterFieldDef): boolean {
  return NUMERIC.has(f.type)
}

function isOptions(f: FilterFieldDef): boolean {
  return f.type === "pick" || f.type === "multi"
}

/** Every addable filter, in tree order. */
export function filterItems(catalog: FilterCatalog): FilterItem[] {
  const out: FilterItem[] = []
  for (const g of catalog.groups) {
    if (g.selectable) out.push({ key: g.key, group: g })
    for (const f of g.fields) out.push({ key: f.key, group: g, field: f })
  }
  return out
}

/** Short name for a column / row title. */
export function itemName(item: FilterItem): string {
  return item.field ? item.field.name : `Has ${item.group.name}`
}

/** Whether the query filters on item. */
export function isActive(item: FilterItem, q: SearchQuery): boolean {
  const f = item.field
  if (!f) return q.chips.includes(item.key)
  if (f.type === "bool") return q.chips.includes(f.key)
  if (isOptions(f)) return q.chips.some((c) => c.startsWith(`${f.key}:`))
  const r = q.ranges[f.key]
  return !!r && (r.min !== undefined || r.max !== undefined)
}

/** The query patch that removes item's filter. */
export function clearItem(item: FilterItem, q: SearchQuery): Partial<SearchQuery> {
  const f = item.field
  if (!f || f.type === "bool") return { chips: q.chips.filter((c) => c !== item.key) }
  if (isOptions(f)) return { chips: q.chips.filter((c) => !c.startsWith(`${f.key}:`)) }
  const ranges = { ...q.ranges }
  delete ranges[f.key]
  return { ranges }
}

function num(v: number): string {
  return Number(v.toFixed(2)).toLocaleString("en-IN")
}

/**
 * The warehouse's value for item, from its search projection: "Yes" / "No",
 * the picked option labels, a number or "2 – 8 °C"; "Unknown" when it is
 * marked unknown, "—" when the attribute doesn't apply.
 */
export function cardValue(item: FilterItem, card: AdminListingCard): string {
  const g = item.group.key
  const nodeYes = card.chips.includes(g)
  if (!nodeYes) return card.unk.includes(g) ? "Unknown" : item.field ? "—" : "No"
  const f = item.field
  if (!f) return "Yes"
  const unknown = card.unk.includes(f.key) ? "Unknown" : "—"
  if (f.type === "bool") return card.chips.includes(f.key) ? "Yes" : card.unk.includes(f.key) ? "Unknown" : "No"
  if (isOptions(f)) {
    const labels = f.options.filter((o) => card.chips.includes(o.key)).map((o) => o.label)
    return labels.length ? labels.join(", ") : unknown
  }
  const unit = unitLabel(f.unit)
  const suffix = unit ? ` ${unit}` : ""
  if (f.type === "range") {
    const lo = card.nums[`${f.key}_min`]
    const hi = card.nums[`${f.key}_max`]
    if (lo === undefined || hi === undefined) return unknown
    return `${num(lo)} – ${num(hi)}${suffix}`
  }
  const v = card.nums[f.key]
  return v === undefined ? unknown : `${num(v)}${suffix}`
}
