import { Suspense, cache } from "react"
import Link from "next/link"
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  ClipboardList,
  Globe2,
  Handshake,
  Layers,
  ListOrdered,
  MapPinned,
  Network,
  ShieldCheck,
  Warehouse,
} from "lucide-react"
import { Reveal } from "@/components/site/reveal"
import { Eyebrow, SectionIntro } from "@/components/site/section-heading"
import { GlassButtonLink, glassSurface } from "@/components/glass"
import { CONTACT } from "@/core/config/brand"
import { env } from "@/core/config/env"
import { ClusterCard } from "@/features/clusters"
import { HomeSearchBar } from "@/features/home-search"
import { loadClusterOverview } from "@/features/clusters/lib/server-clusters"
import { HomeMap } from "@/features/search"
import { loadFilterCatalog } from "@/features/search/lib/server-catalog"
import { hasSiteFeature } from "@/features/users/lib/server-access"
import { cn } from "@/lib/utils"

const FEATURED_CLUSTERS = 6

// One page-through of the listings per request, shared by the trust strip and the cluster grid.
const getOverview = cache(() => loadClusterOverview())

const TYPES = [
  { name: "General", body: "Ambient Grade A space for everyday storage and distribution.", icon: Warehouse, tone: "blue" },
  { name: "Bonded", body: "Customs-bonded space for duty-deferred cargo near ports.", icon: ShieldCheck, tone: "amber" },
  { name: "FTWZ", body: "Free trade warehousing zones for international trade flows.", icon: Globe2, tone: "green" },
] as const

const TONES = {
  blue: "border-site-blue/40 bg-site-blue/10 text-site-blue",
  amber: "border-site-amber/40 bg-site-amber/10 text-site-amber",
  green: "border-site-green/40 bg-site-green/10 text-site-green",
} as const

const VALUES = [
  {
    title: "Verified supply",
    body: "Listings pass a staff review before they go live, and each one shows which details have been verified.",
    icon: ShieldCheck,
  },
  {
    title: "Requirement-led matching",
    body: "Tell us the size, location, budget and industry. The Nexus engine ranks warehouses by how well they fit.",
    icon: Network,
  },
  {
    title: "Operations on Nexus WMS",
    body: "Once you move in, inbound GRNs, container-wise stock and delivery notes run on our warehouse management system.",
    icon: Layers,
  },
]

const STEPS = [
  {
    title: "Requirement captured",
    body: "Share the area, location, budget, timeline and industry through search or the enquiry form. It's saved as one structured requirement.",
    icon: ClipboardList,
    tone: "blue",
  },
  {
    title: "Matching & ranking",
    body: "The engine checks the requirement against verified warehouse supply and clusters, then ranks the closest fits.",
    icon: ListOrdered,
    tone: "amber",
  },
  {
    title: "Shortlist & site visits",
    body: "You get a shortlist with specs and rent side by side. Our team arranges visits to the sites you pick.",
    icon: MapPinned,
    tone: "green",
  },
  {
    title: "Commercials & go-live",
    body: "Terms are agreed and paperwork closed. Operations go live with inbound, stock and dispatch on Nexus WMS.",
    icon: Handshake,
    tone: "blue",
  },
] as const

const STEP_BADGE = { blue: "bg-site-blue", amber: "bg-site-amber", green: "bg-site-green" } as const

const INDUSTRIES = [
  { name: "E-commerce", body: "Hubs close to demand centres for fast order fulfilment and returns." },
  { name: "FMCG", body: "High-throughput ambient and temperature-aware space for fast-moving stock." },
  { name: "3PL", body: "Multi-client space that grows and shrinks with your contracts." },
  { name: "Pharma", body: "Compliant storage for sensitive and regulated products." },
  { name: "Automotive", body: "Space near manufacturing belts for parts and just-in-time supply." },
]

export default async function HomePage() {
  const [canSearch, canEnquire] = await Promise.all([hasSiteFeature("search"), hasSiteFeature("enquiries")])
  const catalog = canSearch ? await loadFilterCatalog() : null
  return (
    <div className="-mb-px flex flex-col bg-site-deep">
      <Hero canSearch={canSearch} canEnquire={canEnquire} />

      <section aria-label="Network" className="relative border-t border-white/10 bg-site-ink py-10 sm:py-12">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-6 sm:px-8 md:flex-row md:items-center lg:px-12">
          <p className="flex items-center gap-3 font-heading text-xs font-bold tracking-[0.2em] text-slate-300/80 uppercase sm:text-sm">
            <span aria-hidden className="size-2 animate-pulse rounded-full bg-emerald-400" />
            A trusted warehousing partner across India
          </p>
          {canSearch && (
            <Suspense fallback={<StatsSkeleton />}>
              <NetworkStats />
            </Suspense>
          )}
        </div>
      </section>

      <section aria-label="What we do" className="relative overflow-hidden bg-site-panel py-24 sm:py-32">
        <div aria-hidden className="absolute -top-24 left-1/2 h-48 w-full max-w-4xl -translate-x-1/2 rounded-full bg-site-teal-soft/5 blur-[100px]" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 sm:px-8 md:grid-cols-3 md:gap-8 lg:gap-12 lg:px-12">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 120} className="relative pt-6">
              <div className="relative h-full rounded-tl-xl rounded-tr-[4rem] rounded-br-xl rounded-bl-[4rem] border border-white/20 bg-site-panel p-8 pt-12 pb-12 shadow-xl">
                <span
                  aria-hidden
                  className="absolute -top-8 right-4 flex size-[4.5rem] items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-site-teal-soft to-site-teal-deep text-white shadow-md"
                >
                  <v.icon className="size-7" />
                </span>
                <h3 className="text-center font-heading text-lg tracking-wide text-white">{v.title}</h3>
                <p className="mx-auto mt-3 max-w-[280px] text-center text-[13px] leading-relaxed text-slate-300">{v.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="clusters" className="scroll-mt-24 bg-gradient-to-r from-site-band-from to-site-band-to pt-20 sm:pt-24">
        <div className="mx-auto mb-12 flex max-w-7xl flex-col justify-between gap-6 px-6 sm:px-8 md:flex-row md:items-end lg:px-12">
          <div>
            <Eyebrow className="mb-2">Hubs</Eyebrow>
            <h2 className="mb-4 font-heading text-3xl leading-tight font-bold tracking-widest text-white uppercase sm:text-[2.75rem]">
              Featured clusters
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-white/90">
              The hubs with the most live listings right now, with the localities each one covers.
            </p>
          </div>
          {canSearch && (
            <Link
              href="/search"
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-sm border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-site-ink md:self-auto"
            >
              View all warehouses <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-16 sm:px-8 lg:px-12">
          {canSearch ? (
            <Suspense fallback={<ClustersSkeleton />}>
              <FeaturedClusters />
            </Suspense>
          ) : (
            <p className="border-t border-white/20 py-16 text-center text-sm tracking-widest text-white/80 uppercase">
              Search isn&apos;t on for your account yet.
            </p>
          )}
        </div>
      </section>

      {canSearch && (
        <section aria-label="Live listings map" className="border-t border-white/10 bg-site-ink py-20 sm:py-24">
          <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 sm:px-8 lg:px-12">
            <SectionIntro badge="Live map" title="Every listing," accent="one map" lede="Pan around India and open any pin to see the warehouse." />
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-site-panel/60 p-2 shadow-2xl sm:p-3">
              <HomeMap catalog={catalog} />
            </div>
          </div>
        </section>
      )}

      <section id="how-it-works" className="scroll-mt-24 border-t border-white/10 bg-site-ink py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <Reveal>
            <SectionIntro
              badge="The process"
              badgeIcon={<Network aria-hidden className="size-3" />}
              title="How the"
              accent="Nexus engine works"
              lede="From a first requirement to a live, running warehouse in four clear stages."
            />
          </Reveal>
          <div className="relative mt-16">
            <div
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-[12%] left-[12%] hidden h-0.5 -translate-y-6 bg-gradient-to-r from-site-blue/20 via-site-blue/60 to-site-green/40 lg:block"
            />
            <ol className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <Reveal
                  as="li"
                  key={s.title}
                  delay={i * 120}
                  className="group flex flex-col items-center rounded-2xl border border-white/10 bg-[#091421]/80 p-8 text-center backdrop-blur-md hover:border-white/20"
                >
                  <span className={cn("relative mb-6 flex size-16 items-center justify-center rounded-2xl border shadow-lg transition-transform duration-300 group-hover:scale-110", TONES[s.tone])}>
                    <s.icon aria-hidden className="size-6" />
                    <span className={cn("absolute -top-2 -right-2 rounded-full px-2 py-0.5 font-mono text-[11px] font-bold text-black shadow", STEP_BADGE[s.tone])}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </span>
                  <h3 className="mb-3 font-heading text-xl font-bold tracking-tight text-white uppercase">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-300/80">{s.body}</p>
                </Reveal>
              ))}
            </ol>
          </div>
          <p className="mt-10 text-center">
            <Link href="/nexus" className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-site-cyan uppercase hover:underline">
              Inside the Nexus engine <ArrowRight className="size-3.5" />
            </Link>
          </p>
        </div>
      </section>

      <section id="industries" className="scroll-mt-24 bg-gradient-to-r from-site-band-from to-site-band-to pt-12 pb-16 shadow-inner">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <Eyebrow className="mb-2 text-center lg:text-left">Sectors</Eyebrow>
          <h2 className="mb-12 text-center font-heading text-2xl font-bold tracking-widest text-white uppercase sm:mb-16 sm:text-[2.75rem] lg:text-left">
            Industries we serve
          </h2>
          <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
            {INDUSTRIES.map((ind, i) => (
              <Reveal
                as="li"
                key={ind.name}
                delay={i * 80}
                className={cn("flex flex-col items-center text-center lg:items-start lg:text-left", i > 0 ? "lg:border-l lg:border-white/20 lg:pl-8" : "lg:pr-8")}
              >
                <h3 className="mb-3 font-heading text-[13px] font-extrabold tracking-widest text-white uppercase">{ind.name}</h3>
                <p className="max-w-[220px] text-[13px] leading-relaxed text-white/90">{ind.body}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section id="contact" className="scroll-mt-24 bg-site-deep">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 sm:px-8 lg:grid-cols-[3fr_2fr] lg:items-center lg:px-12">
          <div className="flex flex-col items-start gap-5">
            <p className="font-heading text-xs font-semibold tracking-[0.3em] text-site-cyan uppercase">Need something specific?</p>
            <h2 className="font-heading text-4xl leading-[0.95] font-bold tracking-tighter text-balance text-white uppercase sm:text-6xl">
              Can&apos;t find the <span className="text-site-teal">right fit?</span>
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Describe the space you need and our team will run it through the Nexus engine for you.
            </p>
            {canEnquire && (
              <Link
                href="/enquire"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-site-teal-soft to-site-teal-deep px-7 py-3 font-heading text-sm font-bold tracking-widest text-white uppercase shadow-lg transition-transform hover:scale-[1.02]"
              >
                Tell us what you need <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
          <address className="flex flex-col gap-3 text-sm text-muted-foreground not-italic">
            <a href={`mailto:${CONTACT.email}`} className="w-fit hover:text-site-cyan">
              {CONTACT.email}
            </a>
            <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className="w-fit hover:text-site-cyan">
              {CONTACT.phone}
            </a>
            <span>{CONTACT.address}</span>
          </address>
        </div>
      </section>
    </div>
  )
}

function Hero({ canSearch, canEnquire }: { canSearch: boolean; canEnquire: boolean }) {
  return (
    <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden bg-site-ink text-center lg:min-h-[95vh]">
      {/* TODO(design): swap this gradient placeholder for the hero photo once supplied (keep animate-ken-burns on the image layer). */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-16 animate-ken-burns bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,#1e4a63_0%,#0f2b3b_45%,#07131d_100%)] sm:-inset-20"
      >
        <div className="size-full bg-[linear-gradient(rgb(255_255_255/4%)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/4%)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.08)_0%,rgba(7,19,29,0.7)_90%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-site-ink via-site-ink/30 to-transparent" />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-6 pt-32 pb-20 sm:px-8 sm:pt-36 lg:px-12 lg:pb-28">
        <h1 className="font-heading text-5xl leading-[1.02] font-bold tracking-tight text-balance text-white/95 uppercase sm:text-7xl lg:text-8xl">
          Find{" "}
          <span className="text-site-blue drop-shadow-[0_0_25px_rgba(59,130,246,0.3)]">warehouse space</span>
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-pretty text-slate-200/80 sm:mt-8 sm:text-lg lg:text-xl">
          Search verified industrial space by location, size, rent and facilities, or tell us what you need and let the Nexus engine
          match it.
        </p>
        {env.aiSearchEnabled ? (
          <div className="mt-8 flex w-full flex-col items-center gap-4 sm:mt-10">
            <HomeSearchBar />
            {canSearch && (
              <Link
                href="/search"
                className="group inline-flex items-center gap-1.5 font-heading text-xs font-semibold tracking-widest text-white/70 uppercase transition-colors hover:text-white"
              >
                Explore warehouses
                <ArrowRight aria-hidden className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10">
            {canSearch && (
              <GlassButtonLink href="/search" variant="primary" size="lg" className="group font-heading tracking-widest uppercase">
                Explore warehouses
                <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
              </GlassButtonLink>
            )}
            {canEnquire && (
              <GlassButtonLink href="/enquire" variant="secondary" size="lg" className="font-heading tracking-widest uppercase">
                Tell us what you need
              </GlassButtonLink>
            )}
          </div>
        )}

        <ul className="mt-12 grid w-full max-w-4xl grid-cols-1 gap-3.5 text-left sm:mt-14 sm:grid-cols-3 sm:gap-4">
          {TYPES.map((t) => {
            const body = (
              <>
                <div className="flex items-center justify-between">
                  <span className={cn("flex size-9 items-center justify-center rounded-lg border transition-transform duration-300 group-hover:scale-105", TONES[t.tone])}>
                    <t.icon aria-hidden className="size-4" />
                  </span>
                  {canSearch && (
                    <span aria-hidden className="flex size-6 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors group-hover:bg-white/15">
                      <ArrowUpRight className="size-3 text-white/60 group-hover:text-white" />
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <h2 className="font-heading text-sm font-semibold tracking-wider text-white uppercase">{t.name}</h2>
                  <p className="mt-1 text-xs leading-snug text-slate-300/75">{t.body}</p>
                </div>
              </>
            )
            // Three tiles, so each can carry its own blur (lists use gl-plain instead).
            const cls = cn(glassSurface(), "group flex h-full flex-col justify-between rounded-[20px] p-4 sm:p-5")
            return (
              <li key={t.name}>
                {canSearch ? (
                  <Link href="/search" className={cn(cls, "gl-lift gl-gold-edge gl-focus")}>
                    {body}
                  </Link>
                ) : (
                  <div className={cls}>{body}</div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

async function NetworkStats() {
  const overview = await getOverview()
  if (!overview) return null
  const stats = [
    { value: overview.warehouses, label: "Warehouses", icon: Warehouse, cls: "text-site-blue" },
    { value: overview.cities, label: "Cities", icon: Building2, cls: "text-site-amber" },
    { value: overview.clusters.length, label: "Clusters", icon: Network, cls: "text-site-green" },
  ]
  return (
    <ul className="flex flex-wrap items-center gap-8 sm:gap-12">
      {stats.map((s) => (
        <li key={s.label} className="flex items-center gap-3">
          <s.icon aria-hidden className={cn("size-5 shrink-0", s.cls)} />
          <p className="flex flex-col leading-tight">
            <span className="font-heading text-base font-bold text-white sm:text-lg">{s.value.toLocaleString("en-IN")}</span>
            <span className="text-xs text-slate-400">{s.label}</span>
          </p>
        </li>
      ))}
    </ul>
  )
}

function StatsSkeleton() {
  return (
    <div aria-hidden className="flex gap-10">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-9 w-24 animate-pulse rounded-md bg-white/5" />
      ))}
    </div>
  )
}

async function FeaturedClusters() {
  // TODO(data): current listings are TEST- dummy data, so these clusters, counts and rent ranges are not real yet.
  const overview = await getOverview()
  const clusters = overview?.clusters.slice(0, FEATURED_CLUSTERS) ?? []
  if (clusters.length === 0) {
    return (
      <p className="border-t border-white/20 py-16 text-center text-sm tracking-widest text-white/80 uppercase">
        {overview ? "No live listings yet." : "Clusters are unavailable right now."}
      </p>
    )
  }
  return (
    <ul className="grid gap-0 sm:grid-cols-2 lg:grid-cols-3">
      {clusters.map((c, i) => (
        <Reveal as="li" key={c.key} delay={(i % 3) * 120} className="border-[#0b1f2a] sm:border-r">
          <ClusterCard cluster={c} />
        </Reveal>
      ))}
    </ul>
  )
}

function ClustersSkeleton() {
  return (
    <div aria-hidden className="grid gap-0 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="aspect-[5/4] animate-pulse border-r border-[#0b1f2a] bg-site-ink/40 sm:aspect-[3/4]" />
      ))}
    </div>
  )
}
