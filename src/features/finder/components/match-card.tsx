import Link from "next/link"
import { Check, MapPin, Ruler, ShieldQuestion, Warehouse } from "lucide-react"
import { Badge } from "@/components/ui"
import { formatRate } from "@/features/search"
import { formatAreaSqft } from "@/lib/format"
import type { FinderMatch } from "../entities/finder.entity"

/** One finder match, linking to the listing page like the search cards. */
export function MatchCard({ match }: { match: FinderMatch }) {
  const place = [match.locality, match.city].filter(Boolean).join(", ")
  return (
    <Link href={`/warehouses/${match.slug}`} className="glass group flex flex-col overflow-hidden rounded-2xl outline-offset-4">
      <div className="relative aspect-[16/10] w-full bg-muted">
        {match.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={match.coverUrl} alt={match.name} className="absolute inset-0 size-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <Warehouse className="size-8" />
          </div>
        )}
        <div className="absolute top-3 right-3 flex flex-col items-center rounded-2xl bg-site-ink/85 px-3.5 py-2 shadow-lg backdrop-blur-md">
          <span className="font-heading text-3xl leading-none font-black text-site-cyan">{Math.round(match.matchPercent)}%</span>
          <span className="mt-1 text-[9px] font-bold tracking-[0.2em] text-white/70 uppercase">match</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-heading text-xl leading-tight font-bold tracking-tight underline-offset-4 group-hover:underline">{match.name}</h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {place && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {place}
            </span>
          )}
          {match.totalSqm > 0 && (
            <span className="inline-flex items-center gap-1">
              <Ruler className="size-3.5" />
              {formatAreaSqft(match.totalSqm)}
            </span>
          )}
        </div>
        <p className="font-heading text-lg font-semibold text-site-cyan">{formatRate(match.rate)}</p>
        {match.reason && <p className="text-sm text-slate-300/80">{match.reason}</p>}
        {match.matched.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {match.matched.map((m) => (
              <Badge key={m} variant="secondary">
                <Check />
                {m}
              </Badge>
            ))}
          </div>
        )}
        {match.typeUnknown && (
          <p className="inline-flex items-center gap-1 text-xs text-site-amber">
            <ShieldQuestion className="size-3.5" />
            Type not confirmed by owner
          </p>
        )}
      </div>
    </Link>
  )
}
