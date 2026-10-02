"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Badge, Button } from "@/components/ui"
import { EmptyState, ErrorState, LoadingRows, PageHeader, Pager } from "@/components/common"
import { browserApi, errorMessage } from "@/core/api"
import { useLoad } from "@/core/hooks/use-load"
import { useUrlState } from "@/core/hooks/use-url-state"
import { useAccess } from "@/features/access"
import { attributesApi, findField, type AttributeTree } from "@/features/attributes"
import { cn } from "@/lib/utils"
import { catalogApi } from "../api/catalog.api"
import type { AnswerItem, FieldValue, NeedsInfoAnswer, NeedsInfoKey, NeedsInfoWarehouse } from "../entities/catalog.entity"
import { isBlank } from "../lib/content"
import { FieldInput } from "./field-input"

const api = catalogApi(browserApi)
const attrs = attributesApi(browserApi)

interface RowAnswer {
  status?: "yes" | "no"
  fields: Record<string, FieldValue | null>
}

function AnswerRow({
  tree,
  item,
  w,
  answer,
  result,
  disabled,
  onChange,
}: {
  tree: AttributeTree
  item: NeedsInfoKey
  w: NeedsInfoWarehouse
  answer: RowAnswer | undefined
  result: AnswerItem | undefined
  disabled: boolean
  onChange: (a: RowAnswer | undefined) => void
}) {
  const inReview = w.openRevision?.state === "in_review"
  const a = answer ?? { fields: {} }
  const nodeKey = item.kind === "node" ? item.key : item.key.split(".")[0]
  const node = tree.byKey[nodeKey]
  const fieldsToAsk =
    item.kind === "field" ? [findField(tree, item.key)?.field].filter((f) => !!f) : a.status === "yes" ? (node?.fields.filter((f) => f.required) ?? []) : []

  return (
    <li className={cn("flex flex-col gap-3 rounded-2xl border border-border p-3", inReview && "opacity-60")}>
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/admin/warehouses/${w.id}`} className="font-medium hover:underline">
          {w.name || "Untitled"}
        </Link>
        {w.city && <span className="text-sm text-muted-foreground">{w.city}</span>}
        {w.openRevision && <Badge variant="outline">{w.openRevision.state === "in_review" ? "In review — skipped" : "Has a draft"}</Badge>}
        {result && (
          <Badge variant={result.ok ? "secondary" : "destructive"}>
            {result.ok ? (result.submitted ? "Saved & submitted" : "Saved to draft") : result.error || result.code}
          </Badge>
        )}
        {item.kind === "node" && (
          <div className="ml-auto inline-flex rounded-full bg-muted p-0.5 text-xs">
            {(["yes", "no"] as const).map((s) => (
              <button
                key={s}
                type="button"
                disabled={disabled || inReview}
                onClick={() => onChange(a.status === s ? undefined : { ...a, status: s })}
                className={cn(
                  "rounded-full px-3 py-1 capitalize",
                  a.status === s ? (s === "yes" ? "bg-green-600 text-white" : "bg-background shadow-sm") : "text-muted-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      {fieldsToAsk.length > 0 && !inReview && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          {fieldsToAsk.map((f) => (
            <div key={f.key} className="grid gap-1.5 sm:grid-cols-[180px_1fr] sm:items-center">
              <span className="text-sm">
                {f.name}
                {f.required && <span className="text-destructive">*</span>}
              </span>
              <FieldInput
                field={f}
                value={a.fields[f.key] ?? null}
                disabled={disabled}
                onChange={(v) => onChange({ ...a, fields: { ...a.fields, [f.key]: v } })}
              />
            </div>
          ))}
        </div>
      )}
    </li>
  )
}

/**
 * Needs info (D-039): unknown nodes and missing required fields on live
 * listings, answered inline in bulk. Answers land in each listing's draft and
 * go through review like any edit.
 */
export function NeedsInfo() {
  const access = useAccess()
  const [{ key }, setUrl, page] = useUrlState(["key"] as const)
  const [answers, setAnswers] = useState<Record<string, RowAnswer>>({})
  const [results, setResults] = useState<Record<string, AnswerItem>>({})
  const [busy, setBusy] = useState(false)

  const base = useLoad(async () => {
    const [tree, summary] = await Promise.all([attrs.tree(), api.needsInfoSummary()])
    return { tree, summary }
  }, [])
  const list = useLoad(() => (key ? api.needsInfoList(key, page) : Promise.resolve(null)), [key, page])

  const [listFor, setListFor] = useState(`${key}:${page}`)
  if (listFor !== `${key}:${page}`) {
    setListFor(`${key}:${page}`)
    setAnswers({})
    setResults({})
  }

  const item = base.data?.summary.find((s) => s.key === key)

  const toAnswers = (): NeedsInfoAnswer[] | string => {
    if (!item || !base.data) return []
    const out: NeedsInfoAnswer[] = []
    for (const [warehouseId, a] of Object.entries(answers)) {
      if (item.kind === "node") {
        if (!a.status) continue
        if (a.status === "no") {
          out.push({ warehouseId, node: item.key, status: "no" })
          continue
        }
        const required = base.data.tree.byKey[item.key]?.fields.filter((f) => f.required) ?? []
        if (required.some((f) => isBlank(a.fields[f.key]))) return "Fill every required field for the listings you marked yes."
        out.push({ warehouseId, node: item.key, status: "yes", fields: a.fields })
      } else {
        const [node, field] = item.key.split(".")
        if (isBlank(a.fields[field])) continue
        out.push({ warehouseId, node, fields: { [field]: a.fields[field] } })
      }
    }
    return out
  }

  const submit = async (andSubmit: boolean) => {
    const items = toAnswers()
    if (typeof items === "string") return toast.error(items)
    if (items.length === 0) return toast.error("Answer at least one listing first.")
    setBusy(true)
    try {
      const res = await api.answerNeedsInfo(items, andSubmit)
      setResults(Object.fromEntries(res.items.map((i) => [i.warehouseId, i])))
      const failed = res.items.filter((i) => !i.ok).length
      if (failed) toast.error(`${res.items.length - failed} saved, ${failed} failed`)
      else toast.success(andSubmit ? "Saved and sent for review" : "Saved to drafts")
      setAnswers({})
      base.reload()
      list.reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Needs info" description="Gaps on live listings: facilities nobody has confirmed, and required details that are missing." />
      {base.status === "error" && !base.data ? (
        <ErrorState error={base.error} onRetry={base.reload} />
      ) : !base.data ? (
        <LoadingRows />
      ) : base.data.summary.length === 0 ? (
        <EmptyState title="Nothing missing" body="Every live listing is fully answered." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <ul className="flex flex-col gap-1">
            {base.data.summary.map((s) => (
              <li key={s.key}>
                <button
                  onClick={() => setUrl({ key: s.key })}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-muted",
                    key === s.key && "bg-muted font-medium",
                  )}
                >
                  <span className="flex flex-col">
                    <span>{s.name}</span>
                    <span className="text-[11px] text-muted-foreground">{s.kind === "node" ? "Unconfirmed facility" : "Missing required field"}</span>
                  </span>
                  <Badge variant="secondary">{s.count}</Badge>
                </button>
              </li>
            ))}
          </ul>
          <section className="flex min-w-0 flex-col gap-3">
            {!item ? (
              <EmptyState title="Pick a gap on the left" body="You'll get every listing with that gap, ready to answer in one go." />
            ) : list.status === "error" && !list.data ? (
              <ErrorState error={list.error} onRetry={list.reload} />
            ) : !list.data ? (
              <LoadingRows />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold">{item.name}</h2>
                  {access.can.editor && (
                    <div className="flex gap-2">
                      <Button variant="outline" disabled={busy} onClick={() => submit(false)}>
                        Save to drafts
                      </Button>
                      <Button disabled={busy} onClick={() => submit(true)}>
                        Save & submit all
                      </Button>
                    </div>
                  )}
                </div>
                <ul className="flex flex-col gap-2">
                  {list.data.items.map((w) => (
                    <AnswerRow
                      key={w.id}
                      tree={base.data!.tree}
                      item={item}
                      w={w}
                      answer={answers[w.id]}
                      result={results[w.id]}
                      disabled={!access.can.editor || busy}
                      onChange={(a) =>
                        setAnswers((all) => {
                          const next = { ...all }
                          if (a) next[w.id] = a
                          else delete next[w.id]
                          return next
                        })
                      }
                    />
                  ))}
                </ul>
                <Pager page={list.data.page} pages={list.data.pages} total={list.data.total} onPage={(p) => setUrl({ page: String(p) })} />
              </>
            )}
          </section>
        </div>
      )}
    </>
  )
}
