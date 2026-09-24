import { WHATSAPP_URL } from "@/lib/contact"

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

type SiteConfig = typeof siteConfig

/** Páginas legales. Etiquetas: `marketing.legalNav.<id>`. */
export const legalNav = [
  { id: "privacy", href: "/legal/privacidad" },
  { id: "terms", href: "/legal/terminos" },
] as const

/** Enlaces del pie de página. Las páginas de producto y recursos viven aquí. */
export const footerNav = {
  product: [
    { id: "allFeatures", href: "/funciones" },
    {
      id: "automaticClips",
      href: "/funciones/clips-automaticos-con-ia",
    },
    { id: "pricing", href: "/precios" },
  ],
  resources: [
    { id: "blogGuides", href: "/blog" },
    { id: "faq", href: { pathname: "/", hash: "faq" } },
    { id: "whatsapp", href: WHATSAPP_URL },
  ],
  legal: [
    { id: "privacy", href: "/legal/privacidad" },
    { id: "terms", href: "/legal/terminos" },
  ],
} as const
