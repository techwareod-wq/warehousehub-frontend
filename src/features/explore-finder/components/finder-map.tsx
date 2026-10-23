"use client"

import "maplibre-gl/dist/maplibre-gl.css"
import { useEffect, useEffectEvent, useRef, useState } from "react"
import type { ExpressionSpecification, GeoJSONSource, Map as MapLibreMap } from "maplibre-gl"
import { cn } from "@/lib/utils"
import { addClusterRingImages, CLUSTER_RING_IMAGE, clusterRingSize } from "@/lib/cluster-donut"
import { TYPE_CLUSTER_PROPERTIES, typeColorExpression, UNKNOWN_TYPE_FILL } from "@/lib/warehouse-type"
import type { FinderWarehouse, LatLng } from "../entities/finder.entity"
import { INDIA, INK, STYLE_URL } from "../lib/map"

const SOURCE = "finder"
const HIGHLIGHT = "finder-highlight"
const IS_CLUSTER: ExpressionSpecification = ["has", "point_count"]
const UNCLUSTERED: ExpressionSpecification = ["!", ["has", "point_count"]]
const CLUSTER_RADIUS: ExpressionSpecification = ["interpolate", ["linear"], ["get", "point_count"], 2, 14, 10, 18, 40, 24]
/** Pins in their warehouse type's colour. */
const TYPE_COLOR = typeColorExpression()

type Collection = Parameters<GeoJSONSource["setData"]>[0]

function toGeoJSON(list: FinderWarehouse[]): Collection {
  return {
    type: "FeatureCollection",
    features: list.flatMap((w) =>
      w.loc ? [{ type: "Feature" as const, geometry: { type: "Point" as const, coordinates: [w.loc.lng, w.loc.lat] }, properties: { id: w.shortId, type: w.type } }] : [],
    ),
  }
}

/** Type-coloured markers and type-split cluster rings, plus an always-on-top highlight. */
function addLayers(map: MapLibreMap) {
  map.addSource(SOURCE, {
    type: "geojson",
    data: toGeoJSON([]),
    cluster: true,
    clusterRadius: 50,
    clusterMaxZoom: 14,
    clusterProperties: TYPE_CLUSTER_PROPERTIES,
  })
  map.addSource(HIGHLIGHT, { type: "geojson", data: toGeoJSON([]) })
  // A ring split equally between the types inside (cluster-donut.ts), with the count in the middle.
  addClusterRingImages(map, UNKNOWN_TYPE_FILL)
  map.addLayer({
    id: "clusters",
    type: "symbol",
    source: SOURCE,
    filter: IS_CLUSTER,
    layout: {
      "icon-image": CLUSTER_RING_IMAGE,
      "icon-size": clusterRingSize(CLUSTER_RADIUS),
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": ["Noto Sans Regular"],
      "text-size": 13,
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: { "text-color": "#fff" },
  })
  map.addLayer({
    id: "point-glow",
    type: "circle",
    source: SOURCE,
    filter: UNCLUSTERED,
    paint: { "circle-color": TYPE_COLOR, "circle-radius": 13, "circle-blur": 1, "circle-opacity": 0.4 },
  })
  map.addLayer({
    id: "points",
    type: "circle",
    source: SOURCE,
    filter: UNCLUSTERED,
    paint: { "circle-color": TYPE_COLOR, "circle-radius": 6.5, "circle-stroke-width": 1.5, "circle-stroke-color": "#fff" },
  })
  map.addLayer({
    id: "highlight",
    type: "circle",
    source: HIGHLIGHT,
    paint: { "circle-color": TYPE_COLOR, "circle-radius": 9, "circle-stroke-width": 3, "circle-stroke-color": "#fff" },
  })
}

/**
 * The results map (MapLibre, OpenFreeMap dark). Fits to the results, highlights
 * `highlightId`, and reports marker clicks through `onSelect`.
 */
export function FinderMap({
  results,
  centroid,
  highlightId,
  onSelect,
  className,
  children,
}: {
  results: FinderWarehouse[]
  centroid: LatLng | null
  highlightId: string | null
  onSelect: (shortId: string) => void
  className?: string
  /** Overlays (the stat box). */
  children?: React.ReactNode
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [ready, setReady] = useState(false)
  const select = useEffectEvent((id: string) => onSelect(id))

  /** Frames the results (or the searched place when there are none). */
  const fit = useEffectEvent(() => {
    const m = mapRef.current
    if (!m) return
    const pts = results.flatMap((w) => (w.loc ? [w.loc] : []))
    if (pts.length === 0) {
      if (centroid) m.easeTo({ center: [centroid.lng, centroid.lat], zoom: 9 })
      return
    }
    const lngs = pts.map((p) => p.lng)
    const lats = pts.map((p) => p.lat)
    if (pts.length === 1) {
      m.easeTo({ center: [lngs[0], lats[0]], zoom: 12 })
      return
    }
    m.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: { top: 80, right: 50, bottom: 50, left: 50 }, maxZoom: 13 },
    )
  })

  useEffect(() => {
    let cancelled = false
    let map: MapLibreMap | null = null
    let observer: ResizeObserver | null = null
    void import("maplibre-gl").then(({ default: lib }) => {
      const container = containerRef.current
      if (cancelled || !container) return
      const m = new lib.Map({
        container,
        style: STYLE_URL,
        center: [INDIA.lng, INDIA.lat],
        zoom: 4,
        attributionControl: { compact: true },
      })
      map = m
      mapRef.current = m
      m.addControl(new lib.NavigationControl({ showCompass: false }), "top-right")
      m.on("error", (e) => console.error("[finder map]", e))
      m.on("load", () => {
        addLayers(m)
        setReady(true)
      })
      m.on("click", "clusters", async (e) => {
        const f = e.features?.[0]
        const source = m.getSource<GeoJSONSource>(SOURCE)
        if (!f || !source || f.geometry.type !== "Point") return
        const zoom = await source.getClusterExpansionZoom(f.properties.cluster_id)
        m.easeTo({ center: f.geometry.coordinates as [number, number], zoom })
      })
      for (const layer of ["points", "highlight"]) {
        m.on("click", layer, (e) => {
          const id = e.features?.[0]?.properties.id
          if (typeof id === "string") select(id)
        })
      }
      for (const layer of ["clusters", "points", "highlight"]) {
        m.on("mouseenter", layer, () => (m.getCanvas().style.cursor = "pointer"))
        m.on("mouseleave", layer, () => (m.getCanvas().style.cursor = ""))
      }
      // The map column can be hidden (mobile list view) and shown again: refit
      // when it comes back, since a fit while hidden had no size to work with.
      let wasHidden = container.clientWidth === 0
      observer = new ResizeObserver(() => {
        m.resize()
        const hidden = container.clientWidth === 0
        if (wasHidden && !hidden && m.loaded()) fit()
        wasHidden = hidden
      })
      observer.observe(container)
    })
    return () => {
      cancelled = true
      observer?.disconnect()
      map?.remove()
      mapRef.current = null
      setReady(false)
    }
  }, [])

  // New results: redraw and fit.
  useEffect(() => {
    if (!ready) return
    mapRef.current?.getSource<GeoJSONSource>(SOURCE)?.setData(toGeoJSON(results))
    fit()
  }, [ready, results, centroid])

  useEffect(() => {
    if (!ready) return
    const w = results.find((r) => r.shortId === highlightId)
    mapRef.current?.getSource<GeoJSONSource>(HIGHLIGHT)?.setData(toGeoJSON(w ? [w] : []))
  }, [ready, results, highlightId])

  return (
    <div className={cn("relative overflow-hidden", className)} style={{ background: INK }}>
      <div ref={containerRef} className="absolute inset-0" />
      {children}
    </div>
  )
}
