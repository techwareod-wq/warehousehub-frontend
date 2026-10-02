"use client"

import { Button } from "@/components/ui"

/** 1-based pager for the paginated lists. */
export function Pager({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (page: number) => void }) {
  if (total === 0) return null
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <span className="text-xs tabular-nums text-muted-foreground">
        Page {page} of {pages} · {total.toLocaleString()} total
      </span>
      <div className="flex gap-1.5">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  )
}
