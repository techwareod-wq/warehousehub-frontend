"use client"

import { useState } from "react"
import { Button } from "@/components/ui"
import { JsonDiff } from "@/components/common"
import { formatDateTime } from "@/lib/format"
import type { ListingContent, Revision } from "../entities/catalog.entity"
import { RevisionStateBadge } from "./badges"

/** Every revision with its review trail; compare any of them with the live copy. */
export function HistoryPanel({ history, live }: { history: Revision[]; live: ListingContent | null }) {
  const [open, setOpen] = useState<string | null>(null)
  if (history.length === 0) return <p className="text-sm text-muted-foreground">No revisions yet.</p>
  return (
    <ul className="flex flex-col gap-2">
      {history.map((r) => (
        <li key={r.id} className="flex flex-col gap-2 rounded-2xl border border-border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Version {r.version}</span>
              <RevisionStateBadge state={r.state} />
              {r.batchId && <span className="font-mono text-[11px] text-muted-foreground">batch {r.batchId.slice(-6)}</span>}
            </div>
            <Button size="xs" variant="ghost" onClick={() => setOpen(open === r.id ? null : r.id)}>
              {open === r.id ? "Hide changes" : "Compare with live"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Started by {r.createdBy || "—"} · {formatDateTime(r.createdAt)}
            {r.approvedBy && ` · approved by ${r.approvedBy} ${formatDateTime(r.approvedAt)}`}
          </p>
          {r.review.length > 0 && (
            <ul className="flex flex-col gap-1 text-xs">
              {r.review.map((e, i) => (
                <li key={i}>
                  <span className="font-medium capitalize">{e.action.replace(/_/g, " ")}</span> by {e.by} · {formatDateTime(e.at)}
                  {e.comment && <span className="text-muted-foreground"> — “{e.comment}”</span>}
                </li>
              ))}
            </ul>
          )}
          {open === r.id && <JsonDiff before={live ?? {}} after={r.content} emptyLabel="Same as the live copy." />}
        </li>
      ))}
    </ul>
  )
}
