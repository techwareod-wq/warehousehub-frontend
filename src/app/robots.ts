import type { MetadataRoute } from "next"
import { env } from "@/core/config/env"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/account", "/sign-in", "/sign-up"] },
    sitemap: `${env.siteUrl}/sitemap.xml`,
  }
}
