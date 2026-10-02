/** crunch models.Enquiry */
export interface EnquiryNetwork {
  id: string
  userId: string
  clerkId: string
  name: string
  company?: string
  email: string
  phone: string
  phoneE164: string
  message: string
  listing: { warehouseId: string; shortId: string; slug: string; name: string; city?: string } | null
  country: string
  searchId?: string
  sessionId?: string
  status: string
  closeReason?: string
  closeNote?: string
  assigneeUserId: string | null
  assigneeEmail?: string
  notes: { id: string; by: string; byEmail: string; at: string; body: string }[] | null
  history: { at: string; by: string; byEmail: string; field: string; from: string; to: string }[] | null
  createdAt: string
  updatedAt: string
}

/** GET /v1/admin/enquiries/detail */
export interface EnquiryDetailNetwork {
  enquiry: EnquiryNetwork
  listing: {
    warehouseId: string
    shortId: string
    slug: string
    name: string
    city?: string
    status: string
    totalSqm: number
    coverUrl?: string
    publicUrl?: string
  } | null
  search: {
    searchId: string
    at: string
    kind: string
    text?: string
    place?: string
    filters: Record<string, unknown> | null
    resultCount: number
  } | null
}

/** POST /v1/enquiries */
export interface SubmitEnquiryRequestNetwork {
  name: string
  company: string
  phone: string
  message: string
  listingShortId?: string
  searchId?: string
  sessionId?: string
  idempotencyKey: string
}

export interface StatusRequestNetwork {
  id: string
  status: string
  closeReason?: string
  closeNote?: string
  expectedUpdatedAt: string
}

export interface AssignRequestNetwork {
  id: string
  assigneeUserId: string | null
  expectedUpdatedAt: string
}
