"use client"

import { APIProvider } from "@vis.gl/react-google-maps"
import { env } from "@/core/config/env"

/** True when a Google Maps key is configured (maps are optional). */
export const mapsEnabled = env.googleMapsKey !== ""

export function MapsProvider({ children }: { children: React.ReactNode }) {
  if (!mapsEnabled) return <>{children}</>
  return <APIProvider apiKey={env.googleMapsKey}>{children}</APIProvider>
}
