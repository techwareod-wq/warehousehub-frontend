"use client"

import { useState } from "react"
import { Badge, Button, Input, Sheet, SheetContent, SheetHeader, SheetTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui"
import { EmptyState, ErrorState, JsonDiff, LoadingRows, NativeSelect, PageHeader, Pager } from "@/components/common"
import { browserApi } from "@/core/api"
import { useLoad } from "@/core/hooks/use-load"
import { useUrlState } from "@/core/hooks/use-url-state"
import { formatDateTime } from "@/lib/format"
import { changesApi } from "../api/changes.api"
import { CHANGE_ENTITIES } from "../entities/changes.entity"

const api = changesApi(browserApi)

function Detail({ id }: { id: string }) {
  const d = useLoad(() => api.detail(id), [id])
  if (d.status === "error") return <ErrorState error={d.error} onRetry={d.reload} />
  if (!d.data) return <LoadingRows />
  const e = d.data
  return (
    <div className="flex flex-col gap-3 px-4 pb-6 text-sm">
      <p className="text-xs text-muted-foreground">
        {e.actorEmail} · {formatDateTime(e.at)} · <span className="font-mono">{e.entityId}</span>
      </p>
      {e.meta && <pre className="overflow-auto rounded-xl bg-muted p-3 text-[11px]">{JSON.stringify(e.meta, null, 2)}</pre>}
      <JsonDiff before={e.before ?? {}} after={e.after ?? {}} />
    </div>
  )
}

/** The change log (D-014): who changed what, with a full before/after diff. */
export function ChangeLog() {
  const [f, setF, page] = useUrlState(["entity", "entityId", "actor", "from", "to"] as const)
  const [entityId, setEntityId] = useState(f.entityId)
  const [actor, setActor] = useState(f.actor)
  const [open, setOpen] = useState<string | null>(null)
  const list = useLoad(() => api.list(f, page), [f.entity, f.entityId, f.actor, f.from, f.to, page])

  return (
    <>
      <PageHeader title="Change log" description="Every change to listings, attributes, industries and enquiries — kept forever." />
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          setF({ entityId: entityId.trim(), actor: actor.trim() })
        }}
      >
        <NativeSelect value={f.entity} onChange={(entity) => setF({ entity })} placeholder="Everything" options={CHANGE_ENTITIES} />
        <Input value={entityId} onChange={(e) => setEntityId(e.target.value)} placeholder="Entity id" className="w-48 font-mono" />
        <Input value={actor} onChange={(e) => setActor(e.target.value)} placeholder="Actor email or id" className="w-52" />
        <Input type="date" value={f.from} onChange={(e) => setF({ from: e.target.value })} className="w-40" aria-label="From" />
        <Input type="date" value={f.to} onChange={(e) => setF({ to: e.target.value })} className="w-40" aria-label="To" />
        <Button type="submit" variant="outline">
          Apply
        </Button>
      </form>
      {list.status === "error" && !list.data ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : !list.data ? (
        <LoadingRows />
      ) : list.data.items.length === 0 ? (
        <EmptyState title="No changes" body="Nothing matches these filters." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>What</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data.items.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => setOpen(c.id)}>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(c.at)}</TableCell>
                    <TableCell>
                      {CHANGE_ENTITIES.find((e) => e.value === c.entity)?.label ?? c.entity}
                      <span className="ml-2 font-mono text-[11px] text-muted-foreground">{c.entityId.slice(-8)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.action.replace(/_/g, " ")}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{c.actorEmail}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pager page={list.data.page} pages={list.data.pages} total={list.data.total} onPage={(p) => setF({ page: String(p) })} />
        </>
      )}
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Change</SheetTitle>
          </SheetHeader>
          {open && <Detail id={open} />}
        </SheetContent>
      </Sheet>
    </>
  )
}
