import type { Metadata } from "next"
import { cache } from "react"
import { notFound, permanentRedirect } from "next/navigation"
import { serverApi } from "@/core/api/server-client"
import { FeatureNotIncluded } from "@/components/site/no-site-access"
import { env } from "@/core/config/env"
import { EnquiryForm } from "@/features/enquiries"
import { ListingView, listingsApi } from "@/features/listings"
import { ListingCardView } from "@/features/search"
import { loadFilterCatalog } from "@/features/search/lib/server-catalog"
import { hasSiteFeature } from "@/features/users/lib/server-access"

type Props = { params: Promise<{ slug: string }> }

// One lookup per request, shared by generateMetadata and the page. Per-user
// (the listings feature gate), so uncached.
const lookup = cache((slug: string) => listingsApi(serverApi()).lookup(slug))

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  if (!(await hasSiteFeature("listings"))) return { title: "Warehouse", robots: { index: false } }
  const res = await lookup(slug)
  if (res.kind === "gone") return { title: "Listing removed", robots: { index: false } }
  if (res.kind !== "found") return { title: "Warehouse not found", robots: { index: false } }
  const { seo } = res.listing
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: `${env.siteUrl}${seo.canonicalPath}` },
    openGraph: { title: seo.title, description: seo.description, images: seo.ogImage ? [seo.ogImage] : undefined, type: "website" },
  }
}

export default async function ListingPage({ params }: Props) {
  const { slug } = await params
  if (!(await hasSiteFeature("listings"))) return <FeatureNotIncluded what="Listings" />
  const canEnquire = await hasSiteFeature("enquiries")
  const res = await lookup(slug)
  if (res.kind === "moved") permanentRedirect(res.path)
  if (res.kind === "missing") notFound()

  const catalog = await loadFilterCatalog()
  const industryNames = Object.fromEntries((catalog?.industries ?? []).map((i) => [i.key, i.name]))

  if (res.kind === "gone") {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-12">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-4xl tracking-tight">This warehouse has been removed</h1>
          <p className="text-sm text-muted-foreground">It&apos;s no longer listed. Here are similar options nearby.</p>
        </div>
        <div className="flex flex-col gap-3">
          {res.nearby.map((c) => (
            <ListingCardView key={c.shortId} card={c} industryNames={industryNames} />
          ))}
        </div>
        {canEnquire && <EnquiryForm />}
      </div>
    )
  }

  const { listing } = res
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 lg:grid-cols-[1fr_380px]">
      {listing.seo.jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listing.seo.jsonLd).replace(/</g, "\\u003c") }} />
      )}
      <ListingView listing={listing} industryNames={industryNames} />
      {canEnquire && (
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <EnquiryForm listingShortId={listing.shortId} listingName={listing.name} />
        </aside>
      )}
    </div>
  )
}
