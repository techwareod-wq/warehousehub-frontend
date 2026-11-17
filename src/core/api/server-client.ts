import "server-only"
import { auth } from "@clerk/nextjs/server"
import { headers as requestHeaders } from "next/headers"
import { backendUrl } from "./backend-url"
import { forwardingHeaders } from "./client-ip"
import { HttpClient } from "./http-client"

/**
 * Server-side client for Server Components, route handlers and metadata:
 * talks to the backend directly with the signed-in visitor's Clerk token
 * (none when signed out) and their IP for crunch's rate limit (client-ip.ts).
 * Uncached: use for anything user-specific. Request-scoped only.
 */
export function serverApi(): HttpClient {
  return new HttpClient({
    baseUrl: backendUrl(),
    headers: async (): Promise<Record<string, string>> => {
      const [{ getToken }, inbound] = await Promise.all([auth(), requestHeaders()])
      const token = await getToken()
      return { ...forwardingHeaders(inbound), ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    },
    init: { cache: "no-store", redirect: "manual" },
  })
}

/**
 * Anonymous server client for public pages (listing pages, sitemap). No
 * token and no visitor IP (it may run outside a request), so responses may be
 * cached by Next for `revalidate` seconds; crunch counts these calls in its
 * shared trusted-proxy bucket.
 */
export function publicServerApi(revalidate = 60): HttpClient {
  return new HttpClient({
    baseUrl: backendUrl(),
    headers: () => forwardingHeaders(),
    // The listing endpoint answers a moved slug with a 301 envelope (no
    // Location header): read it, don't follow it.
    init: { next: { revalidate }, redirect: "manual" },
  })
}
