export const CHANGE_ENTITIES = [
  { value: "warehouse", label: "Warehouse" },
  { value: "revision", label: "Revision" },
  { value: "rent", label: "Rent" },
  { value: "media", label: "Media" },
  { value: "attributeDef", label: "Attribute definition" },
  { value: "industry", label: "Industry" },
  { value: "enquiry", label: "Enquiry" },
] as const

export interface ChangeEntry {
  id: string
  entity: string
  entityId: string
  action: string
  actorEmail: string
  actorUserId: string
  at?: Date
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  meta: Record<string, unknown> | null
}

export interface ChangeFilter {
  entity?: string
  entityId?: string
  actor?: string
  /** YYYY-MM-DD (local), converted to RFC 3339 for the API. */
  from?: string
  to?: string
}
