import type { MetadataRoute } from "next"

import { routing, type Locale } from "@/i18n/routing"
import { siteConfig } from "@/lib/site"

/**
 * Rutas que viven tras sesión, en su forma interna (en español). El estudio es
 * dinámico: se bloquea su carpeta entera.
 */
const PRIVADAS = [
  "/dashboard",
  "/proyectos",
  "/studio/[id]",
  "/subir",
  "/ajustes",
  "/bienvenida",
  // La wiki es interna: la referencia del equipo, no una página para buscadores
  "/docs",
] as const

/** Dirección pública de una ruta interna en un idioma, con su prefijo («/en/welcome»). */
function direccion(interna: string, locale: Locale): string {
  const traducida = routing.pathnames[interna]
  const ruta =
    typeof traducida === "string" ? traducida : (traducida?.[locale] ?? interna)
  const prefijo = locale === routing.defaultLocale ? "" : `/${locale}`
  // «/studio/[id]» → «/studio/»: bloquea todas las sesiones del estudio
  return `${prefijo}${ruta.replace(/\[[^\]]+\]$/, "")}`
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // El producto vive tras sesión: rastrearlo solo genera 404 y ruido. En los
      // tres idiomas, con la dirección traducida («/subir», «/en/upload», «/pt/enviar»)
      disallow: [
        ...new Set(
          routing.locales.flatMap((locale) => PRIVADAS.map((r) => direccion(r, locale)))
        ),
        "/openapi.json",
        "/wiki-indice.json",
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  }
}
