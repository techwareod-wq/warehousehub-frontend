"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, ExternalLink, Mail, Phone } from "lucide-react"
import { Button, Card, CardContent, CardHeader, CardTitle, Textarea } from "@/components/ui"
import { ErrorState, FormRow, LoadingRows, NativeSelect } from "@/components/common"
import { ApiError, browserApi, errorMessage } from "@/core/api"
import { useLoad } from "@/core/hooks/use-load"
import { accessApi } from "@/features/access"
import { formatAreaSqft, formatDateTime } from "@/lib/format"
import { enquiriesApi } from "../api/enquiries.api"
import { CLOSE_REASONS, ENQUIRY_STATUSES, type CloseReason, type Enquiry, type EnquiryStatus } from "../entities/enquiries.entity"
import { EnquiryStatusBadge } from "./enquiry-badges"

const api = enquiriesApi(browserApi)
const access = accessApi(browserApi)

/** One enquiry: contact, message, the listing and search behind it, and the work log. */
export function EnquiryDetailView({ id }: { id: string }) {
  const data = useLoad(async () => {
    const [detail, staff] = await Promise.all([api.detail(id), access.staff()])
    return { detail, staff: staff.filter((s) => s.can.editor) }
  }, [id])
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null)
  const [status, setStatus] = useState<EnquiryStatus | "">("")
  const [reason, setReason] = useState<CloseReason>("won")
  const [closeNote, setCloseNote] = useState("")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)

  if (data.status === "error" && !data.data) return <ErrorState error={data.error} onRetry={data.reload} />
  if (!data.data) return <LoadingRows rows={6} />
  const { detail, staff } = data.data
  const e = enquiry ?? detail.enquiry
  const nextStatus = status || e.status

  const write = async (fn: () => Promise<Enquiry>, msg: string) => {
    setBusy(true)
    try {
      setEnquiry(await fn())
      toast.success(msg)
      return true
    } catch (err) {
      if (err instanceof ApiError && err.code === "version_conflict") {
        toast.error("Someone else just changed this enquiry — reloaded.")
        setEnquiry(null)
        data.reload()
      } else toast.error(errorMessage(err))
      return false
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Link href="/admin/enquiries" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Enquiries
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-xl font-semibold">{e.name}</h1>
        <EnquiryStatusBadge status={e.status} reason={e.closeReason} />
        <span className="text-xs text-muted-foreground">received {formatDateTime(e.createdAt)}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Message</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm whitespace-pre-line">{e.message}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <a href={`mailto:${e.email}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                  <Mail className="size-4" /> {e.email}
                </a>
                <a href={`tel:${e.phone}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                  <Phone className="size-4" /> {e.phone}
                </a>
                {e.company && <span className="text-muted-foreground">{e.company}</span>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Listing</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {detail.listing ? (
                <div className="flex flex-col gap-1">
                  <Link href={`/admin/warehouses/${detail.listing.warehouseId}`} className="font-medium hover:underline">
                    {detail.listing.name}
                  </Link>
                  <span className="text-muted-foreground">
                    {detail.listing.city} · {formatAreaSqft(detail.listing.totalSqm)} · {detail.listing.status}
                  </span>
                  {detail.listing.publicUrl && (
                    <a href={detail.listing.publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      Public page <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">General requirement — no specific listing.</span>
              )}
            </CardContent>
          </Card>

          {detail.search && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Search that led here</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm">
                <span>{detail.search.text || detail.search.place || "Filters only"}</span>
                <span className="text-xs text-muted-foreground">
                  {detail.search.kind} search · {detail.search.resultCount} results · {formatDateTime(detail.search.at)}
                </span>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Notes</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {e.notes.length === 0 && <p className="text-xs text-muted-foreground">No notes yet.</p>}
              {e.notes.map((n) => (
                <div key={n.id} className="rounded-xl bg-muted/50 p-3 text-sm">
                  <p className="whitespace-pre-line">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {n.byEmail} · {formatDateTime(n.at)}
                  </p>
                </div>
              ))}
              <Textarea rows={3} value={note} onChange={(ev) => setNote(ev.target.value)} placeholder="Add a note for the team…" />
              <Button
                size="sm"
                className="self-start"
                disabled={busy || !note.trim()}
                onClick={async () => {
                  if (await write(() => api.addNote(e.id, note), "Note added")) setNote("")
                }}
              >
                Add note
              </Button>
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <NativeSelect value={nextStatus} onChange={(s) => setStatus(s as EnquiryStatus)} options={ENQUIRY_STATUSES} />
              {nextStatus === "closed" && (
                <>
                  <FormRow label="Outcome">
                    <NativeSelect value={reason} onChange={(r) => setReason(r as CloseReason)} options={CLOSE_REASONS} />
                  </FormRow>
                  <Textarea rows={2} value={closeNote} onChange={(ev) => setCloseNote(ev.target.value)} placeholder="Close note (optional)" />
                </>
              )}
              <Button
                size="sm"
                disabled={busy || (nextStatus === e.status && nextStatus !== "closed")}
                onClick={async () => {
                  if (await write(() => api.setStatus(e, nextStatus, { reason, note: closeNote }), "Status updated")) setStatus("")
                }}
              >
                Update status
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Assignee</CardTitle>
            </CardHeader>
            <CardContent>
              <NativeSelect
                value={e.assigneeUserId ?? ""}
                disabled={busy}
                placeholder="Unassigned"
                onChange={(uid) => write(() => api.assign(e, uid || null), uid ? "Assigned" : "Unassigned")}
                options={staff.map((s) => ({ value: s.id, label: s.name ? `${s.name} (${s.email})` : s.email }))}
                className="w-full"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">History</CardTitle>
            </CardHeader>
            <CardContent>
              {e.history.length === 0 ? (
                <p className="text-xs text-muted-foreground">No changes yet.</p>
              ) : (
                <ul className="flex flex-col gap-2 text-xs">
                  {e.history.map((h, i) => (
                    <li key={i}>
                      <span className="font-medium">{h.field}</span>: {h.from || "—"} → {h.to || "—"}
                      <span className="block text-muted-foreground">
                        {h.byEmail} · {formatDateTime(h.at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  )
}
