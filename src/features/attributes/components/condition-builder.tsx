"use client"

import { Plus, X } from "lucide-react"
import { Button, Input } from "@/components/ui"
import { NativeSelect } from "@/components/common"
import { sqftToSqm, sqmToSqft, unitLabel, UNIT_FAMILIES } from "@/lib/units"
import { COMPARATOR_LABELS, type AttributeField, type AttributeTree, type Comparator, type Condition } from "../entities/attributes.entity"
import { comparatorsFor, conditionableFields } from "../lib/tree"

function ValueInput({ field, cond, onChange }: { field: AttributeField; cond: Condition; onChange: (v: unknown) => void }) {
  if (field.type === "bool") {
    return (
      <NativeSelect
        value={cond.value === true ? "true" : cond.value === false ? "false" : ""}
        placeholder="Choose…"
        onChange={(v) => onChange(v === "true")}
        options={[
          { value: "true", label: "Yes" },
          { value: "false", label: "No" },
        ]}
      />
    )
  }
  if (field.type === "pick" && cond.cmp === "eq") {
    return (
      <NativeSelect
        value={typeof cond.value === "string" ? cond.value : ""}
        placeholder="Choose…"
        onChange={onChange}
        options={field.options.map((o) => ({ value: o.key, label: o.label }))}
      />
    )
  }
  if (field.type === "pick" || field.type === "multi") {
    const picked = Array.isArray(cond.value) ? (cond.value as string[]) : typeof cond.value === "string" && cond.value ? [cond.value] : []
    const single = cond.cmp === "contains"
    return (
      <div className="flex flex-wrap gap-1">
        {field.options.map((o) => {
          const on = picked.includes(o.key)
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => {
                if (single) return onChange(o.key)
                onChange(on ? picked.filter((k) => k !== o.key) : [...picked, o.key])
              }}
              className={`rounded-full border px-2.5 py-0.5 text-xs ${on ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    )
  }
  // Numbers are stored canonical (sq m for area); area is edited in sq ft.
  const isArea = field.type === "area"
  const unit = isArea ? "sq ft" : field.unit ? unitLabel(UNIT_FAMILIES[field.unit.family]?.canonical) : ""
  const shown = typeof cond.value === "number" ? (isArea ? Math.round(sqmToSqft(cond.value)) : cond.value) : ""
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        step="any"
        className="w-32"
        value={shown}
        onChange={(e) => {
          if (e.target.value === "") return onChange(null)
          const n = Number(e.target.value)
          onChange(isArea ? sqftToSqm(n) : n)
        }}
      />
      {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
    </div>
  )
}

/** Industry rules (D-141): "node is yes" or "node.field <cmp> value". */
export function ConditionBuilder({ tree, value, onChange }: { tree: AttributeTree; value: Condition[]; onChange: (c: Condition[]) => void }) {
  const set = (i: number, patch: Partial<Condition>) => onChange(value.map((c, j) => (j === i ? { ...c, ...patch } : c)))
  return (
    <div className="flex flex-col gap-2">
      {value.map((c, i) => {
        const node = tree.byKey[c.node]
        const field = node?.fields.find((f) => f.key === c.field) ?? null
        const cmps = comparatorsFor(field ? field.type : null)
        return (
          <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-2">
            <NativeSelect
              value={c.node}
              placeholder="Node…"
              onChange={(nodeKey) => set(i, { node: nodeKey, field: "", cmp: "is_yes", value: null })}
              options={tree.nodes.filter((n) => n.parentKey !== "").map((n) => ({ value: n.key, label: `${"— ".repeat(Math.max(0, n.depth - 1))}${n.name}` }))}
            />
            {node && (
              <NativeSelect
                value={c.field}
                onChange={(fk) => {
                  const f = node.fields.find((x) => x.key === fk)
                  set(i, { field: fk, cmp: comparatorsFor(f ? f.type : null)[0] as Comparator, value: null })
                }}
                options={[{ value: "", label: "(the node itself)" }, ...conditionableFields(node).map((f) => ({ value: f.key, label: f.name }))]}
              />
            )}
            <NativeSelect
              value={c.cmp}
              onChange={(cmp) => set(i, { cmp: cmp as Comparator, value: null })}
              options={cmps.map((k) => ({ value: k, label: COMPARATOR_LABELS[k] }))}
            />
            {field && c.cmp !== "is_yes" && <ValueInput field={field} cond={c} onChange={(v) => set(i, { value: v })} />}
            <Button size="icon-sm" variant="ghost" className="ml-auto" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove rule">
              <X />
            </Button>
          </div>
        )
      })}
      <Button size="sm" variant="outline" className="self-start" onClick={() => onChange([...value, { node: "", field: "", cmp: "is_yes", value: null }])}>
        <Plus /> Add rule
      </Button>
    </div>
  )
}
