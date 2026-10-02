import { mapPage, type HttpClient, type Page, type PageNetwork } from "@/core/api"
import type { ChangeLogEntryNetwork } from "../network/changes.network"
import { dayToRfc3339, toChangeEntry } from "../mappers/changes.mapper"
import type { ChangeEntry, ChangeFilter } from "../entities/changes.entity"

/** The change log (/v1/admin/changes, approver). */
export function changesApi(client: HttpClient) {
  return {
    async list(f: ChangeFilter, page = 1, limit?: number): Promise<Page<ChangeEntry>> {
      return mapPage(
        await client.get<PageNetwork<ChangeLogEntryNetwork>>("/v1/admin/changes", {
          entity: f.entity,
          entityId: f.entityId?.trim(),
          actor: f.actor?.trim(),
          from: dayToRfc3339(f.from),
          to: dayToRfc3339(f.to, true),
          page,
          limit,
        }),
        toChangeEntry,
      )
    },
    async detail(id: string): Promise<ChangeEntry> {
      return toChangeEntry(await client.get<ChangeLogEntryNetwork>("/v1/admin/changes/detail", { id }))
    },
  }
}
