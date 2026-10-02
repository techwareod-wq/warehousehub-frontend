/** crunch models.ChangeLogEntry */
export interface ChangeLogEntryNetwork {
  id: string
  entity: string
  entityId: string
  action: string
  actorUserId: string
  actorEmail: string
  at: string
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  meta?: Record<string, unknown> | null
}
