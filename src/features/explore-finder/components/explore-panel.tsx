"use client"

// EXPLORE-FILTERS: redesigned as a split layout (filters | cards beside a framed map) in liquid glass,
// with the cards list following the map's visible area.

import "../explore-finder.css"
import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, Loader2, PanelLeftClose, SlidersHorizontal } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui"
import { ErrorState } from "@/components/common"
import { useLoad } from "@/core/hooks/use-load"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { SORT_OPTIONS, type FinderSort, type FinderWarehouse } from "../entities/finder.entity"
import { inBounds, LEFT_AREA, type MapBounds } from "../lib/layout"
import { activeFilterCount, finderCities, useFinderSearch } from "../lib/use-finder-search"
import { useMediaQuery } from "../lib/use-media-query"
import { useSessionFlag } from "../lib/use-session-flag"
import { ActiveFilters, FiltersPanel } from "./filters-panel"
import { FinderCard } from "./finder-card"
import { MapOverlay } from "./map-overlay"
import { QuickView } from "./quick-view"
import { CardSkeleton, Notice } from "./result-states"

const NO_RESULTS: FinderWarehouse[] = []
const COLLAPSED_KEY = "explore-finder:filters-collapsed"
/** The map reports bounds on every moveend; the list settles on them after this pause. */
const BOUNDS_DEBOUNCE_MS = 150
/** EXPLORE-FILTERS: the full filters column needs this much room; between lg and here it stays a rail. */
const WIDE = "(min-width: 1280px)"
const DESKTOP = "(min-width: 1024px)"

const plural = (n: number, word: string) => `${formatNumber(n)} ${word}${n === 1 ? "" : "s"}`
const sqftOf = (list: FinderWarehouse[]) => list.reduce((sum, w) => sum + (w.totalSqft > 0 ? w.totalSqft : 0), 0)

function CountBadge({ count }: { count: number }) {
  if (!count) return null
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#3b82f6] px-1.5 text-xs font-bold text-white">
      {count}
      <span className="sr-only"> active filters</span>
    </span>
  )
}

function FiltersPill({ count, onClick, className }: { count: number; onClick: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={cn("xf-pill h-9 items-center gap-2 rounded-full px-3.5 text-sm font-medium", className)}>
      <SlidersHorizontal aria-hidden className="size-4" /> Filters
      <CountBadge count={count} />
    </button>
  )
}

/**
 * The finder as Explore's map-view layout. Wide screens: a filters column
 * (collapsible) and a cards column on the left, Explore's own map framed on the
 * right with glass controls over it. Below lg: map on top, cards below, filters
 * in a bottom drawer. The search holds every match (up to the API limit); the
 * cards show the ones inside the map's visible area unless "Search as I move
 * the map" is off.
 */
export function ExplorePanel({
  active,
  placeRequest,
  bounds,
  hoverId,
  onHover,
  selected,
  onSelectCard,
  onResults,
  onFitAll,
  onZoom,
  onLayout,
  onBack,
}: {
  /** Explore is in map mode. */
  active: boolean
  /** Set the Place filter from outside (hero search, globe pin); a new `n` re-applies. */
  placeRequest: { city: string; n: number }
  /** The map's visible area (updated on every moveend); null until the map has settled once. */
  bounds: MapBounds | null
  hoverId: string | null
  onHover: (shortId: string | null) => void
  /** The selected warehouse (card or pin click); `n` re-triggers the same id. */
  selected: { id: string; n: number } | null
  onSelectCard: (shortId: string) => void
  /** The latest results and the place + radius they are for (kept while a newer search loads). */
  onResults: (results: FinderWarehouse[], scope: string | null) => void
  /** Frame every result on the map. */
  onFitAll: () => void
  onZoom: (delta: 1 | -1) => void
  /** The left area changed shape (filters collapsed or expanded): the map should resize. */
  onLayout: () => void
  onBack: () => void
}) {
  const cities = useLoad(finderCities, [])
  const search = useFinderSearch(placeRequest.city)
  const { filters, loading, error, result, resultScope, change, clear, retry } = search
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [collapsed, setCollapsed] = useSessionFlag(COLLAPSED_KEY)
  const wide = useMediaQuery(WIDE) // EXPLORE-FILTERS
  const desktop = useMediaQuery(DESKTOP) // EXPLORE-FILTERS
  /** EXPLORE-FILTERS: the full column (wide screens, not collapsed); otherwise a rail on desktop. */
  const showColumn = wide && !collapsed
  const [searchAsMove, setSearchAsMove] = useState(true)
  const [viewBounds, setViewBounds] = useState(bounds)
  /** EXPLORE-FILTERS: the warehouse in the quick-view popup (kept while it animates closed). */
  const [quick, setQuick] = useState<{ w: FinderWarehouse | null; open: boolean }>({ w: null, open: false })
  const cardRefs = useRef(new Map<string, HTMLElement>())
  const results = useMemo(() => result?.results ?? NO_RESULTS, [result])
  const count = activeFilterCount(filters)

  // A new place request from Explore overrides the Place filter.
  const [appliedRequest, setAppliedRequest] = useState(placeRequest.n)
  if (appliedRequest !== placeRequest.n) {
    setAppliedRequest(placeRequest.n)
    change({ place: placeRequest.city })
  }

  useEffect(() => {
    onResults(results, resultScope)
  }, [results, resultScope, onResults])

  useEffect(() => {
    const t = setTimeout(() => setViewBounds(bounds), BOUNDS_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [bounds])

  useEffect(() => {
    onLayout()
  }, [showColumn, onLayout]) // EXPLORE-FILTERS: was `collapsed`

  // Results inside the map's visible area, in the search's sort order.
  const inView = useMemo(
    () => (viewBounds ? results.filter((w) => w.loc && inBounds(w.loc, viewBounds)) : results),
    [results, viewBounds],
  )
  const inViewSqft = useMemo(() => sqftOf(inView), [inView])
  const base = searchAsMove ? inView : results
  // A clicked pin whose card the area filter hides (a pin on the very edge) shows on top.
  const pinned = selected && !base.some((w) => w.shortId === selected.id) ? results.find((w) => w.shortId === selected.id) : undefined
  const list = pinned ? [pinned, ...base] : base
  const listSqft = searchAsMove ? inViewSqft : sqftOf(results)

  /** EXPLORE-FILTERS: a card click still selects it (map flies to its pin) and now opens the quick view. */
  const openCard = (shortId: string) => {
    onSelectCard(shortId)
    const w = results.find((x) => x.shortId === shortId)
    if (w) setQuick({ w, open: true })
  }

  // A pin click (or card click) brings its card into view.
  useEffect(() => {
    if (!selected) return
    const frame = requestAnimationFrame(() => cardRefs.current.get(selected.id)?.scrollIntoView({ behavior: "smooth", block: "nearest" }))
    return () => cancelAnimationFrame(frame)
  }, [selected])

  const filtersForm = (
    <FiltersPanel filters={filters} onChange={change} cities={cities.data ?? []} citiesLoading={cities.status === "loading"} />
  )
  const clearLink = count > 0 && (
    <button type="button" onClick={clear} className="rounded-md text-sm font-medium text-[#60a5fa] underline-offset-4 hover:underline">
      Clear all
    </button>
  )
  const activeRow = <ActiveFilters filters={filters} onChange={change} /> // EXPLORE-FILTERS

  let body: React.ReactNode
  if (error && !result) {
    body = <ErrorState error={error} onRetry={retry} />
  } else if (!result) {
    body = [0, 1, 2].map((i) => <CardSkeleton key={i} />)
  } else if (results.length === 0) {
    body = (
      <Notice
        title="No warehouses match these filters"
        body={result.message || "Try a wider radius, another place or fewer features."}
        action={
          count > 0 && (
            <button type="button" onClick={clear} className="xf-pill mt-1 h-10 rounded-full px-5 text-sm font-semibold">
              Clear filters
            </button>
          )
        }
      />
    )
  } else if (list.length === 0) {
    body = (
      <Notice
        title="No matches in this area"
        body={`${plural(results.length, "warehouse")} ${results.length === 1 ? "matches" : "match"} your filters elsewhere.`}
        action={
          <button type="button" onClick={onFitAll} className="xf-pill mt-1 h-10 rounded-full px-5 text-sm font-semibold">
            Show all on map
          </button>
        }
      />
    )
  } else {
    body = list.map((w) => (
      <FinderCard
        key={w.shortId}
        ref={(el) => {
          if (el) cardRefs.current.set(w.shortId, el)
          else cardRefs.current.delete(w.shortId)
        }}
        w={w}
        active={selected?.id === w.shortId || hoverId === w.shortId}
        onHover={onHover}
        onSelect={openCard} // EXPLORE-FILTERS: was onSelectCard
      />
    ))
  }

  const sortSelect = (
    <label className="flex items-center gap-2 text-xs text-white/70">
      <span className="max-sm:sr-only">Sort by</span>
      <span className="relative">
        <select
          value={filters.sort}
          onChange={(e) => change({ sort: e.target.value as FinderSort })}
          className="xf-input h-9 appearance-none rounded-full pr-8 pl-3.5 text-sm outline-none"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-white/60" />
      </span>
    </label>
  )

  return (
    <div
      inert={!active}
      className={cn(
        "xf pointer-events-none absolute inset-0 z-10 transition-opacity duration-500 motion-reduce:transition-none",
        !active && "opacity-0",
      )}
    >
      <div className={cn("pointer-events-auto absolute flex gap-3", LEFT_AREA)}>
        {/* EXPLORE-FILTERS: the filters column is the page's anchor; collapsed (or below xl) it is a slim rail. */}
        {showColumn ? (
          <aside
            aria-label="Filters"
            data-active={count > 0}
            className="xf-glass xf-filters flex w-[clamp(380px,26vw,520px)] shrink-0 flex-col overflow-hidden rounded-3xl"
          >
            <div className="flex flex-col gap-3 border-b border-white/10 px-5 pt-5 pb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">Filters</h2>
                <CountBadge count={count} />
                <span className="ml-auto">{clearLink}</span>
                <button
                  type="button"
                  onClick={() => setCollapsed(true)}
                  aria-label="Collapse filters"
                  title="Collapse filters"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <PanelLeftClose className="size-[18px]" />
                </button>
              </div>
              {activeRow}
            </div>
            <div className="xf-scroll min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-8">{filtersForm}</div>
          </aside>
        ) : (
          desktop && (
            <aside aria-label="Filters" data-active={count > 0} className="xf-glass xf-filters flex w-14 shrink-0 flex-col items-center rounded-3xl py-4">
              <button
                type="button"
                onClick={() => (wide ? setCollapsed(false) : setDrawerOpen(true))}
                aria-label={count ? `Show filters (${count} active)` : "Show filters"}
                title="Show filters"
                className="relative flex size-10 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/10 hover:text-white"
              >
                <SlidersHorizontal aria-hidden className="size-5" />
                {count > 0 && (
                  <span aria-hidden className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#3b82f6] px-1 text-xs font-bold text-white">
                    {count}
                  </span>
                )}
              </button>
            </aside>
          )
        )}

        {/* EXPLORE-FILTERS: the cards column is the calmer surface; the filters column leads. */}
        <section aria-label="Results" className="xf-glass xf-calm flex min-w-0 flex-1 flex-col overflow-hidden rounded-3xl">
          <header className="flex flex-col gap-3 px-4 pt-4 pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5" aria-live="polite">
                <h2 className="flex items-center gap-2 text-[15px] leading-tight font-semibold text-white/90">
                  {result
                    ? searchAsMove
                      ? `${plural(list.length, "warehouse")} in this area`
                      : `${plural(list.length, "warehouse")} match your filters`
                    : "Loading warehouses…"}
                  {loading && result && <Loader2 aria-label="Updating results" className="size-4 shrink-0 animate-spin text-[#60a5fa]" />}
                </h2>
                <p className="text-[13px] text-white/65">{result ? `${formatNumber(listSqft)} total sqft` : "\u00a0"}</p>
              </div>
              {sortSelect}
            </div>
            {/* Below lg: the drawer (desktop uses the column or its rail). EXPLORE-FILTERS */}
            <div className="flex flex-col gap-3 lg:hidden">
              <FiltersPill count={count} onClick={() => setDrawerOpen(true)} className="inline-flex self-start" />
              {activeRow}
            </div>
            {!!error && result && (
              <p role="alert" className="text-sm text-red-300">
                Couldn&apos;t update the results.{" "}
                <button type="button" onClick={retry} className="font-medium underline underline-offset-2">
                  Try again
                </button>
              </p>
            )}
          </header>
          <div
            className={cn(
              // EXPLORE-FILTERS: exactly one card per row.
              "xf-scroll grid min-h-0 flex-1 auto-rows-max grid-cols-1 gap-4 overflow-y-auto px-4 pb-4 transition-opacity duration-200",
              loading && result && "opacity-75",
            )}
            onMouseLeave={() => onHover(null)}
          >
            {body}
          </div>
        </section>
      </div>

      <MapOverlay
        stats={result ? { inView: inView.length, sqft: inViewSqft, total: result.total } : null}
        loading={loading && !!result}
        searchAsMove={searchAsMove}
        onSearchAsMove={setSearchAsMove}
        onBack={onBack}
        onZoom={onZoom}
      />

      <QuickView w={quick.w} open={quick.open} filters={filters} onClose={() => setQuick((q) => ({ ...q, open: false }))} />

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        {/* EXPLORE-FILTERS: a bottom sheet on mobile, a side drawer from the rail between lg and xl. */}
        <SheetContent
          side={desktop ? "left" : "bottom"}
          className={cn(
            "dark site xf xf-drawer xf-popover xf-scroll overflow-y-auto text-white", // EXPLORE-FILTERS: + dark site (the drawer portals out of the site wrapper)
            desktop ? "w-[380px] max-w-[90vw] rounded-r-3xl sm:max-w-[380px]" : "max-h-[85dvh] rounded-t-3xl",
          )}
        >
          <SheetHeader className="gap-3 px-5 pt-5 pb-0">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-lg font-semibold text-white">Filters</SheetTitle>
              <CountBadge count={count} />
              <span className="mr-10 ml-auto">{clearLink}</span>
            </div>
            {activeRow}
          </SheetHeader>
          <div className="px-5 pb-8">{filtersForm}</div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
