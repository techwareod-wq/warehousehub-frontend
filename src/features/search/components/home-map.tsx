"use client"

import { useEffect, useState } from "react"
import { mapsEnabled } from "@/components/maps/maps-provider"
import { browserApi } from "@/core/api"
import { env } from "@/core/config/env"
import { getSessionId } from "@/core/session/visitor-session"
import { searchApi } from "../api/search.api"
import { EMPTY_QUERY, type FilterCatalog, type MapData } from "../entities/search.entity"
import { ResultsMap } from "./results-map"

const api = searchApi(browserApi)

/** The home page hero map: every live listing as a lit pin on the dark map. */
export function HomeMap({ catalog }: { catalog: FilterCatalog | null }) {
  const [data, setData] = useState<MapData | null>(null)

  useEffect(() => {
    if (!mapsEnabled) return
    let live = true
    const ctx = { country: catalog?.country ?? env.defaultCountry, currency: catalog?.currency ?? "INR", sessionId: getSessionId() }
    api.map(EMPTY_QUERY, ctx).then(
      (d) => live && setData(d),
      () => live && setData(null),
    )
    return () => {
      live = false
    }
  }, [catalog])

  if (!mapsEnabled) return null
  return (
    <div className="relative">
      {/* The blue horizon glow behind the map. */}
      <div aria-hidden className="absolute inset-x-10 -top-10 bottom-10 rounded-full bg-primary/25 blur-3xl" />
      <div className="relative">
        <ResultsMap data={data} legend={false} gestureHandling="cooperative" className="h-[460px] sm:h-[520px]" />
      </div>
      {data && data.total > 0 && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {data.total.toLocaleString()} warehouse{data.total === 1 ? "" : "s"} listed. Click a pin to open it.
        </p>
      )}
    </div>
  )
}
