"use client"

import { MapPin } from "lucide-react"
import { Skeleton } from "@/components/ui"

/** A loading placeholder shaped like a FinderCard. */
export function CardSkeleton() {
  return (
    <div className="glass flex flex-col gap-3 rounded-2xl p-3">
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="aspect-[4/3] w-full rounded-xl" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-3/4" />
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
      <Skeleton className="h-5 w-full" />
    </div>
  )
}

export function Notice({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center">
      <MapPin className="size-6 text-[#F5B82E]" />
      <p className="text-sm font-medium text-white">{title}</p>
      {body && <p className="max-w-sm text-xs text-muted-foreground">{body}</p>}
      {action}
    </div>
  )
}
