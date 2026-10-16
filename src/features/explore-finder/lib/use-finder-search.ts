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
    const ctrl = new AbortController()
    api.search(debounced, ctrl.signal).then(
      (result) => setSettled({ key, place, result }),
      (error: unknown) => {
        if (!ctrl.signal.aborted) setSettled((s) => ({ key, place: s?.place ?? "", result: s?.result, error }))
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
    change: (patch: Partial<FinderFilters>) => setFilters((f) => ({ ...f, ...patch })),
    /** Resets every filter but the place and sort. */
    clear: () => setFilters((f) => ({ ...EMPTY_FILTERS, place: f.place, sort: f.sort })),
    retry: () => setRetry((r) => r + 1),
  }
}

export const finderCities = () => api.cities()
