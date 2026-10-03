import "server-only"
import { cache } from "react"
import { ApiError } from "@/core/api"
import { serverApi } from "@/core/api/server-client"
import { profileApi } from "../api/users.api"
import type { Profile, SiteFeature } from "../entities/users.entity"

export type SiteAccess = { kind: "signed-out" } | { kind: "ok"; profile: Profile }

/**
 * The visitor's site access for server pages: GET /v1/user/profile (sign-in
 * only, never feature-gated) carries their effective features. One call per
 * request, shared by the (site) layout and its pages.
 */
export const getSiteAccess = cache(async (): Promise<SiteAccess> => {
  try {
    return { kind: "ok", profile: await profileApi(serverApi()).get() }
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return { kind: "signed-out" }
    throw err
  }
})

/** Whether the visitor may use a site feature (false when signed out). */
export async function hasSiteFeature(feature: SiteFeature): Promise<boolean> {
  const access = await getSiteAccess()
  return access.kind === "ok" && access.profile.features.includes(feature)
}
