import type { MetadataRoute } from "next"

import { siteConfig } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  const isDev = siteConfig.url.includes("landing.dev.clipealo-ai.com")

  return {
    rules: { userAgent: "*", ...(isDev ? { disallow: "/" } : { allow: "/" }) },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  }
}
