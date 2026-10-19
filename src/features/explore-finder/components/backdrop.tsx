"use client"

// EXPLORE-FILTERS: the navy page behind the split layout, with soft glows for the glass to blur.

import "../explore-finder.css"
import { cn } from "@/lib/utils"

export function FinderBackdrop({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden
      className={cn("xf-backdrop absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none", !active && "opacity-0")}
    />
  )
}
