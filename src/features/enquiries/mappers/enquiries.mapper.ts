import { parseDate } from "@/lib/format"
import type { EnquiryDetailNetwork, EnquiryNetwork, SubmitEnquiryRequestNetwork } from "../network/enquiries.network"
import type { Enquiry, EnquiryDetail, EnquiryDraft, EnquiryStatus } from "../entities/enquiries.entity"

export function toEnquiry(n: EnquiryNetwork): Enquiry {
  return {
    id: n.id,
    name: n.name,
    company: n.company ?? "",
    email: n.email,
    phone: n.phoneE164 || n.phone,
    message: n.message,
    listing: n.listing ? { ...n.listing, city: n.listing.city ?? "" } : null,
    country: n.country,
    searchId: n.searchId ?? "",
    status: n.status as EnquiryStatus,
    closeReason: n.closeReason ?? "",
    closeNote: n.closeNote ?? "",
    assigneeUserId: n.assigneeUserId ?? null,
    assigneeEmail: n.assigneeEmail ?? "",
    notes: (n.notes ?? []).map((x) => ({ id: x.id, byEmail: x.byEmail, at: parseDate(x.at), body: x.body })),
    history: (n.history ?? []).map((h) => ({ at: parseDate(h.at), byEmail: h.byEmail, field: h.field, from: h.from, to: h.to })),
    createdAt: parseDate(n.createdAt),
    updatedAt: parseDate(n.updatedAt),
    version: n.updatedAt,
  }
}

export function toEnquiryDetail(n: EnquiryDetailNetwork): EnquiryDetail {
  return {
    enquiry: toEnquiry(n.enquiry),
    listing: n.listing
      ? {
          warehouseId: n.listing.warehouseId,
          shortId: n.listing.shortId,
          name: n.listing.name,
          city: n.listing.city ?? "",
          status: n.listing.status,
          totalSqm: n.listing.totalSqm,
          coverUrl: n.listing.coverUrl ?? "",
          publicUrl: n.listing.publicUrl ?? "",
        }
      : null,
    search: n.search
      ? {
          searchId: n.search.searchId,
          at: parseDate(n.search.at),
          kind: n.search.kind,
          text: n.search.text ?? "",
          place: n.search.place ?? "",
          resultCount: n.search.resultCount,
          filters: n.search.filters ?? {},
        }
      : null,
  }
}

export function fromEnquiryDraft(d: EnquiryDraft): SubmitEnquiryRequestNetwork {
  return {
    name: d.name.trim(),
    company: d.company.trim(),
    phone: d.phone.trim(),
    message: d.message.trim(),
    listingShortId: d.listingShortId || undefined,
    searchId: d.searchId || undefined,
    sessionId: d.sessionId || undefined,
    idempotencyKey: d.idempotencyKey,
  }
}
