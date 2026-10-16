"use client"

import { useCallback, useSyncExternalStore } from "react"

const EVENT = "explore-finder:session-flag"
/** Fallback when sessionStorage is blocked: remembered until a reload. */
const memory = new Map<string, boolean>()

function read(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === "1"
  } catch {
    return memory.get(key) ?? false
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange)
  return () => window.removeEventListener(EVENT, onChange)
}

/** A boolean remembered for the browser session (false on the server). */
export function useSessionFlag(key: string): [boolean, (v: boolean) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => false,
  )
  const set = useCallback(
    (v: boolean) => {
      memory.set(key, v)
      try {
        window.sessionStorage.setItem(key, v ? "1" : "0")
      } catch {
        // Storage blocked: the flag just won't survive a reload.
      }
      window.dispatchEvent(new Event(EVENT))
    },
    [key],
  )
  return [value, set]
}
