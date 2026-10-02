import { parseDate } from "@/lib/format"
import type { ChangeLogEntryNetwork } from "../network/changes.network"
import type { ChangeEntry } from "../entities/changes.entity"

export function toChangeEntry(n: ChangeLogEntryNetwork): ChangeEntry {
  return {
    id: n.id,
    entity: n.entity,
    entityId: n.entityId,
    action: n.action,
    actorEmail: n.actorEmail || "system",
    actorUserId: n.actorUserId,
    at: parseDate(n.at),
    before: n.before ?? null,
    after: n.after ?? null,
    meta: n.meta ?? null,
  }
}

/** YYYY-MM-DD (local midnight) → RFC 3339; the change log takes full times. */
export function dayToRfc3339(day: string | undefined, endOfDay = false): string | undefined {
  if (!day) return undefined
  const d = new Date(`${day}T00:00:00`)
  if (Number.isNaN(d.getTime())) return undefined
  if (endOfDay) d.setDate(d.getDate() + 1)
  return d.toISOString()
}
