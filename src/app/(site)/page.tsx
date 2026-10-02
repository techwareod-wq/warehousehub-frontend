import Link from "next/link"
import { BadgeCheck, MapPinned, Sparkles } from "lucide-react"
import { env } from "@/core/config/env"
import { SearchBox } from "@/features/search"
import { loadFilterCatalog } from "@/features/search/lib/server-catalog"

const POINTS = [
  { icon: MapPinned, title: "Search by place or pincode", body: "Results widen automatically until you have real options nearby." },
  { icon: BadgeCheck, title: "Verified specifications", body: "Every listing is reviewed before it goes live, with the facilities that matter." },
  { icon: Sparkles, title: "Filters that fit your business", body: "Cold chain, hazmat, docks, floor load — filter by exactly what you need." },
]

export default async function HomePage() {
  const catalog = await loadFilterCatalog()
  return (
    <div className="flex flex-col">
      <section className="border-b border-border bg-gradient-to-b from-muted/60 to-background">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-16 text-center sm:py-24">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
            Find the right warehouse, faster.
          </h1>
          <p className="max-w-xl text-base text-muted-foreground text-balance">
            {env.siteName} lists verified warehouse space across India. Search by location, size, rent and the facilities your
            operation needs.
          </p>
          <SearchBox className="w-full max-w-2xl text-left" />
          {catalog && catalog.industries.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <span className="text-muted-foreground">Popular:</span>
              {catalog.industries.slice(0, 6).map((i) => (
                <Link key={i.key} href={`/search?ind=${i.key}`} className="rounded-full border border-border px-3 py-1 hover:bg-muted">
                  {i.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-14 sm:grid-cols-3">
        {POINTS.map((p) => (
          <div key={p.title} className="flex flex-col gap-2">
            <p.icon className="size-5 text-primary" />
            <h2 className="text-sm font-semibold">{p.title}</h2>
            <p className="text-sm text-muted-foreground">{p.body}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
