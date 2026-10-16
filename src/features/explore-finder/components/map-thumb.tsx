"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LatLng } from "../entities/finder.entity"
import { mapThumbnail } from "../lib/thumbnail"

/** A still map image centred on the warehouse, rendered once the card scrolls near view. */
export function MapThumb({ point, className }: { point: LatLng | null; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [src, setSrc] = useState<{ key: string; url: string } | null>(null)
  const key = point ? `${point.lat},${point.lng}` : ""

  useEffect(() => {
    const el = ref.current
    if (!point || !el) return
    let live = true
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        mapThumbnail(point).then(
          (url) => live && setSrc({ key, url }),
          () => undefined,
        )
      },
      { rootMargin: "200px" },
    )
    io.observe(el)
    return () => {
      live = false
      io.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const url = src?.key === key ? src.url : null
  return (
    <div ref={ref} className={cn("relative overflow-hidden rounded-xl border border-white/10 bg-site-ink", className)}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(rgb(255_255_255/4%)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/4%)_1px,transparent_1px)] bg-[size:16px_16px]"
        />
      )}
      {point ? (
        <MapPin
          aria-hidden
          className="absolute top-1/2 left-1/2 size-7 -translate-x-1/2 -translate-y-full fill-[#F5B82E] text-white drop-shadow-[0_2px_4px_rgb(0_0_0/60%)]"
          strokeWidth={1.5}
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-[11px] text-muted-foreground">No location</span>
      )}
    </div>
  )
}
