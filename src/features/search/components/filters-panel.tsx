"use client"

import { useMemo, useState } from "react"
import { ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui"
import { Checkbox } from "@/components/common"
import { unitLabel } from "@/lib/units"
import { cn } from "@/lib/utils"
import type { Bounds, FilterCatalog, FilterFieldDef, FilterGroupDef, MinMax, SearchQuery } from "../entities/search.entity"
import { clearItem, isActive, isNumeric, type FilterItem } from "../lib/filter-items"
import { RangeSliderRow } from "./range-slider-row"

type Facets = {
  chips: Record<string, number>
  industries: Record<string, { fit: number; unverified: number }>
  ranges: Record<string, Bounds>
  price: Bounds | null
  area: Bounds | null
}

/** One attribute with its sub-attributes, in catalog (tree) order. */
interface AttrNode {
  group: FilterGroupDef
  children: AttrNode[]
}

function buildTree(groups: FilterGroupDef[]): AttrNode[] {
  const byKey = new Map(groups.map((g) => [g.key, { group: g, children: [] as AttrNode[] }]))
  const roots: AttrNode[] = []
  for (const g of groups) {
    const node = byKey.get(g.key)!
    const parent = g.ancestors.map((a) => byKey.get(a)).find(Boolean)
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  return roots
}

function subtree(node: AttrNode): AttrNode[] {
  return [node, ...node.children.flatMap(subtree)]
}

function nodeActive(node: AttrNode, q: SearchQuery): boolean {
  return subtree(node).some(
    (n) => q.chips.includes(n.group.key) || n.group.fields.some((f) => isActive({ key: f.key, group: n.group, field: f }, q)),
  )
}

const AREA = "__area"
const PRICE = "__price"

/** Value bounds in this result by slider key; range fields keep _min / _max stats. */
function resultBounds(groups: FilterGroupDef[], facets: Facets): Record<string, Bounds> {
  const out: Record<string, Bounds> = {}
  if (facets.area) out[AREA] = facets.area
  if (facets.price) out[PRICE] = facets.price
  for (const g of groups)
    for (const f of g.fields) {
      if (!isNumeric(f)) continue
      const lo = facets.ranges[f.key]?.min ?? facets.ranges[`${f.key}_min`]?.min
      const hi = facets.ranges[f.key]?.max ?? facets.ranges[`${f.key}_max`]?.max
      if (lo !== undefined && hi !== undefined) out[f.key] = { min: lo, max: hi }
    }
  return out
}

/** seen widened by next; seen itself when nothing grew. */
function widen(seen: Record<string, Bounds>, next: Record<string, Bounds>): Record<string, Bounds> {
  let out = seen
  for (const [k, b] of Object.entries(next)) {
    const s = seen[k]
    if (s && s.min <= b.min && s.max >= b.max) continue
    out = { ...out, [k]: s ? { min: Math.min(s.min, b.min), max: Math.max(s.max, b.max) } : b }
  }
  return out
}

/**
 * The search filters: radius (once there is a place), area and rent, then
 * every attribute the admin made filterable as a tree — tick an attribute
 * ("Cold storage") to filter on it and open its sub-attributes and fields
 * (yes/no, options, a drag bar for numbers). Industries last. Counts come from the last
 * result's facets. Admin search passes the staff catalog and staffTags.
 */
export function FiltersPanel({
  catalog,
  query,
  result,
  staffTags = false,
  onChange,
}: {
  catalog: FilterCatalog
  query: SearchQuery
  result: { facets: Facets } | null
  staffTags?: boolean
  onChange: (q: SearchQuery) => void
}) {
  const [open, setOpen] = useState<string[]>([])
  const tree = useMemo(() => buildTree(catalog.groups), [catalog])
  const set = (patch: Partial<SearchQuery>) => onChange({ ...query, ...patch, page: 1 })
  const toggle = (list: string[], key: string) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key])
  const chips = result?.facets.chips
  // Slider ends: the widest values seen so far, so a bar doesn't shrink as filters narrow the results.
  const [seen, setSeen] = useState<Record<string, Bounds>>({})
  const grown = result ? widen(seen, resultBounds(catalog.groups, result.facets)) : seen
  if (grown !== seen) setSeen(grown)

  // A field filter implies its attribute and that attribute's parents, so
  // their own "has …" chips are dropped once a field inside is set.
  const setField = (group: FilterGroupDef, patch: Partial<SearchQuery>) => {
    const implied = [group.key, ...group.ancestors]
    set({ ...patch, chips: (patch.chips ?? query.chips).filter((c) => !implied.includes(c)) })
  }

  const toggleNode = (node: AttrNode) => {
    if (nodeActive(node, query)) {
      // Unticking an attribute clears everything inside it.
      let q: SearchQuery = query
      for (const n of subtree(node)) {
        q = { ...q, chips: q.chips.filter((c) => c !== n.group.key) }
        for (const f of n.group.fields) q = { ...q, ...clearItem({ key: f.key, group: n.group, field: f }, q) }
      }
      set({ chips: q.chips, ranges: q.ranges })
      return
    }
    setOpen((o) => (o.includes(node.group.key) ? o : [...o, node.group.key]))
    if (node.group.selectable) set({ chips: [...query.chips, node.group.key] })
  }

  const active =
    query.chips.length +
    query.industries.length +
    Object.values(query.ranges).filter((r) => r.min !== undefined || r.max !== undefined).length +
    (query.areaSqft.min !== undefined || query.areaSqft.max !== undefined ? 1 : 0) +
    (query.pricePerSqft.min !== undefined || query.pricePerSqft.max !== undefined ? 1 : 0)
  const radius = query.radiusKm ?? catalog.defaultRadiusKm

  const staffOnly = <span className="ml-1.5 text-[10px] text-muted-foreground">staff only</span>

  const renderField = (group: FilterGroupDef, f: FilterFieldDef) => {
    const item: FilterItem = { key: f.key, group, field: f }
    const tag = staffTags && !f.public && staffOnly
    const count = (key: string) => (chips?.[key] !== undefined ? chips[key] : undefined)

    if (f.type === "bool") {
      const on = query.chips.includes(f.key)
      return (
        <Checkbox
          key={f.key}
          checked={on}
          onChange={() => setField(group, on ? clearItem(item, query) : { chips: [...query.chips, f.key] })}
          label={
            <>
              {f.name}
              {count(f.key) !== undefined && <span className="ml-1 text-muted-foreground">{count(f.key)}</span>}
              {tag}
            </>
          }
          className="text-xs"
        />
      )
    }

    if (f.type === "pick" || f.type === "multi") {
      const others = query.chips.filter((c) => !c.startsWith(`${f.key}:`))
      return (
        <div key={f.key} className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">
            {f.name}
            {f.type === "multi" && " (any of)"}
            {tag}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {f.options.map((o) => {
              const on = query.chips.includes(o.key)
              const n = count(o.key)
              const next = f.type === "pick" ? (on ? others : [...others, o.key]) : toggle(query.chips, o.key)
              return (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setField(group, { chips: next })}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
                  )}
                >
                  {o.label}
                  {!on && n !== undefined && <span className="ml-1 opacity-60">{n}</span>}
                </button>
              )
            })}
          </div>
        </div>
      )
    }

    if (isNumeric(f)) {
      return (
        <div key={f.key} className="flex flex-col gap-1">
          <RangeSliderRow
            label={`${f.type === "range" ? `${f.name} you need` : f.name}${staffTags && !f.public ? " (staff only)" : ""}`}
            unit={unitLabel(f.unit) || undefined}
            value={query.ranges[f.key] ?? {}}
            bounds={grown[f.key] ?? null}
            onChange={(v: MinMax) => setField(group, { ranges: { ...query.ranges, [f.key]: v } })}
          />
          {f.type === "range" && <span className="text-[11px] text-muted-foreground">Warehouses whose range reaches what you pick.</span>}
        </div>
      )
    }
    return null
  }

  // A ticked attribute opens its sub-attributes too, so their fields are one click away.
  const renderNode = (node: AttrNode, depth: number, parentOn: boolean): React.ReactNode => {
    const g = node.group
    const on = nodeActive(node, query)
    const expanded = on || parentOn || open.includes(g.key)
    const hasInside = g.fields.length > 0 || node.children.length > 0
    const n = chips?.[g.key]
    const dead = !on && result !== null && g.selectable && (n ?? 0) === 0
    return (
      <div key={g.key} className={cn("flex flex-col gap-3", depth > 0 && "border-l border-border pl-3")}>
        <div className="flex items-center justify-between gap-2">
          <Checkbox
            checked={on}
            disabled={dead}
            onChange={() => toggleNode(node)}
            label={
              <>
                {g.name}
                {n !== undefined && <span className="ml-1 text-muted-foreground">{n}</span>}
                {staffTags && !g.public && staffOnly}
              </>
            }
            className={depth === 0 ? "font-medium" : "text-xs"}
          />
          {hasInside && !on && !parentOn && (
            <button
              type="button"
              aria-label={expanded ? `Hide ${g.name} options` : `Show ${g.name} options`}
              aria-expanded={expanded}
              onClick={() => setOpen(toggle(open, g.key))}
              className="rounded-full p-1 text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
            </button>
          )}
        </div>
        {expanded && hasInside && (
          <div className="flex flex-col gap-3 pl-6">
            {g.fields.map((f) => renderField(g, f))}
            {node.children.map((c) => renderNode(c, depth + 1, on))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl tracking-tight">Filters</h2>
        {active > 0 && (
          <Button
            size="xs"
            variant="ghost"
            onClick={() => set({ chips: [], industries: [], ranges: {}, areaSqft: {}, pricePerSqft: {}, includeUnverified: false })}
          >
            <X /> Clear {active}
          </Button>
        )}
      </div>

      {query.place && catalog.radiusSteps.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium">Search radius</span>
          <div className="flex flex-wrap gap-1.5">
            {catalog.radiusSteps.map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => set({ radiusKm: km })}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  km === radius ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
                )}
              >
                {km} km
              </button>
            ))}
          </div>
        </div>
      )}

      <RangeSliderRow
        label="Total area"
        unit="sq ft"
        value={query.areaSqft}
        bounds={grown[AREA] ?? null}
        onChange={(areaSqft) => set({ areaSqft })}
      />
      <RangeSliderRow
        label="Rent"
        unit="₹ / sq ft / month"
        value={query.pricePerSqft}
        bounds={grown[PRICE] ?? null}
        onChange={(pricePerSqft) => set({ pricePerSqft })}
      />

      {tree.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium">Facilities</span>
          <div className="flex flex-col gap-4">{tree.map((n) => renderNode(n, 0, false))}</div>
        </div>
      )}

      {catalog.industries.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium">Suitable for</span>
          <div className="flex flex-wrap gap-1.5">
            {catalog.industries.map((ind) => {
              const on = query.industries.includes(ind.key)
              const count = result?.facets.industries[ind.key]
              return (
                <button
                  key={ind.key}
                  type="button"
                  onClick={() => set({ industries: toggle(query.industries, ind.key) })}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
                  )}
                >
                  {ind.name}
                  {count && !on && <span className="ml-1 opacity-60">{count.fit}</span>}
                </button>
              )
            })}
          </div>
          {query.industries.length > 0 && (
            <Checkbox
              checked={query.includeUnverified}
              onChange={(includeUnverified) => set({ includeUnverified })}
              label="Include listings we haven't verified yet"
              className="text-xs"
            />
          )}
        </div>
      )}
    </div>
  )
}
