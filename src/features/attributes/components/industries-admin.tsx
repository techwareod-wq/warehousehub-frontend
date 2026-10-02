"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { Badge, Button, Card, CardContent, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input } from "@/components/ui"
import { ConfirmDialog, EmptyState, ErrorState, FormRow, LoadingRows, PageHeader } from "@/components/common"
import { browserApi, errorMessage } from "@/core/api"
import { useLoad } from "@/core/hooks/use-load"
import { useAccess } from "@/features/access"
import { sqmToSqft } from "@/lib/units"
import { attributesApi } from "../api/attributes.api"
import { COMPARATOR_LABELS, type AttributeTree, type Condition, type Industry } from "../entities/attributes.entity"
import { pathLabel } from "../lib/tree"
import { ConditionBuilder } from "./condition-builder"
import { slugKey } from "./node-dialog"

const api = attributesApi(browserApi)

function describe(tree: AttributeTree, c: Condition): string {
  if (c.cmp === "is_yes") return `${pathLabel(tree, c.node)} is yes`
  const field = tree.byKey[c.node]?.fields.find((f) => f.key === c.field)
  let v: unknown = c.value
  if (field?.type === "area" && typeof v === "number") v = `${Math.round(sqmToSqft(v)).toLocaleString()} sq ft`
  if (Array.isArray(v)) v = v.join(", ")
  return `${pathLabel(tree, `${c.node}.${c.field}`)} ${COMPARATOR_LABELS[c.cmp]} ${String(v)}`
}

function IndustryDialog({
  tree,
  industry,
  open,
  onClose,
  onSaved,
}: {
  tree: AttributeTree
  industry: Industry | null
  open: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(industry?.name ?? "")
  const [key, setKey] = useState(industry?.key ?? "")
  const [order, setOrder] = useState(industry?.order ?? 0)
  const [required, setRequired] = useState<Condition[]>(industry?.required ?? [])
  const [preferred, setPreferred] = useState<Condition[]>(industry?.preferred ?? [])
  const [busy, setBusy] = useState(false)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{industry ? `Edit ${industry.name}` : "New industry"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormRow label="Name" required>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (!industry) setKey(slugKey(e.target.value))
              }}
            />
          </FormRow>
          <FormRow label="Key" required>
            <Input value={key} disabled={!!industry} className="font-mono" onChange={(e) => setKey(e.target.value)} />
          </FormRow>
          <FormRow label="Order">
            <Input type="number" value={order || ""} onChange={(e) => setOrder(Number(e.target.value) || 0)} />
          </FormRow>
        </div>
        <FormRow label="Must have" hint="A listing fits only when every rule passes. Unknown answers make it “unverified”.">
          <ConditionBuilder tree={tree} value={required} onChange={setRequired} />
        </FormRow>
        <FormRow label="Nice to have" hint="Raises the listing in results; doesn't exclude anything.">
          <ConditionBuilder tree={tree} value={preferred} onChange={setPreferred} />
        </FormRow>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={busy || !name.trim() || !key.trim()}
            onClick={async () => {
              setBusy(true)
              try {
                if (industry) await api.updateIndustry(industry.key, industry.version, { name, order, required, preferred })
                else await api.createIndustry({ key, name, order, required, preferred })
                toast.success("Saved — listings are being re-evaluated")
                onSaved()
              } catch (err) {
                toast.error(errorMessage(err))
              } finally {
                setBusy(false)
              }
            }}
          >
            Save industry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Industry fit rules (D-030, D-037): what a warehouse needs to suit an industry. */
export function IndustriesAdmin() {
  const access = useAccess()
  const data = useLoad(async () => {
    const [tree, list] = await Promise.all([api.tree(), api.industries()])
    return { tree, list }
  }, [])
  const [editing, setEditing] = useState<{ industry: Industry | null } | null>(null)
  const [deleting, setDeleting] = useState<Industry | null>(null)
  const [busy, setBusy] = useState(false)

  if (data.status === "error" && !data.data) return <ErrorState error={data.error} onRetry={data.reload} />
  if (!data.data) return <LoadingRows />
  const { tree, list } = data.data

  return (
    <>
      <PageHeader
        title="Industries"
        description="Rules that decide which industries a warehouse suits. Visitors filter search by these."
        actions={
          access.can.attributes && (
            <Button onClick={() => setEditing({ industry: null })}>
              <Plus /> New industry
            </Button>
          )
        }
      />
      {list.items.length === 0 ? (
        <EmptyState title="No industries yet" body="Add one to let visitors search by what they store." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.items.map((ind) => (
            <Card key={ind.key}>
              <CardContent className="flex flex-col gap-3 pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{ind.name}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{ind.key}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {access.can.attributes && (
                      <Button size="icon-sm" variant="ghost" onClick={() => setEditing({ industry: ind })} aria-label="Edit">
                        <Pencil />
                      </Button>
                    )}
                    {access.can.superuser && (
                      <Button size="icon-sm" variant="ghost" onClick={() => setDeleting(ind)} aria-label="Delete">
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  {ind.required.map((c, i) => (
                    <span key={`r${i}`}>
                      <Badge variant="outline" className="mr-1.5">
                        must
                      </Badge>
                      {describe(tree, c)}
                    </span>
                  ))}
                  {ind.preferred.map((c, i) => (
                    <span key={`p${i}`} className="text-muted-foreground">
                      <Badge variant="secondary" className="mr-1.5">
                        nice
                      </Badge>
                      {describe(tree, c)}
                    </span>
                  ))}
                  {ind.required.length + ind.preferred.length === 0 && <span className="text-muted-foreground">No rules — every listing fits.</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {editing && (
        <IndustryDialog
          key={editing.industry?.key ?? "new"}
          tree={tree}
          industry={editing.industry}
          open
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            data.reload()
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name}?`}
        description="Visitors can no longer filter by it. This can't be undone."
        destructive
        confirmLabel="Delete"
        pending={busy}
        onConfirm={async () => {
          if (!deleting) return
          setBusy(true)
          try {
            await api.deleteIndustry(deleting.key, deleting.version)
            toast.success("Deleted")
            setDeleting(null)
            data.reload()
          } catch (err) {
            toast.error(errorMessage(err))
          } finally {
            setBusy(false)
          }
        }}
      />
    </>
  )
}
