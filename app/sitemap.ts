import type { MetadataRoute } from "next"

import { getPathname } from "@/i18n/navigation"
import { LOCALE_TAG, routing } from "@/i18n/routing"
import { legalNav, siteConfig } from "@/lib/site"

type Publica = {
  href: string
  changeFrequency: "weekly" | "monthly" | "yearly"
  priority: number
}

/**
 * Solo entra lo público. Las rutas de `(app)` quedan fuera a propósito: están
 * detrás de sesión y no aportan nada en un índice. Cada dirección se publica en
 * los tres idiomas con sus alternativas hreflang.
 */
const PUBLICAS: Publica[] = [
  { href: "/", changeFrequency: "weekly", priority: 1 },
  { href: "/precios", changeFrequency: "monthly", priority: 0.9 },
  { href: "/login", changeFrequency: "yearly", priority: 0.4 },
  { href: "/design-system", changeFrequency: "monthly", priority: 0.6 },
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
