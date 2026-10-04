"use client"

import { ColorScheme, Map, Marker } from "@vis.gl/react-google-maps"
import { MapsProvider, mapsEnabled } from "./maps-provider"

/** A read-only map with one pin (listing page, which is always dark). */
export function StaticPin({ point, zoom = 13 }: { point: { lat: number; lng: number }; zoom?: number }) {
  if (!mapsEnabled) return null
  return (
    <MapsProvider>
      <div className="h-72 overflow-hidden rounded-3xl border border-border">
        <Map
          colorScheme={ColorScheme.DARK}
          defaultCenter={point}
          defaultZoom={zoom}
          gestureHandling="cooperative"
          disableDefaultUI
          zoomControl
        >
          <Marker position={point} />
        </Map>
      </div>
    </MapsProvider>
  )
}
