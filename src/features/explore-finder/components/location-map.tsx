"use client"

// EXPLORE-FILTERS: the quick view's map banner.

import "maplibre-gl/dist/maplibre-gl.css"
import { useEffect, useRef, useState } from "react"
import type { Map as MapLibreMap } from "maplibre-gl"
import { ArrowUpRight, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LatLng } from "../entities/finder.entity"
import { INK, STYLE_URL } from "../lib/map"
import { fillMissingImages } from "../lib/missing-images"

const ZOOM = 13
/** Give up and show the placeholder if the style never loads. */
const LOAD_TIMEOUT_MS = 12_000

/** A 28px gold pin with a dark outline, so it stands out on the dark basemap. */
function pinElement(): HTMLElement {
  const el = document.createElement("div")
  el.setAttribute("aria-hidden", "true")
  el.innerHTML =
    '<svg width="28" height="28" viewBox="0 0 24 24" style="display:block;filter:drop-shadow(0 2px 4px rgb(0 0 0/60%))">' +
    '<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" fill="#F5B82E" stroke="#0a1220" stroke-width="1.6"/>' +
    '<circle cx="12" cy="10" r="2.6" fill="#0a1220"/></svg>'
  return el
}

/**
 * An interactive map centred on one warehouse with a gold pin (MapLibre, the finder's
 * OpenFreeMap dark style). Starts only once its box has a real size (the dialog animates
 * in), resizes again when that animation ends, shimmers until "load", falls back to a
 * static placeholder on failure, and is removed on unmount (the popup closing).
 *
 * MapLibre's unlayered `.maplibregl-map { position: relative }` beats Tailwind's
 * `absolute`, so the container is sized with inline styles, which nothing overrides.
 */
export function LocationMap({ point, directionsHref, className }: { point: LatLng; directionsHref: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const { lat, lng } = point

  useEffect(() => {
    const container = ref.current
    if (!container) return
    let cancelled = false
    let starting = false
    let map: MapLibreMap | null = null
    const fail = (reason: unknown) => {
      if (cancelled) return
      console.warn("[quick view map] unavailable", reason)
      setStatus("error")
    }

    const start = () => {
      if (starting || cancelled || !container.clientWidth || !container.clientHeight) return
      starting = true
      import("maplibre-gl").then(({ default: lib }) => {
        if (cancelled) return
        let m: MapLibreMap
        try {
          m = new lib.Map({ container, style: STYLE_URL, center: [lng, lat], zoom: ZOOM, attributionControl: { compact: true }, dragRotate: false })
        } catch (err) {
          return fail(err) // e.g. WebGL unavailable
        }
        map = m
        fillMissingImages(m)
        m.addControl(new lib.NavigationControl({ showCompass: false }), "top-left") // the close button owns the top-right
        new lib.Marker({ element: pinElement(), anchor: "bottom" }).setLngLat([lng, lat]).addTo(m)
        // loaded() stays false while tiles stream in, so track the style and "load" ourselves.
        let styled = false
        let ready = false
        const timer = setTimeout(() => !ready && fail("map load timed out"), LOAD_TIMEOUT_MS)
        m.once("style.load", () => (styled = true))
        m.once("load", () => {
          ready = true
          clearTimeout(timer)
          m.resize()
          if (!cancelled) setStatus("ready")
        })
        // Without a style there is no map: give up. A missing tile later is not worth a banner.
        m.on("error", (e) => {
          if (styled) return
          clearTimeout(timer)
          fail(e.error)
        })
        m.getCanvas().addEventListener("webglcontextlost", () => fail("WebGL context lost"))
      }, fail)
    }

    // Start once the box has a size; afterwards keep the canvas matched to it.
    const observer = new ResizeObserver(() => (map ? map.resize() : start()))
    observer.observe(container)
    // The dialog's open animation scales the box: resize once more when it ends.
    const dialog = container.closest("[role=dialog]")
    const onAnimationEnd = () => map?.resize()
    dialog?.addEventListener("animationend", onAnimationEnd)
    start()

    return () => {
      cancelled = true
      observer.disconnect()
      dialog?.removeEventListener("animationend", onAnimationEnd)
      map?.remove()
    }
  }, [lat, lng])

  return (
    <div className={cn("relative w-full overflow-hidden", className)} style={{ background: INK }}>
      <div ref={ref} aria-label="Warehouse location map" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      {status === "loading" && (
        <div aria-hidden className="pointer-events-none absolute inset-0 animate-pulse bg-[linear-gradient(110deg,rgb(255_255_255/3%)_30%,rgb(255_255_255/9%)_50%,rgb(255_255_255/3%)_70%)]" />
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[linear-gradient(rgb(255_255_255/5%)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/5%)_1px,transparent_1px)] bg-[size:20px_20px]">
          <MapPin aria-hidden className="size-7 fill-[#F5B82E] text-[#0a1220]" strokeWidth={1.6} />
          <p className="text-sm text-white/75">Map unavailable</p>
          {directionsHref && (
            <a
              href={directionsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="xf-pill inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold tracking-[0.06em] uppercase"
            >
              Directions <ArrowUpRight aria-hidden className="size-3.5" />
            </a>
          )}
        </div>
      )}
    </div>
  )
}
