"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"
import { errorMessage } from "@/core/api"

/**
 * Wraps a mutation: tracks `pending`, toasts the error (unless `onError`
 * handles it and returns true) and the optional success message.
 */
export function useAction<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  opts: { success?: string | ((r: R) => string); onError?: (err: unknown) => boolean | void } = {},
) {
  const [pending, setPending] = useState(false)
  const run = useCallback(
    async (...args: A): Promise<R | undefined> => {
      setPending(true)
      try {
        const r = await fn(...args)
        if (opts.success) toast.success(typeof opts.success === "function" ? opts.success(r) : opts.success)
        return r
      } catch (err) {
        if (!opts.onError?.(err)) toast.error(errorMessage(err))
        return undefined
      } finally {
        setPending(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn],
  )
  return { run, pending }
}
