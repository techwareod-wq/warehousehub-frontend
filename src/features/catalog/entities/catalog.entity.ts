/** A stored field value: `v` canonical, `raw` as typed (number/range). */
export interface FieldValue {
  v: unknown
  raw?: { value: unknown; unit: string }
  source?: string
}

/** Stored node states: yes or unknown. Absent = no (D-133). */
export type NodeStatus = "yes" | "unknown" | "no"

export interface NodeEntry {
  status: "yes" | "unknown"
  /** null = explicitly "not provided" on an optional field. */
  fields: Record<string, FieldValue | null>
}

export type ListingAttributes = Record<string, NodeEntry>

export interface Money {
  /** Minor units (paise). */
  amount: number
  currency: string
  basis: string
  period: string
  onRequest: boolean
}

export const RENT_BASES = [
  { value: "per_sqft_month", label: "per sq ft / month" },
  { value: "per_sqm_month", label: "per sq m / month" },
  { value: "flat_month", label: "flat / month" },
] as const

export interface Address {
  line1: string
  line2: string
  locality: string
  city: string
  region: string
  postalCode: string
  country: string
}

export interface GeoLocation {
  lat: number
  lng: number
  accuracy: string
  source: "manual" | "geocoded" | string
  placeId: string
}

export interface MediaRef {
  mediaId: string
  order: number
  isCover: boolean
  caption: string
}

/** Admin-only rent terms. Unknown keys from the API are preserved on save. */
export interface RentAdmin {
  deposit: Money | null
  lockInMonths: number
  escalationPct: number
  escalationEveryMonths: number
  leaseTermMonths: number
  cam: Money | null
  /** Everything else (taxes, other charges, agreement) kept as-is. */
  rest: Record<string, unknown>
}

export interface ListingContent {
  attributes: ListingAttributes
  media: MediaRef[]
  rentAdmin: RentAdmin | null
}

export type WarehouseStatus = "unpublished" | "live" | "archived"

export interface Price {
  currency: string
  perSqmMonth: number
  basis: string
  approx: boolean
  onRequest: boolean
}

export interface Warehouse {
  id: string
  shortId: string
  slug: string
  status: WarehouseStatus
  liveVersion: number
  openRevisionId: string | null
  live: ListingContent | null
  name: string
  city: string
  locality: string
  country: string
  postalCode: string
  point: { lat: number; lng: number } | null
  totalSqm: number
  price: Price | null
  coverKey: string
  completeness: number
  verifiedRatio: number
  needsInfo: string[]
  needsInfoCount: number
  publishedAt?: Date
  archivedAt?: Date
  createdBy: string
  createdAt?: Date
  updatedAt?: Date
}

export type RevisionState = "draft" | "in_review" | "approved" | "superseded" | "discarded"

export interface ReviewEntry {
  action: string
  by: string
  at?: Date
  comment: string
}

export interface Revision {
  id: string
  warehouseId: string
  version: number
  baseVersion: number
  state: RevisionState
  /** CAS counter for saves. */
  rev: number
  batchId: string
  content: ListingContent
  review: ReviewEntry[]
  createdBy: string
  updatedBy: string
  createdAt?: Date
  updatedAt?: Date
  submittedBy: string
  submittedAt?: Date
  approvedBy: string
  approvedAt?: Date
}

/** Industry verdicts: Fit, Partial, Unverified, Not fit (D-033). */
export type Verdict = "F" | "P" | "U" | "N"

export interface Preview {
  state: Record<string, NodeStatus>
  ratios: Record<string, number>
  needsInfo: string[]
  fit: Record<string, Verdict>
  submitProblems: string[]
}

export type MediaKind = "photo" | "doc"
export type MediaVisibility = "public" | "staff"

export const DOC_TYPES = [
  { value: "floor_plan", label: "Floor plan" },
  { value: "agreement", label: "Agreement" },
  { value: "certificate", label: "Certificate" },
  { value: "other", label: "Other" },
] as const

export interface Media {
  id: string
  warehouseId: string
  kind: MediaKind
  docType: string
  visibility: MediaVisibility
  key: string
  filename: string
  contentType: string
  bytes: number
  status: "pending" | "ready" | "orphaned" | string
  uploadedBy: string
  createdAt?: Date
}

export interface WarehouseDetail {
  warehouse: Warehouse
  openRevision: Revision | null
  preview: Preview | null
  media: Media[]
  history: Revision[]
}

export interface RevisionResult {
  revision: Revision | null
  preview: Preview | null
  warnings: string[]
}

export interface BulkItem {
  revisionId: string
  ok: boolean
  code: string
  error: string
}

export interface NeedsInfoKey {
  key: string
  kind: "node" | "field"
  name: string
  count: number
}

export interface NeedsInfoWarehouse {
  id: string
  shortId: string
  name: string
  city: string
  needsInfo: string[]
  openRevision: { id: string; state: RevisionState } | null
}

/** One needs-info answer: yes/no on an unknown node, or missing field values. */
export interface NeedsInfoAnswer {
  warehouseId: string
  node: string
  status?: "yes" | "no"
  fields?: Record<string, FieldValue | null>
}

export interface AnswerItem {
  warehouseId: string
  ok: boolean
  revisionId: string
  submitted: boolean
  code: string
  error: string
}

export const SAVE_WARNINGS: Record<string, string> = {
  address_changed_pin_manual: "The address changed but the pin was placed by hand — check the pin.",
  geocoding_unavailable: "Geocoding is unavailable right now — place the pin by hand.",
  address_not_found: "The address couldn't be found on the map — place the pin by hand.",
  geocode_pending: "The address will be geocoded in the background.",
}
