import "server-only"
import { serverApi } from "@/core/api/server-client"
import { env } from "@/core/config/env"
import { clustersApi } from "../api/clusters.api"
import type { ClusterOverview } from "../entities/clusters.entity"

/**
 * The cluster overview for server pages (needs the search feature: the
 * backend gates public search per visitor, so this runs with their token).
 * null when the API is unavailable.
 */
export async function loadClusterOverview(): Promise<ClusterOverview | null> {
  try {
    return await clustersApi(serverApi()).overview({ country: env.defaultCountry, currency: "INR" })
  } catch {
    return null
  }
}
