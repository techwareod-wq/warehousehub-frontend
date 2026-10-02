import type { Address, FieldValue, ListingContent, Money } from "../entities/catalog.entity"

const ROOT = "warehouse"

/** The stored value of a Warehouse root field. */
export function rootValue(content: ListingContent | null | undefined, field: string): unknown {
  return content?.attributes[ROOT]?.fields[field]?.v
}

export function listingName(content: ListingContent | null | undefined): string {
  const v = rootValue(content, "name")
  return typeof v === "string" && v ? v : "Untitled warehouse"
}

export function listingAddress(content: ListingContent | null | undefined): Partial<Address> {
  const v = rootValue(content, "address")
  return v && typeof v === "object" ? (v as Partial<Address>) : {}
}

export function listingRent(content: ListingContent | null | undefined): Money | null {
  const v = rootValue(content, "rent") as Money | undefined
  return v && typeof v === "object" ? v : null
}

/** An empty value of the right shape for a newly-yes required field. */
export function isBlank(v: FieldValue | null | undefined): boolean {
  if (!v) return true
  if (v.v === null || v.v === undefined || v.v === "") return true
  return Array.isArray(v.v) && v.v.length === 0
}

export function cloneContent(c: ListingContent): ListingContent {
  return JSON.parse(JSON.stringify(c)) as ListingContent
}
