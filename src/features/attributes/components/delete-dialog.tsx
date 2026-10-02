"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui"
import { LoadingRows } from "@/components/common"
import { browserApi, errorMessage } from "@/core/api"
import { attributesApi, type DeleteTarget } from "../api/attributes.api"
import type { DeletePreview } from "../entities/attributes.entity"

const api = attributesApi(browserApi)

/**
 * Superuser hard delete (D-129): preview what goes and what blocks it, then
 * confirm. Stored values are stripped from every listing in the background.
 */
export function DeleteDefinitionDialog({
  target,
  label,
  onClose,
  onDeleted,
}: {
  target: DeleteTarget | null
  label: string
  onClose: () => void
  onDeleted: () => void
}) {
  const [preview, setPreview] = useState<DeletePreview | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!target) return
    let live = true
    api.previewDelete(target).then(
      (p) => live && setPreview(p),
      (err) => live && setError(errorMessage(err)),
    )
    return () => {
      live = false
    }
  }, [target])

  const blocked = (preview?.blockedBy.length ?? 0) > 0
  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {label}?</DialogTitle>
          <DialogDescription>This removes the definition for good and strips its values from every listing.</DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : !preview ? (
          <LoadingRows rows={2} />
        ) : (
          <div className="flex flex-col gap-2 text-sm">
            {preview.nodes.length > 1 && <p>Also deletes {preview.nodes.length - 1} child node(s): {preview.nodes.slice(1).join(", ")}</p>}
            <p>{preview.warehouses.toLocaleString()} listing(s) hold values that will be removed.</p>
            {blocked && (
              <div className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
                <p className="font-medium">Can&apos;t delete yet:</p>
                <ul className="mt-1 list-disc pl-4">
                  {preview.blockedBy.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!preview || blocked || busy}
            onClick={async () => {
              if (!target) return
              setBusy(true)
              try {
                await api.confirmDelete(target)
                toast.success("Deleted — values are being removed in the background")
                onDeleted()
              } catch (err) {
                toast.error(errorMessage(err))
              } finally {
                setBusy(false)
              }
            }}
          >
            {busy ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
