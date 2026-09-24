import type { MetadataRoute } from "next"

import { getPathname } from "@/i18n/navigation"
import { LOCALE_TAG, routing } from "@/i18n/routing"
import { legalNav, siteConfig } from "@/lib/site"
import { blogArticles } from "@/lib/marketing/blog-articles"
import { featureNavigation, useCaseNavigation } from "@/lib/marketing/navigation"

type Publica = {
  href: string
  changeFrequency: "weekly" | "monthly" | "yearly"
  priority: number
}

/**
 * Solo publica las páginas de marketing y legales en los tres idiomas.
 */
const PUBLICAS: Publica[] = [
  { href: "/", changeFrequency: "weekly", priority: 1 },
  { href: "/precios", changeFrequency: "monthly", priority: 0.9 },
  { href: "/funciones", changeFrequency: "monthly", priority: 0.8 },
  ...featureNavigation.map(({ slug }) => ({
    href: `/funciones/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  })),
  { href: "/casos", changeFrequency: "monthly", priority: 0.8 },
  ...useCaseNavigation.map(({ slug }) => ({
    href: `/casos/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  })),
  { href: "/blog", changeFrequency: "weekly", priority: 0.8 },
  ...blogArticles.map(({ id }) => ({
    href: `/blog/${id}`,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  })),
  ...legalNav.map((page) => ({
    href: page.href,
    changeFrequency: "yearly" as const,
    priority: 0.3,
  })),
]

const url = (href: string, locale: (typeof routing.locales)[number]) => {
  const path = getPathname({ href, locale })
  return `${siteConfig.url}${path === "/" ? "" : path}`
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return PUBLICAS.flatMap(({ href, changeFrequency, priority }) =>
    routing.locales.map((locale) => ({
      url: url(href, locale),
      lastModified: now,
      changeFrequency,
      priority,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [LOCALE_TAG[l], url(href, l)])
        ),
      },
    }))
  )
}
