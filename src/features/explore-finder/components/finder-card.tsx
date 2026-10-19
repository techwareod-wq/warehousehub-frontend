"use client"

// EXPLORE-FILTERS: redesigned glass card (thumbnail | name, pills, 2x2 specs; tags, distance, rate below).

import { forwardRef } from "react"
import Link from "next/link"
import { ArrowRight, MapPin } from "lucide-react"
import { formatRate } from "@/features/search"
import { formatNumber } from "@/lib/format"
import { TYPE_LABELS, type FinderWarehouse } from "../entities/finder.entity"
import { MapThumb } from "./map-thumb"

const DASH = "-"

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-xs tracking-wide text-white/70">{label}</dt>
      <dd className="truncate text-[15px] font-semibold text-white tabular-nums">{value}</dd>
    </div>
  )
}

/**
 * A finder result. Without `onSelect` the whole card links to the listing; with it, a click
 * selects the card (Explore flies the map to its pin) and a small arrow link opens the listing.
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
    "data-active": active,
    onMouseEnter: () => onHover(w.shortId),
    onMouseLeave: () => onHover(null),
    onFocus: () => onHover(w.shortId),
    onBlur: () => onHover(null),
    className: "xf-card @container flex scroll-mt-4 flex-col gap-4 rounded-3xl p-4 text-left",
  }
  const body = (
    <>
      {/* Thumbnail left (narrower on small cards); on top in very narrow cards, e.g. the 2-column grid. */}
      <div className="flex gap-4 @max-[339px]:flex-col">
        <MapThumb
          point={w.loc}
          className="min-h-[148px] w-[148px] shrink-0 rounded-2xl @max-[439px]:min-h-[120px] @max-[439px]:w-[112px] @max-[339px]:aspect-[16/9] @max-[339px]:min-h-0 @max-[339px]:w-full"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="truncate text-base leading-snug font-semibold text-white" title={w.name}>
              {w.name}
            </h3>
            {place && (
              <p className="flex min-w-0 items-center gap-1 text-[13px] text-white/70">
                <MapPin aria-hidden className="size-3.5 shrink-0" />
                <span className="truncate">{place}</span>
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full border border-[#F5B82E]/45 bg-[#F5B82E]/15 px-2.5 py-0.5 font-mono text-xs font-semibold tracking-wider text-[#f9cc63] uppercase">
              {w.shortId}
            </span>
            {type && <span className="rounded-full border border-white/15 bg-white/8 px-2.5 py-0.5 text-xs font-medium text-white/90">{type}</span>}
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            <Spec label="Capacity" value={w.totalSqft > 0 ? `${formatNumber(w.totalSqft)} sqft` : DASH} />
            <Spec label="Height" value={w.clearHeight ? `${formatNumber(w.clearHeight.value, 1)} ${w.clearHeight.unit}` : DASH} />
            <Spec label="Docks" value={w.dockDoors !== null ? formatNumber(w.dockDoors) : DASH} />
            <Spec label="Hold cap." value={w.holdCapacityMt !== null ? `${formatNumber(w.holdCapacityMt)} MT` : DASH} />
          </dl>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/10 pt-3">
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {w.tags.slice(0, 2).map((t) => (
            <span key={t} className="rounded-full bg-white/8 px-2.5 py-0.5 text-xs text-white/85">
              {t}
            </span>
          ))}
          {extra > 0 && (
            <span className="rounded-full bg-white/8 px-2.5 py-0.5 text-xs text-white/70" title={w.tags.slice(2).join(", ")}>
              +{extra}
            </span>
          )}
        </div>
        {w.distKm !== null && (
          <span className="text-[13px] text-white/70 tabular-nums">{`${formatNumber(w.distKm, w.distKm < 10 ? 1 : 0)} km`}</span>
        )}
        <span className="text-[15px] font-bold text-[#f9cc63]">{formatRate(w.rate)}</span>
        {onSelect && (
          <Link
            href={href}
            onClick={(e) => e.stopPropagation()}
            aria-label={`View details for ${w.name}`}
            className="group inline-flex items-center gap-1 rounded-full text-[13px] font-medium text-white/70 transition-colors hover:text-[#f9cc63]"
          >
            View details
            <ArrowRight aria-hidden className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
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
