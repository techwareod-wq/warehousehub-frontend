import "server-only"
import { isIP } from "node:net"

/**
 * Every backend call from this server reaches crunch from Vercel's IP, so
 * crunch's per-IP rate limit on /v1/public would put every visitor in one
 * bucket. We forward the visitor's IP (X-WH-Client-IP) with a shared secret
 * (X-WH-Proxy-Secret); crunch trusts the IP only when the secret matches.
 * The header names must match crunch internal/ratelimit/clientip.go, and
 * BACKEND_PROXY_SECRET must equal crunch's PROXY_SHARED_SECRET.
 */
export const CLIENT_IP_HEADER = "x-wh-client-ip"
export const PROXY_SECRET_HEADER = "x-wh-proxy-secret"

/**
 * Inbound headers that must never reach crunch from the visitor: our own
 * trust headers (a visitor could otherwise pick their bucket) and the
 * standard forwarding ones.
 */
export const FORWARDING_HEADERS = [
  CLIENT_IP_HEADER,
  PROXY_SECRET_HEADER,
  "x-forwarded-for",
  "x-real-ip",
  "forwarded",
  "cf-connecting-ip",
] as const

/**
 * The visitor's IP. On Vercel, x-real-ip and x-forwarded-for are set by the
 * platform and overwrite whatever the client sent. Elsewhere, take the
 * right-most x-forwarded-for entry: the one the nearest proxy appended.
 */
export function clientIp(h: Headers): string | undefined {
  const real = h.get("x-real-ip")?.trim()
  if (real && isIP(real)) return real
  const last = h.get("x-forwarded-for")?.split(",").pop()?.trim()
  return last && isIP(last) ? last : undefined
}

/**
 * Headers to add to a backend call: the shared secret, and the visitor's IP
 * when there is a visitor (none for background work such as the sitemap).
 * Empty when BACKEND_PROXY_SECRET is unset (local dev).
 */
export function forwardingHeaders(inbound?: Headers): Record<string, string> {
  const secret = process.env.BACKEND_PROXY_SECRET
  if (!secret) return {}
  const out: Record<string, string> = { [PROXY_SECRET_HEADER]: secret }
  const ip = inbound ? clientIp(inbound) : undefined
  if (ip) out[CLIENT_IP_HEADER] = ip
  return out
}
