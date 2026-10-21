"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { EXAMPLES, ROTATE_MS } from "./examples"

const REDUCED = "(prefers-reduced-motion: reduce)"

function subscribe(cb: () => void) {
  const mq = window.matchMedia(REDUCED)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}

/** Whether the visitor asked for less motion (false on the server). */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  )
}

/**
 * The example to show and the one fading out. Advances every ROTATE_MS
 * while `running`; with reduced motion it stays on the first example.
 */
export function useRotatingExample(running: boolean) {
  const reduced = useReducedMotion()
  // Steps taken so far: the shown example is tick % n, the outgoing one the step before.
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!running || reduced) return
    const id = window.setInterval(() => setTick((t) => t + 1), ROTATE_MS)
    return () => window.clearInterval(id)
  }, [running, reduced])

  if (reduced) return { current: EXAMPLES[0], previous: null, tick: 0 }
  const n = EXAMPLES.length
  return { current: EXAMPLES[tick % n], previous: tick > 0 ? EXAMPLES[(tick - 1) % n] : null, tick }
}
