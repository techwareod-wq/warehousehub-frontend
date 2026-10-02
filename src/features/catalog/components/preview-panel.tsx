"use client"

import { AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react"
import { pathLabel, type AttributeTree } from "@/features/attributes"
import { SAVE_WARNINGS, type Preview, type Verdict } from "../entities/catalog.entity"
import { VerdictBadge } from "./badges"

/** The evaluator's verdict on the draft: what's missing, what blocks submit, industry fit. */
export function PreviewPanel({
  tree,
  preview,
  warnings,
  industryNames,
}: {
  tree: AttributeTree
  preview: Preview | null
  warnings: string[]
  industryNames: Record<string, string>
}) {
  if (!preview && warnings.length === 0) return <p className="text-xs text-muted-foreground">Save the draft to see what&apos;s missing and how it fits each industry.</p>
  const fit = Object.entries(preview?.fit ?? {}) as [string, Verdict][]
  return (
    <div className="flex flex-col gap-4 text-sm">
      {warnings.map((w) => (
        <p key={w} className="flex gap-2 rounded-xl bg-amber-500/10 p-2.5 text-xs">
          <AlertTriangle className="size-4 shrink-0 text-amber-600" /> {SAVE_WARNINGS[w] ?? w}
        </p>
      ))}
      {preview && (
        <>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium">Before submitting</span>
            {preview.submitProblems.length === 0 ? (
              <p className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400">
                <CheckCircle2 className="size-3.5" /> Ready to submit
              </p>
            ) : (
              <ul className="flex flex-col gap-1 text-xs text-destructive">
                {preview.submitProblems.map((p) => (
                  <li key={p}>• {p}</li>
                ))}
              </ul>
            )}
          </div>
          {preview.needsInfo.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium">Needs info</span>
              <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
                {preview.needsInfo.map((k) => (
                  <li key={k} className="flex items-center gap-1.5">
                    <HelpCircle className="size-3 text-amber-500" /> {pathLabel(tree, k)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {fit.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium">Industry fit</span>
              <div className="flex flex-wrap gap-1.5">
                {fit.map(([k, v]) => (
                  <VerdictBadge key={k} verdict={v} label={industryNames[k] ?? k} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
