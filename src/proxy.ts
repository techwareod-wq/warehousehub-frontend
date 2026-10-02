import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

/**
 * Clerk on every request (so auth() works in pages and /api/proxy). Only the
 * admin panel and the account page need a session; the public site, search
 * and listing pages are open. The admin layout additionally checks staff
 * access with the backend (whoami) — the backend enforces every permission.
 */
const isProtected = createRouteMatcher(["/admin(.*)", "/account(.*)"])

export default clerkMiddleware(async (auth, request) => {
  if (isProtected(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
