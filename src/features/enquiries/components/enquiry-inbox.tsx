"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Download } from "lucide-react"
import { Button, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui"
import { EmptyState, ErrorState, LoadingRows, NativeSelect, PageHeader, Pager } from "@/components/common"
import { browserApi, errorMessage } from "@/core/api"
import { useLoad } from "@/core/hooks/use-load"
import { useUrlState } from "@/core/hooks/use-url-state"
import { useAccess } from "@/features/access"
import { formatRelative } from "@/lib/format"
import { enquiriesApi } from "../api/enquiries.api"
import { ENQUIRY_STATUSES, type EnquiryFilter, type EnquiryStatus } from "../entities/enquiries.entity"
import { EnquiryStatusBadge } from "./enquiry-badges"

const api = enquiriesApi(browserApi)

export function EnquiryInbox() {
  const access = useAccess()
  const router = useRouter()
  const [f, setF, page] = useUrlState(["status", "assignee", "listing", "q", "from", "to"] as const)
  const [q, setQ] = useState(f.q)
  const [listing, setListing] = useState(f.listing)
  const filter: EnquiryFilter = { ...f, status: f.status as EnquiryStatus, assignee: f.assignee === "me" ? access.id : f.assignee }
  const list = useLoad(() => api.list(filter, page), [f.status, f.assignee, f.listing, f.q, f.from, f.to, page])

  const exportCsv = async () => {
    try {
      const blob = await api.exportCsv(filter)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `enquiries-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <>
      <PageHeader
        title="Enquiries"
        description="Every enquiry from the public site."
        actions={
          <Button variant="outline" onClick={exportCsv}>
            <Download /> Export CSV
          </Button>
        }
      />
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          setF({ q: q.trim(), listing: listing.trim() })
        }}
      >
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email, company…" className="w-56" />
        <Input value={listing} onChange={(e) => setListing(e.target.value)} placeholder="Listing short id" className="w-40" />
        <NativeSelect value={f.status} onChange={(status) => setF({ status })} placeholder="Any status" options={ENQUIRY_STATUSES} />
        <NativeSelect
          value={f.assignee}
          onChange={(assignee) => setF({ assignee })}
          placeholder="Anyone"
          options={[
            { value: "me", label: "Assigned to me" },
            { value: "none", label: "Unassigned" },
          ]}
        />
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
        <EmptyState title="No enquiries" body="Nothing matches these filters." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>Listing</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data.items.map((e) => (
                  <TableRow key={e.id} className="cursor-pointer" onClick={() => router.push(`/admin/enquiries/${e.id}`)}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{e.name}</span>
                        <span className="text-xs text-muted-foreground">{e.company || e.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{e.listing ? `${e.listing.name}${e.listing.city ? ` · ${e.listing.city}` : ""}` : <span className="text-muted-foreground">General</span>}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{e.message}</TableCell>
                    <TableCell>
                      <EnquiryStatusBadge status={e.status} reason={e.closeReason} />
                    </TableCell>
                    <TableCell className="text-xs">{e.assigneeEmail || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{formatRelative(e.createdAt)}</TableCell>
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
