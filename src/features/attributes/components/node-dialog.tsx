"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Textarea } from "@/components/ui"
import { FormRow, NativeSelect } from "@/components/common"
import { browserApi, errorMessage } from "@/core/api"
import { attributesApi } from "../api/attributes.api"
import type { AttributeNode, NewNodeDefault } from "../entities/attributes.entity"

const api = attributesApi(browserApi)

export function slugKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^[^a-z]+/, "")
    .slice(0, 48)
}

/** Add a child node (D-126: new nodes default to Unknown or No on existing listings). */
export function NewNodeDialog({ parent, onClose, onCreated }: { parent: AttributeNode | null; onClose: () => void; onCreated: (key: string) => void }) {
  const [name, setName] = useState("")
  const [key, setKey] = useState("")
  const [keyTouched, setKeyTouched] = useState(false)
  const [description, setDescription] = useState("")
  const [def, setDef] = useState<NewNodeDefault>("unknown")
  const [busy, setBusy] = useState(false)

  const reset = () => {
    setName("")
    setKey("")
    setKeyTouched(false)
    setDescription("")
    setDef("unknown")
  }

  return (
    <Dialog
      open={!!parent}
      onOpenChange={(o) => {
        if (!o) {
          reset()
          onClose()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add under {parent?.name}</DialogTitle>
          <DialogDescription>A node is something a warehouse can have, e.g. &ldquo;Cold storage&rdquo;. Add its fields after creating it.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <FormRow label="Name" required>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (!keyTouched) setKey(slugKey(e.target.value))
              }}
            />
          </FormRow>
          <FormRow label="Key" required hint="Lowercase letters, digits and _. Can't be changed later.">
            <Input
              value={key}
              className="font-mono"
              onChange={(e) => {
                setKeyTouched(true)
                setKey(e.target.value)
              }}
            />
          </FormRow>
          <FormRow label="Description">
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </FormRow>
          <FormRow label="On existing listings" hint="Unknown puts it in Needs info for every listing under this parent.">
            <NativeSelect
              value={def}
              onChange={(v) => setDef(v as NewNodeDefault)}
              options={[
                { value: "unknown", label: "Unknown — ask about it" },
                { value: "no", label: "No — assume they don't have it" },
              ]}
            />
          </FormRow>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={busy || !name.trim() || !key.trim() || !parent}
            onClick={async () => {
              if (!parent) return
              setBusy(true)
              try {
                const node = await api.createNode(
                  { key, parentKey: parent.key, name, description, public: true, filterable: false, filterRow: "", filterPos: 0, synonyms: [] },
                  def,
                )
                toast.success(`Added ${node.name}`)
                reset()
                onCreated(node.key)
              } catch (err) {
                toast.error(errorMessage(err))
              } finally {
                setBusy(false)
              }
            }}
          >
            Add node
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
