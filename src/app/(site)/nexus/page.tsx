import type { Metadata } from "next"
import {
  ArrowRight,
  BarChart3,
  Boxes,
  ClipboardCheck,
  Container,
  FileText,
  History,
  Inbox,
  KeyRound,
  Map as MapIcon,
  PackageCheck,
  ReceiptText,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
  type LucideIcon,
} from "lucide-react"
import { GlassButtonLink, glassButton } from "@/components/glass"
import { Reveal } from "@/components/site/reveal"
import { SectionBadge, SectionIntro } from "@/components/site/section-heading"
import { hasSiteFeature } from "@/features/users/lib/server-access"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Nexus Engine",
  description: "The matching engine behind our warehouse search, and the warehouse management system our operations run on.",
}

/** Confirmed live WMS features (product owner, Oct 2026). Only these are claimed as live. */
const WMS_LIVE: { title: string; body: string; icon: LucideIcon }[] = [
  {
    title: "Inbound GRN",
    body: "Every receipt is booked against a goods received note, so stock enters the books the moment it is unloaded.",
    icon: PackageCheck,
  },
  {
    title: "Container-wise inventory",
    body: "Stock on hand is broken down by container, so you can see what each inbound container still holds.",
    icon: Container,
  },
  {
    title: "Outbound DN from containers",
    body: "Delivery notes are raised from container numbers, drawing stock from the containers it actually came in.",
    icon: Truck,
  },
  {
    title: "DN PDF with charges",
    body: "Each delivery note prints as a PDF with additional-charges columns alongside the goods dispatched.",
    icon: FileText,
  },
]

/**
 * TODO(confirm): not yet confirmed as live WMS features. They show with a visible
 * "To confirm" tag until the product owner signs them off; then move them into
 * WMS_LIVE or delete them. Do not add multi-warehouse, scanners/RFID or AWS claims.
 */
const WMS_TO_CONFIRM: { title: string; body: string; icon: LucideIcon }[] = [
  { title: "Reports", body: "Stock, inbound and outbound reports for your account.", icon: BarChart3 },
  { title: "Billing & charges", body: "Storage and handling charges beyond the DN charges columns.", icon: ReceiptText },
]

/** The flow the live features make up, left to right. */
const FLOW = [
  { label: "Container arrives", icon: Container },
  { label: "GRN booked", icon: ClipboardCheck },
  { label: "Stock by container", icon: Boxes },
  { label: "DN raised", icon: Truck },
  { label: "DN PDF + charges", icon: FileText },
]

/** Platform pieces confirmed from this repo (package.json, README). */
const STACK: { title: string; body: string; icon: LucideIcon }[] = [
  {
    title: "Requirement-led search",
    body: "Search by place, area, rent, industry and facilities, ranked by fit, distance, price or size.",
    icon: Search,
  },
  {
    title: "Natural-language search",
    body: "Describe the space in your own words and the engine turns it into filters (where enabled).",
    icon: SlidersHorizontal,
  },
  {
    title: "Attribute-driven filters",
    body: "Filters are generated from the facility attributes our team maintains, so new specs become searchable without a release.",
    icon: Boxes,
  },
  { title: "Maps", body: "Google Maps for search and the home map; a MapLibre globe on Explore.", icon: MapIcon },
  { title: "Staff review & change log", body: "Listings pass a review queue before going live, and every edit is kept in a change log.", icon: History },
  { title: "Secure accounts", body: "Sign-in and per-feature access by Clerk, enforced again by our API on every call.", icon: KeyRound },
]

const STACK_TECH = ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS 4", "Go API", "Clerk", "Google Maps", "MapLibre"]

const TRUST = [
  {
    title: "Reviewed before publish",
    body: "Every listing goes through our review queue, and anything we haven't verified is labelled as such.",
    icon: ShieldCheck,
  },
  {
    title: "A team behind the engine",
    body: "Requirements land in our team's inbox. People follow up, arrange visits and close the paperwork.",
    icon: Inbox,
  },
  {
    title: "Every change on record",
    body: "Listing edits are tracked with who changed what and when, so the data you see has a history.",
    icon: History,
  },
]

export default async function NexusPage() {
  const [canSearch, canEnquire] = await Promise.all([hasSiteFeature("search"), hasSiteFeature("enquiries")])
  return (
    <div className="-mb-px flex flex-col text-white">
      <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden border-b border-white/10 pt-20 pb-16 sm:pt-24 lg:pb-24">
        <NodeField />
        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 text-center sm:px-8 lg:px-12">
          <SectionBadge className="mb-6">Platform</SectionBadge>
          <h1 className="font-heading text-5xl leading-none font-black tracking-tight uppercase sm:text-7xl lg:text-8xl">
            <span className="block bg-gradient-to-r from-glass-accent-text to-glass-accent bg-clip-text text-transparent">Nexus</span>
            <span className="block">Engine</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-pretty text-glass-text-2 sm:text-lg">
            The matching engine behind our warehouse search, and the warehouse management system our operations run on once
            you move in.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {canSearch && (
              <GlassButtonLink href="/search" size="lg" className="font-heading font-bold tracking-widest uppercase">
                Explore warehouses <ArrowRight className="size-4" />
              </GlassButtonLink>
            )}
            <a
              href="#wms"
              className={glassButton({ variant: "secondary", size: "lg", className: "font-heading font-bold tracking-widest uppercase" })}
            >
              See the WMS
            </a>
          </div>
        </div>
      </section>

      <section id="wms" className="relative scroll-mt-20 border-b border-white/10 py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <SectionIntro
            title="Tech-enabled storage &"
            accent="Nexus WMS"
            lede="Inbound, stock and dispatch tracked container by container, with the paperwork generated as you go."
            className="mb-12 sm:mb-16"
          />
          <Reveal className="gl-surface gl-strong gl-panel relative overflow-hidden p-6 sm:p-8 lg:p-10">
            <div aria-hidden className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-glass-accent/80 to-transparent" />
            <div className="flex flex-col justify-between gap-6 border-b border-white/[0.08] pb-8 lg:flex-row lg:items-end">
              <div>
                <p className="mb-2 flex items-center gap-2">
                  <span className="relative flex size-2">
                    <span aria-hidden className="absolute inline-flex size-full animate-ping rounded-full bg-site-green opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-site-green" />
                  </span>
                  <span className="font-heading text-xs font-bold tracking-[0.2em] text-glass-text-2 uppercase">Live in operations</span>
                </p>
                <h3 className="font-heading text-3xl font-black tracking-tight uppercase sm:text-5xl">Container to dispatch</h3>
              </div>
              <p className="max-w-sm text-sm text-glass-text-3">
                The four features below are live today. Items tagged <em className="font-semibold text-glass-text not-italic">To confirm</em> are
                still being verified.
              </p>
            </div>

            {/* The live flow, as a pipeline. Decorative summary of the cards below. */}
            <div className="relative mt-8">
            <div aria-hidden className="absolute top-6 right-[10%] left-[10%] hidden h-px bg-gradient-to-r from-white/10 via-glass-accent/60 to-white/10 sm:block" />
            <ol aria-label="How stock moves through Nexus WMS" className="relative grid grid-cols-1 gap-3 sm:grid-cols-5 sm:gap-2">
              {FLOW.map((f, i) => (
                <li key={f.label} className="relative flex items-center gap-3 sm:flex-col sm:text-center">
                  <span className="gl-surface gl-plain relative flex size-12 shrink-0 items-center justify-center rounded-[14px] text-glass-accent-text">
                    <f.icon aria-hidden className="size-5" />
                    <span className="absolute -top-2 -right-2 rounded-full bg-glass-accent px-1.5 font-mono text-xs font-bold text-white">{i + 1}</span>
                  </span>
                  <span className="font-mono text-xs tracking-wider text-glass-text-2 uppercase">{f.label}</span>
                </li>
              ))}
            </ol>
            </div>

            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {WMS_LIVE.map((m, i) => (
                <Reveal as="li" key={m.title} delay={i * 80} className="gl-surface gl-plain rounded-[20px] p-6">
                  <ModuleHead icon={m.icon} title={m.title} tag="Live" tagClass="gl-accent" />
                  <p className="mt-3 text-sm leading-relaxed text-glass-text-3">{m.body}</p>
                </Reveal>
              ))}
              {WMS_TO_CONFIRM.map((m, i) => (
                <Reveal
                  as="li"
                  key={m.title}
                  delay={(WMS_LIVE.length + i) * 80}
                  className="gl-surface gl-plain gl-subtle rounded-[20px] border-dashed p-6"
                >
                  <ModuleHead icon={m.icon} title={m.title} tag="To confirm" tagClass="border-white/25 bg-white/5 text-glass-text-2" />
                  <p className="mt-3 text-sm leading-relaxed text-glass-text-3">{m.body}</p>
                </Reveal>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="stack-title" className="border-b border-white/10 py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <SectionBadge className="mb-4">Tech stack</SectionBadge>
            <h2 id="stack-title" className="font-heading text-3xl font-black tracking-tight uppercase sm:text-4xl">
              What the engine is built on
            </h2>
            <p className="mt-3 text-base leading-relaxed text-glass-text-3">A modern web platform over our own API, with search and maps at its core.</p>
          </div>
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {STACK.map((s, i) => (
              <Reveal as="li" key={s.title} delay={(i % 3) * 100} className="gl-surface gl-plain gl-lift rounded-[20px] p-8">
                <span className="gl-accent mb-6 flex size-12 items-center justify-center rounded-[14px] border">
                  <s.icon aria-hidden className="size-5" />
                </span>
                <h3 className="mb-3 font-heading text-lg font-bold tracking-tight uppercase">{s.title}</h3>
                <p className="text-sm leading-relaxed text-glass-text-3">{s.body}</p>
              </Reveal>
            ))}
          </ul>
          <ul aria-label="Technologies" className="mt-12 flex flex-wrap justify-center gap-2">
            {STACK_TECH.map((t) => (
              <li key={t} className="gl-chip px-3.5 py-1.5 font-mono text-xs tracking-wider">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="trust-title" className="py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <SectionBadge className="mb-4">Trust & operations</SectionBadge>
            <h2 id="trust-title" className="font-heading text-3xl font-black tracking-tight uppercase sm:text-4xl">
              Built to be relied on
            </h2>
          </div>
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
            {TRUST.map((t, i) => (
              <Reveal as="li" key={t.title} delay={i * 100} className="gl-surface gl-plain gl-lift rounded-[20px] p-8">
                <span className="gl-accent mb-6 flex size-12 items-center justify-center rounded-[14px] border">
                  <t.icon aria-hidden className="size-5" />
                </span>
                <h3 className="mb-3 font-heading text-lg font-bold tracking-tight uppercase">{t.title}</h3>
                <p className="text-sm leading-relaxed text-glass-text-3">{t.body}</p>
              </Reveal>
            ))}
          </ul>
          {canEnquire && (
            <p className="mt-14 text-center">
              <GlassButtonLink href="/enquire" size="lg" className="font-heading font-bold tracking-widest uppercase">
                Talk to our team <ArrowRight className="size-4" />
              </GlassButtonLink>
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

function ModuleHead({ icon: Icon, title, tag, tagClass }: { icon: LucideIcon; title: string; tag: string; tagClass: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex items-center gap-3">
        <span className="gl-surface gl-plain flex size-10 items-center justify-center rounded-[12px] text-glass-accent-text">
          <Icon aria-hidden className="size-5" />
        </span>
        <h4 className="font-heading text-base font-bold tracking-tight uppercase">{title}</h4>
      </span>
      <span className={cn("shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-xs font-bold tracking-wider uppercase", tagClass)}>{tag}</span>
    </div>
  )
}

/** Decorative hero backdrop: a faint field of linked hubs, drifting slowly. */
function NodeField() {
  const nodes: [number, number][] = [
    [8, 20], [22, 12], [35, 28], [18, 44], [6, 70], [28, 78], [44, 60], [58, 18], [70, 34], [84, 14], [92, 40], [78, 62], [64, 82], [90, 84], [50, 90],
  ]
  const links: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6], [6, 2], [2, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 8], [11, 12], [12, 13], [12, 14], [14, 6],
  ]
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute -inset-[5%] size-[110%] animate-drift opacity-60">
        {links.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke="#ffffff" strokeOpacity="0.14" strokeWidth="0.12" />
        ))}
        {nodes.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 0.55 : 0.35} fill={i % 4 === 0 ? "#3b82f6" : "#ffffff"} fillOpacity={i % 4 === 0 ? 0.8 : 0.45} />
        ))}
      </svg>
    </div>
  )
}
