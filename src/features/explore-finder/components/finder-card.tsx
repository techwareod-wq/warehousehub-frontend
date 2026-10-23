"use client"

// EXPLORE-FILTERS: redesigned card. Location map left (or on top when narrow), details right;
// the whole card opens the quick-view popup and nothing in it navigates.

import { forwardRef } from "react"
import { MapPin } from "lucide-react"
import { formatRate } from "@/features/search"
import { formatNumber } from "@/lib/format"
import { typeBadge, wtAttr } from "@/lib/warehouse-type"
import { TYPE_LABELS, type FinderWarehouse } from "../entities/finder.entity"
import { MapThumb } from "./map-thumb"

const DASH = "-"
const MAX_TAGS = 3

/** The four spec values, "-" when missing (shared with the quick view). */
export function specsOf(w: FinderWarehouse): { label: string; value: string }[] {
  return [
    { label: "Capacity", value: w.totalSqft > 0 ? `${formatNumber(w.totalSqft)} sqft` : DASH },
    { label: "Height", value: w.clearHeight ? `${formatNumber(w.clearHeight.value, 1)} ${w.clearHeight.unit}` : DASH },
    { label: "Docks", value: w.dockDoors !== null ? formatNumber(w.dockDoors) : DASH },
    { label: "Hold cap. (MT)", value: w.holdCapacityMt !== null ? formatNumber(w.holdCapacityMt) : DASH },
  ]
}

export const placeOf = (w: FinderWarehouse) => [w.locality, w.city].filter(Boolean).join(", ")
export const distanceOf = (w: FinderWarehouse) => (w.distKm !== null ? `${formatNumber(w.distKm, w.distKm < 10 ? 1 : 0)} km away` : "")
/** "On request" when there is no published rent. */
export const rentOf = (w: FinderWarehouse) => (w.rate && !w.rate.onRequest ? formatRate(w.rate) : "On request")

export function SpecGrid({ w }: { w: FinderWarehouse }) {
  return (
    <dl className="grid grid-cols-2 gap-2">
      {specsOf(w).map((s) => (
        <div key={s.label} className="flex min-w-0 flex-col gap-0.5 rounded-xl bg-white/[0.04] px-3 py-2">
          <dt className="truncate text-xs font-medium tracking-[0.08em] text-white/65 uppercase">{s.label}</dt>
          <dd className="truncate text-[15px] font-semibold text-white tabular-nums">{s.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * A finder result. A click (or Enter / Space) selects it: Explore flies the map to
 * its pin and the quick view opens. Hover highlights its pin.
 */
export const FinderCard = forwardRef<
  HTMLElement,
  { w: FinderWarehouse; active: boolean; onHover: (shortId: string | null) => void; onSelect: (shortId: string) => void }
>(function FinderCard({ w, active, onHover, onSelect }, ref) {
  const type = TYPE_LABELS[w.type]
  const place = placeOf(w)
  const distance = distanceOf(w)
  const extra = w.tags.length - MAX_TAGS
  return (
    <article
      ref={ref}
      tabIndex={0}
      aria-label={`${w.name}: open quick view`}
      aria-current={active || undefined}
      data-active={active}
      onClick={() => onSelect(w.shortId)}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault()
          onSelect(w.shortId)
        }
      }}
      onMouseEnter={() => onHover(w.shortId)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(w.shortId)}
      onBlur={() => onHover(null)}
      className="xf-card @container scroll-mt-4 overflow-hidden rounded-3xl text-left"
    >
      <div className="flex flex-col @min-[440px]:flex-row">
        <MapThumb
          point={w.loc}
          type={w.type}
          className="aspect-[2.2/1] w-full shrink-0 rounded-none border-0 @min-[440px]:aspect-auto @min-[440px]:min-h-[232px] @min-[440px]:w-[36%]"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
          <div className="flex items-center gap-2">
            {type && (
              <span data-wt={wtAttr(w.type)} className={typeBadge(w.type)}>
                {type}
              </span>
            )}
            <span className="font-mono text-xs font-medium tracking-wider text-white/60 uppercase">{w.shortId}</span>
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="line-clamp-2 text-base leading-snug font-bold text-white">{w.name}</h3>
            {(place || distance) && (
              <p className="flex min-w-0 items-center gap-1 text-[13px] text-white/65">
                <MapPin aria-hidden className="size-3.5 shrink-0" />
                <span className="truncate">{[place, distance].filter(Boolean).join(" · ")}</span>
              </p>
            )}
          </div>
          <SpecGrid w={w} />
          <div className="flex flex-col gap-2.5 border-t border-white/10 pt-3">
            {w.tags.length > 0 && (
              <ul aria-label="Features" className="scrollbar-none flex gap-1.5 overflow-x-auto">
                {w.tags.slice(0, MAX_TAGS).map((t) => (
                  <li key={t} className="shrink-0 rounded-full bg-white/8 px-2.5 py-0.5 text-xs whitespace-nowrap text-white/85">
                    {t}
                  </li>
                ))}
                {extra > 0 && (
                  <li className="shrink-0 rounded-full bg-white/8 px-2.5 py-0.5 text-xs whitespace-nowrap text-white/65" title={w.tags.slice(MAX_TAGS).join(", ")}>
                    +{extra}
                  </li>
                )}
              </ul>
            )}
            <div className="flex items-center justify-between gap-3">
              <span className="text-[15px] font-bold text-[#60a5fa]">{rentOf(w)}</span>
              {/* The card itself opens the quick view; this is its visible affordance, not a separate tab stop. */}
              <span aria-hidden className="xf-pill inline-flex h-8 shrink-0 items-center rounded-full px-3.5 text-[13px] font-semibold">
                Details
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
})
