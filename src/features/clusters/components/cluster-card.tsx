import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Cluster } from "../entities/clusters.entity"

function rupees(v: number): string {
  return `₹${formatNumber(v, v % 1 === 0 ? 0 : 1)}`
}

/** "₹18 – ₹32 / sq ft / month", "From ₹24 / sq ft / month", "Rent on request". */
export function formatRateRange(min: number | null, max: number | null): string {
  if (min === null || max === null) return "Rent on request"
  if (min === max) return `From ${rupees(min)} / sq ft / month`
  return `${rupees(min)} – ${rupees(max)} / sq ft / month`
}

/** A featured-cluster tile: tall photo panel, name up top, listing count down the side. */
export function ClusterCard({ cluster, className }: { cluster: Cluster; className?: string }) {
  const place = cluster.name !== cluster.city ? cluster.city : ""
  const hubs = cluster.subHubs.slice(0, 3)
  const moreHubs = cluster.subHubs.length - hubs.length
  const href = `/search?${new URLSearchParams({ q: cluster.searchPlace })}`
  return (
    <Link
      href={href}
      className={cn("group relative block overflow-hidden bg-site-ink outline-offset-[-4px]", className)}
      aria-label={`${cluster.name}${place ? `, ${place}` : ""}: ${cluster.listings} listing${cluster.listings === 1 ? "" : "s"}, ${formatRateRange(cluster.rateMin, cluster.rateMax)}`}
    >
      <div className="aspect-[5/4] overflow-hidden sm:aspect-[3/4]">
        {cluster.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cluster.coverUrl}
            alt=""
            loading="lazy"
            className="size-full object-cover opacity-80 brightness-90 transition-[transform,opacity] duration-700 group-hover:scale-105 group-hover:opacity-100"
          />
        ) : (
          // Placeholder until listings carry photos: a dusk gradient with a faint bay grid.
          <div
            aria-hidden
            className="size-full bg-[linear-gradient(160deg,#1d4256_0%,#0d2533_55%,#07131d_100%)] transition-transform duration-700 group-hover:scale-105"
          >
            <div className="size-full bg-[linear-gradient(rgb(255_255_255/5%)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/5%)_1px,transparent_1px)] bg-[size:36px_36px]" />
          </div>
        )}
      </div>
      <div aria-hidden className="absolute inset-0 bg-black/40 transition-colors duration-500 group-hover:bg-black/20" />

      <div className="absolute inset-x-6 top-6">
        <h3 className="font-heading text-3xl leading-none font-bold tracking-tight text-white uppercase">{cluster.name}</h3>
        {place && <p className="mt-2 text-[11px] font-medium tracking-wide text-white/80 uppercase">{place}</p>}
        <p className="mt-2 text-xs font-bold text-site-cyan">{formatRateRange(cluster.rateMin, cluster.rateMax)}</p>
        {hubs.length > 0 && (
          <p className="mt-3 text-xs leading-relaxed text-white/75">
            {hubs.join(" · ")}
            {moreHubs > 0 && ` · +${moreHubs} more`}
          </p>
        )}
      </div>

      <div className="absolute bottom-6 left-6 flex items-end gap-3">
        <span className="text-[10px] tracking-[0.2em] text-white/80 uppercase [writing-mode:vertical-rl] rotate-180">Listings</span>
        <span className="font-heading text-5xl leading-none font-bold text-white">{cluster.listings}</span>
      </div>
      <span
        aria-hidden
        className="absolute right-6 bottom-6 flex size-10 items-center justify-center rounded-full border border-white/40 text-white backdrop-blur-md transition-colors group-hover:bg-white group-hover:text-site-ink"
      >
        <ArrowUpRight className="size-4" />
      </span>
    </Link>
  )
}
