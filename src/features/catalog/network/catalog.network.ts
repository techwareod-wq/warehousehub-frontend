/** crunch models.FieldValue */
export interface FieldValueNetwork {
  v: unknown
  raw?: { value: unknown; unit?: string } | null
  source?: string
  verifiedAt?: string
  by?: string
  at?: string
}

/** crunch models.NodeState */
export interface NodeStateNetwork {
  status: string
  fields?: Record<string, FieldValueNetwork | null> | null
}

export type AttributesNetwork = Record<string, NodeStateNetwork>

export interface MoneyNetwork {
  amount: number
  currency: string
  basis?: string
  period?: string
  onRequest?: boolean
}

export interface MediaRefNetwork {
  mediaId: string
  order: number
  isCover: boolean
  caption?: string
}

export interface RentAdminNetwork {
  deposit?: MoneyNetwork | null
  lockInMonths?: number
  escalationPct?: number
  escalationEveryMonths?: number
  leaseTermMonths?: number
  cam?: MoneyNetwork | null
  taxes?: { name: string; pct?: number; money?: MoneyNetwork }[] | null
  agreementMediaId?: string | null
  otherCharges?: { label: string; money: MoneyNetwork }[] | null
}

/** crunch models.ListingContent */
export interface ListingContentNetwork {
  attributes: AttributesNetwork | null
  media: MediaRefNetwork[] | null
  rentAdmin?: RentAdminNetwork | null
}

export interface PriceNetwork {
  currency: string
  perSqmMonth: number
  basis: string
  approx: boolean
  onRequest: boolean
}

/** crunch models.Warehouse (admin view) */
export interface WarehouseNetwork {
  id: string
  shortId: string
  slug: string
  slugHistory: string[] | null
  status: string
  liveVersion: number
  openRevisionId: string | null
  live: ListingContentNetwork | null
  name: string
  country?: string
  postalCode?: string
  city?: string
  locality?: string
  loc?: { type: string; coordinates: [number, number] } | null
  totalSqm: number
  price?: PriceNetwork | null
  coverKey?: string
  completeness: number
  verifiedRatio: number
  chips: string[] | null
  unk: string[] | null
  fit: string[] | null
  needsInfo: string[] | null
  needsInfoCount: number
  publishedAt?: string
  archivedAt?: string
  archivedBy?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ReviewEntryNetwork {
  action: string
  by: string
  at: string
  comment?: string
}

/** crunch models.WarehouseRevision */
export interface RevisionNetwork {
  id: string
  warehouseId: string
  version: number
  baseVersion: number
  state: string
  rev: number
  batchId?: string
  content: ListingContentNetwork
  review: ReviewEntryNetwork[] | null
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
  submittedBy?: string
  submittedAt?: string
  approvedBy?: string
  approvedAt?: string
}

/** crunch catalogService dto.Preview */
export interface PreviewNetwork {
  state: Record<string, string> | null
  ratios: Record<string, number> | null
  needsInfo: string[] | null
  fit: Record<string, string> | null
  submitProblems: string[] | null
}

/** crunch models.WarehouseMedia */
export interface MediaNetwork {
  id: string
  warehouseId: string
  kind: string
  docType?: string
  visibility: string
  key: string
  filename: string
  contentType: string
  bytes: number
  status: string
  uploadedBy: string
  createdAt: string
}

/** GET /v1/admin/warehouses/detail */
export interface WarehouseDetailNetwork {
  warehouse: WarehouseNetwork
  openRevision: RevisionNetwork | null
  preview?: PreviewNetwork | null
  media: MediaNetwork[] | null
  history: RevisionNetwork[] | null
}

/** Every revision write answers this. */
export interface RevisionResultNetwork {
  revision: RevisionNetwork | null
  preview?: PreviewNetwork | null
  warnings?: string[] | null
}

/** POST /v1/admin/warehouses/create */
export interface CreateWarehouseResponseNetwork extends RevisionResultNetwork {
  warehouse: WarehouseNetwork
}

export interface BulkItemNetwork {
  revisionId: string
  ok: boolean
  code?: string
  error?: string
}

export interface BulkApproveResponseNetwork {
  batchId: string
  items: BulkItemNetwork[] | null
}

export interface UploadUrlRequestNetwork {
  warehouseId: string
  kind: string
  docType?: string
  visibility?: string
  filename: string
  contentType: string
  bytes: number
}

export interface UploadUrlResponseNetwork {
  mediaId: string
  putUrl: string
  headers?: Record<string, string[]> | null
}

export interface LocationNetwork {
  lat: number
  lng: number
  accuracy?: string
  source: string
  placeId?: string
  addressHash?: string
}

export interface AddressNetwork {
  line1: string
  line2?: string
  locality?: string
  city: string
  region?: string
  postalCode?: string
  country: string
}

/** GET /v1/admin/needs-info/summary → {items} */
export interface NeedsInfoKeyNetwork {
  key: string
  kind: string
  name: string
  count: number
}

/** GET /v1/admin/needs-info/list items */
export interface NeedsInfoWarehouseNetwork {
  id: string
  shortId: string
  name: string
  city?: string
  needsInfo: string[] | null
  openRevision: { id: string; state: string } | null
}

export interface NeedsInfoAnswerNetwork {
  warehouseId: string
  node: string
  status?: string
  fields?: Record<string, FieldValueNetwork | null>
}

export interface AnswerItemNetwork {
  warehouseId: string
  ok: boolean
  revisionId?: string
  submitted: boolean
  code?: string
  error?: string
}

export interface AnswerResponseNetwork {
  batchId: string
  items: AnswerItemNetwork[] | null
}
