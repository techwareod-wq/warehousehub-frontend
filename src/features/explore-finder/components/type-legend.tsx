import { cn } from "@/lib/utils"
import { TYPE_LABELS } from "../entities/finder.entity"

const ORDER = ["general", "ftwz", "bonded"] as const

/** The map's key for the warehouse type colour code (General blue, FTWZ green, Bonded yellow). */
export function TypeLegend({ className }: { className?: string }) {
  return (
    <ul aria-label="Pin colours" className={cn("xf-glass flex items-center gap-3 rounded-full px-3.5 py-1.5 text-xs font-medium text-white/85", className)}>
      {ORDER.map((t) => (
        <li key={t} className="flex items-center gap-1.5">
          <span aria-hidden data-wt={t} className="wt-dot size-2.5 rounded-full" />
          {TYPE_LABELS[t]}
        </li>
      ))}
    </ul>
  )
}
