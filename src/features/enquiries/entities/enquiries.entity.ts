export type EnquiryStatus = "new" | "contacted" | "closed"
export type CloseReason = "won" | "lost" | "other"

export const ENQUIRY_STATUSES: { value: EnquiryStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
]

export const CLOSE_REASONS: { value: CloseReason; label: string }[] = [
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "other", label: "Other" },
]

export interface Enquiry {
  id: string
  name: string
  company: string
  email: string
  phone: string
  message: string
  listing: { warehouseId: string; shortId: string; slug: string; name: string; city: string } | null
  country: string
  searchId: string
  status: EnquiryStatus
  closeReason: string
  closeNote: string
  assigneeUserId: string | null
  assigneeEmail: string
  notes: { id: string; byEmail: string; at?: Date; body: string }[]
  history: { at?: Date; byEmail: string; field: string; from: string; to: string }[]
  createdAt?: Date
  updatedAt?: Date
  /** Opaque CAS token (updatedAt as read) for status / assign. */
  version: string
}

export interface EnquiryDetail {
  enquiry: Enquiry
  listing: {
    warehouseId: string
    shortId: string
    name: string
    city: string
    status: string
    totalSqm: number
    coverUrl: string
    publicUrl: string
  } | null
  search: { searchId: string; at?: Date; kind: string; text: string; place: string; resultCount: number; filters: Record<string, unknown> } | null
}

export interface EnquiryFilter {
  status?: EnquiryStatus | ""
  /** user id, "none", or "" for anyone. */
  assignee?: string
  listing?: string
  q?: string
  from?: string
  to?: string
}

export interface EnquiryDraft {
  name: string
  company: string
  phone: string
  message: string
  listingShortId?: string
  searchId?: string
  sessionId?: string
  idempotencyKey: string
}
