import type { HttpClient, Page } from "@/core/api"
import type { ProfileNetwork, UpdateProfileRequestNetwork, UserListNetwork } from "../network/users.network"
import { toProfile, toSetAccessRequest, toUserPage } from "../mappers/users.mapper"
import type { AccessChange, Profile, User } from "../entities/users.entity"

/** Admin user management (superuser). */
export function usersApi(client: HttpClient) {
  return {
    async list(params: { q?: string; page?: number; limit?: number }): Promise<Page<User>> {
      return toUserPage(await client.get<UserListNetwork>("/v1/admin/users", params))
    },
    async setAccess(change: AccessChange): Promise<void> {
      await client.post("/v1/admin/users/access", toSetAccessRequest(change))
    },
  }
}

/** The signed-in visitor's own profile. */
export function profileApi(client: HttpClient) {
  return {
    async get(): Promise<Profile> {
      return toProfile(await client.get<ProfileNetwork>("/v1/user/profile"))
    },
    async update(p: { phone: string; company: string }): Promise<Profile> {
      const body: UpdateProfileRequestNetwork = { phone: p.phone.trim(), company: p.company.trim() }
      return toProfile(await client.post<ProfileNetwork>("/v1/me/profile", body))
    },
  }
}
