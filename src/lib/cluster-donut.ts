/**
 * Cluster rings split by warehouse type: a cluster's ring shows every type it
 * holds in equal shares (two types 50/50, three 33/33/34), a grey share for
 * warehouses with no type on file. One image per combination is drawn up front,
 * and a symbol layer picks the right one per cluster, so the rings are part of
 * the map canvas (globe included) and the layer's clicks work as before.
 */
import type { ExpressionSpecification, Map as MapLibreMap } from "maplibre-gl"
import { WAREHOUSE_TYPE_COLORS } from "./warehouse-type"

const PREFIX = "wt-ring-"
/** Logical size of a ring image, and the ring's outer radius in it. */
const SIZE = 64
const OUTER = 30
const THICKNESS = 7
const PIXEL_RATIO = 2

/** Ring order, clockwise from 12 o'clock; `u` is the no-type share. */
const KEYS = ["g", "f", "b", "u"] as const
type Key = (typeof KEYS)[number]

function draw(keys: Key[], unknownFill: string): ImageData {
  const px = SIZE * PIXEL_RATIO
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = px
  const ctx = canvas.getContext("2d")!
  ctx.scale(PIXEL_RATIO, PIXEL_RATIO)
  const c = SIZE / 2
  const fill: Record<Key, string> = {
    g: WAREHOUSE_TYPE_COLORS.general.fill,
    f: WAREHOUSE_TYPE_COLORS.ftwz.fill,
    b: WAREHOUSE_TYPE_COLORS.bonded.fill,
    u: unknownFill,
  }
  // The dark middle, so the count reads on any basemap.
  ctx.beginPath()
  ctx.arc(c, c, OUTER - THICKNESS / 2, 0, Math.PI * 2)
  ctx.fillStyle = "rgba(10, 18, 32, 0.78)"
  ctx.fill()
  // Equal shares, with a hairline gap between them when there's more than one.
  const share = (Math.PI * 2) / keys.length
  const gap = keys.length > 1 ? 0.08 : 0
  ctx.lineWidth = THICKNESS
  ctx.lineCap = "butt"
  keys.forEach((k, i) => {
    const start = -Math.PI / 2 + i * share + gap / 2
    ctx.beginPath()
    ctx.arc(c, c, OUTER - THICKNESS / 2, start, start + share - gap)
    ctx.strokeStyle = fill[k]
    ctx.shadowColor = fill[k]
    ctx.shadowBlur = 6
    ctx.stroke()
  })
  return ctx.getImageData(0, 0, px, px)
}

/** Adds every ring image to the map (again after a style change; existing ones are kept). */
export function addClusterRingImages(map: MapLibreMap, unknownFill: string) {
  // Every non-empty combination of the four shares.
  for (let mask = 1; mask < 1 << KEYS.length; mask++) {
    const keys = KEYS.filter((_, i) => mask & (1 << i))
    const id = PREFIX + keys.join("")
    if (!map.hasImage(id)) map.addImage(id, draw(keys, unknownFill), { pixelRatio: PIXEL_RATIO })
  }
}

const has = (n: ExpressionSpecification, key: Key): ExpressionSpecification => ["case", [">", n, 0], key, ""]

/** The ring image for a cluster (needs TYPE_CLUSTER_PROPERTIES on its source). */
export const CLUSTER_RING_IMAGE: ExpressionSpecification = [
  "concat",
  PREFIX,
  has(["get", "n_general"], "g"),
  has(["get", "n_ftwz"], "f"),
  has(["get", "n_bonded"], "b"),
  has(["-", ["get", "point_count"], ["+", ["get", "n_general"], ["get", "n_ftwz"], ["get", "n_bonded"]]], "u"),
]

/** icon-size that makes the ring's outer edge sit at `radius` (a px expression) plus a little. */
export function clusterRingSize(radius: ExpressionSpecification): ExpressionSpecification {
  return ["/", ["+", radius, 3], OUTER]
}
