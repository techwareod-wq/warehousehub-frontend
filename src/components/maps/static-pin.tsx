"use client"

import { Map, Marker } from "@vis.gl/react-google-maps"
import { MapsProvider, mapsEnabled } from "./maps-provider"

/** A read-only map with one pin (listing page). */
export function StaticPin({ point, zoom = 13 }: { point: { lat: number; lng: number }; zoom?: number }) {
  if (!mapsEnabled) return null
  return (
    <MapsProvider>
      <div className="h-64 overflow-hidden rounded-2xl border border-border">
        <Map defaultCenter={point} defaultZoom={zoom} gestureHandling="cooperative" disableDefaultUI zoomControl>
          <Marker position={point} />
        </Map>
      </div>
    </MapsProvider>
  )
}
