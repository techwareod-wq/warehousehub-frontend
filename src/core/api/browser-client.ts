import { HttpClient } from "./http-client"

/** Header the proxy requires on every mutating call (CSRF guard, see proxy.ts). */
export const CLIENT_HEADER = "x-wh-client"

/**
 * The browser's client. It never talks to the backend directly: every call
 * goes through the same-origin /api/proxy route, which attaches the Clerk
 * session token server-side. Use it from client components only.
 */
export const browserApi = new HttpClient({
  baseUrl: "/api/proxy",
  headers: () => ({ [CLIENT_HEADER]: "1" }),
  init: { cache: "no-store", credentials: "same-origin" },
})
