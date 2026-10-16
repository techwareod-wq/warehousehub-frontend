import type { Map as MapLibreMap } from "maplibre-gl"

/** Breathing room on every side of the fitted area. */
const EDGE = 48
/** Wide screens: the finder panel floats over the left of the map. */
const SIDE_PANEL = "(min-width: 1024px)"
/** At least this share of the canvas, per axis, is always left for the fitted area. */
const MIN_FREE = 0.4
const SINGLE_ZOOM = 10
const FALLBACK_ZOOM = 5

type Point = { lat: number; lng: number }
export type Padding = { top: number; right: number; bottom: number; left: number }

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
 * Camera padding for the finder layout: 48px all round, plus whatever the
 * panel actually covers: its width on wide screens (it floats over the map's
 * left), the toolbar on small screens in map view. Measured on screen, so the
 * full-width list (where the map is hidden anyway) never inflates it.
 */
export function finderPadding(container: HTMLElement | null, panel: HTMLElement | null): Padding {
  const pad = { top: EDGE, right: EDGE, bottom: EDGE, left: EDGE }
  if (!container) return pad
  const c = container.getBoundingClientRect()
  const p = panel?.getBoundingClientRect()
  if (p && p.width > 0 && p.height > 0) {
    if (window.matchMedia(SIDE_PANEL).matches) pad.left = Math.max(EDGE, p.right - c.left + EDGE)
    else if (p.bottom - c.top < c.height / 2) pad.top = Math.max(EDGE, p.bottom - c.top + 16)
  }
  return clampPadding(pad, c.width, c.height)
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
    console.error("[finder] fitBounds failed, flying to the centre instead", err)
    map.flyTo({ center: [(west + east) / 2, (south + north) / 2], zoom: FALLBACK_ZOOM, duration: opts.duration, essential: true }, eventData)
  }
  return true
}
