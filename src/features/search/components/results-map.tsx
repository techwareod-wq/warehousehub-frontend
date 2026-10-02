"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Map, Marker, useMap } from "@vis.gl/react-google-maps"
import { MapsProvider, mapsEnabled } from "@/components/maps/maps-provider"
import type { MapData } from "../entities/search.entity"

const BAND_COLORS = ["#64748b", "#16a34a", "#d97706", "#dc2626"]

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

/** Every matching listing as a pin, coloured by price band (D-077). */
export function ResultsMap({ data }: { data: MapData | null }) {
  const router = useRouter()
  if (!mapsEnabled) return null
  return (
    <MapsProvider>
      <div className="h-[420px] overflow-hidden rounded-2xl border border-border">
        <Map defaultCenter={{ lat: 20.5937, lng: 78.9629 }} defaultZoom={4} gestureHandling="greedy" disableDefaultUI zoomControl>
          {data?.points.map((p) => (
            <Marker
              key={p.shortId}
              position={{ lat: p.lat, lng: p.lng }}
              onClick={() => router.push(`/warehouses/${p.shortId}`)}
              icon={{
                path: 0 as google.maps.SymbolPath,
                scale: 7,
                fillColor: BAND_COLORS[p.priceBand] ?? BAND_COLORS[0],
                fillOpacity: 0.9,
                strokeColor: "#fff",
                strokeWeight: 2,
              }}
            />
          ))}
          <FitBounds bbox={data?.bbox ?? null} />
        </Map>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {["No price", "Lower price", "Mid price", "Higher price"].map((label, i) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: BAND_COLORS[i] }} />
            {label}
          </span>
        ))}
      </div>
    </MapsProvider>
  )
}
