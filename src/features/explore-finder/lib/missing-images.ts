import type { Map as MapLibreMap } from "maplibre-gl"

// EXPLORE-FILTERS: OpenFreeMap's dark style references sprite images it doesn't ship
// (e.g. "wood-pattern"); answer with a transparent pixel so MapLibre doesn't warn.
const BLANK = { width: 1, height: 1, data: new Uint8Array(4) }

export function fillMissingImages(map: MapLibreMap) {
  map.on("styleimagemissing", (e) => {
    if (!map.hasImage(e.id)) map.addImage(e.id, BLANK)
  })
}
