"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Search } from "lucide-react"
import { Badge, Button, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui"
import { Checkbox, EmptyState, ErrorState, LoadingRows, NativeSelect, PageHeader, Pager } from "@/components/common"
import { browserApi } from "@/core/api"
import { useAction } from "@/core/hooks/use-action"
import { useLoad } from "@/core/hooks/use-load"
import { useUrlState } from "@/core/hooks/use-url-state"
import { useAccess } from "@/features/access"
import { formatAreaSqft, formatRelative } from "@/lib/format"
import { catalogApi } from "../api/catalog.api"
import type { WarehouseStatus } from "../entities/catalog.entity"
import { WarehouseStatusBadge } from "./badges"

const api = catalogApi(browserApi)

const STATUS_OPTIONS = [
  { value: "unpublished", label: "Unpublished" },
  { value: "live", label: "Live" },
  { value: "archived", label: "Archived" },
]

export function WarehouseList() {
  const access = useAccess()
  const router = useRouter()
  const [f, setF, page] = useUrlState(["status", "q", "city", "needsInfo"] as const)
  const [q, setQ] = useState(f.q)
  const [city, setCity] = useState(f.city)

  const list = useLoad(
    () => api.list({ status: f.status as WarehouseStatus, q: f.q, city: f.city, needsInfo: f.needsInfo === "true", page }),
    [f.status, f.q, f.city, f.needsInfo, page],
  )

  const create = useAction(() => api.create(), {
    success: "Draft created",
  })

  return (
    <>
      <PageHeader
        title="Warehouses"
        description="Every listing, live or not. Open one to edit its draft."
        actions={
          access.can.editor && (
            <Button
              disabled={create.pending}
              onClick={async () => {
                const res = await create.run()
                if (res) router.push(`/admin/warehouses/${res.warehouse.id}`)
              }}
            >
              <Plus /> New warehouse
            </Button>
          )
        }
      />
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          setF({ q: q.trim(), city: city.trim() })
        }}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name" className="w-56 pl-9" />
        </div>
        <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="w-40" />
        <NativeSelect value={f.status} onChange={(status) => setF({ status })} placeholder="Any status" options={STATUS_OPTIONS} />
        <Checkbox checked={f.needsInfo === "true"} onChange={(v) => setF({ needsInfo: v ? "true" : "" })} label="Needs info only" />
        <Button type="submit" variant="outline">
          Apply
        </Button>
      </form>

      {list.status === "error" && !list.data ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : !list.data ? (
        <LoadingRows />
      ) : list.data.items.length === 0 ? (
        <EmptyState title="No warehouses" body="Nothing matches these filters." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Area</TableHead>
                  <TableHead className="text-right">Complete</TableHead>
                  <TableHead>Needs info</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data.items.map((w) => (
                  <TableRow key={w.id} className="cursor-pointer" onClick={() => router.push(`/admin/warehouses/${w.id}`)}>
                    <TableCell className="font-medium">
                      <Link href={`/admin/warehouses/${w.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                        {w.name || "Untitled warehouse"}
                      </Link>
                      <span className="ml-2 font-mono text-[11px] text-muted-foreground">{w.shortId}</span>
                    </TableCell>
                    <TableCell>{w.city || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <WarehouseStatusBadge status={w.status} />
                        {w.openRevisionId && <Badge variant="outline">Open draft</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{w.totalSqm ? formatAreaSqft(w.totalSqm) : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{Math.round(w.completeness * 100)}%</TableCell>
                    <TableCell>{w.needsInfoCount > 0 ? <Badge variant="destructive">{w.needsInfoCount}</Badge> : "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{formatRelative(w.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pager page={list.data.page} pages={list.data.pages} total={list.data.total} onPage={(p) => setF({ page: String(p) })} />
        </>
      )}
    </>
  )
}
