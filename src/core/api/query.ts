export type QueryValue = string | number | boolean | null | undefined
export type Query = Record<string, QueryValue>

/** Builds "?a=1&b=x", skipping empty values. */
export function toQueryString(query?: Query): string {
  if (!query) return ""
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue
    params.set(key, String(value))
  }
  const s = params.toString()
  return s ? `?${s}` : ""
}
