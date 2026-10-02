import { mapPage, type HttpClient, type Page, type PageNetwork } from "@/core/api"
import type { AssignRequestNetwork, EnquiryDetailNetwork, EnquiryNetwork, StatusRequestNetwork } from "../network/enquiries.network"
import { fromEnquiryDraft, toEnquiry, toEnquiryDetail } from "../mappers/enquiries.mapper"
import type { CloseReason, Enquiry, EnquiryDetail, EnquiryDraft, EnquiryFilter, EnquiryStatus } from "../entities/enquiries.entity"

/** Visitor side: POST /v1/enquiries (signed in). */
export function enquirySubmitApi(client: HttpClient) {
  return {
    async submit(d: EnquiryDraft): Promise<{ id: string }> {
      return client.post<{ id: string }>("/v1/enquiries", fromEnquiryDraft(d))
    },
  }
}

/** Staff inbox: /v1/admin/enquiries/* (editor). */
export function enquiriesApi(client: HttpClient) {
  const filterQuery = (f: EnquiryFilter) => ({
    status: f.status,
    assignee: f.assignee,
    listing: f.listing,
    q: f.q,
    from: f.from,
    to: f.to,
  })

  return {
    async list(f: EnquiryFilter, page = 1, limit?: number): Promise<Page<Enquiry>> {
      return mapPage(await client.get<PageNetwork<EnquiryNetwork>>("/v1/admin/enquiries", { ...filterQuery(f), page, limit }), toEnquiry)
    },

    async detail(id: string): Promise<EnquiryDetail> {
      return toEnquiryDetail(await client.get<EnquiryDetailNetwork>("/v1/admin/enquiries/detail", { id }))
    },

    async setStatus(e: Enquiry, status: EnquiryStatus, close?: { reason: CloseReason; note: string }): Promise<Enquiry> {
      const body: StatusRequestNetwork = {
        id: e.id,
        status,
        closeReason: status === "closed" ? close?.reason : undefined,
        closeNote: status === "closed" ? close?.note || undefined : undefined,
        expectedUpdatedAt: e.version,
      }
      return toEnquiry(await client.post<EnquiryNetwork>("/v1/admin/enquiries/status", body))
    },

    async assign(e: Enquiry, assigneeUserId: string | null): Promise<Enquiry> {
      const body: AssignRequestNetwork = { id: e.id, assigneeUserId, expectedUpdatedAt: e.version }
      return toEnquiry(await client.post<EnquiryNetwork>("/v1/admin/enquiries/assign", body))
    },

    async addNote(id: string, body: string): Promise<Enquiry> {
      return toEnquiry(await client.post<EnquiryNetwork>("/v1/admin/enquiries/notes", { id, body: body.trim() }))
    },

    /** The CSV export as a Blob (same filters as the list). */
    async exportCsv(f: EnquiryFilter): Promise<Blob> {
      const res = await client.fetchRaw("/v1/admin/enquiries/export", { query: filterQuery(f) })
      if (!res.ok) throw new Error(`Export failed (${res.status})`)
      return res.blob()
    },
  }
}
