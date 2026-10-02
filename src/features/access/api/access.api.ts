import type { HttpClient } from "@/core/api"
import type { StaffListNetwork, WhoamiNetwork } from "../network/access.network"
import { toAccess, toStaffMember } from "../mappers/access.mapper"
import type { Access, StaffMember } from "../entities/access.entity"

export function accessApi(client: HttpClient) {
  return {
    async whoami(): Promise<Access> {
      return toAccess(await client.get<WhoamiNetwork>("/v1/admin/whoami"))
    },
    async staff(): Promise<StaffMember[]> {
      const res = await client.get<StaffListNetwork>("/v1/admin/staff")
      return (res.items ?? []).map(toStaffMember)
    },
  }
}
