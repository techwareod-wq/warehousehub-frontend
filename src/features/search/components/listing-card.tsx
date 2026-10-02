import Link from "next/link"
import { MapPin, Ruler, ShieldQuestion, Warehouse } from "lucide-react"
import { Badge } from "@/components/ui"
import { formatAreaSqft, formatNumber } from "@/lib/format"
import type { ListingCard } from "../entities/search.entity"
import { formatRate } from "../lib/rate"

export function ListingCardView({ card, industryNames }: { card: ListingCard; industryNames?: Record<string, string> }) {
  const place = [card.locality, card.city].filter(Boolean).join(", ")
  return (
    <Link
      href={`/warehouses/${card.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md sm:flex-row"
    >
      <div className="relative aspect-[16/10] w-full shrink-0 bg-muted sm:aspect-auto sm:h-auto sm:w-56">
        {card.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.coverUrl} alt={card.name} className="absolute inset-0 size-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <Warehouse className="size-8" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading text-base font-semibold leading-snug group-hover:underline">{card.name}</h3>
          {card.unverified && (
            <Badge variant="outline" className="shrink-0">
              <ShieldQuestion />
              Unverified fit
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {place && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {place}
              {card.distKm !== null && ` · ${formatNumber(card.distKm, 1)} km`}
            </span>
          )}
          {card.totalSqm > 0 && (
            <span className="inline-flex items-center gap-1">
              <Ruler className="size-3.5" />
              {formatAreaSqft(card.totalSqm)}
            </span>
          )}
        </div>
        <p className="text-sm font-medium">{formatRate(card.rate)}</p>
        {card.industries.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {card.industries.slice(0, 5).map((i) => (
              <Badge key={i} variant="secondary">
                {industryNames?.[i] ?? i}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
