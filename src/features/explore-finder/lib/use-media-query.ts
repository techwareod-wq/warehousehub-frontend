"use client"

// EXPLORE-FILTERS: picks layout pieces that CSS alone can't (which filters UI to mount, the drawer's side).

import { useSyncExternalStore } from "react"

/** Whether `query` matches (false on the server and in the first client render). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
