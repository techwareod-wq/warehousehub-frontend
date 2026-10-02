"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type LoadState<T> =
  | { status: "loading"; data?: T; error?: undefined }
  | { status: "ready"; data: T; error?: undefined }
  | { status: "error"; data?: T; error: unknown }

interface Settled<T> {
  key: string
  data?: T
  error?: unknown
  failed: boolean
}

/**
 * Runs `load` on mount and whenever `deps` change; `reload()` re-runs it.
 * A stale answer (deps changed meanwhile) is dropped. Previous data is kept
 * while reloading so tables don't flash empty.
 */
export function useLoad<T>(load: () => Promise<T>, deps: readonly unknown[]): LoadState<T> & { reload: () => void } {
  const [tick, setTick] = useState(0)
  const [settled, setSettled] = useState<Settled<T> | null>(null)
  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  })
  const key = JSON.stringify([...deps, tick])

  useEffect(() => {
    let live = true
    loadRef.current().then(
      (data) => live && setSettled({ key, data, failed: false }),
      (error: unknown) => live && setSettled((s) => ({ key, data: s?.data, error, failed: true })),
    )
    return () => {
      live = false
    }
  }, [key])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  let state: LoadState<T>
  if (!settled || settled.key !== key) state = { status: "loading", data: settled?.data }
  else if (settled.failed) state = { status: "error", data: settled.data, error: settled.error }
  else state = { status: "ready", data: settled.data as T }
  return { ...state, reload }
}
