import { createNavigation } from "next-intl/navigation"

import { routing } from "@/i18n/routing"

/**
 * Navegación con idioma. Sustituye a `next/link` y a `useRouter`, `usePathname`
 * y `redirect` de `next/navigation`: añaden el prefijo y traducen la dirección.
 * `usePathname` devuelve la ruta interna, sin prefijo y en español
 * («/campanas/[id]» para una ruta dinámica).
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)

type Query = Record<string, string>

/**
 * Enlace a una ruta dinámica traducida: `hrefDinamico("/campanas/[id]", { id })`
 * da «/campaigns/cmp_liga» en inglés y «/campanhas/cmp_liga» en portugués.
 *
 * `pathnames` tiene un tipo abierto para que las rutas del admin y los enlaces
 * con consulta vayan como texto; a cambio TypeScript no conoce `params` y el
 * molde vive solo aquí. Una ruta estática con consulta no lo necesita:
 * `{ pathname: "/ajustes", query: { seccion } }`.
 */
export function hrefDinamico(
  pathname: string,
  params: Record<string, string>,
  query?: Query
) {
  return { pathname, params, query } as unknown as { pathname: string; query?: Query }
}
