import { createNavigation } from "next-intl/navigation"

import { routing } from "@/i18n/routing"

/**
 * Navegación con idioma. Sustituye a `next/link` y a `useRouter`, `usePathname`
 * y `redirect` de `next/navigation`: añaden el prefijo y traducen la dirección.
 * `usePathname` devuelve la ruta interna, sin prefijo de idioma.
 */
export const { Link, usePathname, useRouter, getPathname } = createNavigation(routing)

type Query = Record<string, string>

/**
 * Enlace a una ruta dinámica traducida, por ejemplo `/legal/[slug]`.
 *
 * `pathnames` deja abierto el tipo de las rutas para que Next-intl complete los
 * parámetros dinámicos; el molde queda concentrado en este helper.
 */
export function hrefDinamico(
  pathname: string,
  params: Record<string, string>,
  query?: Query
) {
  return { pathname, params, query } as unknown as { pathname: string; query?: Query }
}
