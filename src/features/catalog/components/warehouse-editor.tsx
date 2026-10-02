"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeft, ExternalLink, Save, Send } from "lucide-react"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
import { ConfirmDialog, ErrorState, LoadingRows } from "@/components/common"
import { ApiError, browserApi, errorMessage } from "@/core/api"
import { useLoad } from "@/core/hooks/use-load"
import { useAccess } from "@/features/access"
import { attributesApi, type AttributeTree } from "@/features/attributes"
import { formatDateTime } from "@/lib/format"
import { catalogApi } from "../api/catalog.api"
import type { ListingContent, Media, Preview, WarehouseDetail } from "../entities/catalog.entity"
import { cloneContent, listingAddress, listingName } from "../lib/content"
import { AttributeForm, pruneAttributes } from "./attribute-form"
import { RevisionStateBadge, WarehouseStatusBadge } from "./badges"
import { HistoryPanel } from "./history-panel"
import { MediaPanel } from "./media-panel"
import { PreviewPanel } from "./preview-panel"
import { RentAdminForm } from "./rent-admin-form"

const api = catalogApi(browserApi)
const attrs = attributesApi(browserApi)

type Dialog = "discard" | "archive" | "delete" | "reject" | "approve" | null

/**
 * One warehouse: its open draft as a form (editors), review actions
 * (approvers), media and history. Saves are CAS on the revision's `rev`; a
 * 409 keeps the local edits on screen to copy from (spec 08 conflict UX).
 */
export function WarehouseEditor({ id }: { id: string }) {
  const access = useAccess()
  const router = useRouter()
  const data = useLoad(async () => {
    const [detail, tree, industries] = await Promise.all([api.detail(id), attrs.tree(), attrs.industries()])
    return { detail, tree, industryNames: Object.fromEntries(industries.items.map((i) => [i.key, i.name])) }
  }, [id])

  if (data.status === "error" && !data.data) return <ErrorState error={data.error} onRetry={data.reload} />
  if (!data.data) return <LoadingRows rows={8} />
  return (
    <Editor
      key={`${data.data.detail.openRevision?.id ?? "none"}:${data.data.detail.openRevision?.rev ?? 0}:${data.data.detail.warehouse.liveVersion}`}
      detail={data.data.detail}
      tree={data.data.tree}
      industryNames={data.data.industryNames}
      reload={data.reload}
      canEdit={access.can.editor}
      canApprove={access.can.approver}
      onDeleted={() => router.push("/admin/warehouses")}
    />
  )
}

function Editor({
  detail,
  tree,
  industryNames,
  reload,
  canEdit,
  canApprove,
  onDeleted,
}: {
  detail: WarehouseDetail
  tree: AttributeTree
  industryNames: Record<string, string>
  reload: () => void
  canEdit: boolean
  canApprove: boolean
  onDeleted: () => void
}) {
  const { warehouse } = detail
  const [revision, setRevision] = useState(detail.openRevision)
  const [content, setContent] = useState<ListingContent | null>(() =>
    detail.openRevision ? cloneContent(detail.openRevision.content) : warehouse.live ? cloneContent(warehouse.live) : null,
  )
  const [media, setMedia] = useState<Media[]>(detail.media)
  const [preview, setPreview] = useState<Preview | null>(detail.preview)
  const [warnings, setWarnings] = useState<string[]>([])
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [showRequired, setShowRequired] = useState(false)
  const [conflictCopy, setConflictCopy] = useState<string | null>(null)
  const [dialog, setDialog] = useState<Dialog>(null)

  const editable = !!revision && revision.state === "draft" && canEdit
  const inReview = revision?.state === "in_review"

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const update = (c: ListingContent) => {
    setContent(c)
    setDirty(true)
  }

  const run = useCallback(
    async <T,>(fn: () => Promise<T>, success?: string): Promise<T | undefined> => {
      setBusy(true)
      try {
        const r = await fn()
        if (success) toast.success(success)
        return r
      } catch (err) {
        if (err instanceof ApiError && err.code === "submit_blocked") {
          setShowRequired(true)
          const problems = (err.data as { problems?: string[] } | undefined)?.problems ?? []
          setPreview((p) => (p ? { ...p, submitProblems: problems } : p))
          toast.error("Fix the highlighted problems before submitting.")
        } else if (err instanceof ApiError && err.code === "version_conflict" && content) {
          setConflictCopy(JSON.stringify(content, null, 2))
          toast.error("Someone else saved this draft.")
        } else {
          toast.error(errorMessage(err))
        }
        return undefined
      } finally {
        setBusy(false)
      }
    },
    [content],
  )

  const save = async (): Promise<boolean> => {
    if (!revision || !content) return false
    const body = { ...content, attributes: pruneAttributes(tree, content.attributes) }
    const res = await run(() => api.save(revision.id, revision.rev, body))
    if (!res?.revision) return false
    setRevision(res.revision)
    setContent(cloneContent(res.revision.content))
    setPreview(res.preview)
    setWarnings(res.warnings)
    setDirty(false)
    toast.success("Draft saved")
    return true
  }

  const lifecycle = async (fn: () => Promise<unknown>, success: string) => {
    const ok = await run(async () => {
      await fn()
      return true
    }, success)
    if (ok) {
      setDirty(false)
      setDialog(null)
      reload()
    }
  }

  const geocode = async () => {
    const address = listingAddress(content)
    if (!address.line1 || !address.city) {
      toast.error("Fill in the address first (line 1, city, country).")
      return null
    }
    const loc = await run(() =>
      api.geocodePreview({
        line1: address.line1 ?? "",
        line2: address.line2 ?? "",
        locality: address.locality ?? "",
        city: address.city ?? "",
        region: address.region ?? "",
        postalCode: address.postalCode ?? "",
        country: address.country || "IN",
      }),
    )
    return loc ?? null
  }

  const title = content ? listingName(content) : warehouse.name || "Untitled warehouse"
  const reviewNote = revision?.review.filter((r) => r.action === "reject").at(-1)

  return (
    <>
      <div className="flex flex-col gap-3">
        <Link href="/admin/warehouses" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Warehouses
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <h1 className="font-heading text-xl font-semibold tracking-tight">{title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <WarehouseStatusBadge status={warehouse.status} />
              {revision && <RevisionStateBadge state={revision.state} />}
              <span className="font-mono">{warehouse.shortId}</span>
              {warehouse.liveVersion > 0 && <span>live v{warehouse.liveVersion}</span>}
              {dirty && <Badge variant="outline">Unsaved changes</Badge>}
              {warehouse.status === "live" && (
                <Link href={`/warehouses/${warehouse.slug}`} target="_blank" className="inline-flex items-center gap-1 hover:text-foreground">
                  View public page <ExternalLink className="size-3" />
                </Link>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!revision && canEdit && warehouse.status !== "archived" && (
              <Button disabled={busy} onClick={() => lifecycle(() => api.open(warehouse.id), "Draft opened")}>
                Edit (open a draft)
              </Button>
            )}
            {editable && (
              <>
                <Button variant="outline" disabled={busy || !dirty} onClick={save}>
                  <Save /> Save draft
                </Button>
                <Button
                  disabled={busy}
                  onClick={async () => {
                    if (dirty && !(await save())) return
                    if (revision) await lifecycle(() => api.submit(revision.id), "Submitted for review")
                  }}
                >
                  <Send /> Submit for review
                </Button>
                <Button variant="ghost" disabled={busy} onClick={() => setDialog("discard")}>
                  Discard draft
                </Button>
              </>
            )}
            {inReview && (canEdit || canApprove) && (
              <Button variant="outline" disabled={busy} onClick={() => revision && lifecycle(() => api.withdraw(revision.id), "Withdrawn to draft")}>
                Withdraw
              </Button>
            )}
            {inReview && canApprove && (
              <>
                <Button variant="outline" disabled={busy} onClick={() => setDialog("reject")}>
                  Reject
                </Button>
                <Button disabled={busy} onClick={() => setDialog("approve")}>
                  Approve & publish
                </Button>
              </>
            )}
            {canApprove && warehouse.status === "live" && !revision && (
              <Button variant="outline" disabled={busy} onClick={() => setDialog("archive")}>
                Archive
              </Button>
            )}
            {canApprove && warehouse.status === "archived" && !revision && (
              <Button disabled={busy} onClick={() => lifecycle(() => api.restore(warehouse.id), "Restored as a draft — it needs approval to go live")}>
                Restore
              </Button>
            )}
            {canApprove && warehouse.status === "unpublished" && (
              <Button variant="destructive" disabled={busy} onClick={() => setDialog("delete")}>
                Delete
              </Button>
            )}
          </div>
        </div>
        {reviewNote && revision?.state === "draft" && (
          <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-xs">
            Sent back by {reviewNote.by} {formatDateTime(reviewNote.at)}
            {reviewNote.comment && <>: “{reviewNote.comment}”</>}
          </p>
        )}
        {!revision && warehouse.status !== "archived" && (
          <p className="text-xs text-muted-foreground">Showing the live copy. Open a draft to change it — changes go live after approval.</p>
        )}
      </div>

      {conflictCopy && (
        <div className="flex flex-col gap-2 rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
          <p className="text-sm font-medium">Someone else saved this draft. Reload to see their changes.</p>
          <p className="text-xs text-muted-foreground">Your edits are kept below — copy what you need, then reload and re-apply.</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={reload}>
              Reload
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(conflictCopy).then(() => toast.success("Copied"))}>
              Copy my edits
            </Button>
          </div>
          <pre className="max-h-64 overflow-auto rounded-xl bg-muted p-3 text-[11px]">{conflictCopy}</pre>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="terms">Commercial terms</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="pt-3">
            {content ? (
              <AttributeForm
                tree={tree}
                attributes={content.attributes}
                preview={preview}
                disabled={!editable}
                showRequired={showRequired}
                onChange={(attributes) => update({ ...content, attributes })}
                onGeocode={geocode}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Nothing to show yet.</p>
            )}
          </TabsContent>
          <TabsContent value="media" className="pt-3">
            <MediaPanel
              warehouseId={warehouse.id}
              media={media}
              refs={content?.media ?? []}
              editable={editable}
              onUploaded={(m) => setMedia((list) => [...list.filter((x) => x.id !== m.id), m])}
              onRefsChange={(refs) => content && update({ ...content, media: refs })}
            />
          </TabsContent>
          <TabsContent value="terms" className="pt-3">
            <p className="mb-3 text-xs text-muted-foreground">Staff only — never shown on the public site. The headline rent is in Details.</p>
            {content && <RentAdminForm value={content.rentAdmin} disabled={!editable} onChange={(rentAdmin) => update({ ...content, rentAdmin })} />}
          </TabsContent>
          <TabsContent value="history" className="pt-3">
            <HistoryPanel history={detail.history} live={warehouse.live} />
          </TabsContent>
        </Tabs>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Check</CardTitle>
            </CardHeader>
            <CardContent>
              <PreviewPanel tree={tree} preview={preview} warnings={warnings} industryNames={industryNames} />
            </CardContent>
          </Card>
        </aside>
      </div>

      <ConfirmDialog
        open={dialog === "discard"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Discard this draft?"
        description="All unapproved changes in it are thrown away. The live listing is not affected."
        confirmLabel="Discard"
        destructive
        pending={busy}
        onConfirm={() => revision && lifecycle(() => api.discard(revision.id), "Draft discarded")}
      />
      <ConfirmDialog
        open={dialog === "approve"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Approve and publish?"
        description="This version goes live on the public site straight away."
        confirmLabel="Approve"
        pending={busy}
        onConfirm={() => revision && lifecycle(() => api.approve(revision.id), "Approved — it's live")}
      />
      <ConfirmDialog
        open={dialog === "reject"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Send back to the editor?"
        description="The draft returns to the editor with your comment."
        confirmLabel="Reject"
        withComment
        commentRequired
        commentPlaceholder="What needs fixing?"
        pending={busy}
        onConfirm={(comment) => revision && lifecycle(() => api.reject(revision.id, comment), "Sent back")}
      />
      <ConfirmDialog
        open={dialog === "archive"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Archive this listing?"
        description="It disappears from search; its page shows similar listings instead. You can restore it later."
        confirmLabel="Archive"
        destructive
        pending={busy}
        onConfirm={() => lifecycle(() => api.archive(warehouse.id), "Archived")}
      />
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Delete this warehouse?"
        description="It has never been published. This can't be undone."
        confirmLabel="Delete"
        destructive
        pending={busy}
        onConfirm={async () => {
          const ok = await run(async () => {
            await api.remove(warehouse.id)
            return true
          }, "Deleted")
          if (ok) onDeleted()
        }}
      />
    </>
  )
}
