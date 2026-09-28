import { defineRouting } from "next-intl/routing"

/** La landing está disponible en español, inglés y portugués de Brasil. */
export const routing = defineRouting({
  locales: ["es", "en", "pt"],
  defaultLocale: "es",
  // Cada idioma tiene una URL propia para que funcione sin middleware ni cookies.
  localePrefix: "always",
  alternateLinks: false,
  pathnames: {
    "/": "/",
    // Las rutas se conservan iguales para que los documentos estáticos existan
    // con la misma dirección en Firebase y la navegación no dependa del proxy.
    "/precios": "/precios",
    "/funciones": "/funciones",
    "/funciones/[slug]": "/funciones/[slug]",
    "/casos": "/casos",
    "/casos/[slug]": "/casos/[slug]",
    "/blog": "/blog",
    "/blog/[slug]": "/blog/[slug]",
    "/legal/privacidad": "/legal/privacidad",
    "/legal/terminos": "/legal/terminos",
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
