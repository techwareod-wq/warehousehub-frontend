/** Example queries the home bar cycles through while it's empty and idle. */
export const EXAMPLES = [
  "I want 1,000 sq ft bonded in Mumbai",
  "50,000 sqft general near Mundra",
  "Cold storage in Pune under ₹30 per sqft",
  "Pharma warehouse near Hyderabad, at least 20,000 sqft",
  "DG capable racked warehouse near JNPT",
  "2 lakh sqft near Delhi airport",
] as const

/** How long each example stays up (ms). */
export const ROTATE_MS = 3200

/** The backend's query cap (crunch warehousehub.aisearch.maxQueryChars). */
export const MAX_QUERY_CHARS = 300

/** The /search page runs one natural-language search for its `ai` param (see search-page.tsx). */
export function aiSearchHref(text: string): string {
  return `/search?ai=${encodeURIComponent(text)}`
}
