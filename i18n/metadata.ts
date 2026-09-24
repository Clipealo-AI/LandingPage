import type { Metadata } from "next"

import { getPathname } from "@/i18n/navigation"
import { LOCALE_TAG, routing, type Locale } from "@/i18n/routing"

/**
 * Canónica y alternativas hreflang de una página pública. `href` es la ruta
 * interna en español («/precios»); se traduce a cada idioma.
 */
export function alternates(href: string, locale: Locale): Metadata["alternates"] {
  return {
    canonical: getPathname({ href, locale }),
    languages: {
      ...Object.fromEntries(
        routing.locales.map((l) => [LOCALE_TAG[l], getPathname({ href, locale: l })])
      ),
      "x-default": getPathname({ href, locale: routing.defaultLocale }),
    },
  }
}
