/**
 * Public (browser-visible) configuration. Every value is inlined at build
 * time, so changing one needs a rebuild. Server-only settings (BACKEND_URL,
 * CLERK_SECRET_KEY) are read where they are used and never imported here.
 */
export const env = {
  /** Public site origin, e.g. https://warehousehub.in (canonical URLs, sitemap). */
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  /** Brand name shown in the header, titles and emails. */
  siteName: process.env.NEXT_PUBLIC_SITE_NAME ?? "WarehouseHub",
  /** Google Maps JS key. Empty = maps are hidden and pins are typed as lat/lng. */
  googleMapsKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  /** Public media CDN origin (the backend's PUBLIC_MEDIA_BASE_URL) for admin thumbnails. */
  mediaBaseUrl: (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "").replace(/\/$/, ""),
  /** Must agree with the backend's warehousehub.aisearch.enabled. */
  aiSearchEnabled: process.env.NEXT_PUBLIC_AI_SEARCH === "true",
  /** Default country for search (India-only launch, D-003). */
  defaultCountry: process.env.NEXT_PUBLIC_DEFAULT_COUNTRY ?? "IN",
} as const
