"use client"

// EXPLORE-FILTERS: the small glass controls floating on Explore's map frame.

import { Globe, Loader2, Minus, Plus } from "lucide-react"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { MAP_FRAME } from "../lib/layout"

const plural = (n: number, word: string) => `${formatNumber(n)} ${word}${n === 1 ? "" : "s"}`

/**
 * Sits exactly over the map frame and lets clicks through to the map, except on
 * its controls: stats and "Back to globe" top-left, the "Search as I move the
 * map" switch below them, zoom top-right.
 */
export function MapOverlay({
  stats,
  loading,
  searchAsMove,
  onSearchAsMove,
  onBack,
  onZoom,
}: {
  /** In-view count and sqft, and the total that match the filters; null before the first result. */
  stats: { inView: number; sqft: number; total: number } | null
  loading: boolean
  searchAsMove: boolean
  onSearchAsMove: (on: boolean) => void
  onBack: () => void
  onZoom: (delta: 1 | -1) => void
}) {
  return (
    <div className={cn("pointer-events-none absolute", MAP_FRAME)}>
      <div className="absolute top-3 right-16 left-3 flex flex-col items-start gap-2">
        <div className="flex max-w-full flex-wrap items-start gap-2">
          <div role="status" aria-live="polite" className="xf-glass flex max-w-full items-center gap-2.5 rounded-2xl px-4 py-2">
            <div className="flex min-w-0 flex-col">
              <span className="text-sm font-semibold text-white">
                {stats ? `${plural(stats.inView, "warehouse")} in this area · ${formatNumber(stats.sqft)} sqft` : "Loading warehouses…"}
              </span>
              {stats && <span className="text-xs text-white/70">of {formatNumber(stats.total)} match your filters</span>}
            </div>
            {loading && <Loader2 aria-label="Updating results" className="size-4 shrink-0 animate-spin text-[#f9cc63]" />}
          </div>
          <button type="button" onClick={onBack} className="xf-pill xf-glass pointer-events-auto inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium">
            <Globe aria-hidden className="size-4" /> Back to globe
          </button>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={searchAsMove}
          onClick={() => onSearchAsMove(!searchAsMove)}
          className="xf-pill xf-glass pointer-events-auto inline-flex h-10 items-center gap-2.5 rounded-full pr-4 pl-2.5 text-sm font-medium"
        >
          <span aria-hidden className="xf-switch relative inline-flex h-5 w-[34px] shrink-0 items-center rounded-full px-[3px]">
            <span className="size-3.5 rounded-full bg-white shadow" />
          </span>
          Search as I move the map
        </button>
      </div>

      <div className="xf-glass pointer-events-auto absolute top-3 right-3 flex flex-col overflow-hidden rounded-full">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => onZoom(1)}
          className="flex size-10 items-center justify-center text-white/90 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Plus className="size-4" />
        </button>
        <span aria-hidden className="mx-2.5 h-px bg-white/15" />
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => onZoom(-1)}
          className="flex size-10 items-center justify-center text-white/90 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Minus className="size-4" />
        </button>
      </div>
    </div>
  )
}
