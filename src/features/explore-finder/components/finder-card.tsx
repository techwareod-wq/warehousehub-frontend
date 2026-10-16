"use client"

import { forwardRef } from "react"
import Link from "next/link"
import { MapPin } from "lucide-react"
import { formatRate } from "@/features/search"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { TYPE_LABELS, type FinderWarehouse } from "../entities/finder.entity"
import { MapThumb } from "./map-thumb"

const DASH = "-"

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-white/5 py-1 last:border-0">
      <dt className="text-[11px] text-white/55">{label}</dt>
      <dd className="text-right text-sm font-medium text-white tabular-nums">{value}</dd>
    </div>
  )
}

/**
 * A finder result: map thumbnail on the left, key numbers on the right, tags / distance / rate below.
 * Without `onSelect` the whole card links to the listing; with it, a click selects the card
 * (Explore flies the map to its pin) and a "View details" link opens the listing.
 */
export const FinderCard = forwardRef<
  HTMLElement,
  { w: FinderWarehouse; active: boolean; onHover: (shortId: string | null) => void; onSelect?: (shortId: string) => void }
>(function FinderCard({ w, active, onHover, onSelect }, ref) {
  const place = [w.locality, w.city].filter(Boolean).join(", ")
  const type = TYPE_LABELS[w.type]
  const extra = w.tags.length - 2
  const href = `/warehouses/${w.slug}`
  const shared = {
    title: w.name,
    onMouseEnter: () => onHover(w.shortId),
    onMouseLeave: () => onHover(null),
    onFocus: () => onHover(w.shortId),
    onBlur: () => onHover(null),
    className: cn(
      "glass flex scroll-mt-4 flex-col gap-3 rounded-2xl p-3 outline-offset-4 transition-[border-color,box-shadow]",
      onSelect && "cursor-pointer",
      active ? "border-[#F5B82E]! shadow-[0_0_0_1px_#F5B82E,0_8px_30px_-8px_rgb(245_184_46/40%)]" : "hover:border-white/25!",
    ),
  }
  const body = (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold tracking-[0.18em] text-white/50 uppercase">Location in map</span>
          <MapThumb point={w.loc} className="aspect-[4/3] w-full" />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="self-start rounded-md border border-[#F5B82E]/40 bg-[#F5B82E]/15 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-[#F5B82E] uppercase">
            {w.shortId}
          </span>
          {(place || type) && (
            <p className="flex min-w-0 items-center gap-1 text-xs text-white/70">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{place}</span>
              {type && <span className="shrink-0 text-[11px] font-semibold text-[#F5B82E]">· {type}</span>}
            </p>
          )}
          <dl className="mt-0.5 flex flex-col">
            <Row label="Capacity" value={w.totalSqft > 0 ? `${formatNumber(w.totalSqft)} sqft` : DASH} />
            <Row label="Height" value={w.clearHeight ? `${formatNumber(w.clearHeight.value, 1)} ${w.clearHeight.unit}` : DASH} />
            <Row label="Docks" value={w.dockDoors !== null ? formatNumber(w.dockDoors) : DASH} />
            <Row label="Hold cap." value={w.holdCapacityMt !== null ? `${formatNumber(w.holdCapacityMt)} MT` : DASH} />
          </dl>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/10 pt-2.5">
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {w.tags.slice(0, 2).map((t) => (
            <span key={t} className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] text-white/80">
              {t}
            </span>
          ))}
          {extra > 0 && (
            <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-white/60" title={w.tags.slice(2).join(", ")}>
              +{extra}
            </span>
          )}
        </div>
        {w.distKm !== null && (
          <span className="text-xs text-white/60 tabular-nums">{`${formatNumber(w.distKm, w.distKm < 10 ? 1 : 0)} km`}</span>
        )}
        <span className="font-heading text-sm font-semibold text-[#F5B82E]">{formatRate(w.rate)}</span>
      </div>
      {onSelect && (
        <Link
          href={href}
          onClick={(e) => e.stopPropagation()}
          className="-mt-1 self-end text-xs font-medium text-[#F5B82E] underline-offset-4 hover:underline"
        >
          View details →
        </Link>
      )}
    </>
  )

  if (!onSelect) {
    return (
      <Link ref={ref as React.Ref<HTMLAnchorElement>} href={href} aria-label={w.name} {...shared}>
        {body}
      </Link>
    )
  }
  return (
    <article
      ref={ref}
      tabIndex={0}
      aria-label={w.name}
      aria-current={active || undefined}
      onClick={() => onSelect(w.shortId)}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault()
          onSelect(w.shortId)
        }
      }}
      {...shared}
    >
      {body}
    </article>
  )
})
