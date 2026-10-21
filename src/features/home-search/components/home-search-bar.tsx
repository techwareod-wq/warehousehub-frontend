"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { ArrowRight, Loader2, Search } from "lucide-react"
import { GlassButton, GlassInput, glassSurface } from "@/components/glass"
import { useSiteFeature } from "@/features/users"
import { cn } from "@/lib/utils"
import { aiSearchHref, MAX_QUERY_CHARS } from "../lib/examples"
import { useRotatingExample } from "../lib/use-rotating-example"
import "../home-search.css"

/**
 * The home hero's natural-language search bar. It only navigates: the
 * /search page runs the AI search for its `ai` param. Signed-out visitors
 * go through Clerk's sign-in and come back to the same /search URL.
 */
export function HomeSearchBar() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  // /search itself needs the search feature; the AI run needs ai_search on top.
  const canSearch = useSiteFeature("search")
  const canAI = useSiteFeature("ai_search")
  const inputRef = useRef<HTMLInputElement>(null)

  const [value, setValue] = useState("")
  const [focused, setFocused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [shake, setShake] = useState(false)
  const [notice, setNotice] = useState(false)
  const [pending, startTransition] = useTransition()

  const empty = value === ""
  const { current, previous, tick } = useRotatingExample(empty && !focused && !hovered)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const text = value.trim()
    if (!text) {
      setShake(true)
      inputRef.current?.focus()
      return
    }
    const href = aiSearchHref(text)
    if (isLoaded && !isSignedIn) {
      // Clerk's <SignIn /> sends the visitor to redirect_url once they're in.
      const back = new URL(href, window.location.origin).toString()
      startTransition(() => router.push(`/sign-in?redirect_url=${encodeURIComponent(back)}`))
      return
    }
    if (!canSearch || !canAI) {
      setNotice(true)
      return
    }
    startTransition(() => router.push(href))
  }

  return (
    <div className="flex w-full flex-col items-center">
      <form
        role="search"
        onSubmit={onSubmit}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onAnimationEnd={(e) => e.animationName === "hs-shake" && setShake(false)}
        data-shake={shake || undefined}
        className="hs-form relative w-full max-w-[720px]"
      >
        <GlassInput
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setNotice(false)
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={MAX_QUERY_CHARS}
          aria-label="Describe the warehouse you need"
          autoComplete="off"
          enterKeyHint="search"
          className="hs-input h-14 rounded-full pr-16 pl-12 text-left text-base sm:h-16 sm:pr-[4.5rem] sm:pl-14 sm:text-lg"
        />
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4.5 size-5 -translate-y-1/2 text-glass-text-3 sm:left-5" />
        {empty && (
          <span
            aria-hidden
            className={cn("hs-ph pointer-events-none absolute inset-y-0 right-16 left-12 overflow-hidden text-left sm:right-[4.5rem] sm:left-14", focused && "hs-ph-dim")}
          >
            {previous && (
              <span key={`out-${tick}`} className="hs-ph-line hs-ph-out">
                {previous}
              </span>
            )}
            <span key={`in-${tick}`} className={cn("hs-ph-line", previous && "hs-ph-in")}>
              {current}
            </span>
          </span>
        )}
        <GlassButton
          type="submit"
          variant="primary"
          size="icon"
          aria-label="Search"
          aria-busy={pending || undefined}
          disabled={pending}
          className="absolute top-1/2 right-1.5 size-11 -translate-y-1/2 sm:right-2 sm:size-12"
        >
          {pending ? <Loader2 aria-hidden className="size-5 animate-spin" /> : <ArrowRight aria-hidden className="size-5" />}
        </GlassButton>
      </form>
      {notice && (
        <p role="status" className={cn(glassSurface({ level: "strong" }), "mt-3 rounded-full px-4 py-2 text-sm text-glass-text-2")}>
          AI search is not enabled for your account yet.
        </p>
      )}
    </div>
  )
}
