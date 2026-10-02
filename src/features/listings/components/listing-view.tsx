import Link from "next/link"
import { Check, FileText, MapPin, Ruler } from "lucide-react"
import { Badge } from "@/components/ui"
import { StaticPin } from "@/components/maps/static-pin"
import { formatAreaSqft } from "@/lib/format"
import { formatRate } from "@/features/search"
import type { Listing, PublicNode } from "../entities/listings.entity"

const DOC_LABELS: Record<string, string> = { floor_plan: "Floor plan", agreement: "Agreement", certificate: "Certificate", other: "Document" }

function NodeSection({ node, depth = 0 }: { node: PublicNode; depth?: number }) {
  return (
    <div className={depth > 0 ? "border-l border-border pl-4" : ""}>
      {depth > 0 && (
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Check className="size-4 text-green-600" />
          {node.name}
        </p>
      )}
      {node.fields.length > 0 && (
        <dl className="mt-2 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          {node.fields.map((f) => (
            <div key={f.key} className="flex justify-between gap-3 border-b border-dashed border-border py-1">
              <dt className="text-muted-foreground">{f.name}</dt>
              <dd className="text-right font-medium">{f.display}</dd>
            </div>
          ))}
        </dl>
      )}
      {node.children.length > 0 && (
        <div className="mt-3 flex flex-col gap-3">
          {node.children.map((c) => (
            <NodeSection key={c.key} node={c} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

/** The public listing page body (everything from the allowlisted DTO). */
export function ListingView({ listing, industryNames }: { listing: Listing; industryNames: Record<string, string> }) {
  const place = [listing.address.locality, listing.address.city, listing.address.region].filter(Boolean).join(", ")
  const root = listing.attributes[0]
  const hidden = new Set(["name", "description", "address", "location", "total_area", "rent"])
  const rootFields = root ? { ...root, fields: root.fields.filter((f) => !hidden.has(f.key)) } : null
  const [cover, ...rest] = listing.photos

  return (
    <article className="flex flex-col gap-6">
      {cover && (
        <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover.url} alt={cover.caption || listing.name} className="aspect-[16/10] w-full rounded-3xl object-cover" />
          {rest.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
              {rest.slice(0, 2).map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p.url} src={p.url} alt={p.caption || listing.name} className="aspect-[16/10] w-full rounded-2xl object-cover" />
              ))}
            </div>
          )}
        </div>
      )}

      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{listing.name}</h1>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
          {place && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" />
              {place} {listing.address.postalCode}
            </span>
          )}
          {listing.totalSqm && (
            <span className="inline-flex items-center gap-1.5">
              <Ruler className="size-4" />
              {formatAreaSqft(listing.totalSqm)}
              {listing.totalAreaDisplay && !listing.totalAreaDisplay.includes("sq ft") && ` (${listing.totalAreaDisplay})`}
            </span>
          )}
        </div>
        <p className="text-lg font-semibold">{formatRate(listing.rate)}</p>
        {listing.industries.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {listing.industries.map((i) => (
              <Badge key={i} variant="secondary">
                Suits {industryNames[i] ?? i}
              </Badge>
            ))}
          </div>
        )}
      </header>

      {listing.description && <p className="max-w-prose text-sm leading-relaxed whitespace-pre-line">{listing.description}</p>}

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-base font-semibold">Facilities & specifications</h2>
        {rootFields && rootFields.fields.length > 0 && <NodeSection node={{ ...rootFields, children: [] }} />}
        <div className="flex flex-col gap-4">
          {(root?.children ?? []).map((c) => (
            <NodeSection key={c.key} node={c} depth={1} />
          ))}
        </div>
      </section>

      {listing.docs.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-base font-semibold">Documents</h2>
          <ul className="flex flex-col gap-1.5 text-sm">
            {listing.docs.map((d) => (
              <li key={d.url}>
                <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
                  <FileText className="size-4" />
                  {d.caption || DOC_LABELS[d.docType] || "Document"}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {listing.point && (
        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-base font-semibold">Location</h2>
          <StaticPin point={listing.point} />
          <p className="text-xs text-muted-foreground">The pin shows the approximate location. The exact address is shared on enquiry.</p>
        </section>
      )}

      <Link href="/search" className="text-sm text-primary hover:underline">
        ← Back to search
      </Link>
    </article>
  )
}
