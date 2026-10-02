"use client"

import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AttributeField, AttributeNode, AttributeTree } from "@/features/attributes"
import type { FieldValue, GeoLocation, ListingAttributes, NodeEntry, NodeStatus, Preview } from "../entities/catalog.entity"
import { isBlank } from "../lib/content"
import { FieldInput } from "./field-input"

const STATUS_OPTIONS: { value: NodeStatus; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unknown", label: "Don't know" },
]

function StatusToggle({ value, onChange, disabled }: { value: NodeStatus; onChange: (s: NodeStatus) => void; disabled?: boolean }) {
  return (
    <div className="inline-flex rounded-full bg-muted p-0.5 text-xs">
      {STATUS_OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full px-3 py-1 transition-colors disabled:cursor-not-allowed",
            value === o.value
              ? o.value === "yes"
                ? "bg-green-600 text-white"
                : o.value === "unknown"
                  ? "bg-amber-500 text-white"
                  : "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

interface FormCtx {
  tree: AttributeTree
  attributes: ListingAttributes
  preview: Preview | null
  disabled: boolean
  setStatus: (node: string, status: NodeStatus) => void
  setField: (node: string, field: string, v: FieldValue | null) => void
  onGeocode?: () => Promise<GeoLocation | null>
  /** Show "required" hints (after a blocked submit). */
  showRequired: boolean
}

function FieldRow({ ctx, node, field, entry }: { ctx: FormCtx; node: AttributeNode; field: AttributeField; entry: NodeEntry | undefined }) {
  const value = entry?.fields[field.key] ?? null
  const missing = field.required && field.type !== "ratio" && isBlank(value)
  return (
    <div className="grid gap-1.5 sm:grid-cols-[200px_1fr] sm:items-start sm:gap-4">
      <div className="flex flex-col pt-1.5">
        <span className="text-sm">
          {field.name}
          {field.required && <span className="ml-0.5 text-destructive">*</span>}
        </span>
        {field.description && <span className="text-xs text-muted-foreground">{field.description}</span>}
        {!field.public && <span className="text-[10px] tracking-wider text-muted-foreground uppercase">staff only</span>}
      </div>
      <div className="flex flex-col gap-1">
        <FieldInput
          field={field}
          value={value}
          disabled={ctx.disabled}
          ratio={ctx.preview?.ratios[`${node.key}.${field.key}`]}
          onGeocode={field.type === "location" ? ctx.onGeocode : undefined}
          onChange={(v) => ctx.setField(node.key, field.key, v)}
        />
        {missing && ctx.showRequired && <span className="text-xs text-destructive">Required before submitting</span>}
      </div>
    </div>
  )
}

function NodeSection({ ctx, node }: { ctx: FormCtx; node: AttributeNode }) {
  const entry = ctx.attributes[node.key]
  const status: NodeStatus = entry?.status ?? "no"
  const needs = ctx.preview?.needsInfo.some((k) => k === node.key || k.startsWith(`${node.key}.`))
  return (
    <div className={cn("flex flex-col gap-3 rounded-2xl border border-border p-4", status === "yes" && "bg-card", status === "unknown" && "border-amber-500/40")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            {node.name}
            {needs && <AlertCircle className="size-3.5 text-amber-500" />}
          </span>
          {node.description && <span className="text-xs text-muted-foreground">{node.description}</span>}
        </div>
        <StatusToggle value={status} disabled={ctx.disabled} onChange={(s) => ctx.setStatus(node.key, s)} />
      </div>
      {status === "yes" && (
        <>
          {node.fields.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-border pt-3">
              {node.fields.map((f) => (
                <FieldRow key={f.key} ctx={ctx} node={node} field={f} entry={entry} />
              ))}
            </div>
          )}
          {node.children.length > 0 && (
            <div className="flex flex-col gap-2 border-l-2 border-border pl-3">
              {node.children.map((c) => (
                <NodeSection key={c.key} ctx={ctx} node={c} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/**
 * The listing form, generated from the attribute tree: the Warehouse root's
 * fields, then every node as yes / no / don't know with its fields and child
 * nodes when yes (spec 08).
 */
export function AttributeForm(props: {
  tree: AttributeTree
  attributes: ListingAttributes
  preview: Preview | null
  disabled: boolean
  showRequired: boolean
  onChange: (a: ListingAttributes) => void
  onGeocode?: () => Promise<GeoLocation | null>
}) {
  const { tree, attributes, onChange } = props
  const root = tree.root
  if (!root) return <p className="text-sm text-muted-foreground">The attribute tree is empty.</p>

  const ctx: FormCtx = {
    ...props,
    setStatus: (node, status) => {
      const next = { ...attributes }
      if (status === "no") delete next[node]
      else if (status === "unknown") next[node] = { status: "unknown", fields: next[node]?.fields ?? {} }
      else next[node] = { status: "yes", fields: next[node]?.fields ?? {} }
      onChange(next)
    },
    setField: (node, field, v) => {
      const cur = attributes[node] ?? { status: "yes" as const, fields: {} }
      onChange({ ...attributes, [node]: { ...cur, fields: { ...cur.fields, [field]: v } } })
    },
  }
  const rootEntry = attributes[root.key]

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
        {root.fields.map((f) => (
          <FieldRow key={f.key} ctx={ctx} node={root} field={f} entry={rootEntry} />
        ))}
      </section>
      {root.children.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Facilities</h3>
          <p className="text-xs text-muted-foreground">Mark what this warehouse has. &ldquo;Don&apos;t know&rdquo; flags it for follow-up in Needs info.</p>
          {root.children.map((c) => (
            <NodeSection key={c.key} ctx={ctx} node={c} />
          ))}
        </section>
      )}
    </div>
  )
}

/**
 * Drops entries the backend would refuse: nodes under a parent that isn't
 * yes (kept locally while editing so a mis-click is reversible) and field
 * values of unknown nodes.
 */
export function pruneAttributes(tree: AttributeTree, a: ListingAttributes): ListingAttributes {
  const out: ListingAttributes = {}
  const walk = (node: AttributeNode, parentYes: boolean) => {
    const e = a[node.key]
    const isRoot = node.parentKey === ""
    if (isRoot) out[node.key] = { status: "yes", fields: e?.fields ?? {} }
    else if (parentYes && e) out[node.key] = e.status === "unknown" ? { status: "unknown", fields: {} } : e
    const yes = isRoot || (parentYes && e?.status === "yes")
    node.children.forEach((c) => walk(c, yes))
  }
  if (tree.root) walk(tree.root, true)
  return out
}
