"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, List, Map as MapIcon, MapPin, SlidersHorizontal, Sparkles } from "lucide-react"
import { Button, Input, Sheet, SheetContent, SheetHeader, SheetTitle, Textarea } from "@/components/ui"
import { EmptyState, ErrorState, LoadingRows, NativeSelect, Pager } from "@/components/common"
import { mapsEnabled } from "@/components/maps/maps-provider"
import { browserApi } from "@/core/api"
import { env } from "@/core/config/env"
import { getSessionId, rememberSearchId } from "@/core/session/visitor-session"
import { useSiteFeature } from "@/features/users"
import { cn } from "@/lib/utils"
import { searchApi, type SearchContext } from "../api/search.api"
import {
  SORT_OPTIONS,
  type FilterCatalog,
  type MapData,
  type SearchQuery,
  type SearchResult,
  type SortKey,
} from "../entities/search.entity"
import { queryFromParams, queryToParams } from "../lib/query-params"
import { FiltersPanel } from "./filters-panel"
import { ListingCardView } from "./listing-card"
import { ResultsMap } from "./results-map"

const api = searchApi(browserApi)

const DEGRADED: Record<string, string> = {
  geocode_unavailable: "We couldn't look up that location right now, so these results aren't sorted by distance.",
  semantic_unavailable: "Similar-match suggestions are unavailable right now.",
}

/**
 * The search screen. The URL is the source of truth for the query; an `ai`
 * param runs one natural-language search, whose parsed filters then replace
 * it in the URL so paging and refinements run as structured searches.
 */
export function SearchPage({ catalog }: { catalog: FilterCatalog | null }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const paramString = params.toString()
  const query = useMemo(() => queryFromParams(new URLSearchParams(paramString)), [paramString])
  const canAI = useSiteFeature("ai_search")
  const aiEnabled = env.aiSearchEnabled && canAI
  const aiText = aiEnabled ? (new URLSearchParams(paramString).get("ai") ?? "") : ""

  const [result, setResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"list" | "map">("list")
  const [mapData, setMapData] = useState<MapData | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [place, setPlace] = useState(query.place)
  const [describe, setDescribe] = useState(false)
  const [text, setText] = useState("")
  const skipParams = useRef<string | null>(null)

  const ctx: SearchContext = useMemo(
    () => ({ country: catalog?.country ?? env.defaultCountry, currency: catalog?.currency ?? "INR", sessionId: getSessionId() }),
    [catalog],
  )

  const [placeFor, setPlaceFor] = useState(query.place)
  if (placeFor !== query.place) {
    setPlaceFor(query.place)
    setPlace(query.place)
  }

  const navigate = useCallback(
    (q: SearchQuery) => {
      const p = queryToParams(q)
      router.push(`${pathname}${p.toString() ? `?${p}` : ""}`)
    },
    [router, pathname],
  )

  useEffect(() => {
    if (skipParams.current === paramString) {
      skipParams.current = null
      return
    }
    const ctl = new AbortController()
    setLoading(true)
    setError(null)
    const run = aiText ? api.aiSearch(aiText, query.place, ctx, ctl.signal) : api.search(query, ctx, ctl.signal)
    run.then(
      (res) => {
        setResult(res)
        setLoading(false)
        if (res.page === 1) rememberSearchId(res.searchId)
        if (aiText) {
          // Show the parsed filters in the URL (and the filter panel) without searching again.
          const next = queryToParams({ ...res.applied, page: 1 }).toString()
          skipParams.current = next
          router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false })
        }
      },
      (err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        setError(err)
        setLoading(false)
      },
    )
    return () => ctl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramString])

  useEffect(() => {
    if (view !== "map" || !mapsEnabled) return
    let live = true
    api.map(query, ctx).then(
      (d) => live && setMapData(d),
      () => live && setMapData(null),
    )
    return () => {
      live = false
    }
  }, [view, query, ctx])

  const industryNames = useMemo(() => Object.fromEntries((catalog?.industries ?? []).map((i) => [i.key, i.name])), [catalog])
  const filters = catalog ? <FiltersPanel catalog={catalog} query={query} result={result} onChange={navigate} /> : null

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (describe && text.trim()) {
            // One natural-language search; its parsed filters then replace `ai` in the URL.
            const p = new URLSearchParams()
            if (place.trim()) p.set("q", place.trim())
            p.set("ai", text.trim())
            router.push(`${pathname}?${p}`)
            return
          }
          navigate({ ...query, place, page: 1 })
        }}
      >
        {aiEnabled && (
          <div className="flex gap-1 self-start rounded-full bg-muted p-1 text-xs">
            <button
              type="button"
              onClick={() => setDescribe(false)}
              className={cn(
                "rounded-full px-3 py-1",
                !describe ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              By location
            </button>
            <button
              type="button"
              onClick={() => setDescribe(true)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1",
                describe ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Sparkles className="size-3.5" /> Describe it
            </button>
          </div>
        )}
        {describe && (
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="e.g. 20,000 sq ft warehouse with cold storage and 2 loading docks, under ₹30 per sq ft"
            className="resize-none rounded-2xl px-4 py-3"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                e.currentTarget.form?.requestSubmit()
              }
            }}
          />
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <MapPin className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="City, area or pincode"
              className="h-10 rounded-full pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <NativeSelect
              aria-label="Sort"
              value={query.sort ?? ""}
              onChange={(v) => navigate({ ...query, sort: (v as SortKey) || undefined, page: 1 })}
              placeholder="Sort: default"
              options={SORT_OPTIONS.filter((o) => o.value !== "distance" || query.place)}
            />
            <Button type="submit">Search</Button>
            <Button type="button" variant="outline" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal /> Filters
            </Button>
          </div>
        </div>
      </form>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">{filters}</aside>
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetContent side="left" className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-6">{filters}</div>
          </SheetContent>
        </Sheet>

        <section className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="font-heading text-3xl tracking-tight sm:text-4xl">
              {loading
                ? "Searching…"
                : result
                  ? `${result.total.toLocaleString()} warehouse${result.total === 1 ? "" : "s"}`
                  : "Warehouses"}
              {result?.radius && !loading && <span className="text-muted-foreground"> within {result.radius.usedKm} km</span>}
            </h1>
            {mapsEnabled && (
              <div className="flex gap-1 rounded-full bg-muted p-1 text-xs">
                <button
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${view === "list" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setView("list")}
                >
                  <List className="size-3.5" /> List
                </button>
                <button
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${view === "map" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setView("map")}
                >
                  <MapIcon className="size-3.5" /> Map
                </button>
              </div>
            )}
          </div>

          {result?.ai && (
            <div className="flex items-start gap-2 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
              <Sparkles className="mt-0.5 size-3.5 shrink-0" />
              <span>
                {result.ai.parsed
                  ? "We turned your description into the filters on the left — adjust them to refine."
                  : "We couldn't fully understand that description, so here is a basic match."}
                {result.ai.notes.length > 0 && ` ${result.ai.notes.join(" ")}`}
              </span>
            </div>
          )}
          {result?.radius?.message && !loading && (
            <p className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-xs">{result.radius.message}</p>
          )}
          {result?.degraded.map((d) => (
            <p key={d} className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="size-3.5" /> {DEGRADED[d] ?? d}
            </p>
          ))}
          {result && result.dropped.length > 0 && (
            <p className="text-xs text-muted-foreground">Some filters are no longer available and were ignored.</p>
          )}

          {view === "map" && <ResultsMap data={mapData} />}

          {error ? (
            <ErrorState error={error} onRetry={() => navigate({ ...query })} />
          ) : loading && !result ? (
            <LoadingRows rows={4} className="flex flex-col gap-3 [&>*]:h-36" />
          ) : result && result.results.length === 0 && !result.fallback ? (
            <EmptyState
              title="No warehouses match yet"
              body="Try a wider area or fewer filters — or tell us what you need and we'll find it for you."
              action={
                <Link href="/enquire" className="text-sm font-medium underline underline-offset-4 hover:no-underline">
                  Tell us what you need →
                </Link>
              }
            />
          ) : (
            result && (
              <div className={`flex flex-col gap-3 ${loading ? "opacity-60" : ""}`}>
                {result.results.map((c) => (
                  <ListingCardView key={c.shortId} card={c} industryNames={industryNames} />
                ))}
                <Pager page={result.page} pages={result.pages} total={result.total} onPage={(page) => navigate({ ...query, page })} />
              </div>
            )
          )}

          {result?.radius?.countryLink && (
            <Button
              variant="outline"
              className="self-start"
              onClick={() => navigate({ ...query, place: "", radiusKm: undefined, page: 1 })}
            >
              Search the whole country
            </Button>
          )}

          {result?.fallback && result.fallback.results.length > 0 && (
            <div className="flex flex-col gap-3 pt-4">
              <h2 className="font-heading text-2xl tracking-tight">Similar warehouses you might like</h2>
              {result.fallback.results.map((c) => (
                <ListingCardView key={c.shortId} card={c} industryNames={industryNames} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
