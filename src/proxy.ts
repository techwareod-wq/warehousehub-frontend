import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

/**
 * Clerk on every request (so auth() works in pages and /api/proxy). The public
 * site is open to signed-out visitors: home, explore, finder, search, warehouse
 * detail and contact, plus sign-in / sign-up, the API proxy (the backend
 * decides per route; /v1/public/* search, listing and finder routes answer
 * anonymously), robots and the sitemap. Everything else (Account, Nexus
 * Engine, admin) needs a session; the admin layout then checks staff access
 * (whoami) and the backend enforces it again on every call.
 */
const isPublic = createRouteMatcher([
  "/",
  "/explore(.*)",
  "/find(.*)",
  "/search(.*)",
  "/warehouses/(.*)",
  "/enquire(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api(.*)",
  "/robots.txt",
  "/sitemap.xml",
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublic(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
