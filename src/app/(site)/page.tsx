import Link from "next/link"
import { Mail, MapPin, Phone } from "lucide-react"
import { buttonVariants } from "@/components/ui"
import { env } from "@/core/config/env"
import { HomeMap } from "@/features/search"
import { loadFilterCatalog } from "@/features/search/lib/server-catalog"
import { hasSiteFeature } from "@/features/users/lib/server-access"

// Business copy and figures from the current site (wareod.com).
const STATS = [
  { value: "100+", label: "Warehouses" },
  { value: "21+", label: "Cities" },
  { value: "34+", label: "Industrial clusters" },
]

const TYPES = [
  { name: "General", body: "Grade A logistics infrastructure." },
  { name: "Bonded", body: "Customs bonded and port facilities." },
  { name: "FTWZ", body: "SEZ tax-free international hubs." },
]

const SERVICES = [
  {
    title: "Flexible warehousing",
    body: "Verified Grade A facilities with flexible lease terms. Scale up or down as your business demands.",
  },
  { title: "Value added services", body: "Custom-designed solutions to fulfil your requirements." },
  {
    title: "Managed enterprise network",
    body: "Multi-facility management across cities with centralised operations and unified compliance.",
  },
]

const STEPS = [
  {
    title: "Map every sq ft",
    body: "We continuously map and verify available space across ambient, bonded and FTWZ facilities nationwide.",
  },
  {
    title: "Instant match",
    body: "Share your space requirements, timeline and location to get paired with the best-fit facility immediately.",
  },
  {
    title: "Move in with logistics support",
    body: "Move in with dock access, material handling, transport and software tracking ready from day one.",
  },
]

const INDUSTRIES = [
  { name: "E-commerce", body: "Fulfilment-ready hubs for rapid last-mile delivery." },
  { name: "FMCG", body: "Temperature-controlled and ambient storage to keep products moving." },
  { name: "3PL", body: "Multi-client facilities that flex with diverse logistics needs." },
  { name: "Pharma", body: "GDP-compliant cold chain and ambient solutions for sensitive cargo." },
  { name: "Automotive", body: "Just-in-time facilities positioned near manufacturing hubs." },
]

const CONTACT = {
  email: "nexus.vcs@bismarckgroup.in",
  phone: "+91 98203 63276",
  address: "B-108/109, Everest Grande, Mahakali Caves Road, Andheri East, Mumbai 400093",
}

export default async function HomePage() {
  const [canSearch, canEnquire] = await Promise.all([hasSiteFeature("search"), hasSiteFeature("enquiries")])
  const catalog = canSearch ? await loadFilterCatalog() : null
  return (
    <div className="flex flex-col">
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center gap-7 px-4 pt-16 pb-14 text-center sm:pt-24">
        <p className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          India&apos;s flexible warehousing network
        </p>
        <h1 className="font-heading text-5xl leading-[1.05] tracking-tight text-balance sm:text-7xl">Find your ideal warehouse space</h1>
        <p className="max-w-xl text-base text-muted-foreground text-balance sm:text-lg">
          Instant access to verified, flexible industrial storage across India&apos;s premier logistics corridors.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {canSearch && (
            <Link href="/search" className={buttonVariants({ size: "lg" })}>
              Explore warehouses
            </Link>
          )}
          {canEnquire && (
            <Link href="/enquire" className={buttonVariants({ size: "lg", variant: "outline" })}>
              Tell us what you need
            </Link>
          )}
        </div>
      </section>

      {canSearch && (
        <section className="mx-auto w-full max-w-6xl px-4 pb-16">
          <HomeMap catalog={catalog} />
        </section>
      )}

      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 className="text-center font-heading text-3xl tracking-tight sm:text-4xl">A trusted warehousing partner across India</h2>
        <dl className="mt-10 grid divide-border sm:grid-cols-3 sm:divide-x">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1 py-4">
              <dt className="order-2 text-sm text-muted-foreground">{s.label}</dt>
              <dd className="order-1 font-heading text-6xl tracking-tight">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-16 sm:grid-cols-3">
        {TYPES.map((t) => (
          <div key={t.name} className="flex flex-col gap-2 border-t border-border pt-5">
            <h3 className="font-heading text-3xl tracking-tight">{t.name}</h3>
            <p className="text-sm text-muted-foreground">{t.body}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1fr_2fr]">
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-4xl tracking-tight sm:text-5xl">What we do</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            {env.siteName} finds, verifies and manages warehouse space so you can focus on moving goods.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          {SERVICES.map((s) => (
            <div key={s.title} className="glass flex flex-col gap-2 rounded-2xl p-6 sm:p-8">
              <h3 className="font-heading text-2xl tracking-tight">{s.title}</h3>
              <p className="max-w-lg text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 border-y border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-20">
          <div className="flex flex-col gap-3">
            <h2 className="font-heading text-4xl tracking-tight sm:text-5xl">How it works</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              From finding available space to a logistics-ready handover in three clear milestones.
            </p>
          </div>
          <ol className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-3">
                <span className="font-heading text-5xl text-primary">{i + 1}</span>
                <h3 className="font-heading text-2xl tracking-tight">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="industries" className="mx-auto flex w-full max-w-6xl scroll-mt-20 flex-col gap-10 px-4 py-20">
        <h2 className="font-heading text-4xl tracking-tight sm:text-5xl">Industries we serve</h2>
        <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((ind) => (
            <div key={ind.name} className="flex flex-col gap-2 border-t border-border pt-5">
              <h3 className="font-heading text-2xl tracking-tight">{ind.name}</h3>
              <p className="text-sm text-muted-foreground">{ind.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="scroll-mt-20 border-t border-border">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-20 lg:grid-cols-2">
          <div className="flex flex-col items-start gap-5">
            <h2 className="font-heading text-4xl tracking-tight text-balance sm:text-5xl">Can&apos;t find the right fit?</h2>
            <p className="max-w-md text-sm text-muted-foreground">Describe the space you need and our team will find options for you.</p>
            {canEnquire && (
              <Link href="/enquire" className={buttonVariants({ size: "lg" })}>
                Tell us what you need
              </Link>
            )}
          </div>
          <address className="flex flex-col gap-4 text-sm not-italic">
            <a href={`mailto:${CONTACT.email}`} className="inline-flex items-center gap-3 hover:underline">
              <Mail className="size-4 text-muted-foreground" />
              {CONTACT.email}
            </a>
            <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-3 hover:underline">
              <Phone className="size-4 text-muted-foreground" />
              {CONTACT.phone}
            </a>
            <span className="inline-flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              {CONTACT.address}
            </span>
          </address>
        </div>
      </section>
    </div>
  )
}
