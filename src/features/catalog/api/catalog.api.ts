import type { HttpClient, Page, PageNetwork } from "@/core/api"
import type {
  AddressNetwork,
  AnswerResponseNetwork,
  BulkApproveResponseNetwork,
  CreateWarehouseResponseNetwork,
  LocationNetwork,
  MediaNetwork,
  NeedsInfoKeyNetwork,
  NeedsInfoWarehouseNetwork,
  RevisionNetwork,
  RevisionResultNetwork,
  UploadUrlRequestNetwork,
  UploadUrlResponseNetwork,
  WarehouseDetailNetwork,
  WarehouseNetwork,
} from "../network/catalog.network"
import {
  fromContent,
  fromNeedsInfoAnswer,
  toAnswerItem,
  toBulkItem,
  toMedia,
  toNeedsInfoKey,
  toNeedsInfoWarehouse,
  toRevision,
  toRevisionPage,
  toRevisionResult,
  toWarehouse,
  toWarehouseDetail,
  toWarehousePage,
} from "../mappers/catalog.mapper"
import { mapPage } from "@/core/api"
import type {
  Address,
  AnswerItem,
  BulkItem,
  GeoLocation,
  ListingContent,
  Media,
  MediaKind,
  MediaVisibility,
  NeedsInfoAnswer,
  NeedsInfoKey,
  NeedsInfoWarehouse,
  Revision,
  RevisionResult,
  Warehouse,
  WarehouseDetail,
  WarehouseStatus,
} from "../entities/catalog.entity"

export interface WarehouseListParams {
  status?: WarehouseStatus | ""
  q?: string
  city?: string
  needsInfo?: boolean
  page?: number
  limit?: number
}

export interface UploadRequest {
  warehouseId: string
  kind: MediaKind
  docType?: string
  visibility?: MediaVisibility
  file: File
}

/** Warehouse lifecycle, review queue, media and needs-info (/v1/admin/…). */
export function catalogApi(client: HttpClient) {
  const revisionAction = async (path: string, revisionId: string, comment?: string): Promise<RevisionResult> =>
    toRevisionResult(await client.post<RevisionResultNetwork>(path, { revisionId, comment }))

  return {
    async list(p: WarehouseListParams): Promise<Page<Warehouse>> {
      return toWarehousePage(
        await client.get<PageNetwork<WarehouseNetwork>>("/v1/admin/warehouses", {
          status: p.status,
          q: p.q,
          city: p.city,
          needsInfo: p.needsInfo ? "true" : undefined,
          page: p.page,
          limit: p.limit,
        }),
      )
    },

    async detail(id: string): Promise<WarehouseDetail> {
      return toWarehouseDetail(await client.get<WarehouseDetailNetwork>("/v1/admin/warehouses/detail", { id }))
    },

    async create(): Promise<{ warehouse: Warehouse; result: RevisionResult }> {
      const res = await client.post<CreateWarehouseResponseNetwork>("/v1/admin/warehouses/create", {})
      return { warehouse: toWarehouse(res.warehouse), result: toRevisionResult(res) }
    },

    async archive(warehouseId: string): Promise<void> {
      await client.post("/v1/admin/warehouses/archive", { warehouseId })
    },
    async restore(warehouseId: string): Promise<RevisionResult> {
      return toRevisionResult(await client.post<RevisionResultNetwork>("/v1/admin/warehouses/restore", { warehouseId }))
    },
    async remove(warehouseId: string): Promise<void> {
      await client.post("/v1/admin/warehouses/delete", { warehouseId })
    },

    async revision(id: string): Promise<Revision> {
      return toRevision(await client.get<RevisionNetwork>("/v1/admin/revisions/detail", { id }))
    },
    async open(warehouseId: string): Promise<RevisionResult> {
      return toRevisionResult(await client.post<RevisionResultNetwork>("/v1/admin/revisions/open", { warehouseId }))
    },
    async save(revisionId: string, rev: number, content: ListingContent): Promise<RevisionResult> {
      return toRevisionResult(
        await client.post<RevisionResultNetwork>("/v1/admin/revisions/save", { revisionId, rev, content: fromContent(content) }),
      )
    },
    submit: (revisionId: string) => revisionAction("/v1/admin/revisions/submit", revisionId),
    withdraw: (revisionId: string) => revisionAction("/v1/admin/revisions/withdraw", revisionId),
    discard: (revisionId: string) => revisionAction("/v1/admin/revisions/discard", revisionId),
    approve: (revisionId: string) => revisionAction("/v1/admin/revisions/approve", revisionId),
    reject: (revisionId: string, comment: string) => revisionAction("/v1/admin/revisions/reject", revisionId, comment),

    async bulkApprove(revisionIds: string[]): Promise<{ batchId: string; items: BulkItem[] }> {
      const res = await client.post<BulkApproveResponseNetwork>("/v1/admin/revisions/bulk-approve", { revisionIds })
      return { batchId: res.batchId, items: (res.items ?? []).map(toBulkItem) }
    },

    async queue(page = 1, limit?: number): Promise<Page<Revision>> {
      return toRevisionPage(await client.get<PageNetwork<RevisionNetwork>>("/v1/admin/revisions/queue", { page, limit }))
    },

    async history(warehouseId: string): Promise<Revision[]> {
      const res = await client.get<{ items: RevisionNetwork[] | null }>("/v1/admin/revisions/history", { warehouseId })
      return (res.items ?? []).map(toRevision)
    },

    async geocodePreview(address: Address): Promise<GeoLocation> {
      const body: { address: AddressNetwork } = { address }
      const loc = await client.post<LocationNetwork>("/v1/admin/geocode/preview", body)
      return { lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy ?? "", source: loc.source, placeId: loc.placeId ?? "" }
    },

    async media(warehouseId: string): Promise<Media[]> {
      const res = await client.get<{ items: MediaNetwork[] | null }>("/v1/admin/media", { warehouseId })
      return (res.items ?? []).map(toMedia)
    },

    async mediaLink(mediaId: string): Promise<string> {
      return (await client.get<{ url: string }>("/v1/admin/media/link", { id: mediaId })).url
    },

    /** Presign → PUT the file straight to S3 → confirm. Returns the ready media. */
    async upload(req: UploadRequest): Promise<Media> {
      const body: UploadUrlRequestNetwork = {
        warehouseId: req.warehouseId,
        kind: req.kind,
        docType: req.kind === "doc" ? req.docType : undefined,
        visibility: req.kind === "doc" ? req.visibility : undefined,
        filename: req.file.name,
        contentType: req.file.type || "application/octet-stream",
        bytes: req.file.size,
      }
      const target = await client.post<UploadUrlResponseNetwork>("/v1/admin/media/upload-url", body)
      const headers: Record<string, string> = { "Content-Type": body.contentType }
      for (const [k, vs] of Object.entries(target.headers ?? {})) {
        if (k.toLowerCase() !== "host" && vs?.length) headers[k] = vs[0]
      }
      const put = await fetch(target.putUrl, { method: "PUT", body: req.file, headers })
      if (!put.ok) throw new Error(`Upload to storage failed (${put.status})`)
      return toMedia(await client.post<MediaNetwork>("/v1/admin/media/confirm", { mediaId: target.mediaId }))
    },

    async needsInfoSummary(): Promise<NeedsInfoKey[]> {
      const res = await client.get<{ items: NeedsInfoKeyNetwork[] | null }>("/v1/admin/needs-info/summary")
      return (res.items ?? []).map(toNeedsInfoKey)
    },

    async needsInfoList(key: string, page = 1, limit?: number): Promise<Page<NeedsInfoWarehouse>> {
      return mapPage(
        await client.get<PageNetwork<NeedsInfoWarehouseNetwork>>("/v1/admin/needs-info/list", { key, page, limit }),
        toNeedsInfoWarehouse,
      )
    },

    async answerNeedsInfo(items: NeedsInfoAnswer[], submit: boolean): Promise<{ batchId: string; items: AnswerItem[] }> {
      const res = await client.post<AnswerResponseNetwork>("/v1/admin/needs-info/answer", {
        items: items.map(fromNeedsInfoAnswer),
        submit,
      })
      return { batchId: res.batchId, items: (res.items ?? []).map(toAnswerItem) }
    },
  }
}
