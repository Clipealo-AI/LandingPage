/**
 * Datos de la marca. `tagline`, `description` y `claim` quedan como referencia
 * en español: la interfaz y los metadatos leen los mensajes (`common.meta` y
 * `marketing.claim`), que tienen los tres idiomas.
 */
export const siteConfig = {
  name: "Clipealo",
  tagline: "De videos largos a grandes clips",
  description:
    "Sube el video completo. La IA encuentra los momentos que la gente ve hasta el final y te los devuelve en 9:16, con subtítulos.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://clipealo.com",
  claim: "Recorta . Edita . Comparte . Crece",
  links: {
    twitter: "https://twitter.com/clipealo",
    instagram: "https://instagram.com/clipealo",
    youtube: "https://youtube.com/@clipealo",
  },
} as const

export type SiteConfig = typeof siteConfig

/**
 * Navegación de marketing. Etiquetas: `marketing.nav.<id>`.
 *
 * Las anclas de la landing van como objeto: escritas como texto
 * («/#como-funciona»), el prefijo de idioma daría «/en/#como-funciona», con una
 * barra final que obliga a redirigir; como objeto sale «/en#como-funciona».
 */
export const marketingNav = [
  { id: "howItWorks", href: { pathname: "/", hash: "como-funciona" } },
  { id: "product", href: { pathname: "/", hash: "producto" } },
  { id: "pricing", href: "/precios" },
  { id: "system", href: "/design-system" },
] as const

/** Páginas legales. Etiquetas: `marketing.legalNav.<id>`. */
export const legalNav = [
  { id: "privacy", href: "/legal/privacidad" },
  { id: "terms", href: "/legal/terminos" },
  { id: "cookies", href: "/legal/cookies" },
] as const
