import "server-only"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { backendUrl } from "./backend-url"
import { CLIENT_HEADER } from "./browser-client"

/**
 * The browser → backend proxy behind /api/proxy/[...path]. The browser never
 * sees the API origin or a token: this attaches the Clerk session token (when
 * signed in) and forwards the call.
 *
 * Guards:
 *  - only the API's own prefixes are reachable (no webhooks, no health);
 *  - mutating calls must carry the x-wh-client header and must not be
 *    cross-site. A cross-origin page can't set a custom header without a
 *    CORS preflight, and this route never answers one, so a forged form post
 *    can't ride the visitor's Clerk cookie (CSRF).
 */
const ALLOWED_PREFIXES = ["v1/public/", "v1/admin/", "v1/me/", "v1/user/", "v1/enquiries"]

const DROP_REQUEST = new Set([
  "host", "connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer",
  "transfer-encoding", "upgrade", "content-length", "accept-encoding", "cookie", "authorization",
  CLIENT_HEADER,
])

const DROP_RESPONSE = new Set([
  "connection", "keep-alive", "transfer-encoding", "upgrade", "content-length", "content-encoding",
  "set-cookie", "access-control-allow-origin", "access-control-allow-credentials",
  "access-control-allow-headers", "access-control-allow-methods",
])

export async function proxyRequest(req: Request, segments: string[]): Promise<Response> {
  // Match on the joined, decoded path: Next decodes %2F inside a segment, and
  // empty segments are dropped so "v1//admin" can't dodge the check.
  const path = segments.filter(Boolean).join("/")
  if (path.includes("..") || !ALLOWED_PREFIXES.some((p) => path === p.replace(/\/$/, "") || path.startsWith(p))) {
    return NextResponse.json({ success: false, error: "not found" }, { status: 404 })
  }

  const method = req.method.toUpperCase()
  const mutating = method !== "GET" && method !== "HEAD"
  if (mutating) {
    const site = req.headers.get("sec-fetch-site")
    if (req.headers.get(CLIENT_HEADER) !== "1" || (site !== null && site !== "same-origin" && site !== "none")) {
      return NextResponse.json({ success: false, error: "forbidden" }, { status: 403 })
    }
  }

  const headers = new Headers()
  req.headers.forEach((value, key) => {
    if (!DROP_REQUEST.has(key.toLowerCase())) headers.append(key, value)
  })
  const { getToken } = await auth()
  const token = await getToken()
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const target = new URL(`${backendUrl()}/${segments.map(encodeURIComponent).join("/")}`)
  target.search = new URL(req.url).search

  let upstream: Response
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body: mutating ? await req.arrayBuffer() : undefined,
      redirect: "manual",
      cache: "no-store",
    })
  } catch {
    return NextResponse.json({ success: false, error: "the API is unreachable", code: "upstream_unreachable" }, { status: 502 })
  }

  const out = new Headers()
  upstream.headers.forEach((value, key) => {
    if (!DROP_RESPONSE.has(key.toLowerCase())) out.append(key, value)
  })
  // 304 / 204 must not carry a body.
  const body = upstream.status === 304 || upstream.status === 204 ? null : upstream.body
  return new Response(body, { status: upstream.status, statusText: upstream.statusText, headers: out })
}
