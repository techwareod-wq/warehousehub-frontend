import type { MapPoint } from "../entities/search.entity"

/** One map dot: a single warehouse or a group close together. */
export interface MapCluster {
  key: string
  lat: number
  lng: number
  points: MapPoint[]
}

/** Zoom at or above which every warehouse is its own pin. */
const PIN_ZOOM = 13

/**
 * The grouping distance for a zoom level: ~50 km at country view (zoom ≤ 5,
 * all of Mumbai is one dot), halving per zoom step (~12 km at state level,
 * ~1.5 km at city level), then single pins from PIN_ZOOM.
 */
export function clusterRadiusKm(zoom: number): number {
  if (zoom >= PIN_ZOOM) return 0
  return 50 / 2 ** Math.max(0, Math.round(zoom) - 5)
}

const EARTH_KM = 6371
const KM_PER_DEG_LAT = 111.32

function distanceKm(a: MapPoint, b: MapPoint): number {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h))
}

/**
 * Groups points within radiusKm of a seed point (greedy, seeds in shortId
 * order so the same data always groups the same way). The dot sits at the
 * group's centre. radiusKm 0 = one dot per point.
 */
export function clusterPoints(points: MapPoint[], radiusKm: number): MapCluster[] {
  const sorted = [...points].sort((a, b) => a.shortId.localeCompare(b.shortId))
  if (radiusKm <= 0) return sorted.map((p) => ({ key: p.shortId, lat: p.lat, lng: p.lng, points: [p] }))

  const taken = new Set<string>()
  const out: MapCluster[] = []
  const maxDLat = radiusKm / KM_PER_DEG_LAT
  for (const seed of sorted) {
    if (taken.has(seed.shortId)) continue
    taken.add(seed.shortId)
    const members = [seed]
    for (const p of sorted) {
      if (taken.has(p.shortId) || Math.abs(p.lat - seed.lat) > maxDLat) continue
      if (distanceKm(seed, p) <= radiusKm) {
        taken.add(p.shortId)
        members.push(p)
      }
    }
    const lat = members.reduce((s, p) => s + p.lat, 0) / members.length
    const lng = members.reduce((s, p) => s + p.lng, 0) / members.length
    out.push({ key: members.length === 1 ? seed.shortId : `c:${seed.shortId}`, lat, lng, points: members })
  }
  return out
}
