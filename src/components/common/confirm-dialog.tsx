"use client"

import { useState } from "react"
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Textarea } from "@/components/ui"

/**
 * A confirm dialog for one action. With `withComment` it collects a
 * comment (required when `commentRequired`) and passes it to onConfirm.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  destructive,
  withComment,
  commentRequired,
  commentPlaceholder,
  pending,
  onConfirm,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  destructive?: boolean
  withComment?: boolean
  commentRequired?: boolean
  commentPlaceholder?: string
  pending?: boolean
  onConfirm: (comment: string) => void
  children?: React.ReactNode
}) {
  const [comment, setComment] = useState("")
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setComment("")
        onOpenChange(o)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        {withComment && (
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={commentPlaceholder ?? "Comment"} rows={3} />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={pending || (commentRequired && !comment.trim())}
            onClick={() => onConfirm(comment.trim())}
          >
            {pending ? "Working…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
