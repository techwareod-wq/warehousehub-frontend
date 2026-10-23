"use client"

// EXPLORE-FILTERS: glass skeleton and notices.

import { MapPin } from "lucide-react"
import { Skeleton } from "@/components/ui"

/** A loading placeholder shaped like a FinderCard. */
export function CardSkeleton() {
  return (
    <div className="xf-glass flex flex-col gap-4 rounded-3xl p-4">
      <div className="flex gap-4">
        <Skeleton className="h-[148px] w-[148px] shrink-0 rounded-2xl bg-white/8" />
        <div className="flex flex-1 flex-col gap-2.5">
          <Skeleton className="h-5 w-3/4 bg-white/8" />
          <Skeleton className="h-4 w-1/2 bg-white/8" />
          <div className="grid grid-cols-2 gap-3 pt-1">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-9 w-full bg-white/8" />
            ))}
          </div>
        </div>
      </div>
      <Skeleton className="h-6 w-full bg-white/8" />
    </div>
  )
}

export function Notice({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="xf-glass flex flex-col items-center gap-3 rounded-3xl px-6 py-12 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-[#3b82f6]/15">
        <MapPin aria-hidden className="size-5 text-[#60a5fa]" />
      </span>
      <p className="text-base font-semibold text-white">{title}</p>
      {body && <p className="max-w-sm text-sm text-white/70">{body}</p>}
      {action}
    </div>
  )
}
