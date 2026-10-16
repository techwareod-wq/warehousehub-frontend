"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, RotateCcw, Search } from "lucide-react"
import { Button, Input, buttonVariants } from "@/components/ui"
import { Checkbox, EmptyState, ErrorState, LoadingRows } from "@/components/common"
import { SectionBadge } from "@/components/site/section-heading"
import { browserApi } from "@/core/api"
import { BRAND } from "@/core/config/brand"
import { useLoad } from "@/core/hooks/use-load"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { finderApi } from "../api/finder.api"
import {
  EMPTY_ANSWERS,
  GOODS_OPTIONS,
  INDUSTRY_OPTIONS,
  TYPE_OPTIONS,
  type FinderAnswers,
  type FinderResult,
} from "../entities/finder.entity"
import { CityPicker } from "./city-picker"
import { MatchCard } from "./match-card"

const api = finderApi(browserApi)

const SQFT_PER_SQM = 10.764

const STEPS = [
  { title: "Which city?", hint: "Pick the city you need space in." },
  { title: "What type of warehouse?", hint: "Not sure? Leave it on Any." },
  { title: "How much space?", hint: "A rough figure is fine." },
  { title: "What are you storing?", hint: "Pick everything that applies." },
  { title: "Industries served", hint: "Optional — pick any that apply." },
  { title: "Location preferences", hint: "Optional — tick what matters to you." },
] as const

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "rounded-full border px-5 py-2.5 text-sm font-medium transition-colors",
        on ? "border-site-cyan bg-site-cyan/15 text-site-cyan" : "border-white/15 bg-white/5 text-white/85 hover:border-white/30 hover:bg-white/10",
      )}
    >
      {children}
    </button>
  )
}

/**
 * EXPERIMENTAL guided finder: six one-question steps, then the top matches
 * from POST /v1/public/finder/match.
 */
export function FinderPage() {
  const cities = useLoad(() => api.cities(), [])
  const [answers, setAnswers] = useState<FinderAnswers>(EMPTY_ANSWERS)
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<FinderResult | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)
  const abort = useRef<AbortController | null>(null)

  useEffect(() => () => abort.current?.abort(), [])

  const set = (patch: Partial<FinderAnswers>) => setAnswers((a) => ({ ...a, ...patch }))

  const valid = [
    answers.city !== "",
    true,
    answers.areaSqft !== null && answers.areaSqft > 0,
    answers.goods.length > 0,
    true,
    true,
  ]
  const last = step === STEPS.length - 1

  async function find() {
    abort.current?.abort()
    const ctrl = new AbortController()
    abort.current = ctrl
    setSubmitted(true)
    setLoading(true)
    setError(null)
    try {
      setResult(await api.match(answers, ctrl.signal))
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setError(err)
    } finally {
      if (abort.current === ctrl) setLoading(false)
    }
  }

  function startOver() {
    abort.current?.abort()
    setAnswers(EMPTY_ANSWERS)
    setStep(0)
    setSubmitted(false)
    setResult(null)
    setError(null)
    setLoading(false)
  }

  function next() {
    if (!valid[step]) return
    if (last) void find()
    else setStep((s) => s + 1)
  }

  return (
    <div className="relative flex-1 overflow-hidden bg-site-deep">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(255_255_255/2.5%)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/2.5%)_1px,transparent_1px)] bg-[size:48px_48px]"
      />
      <div className="relative mx-auto flex max-w-5xl flex-col gap-10 px-6 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="flex flex-col items-center text-center">
          <SectionBadge icon={<Search className="size-3" />}>Warehouse finder · beta</SectionBadge>
          <h1 className="mt-4 font-heading text-3xl font-black tracking-tight text-white uppercase sm:text-5xl">
            Find your <span className="bg-gradient-to-r from-site-blue to-site-cyan bg-clip-text text-transparent">warehouse</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-slate-300/80 sm:text-base">
            Answer six quick questions and the {BRAND} engine picks your best matches.
          </p>
        </div>

        {!submitted ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              next()
            }}
            className="glass mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-3xl p-6 sm:p-8"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] font-semibold tracking-[0.18em] text-white/60 uppercase">
                <span>
                  Step {step + 1} of {STEPS.length}
                </span>
                <span>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
              </div>
              <div
                role="progressbar"
                aria-valuemin={1}
                aria-valuemax={STEPS.length}
                aria-valuenow={step + 1}
                aria-label="Finder progress"
                className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-site-blue to-site-cyan transition-[width] duration-300"
                  style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">{STEPS[step].title}</h2>
              <p className="text-sm text-muted-foreground">{STEPS[step].hint}</p>
            </div>

            <div className="min-h-40">
              {step === 0 &&
                (cities.status === "error" ? (
                  <ErrorState error={cities.error} onRetry={cities.reload} />
                ) : cities.status === "loading" ? (
                  <LoadingRows rows={4} />
                ) : cities.data.length === 0 ? (
                  <EmptyState title="No cities yet" body="The finder has no cities to offer right now." />
                ) : (
                  <CityPicker cities={cities.data} value={answers.city} onChange={(city) => set({ city })} />
                ))}

              {step === 1 && (
                <div className="flex flex-wrap gap-2">
                  {TYPE_OPTIONS.map((o) => (
                    <Chip key={o.value || "any"} on={answers.type === o.value} onClick={() => set({ type: o.value })}>
                      {o.label}
                    </Chip>
                  ))}
                </div>
              )}

              {step === 2 && (
                <div className="flex flex-col gap-2">
                  <div className="relative max-w-xs">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={answers.areaSqft ?? ""}
                      onChange={(e) => {
                        const v = e.target.valueAsNumber
                        set({ areaSqft: Number.isFinite(v) ? v : null })
                      }}
                      placeholder="e.g. 20000"
                      aria-label="Space needed in sq ft"
                      className="h-11 rounded-full pr-16 pl-5"
                      autoFocus
                    />
                    <span className="pointer-events-none absolute top-1/2 right-5 -translate-y-1/2 text-sm text-muted-foreground">sq ft</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {answers.areaSqft && answers.areaSqft > 0
                      ? `≈ ${formatNumber(answers.areaSqft / SQFT_PER_SQM)} sq m`
                      : "Enter the floor area you need in square feet."}
                  </p>
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    {GOODS_OPTIONS.map((o) => (
                      <Chip key={o.value} on={answers.goods.includes(o.value)} onClick={() => set({ goods: toggle(answers.goods, o.value) })}>
                        {o.label}
                      </Chip>
                    ))}
                  </div>
                  {answers.goods.length === 0 && <p className="text-xs text-muted-foreground">Pick at least one.</p>}
                </div>
              )}

              {step === 4 && (
                <div className="flex flex-wrap gap-2">
                  {INDUSTRY_OPTIONS.map((o) => (
                    <Chip
                      key={o.value}
                      on={answers.industries.includes(o.value)}
                      onClick={() => set({ industries: toggle(answers.industries, o.value) })}
                    >
                      {o.label}
                    </Chip>
                  ))}
                </div>
              )}

              {step === 5 && (
                <div className="flex flex-col gap-4">
                  <Checkbox checked={answers.nearPort} onChange={(nearPort) => set({ nearPort })} label="Near a port" />
                  <Checkbox checked={answers.nearRail} onChange={(nearRail) => set({ nearRail })} label="Near a railway / rail terminal" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-5">
              <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
                <ArrowLeft /> Back
              </Button>
              <Button type="submit" disabled={!valid[step]}>
                {last ? (
                  <>
                    <Search /> Find my warehouse
                  </>
                ) : (
                  <>
                    Next <ArrowRight />
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <section className="flex flex-col gap-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-white uppercase sm:text-3xl">
                {loading ? "Finding your matches…" : `Your top matches in ${answers.city}`}
              </h2>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={startOver}>
                  <RotateCcw /> Start over
                </Button>
                <Link href="/search" className={buttonVariants()}>
                  Browse all warehouses
                </Link>
              </div>
            </div>

            {error ? (
              <ErrorState error={error} onRetry={() => void find()} />
            ) : loading || !result ? (
              <LoadingRows rows={3} className="grid gap-4 md:grid-cols-3 [&>*]:h-96 [&>*]:rounded-2xl" />
            ) : result.results.length === 0 ? (
              <EmptyState
                title="No close matches yet"
                body={result.message || "Nothing fits all of that right now — try a broader search, or adjust your answers."}
                action={
                  <Link href="/search" className="text-sm font-medium underline underline-offset-4 hover:no-underline">
                    Search all warehouses →
                  </Link>
                }
              />
            ) : (
              <>
                {result.message && <p className="text-sm text-muted-foreground">{result.message}</p>}
                <div className="grid gap-4 md:grid-cols-3">
                  {result.results.map((m) => (
                    <MatchCard key={m.shortId} match={m} />
                  ))}
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
