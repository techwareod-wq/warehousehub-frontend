import { cn } from "@/lib/utils"

type Flat = Record<string, unknown>

/** Flattens nested objects/arrays into "a.b[0].c" → leaf value. */
export function flatten(value: unknown, prefix = "", out: Flat = {}): Flat {
  if (value === null || value === undefined) {
    if (prefix) out[prefix] = value ?? null
    return out
  }
  if (Array.isArray(value)) {
    if (value.length === 0 && prefix) out[prefix] = []
    value.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out))
    return out
  }
  if (typeof value === "object" && !(value instanceof Date)) {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0 && prefix) out[prefix] = {}
    for (const [k, v] of entries) flatten(v, prefix ? `${prefix}.${k}` : k, out)
    return out
  }
  out[prefix] = value
  return out
}

export interface DiffRow {
  path: string
  kind: "added" | "removed" | "changed"
  before?: unknown
  after?: unknown
}

export function diff(before: unknown, after: unknown): DiffRow[] {
  const a = flatten(before)
  const b = flatten(after)
  const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)])).sort()
  const rows: DiffRow[] = []
  for (const k of keys) {
    const inA = k in a
    const inB = k in b
    if (inA && !inB) rows.push({ path: k, kind: "removed", before: a[k] })
    else if (!inA && inB) rows.push({ path: k, kind: "added", after: b[k] })
    else if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) rows.push({ path: k, kind: "changed", before: a[k], after: b[k] })
  }
  return rows
}

function show(v: unknown): string {
  if (v === undefined) return ""
  if (typeof v === "string") return v
  return JSON.stringify(v)
}

/** Path-by-path before → after table. */
export function JsonDiff({ before, after, emptyLabel = "No differences." }: { before: unknown; after: unknown; emptyLabel?: string }) {
  const rows = diff(before, after)
  if (rows.length === 0) return <p className="text-xs text-muted-foreground">{emptyLabel}</p>
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-xs">
        <thead className="bg-muted/50 text-left text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Path</th>
            <th className="px-3 py-2 font-medium">Before</th>
            <th className="px-3 py-2 font-medium">After</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.path} className="border-t border-border align-top">
              <td className="px-3 py-1.5 font-mono break-all">{r.path}</td>
              <td className={cn("px-3 py-1.5 font-mono break-all", r.kind !== "added" && "bg-red-500/5 text-red-700 dark:text-red-400")}>
                {show(r.before)}
              </td>
              <td className={cn("px-3 py-1.5 font-mono break-all", r.kind !== "removed" && "bg-green-500/5 text-green-700 dark:text-green-400")}>
                {show(r.after)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
