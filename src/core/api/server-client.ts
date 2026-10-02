import "server-only"
import { auth } from "@clerk/nextjs/server"
import { backendUrl } from "./backend-url"
import { HttpClient } from "./http-client"

/**
 * Server-side client for Server Components, route handlers and metadata:
 * talks to the backend directly with the signed-in visitor's Clerk token
 * (none when signed out). Uncached: use for anything user-specific.
 */
export function serverApi(): HttpClient {
  return new HttpClient({
    baseUrl: backendUrl(),
    headers: async (): Promise<Record<string, string>> => {
      const { getToken } = await auth()
      const token = await getToken()
      return token ? { Authorization: `Bearer ${token}` } : {}
    },
    init: { cache: "no-store", redirect: "manual" },
  })
}

/**
 * Anonymous server client for public pages (listing pages, sitemap). No
 * token, so responses may be cached by Next for `revalidate` seconds.
 */
export function publicServerApi(revalidate = 60): HttpClient {
  return new HttpClient({
    baseUrl: backendUrl(),
    // The listing endpoint answers a moved slug with a 301 envelope (no
    // Location header): read it, don't follow it.
    init: { next: { revalidate }, redirect: "manual" },
  })
}
