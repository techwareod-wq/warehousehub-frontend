import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

/**
 * Clerk on every request (so auth() works in pages and /api/proxy). For now
 * the whole site needs a session: the backend gates every visitor route on
 * per-user features (WithFeature), so signed-out visitors can't use anything.
 * Only sign-in / sign-up, the API proxy (the backend answers 401 itself),
 * robots and the sitemap stay open. The (site) layout then checks the
 * visitor's features and the admin layout checks staff access (whoami); the
 * backend enforces both again on every call.
 */
const isOpen = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/api(.*)", "/robots.txt", "/sitemap.xml"])

export default clerkMiddleware(async (auth, request) => {
  if (!isOpen(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
