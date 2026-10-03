"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Search, Sparkles } from "lucide-react"
import { Button, Input, Textarea } from "@/components/ui"
import { env } from "@/core/config/env"
import { useSiteFeature } from "@/features/users"
import { cn } from "@/lib/utils"

/**
 * The home page search: a location (city, area or 6-digit pincode) and, when
 * AI search is on, a plain-language description ("10,000 sq ft cold storage
 * near Bhiwandi under ₹30/sq ft").
 */
export function SearchBox({ className }: { className?: string }) {
  const router = useRouter()
  const canAI = useSiteFeature("ai_search")
  const aiEnabled = env.aiSearchEnabled && canAI
  const [mode, setMode] = useState<"simple" | "ai">(aiEnabled ? "ai" : "simple")
  const [place, setPlace] = useState("")
  const [text, setText] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const p = new URLSearchParams()
    if (place.trim()) p.set("q", place.trim())
    if (mode === "ai" && text.trim()) p.set("ai", text.trim())
    router.push(`/search${p.toString() ? `?${p}` : ""}`)
  }

  return (
    <form onSubmit={submit} className={cn("flex flex-col gap-3 rounded-3xl border border-border bg-card p-4 shadow-sm", className)}>
      {aiEnabled && (
        <div className="flex gap-1 self-start rounded-full bg-muted p-1 text-xs">
          <button
            type="button"
            onClick={() => setMode("ai")}
            className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1", mode === "ai" ? "bg-background shadow-sm" : "text-muted-foreground")}
          >
            <Sparkles className="size-3.5" /> Describe it
          </button>
          <button
            type="button"
            onClick={() => setMode("simple")}
            className={cn("rounded-full px-3 py-1", mode === "simple" ? "bg-background shadow-sm" : "text-muted-foreground")}
          >
            By location
          </button>
        </div>
      )}
      {mode === "ai" && (
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="e.g. 20,000 sq ft warehouse with cold storage and 2 loading docks, under ₹30 per sq ft"
          className="resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              e.currentTarget.form?.requestSubmit()
            }
          }}
        />
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="City, area or pincode" className="h-11 pl-9" />
        </div>
        <Button type="submit" size="lg" className="h-11 px-6">
          <Search />
          Search
        </Button>
      </div>
    </form>
  )
}
