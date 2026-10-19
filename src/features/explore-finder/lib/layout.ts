import type { LatLng } from "../entities/finder.entity"

/** [west, south, east, north], as MapLibre's getBounds() gives them. */
export type MapBounds = [number, number, number, number]

/**
 * The split layout below the site header. Wide screens: filters + cards on the
 * left (about half the viewport, 720–960px), the map in a rounded frame on the
 * right, 12px from the edges. Below lg: the map on top (about 45%), cards below.
 * Explore positions its map canvas with MAP_FRAME and the finder draws its
 * floating controls over the same box, so the two always line up.
 */
export const LEFT_AREA =
  "max-lg:inset-x-0 max-lg:top-[45%] max-lg:bottom-0 max-lg:px-2 max-lg:pb-2 max-lg:pt-1 lg:inset-y-0 lg:left-0 lg:w-[clamp(720px,50vw,960px)] lg:p-3"
export const MAP_FRAME =
  "max-lg:inset-x-2 max-lg:top-2 max-lg:bottom-[calc(55%+0.25rem)] lg:top-3 lg:right-3 lg:bottom-3 lg:left-[clamp(720px,50vw,960px)]"

export function inBounds(p: LatLng, [west, south, east, north]: MapBounds): boolean {
  if (p.lat < south || p.lat > north) return false
  return west <= east ? p.lng >= west && p.lng <= east : p.lng >= west || p.lng <= east
}
