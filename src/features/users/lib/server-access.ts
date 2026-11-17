import "server-only"
import { cache } from "react"
import { auth } from "@clerk/nextjs/server"
import { ApiError } from "@/core/api"
import { serverApi } from "@/core/api/server-client"
import { profileApi } from "../api/users.api"
import { PUBLIC_SITE_FEATURES, type Profile, type SiteFeature } from "../entities/users.entity"

export type SiteAccess = { kind: "signed-out" } | { kind: "ok"; profile: Profile }

/**
 * The visitor's site access for server pages: GET /v1/user/profile (sign-in
 * only, never feature-gated) carries their granted features. One call per
 * request, shared by the (site) layout and its pages. Signed-out visitors
 * skip the backend call entirely.
 */
export const getSiteAccess = cache(async (): Promise<SiteAccess> => {
  const { userId } = await auth()
  if (!userId) return { kind: "signed-out" }
  try {
    return { kind: "ok", profile: await profileApi(serverApi()).get() }
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return { kind: "signed-out" }
    throw err
  }
})

/** The visitor's effective features: the public ones plus whatever they were granted. */
export async function getSiteFeatures(): Promise<SiteFeature[]> {
  const access = await getSiteAccess()
  const granted = access.kind === "ok" ? access.profile.features : []
  return [...new Set([...PUBLIC_SITE_FEATURES, ...granted])]
}

/** Whether the visitor may use a site feature (public features are always true). */
export async function hasSiteFeature(feature: SiteFeature): Promise<boolean> {
  return (await getSiteFeatures()).includes(feature)
}

/**
 * Whether to offer the enquiry form / Contact links. Signed-out visitors get
 * it (the form asks them to sign in); signed-in ones need the enquiries grant.
 */
export async function canOfferEnquiry(): Promise<boolean> {
  const access = await getSiteAccess()
  return access.kind === "signed-out" || access.profile.features.includes("enquiries")
}
