"use client"

import { useCallback, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

/**
 * Reads list filters from the URL and writes them back (so filters survive
 * reloads and links). Empty values are removed; any change but `page`
 * resets the page.
 */
export function useUrlState<K extends string>(keys: readonly K[]): [Record<K, string>, (patch: Partial<Record<K | "page", string>>) => void, number] {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const s = params.toString()

  const values = useMemo(() => {
    const p = new URLSearchParams(s)
    return Object.fromEntries(keys.map((k) => [k, p.get(k) ?? ""])) as Record<K, string>
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s])
  const page = Math.max(1, Number(new URLSearchParams(s).get("page")) || 1)

  const set = useCallback(
    (patch: Partial<Record<K | "page", string>>) => {
      const p = new URLSearchParams(s)
      for (const [k, v] of Object.entries(patch) as [string, string | undefined][]) {
        if (v) p.set(k, v)
        else p.delete(k)
      }
      if (!("page" in patch)) p.delete("page")
      const q = p.toString()
      router.replace(`${pathname}${q ? `?${q}` : ""}`, { scroll: false })
    },
    [s, router, pathname],
  )
  return [values, set, page]
}
