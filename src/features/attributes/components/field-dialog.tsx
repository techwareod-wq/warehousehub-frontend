"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, Trash2, X } from "lucide-react"
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Textarea } from "@/components/ui"
import { Checkbox, FormRow, NativeSelect } from "@/components/common"
import { browserApi, errorMessage } from "@/core/api"
import { UNIT_FAMILIES, unitLabel, type UnitFamily } from "@/lib/units"
import { attributesApi } from "../api/attributes.api"
import {
  FIELD_TYPE_LABELS,
  FIELD_TYPES,
  type AttributeField,
  type AttributeNode,
  type AttributeTree,
  type FieldType,
  type FieldValidation,
} from "../entities/attributes.entity"
import { numericFieldPaths } from "../lib/tree"
import { slugKey } from "./node-dialog"

const api = attributesApi(browserApi)

const VALIDATION_LABELS: Record<string, string> = {
  min: "Minimum",
  max: "Maximum",
  maxLength: "Max length",
  regex: "Pattern (regex)",
  units: "Allowed units",
  currencies: "Allowed currencies",
}

function blankField(): AttributeField {
  return {
    key: "",
    name: "",
    description: "",
    order: 0,
    type: "text",
    required: false,
    locked: false,
    unit: null,
    options: [],
    ratio: null,
    validations: [],
    public: true,
    filterable: false,
    filterRow: "",
    filterPos: 0,
  }
}

function ValidationValue({ v, onChange }: { v: FieldValidation; onChange: (value: unknown) => void }) {
  if (v.kind === "units" || v.kind === "currencies") {
    const list = Array.isArray(v.value) ? (v.value as string[]).join(", ") : ""
    return (
      <Input
        defaultValue={list}
        placeholder={v.kind === "units" ? "sqft, sqm" : "INR"}
        onBlur={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
      />
    )
  }
  if (v.kind === "regex") return <Input className="font-mono" value={String(v.value ?? "")} onChange={(e) => onChange(e.target.value)} />
  return (
    <Input
      type="number"
      step="any"
      value={v.value === null || v.value === undefined ? "" : String(v.value)}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
    />
  )
}

/** Create or edit one field. Key and type are fixed once created (D-130). */
export function FieldDialog({
  open,
  node,
  field,
  tree,
  canDeleteOptions,
  onClose,
  onSaved,
  onDeleteOption,
}: {
  open: boolean
  node: AttributeNode | null
  /** null = create. */
  field: AttributeField | null
  tree: AttributeTree
  canDeleteOptions: boolean
  onClose: () => void
  onSaved: () => void
  onDeleteOption: (field: AttributeField, option: string) => void
}) {
  const [f, setF] = useState<AttributeField>(() => (field ? (JSON.parse(JSON.stringify(field)) as AttributeField) : blankField()))
  const [keyTouched, setKeyTouched] = useState(!!field)
  const [busy, setBusy] = useState(false)
  const creating = field === null
  const locked = !!field?.locked
  const existingOptions = new Set(field?.options.map((o) => o.key) ?? [])

  const set = (patch: Partial<AttributeField>) => setF((cur) => ({ ...cur, ...patch }))
  const kinds = Object.entries(tree.validationKinds)
    .filter(([, types]) => types.includes(f.type))
    .map(([k]) => k)
  const numericPaths = numericFieldPaths(tree)
  const hasUnit = f.type === "number" || f.type === "range"
  const hasOptions = f.type === "pick" || f.type === "multi"

  const save = async () => {
    if (!node) return
    setBusy(true)
    try {
      if (creating) await api.createField(node.key, node.version, f)
      else await api.updateField(node.key, node.version, f)
      toast.success(creating ? "Field added" : "Field saved")
      onSaved()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {creating ? `New field on ${node?.name}` : `Edit ${field?.name}`}
            {locked && <span className="ml-2 text-xs font-normal text-muted-foreground">(system field — name, description and order only)</span>}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormRow label="Name" required>
            <Input
              value={f.name}
              onChange={(e) => {
                set({ name: e.target.value })
                if (!keyTouched) set({ key: slugKey(e.target.value) })
              }}
            />
          </FormRow>
          <FormRow label="Key" required hint={creating ? "Can't be changed later." : undefined}>
            <Input
              value={f.key}
              disabled={!creating}
              className="font-mono"
              onChange={(e) => {
                setKeyTouched(true)
                set({ key: e.target.value })
              }}
            />
          </FormRow>
          <FormRow label="Description" className="sm:col-span-2">
            <Textarea rows={2} value={f.description} onChange={(e) => set({ description: e.target.value })} />
          </FormRow>
          <FormRow label="Type" hint={creating ? "Can't be changed later." : undefined}>
            <NativeSelect
              value={f.type}
              disabled={!creating}
              onChange={(t) => set({ type: t as FieldType, unit: null, options: [], ratio: null, validations: [] })}
              options={FIELD_TYPES.map((t) => ({ value: t, label: FIELD_TYPE_LABELS[t] }))}
            />
          </FormRow>
          <div className="flex flex-col justify-end gap-2">
            {f.type !== "ratio" && (
              <Checkbox checked={f.required} disabled={locked} onChange={(required) => set({ required })} label="Required to submit" />
            )}
            <Checkbox checked={f.public} disabled={locked} onChange={(p) => set({ public: p })} label="Shown on the public listing" />
          </div>

          {hasUnit && (
            <FormRow label="Unit" className="sm:col-span-2" hint="Values are stored in the family's standard unit; editors can type any allowed unit.">
              <div className="flex flex-wrap items-center gap-3">
                <NativeSelect
                  value={f.unit?.family ?? ""}
                  disabled={locked}
                  placeholder="No unit"
                  onChange={(fam) => set({ unit: fam ? { family: fam as UnitFamily, input: [] } : null })}
                  options={Object.entries(UNIT_FAMILIES).map(([k, v]) => ({ value: k, label: `${v.label}${v.canonical ? ` (${unitLabel(v.canonical)})` : ""}` }))}
                />
                {f.unit &&
                  UNIT_FAMILIES[f.unit.family].units.length > 1 &&
                  UNIT_FAMILIES[f.unit.family].units.map((u) => (
                    <Checkbox
                      key={u}
                      label={unitLabel(u)}
                      disabled={locked}
                      checked={f.unit!.input.length === 0 || f.unit!.input.includes(u)}
                      onChange={(on) => {
                        const all = UNIT_FAMILIES[f.unit!.family].units
                        const cur = f.unit!.input.length ? f.unit!.input : all
                        const next = on ? [...cur, u] : cur.filter((x) => x !== u)
                        set({ unit: { family: f.unit!.family, input: next.length === all.length ? [] : next } })
                      }}
                    />
                  ))}
              </div>
            </FormRow>
          )}

          {hasOptions && (
            <FormRow label="Options" className="sm:col-span-2">
              <div className="flex flex-col gap-2">
                {f.options.map((o, i) => {
                  const existing = existingOptions.has(o.key)
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={o.label}
                        disabled={locked}
                        placeholder="Label"
                        onChange={(e) => {
                          const options = [...f.options]
                          options[i] = { ...o, label: e.target.value, key: existing ? o.key : slugKey(e.target.value) }
                          set({ options })
                        }}
                      />
                      <Input value={o.key} disabled className="w-40 font-mono text-xs" />
                      {existing ? (
                        canDeleteOptions && field ? (
                          <Button size="icon-sm" variant="ghost" aria-label="Delete option" onClick={() => onDeleteOption(field, o.key)}>
                            <Trash2 />
                          </Button>
                        ) : (
                          <span className="w-8" />
                        )
                      ) : (
                        <Button size="icon-sm" variant="ghost" aria-label="Remove" onClick={() => set({ options: f.options.filter((_, j) => j !== i) })}>
                          <X />
                        </Button>
                      )}
                    </div>
                  )
                })}
                {!locked && (
                  <Button size="sm" variant="outline" className="self-start" onClick={() => set({ options: [...f.options, { key: "", label: "", order: f.options.length + 1 }] })}>
                    <Plus /> Add option
                  </Button>
                )}
              </div>
            </FormRow>
          )}

          {f.type === "ratio" && (
            <FormRow label="Calculation" className="sm:col-span-2" hint="Top ÷ (bottom ÷ per). E.g. docks per 10,000 sq ft.">
              <div className="grid gap-2 sm:grid-cols-2">
                <NativeSelect
                  value={f.ratio?.top ?? ""}
                  placeholder="Top (numerator)"
                  disabled={locked}
                  onChange={(top) => set({ ratio: { top, bottom: f.ratio?.bottom ?? "", per: f.ratio?.per ?? 1, bottomUnit: f.ratio?.bottomUnit ?? "" } })}
                  options={numericPaths.map((p) => ({ value: p.path, label: p.label }))}
                />
                <NativeSelect
                  value={f.ratio?.bottom ?? ""}
                  placeholder="Bottom (denominator)"
                  disabled={locked}
                  onChange={(bottom) => set({ ratio: { top: f.ratio?.top ?? "", bottom, per: f.ratio?.per ?? 1, bottomUnit: f.ratio?.bottomUnit ?? "" } })}
                  options={numericPaths.map((p) => ({ value: p.path, label: p.label }))}
                />
                <Input
                  type="number"
                  placeholder="Per"
                  value={f.ratio?.per ?? ""}
                  disabled={locked}
                  onChange={(e) => set({ ratio: { top: f.ratio?.top ?? "", bottom: f.ratio?.bottom ?? "", per: Number(e.target.value) || 0, bottomUnit: f.ratio?.bottomUnit ?? "" } })}
                />
                <Input
                  placeholder="Bottom unit (e.g. sqft) — optional"
                  value={f.ratio?.bottomUnit ?? ""}
                  disabled={locked}
                  onChange={(e) => set({ ratio: { top: f.ratio?.top ?? "", bottom: f.ratio?.bottom ?? "", per: f.ratio?.per ?? 1, bottomUnit: e.target.value } })}
                />
              </div>
            </FormRow>
          )}

          {kinds.length > 0 && (
            <FormRow label="Validations" className="sm:col-span-2">
              <div className="flex flex-col gap-2">
                {f.validations.map((v, i) => (
                  <div key={i} className="grid items-center gap-2 sm:grid-cols-[150px_1fr_1fr_auto]">
                    <NativeSelect
                      value={v.kind}
                      disabled={locked}
                      onChange={(kind) => {
                        const validations = [...f.validations]
                        validations[i] = { kind, value: null, message: v.message }
                        set({ validations })
                      }}
                      options={kinds.map((k) => ({ value: k, label: VALIDATION_LABELS[k] ?? k }))}
                    />
                    <ValidationValue
                      v={v}
                      onChange={(value) => {
                        const validations = [...f.validations]
                        validations[i] = { ...v, value }
                        set({ validations })
                      }}
                    />
                    <Input
                      placeholder="Error message (optional)"
                      value={v.message}
                      onChange={(e) => {
                        const validations = [...f.validations]
                        validations[i] = { ...v, message: e.target.value }
                        set({ validations })
                      }}
                    />
                    <Button size="icon-sm" variant="ghost" disabled={locked} onClick={() => set({ validations: f.validations.filter((_, j) => j !== i) })}>
                      <X />
                    </Button>
                  </div>
                ))}
                {!locked && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="self-start"
                    onClick={() => set({ validations: [...f.validations, { kind: kinds[0], value: null, message: "" }] })}
                  >
                    <Plus /> Add validation
                  </Button>
                )}
              </div>
            </FormRow>
          )}

          <FormRow label="Search filter" className="sm:col-span-2" hint="Filterable fields appear as chips (yes/no, options) or min–max boxes (numbers) on the public search.">
            <div className="flex flex-wrap items-center gap-3">
              <Checkbox checked={f.filterable} disabled={locked} onChange={(filterable) => set({ filterable })} label="Filterable" />
              {f.filterable && (
                <>
                  <Input className="w-44" placeholder="Filter row (group)" value={f.filterRow} disabled={locked} onChange={(e) => set({ filterRow: e.target.value })} />
                  <Input
                    className="w-24"
                    type="number"
                    placeholder="Position"
                    value={f.filterPos || ""}
                    disabled={locked}
                    onChange={(e) => set({ filterPos: Number(e.target.value) || 0 })}
                  />
                </>
              )}
            </div>
          </FormRow>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={busy || !f.name.trim() || !f.key.trim()} onClick={save}>
            {busy ? "Saving…" : creating ? "Add field" : "Save field"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
