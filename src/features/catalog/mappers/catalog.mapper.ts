import { mapPage, type Page, type PageNetwork } from "@/core/api"
import { parseDate } from "@/lib/format"
import type {
  AnswerItemNetwork,
  AttributesNetwork,
  BulkItemNetwork,
  FieldValueNetwork,
  ListingContentNetwork,
  MediaNetwork,
  MoneyNetwork,
  NeedsInfoAnswerNetwork,
  NeedsInfoKeyNetwork,
  NeedsInfoWarehouseNetwork,
  PreviewNetwork,
  RentAdminNetwork,
  RevisionNetwork,
  RevisionResultNetwork,
  WarehouseDetailNetwork,
  WarehouseNetwork,
} from "../network/catalog.network"
import type {
  AnswerItem,
  BulkItem,
  FieldValue,
  ListingAttributes,
  ListingContent,
  Media,
  MediaKind,
  MediaVisibility,
  Money,
  NeedsInfoAnswer,
  NeedsInfoKey,
  NeedsInfoWarehouse,
  NodeStatus,
  Preview,
  RentAdmin,
  Revision,
  RevisionResult,
  RevisionState,
  Verdict,
  Warehouse,
  WarehouseDetail,
  WarehouseStatus,
} from "../entities/catalog.entity"

// --- values ---

export function toFieldValue(n: FieldValueNetwork | null | undefined): FieldValue | null {
  if (!n || n.v === null || n.v === undefined) return null
  const out: FieldValue = { v: n.v }
  if (n.raw) out.raw = { value: n.raw.value, unit: n.raw.unit ?? "" }
  if (n.source) out.source = n.source
  return out
}

export function fromFieldValue(v: FieldValue | null): FieldValueNetwork | null {
  if (!v) return null
  const out: FieldValueNetwork = { v: v.v }
  if (v.raw) out.raw = { value: v.raw.value, unit: v.raw.unit || undefined }
  if (v.source) out.source = v.source
  return out
}

export function toAttributes(n: AttributesNetwork | null | undefined): ListingAttributes {
  const out: ListingAttributes = {}
  for (const [key, st] of Object.entries(n ?? {})) {
    if (st.status !== "yes" && st.status !== "unknown") continue
    const fields: Record<string, FieldValue | null> = {}
    for (const [fk, fv] of Object.entries(st.fields ?? {})) fields[fk] = toFieldValue(fv)
    out[key] = { status: st.status, fields }
  }
  return out
}

export function fromAttributes(a: ListingAttributes): AttributesNetwork {
  const out: AttributesNetwork = {}
  for (const [key, st] of Object.entries(a)) {
    if (st.status === "unknown") {
      out[key] = { status: "unknown" }
      continue
    }
    const fields: Record<string, FieldValueNetwork | null> = {}
    for (const [fk, fv] of Object.entries(st.fields)) fields[fk] = fromFieldValue(fv)
    out[key] = { status: "yes", fields }
  }
  return out
}

export function toMoney(n: MoneyNetwork | null | undefined): Money | null {
  if (!n) return null
  return {
    amount: n.amount ?? 0,
    currency: n.currency ?? "INR",
    basis: n.basis ?? "",
    period: n.period ?? "",
    onRequest: !!n.onRequest,
  }
}

export function fromMoney(m: Money | null): MoneyNetwork | undefined {
  if (!m) return undefined
  return {
    amount: m.onRequest ? 0 : Math.max(0, Math.round(m.amount)),
    currency: m.currency.toUpperCase(),
    basis: m.basis || undefined,
    period: m.period || undefined,
    onRequest: m.onRequest || undefined,
  }
}

function toRentAdmin(n: RentAdminNetwork | null | undefined): RentAdmin | null {
  if (!n) return null
  const { deposit, lockInMonths, escalationPct, escalationEveryMonths, leaseTermMonths, cam, ...rest } = n
  return {
    deposit: toMoney(deposit),
    lockInMonths: lockInMonths ?? 0,
    escalationPct: escalationPct ?? 0,
    escalationEveryMonths: escalationEveryMonths ?? 0,
    leaseTermMonths: leaseTermMonths ?? 0,
    cam: toMoney(cam),
    rest: rest as Record<string, unknown>,
  }
}

function fromRentAdmin(r: RentAdmin | null): RentAdminNetwork | undefined {
  if (!r) return undefined
  return {
    ...(r.rest as RentAdminNetwork),
    deposit: fromMoney(r.deposit),
    lockInMonths: r.lockInMonths || undefined,
    escalationPct: r.escalationPct || undefined,
    escalationEveryMonths: r.escalationEveryMonths || undefined,
    leaseTermMonths: r.leaseTermMonths || undefined,
    cam: fromMoney(r.cam),
  }
}

export function toContent(n: ListingContentNetwork | null | undefined): ListingContent {
  return {
    attributes: toAttributes(n?.attributes),
    media: (n?.media ?? [])
      .map((m) => ({ mediaId: m.mediaId, order: m.order, isCover: m.isCover, caption: m.caption ?? "" }))
      .sort((a, b) => a.order - b.order),
    rentAdmin: toRentAdmin(n?.rentAdmin),
  }
}

export function fromContent(c: ListingContent): ListingContentNetwork {
  return {
    attributes: fromAttributes(c.attributes),
    media: c.media.map((m, i) => ({ mediaId: m.mediaId, order: i + 1, isCover: m.isCover, caption: m.caption.trim() || undefined })),
    rentAdmin: fromRentAdmin(c.rentAdmin),
  }
}

// --- documents ---

export function toWarehouse(n: WarehouseNetwork): Warehouse {
  return {
    id: n.id,
    shortId: n.shortId,
    slug: n.slug,
    status: n.status as WarehouseStatus,
    liveVersion: n.liveVersion,
    openRevisionId: n.openRevisionId ?? null,
    live: n.live ? toContent(n.live) : null,
    name: n.name,
    city: n.city ?? "",
    locality: n.locality ?? "",
    country: n.country ?? "",
    postalCode: n.postalCode ?? "",
    point: n.loc ? { lng: n.loc.coordinates[0], lat: n.loc.coordinates[1] } : null,
    totalSqm: n.totalSqm,
    price: n.price ?? null,
    coverKey: n.coverKey ?? "",
    completeness: n.completeness,
    verifiedRatio: n.verifiedRatio,
    needsInfo: n.needsInfo ?? [],
    needsInfoCount: n.needsInfoCount,
    publishedAt: parseDate(n.publishedAt),
    archivedAt: parseDate(n.archivedAt),
    createdBy: n.createdBy,
    createdAt: parseDate(n.createdAt),
    updatedAt: parseDate(n.updatedAt),
  }
}

export function toRevision(n: RevisionNetwork): Revision {
  return {
    id: n.id,
    warehouseId: n.warehouseId,
    version: n.version,
    baseVersion: n.baseVersion,
    state: n.state as RevisionState,
    rev: n.rev,
    batchId: n.batchId ?? "",
    content: toContent(n.content),
    review: (n.review ?? []).map((r) => ({ action: r.action, by: r.by, at: parseDate(r.at), comment: r.comment ?? "" })),
    createdBy: n.createdBy,
    updatedBy: n.updatedBy,
    createdAt: parseDate(n.createdAt),
    updatedAt: parseDate(n.updatedAt),
    submittedBy: n.submittedBy ?? "",
    submittedAt: parseDate(n.submittedAt),
    approvedBy: n.approvedBy ?? "",
    approvedAt: parseDate(n.approvedAt),
  }
}

export function toPreview(n: PreviewNetwork | null | undefined): Preview | null {
  if (!n) return null
  return {
    state: (n.state ?? {}) as Record<string, NodeStatus>,
    ratios: n.ratios ?? {},
    needsInfo: n.needsInfo ?? [],
    fit: (n.fit ?? {}) as Record<string, Verdict>,
    submitProblems: n.submitProblems ?? [],
  }
}

export function toMedia(n: MediaNetwork): Media {
  return {
    id: n.id,
    warehouseId: n.warehouseId,
    kind: n.kind as MediaKind,
    docType: n.docType ?? "",
    visibility: n.visibility as MediaVisibility,
    key: n.key,
    filename: n.filename,
    contentType: n.contentType,
    bytes: n.bytes,
    status: n.status,
    uploadedBy: n.uploadedBy,
    createdAt: parseDate(n.createdAt),
  }
}

export function toWarehouseDetail(n: WarehouseDetailNetwork): WarehouseDetail {
  return {
    warehouse: toWarehouse(n.warehouse),
    openRevision: n.openRevision ? toRevision(n.openRevision) : null,
    preview: toPreview(n.preview),
    media: (n.media ?? []).map(toMedia),
    history: (n.history ?? []).map(toRevision),
  }
}

export function toRevisionResult(n: RevisionResultNetwork): RevisionResult {
  return {
    revision: n.revision ? toRevision(n.revision) : null,
    preview: toPreview(n.preview),
    warnings: n.warnings ?? [],
  }
}

export function toBulkItem(n: BulkItemNetwork): BulkItem {
  return { revisionId: n.revisionId, ok: n.ok, code: n.code ?? "", error: n.error ?? "" }
}

export function toWarehousePage(n: PageNetwork<WarehouseNetwork>): Page<Warehouse> {
  return mapPage(n, toWarehouse)
}

export function toRevisionPage(n: PageNetwork<RevisionNetwork>): Page<Revision> {
  return mapPage(n, toRevision)
}

// --- needs-info ---

export function toNeedsInfoKey(n: NeedsInfoKeyNetwork): NeedsInfoKey {
  return { key: n.key, kind: n.kind === "field" ? "field" : "node", name: n.name, count: n.count }
}

export function toNeedsInfoWarehouse(n: NeedsInfoWarehouseNetwork): NeedsInfoWarehouse {
  return {
    id: n.id,
    shortId: n.shortId,
    name: n.name,
    city: n.city ?? "",
    needsInfo: n.needsInfo ?? [],
    openRevision: n.openRevision ? { id: n.openRevision.id, state: n.openRevision.state as RevisionState } : null,
  }
}

export function fromNeedsInfoAnswer(a: NeedsInfoAnswer): NeedsInfoAnswerNetwork {
  const out: NeedsInfoAnswerNetwork = { warehouseId: a.warehouseId, node: a.node }
  if (a.status) out.status = a.status
  if (a.fields) {
    out.fields = {}
    for (const [k, v] of Object.entries(a.fields)) out.fields[k] = fromFieldValue(v)
  }
  return out
}

export function toAnswerItem(n: AnswerItemNetwork): AnswerItem {
  return {
    warehouseId: n.warehouseId,
    ok: n.ok,
    revisionId: n.revisionId ?? "",
    submitted: n.submitted,
    code: n.code ?? "",
    error: n.error ?? "",
  }
}
