import { defineRouting } from "next-intl/routing"

/** Cookie con el idioma elegido para el sitio. */
const LOCALE_COOKIE = "clipealo-locale"

/** La landing está disponible en español, inglés y portugués de Brasil. */
export const routing = defineRouting({
  locales: ["es", "en", "pt"],
  defaultLocale: "es",
  localePrefix: "as-needed",
  localeCookie: { name: LOCALE_COOKIE, maxAge: 60 * 60 * 24 * 365 },
  alternateLinks: false,
  pathnames: {
    "/": "/",
    "/precios": { es: "/precios", en: "/pricing", pt: "/precos" },
    "/funciones": "/funciones",
    "/funciones/[slug]": "/funciones/[slug]",
    "/casos": "/casos",
    "/casos/[slug]": "/casos/[slug]",
    "/blog": "/blog",
    "/blog/[slug]": "/blog/[slug]",
    "/legal/privacidad": {
      es: "/legal/privacidad",
      en: "/legal/privacy",
      pt: "/legal/privacidade",
    },
    "/legal/terminos": { es: "/legal/terminos", en: "/legal/terms", pt: "/legal/termos" },
  } as Record<string, string | Record<"es" | "en" | "pt", string>>,
})

export type Locale = (typeof routing.locales)[number]

/** Etiqueta BCP 47 de cada idioma: `lang`, hreflang y formatos de `Intl`. */
export const LOCALE_TAG: Record<Locale, string> = {
  es: "es",
  en: "en",
  pt: "pt-BR",
}

/** Nombre de cada idioma en su propio idioma. */
export const LOCALE_NAME: Record<Locale, string> = {
  es: "Español",
  en: "English",
  pt: "Português (Brasil)",
}
