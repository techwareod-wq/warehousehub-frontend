"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react"
import { Badge, Button } from "@/components/ui"
import { ConfirmDialog, EmptyState, ErrorState, JsonDiff, LoadingRows, PageHeader, Pager } from "@/components/common"
import { browserApi, errorMessage } from "@/core/api"
import { useLoad } from "@/core/hooks/use-load"
import { useAccess } from "@/features/access"
import { formatDateTime } from "@/lib/format"
import { catalogApi } from "../api/catalog.api"
import type { Revision } from "../entities/catalog.entity"
import { listingAddress, listingName } from "../lib/content"

const api = catalogApi(browserApi)

function DiffRow({ revision }: { revision: Revision }) {
  const live = useLoad(() => api.detail(revision.warehouseId).then((d) => d.warehouse.live), [revision.warehouseId])
  if (live.status === "error") return <p className="text-xs text-destructive">{errorMessage(live.error)}</p>
  if (live.status === "loading") return <LoadingRows rows={2} />
  return <JsonDiff before={live.data ?? {}} after={revision.content} emptyLabel="No changes from the live copy." />
}

/** Revisions waiting for approval, grouped by bulk batch, with a diff against live. */
export function ReviewQueue() {
  const access = useAccess()
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<Revision | null>(null)
  const [busy, setBusy] = useState(false)
  const queue = useLoad(() => api.queue(page), [page])

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true)
    try {
      await fn()
      toast.success(msg)
      setSelected(new Set())
      queue.reload()
      return true
    } catch (err) {
      toast.error(errorMessage(err))
      return false
    } finally {
      setBusy(false)
    }
  }

  const bulk = async () => {
    setBusy(true)
    try {
      const res = await api.bulkApprove(Array.from(selected))
      const failed = res.items.filter((i) => !i.ok)
      if (failed.length === 0) toast.success(`Approved ${res.items.length}`)
      else toast.error(`${res.items.length - failed.length} approved, ${failed.length} failed: ${failed.map((f) => f.error || f.code).join("; ")}`)
      setSelected(new Set())
      queue.reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const items = queue.data?.items ?? []
  const groups = new Map<string, Revision[]>()
  for (const r of items) {
    const k = r.batchId || ""
    groups.set(k, [...(groups.get(k) ?? []), r])
  }

  return (
    <>
      <PageHeader
        title="Review queue"
        description="Drafts submitted for approval. Approving publishes the change."
        actions={
          access.can.approver &&
          selected.size > 0 && (
            <Button disabled={busy} onClick={bulk}>
              Approve {selected.size} selected
            </Button>
          )
        }
      />
      {queue.status === "error" && !queue.data ? (
        <ErrorState error={queue.error} onRetry={queue.reload} />
      ) : !queue.data ? (
        <LoadingRows />
      ) : items.length === 0 ? (
        <EmptyState title="Nothing to review" body="Submitted drafts show up here." />
      ) : (
        <div className="flex flex-col gap-5">
          {Array.from(groups.entries()).map(([batch, revs]) => (
            <section key={batch || "single"} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-medium text-muted-foreground">
                  {batch ? `Bulk batch ${batch.slice(-6)} · ${revs.length} listing${revs.length === 1 ? "" : "s"}` : "Individual submissions"}
                </h2>
                {access.can.approver && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() =>
                      setSelected((s) => {
                        const next = new Set(s)
                        const all = revs.every((r) => next.has(r.id))
                        revs.forEach((r) => (all ? next.delete(r.id) : next.add(r.id)))
                        return next
                      })
                    }
                  >
                    Select group
                  </Button>
                )}
              </div>
              <ul className="flex flex-col gap-2">
                {revs.map((r) => {
                  const city = listingAddress(r.content).city
                  return (
                    <li key={r.id} className="flex flex-col gap-3 rounded-2xl border border-border p-3">
                      <div className="flex flex-wrap items-center gap-3">
                        {access.can.approver && (
                          <input
                            type="checkbox"
                            className="size-4 accent-primary"
                            checked={selected.has(r.id)}
                            onChange={(e) =>
                              setSelected((s) => {
                                const next = new Set(s)
                                if (e.target.checked) next.add(r.id)
                                else next.delete(r.id)
                                return next
                              })
                            }
                          />
                        )}
                        <button className="flex items-center gap-1 text-left" onClick={() => setOpen(open === r.id ? null : r.id)}>
                          {open === r.id ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                          <span className="font-medium">{listingName(r.content)}</span>
                        </button>
                        {city && <span className="text-sm text-muted-foreground">{city}</span>}
                        <Badge variant="outline">{r.baseVersion === 0 ? "New listing" : `Update to v${r.baseVersion}`}</Badge>
                        <span className="text-xs text-muted-foreground">
                          by {r.submittedBy || r.createdBy} · {formatDateTime(r.submittedAt)}
                        </span>
                        <div className="ml-auto flex gap-1.5">
                          <Link href={`/admin/warehouses/${r.warehouseId}`} className="inline-flex items-center gap-1 px-2 text-xs text-muted-foreground hover:text-foreground">
                            Open <ExternalLink className="size-3" />
                          </Link>
                          {access.can.approver && (
                            <>
                              <Button size="sm" variant="outline" disabled={busy} onClick={() => setRejecting(r)}>
                                Reject
                              </Button>
                              <Button size="sm" disabled={busy} onClick={() => act(() => api.approve(r.id), "Approved — it's live")}>
                                Approve
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      {open === r.id && <DiffRow revision={r} />}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
          <Pager page={queue.data.page} pages={queue.data.pages} total={queue.data.total} onPage={setPage} />
        </div>
      )}
      <ConfirmDialog
        open={!!rejecting}
        onOpenChange={(o) => !o && setRejecting(null)}
        title="Send back to the editor?"
        withComment
        commentRequired
        commentPlaceholder="What needs fixing?"
        confirmLabel="Reject"
        pending={busy}
        onConfirm={async (comment) => {
          if (rejecting && (await act(() => api.reject(rejecting.id, comment), "Sent back"))) setRejecting(null)
        }}
      />
    </>
  )
}
