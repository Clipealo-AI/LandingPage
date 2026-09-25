import { WHATSAPP_URL } from "@/lib/contact"

/**
 * Datos de la marca compartidos por metadatos, sitemap y pie de página.
 */
export const siteConfig = {
  name: "Clipealo",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://clipealo-ai.com",
} as const

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
