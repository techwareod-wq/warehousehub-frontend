"use client"

import "../explore-finder.css" // EXPLORE-FILTERS: the card and filters use the glass classes
import { useEffect, useRef, useState } from "react"
import { List, Map as MapIcon, SlidersHorizontal } from "lucide-react"
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui"
import { ErrorState, NativeSelect } from "@/components/common"
import { useLoad } from "@/core/hooks/use-load"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { SORT_OPTIONS, type FinderSort } from "../entities/finder.entity"
import { finderCities, useFinderSearch } from "../lib/use-finder-search"
import { FiltersPanel } from "./filters-panel"
import { CardSkeleton, Notice } from "./result-states"
import { FinderCard } from "./finder-card"
import { FinderMap } from "./finder-map"

/**
 * EXPERIMENTAL warehouse finder, Discover-style: filters | results | map.
 * Any filter change re-runs POST /v1/public/finder/search after a short pause;
 * a newer search aborts the one in flight.
 */
export function FinderPage() {
  const cities = useLoad(finderCities, [])
  const { filters, loading, error, result, change, clear, retry } = useFinderSearch()
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [selected, setSelected] = useState<{ id: string; n: number } | null>(null)
  const [view, setView] = useState<"list" | "map">("list")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const cardRefs = useRef(new Map<string, HTMLElement>())

  // Marker click: bring its card into view (switching to the list on small screens).
  useEffect(() => {
    if (!selected || view !== "list") return
    cardRefs.current.get(selected.id)?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [selected, view])

  const results = result?.results ?? []
  const stats = result ? `${formatNumber(result.total)} warehouses · ${formatNumber(result.totalSqft)} total sqft` : null

  const select = (id: string) => {
    setSelected((s) => ({ id, n: (s?.n ?? 0) + 1 }))
    setView("list")
  }

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
  if (error) {
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
        onHover={setHoverId}
      />
    ))
  }

  return (
    <div className="flex flex-1 flex-col bg-site-deep lg:h-[calc(100dvh-4rem)] lg:flex-none lg:flex-row lg:overflow-hidden">
      {/* Filters: a column on wide screens, a drawer below that. */}
      <aside className="hidden w-[340px] shrink-0 overflow-y-auto border-r border-white/10 px-6 py-6 xl:block">{panel}</aside>
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left" className="overflow-y-auto bg-site-deep">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-8">{panel}</div>
        </SheetContent>
      </Sheet>

      <div className="sticky top-16 z-20 flex items-center justify-between gap-2 border-b border-white/10 bg-site-deep/95 px-4 py-2.5 backdrop-blur lg:hidden">
        <Button variant="outline" size="sm" onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal /> Filters
        </Button>
        <div className="flex gap-1 rounded-full bg-white/5 p-1 text-xs">
          {(["list", "map"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1 capitalize",
                view === v ? "bg-[#F5B82E] text-[#05070d]" : "text-white/70 hover:text-white",
              )}
            >
              {v === "list" ? <List className="size-3.5" /> : <MapIcon className="size-3.5" />} {v}
            </button>
          ))}
        </div>
      </div>

      <section
        className={cn(
          "flex min-w-0 flex-col border-white/10 lg:w-[460px] lg:shrink-0 lg:overflow-y-auto lg:border-r xl:w-[520px]",
          view === "map" && "hidden lg:flex",
        )}
      >
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5 lg:sticky lg:top-0 lg:z-10 lg:bg-site-deep/95 lg:backdrop-blur">
          <div className="flex flex-col">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-white">
              {result ? `${formatNumber(result.total)} warehouses` : "Searching…"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {result ? `${formatNumber(result.totalSqft)} total sqft` : filters.place ? `in ${filters.place}` : "All places"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden lg:inline-flex xl:hidden" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal /> Filters
            </Button>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
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
        </div>
        <div className={cn("flex flex-col gap-3 p-4 sm:p-5", loading && result && "opacity-60 transition-opacity")}>{body}</div>
      </section>

      <FinderMap
        results={results}
        centroid={result?.centroid ?? null}
        highlightId={hoverId ?? selected?.id ?? null}
        onSelect={select}
        className={cn("min-w-0 flex-1", view === "list" ? "hidden lg:block" : "h-[calc(100dvh-7.5rem)]")}
      >
        {stats && (
          <div className="pointer-events-none absolute top-3 left-3 rounded-xl border border-white/10 bg-site-ink/85 px-3.5 py-2 text-xs font-medium text-white shadow-lg backdrop-blur-md">
            {stats}
          </div>
        )}
      </FinderMap>
    </div>
  )
}
