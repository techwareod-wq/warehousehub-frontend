"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { List, Map as MapIcon, MapPin } from "lucide-react"
import { Badge, Button, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui"
import { Checkbox, EmptyState, ErrorState, LoadingRows, NativeSelect, PageHeader, Pager } from "@/components/common"
import { mapsEnabled } from "@/components/maps/maps-provider"
import { browserApi } from "@/core/api"
import { env } from "@/core/config/env"
import { useLoad } from "@/core/hooks/use-load"
import { formatAreaSqft } from "@/lib/format"
import { cn } from "@/lib/utils"
import { adminSearchApi } from "../api/search.api"
import type { SearchQuery } from "../entities/search.entity"
import { cardValue, filterItems, isActive, itemName } from "../lib/filter-items"
import { queryFromParams, queryToParams } from "../lib/query-params"
import { formatRate } from "../lib/rate"
import { FiltersPanel } from "./filters-panel"
import { ResultsMap } from "./results-map"

const api = adminSearchApi(browserApi)

/**
 * Staff search: the public filters plus every attribute (staff-only ones
 * marked), archived listings on request. One column per attribute filter
 * shows each warehouse's value; the map view clusters the matches. The URL
 * holds the query.
 */
export function AdminSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const paramString = useSearchParams().toString()
  const query = useMemo(() => queryFromParams(new URLSearchParams(paramString)), [paramString])
  const catalog = useLoad(() => api.catalog(env.defaultCountry), [])
  const country = catalog.data?.country ?? env.defaultCountry
  const currency = catalog.data?.currency ?? "INR"

  const search = useLoad(() => api.search(query, country, currency), [paramString, country, currency])
  const result = search.data ?? null
  const loading = search.status === "loading"
  const error = search.status === "error" ? search.error : null
  const [view, setView] = useState<"list" | "map">("list")
  const showMap = view === "map" && mapsEnabled
  const mapData = useLoad(
    () => (showMap ? api.map(query, country, currency) : Promise.resolve(null)),
    [showMap, paramString, country, currency],
  )
  const [place, setPlace] = useState(query.place)
  const [placeFor, setPlaceFor] = useState(query.place)
  if (placeFor !== query.place) {
    setPlaceFor(query.place)
    setPlace(query.place)
  }

  const navigate = (q: SearchQuery) => {
    const p = queryToParams(q)
    router.replace(`${pathname}${p.toString() ? `?${p}` : ""}`, { scroll: false })
  }

  const columns = useMemo(
    () => (catalog.data ? filterItems(catalog.data).filter((i) => isActive(i, query)) : []),
    [catalog.data, query],
  )
  const radiusOptions = (catalog.data?.radiusSteps ?? [25, 50, 100, 250]).map((r) => ({ value: String(r), label: `Within ${r} km` }))

  return (
    <>
      <PageHeader title="Search" description="Find warehouses by any attribute, including staff-only ones." />
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          navigate({ ...query, place, page: 1 })
        }}
      >
        <div className="relative w-72">
          <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="City, area or pincode" className="pl-9" />
        </div>
        {query.place && (
          <NativeSelect
            aria-label="Radius"
            value={String(query.radiusKm ?? catalog.data?.defaultRadiusKm ?? 25)}
            onChange={(v) => navigate({ ...query, radiusKm: Number(v), page: 1 })}
            options={radiusOptions}
          />
        )}
        <Checkbox
          checked={!!query.includeArchived}
          onChange={(includeArchived) => navigate({ ...query, includeArchived, page: 1 })}
          label="Show archived"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside>
          {catalog.status === "error" && !catalog.data ? (
            <ErrorState error={catalog.error} onRetry={catalog.reload} />
          ) : !catalog.data ? (
            <LoadingRows rows={3} />
          ) : (
            <FiltersPanel catalog={catalog.data} query={query} result={result} staffTags onChange={navigate} />
          )}
        </aside>

        <section className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {loading ? "Searching…" : result ? `${result.total.toLocaleString()} warehouse${result.total === 1 ? "" : "s"}` : ""}
              {result?.radius && !loading && ` within ${result.radius.usedKm} km`}
            </p>
            {mapsEnabled && (
              <div className="flex gap-1 rounded-full bg-muted p-1 text-xs">
                <button
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${view === "list" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
                  onClick={() => setView("list")}
                >
                  <List className="size-3.5" /> List
                </button>
                <button
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${view === "map" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
                  onClick={() => setView("map")}
                >
                  <MapIcon className="size-3.5" /> Map
                </button>
              </div>
            )}
          </div>
          {result?.radius?.message && !loading && (
            <p className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-xs">{result.radius.message}</p>
          )}
          {result && result.dropped.length > 0 && (
            <p className="text-xs text-muted-foreground">Ignored filters that no longer exist: {result.dropped.join(", ")}</p>
          )}

          {showMap && (
            <ResultsMap data={mapData.data ?? null} hrefFor={(p) => `/admin/warehouses/${p.id}`} showArchived={!!query.includeArchived} />
          )}

          {error ? (
            <ErrorState error={error} onRetry={search.reload} />
          ) : loading && !result ? (
            <LoadingRows />
          ) : result && result.results.length === 0 ? (
            <EmptyState title="No warehouses" body="Nothing matches these filters." />
          ) : (
            result && (
              <div className={cn("flex flex-col gap-3", loading && "opacity-60")}>
                <div className="overflow-x-auto rounded-2xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Area</TableHead>
                        <TableHead>Rent</TableHead>
                        {result.radius && <TableHead className="text-right">Distance</TableHead>}
                        {columns.map((c) => (
                          <TableHead key={c.key}>{itemName(c)}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.results.map((w) => (
                        <TableRow key={w.id} className="cursor-pointer" onClick={() => router.push(`/admin/warehouses/${w.id}`)}>
                          <TableCell className="font-medium">
                            <Link href={`/admin/warehouses/${w.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                              {w.name || "Untitled warehouse"}
                            </Link>
                            <span className="ml-2 font-mono text-[11px] text-muted-foreground">{w.shortId}</span>
                          </TableCell>
                          <TableCell>{[w.locality, w.city].filter(Boolean).join(", ") || "—"}</TableCell>
                          <TableCell>
                            {w.status === "archived" ? (
                              <Badge className="border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400">Archived</Badge>
                            ) : (
                              <Badge className="border-transparent bg-green-500/10 text-green-700 dark:text-green-400">Live</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{w.totalSqm ? formatAreaSqft(w.totalSqm) : "—"}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatRate(w.rate)}</TableCell>
                          {result.radius && <TableCell className="text-right tabular-nums">{w.distKm !== null ? `${w.distKm} km` : "—"}</TableCell>}
                          {columns.map((c) => {
                            const v = cardValue(c, w)
                            return (
                              <TableCell key={c.key} className={cn("whitespace-nowrap", (v === "Unknown" || v === "—") && "text-muted-foreground")}>
                                {v}
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Pager page={result.page} pages={result.pages} total={result.total} onPage={(page) => navigate({ ...query, page })} />
              </div>
            )
          )}
        </section>
      </div>
    </>
  )
}
