import type { Map as MapLibreMap } from "maplibre-gl"

// EXPLORE-FILTERS: the map has its own column now, so the camera pads every side the same.
/** Breathing room on every side of the fitted area (EXPLORE-FILTERS: 32px, the map column is narrower). */
const EDGE = 32
/** At least this share of the canvas, per axis, is always left for the fitted area. */
const MIN_FREE = 0.4
const SINGLE_ZOOM = 10
const FALLBACK_ZOOM = 5

type Point = { lat: number; lng: number }
export type Padding = { top: number; right: number; bottom: number; left: number }

/** Uniform camera padding for the split layout (nothing floats over the fitted area). */
export const FIT_PADDING: Padding = { top: EDGE, right: EDGE, bottom: EDGE, left: EDGE }

function shrink(a: number, b: number, size: number): [number, number] {
  const max = size * (1 - MIN_FREE)
  if (a + b <= max) return [a, b]
  const k = max / (a + b)
  return [Math.floor(a * k), Math.floor(b * k)]
}

/**
 * Scales padding down so it can never exceed the canvas (MapLibre's fitBounds
 * throws when it does: cameraForBounds returns undefined).
 */
export function clampPadding(p: Padding, width: number, height: number): Padding {
  const [left, right] = shrink(p.left, p.right, width)
  const [top, bottom] = shrink(p.top, p.bottom, height)
  return { top, right, bottom, left }
}

/**
 * Frames `points` without ever throwing: skips a zero-size canvas, flies to a
 * single point at zoom 10, and falls back to the bounds' centre at zoom 5 if
 * fitBounds fails. Returns whether the camera moved.
 */
export function safeFit(
  map: MapLibreMap,
  points: Point[],
  padding: Padding,
  opts: { duration: number; maxZoom: number },
  eventData?: object,
): boolean {
  // The container, not the canvas: a hidden container still has a stale canvas size.
  const el = map.getContainer()
  const width = el.clientWidth
  const height = el.clientHeight
  if (!points.length || !width || !height) return false
  const pad = clampPadding(padding, width, height)
  // MapLibre adds the map's own padding (left over from the globe hero view or
  // an earlier flyTo) to `pad`. When the sum doesn't fit the canvas its globe
  // camera throws ("reading 'center'") instead of skipping, so drop the
  // leftover padding first.
  const { top = 0, right = 0, bottom = 0, left = 0 } = map.getPadding()
  const maxW = width * (1 - MIN_FREE)
  const maxH = height * (1 - MIN_FREE)
  if (left + right + pad.left + pad.right > maxW || top + bottom + pad.top + pad.bottom > maxH) {
    map.setPadding({ top: 0, right: 0, bottom: 0, left: 0 })
  }
  if (points.length === 1) {
    map.flyTo({ center: [points[0].lng, points[0].lat], zoom: SINGLE_ZOOM, padding: pad, duration: opts.duration, essential: true }, eventData)
    return true
  }
  const lngs = points.map((p) => p.lng)
  const lats = points.map((p) => p.lat)
  const [west, south, east, north] = [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)]
  try {
    map.fitBounds(
      [
        [west, south],
        [east, north],
      ],
      { padding: pad, maxZoom: opts.maxZoom, duration: opts.duration, essential: true },
      eventData,
    )
  } catch (err) {
    // Recovered below, so a warning (console.error raises the Next dev overlay).
    console.warn("[finder] fitBounds failed, flying to the centre instead", err)
    map.flyTo({ center: [(west + east) / 2, (south + north) / 2], zoom: FALLBACK_ZOOM, duration: opts.duration, essential: true }, eventData)
  }
  return true
}
