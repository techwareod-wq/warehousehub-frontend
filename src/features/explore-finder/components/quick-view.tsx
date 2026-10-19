"use client"

// EXPLORE-FILTERS: the quick-view popup a card opens (instead of navigating to the detail page).

import "../explore-finder.css"
import { useEffect, useRef, useState } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { ArrowLeft, ArrowUpRight, MapPin, X } from "lucide-react"
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui"
import { EnquiryForm } from "@/features/enquiries"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { TYPE_LABELS, type FinderFilters, type FinderWarehouse } from "../entities/finder.entity"
import { distanceOf, placeOf, rentOf, SpecGrid } from "./finder-card"
import { LocationMap } from "./location-map"

/** Prefills the enquiry with the searched city and storage need, when set. */
function enquiryMessage(f: FinderFilters): string {
  const lines = [
    f.place && `City: ${f.place}`,
    f.amount !== null && `Storage need: ${formatNumber(f.amount)} ${f.unit === "pallets" ? "pallets" : "sqft"}`,
  ].filter(Boolean)
  return lines.length ? `I'm interested in this warehouse.\n${lines.join("\n")}\n` : ""
}

export const directionsUrl = (w: FinderWarehouse) =>
  w.loc ? `https://www.google.com/maps/dir/?api=1&destination=${w.loc.lat},${w.loc.lng}` : ""

/**
 * A small glass modal (a full-screen sheet on phones) with the warehouse's map,
 * details and actions. "Enquire now" swaps in the enquiry form in place. It is the
 * only detail view: nothing in Explore links to the warehouse page. Focus is trapped and restored, Esc and a
 * backdrop click close it; there is no route change.
 */
export function QuickView({
  w,
  open,
  filters,
  onClose,
}: {
  /** The last opened warehouse (kept while the popup animates out). */
  w: FinderWarehouse | null
  open: boolean
  filters: FinderFilters
  onClose: () => void
}) {
  const [enquiring, setEnquiring] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const backRef = useRef<HTMLButtonElement>(null)
  const enquireRef = useRef<HTMLButtonElement>(null)

  // Each newly opened warehouse starts on its details.
  const [shownFor, setShownFor] = useState<string | null>(null)
  if (open && w && shownFor !== w.shortId) {
    setShownFor(w.shortId)
    setEnquiring(false)
  }

  // Keep focus inside the popup when its content swaps.
  const [swaps, setSwaps] = useState(0)
  useEffect(() => {
    if (!swaps) return
    ;(enquiring ? backRef : enquireRef).current?.focus()
  }, [enquiring, swaps])
  const swap = (to: boolean) => {
    setEnquiring(to)
    setSwaps((n) => n + 1)
  }

  const type = w ? TYPE_LABELS[w.type] : undefined
  const place = w ? placeOf(w) : ""
  const distance = w ? distanceOf(w) : ""

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPortal>
        <DialogOverlay className="bg-[#050a14]/60 backdrop-blur-md supports-backdrop-filter:backdrop-blur-md" />
        <DialogPrimitive.Popup
          initialFocus={closeRef}
          className={cn(
            "dark site xf xf-popover xf-scroll fixed z-50 flex flex-col overflow-y-auto text-white outline-none",
            "top-1/2 left-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-3xl",
            "max-sm:inset-0 max-sm:h-dvh max-sm:max-h-none max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none",
            "duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          )}
        >
          <DialogPrimitive.Close
            ref={closeRef}
            aria-label="Close"
            className="xf-pill xf-glass absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>

          {w &&
            (enquiring ? (
              <div className="flex flex-col gap-4 p-6 pt-5">
                <button
                  ref={backRef}
                  type="button"
                  onClick={() => swap(false)}
                  className="inline-flex items-center gap-1.5 self-start rounded-full py-1 pr-2 text-sm font-medium text-white/75 transition-colors hover:text-white"
                >
                  <ArrowLeft aria-hidden className="size-4" /> Back
                </button>
                <DialogPrimitive.Title className="sr-only">Enquire about {w.name}</DialogPrimitive.Title>
                <p className="-mb-1 pr-10 text-sm text-white/70">
                  <span className="font-semibold text-white">{w.name}</span>
                  <span className="ml-2 font-mono text-xs tracking-wider text-[#f9cc63] uppercase">{w.shortId}</span>
                </p>
                <EnquiryForm
                  key={w.shortId}
                  listingShortId={w.shortId}
                  listingName={w.name}
                  initialMessage={enquiryMessage(filters)}
                  className="flex flex-col gap-4"
                />
              </div>
            ) : (
              <>
                {w.loc ? (
                  <LocationMap point={w.loc} directionsHref={directionsUrl(w)} className="h-[220px] shrink-0" />
                ) : (
                  <div className="flex h-[140px] shrink-0 flex-col items-center justify-center gap-2 bg-white/[0.03] bg-[linear-gradient(rgb(255_255_255/5%)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/5%)_1px,transparent_1px)] bg-[size:20px_20px] text-sm text-white/70">
                    <MapPin aria-hidden className="size-6 text-white/50" />
                    No location on file
                  </div>
                )}
                <div className="flex flex-col gap-5 p-6">
                  <div className="flex flex-col gap-2">
                    <DialogPrimitive.Title className="text-xl leading-snug font-bold text-white">{w.name}</DialogPrimitive.Title>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#F5B82E]/45 bg-[#F5B82E]/15 px-2.5 py-0.5 font-mono text-xs font-semibold tracking-wider text-[#f9cc63] uppercase">
                        {w.shortId}
                      </span>
                      {type && <span className="rounded-full border border-white/15 bg-white/8 px-2.5 py-0.5 text-xs font-semibold text-white/90">{type}</span>}
                    </div>
                    {(place || distance) && (
                      <p className="flex items-center gap-1.5 text-sm text-white/70">
                        <MapPin aria-hidden className="size-4 shrink-0" />
                        {[place, distance].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>

                  <SpecGrid w={w} />

                  <p className="flex items-baseline justify-between gap-3 border-t border-white/10 pt-4">
                    <span className="text-xs font-medium tracking-[0.08em] text-white/65 uppercase">Rent</span>
                    <span className="text-lg font-bold text-[#f9cc63]">{rentOf(w)}</span>
                  </p>

                  {w.tags.length > 0 && (
                    <ul aria-label="Features" className="flex flex-wrap gap-1.5">
                      {w.tags.map((t) => (
                        <li key={t} className="rounded-full bg-white/8 px-3 py-1 text-[13px] whitespace-nowrap text-white/85">
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex flex-col gap-2.5 sm:flex-row">
                    <button
                      ref={enquireRef}
                      type="button"
                      onClick={() => swap(true)}
                      className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-[#F5B82E] px-6 text-sm font-bold tracking-[0.08em] text-[#0a1220] uppercase transition-colors hover:bg-[#f9cc63]"
                    >
                      Enquire now
                    </button>
                    {w.loc && (
                      <a
                        href={directionsUrl(w)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="xf-pill inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-6 text-sm font-bold tracking-[0.08em] uppercase"
                      >
                        Directions <ArrowUpRight aria-hidden className="size-4" />
                      </a>
                    )}
                  </div>
                </div>
              </>
            ))}
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  )
}
