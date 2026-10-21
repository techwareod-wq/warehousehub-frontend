"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { ArrowRight, Loader2, Search } from "lucide-react"
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
        className="hs-bar relative flex h-14 w-full max-w-[720px] items-center gap-2 rounded-full pr-1.5 pl-5 sm:h-16 sm:pr-2 sm:pl-6"
      >
        <Search aria-hidden className="size-5 shrink-0 text-white/60" />
        <div className="relative h-full min-w-0 flex-1">
          <input
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
            className="size-full bg-transparent text-left text-base text-white outline-none sm:text-lg"
          />
          {empty && (
            <span aria-hidden className={cn("hs-ph pointer-events-none absolute inset-0 overflow-hidden", focused && "hs-ph-dim")}>
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
        </div>
        <button
          type="submit"
          aria-label="Search"
          aria-busy={pending || undefined}
          disabled={pending}
          className="hs-go flex size-11 shrink-0 items-center justify-center rounded-full sm:size-12"
        >
          {pending ? <Loader2 aria-hidden className="size-5 animate-spin" /> : <ArrowRight aria-hidden className="size-5" />}
        </button>
      </form>
      {notice && (
        <p role="status" className="hs-notice mt-3 rounded-full px-4 py-2 text-sm text-white/90">
          AI search is not enabled for your account yet.
        </p>
      )}
    </div>
  )
}
