"use client"

import "maplibre-gl/dist/maplibre-gl.css"
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import type {
  ExpressionSpecification,
  GeoJSONSource,
  LngLatBoundsLike,
  LngLatLike,
  Map as MapLibreMap,
  PaddingOptions,
} from "maplibre-gl"
import { ArrowRight, ChevronDown, Globe, MapPin, Ruler, Warehouse } from "lucide-react"
import { Button, Input } from "@/components/ui"
import { NativeSelect } from "@/components/common"
import { browserApi, errorMessage } from "@/core/api"
import { env } from "@/core/config/env"
import { formatRate, type FilterCatalog } from "@/features/search"
import { formatAreaSqft } from "@/lib/format"
import { cn } from "@/lib/utils"
import { exploreApi } from "../api/explore.api"
import type { ExploreFilters, ExploreWarehouse } from "../entities/explore.entity"

type MapLibre = typeof import("maplibre-gl")
type Mode = "globe" | "map"
type Padding = PaddingOptions

const api = exploreApi(browserApi)

const STYLE_URL = "https://tiles.openfreemap.org/styles/bright"
const INDIA: [number, number] = [78.96, 20.59]
const MAP_VIEW = { center: [78.96, 22] as [number, number], zoom: 4.8 }
const FLY = { speed: 0.8, curve: 1.6 }
/** A user zoom past this on the globe switches to the flat map. */
const ENTER_MAP_ZOOM = 4
/** The globe flattens into Mercator between these zooms; basemap labels show from FLAT_FROM. */
const FLAT_FROM = 3.5
const FLAT_TO = 5.2
const ROTATE_DEG_PER_SEC = 3
const GOLD = "#f5b301"
const SPACE = "#05080f"
const SOURCE = "warehouses"
const MOBILE = "(max-width: 767px)"
/** Marks our own camera moves so the zoom listener can tell them from gestures. */
const PROGRAMMATIC = { programmatic: true }
// Cluster bubble radius grows with its count.
const CLUSTER_RADIUS: ExpressionSpecification = ["interpolate", ["linear"], ["get", "point_count"], 2, 14, 10, 18, 40, 24, 150, 32]
const UNCLUSTERED: ExpressionSpecification = ["!", ["has", "point_count"]]

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
const isMobile = () => window.matchMedia(MOBILE).matches

/** A large globe beside the hero (below it on mobile), sized to the container. */
function globeView(el: HTMLElement) {
  const w = el.clientWidth
  const h = el.clientHeight
  const mobile = isMobile()
  const diameter = mobile ? Math.min(w * 2.6, h * 1.3) : Math.min(h * 2, w * 1.3)
  // At zoom 1.6 the globe is ~410 css px wide; each zoom level doubles it.
  const zoom = Math.min(FLAT_FROM - 0.05, Math.max(1, 1.6 + Math.log2(diameter / 410)))
  const padding: Padding = mobile
    ? { top: 0, right: 0, left: 0, bottom: Math.round(h * 0.42) }
    : { top: 0, bottom: 0, right: 0, left: Math.round(Math.min(w * 0.45, 680)) }
  return { center: INDIA, zoom, padding }
}

/** Keeps markers clear of the listing panel (side panel on desktop, bottom sheet on mobile). */
function panelPadding(container: HTMLElement | null, panel: HTMLElement | null): Padding {
  if (isMobile()) return { top: 40, right: 20, left: 20, bottom: Math.round((container?.clientHeight ?? 600) * 0.52) + 20 }
  return { top: 40, right: 40, bottom: 40, left: (panel?.offsetWidth ?? 0) + 48 }
}

function toGeoJSON(list: ExploreWarehouse[]): Parameters<GeoJSONSource["setData"]>[0] {
  return {
    type: "FeatureCollection",
    features: list.map((w) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [w.lng, w.lat] },
      properties: { id: w.shortId },
    })),
  }
}

function boundsOf(list: ExploreWarehouse[]): LngLatBoundsLike {
  const lngs = list.map((w) => w.lng)
  const lats = list.map((w) => w.lat)
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ]
}

function inBounds(w: ExploreWarehouse, [west, south, east, north]: [number, number, number, number]): boolean {
  if (w.lat < south || w.lat > north) return false
  return west <= east ? w.lng >= west && w.lng <= east : w.lng >= west || w.lng <= east
}

/** Globe look (atmosphere, globe → Mercator morph) and a clean globe without basemap labels. */
function styleGlobe(map: MapLibreMap) {
  map.setProjection({ type: ["interpolate", ["linear"], ["zoom"], FLAT_FROM, "vertical-perspective", FLAT_TO, "mercator"] })
  map.setSky({
    "sky-color": SPACE,
    "horizon-color": "#2f5fb8",
    "fog-color": "#0c1830",
    "sky-horizon-blend": 0.5,
    "horizon-fog-blend": 0.6,
    "fog-ground-blend": 0.8,
    "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 1, 3, 0.9, 5, 0],
  })
  for (const layer of map.getStyle().layers) {
    if (layer.type === "symbol") map.setLayerZoomRange(layer.id, Math.max(layer.minzoom ?? 0, FLAT_FROM), layer.maxzoom ?? 24)
  }
}

function addWarehouseLayers(map: MapLibreMap) {
  map.addSource(SOURCE, { type: "geojson", data: toGeoJSON([]), cluster: true, clusterRadius: 55, clusterMaxZoom: 14 })
  const isCluster: ExpressionSpecification = ["has", "point_count"]
  map.addLayer({
    id: "cluster-glow",
    type: "circle",
    source: SOURCE,
    filter: isCluster,
    paint: { "circle-color": GOLD, "circle-radius": ["+", CLUSTER_RADIUS, 10], "circle-blur": 0.9, "circle-opacity": 0.2 },
  })
  map.addLayer({
    id: "clusters",
    type: "circle",
    source: SOURCE,
    filter: isCluster,
    paint: {
      "circle-color": GOLD,
      "circle-opacity": 0.45,
      "circle-radius": CLUSTER_RADIUS,
      "circle-stroke-width": 1.5,
      "circle-stroke-color": GOLD,
    },
  })
  map.addLayer({
    id: "cluster-count",
    type: "symbol",
    source: SOURCE,
    filter: isCluster,
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": ["Noto Sans Regular"],
      "text-size": 13,
      "text-allow-overlap": true,
    },
    paint: { "text-color": "#fff", "text-halo-color": "rgba(0,0,0,0.45)", "text-halo-width": 1 },
  })
  map.addLayer({
    id: "point-glow",
    type: "circle",
    source: SOURCE,
    filter: UNCLUSTERED,
    paint: { "circle-color": GOLD, "circle-radius": 16, "circle-blur": 1, "circle-opacity": 0.2 },
  })
  map.addLayer({
    id: "point-highlight",
    type: "circle",
    source: SOURCE,
    filter: ["all", UNCLUSTERED, ["==", ["get", "id"], ""]],
    paint: { "circle-color": "rgba(255,255,255,0.9)", "circle-radius": 14, "circle-stroke-width": 3, "circle-stroke-color": GOLD },
  })
  map.addLayer({
    id: "points",
    type: "circle",
    source: SOURCE,
    filter: UNCLUSTERED,
    paint: {
      "circle-color": GOLD,
      "circle-opacity": 0.85,
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 5, 10, 8],
      "circle-stroke-width": 1.5,
      "circle-stroke-color": "#fff",
    },
  })
}

function placeOf(w: ExploreWarehouse): string {
  return [w.locality, w.city].filter(Boolean).join(", ")
}

function Cover({ w, className }: { w: ExploreWarehouse; className?: string }) {
  return (
    <div className={cn("relative shrink-0 overflow-hidden bg-muted", className)}>
      {w.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={w.coverUrl} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <Warehouse className="size-6" />
        </div>
      )}
    </div>
  )
}

function PopupCard({ w }: { w: ExploreWarehouse }) {
  return (
    <div className="flex w-[260px] flex-col">
      <Cover w={w} className="h-32 w-full" />
      <div className="flex flex-col gap-1.5 p-4">
        <h4 className="font-heading text-lg leading-tight tracking-tight">{w.name}</h4>
        {placeOf(w) && <p className="text-xs text-muted-foreground">{placeOf(w)}</p>}
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <strong className="font-medium">{formatRate(w.rate)}</strong>
          {w.totalSqm > 0 && <span className="text-xs text-muted-foreground">{formatAreaSqft(w.totalSqm)}</span>}
        </div>
        <Link
          href={`/warehouses/${w.slug}`}
          className="mt-2 inline-flex h-8 items-center justify-center rounded-4xl bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          View details
        </Link>
      </div>
    </div>
  )
}

/**
 * Globe → flat map warehouse explorer (MapLibre + OpenFreeMap). Opens on a
 * slowly rotating globe with a hero; "Explore", a city search or zooming in
 * flies to the flat map with clustered markers and a listing panel synced to
 * the visible area. City filters in the browser; max rate and industry are
 * server filters that refetch both markers and cards.
 */
export function GlobeExplorer({ catalog }: { catalog: FilterCatalog | null }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const libRef = useRef<MapLibre | null>(null)
  const modeRef = useRef<Mode>("globe")
  /** Mirrors `rotating` synchronously, so a frame queued before the re-render can't fight a gesture or flight. */
  const spinRef = useRef(true)

  const [mapReady, setMapReady] = useState(false)
  const [popupEl, setPopupEl] = useState<HTMLDivElement | null>(null)
  const [mode, setMode] = useState<Mode>("globe")
  const [rotating, setRotating] = useState(true)
  const [panelOpen, setPanelOpen] = useState(true)

  const [filters, setFilters] = useState<ExploreFilters>({ maxRate: null, industry: "" })
  const [rateDraft, setRateDraft] = useState<number | null>(null)
  const [city, setCity] = useState("")
  const [heroCity, setHeroCity] = useState("")
  const [heroMiss, setHeroMiss] = useState("")

  /** The last load and the filters it was for; a mismatch means a load is in flight. */
  const [load, setLoad] = useState<{ for: ExploreFilters | null; data: ExploreWarehouse[]; error: unknown }>({
    for: null,
    data: [],
    error: null,
  })
  /** City list and rate range from the unfiltered set, so they don't shrink as filters narrow it. */
  const [baseline, setBaseline] = useState<{ cities: string[]; rateMin: number; rateMax: number } | null>(null)

  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [popupId, setPopupId] = useState<string | null>(null)

  const ctx = useMemo(() => ({ country: catalog?.country ?? env.defaultCountry, currency: catalog?.currency ?? "INR" }), [catalog])

  useEffect(() => {
    const ctl = new AbortController()
    api.warehouses(filters, ctx, ctl.signal).then(
      (list) => {
        if (ctl.signal.aborted) return
        setLoad({ for: filters, data: list, error: null })
        if (filters.maxRate === null && !filters.industry) {
          const rates = list.map((w) => w.ratePerSqft).filter((r): r is number => r !== null)
          setBaseline({
            cities: [...new Set(list.map((w) => w.city).filter(Boolean))].sort(),
            rateMin: rates.length ? Math.floor(Math.min(...rates)) : 0,
            rateMax: rates.length ? Math.ceil(Math.max(...rates)) : 0,
          })
        }
      },
      (err: unknown) => {
        if (ctl.signal.aborted) return
        setLoad((l) => ({ for: filters, data: l.data, error: err }))
      },
    )
    return () => ctl.abort()
  }, [filters, ctx])

  // Debounce the rate slider into the server filters.
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.maxRate === rateDraft ? f : { ...f, maxRate: rateDraft })), 200)
    return () => clearTimeout(t)
  }, [rateDraft])

  const data = load.data
  const loading = load.for !== filters
  const error = loading ? null : load.error
  const filtered = useMemo(() => (city ? data.filter((w) => w.city === city) : data), [data, city])
  const visible = useMemo(() => {
    if (mode !== "map" || !bounds) return []
    return filtered
      .filter((w) => inBounds(w, bounds))
      .sort((a, b) => (a.ratePerSqft ?? Infinity) - (b.ratePerSqft ?? Infinity) || a.name.localeCompare(b.name))
  }, [filtered, bounds, mode])
  const popupWarehouse = useMemo(() => filtered.find((w) => w.shortId === popupId) ?? null, [filtered, popupId])
  const cities = baseline?.cities ?? []

  // ---------- Camera ----------
  function moveTo(opts: { center: LngLatLike; zoom: number; padding?: Padding; bearing?: number; pitch?: number }) {
    const map = mapRef.current
    if (!map) return
    if (reducedMotion()) map.jumpTo(opts, PROGRAMMATIC)
    else map.flyTo({ ...FLY, ...opts, essential: true }, PROGRAMMATIC)
  }

  function fitTo(list: ExploreWarehouse[]) {
    const map = mapRef.current
    if (!map || !list.length) return
    map.fitBounds(
      boundsOf(list),
      { padding: panelPadding(containerRef.current, panelRef.current), maxZoom: 10, duration: reducedMotion() ? 0 : 1600, essential: true },
      PROGRAMMATIC,
    )
  }

  function stopRotating() {
    spinRef.current = false
    setRotating(false)
  }

  function enterMap(fly = true) {
    stopRotating()
    if (modeRef.current === "map") return
    modeRef.current = "map"
    setMode("map")
    setPanelOpen(true)
    if (fly) moveTo({ ...MAP_VIEW, padding: panelPadding(containerRef.current, panelRef.current) })
  }

  function enterGlobe() {
    const map = mapRef.current
    if (modeRef.current === "globe" || !map || !containerRef.current) return
    modeRef.current = "globe"
    setMode("globe")
    setPopupId(null)
    setHoverId(null)
    // Resume rotating once the flight back has landed (a rotation frame would cancel it).
    map.once("moveend", () => {
      if (modeRef.current !== "globe") return
      spinRef.current = true
      setRotating(true)
    })
    moveTo({ ...globeView(containerRef.current), bearing: 0, pitch: 0 })
  }

  function openWarehouse(w: ExploreWarehouse) {
    const map = mapRef.current
    if (!map) return
    enterMap(false)
    setPopupId(null)
    map.once("moveend", () => setPopupId(w.shortId))
    moveTo({ center: [w.lng, w.lat], zoom: 12, padding: panelPadding(containerRef.current, panelRef.current) })
    if (isMobile()) setPanelOpen(false)
  }

  function chooseCity(c: string) {
    setCity(c)
    enterMap(false)
    if (c) fitTo(data.filter((w) => w.city === c))
    else moveTo({ ...MAP_VIEW, padding: panelPadding(containerRef.current, panelRef.current) })
  }

  function searchCity(e: React.FormEvent) {
    e.preventDefault()
    const q = heroCity.trim().toLowerCase()
    if (!q) return enterMap()
    const match = cities.find((c) => c.toLowerCase() === q) ?? cities.find((c) => c.toLowerCase().includes(q))
    if (!match) {
      setHeroMiss(`No warehouses in “${heroCity.trim()}” yet.`)
      return
    }
    setHeroMiss("")
    chooseCity(match)
  }

  // ---------- Map listeners (always see the latest state) ----------
  const onUserInteract = useEffectEvent(() => stopRotating())
  const onZoom = useEffectEvent((programmatic: boolean, zoom: number) => {
    if (modeRef.current === "globe" && !programmatic && zoom > ENTER_MAP_ZOOM) enterMap(false)
  })
  const onMoveEnd = useEffectEvent(() => {
    const map = mapRef.current
    if (!map || modeRef.current !== "map") return
    const b = map.getBounds()
    setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()])
  })
  const onClusterClick = useEffectEvent((center: [number, number], zoom: number) => {
    const map = mapRef.current
    if (!map) return
    enterMap(false)
    moveTo({ center, zoom: Math.max(zoom, map.getZoom() + 1), padding: panelPadding(containerRef.current, panelRef.current) })
  })
  const onPointClick = useEffectEvent((id: string) => {
    const w = filtered.find((x) => x.shortId === id)
    if (!w) return
    if (modeRef.current === "globe") openWarehouse(w)
    else setPopupId(id)
  })
  const onResize = useEffectEvent(() => {
    const map = mapRef.current
    if (!map || !containerRef.current || modeRef.current !== "globe") return
    const { zoom, padding } = globeView(containerRef.current)
    map.jumpTo({ zoom, padding }, PROGRAMMATIC)
  })

  // ---------- Map lifecycle: one map per mount, fully torn down (safe under StrictMode) ----------
  useEffect(() => {
    let cancelled = false
    let map: MapLibreMap | null = null
    const handleResize = () => onResize()
    window.addEventListener("resize", handleResize)

    void import("maplibre-gl").then(({ default: lib }) => {
      const container = containerRef.current
      if (cancelled || !container) return
      libRef.current = lib
      const view = globeView(container)
      const m = new lib.Map({
        container,
        style: STYLE_URL,
        center: view.center,
        zoom: view.zoom,
        attributionControl: { compact: true },
        renderWorldCopies: false,
      })
      map = m
      mapRef.current = m
      m.jumpTo({ padding: view.padding }, PROGRAMMATIC)
      m.addControl(new lib.NavigationControl({ showCompass: false }), "top-right")
      m.on("error", (e) => console.error("[explore map]", e))
      m.on("style.load", () => styleGlobe(m))
      m.on("load", () => {
        addWarehouseLayers(m)
        setPopupEl(document.createElement("div"))
        setMapReady(true)
      })
      m.on("mousedown", () => onUserInteract())
      m.on("touchstart", () => onUserInteract())
      m.on("wheel", () => onUserInteract())
      m.on("zoom", (e) => onZoom(!!(e as unknown as { programmatic?: boolean }).programmatic, m.getZoom()))
      m.on("moveend", () => onMoveEnd())
      m.on("click", "clusters", async (e) => {
        const f = e.features?.[0]
        const source = m.getSource<GeoJSONSource>(SOURCE)
        if (!f || !source || f.geometry.type !== "Point") return
        const zoom = await source.getClusterExpansionZoom(f.properties.cluster_id)
        onClusterClick(f.geometry.coordinates as [number, number], zoom)
      })
      m.on("click", "points", (e) => {
        const id = e.features?.[0]?.properties.id
        if (typeof id === "string") onPointClick(id)
      })
      for (const layer of ["clusters", "points"]) {
        m.on("mouseenter", layer, () => (m.getCanvas().style.cursor = "pointer"))
        m.on("mouseleave", layer, () => (m.getCanvas().style.cursor = ""))
      }
    })

    return () => {
      cancelled = true
      window.removeEventListener("resize", handleResize)
      map?.remove()
      mapRef.current = null
      libRef.current = null
      setMapReady(false)
    }
  }, [])

  // The single rotation loop: only on the globe, until the user interacts.
  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map || mode !== "globe" || !rotating || reducedMotion()) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      if (!spinRef.current || modeRef.current !== "globe") return
      const dt = Math.min(now - last, 100) / 1000
      last = now
      const c = map.getCenter()
      const lng = ((c.lng + ROTATE_DEG_PER_SEC * dt + 540) % 360) - 180
      map.setCenter([lng, c.lat], PROGRAMMATIC)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [mapReady, mode, rotating])

  useEffect(() => {
    if (!mapReady) return
    mapRef.current?.getSource<GeoJSONSource>(SOURCE)?.setData(toGeoJSON(filtered))
  }, [mapReady, filtered])

  useEffect(() => {
    if (!mapReady) return
    mapRef.current?.setFilter("point-highlight", ["all", UNCLUSTERED, ["==", ["get", "id"], hoverId ?? ""]])
  }, [mapReady, hoverId])

  useEffect(() => {
    const map = mapRef.current
    const lib = libRef.current
    if (!mapReady || !map || !lib || !popupEl || !popupWarehouse) return
    const popup = new lib.Popup({
      offset: 14,
      maxWidth: "300px",
      focusAfterOpen: false,
      className:
        "[&_.maplibregl-popup-content]:overflow-hidden [&_.maplibregl-popup-content]:rounded-2xl [&_.maplibregl-popup-content]:bg-popover [&_.maplibregl-popup-content]:p-0 [&_.maplibregl-popup-content]:text-popover-foreground [&_.maplibregl-popup-content]:shadow-xl [&_.maplibregl-popup-tip]:hidden [&_.maplibregl-popup-close-button]:z-10 [&_.maplibregl-popup-close-button]:m-1.5 [&_.maplibregl-popup-close-button]:size-7 [&_.maplibregl-popup-close-button]:rounded-full [&_.maplibregl-popup-close-button]:bg-black/50 [&_.maplibregl-popup-close-button]:text-lg [&_.maplibregl-popup-close-button]:text-white",
    })
      .setLngLat([popupWarehouse.lng, popupWarehouse.lat])
      .setDOMContent(popupEl)
      .addTo(map)
    // A click on another marker closes this popup after selecting the new one: only clear our own id.
    const id = popupWarehouse.shortId
    const onClose = () => setPopupId((cur) => (cur === id ? null : cur))
    popup.on("close", onClose)
    return () => {
      popup.off("close", onClose)
      popup.remove()
    }
  }, [mapReady, popupEl, popupWarehouse])

  // ---------- Render ----------
  const industries = catalog?.industries ?? []
  const rateMax = baseline?.rateMax ?? 0
  const rateMin = baseline?.rateMin ?? 0
  const hasRates = rateMax > rateMin
  const count = `${visible.length} warehouse${visible.length === 1 ? "" : "s"} in view`
  let status = ""
  if (error) status = `Couldn't load warehouses. ${errorMessage(error)}`
  else if (loading && !data.length) status = "Loading warehouses…"
  else if (!filtered.length) status = "No warehouses match these filters. Try a higher rate or another industry."
  else if (bounds && !visible.length) status = "No warehouses in this area. Zoom out or pan the map."

  return (
    <div className="relative h-[calc(100dvh-4rem)] min-h-[560px] w-full overflow-hidden" style={{ background: SPACE }}>
      {/* MapLibre's unlayered .maplibregl-map { position: relative } beats Tailwind's layered utilities, so position on a wrapper. */}
      <div className="absolute inset-0">
        <div ref={containerRef} className="size-full" aria-label="Warehouse map" />
      </div>

      {/* Hero (globe mode) */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none",
          "bg-gradient-to-t from-[#05080f] via-[#05080f]/60 to-transparent md:bg-gradient-to-r md:via-[#05080f]/50",
          mode === "globe" ? "opacity-100" : "opacity-0",
        )}
      />
      <section
        inert={mode !== "globe"}
        className={cn(
          "pointer-events-none absolute inset-0 flex items-end px-4 pb-10 transition-opacity duration-500 motion-reduce:transition-none md:items-center md:px-12 md:pb-0",
          mode === "globe" ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="pointer-events-auto flex w-full max-w-md flex-col gap-5 text-white">
          <h1 className="font-heading text-4xl leading-[1.05] tracking-tight text-balance sm:text-6xl">Find warehouses across India</h1>
          <p className="text-sm text-white/70 sm:text-base">
            Verified, flexible warehouse space across India&apos;s logistics corridors. Spin the globe, search a city, or dive in.
          </p>
          <form onSubmit={searchCity} className="flex gap-2" autoComplete="off">
            <div className="relative flex-1">
              <MapPin className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={heroCity}
                onChange={(e) => {
                  setHeroCity(e.target.value)
                  setHeroMiss("")
                }}
                list="explore-cities"
                aria-label="Search a city"
                placeholder={cities.length ? `Search by city, e.g. ${cities[0]}` : "Search by city"}
                className="h-10 rounded-full pl-10"
              />
              <datalist id="explore-cities">
                {cities.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <Button type="submit" size="icon-lg" aria-label="Search">
              <ArrowRight />
            </Button>
          </form>
          {heroMiss && (
            <p role="status" className="text-xs text-amber-300">
              {heroMiss}
            </p>
          )}
          <Button size="lg" variant="outline" className="self-start" onClick={() => enterMap()}>
            Explore warehouses
          </Button>
        </div>
      </section>

      {/* Listing panel (map mode): side panel on desktop, bottom sheet on mobile */}
      <aside
        ref={panelRef}
        aria-label="Warehouse listings"
        inert={mode !== "map"}
        className={cn(
          "absolute z-10 flex flex-col border-border bg-background/90 text-foreground shadow-2xl backdrop-blur transition-transform duration-500 motion-reduce:transition-none",
          "inset-x-0 bottom-0 h-[52%] rounded-t-3xl border-t",
          "md:inset-x-auto md:top-4 md:bottom-4 md:left-4 md:h-auto md:w-[400px] md:rounded-3xl md:border",
          mode !== "map" && "translate-y-full md:translate-y-0 md:-translate-x-[calc(100%+2rem)]",
          mode === "map" && !panelOpen && "translate-y-[calc(100%-4rem)] md:translate-y-0",
        )}
      >
        <header className="flex flex-col gap-3 border-b border-border px-5 pt-3 pb-4">
          <button
            type="button"
            onClick={() => setPanelOpen((o) => !o)}
            aria-label={panelOpen ? "Collapse listings" : "Expand listings"}
            aria-expanded={panelOpen}
            className="mx-auto flex h-5 w-full items-center justify-center md:hidden"
          >
            <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", !panelOpen && "rotate-180")} />
          </button>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-xl tracking-tight" aria-live="polite">
              {count}
            </h2>
            <Button size="sm" variant="outline" onClick={enterGlobe}>
              <Globe /> Back to globe
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NativeSelect
              aria-label="City"
              value={city}
              onChange={chooseCity}
              placeholder="All cities"
              options={cities.map((c) => ({ value: c, label: c }))}
              size="sm"
            />
            <NativeSelect
              aria-label="Industry"
              value={filters.industry}
              onChange={(v) => setFilters((f) => ({ ...f, industry: v }))}
              placeholder="All industries"
              options={industries.map((i) => ({ value: i.key, label: i.name }))}
              size="sm"
            />
          </div>
          {hasRates && (
            <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              <span className="flex justify-between">
                Max rate
                <b className="font-medium text-foreground">{rateDraft === null ? "Any" : `≤ ₹${rateDraft} / sq ft / month`}</b>
              </span>
              <input
                type="range"
                min={rateMin}
                max={rateMax}
                step={1}
                value={rateDraft ?? rateMax}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setRateDraft(v >= rateMax ? null : v)
                }}
                className="accent-primary"
              />
            </label>
          )}
        </header>

        {status && (
          <p role={error ? "alert" : "status"} className={cn("px-5 py-3 text-xs", error ? "text-destructive" : "text-muted-foreground")}>
            {status}
          </p>
        )}

        <ul className={cn("flex flex-1 flex-col gap-2 overflow-y-auto p-3", loading && data.length > 0 && "opacity-60")} onMouseLeave={() => setHoverId(null)}>
          {visible.map((w) => (
            <li key={w.shortId}>
              <button
                type="button"
                onClick={() => openWarehouse(w)}
                onMouseEnter={() => setHoverId(w.shortId)}
                onFocus={() => setHoverId(w.shortId)}
                onBlur={() => setHoverId(null)}
                className={cn(
                  "flex w-full gap-3 rounded-2xl border border-transparent p-2 text-left transition-colors hover:border-border hover:bg-muted/50 focus-visible:border-ring focus-visible:outline-none",
                  popupId === w.shortId && "border-primary/60 bg-muted/50",
                )}
              >
                <Cover w={w} className="h-20 w-24 rounded-xl" />
                <div className="flex min-w-0 flex-col gap-1">
                  <h3 className="truncate font-medium">{w.name}</h3>
                  <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                    {placeOf(w) && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" />
                        {placeOf(w)}
                      </span>
                    )}
                    {w.totalSqm > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Ruler className="size-3" />
                        {formatAreaSqft(w.totalSqm)}
                      </span>
                    )}
                  </p>
                  <p className="text-sm">{formatRate(w.rate)}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {popupEl && popupWarehouse && createPortal(<PopupCard w={popupWarehouse} />, popupEl)}
    </div>
  )
}
