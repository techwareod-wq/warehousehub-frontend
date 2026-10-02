import "server-only"

/** The Go API origin (server-side only; the browser goes through /api/proxy). */
export function backendUrl(): string {
  const url = process.env.BACKEND_URL
  if (!url) throw new Error("BACKEND_URL is not set")
  return url.replace(/\/$/, "")
}
