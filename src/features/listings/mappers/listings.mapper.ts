import { toListingCard, toRate } from "@/features/search"
import { formatMoney, formatNumber, parseDate } from "@/lib/format"
import { sqmToSqft, unitLabel } from "@/lib/units"
import type { PublicFieldNetwork, PublicListingNetwork, PublicNodeNetwork } from "../network/listings.network"
import type { Listing, PublicField, PublicMedia, PublicNode } from "../entities/listings.entity"

function displayValue(f: PublicFieldNetwork): string {
  const unit = f.unit ? ` ${unitLabel(f.unit)}` : ""
  const v = f.value as unknown
  if (f.labels && f.labels.length) return f.labels.join(", ")
  switch (f.type) {
    case "bool":
      return v ? "Yes" : "No"
    case "number":
    case "ratio":
      return typeof v === "number" ? `${formatNumber(v, 2)}${unit}` : String(v ?? "")
    case "range": {
      const r = v as { min?: number; max?: number }
      return `${formatNumber(r?.min ?? 0, 2)} – ${formatNumber(r?.max ?? 0, 2)}${unit}`
    }
    case "area": {
      const a = v as { sqm?: number }
      return a?.sqm ? `${formatNumber(Math.round(sqmToSqft(a.sqm)))} sq ft` : ""
    }
    case "money": {
      const m = v as { amount?: number; currency?: string; onRequest?: boolean }
      return m?.onRequest ? "On request" : formatMoney(m?.amount ?? 0, m?.currency ?? "INR")
    }
    case "multi":
      return Array.isArray(v) ? v.join(", ") : ""
    default:
      return typeof v === "string" ? v : v === null || v === undefined ? "" : JSON.stringify(v)
  }
}

function toField(n: PublicFieldNetwork): PublicField {
  return { key: n.key, name: n.name, type: n.type, display: displayValue(n) }
}

function toNode(n: PublicNodeNetwork): PublicNode {
  return { key: n.key, name: n.name, fields: (n.fields ?? []).map(toField).filter((f) => f.display !== ""), children: (n.children ?? []).map(toNode) }
}

export function toListing(n: PublicListingNetwork): Listing {
  const media: PublicMedia[] = (n.media ?? []).map((m) => ({
    kind: m.kind === "doc" ? "doc" : "photo",
    docType: m.docType ?? "",
    url: m.url,
    caption: m.caption ?? "",
    isCover: m.isCover,
  }))
  const photos = media.filter((m) => m.kind === "photo").sort((a, b) => Number(b.isCover) - Number(a.isCover))
  return {
    shortId: n.shortId,
    slug: n.slug,
    name: n.name,
    description: n.description ?? "",
    address: {
      locality: n.address?.locality ?? "",
      city: n.address?.city ?? "",
      region: n.address?.region ?? "",
      postalCode: n.address?.postalCode ?? "",
      country: n.address?.country ?? "",
    },
    point: n.loc ?? null,
    totalSqm: n.totalArea?.sqm ?? null,
    totalAreaDisplay: n.totalArea
      ? `${formatNumber(n.totalArea.value)} ${unitLabel(n.totalArea.unit)}`
      : "",
    rate: toRate(n.rate),
    attributes: (n.attributes ?? []).map(toNode),
    industries: n.industries ?? [],
    photos,
    docs: media.filter((m) => m.kind === "doc"),
    seo: {
      title: n.seo?.title ?? n.name,
      description: n.seo?.metaDescription ?? "",
      canonicalPath: n.seo?.canonicalPath ?? `/warehouses/${n.slug}`,
      ogImage: n.seo?.ogImage ?? "",
      jsonLd: n.seo?.jsonLd ?? null,
    },
    updatedAt: parseDate(n.updatedAt),
  }
}

export { toListingCard }
