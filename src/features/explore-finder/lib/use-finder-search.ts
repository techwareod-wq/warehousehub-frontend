"use client"

import { useEffect, useState } from "react"
import { browserApi } from "@/core/api"
import { finderApi } from "../api/finder.api"
import { EMPTY_FILTERS, type FinderFilters, type FinderSearchResult } from "../entities/finder.entity"

const api = finderApi(browserApi)
const DEBOUNCE_MS = 300

interface Settled {
  key: string
  /** The place the result is for ("" = every live warehouse). */
  place: string
  /** EXPLORE-FILTERS: place + radius the result is for; the camera refits only when this changes. */
  scope: string
  result?: FinderSearchResult
  error?: unknown
}

/** How many filters narrow the search (place included; sort and radius are not filters). */
export function activeFilterCount(f: FinderFilters): number {
  return (
    (f.place ? 1 : 0) +
    (f.amount !== null ? 1 : 0) +
    (f.type ? 1 : 0) +
    (f.nearPort ? 1 : 0) +
    (f.nearAirport ? 1 : 0) +
    (f.nearRail ? 1 : 0) +
    f.features.length
  )
}

/** EXPLORE-FILTERS: radius only matters around a place. */
function scopeOf(f: FinderFilters): string {
  return f.place ? `${f.place}|${f.radiusKm}` : ""
}

/**
 * Filters plus POST /v1/public/finder/search: runs at once, then again after a
 * short pause on any change; a newer search aborts the one in flight. Place is
 * optional (empty = every live warehouse). The previous result stays until the
 * next one lands, so the list and the map never blank while loading.
 */
export function useFinderSearch(initialPlace = "") {
  const [filters, setFilters] = useState<FinderFilters>(() => ({ ...EMPTY_FILTERS, place: initialPlace }))
  const [debounced, setDebounced] = useState<FinderFilters>(filters)
  const [retry, setRetry] = useState(0)
  const [settled, setSettled] = useState<Settled | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(filters), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [filters])

  useEffect(() => {
    const key = JSON.stringify([debounced, retry])
    const place = debounced.place
    const scope = scopeOf(debounced) // EXPLORE-FILTERS
    const ctrl = new AbortController()
    api.search(debounced, ctrl.signal).then(
      (result) => setSettled({ key, place, scope, result }), // EXPLORE-FILTERS: + scope
      (error: unknown) => {
        if (!ctrl.signal.aborted) setSettled((s) => ({ key, place: s?.place ?? "", scope: s?.scope ?? "", result: s?.result, error })) // EXPLORE-FILTERS: + scope
      },
    )
    return () => ctrl.abort()
  }, [debounced, retry])

  const loading = settled?.key !== JSON.stringify([filters, retry])
  return {
    filters,
    loading,
    error: !loading ? settled?.error : undefined,
    /** The latest result (kept while a newer search loads); null only before the first one. */
    result: settled?.result ?? null,
    /** The place `result` is for. */
    resultPlace: settled?.place ?? "",
    /** EXPLORE-FILTERS: the place + radius `result` is for (null before the first result). */
    resultScope: settled?.scope ?? null,
    change: (patch: Partial<FinderFilters>) => setFilters((f) => ({ ...f, ...patch })),
    /** EXPLORE-FILTERS: resets every filter, place included (it is counted as one); keeps the sort. */
    clear: () => setFilters((f) => ({ ...EMPTY_FILTERS, sort: f.sort })),
    retry: () => setRetry((r) => r + 1),
  }
}

export const finderCities = () => api.cities()
