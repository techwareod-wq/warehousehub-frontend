"use client"

import { Map, Marker, type MapMouseEvent } from "@vis.gl/react-google-maps"
import { MapsProvider, mapsEnabled } from "./maps-provider"

const INDIA = { lat: 20.5937, lng: 78.9629 }

/** Click or drag to place a pin. Renders nothing without a Maps key. */
export function PinPicker({
  value,
  onChange,
  disabled,
}: {
  value: { lat: number; lng: number } | null
  onChange: (p: { lat: number; lng: number }) => void
  disabled?: boolean
}) {
  if (!mapsEnabled) return null
  const set = (e: { latLng: google.maps.LatLng | null }) => {
    if (!disabled && e.latLng) onChange({ lat: round(e.latLng.lat()), lng: round(e.latLng.lng()) })
  }
  return (
    <MapsProvider>
      <div className="h-64 overflow-hidden rounded-2xl border border-border">
        <Map
          key={value ? "pinned" : "unpinned"}
          defaultCenter={value ?? INDIA}
          defaultZoom={value ? 15 : 4}
          gestureHandling="cooperative"
          disableDefaultUI
          zoomControl
          onClick={(e: MapMouseEvent) => {
            const ll = e.detail.latLng
            if (!disabled && ll) onChange({ lat: round(ll.lat), lng: round(ll.lng) })
          }}
        >
          {value && <Marker position={value} draggable={!disabled} onDragEnd={set} />}
        </Map>
      </div>
    </MapsProvider>
  )
}

function round(v: number): number {
  return Math.round(v * 1e6) / 1e6
}
