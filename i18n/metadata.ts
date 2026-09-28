import type { Metadata } from "next"

import { getPathname } from "@/i18n/navigation"
import { LOCALE_TAG, routing, type Locale } from "@/i18n/routing"

/** El export estático y Firebase publican las rutas de página con barra final. */
export function publicPath(href: string, locale: Locale) {
  const path = getPathname({ href, locale })
  return path.endsWith("/") ? path : `${path}/`
}

/**
 * Canónica y alternativas hreflang de una página pública. `href` es la ruta
 * interna en español («/precios»); se traduce a cada idioma.
 */
export function alternates(href: string, locale: Locale): Metadata["alternates"] {
  return {
    canonical: publicPath(href, locale),
    languages: {
      ...Object.fromEntries(
        routing.locales.map((l) => [LOCALE_TAG[l], publicPath(href, l)])
      ),
      "x-default": publicPath(href, routing.defaultLocale),
    },
  }
}
