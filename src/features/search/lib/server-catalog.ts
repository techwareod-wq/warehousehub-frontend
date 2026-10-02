import "server-only"
import { publicServerApi } from "@/core/api/server-client"
import { env } from "@/core/config/env"
import { searchApi } from "../api/search.api"
import type { FilterCatalog } from "../entities/search.entity"

/** The public filter catalog for server pages (cached 60 s); null if the API is down. */
export async function loadFilterCatalog(): Promise<FilterCatalog | null> {
  try {
    return await searchApi(publicServerApi(60)).catalog(env.defaultCountry)
  } catch {
    return null
  }
}
