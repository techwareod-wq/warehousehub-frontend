/**
 * The site-wide warehouse type colour code: General is blue, FTWZ green,
 * Bonded yellow. Markup uses `data-wt={type}` with the `.wt-*` classes in
 * globals.css; the maps (which need literal colours) use the hex values here.
 * Keep the two in sync.
 */
import type { ExpressionSpecification } from "maplibre-gl"

export type WarehouseTypeKey = "general" | "ftwz" | "bonded"

export const WAREHOUSE_TYPE_COLORS: Record<WarehouseTypeKey, { fill: string; text: string }> = {
  general: { fill: "#3b82f6", text: "#60a5fa" },
  ftwz: { fill: "#22c55e", text: "#4ade80" },
  bonded: { fill: "#eab308", text: "#facc15" },
}

/** Pins whose type isn't on file. */
export const UNKNOWN_TYPE_FILL = "#94a3b8"

export function isWarehouseType(t: string | null | undefined): t is WarehouseTypeKey {
  return t === "general" || t === "ftwz" || t === "bonded"
}

/** The `data-wt` value for a type, undefined when it isn't one of the three. */
export function wtAttr(t: string | null | undefined): WarehouseTypeKey | undefined {
  const k = t?.toLowerCase()
  return isWarehouseType(k) ? k : undefined
}

/** Classes for a type pill (pair with data-wt={wtAttr(type)}): the type's colour, or plain glass when it isn't one of the three. */
export function typeBadge(t: string | null | undefined): string {
  const base = "rounded-full border px-2.5 py-0.5 text-xs font-semibold"
  return wtAttr(t) ? `wt-badge ${base}` : `${base} border-white/15 bg-white/8 text-white/90`
}

/** The pin fill for a type (UNKNOWN_TYPE_FILL when it isn't one of the three). */
export function typeFill(t: string | null | undefined): string {
  const k = wtAttr(t)
  return k ? WAREHOUSE_TYPE_COLORS[k].fill : UNKNOWN_TYPE_FILL
}

/**
 * A MapLibre colour expression on the feature's `type` property, falling back
 * to `fallback` for anything else.
 */
export function typeColorExpression(fallback: string = UNKNOWN_TYPE_FILL): ExpressionSpecification {
  const c = WAREHOUSE_TYPE_COLORS
  return ["match", ["get", "type"], "general", c.general.fill, "ftwz", c.ftwz.fill, "bonded", c.bonded.fill, fallback]
}

/** Per-type counts kept on clustered GeoJSON sources (`clusterProperties`). */
export const TYPE_CLUSTER_PROPERTIES: Record<string, ExpressionSpecification> = {
  n_general: ["+", ["case", ["==", ["get", "type"], "general"], 1, 0]],
  n_ftwz: ["+", ["case", ["==", ["get", "type"], "ftwz"], 1, 0]],
  n_bonded: ["+", ["case", ["==", ["get", "type"], "bonded"], 1, 0]],
}
