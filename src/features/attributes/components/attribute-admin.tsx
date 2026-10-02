"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ArrowDown, ArrowUp, Lock, Pencil, Plus, Trash2 } from "lucide-react"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea } from "@/components/ui"
import { Checkbox, ErrorState, FormRow, LoadingRows, NativeSelect, PageHeader } from "@/components/common"
import { browserApi, errorMessage } from "@/core/api"
import { useLoad } from "@/core/hooks/use-load"
import { useAccess } from "@/features/access"
import { cn } from "@/lib/utils"
import { attributesApi, type DeleteTarget } from "../api/attributes.api"
import { FIELD_TYPE_LABELS, type AttributeField, type AttributeNode, type AttributeTree } from "../entities/attributes.entity"
import { isDescendant } from "../lib/tree"
import { DeleteDefinitionDialog } from "./delete-dialog"
import { FieldDialog } from "./field-dialog"
import { NewNodeDialog } from "./node-dialog"

const api = attributesApi(browserApi)

function TreeList({ tree, selected, onSelect }: { tree: AttributeTree; selected: string; onSelect: (k: string) => void }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {tree.nodes.map((n) => (
        <li key={n.key}>
          <button
            onClick={() => onSelect(n.key)}
            style={{ paddingLeft: 8 + n.depth * 16 }}
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-lg py-1.5 pr-2 text-left text-sm hover:bg-muted",
              selected === n.key && "bg-muted font-medium",
            )}
          >
            <span className="truncate">{n.name}</span>
            <span className="text-[11px] text-muted-foreground">{n.fields.length}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function NodeProperties({ node, canEdit, onSaved }: { node: AttributeNode; canEdit: boolean; onSaved: () => void }) {
  const [name, setName] = useState(node.name)
  const [description, setDescription] = useState(node.description)
  const [isPublic, setPublic] = useState(node.public)
  const [filterable, setFilterable] = useState(node.filterable)
  const [filterRow, setFilterRow] = useState(node.filterRow)
  const [filterPos, setFilterPos] = useState(node.filterPos)
  const [synonyms, setSynonyms] = useState(node.synonyms.join(", "))
  const [busy, setBusy] = useState(false)

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormRow label="Name">
        <Input value={name} disabled={!canEdit} onChange={(e) => setName(e.target.value)} />
      </FormRow>
      <FormRow label="Key">
        <Input value={node.key} disabled className="font-mono" />
      </FormRow>
      <FormRow label="Description" className="sm:col-span-2">
        <Textarea rows={2} value={description} disabled={!canEdit} onChange={(e) => setDescription(e.target.value)} />
      </FormRow>
      <FormRow label="Search synonyms" className="sm:col-span-2" hint="Comma-separated words visitors might use (helps AI search), e.g. cold room, freezer.">
        <Input value={synonyms} disabled={!canEdit} onChange={(e) => setSynonyms(e.target.value)} />
      </FormRow>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <Checkbox checked={isPublic} disabled={!canEdit || node.system} onChange={setPublic} label="Shown on public listings" />
        <Checkbox checked={filterable} disabled={!canEdit || node.system} onChange={setFilterable} label="Search filter chip" />
        {filterable && (
          <>
            <Input className="w-44" placeholder="Filter row" value={filterRow} disabled={!canEdit} onChange={(e) => setFilterRow(e.target.value)} />
            <Input className="w-24" type="number" placeholder="Position" value={filterPos || ""} disabled={!canEdit} onChange={(e) => setFilterPos(Number(e.target.value) || 0)} />
          </>
        )}
      </div>
      {canEdit && (
        <Button
          className="self-start"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              await api.updateNode(node.key, node.version, {
                name: name.trim(),
                description: description.trim(),
                public: isPublic,
                filterable,
                filterRow: filterRow.trim(),
                filterPos,
                synonyms: synonyms.split(",").map((s) => s.trim()).filter(Boolean),
              })
              toast.success("Saved")
              onSaved()
            } catch (err) {
              toast.error(errorMessage(err))
            } finally {
              setBusy(false)
            }
          }}
        >
          Save node
        </Button>
      )}
    </div>
  )
}

/**
 * The attribute tree (spec 02): nodes are things a warehouse can have, fields
 * describe them. Every change bumps the rules version and recomputes listings
 * in the background.
 */
export function AttributeAdmin() {
  const access = useAccess()
  const canEdit = access.can.attributes
  const data = useLoad(() => api.tree(), [])
  const [selected, setSelected] = useState("")
  const [adding, setAdding] = useState<AttributeNode | null>(null)
  const [fieldDialog, setFieldDialog] = useState<{ field: AttributeField | null } | null>(null)
  const [deleting, setDeleting] = useState<{ target: DeleteTarget; label: string } | null>(null)
  const [moveTo, setMoveTo] = useState("")
  const [busy, setBusy] = useState(false)

  const tree = data.data
  if (data.status === "error" && !tree) return <ErrorState error={data.error} onRetry={data.reload} />
  if (!tree) return <LoadingRows rows={8} />
  const current = tree.byKey[selected] ? selected : (tree.root?.key ?? "")
  const node = tree.byKey[current]

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true)
    try {
      await fn()
      toast.success(msg)
      data.reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const siblings = node && node.parentKey ? tree.byKey[node.parentKey]?.children ?? [] : []
  const moveNode = (d: -1 | 1) => {
    const keys = siblings.map((s) => s.key)
    const i = keys.indexOf(node!.key)
    const j = i + d
    if (j < 0 || j >= keys.length) return
    ;[keys[i], keys[j]] = [keys[j], keys[i]]
    act(() => api.reorderNodes(node!.parentKey, keys), "Reordered")
  }
  const moveField = (i: number, d: -1 | 1) => {
    const keys = node!.fields.map((f) => f.key)
    const j = i + d
    if (j < 0 || j >= keys.length) return
    ;[keys[i], keys[j]] = [keys[j], keys[i]]
    act(() => api.reorderFields(node!.key, node!.version, keys), "Reordered")
  }
  const moveTargets = node
    ? tree.nodes.filter((n) => n.key !== node.key && n.key !== node.parentKey && !isDescendant(tree, node.key, n.key))
    : []

  return (
    <>
      <PageHeader
        title="Attributes"
        description={`What listings can have and how it's described. Rules version ${tree.rulesVersion}.`}
      />
      {!canEdit && <p className="text-xs text-muted-foreground">Read only — editing needs the attributes permission.</p>}
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Card className="self-start">
          <CardContent className="p-2">
            <TreeList tree={tree} selected={current} onSelect={setSelected} />
          </CardContent>
        </Card>
        {node && (
          <div className="flex min-w-0 flex-col gap-4">
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  {node.name}
                  {node.system && (
                    <Badge variant="secondary">
                      <Lock /> Root
                    </Badge>
                  )}
                </CardTitle>
                {canEdit && (
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => setAdding(node)}>
                      <Plus /> Child node
                    </Button>
                    {!node.system && (
                      <>
                        <Button size="icon-sm" variant="ghost" disabled={busy} onClick={() => moveNode(-1)} aria-label="Move up">
                          <ArrowUp />
                        </Button>
                        <Button size="icon-sm" variant="ghost" disabled={busy} onClick={() => moveNode(1)} aria-label="Move down">
                          <ArrowDown />
                        </Button>
                      </>
                    )}
                    {!node.system && access.can.superuser && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleting({ target: { node: node.key, expectedVersion: node.version }, label: `node “${node.name}”` })}
                      >
                        <Trash2 /> Delete
                      </Button>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <NodeProperties key={`${node.key}:${node.version}`} node={node} canEdit={canEdit} onSaved={data.reload} />
                {canEdit && !node.system && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                    <span className="text-xs text-muted-foreground">Move under</span>
                    <NativeSelect
                      value={moveTo}
                      onChange={setMoveTo}
                      placeholder="Choose a parent…"
                      options={moveTargets.map((n) => ({ value: n.key, label: `${"— ".repeat(n.depth)}${n.name}` }))}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!moveTo || busy}
                      onClick={() => act(() => api.moveNode(node.key, node.version, moveTo), "Moved").then(() => setMoveTo(""))}
                    >
                      Move
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Fields</CardTitle>
                {canEdit && (
                  <Button size="sm" onClick={() => setFieldDialog({ field: null })}>
                    <Plus /> Add field
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {node.fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No fields — this node is a plain yes / no.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Flags</TableHead>
                        <TableHead className="w-40" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {node.fields.map((f, i) => (
                        <TableRow key={f.key}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="flex items-center gap-1 font-medium">
                                {f.name}
                                {f.locked && <Lock className="size-3 text-muted-foreground" />}
                              </span>
                              <span className="font-mono text-[11px] text-muted-foreground">{f.key}</span>
                            </div>
                          </TableCell>
                          <TableCell>{FIELD_TYPE_LABELS[f.type] ?? f.type}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {f.required && <Badge variant="outline">Required</Badge>}
                              {!f.public && <Badge variant="secondary">Staff only</Badge>}
                              {f.filterable && <Badge variant="secondary">Filter</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-0.5">
                              {canEdit && (
                                <>
                                  <Button size="icon-sm" variant="ghost" disabled={busy || i === 0} onClick={() => moveField(i, -1)} aria-label="Move up">
                                    <ArrowUp />
                                  </Button>
                                  <Button
                                    size="icon-sm"
                                    variant="ghost"
                                    disabled={busy || i === node.fields.length - 1}
                                    onClick={() => moveField(i, 1)}
                                    aria-label="Move down"
                                  >
                                    <ArrowDown />
                                  </Button>
                                  <Button size="icon-sm" variant="ghost" onClick={() => setFieldDialog({ field: f })} aria-label="Edit">
                                    <Pencil />
                                  </Button>
                                </>
                              )}
                              {access.can.superuser && !f.locked && (
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  aria-label="Delete"
                                  onClick={() =>
                                    setDeleting({ target: { node: node.key, field: f.key, expectedVersion: node.version }, label: `field “${f.name}”` })
                                  }
                                >
                                  <Trash2 />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <NewNodeDialog
        parent={adding}
        onClose={() => setAdding(null)}
        onCreated={(key) => {
          setAdding(null)
          setSelected(key)
          data.reload()
        }}
      />
      <FieldDialog
        key={fieldDialog ? `${current}:${fieldDialog.field?.key ?? "new"}` : "closed"}
        open={!!fieldDialog}
        node={node ?? null}
        field={fieldDialog?.field ?? null}
        tree={tree}
        canDeleteOptions={access.can.superuser}
        onClose={() => setFieldDialog(null)}
        onSaved={() => {
          setFieldDialog(null)
          data.reload()
        }}
        onDeleteOption={(f, option) => {
          setFieldDialog(null)
          setDeleting({ target: { node: node!.key, field: f.key, option, expectedVersion: node!.version }, label: `option “${option}”` })
        }}
      />
      <DeleteDefinitionDialog
        key={deleting ? JSON.stringify(deleting.target) : "none"}
        target={deleting?.target ?? null}
        label={deleting?.label ?? ""}
        onClose={() => setDeleting(null)}
        onDeleted={() => {
          setDeleting(null)
          data.reload()
        }}
      />
    </>
  )
}
