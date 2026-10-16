"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Globe, List, Loader2, Map as MapIcon, PanelLeftClose, SlidersHorizontal } from "lucide-react"
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui"
import { ErrorState, NativeSelect } from "@/components/common"
import { useLoad } from "@/core/hooks/use-load"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { SORT_OPTIONS, type FinderSort, type FinderWarehouse } from "../entities/finder.entity"
import { activeFilterCount, finderCities, useFinderSearch } from "../lib/use-finder-search"
import { useSessionFlag } from "../lib/use-session-flag"
import { FiltersPanel } from "./filters-panel"
import { FinderCard } from "./finder-card"
import { CardSkeleton, Notice } from "./result-states"

const NO_RESULTS: FinderWarehouse[] = []
const COLLAPSED_KEY = "explore-finder:filters-collapsed"

function FiltersButton({ count, onClick, className }: { count: number; onClick: () => void; className?: string }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} className={className}>
      <SlidersHorizontal /> Filters
      {count > 0 && (
        <span className="ml-0.5 inline-flex min-w-4.5 items-center justify-center rounded-full bg-[#F5B82E] px-1 text-[10px] font-bold text-[#05070d]">
          {count}
        </span>
      )}
    </Button>
  )
}

/**
 * The finder as Explore's map-view overlay: filters (collapsible) | results over
 * the left of Explore's own map, which draws the results. Searches every live
 * warehouse until a place is picked. Mobile: a toolbar with a filters drawer and
 * a List / Map toggle.
 */
export function ExplorePanel({
  active,
  panelRef,
  placeRequest,
  hoverId,
  onHover,
  selected,
  onSelectCard,
  mapView,
  onMapView,
  onResults,
  onBack,
}: {
  /** Explore is in map mode. */
  active: boolean
  /** Explore pads its camera by this element's width. */
  panelRef: React.Ref<HTMLElement>
  /** Set the Place filter from outside (hero search, globe pin); a new `n` re-applies. */
  placeRequest: { city: string; n: number }
  hoverId: string | null
  onHover: (shortId: string | null) => void
  /** The selected warehouse (card or pin click); `n` re-triggers the same id. */
  selected: { id: string; n: number } | null
  onSelectCard: (shortId: string) => void
  /** Mobile: the map is showing instead of the list. */
  mapView: boolean
  onMapView: (map: boolean) => void
  /** The latest results and the place they are for (kept while a newer search loads). */
  onResults: (results: FinderWarehouse[], place: string) => void
  onBack: () => void
}) {
  const cities = useLoad(finderCities, [])
  const search = useFinderSearch(placeRequest.city)
  const { filters, loading, error, result, resultPlace, change, clear, retry } = search
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [collapsed, setCollapsed] = useSessionFlag(COLLAPSED_KEY)
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
    onResults(results, resultPlace)
  }, [results, resultPlace, onResults])

  // A pin click (or card click) brings its card into view.
  useEffect(() => {
    if (!selected || mapView) return
    cardRefs.current.get(selected.id)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [selected, mapView])

  const panel = (
    <FiltersPanel
      filters={filters}
      onChange={change}
      onClear={clear}
      cities={cities.data ?? []}
      citiesLoading={cities.status === "loading"}
    />
  )

  let body: React.ReactNode
  if (error && !result) {
    body = <ErrorState error={error} onRetry={retry} />
  } else if (!result) {
    body = [0, 1, 2].map((i) => <CardSkeleton key={i} />)
  } else if (results.length === 0) {
    body = (
      <Notice
        title="No warehouses match yet"
        body={result.message || "Try a wider radius, a smaller area or fewer features."}
        action={
          <Button variant="outline" size="sm" className="mt-2" onClick={clear}>
            Clear filters
          </Button>
        }
      />
    )
  } else {
    body = results.map((w) => (
      <FinderCard
        key={w.shortId}
        ref={(el) => {
          if (el) cardRefs.current.set(w.shortId, el)
          else cardRefs.current.delete(w.shortId)
        }}
        w={w}
        active={selected?.id === w.shortId || hoverId === w.shortId}
        onHover={onHover}
        onSelect={onSelectCard}
      />
    ))
  }

  const summary = result ? `${formatNumber(result.total)} warehouses · ${formatNumber(result.totalSqft)} total sqft` : "Loading warehouses…"
  const spinner = loading && <Loader2 aria-label="Updating results" className="size-3.5 shrink-0 animate-spin text-[#F5B82E]" />

  return (
    <section
      ref={panelRef}
      inert={!active}
      aria-label="Warehouse finder"
      className={cn(
        "absolute inset-x-0 top-0 z-10 flex flex-col text-foreground transition-[opacity,translate] duration-500 motion-reduce:transition-none",
        !mapView && "bottom-0",
        "lg:inset-x-auto lg:top-4 lg:bottom-4 lg:left-4",
        !active && "pointer-events-none -translate-x-8 opacity-0",
      )}
    >
      {/* Mobile toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-border bg-background/95 px-3 py-2.5 backdrop-blur lg:hidden">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onBack} aria-label="Back to globe">
            <Globe />
          </Button>
          <FiltersButton count={count} onClick={() => setFiltersOpen(true)} />
        </div>
        <div className="flex gap-1 rounded-full bg-white/5 p-1 text-xs">
          {([false, true] as const).map((isMap) => (
            <button
              key={String(isMap)}
              type="button"
              aria-pressed={mapView === isMap}
              onClick={() => onMapView(isMap)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1",
                mapView === isMap ? "bg-[#F5B82E] text-[#05070d]" : "text-white/70 hover:text-white",
              )}
            >
              {isMap ? <MapIcon className="size-3.5" /> : <List className="size-3.5" />} {isMap ? "Map" : "List"}
            </button>
          ))}
        </div>
      </div>

      <div
        className={cn(
          "flex min-h-0 flex-1 overflow-hidden bg-background/95 backdrop-blur lg:rounded-3xl lg:border lg:border-border lg:bg-background/90 lg:shadow-2xl",
          mapView && "max-lg:hidden",
        )}
      >
        {!collapsed && (
          <aside aria-label="Filters" className="hidden w-[280px] shrink-0 flex-col border-r border-border xl:flex">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-xs font-semibold tracking-[0.2em] text-white/70 uppercase">Filters</span>
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-white/70 hover:bg-white/5 hover:text-white"
              >
                <PanelLeftClose className="size-4" /> Collapse filters
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">{panel}</div>
          </aside>
        )}

        <section aria-label="Results" className="flex min-w-0 flex-1 flex-col overflow-y-auto lg:w-[360px] lg:flex-none">
          <div className="sticky top-0 z-10 flex flex-col gap-2.5 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-col" aria-live="polite">
                <h2 className="flex items-center gap-2 font-heading text-lg leading-tight tracking-tight">
                  {result ? `${formatNumber(result.total)} warehouses` : "Loading…"}
                  {spinner}
                </h2>
                <p className="truncate text-xs text-muted-foreground">
                  {result ? `${formatNumber(result.totalSqft)} total sqft` : ""}
                  {resultPlace && result ? ` · in ${resultPlace}` : ""}
                </p>
              </div>
              <Button size="sm" variant="outline" className="hidden shrink-0 lg:inline-flex" onClick={onBack}>
                <Globe /> Globe
              </Button>
            </div>
            <div className="flex items-center justify-between gap-2">
              {/* Wide screens: reopen the collapsed column. Narrower: the drawer. */}
              {collapsed && <FiltersButton count={count} onClick={() => setCollapsed(false)} className="hidden xl:inline-flex" />}
              <FiltersButton count={count} onClick={() => setFiltersOpen(true)} className="hidden lg:inline-flex xl:hidden" />
              <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                Sort by
                <NativeSelect
                  aria-label="Sort by"
                  size="sm"
                  value={filters.sort}
                  onChange={(v) => change({ sort: v as FinderSort })}
                  options={SORT_OPTIONS}
                />
              </label>
            </div>
            {!!error && result && (
              <p role="alert" className="text-xs text-destructive">
                Couldn&apos;t update the results.{" "}
                <button type="button" onClick={retry} className="underline underline-offset-2">
                  Try again
                </button>
              </p>
            )}
          </div>
          <div className={cn("flex flex-col gap-3 p-3 transition-opacity", loading && result && "opacity-70")} onMouseLeave={() => onHover(null)}>
            {body}
          </div>
        </section>
      </div>

      {/* Stat box on the map, beside the panel (desktop) or under the toolbar (mobile map view). */}
      <div
        className={cn(
          "pointer-events-none absolute top-0 left-full ml-4 hidden items-center gap-2 rounded-xl border border-white/10 bg-[#05070d]/80 px-3.5 py-2 text-xs font-medium whitespace-nowrap text-white shadow-lg backdrop-blur-md lg:flex",
        )}
      >
        {summary}
        {spinner}
      </div>
      {mapView && (
        <div className="pointer-events-none mx-3 mt-2 flex items-center gap-2 self-start rounded-xl border border-white/10 bg-[#05070d]/80 px-3 py-1.5 text-xs text-white backdrop-blur-md lg:hidden">
          {summary}
          {spinner}
        </div>
      )}

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-8">{panel}</div>
        </SheetContent>
      </Sheet>
    </section>
  )
}
