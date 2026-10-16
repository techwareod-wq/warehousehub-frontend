import type { Map as MapLibreMap } from "maplibre-gl"
import type { LatLng } from "../entities/finder.entity"
import { STYLE_URL } from "./map"

/** CSS size of a card thumbnail; rendered at 2× for sharp screens. */
const W = 320
const H = 220
const ZOOM = 12.5
/** Give up on a location whose tiles never settle. */
const TIMEOUT_MS = 10_000

let mapPromise: Promise<MapLibreMap> | null = null
let queue: Promise<unknown> = Promise.resolve()
const cache = new Map<string, Promise<string>>()

/** One hidden, non-interactive map shared by every card, created on first use. */
function snapshotMap(): Promise<MapLibreMap> {
  mapPromise ??= import("maplibre-gl").then(
    ({ default: lib }) =>
      new Promise<MapLibreMap>((resolve) => {
        const el = document.createElement("div")
        el.setAttribute("aria-hidden", "true")
        Object.assign(el.style, { position: "fixed", left: "-10000px", top: "0", width: `${W}px`, height: `${H}px`, pointerEvents: "none" })
        document.body.appendChild(el)
        const m = new lib.Map({
          container: el,
          style: STYLE_URL,
          center: [78.96, 20.59],
          zoom: ZOOM,
          interactive: false,
          attributionControl: false,
          fadeDuration: 0,
          pixelRatio: 2,
          canvasContextAttributes: { preserveDrawingBuffer: true },
        })
        m.once("load", () => resolve(m))
      }),
  )
  return mapPromise
}

function settled(m: MapLibreMap): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("map thumbnail timed out")), TIMEOUT_MS)
    m.once("idle", () => {
      clearTimeout(timer)
      resolve()
    })
  })
}

/**
 * A JPEG data URL of the map centred on `p` (no pin: the card draws it).
 * Requests are rendered one at a time on the shared map and cached by location,
 * so a long result list costs one WebGL context, not one per card.
 */
export function mapThumbnail(p: LatLng): Promise<string> {
  const key = `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`
  const hit = cache.get(key)
  if (hit) return hit
  const job = queue.then(async () => {
    const m = await snapshotMap()
    const done = settled(m)
    m.jumpTo({ center: [p.lng, p.lat], zoom: ZOOM })
    m.triggerRepaint()
    await done
    return m.getCanvas().toDataURL("image/jpeg", 0.8)
  })
  queue = job.catch(() => undefined)
  cache.set(key, job)
  job.catch(() => cache.delete(key))
  return job
}
