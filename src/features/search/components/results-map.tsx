"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ColorScheme, Map, Marker, useMap } from "@vis.gl/react-google-maps"
import { useTheme } from "next-themes"
import { MapsProvider, mapsEnabled } from "@/components/maps/maps-provider"
import { cn } from "@/lib/utils"
import type { MapData, MapPoint } from "../entities/search.entity"
import { clusterPoints, clusterRadiusKm, type MapCluster } from "../lib/cluster"

const BAND_COLORS = ["#94a3b8", "#22c55e", "#f59e0b", "#ef4444"]
const CLUSTER_COLOR = "#2f6fde"
const ARCHIVED_STROKE = "#f59e0b"
const DEFAULT_ZOOM = 4

function FitBounds({ bbox }: { bbox: MapData["bbox"] }) {
  const map = useMap()
  useEffect(() => {
    if (!map || !bbox) return
    const [minLng, minLat, maxLng, maxLat] = bbox
    if (minLng === maxLng && minLat === maxLat) {
      map.setCenter({ lat: minLat, lng: minLng })
      map.setZoom(12)
      return
    }
    map.fitBounds({ west: minLng, south: minLat, east: maxLng, north: maxLat }, 40)
  }, [map, bbox])
  return null
}

/** Clustered dots for the current zoom; a cluster click zooms into its warehouses. */
function ClusterLayer({ points, zoom, hrefFor }: { points: MapPoint[]; zoom: number; hrefFor: (p: MapPoint) => string }) {
  const map = useMap()
  const router = useRouter()
  const radius = clusterRadiusKm(zoom)
  const clusters = useMemo(() => clusterPoints(points, radius), [points, radius])

  const open = (c: MapCluster) => {
    if (c.points.length === 1) {
      router.push(hrefFor(c.points[0]))
      return
    }
    if (!map) return
    const lats = c.points.map((p) => p.lat)
    const lngs = c.points.map((p) => p.lng)
    const [south, north, west, east] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)]
    if (south === north && west === east) {
      map.setCenter({ lat: south, lng: west })
      map.setZoom(15)
      return
    }
    map.fitBounds({ south, north, west, east }, 60)
  }

  return clusters.map((c) => {
    const n = c.points.length
    const single = c.points[0]
    const color = n > 1 ? CLUSTER_COLOR : (BAND_COLORS[single.priceBand] ?? BAND_COLORS[0])
    const scale = n > 1 ? Math.min(10 + Math.log2(n) * 3, 24) : 7
    return [
      // A soft halo under every pin: the "lit hub" look on the dark map.
      <Marker
        key={`${c.key}-halo`}
        position={{ lat: c.lat, lng: c.lng }}
        clickable={false}
        icon={{ path: 0 as google.maps.SymbolPath, scale: scale * 2.2, fillColor: color, fillOpacity: 0.18, strokeWeight: 0 }}
      />,
      <Marker
        key={c.key}
        position={{ lat: c.lat, lng: c.lng }}
        onClick={() => open(c)}
        title={n === 1 ? single.shortId : `${n} warehouses`}
        label={n > 1 ? { text: String(n), color: "#fff", fontSize: "11px", fontWeight: "600" } : undefined}
        icon={{
          path: 0 as google.maps.SymbolPath,
          scale,
          fillColor: color,
          fillOpacity: 0.9,
          strokeColor: n === 1 && single.status === "archived" ? ARCHIVED_STROKE : "#fff",
          strokeWeight: n > 1 ? 2 : 1.5,
        }}
      />,
    ]
  })
}

/**
 * Every matching listing, grouped by distance for the zoom level (~50 km at
 * country view, shrinking as you zoom in, single pins at street level).
 * Single pins are coloured by price band (D-077); archived ones (admin) get
 * an amber ring. Dark map unless the admin panel's theme is light.
 */
export function ResultsMap({
  data,
  hrefFor = (p) => `/warehouses/${p.shortId}`,
  showArchived = false,
  legend = true,
  gestureHandling = "greedy",
  className,
}: {
  data: MapData | null
  hrefFor?: (p: MapPoint) => string
  showArchived?: boolean
  legend?: boolean
  gestureHandling?: "greedy" | "cooperative"
  className?: string
}) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const { resolvedTheme } = useTheme()
  const scheme = resolvedTheme === "light" ? ColorScheme.LIGHT : ColorScheme.DARK
  if (!mapsEnabled) return null
  return (
    <MapsProvider>
      <div className={cn("h-[420px] overflow-hidden rounded-3xl border border-border", className)}>
        <Map
          // The colour scheme is fixed at creation, so a theme flip remounts the map.
          key={scheme}
          colorScheme={scheme}
          defaultCenter={{ lat: 20.5937, lng: 78.9629 }}
          defaultZoom={DEFAULT_ZOOM}
          gestureHandling={gestureHandling}
          disableDefaultUI
          zoomControl
          onZoomChanged={(e) => setZoom(e.detail.zoom)}
        >
          <ClusterLayer points={data?.points ?? []} zoom={zoom} hrefFor={hrefFor} />
          <FitBounds bbox={data?.bbox ?? null} />
        </Map>
      </div>
      {legend && (
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: CLUSTER_COLOR }} />
            Group (click to zoom in)
          </span>
          {["No price", "Lower price", "Mid price", "Higher price"].map((label, i) => (
            <span key={label} className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full" style={{ background: BAND_COLORS[i] }} />
              {label}
            </span>
          ))}
          {showArchived && (
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full border-2" style={{ borderColor: ARCHIVED_STROKE }} />
              Archived
            </span>
          )}
        </div>
      )}
    </MapsProvider>
  )
}
