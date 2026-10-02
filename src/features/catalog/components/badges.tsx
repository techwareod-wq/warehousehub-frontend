import { Badge } from "@/components/ui"
import { cn } from "@/lib/utils"
import type { RevisionState, Verdict, WarehouseStatus } from "../entities/catalog.entity"

const WAREHOUSE: Record<WarehouseStatus, { label: string; className: string }> = {
  unpublished: { label: "Unpublished", className: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300" },
  live: { label: "Live", className: "bg-green-500/10 text-green-700 dark:text-green-400" },
  archived: { label: "Archived", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
}

const REVISION: Record<RevisionState, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  in_review: { label: "In review", className: "bg-violet-500/10 text-violet-700 dark:text-violet-400" },
  approved: { label: "Approved", className: "bg-green-500/10 text-green-700 dark:text-green-400" },
  superseded: { label: "Superseded", className: "bg-zinc-500/10 text-zinc-600" },
  discarded: { label: "Discarded", className: "bg-zinc-500/10 text-zinc-500 line-through" },
}

export const VERDICTS: Record<Verdict, { label: string; className: string }> = {
  F: { label: "Fit", className: "bg-green-500/10 text-green-700 dark:text-green-400" },
  P: { label: "Partial", className: "bg-lime-500/10 text-lime-700 dark:text-lime-400" },
  U: { label: "Unverified", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  N: { label: "Not fit", className: "bg-zinc-500/10 text-zinc-500" },
}

export function WarehouseStatusBadge({ status }: { status: WarehouseStatus }) {
  const s = WAREHOUSE[status] ?? { label: status, className: "" }
  return <Badge className={cn("border-transparent", s.className)}>{s.label}</Badge>
}

export function RevisionStateBadge({ state }: { state: RevisionState }) {
  const s = REVISION[state] ?? { label: state, className: "" }
  return <Badge className={cn("border-transparent", s.className)}>{s.label}</Badge>
}

export function VerdictBadge({ verdict, label }: { verdict: Verdict; label: string }) {
  const s = VERDICTS[verdict] ?? VERDICTS.N
  return (
    <Badge className={cn("border-transparent", s.className)}>
      {label}: {s.label}
    </Badge>
  )
}
