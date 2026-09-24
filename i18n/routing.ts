import { defineRouting } from "next-intl/routing"

/** Cookie con el idioma elegido para el sitio y la app. */
export const LOCALE_COOKIE = "clipealo-locale"

/**
 * Idiomas de Clipealo.
 *
 * Español en la raíz, sin prefijo (clipealo.com/precios); inglés y portugués de
 * Brasil con prefijo (/en/pricing, /pt/precos). La primera visita a la raíz se
 * redirige según el idioma del navegador; después manda la cookie.
 *
 * Las direcciones se traducen en lo público y en la app. El backoffice /admin
 * conserva las suyas en los tres idiomas: es interno y no se indexa. Una ruta
 * que no está en `pathnames` pasa tal cual con su prefijo. El backoffice tiene
 * además su propio idioma por defecto: `ADMIN_LOCALE`.
 */
export const routing = defineRouting({
  locales: ["es", "en", "pt"],
  defaultLocale: "es",
  localePrefix: "as-needed",
  localeCookie: { name: LOCALE_COOKIE, maxAge: 60 * 60 * 24 * 365 },
  // Las alternativas hreflang las publican los metadatos de cada página pública y
  // el sitemap (con «pt-BR»); en la cabecera saldrían también las de la app y el admin
  alternateLinks: false,
  pathnames: {
    "/": "/",
    "/precios": { es: "/precios", en: "/pricing", pt: "/precos" },
    "/design-system": "/design-system",
    "/legal/privacidad": {
      es: "/legal/privacidad",
      en: "/legal/privacy",
      pt: "/legal/privacidade",
    },
    "/legal/terminos": { es: "/legal/terminos", en: "/legal/terms", pt: "/legal/termos" },
    "/legal/cookies": "/legal/cookies",
    "/login": "/login",
    // Onboarding «Tu primer corte», justo después del registro
    "/bienvenida": { es: "/bienvenida", en: "/welcome", pt: "/boas-vindas" },
    "/dashboard": "/dashboard",
    "/subir": { es: "/subir", en: "/upload", pt: "/enviar" },
    "/operaciones": { es: "/operaciones", en: "/operations", pt: "/operacoes" },
    "/operaciones/recortar": {
      es: "/operaciones/recortar",
      en: "/operations/trim",
      pt: "/operacoes/recortar",
    },
    "/operaciones/reducir": {
      es: "/operaciones/reducir",
      en: "/operations/shrink",
      pt: "/operacoes/reduzir",
    },
    "/operaciones/variantes": {
      es: "/operaciones/variantes",
      en: "/operations/variants",
      pt: "/operacoes/variantes",
    },
    "/operaciones/publicacion": {
      es: "/operaciones/publicacion",
      en: "/operations/publishing",
      pt: "/operacoes/publicacao",
    },
    "/operaciones/derechos": {
      es: "/operaciones/derechos",
      en: "/operations/rights",
      pt: "/operacoes/direitos",
    },
    "/proyectos": { es: "/proyectos", en: "/projects", pt: "/projetos" },
    "/proyectos/[id]": {
      es: "/proyectos/[id]",
      en: "/projects/[id]",
      pt: "/projetos/[id]",
    },
    "/proyectos/[id]/clips/[clipId]": {
      es: "/proyectos/[id]/clips/[clipId]",
      en: "/projects/[id]/clips/[clipId]",
      pt: "/projetos/[id]/clips/[clipId]",
    },
    "/studio/[id]": "/studio/[id]",
    "/analiticas": { es: "/analiticas", en: "/analytics", pt: "/analises" },
    "/campanas": { es: "/campanas", en: "/campaigns", pt: "/campanhas" },
    "/calendario": { es: "/calendario", en: "/calendar", pt: "/calendario" },
    "/formacion": { es: "/formacion", en: "/learn", pt: "/formacao" },
    "/campanas/nueva": {
      es: "/campanas/nueva",
      en: "/campaigns/new",
      pt: "/campanhas/nova",
    },
    "/campanas/[id]": {
      es: "/campanas/[id]",
      en: "/campaigns/[id]",
      pt: "/campanhas/[id]",
    },
    "/wallet": "/wallet",
    "/ajustes": { es: "/ajustes", en: "/settings", pt: "/configuracoes" },
    "/ajustes/facturacion": {
      es: "/ajustes/facturacion",
      en: "/settings/billing",
      pt: "/configuracoes/faturamento",
    },
    "/ayuda": { es: "/ayuda", en: "/help", pt: "/ajuda" },
  } as Record<string, string | Record<"es" | "en" | "pt", string>>,
})

export type Locale = (typeof routing.locales)[number]

/**
 * El backoffice va en inglés por defecto, sea cual sea el idioma del sitio
 * (pedido el 14 sep 2026). Quien lo administra puede cambiarlo desde su menú: esa
 * elección se guarda aparte, en esta cookie, y no cambia el idioma del resto de
 * Clipealo. Lo aplica `proxy.ts`.
 */
export const ADMIN_LOCALE = {
  cookie: "clipealo-admin-locale",
  default: "en",
} as const satisfies { cookie: string; default: Locale }

/** Etiqueta BCP 47 de cada idioma: `lang`, hreflang y formatos de `Intl`. */
export const LOCALE_TAG: Record<Locale, string> = {
  es: "es",
  en: "en",
  pt: "pt-BR",
}

/** Nombre de cada idioma en su propio idioma: así lo encuentra quien no lee el actual. */
export const LOCALE_NAME: Record<Locale, string> = {
  es: "Español",
  en: "English",
  pt: "Português (Brasil)",
}
