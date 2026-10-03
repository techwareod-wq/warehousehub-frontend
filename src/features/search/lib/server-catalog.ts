import "server-only"
import { serverApi } from "@/core/api/server-client"
import { env } from "@/core/config/env"
import { searchApi } from "../api/search.api"
import type { FilterCatalog } from "../entities/search.entity"

/** The filter catalog for server pages (needs the search feature); null if unavailable. */
export async function loadFilterCatalog(): Promise<FilterCatalog | null> {
  try {
    return await searchApi(serverApi()).catalog(env.defaultCountry)
  } catch {
    return null
  }
}
