import type { MonthKey } from "@/lib/admin/types"

/**
 * El mes del backoffice viaja en `?mes=AAAA-MM`; ausente es el mes en curso.
 * Cada enlace interno del admin —migas, barra lateral, KPIs, tablas— pasa por
 * `conMes` para no perderlo: elegir agosto y pulsar «Ver la lista» tiene que
 * abrir la lista de agosto.
 *
 * Nunca se escribe `mes=` para el mes en curso: dejaría la URL sucia y
 * contradiría al selector, que lo borra. Y es concatenación, no
 * `URLSearchParams`: así `q=Ana%20P%C3%A9rez` no se reencodifica y el `#hash`
 * queda detrás de la consulta. Sin `server-only`: lo usa la barra lateral.
 */

/** El mes que hay que arrastrar en los enlaces: ninguno si es el mes en curso. */
export function mesEnEnlaces(month: MonthKey, current: MonthKey): MonthKey | null {
  return month === current ? null : month
}

/** `href` con `mes=` puesto (o sustituido). Solo toca rutas del admin; el resto vuelve intacto. */
export function conMes(href: string, mes: string | null | undefined): string {
  if (!mes || !href.startsWith("/admin")) return href
  const i = href.indexOf("#")
  const base = i === -1 ? href : href.slice(0, i)
  const hash = i === -1 ? "" : href.slice(i)
  const [ruta, consulta = ""] = base.split("?")
  const partes = consulta.split("&").filter((p) => p && !p.startsWith("mes="))
  partes.push(`mes=${mes}`)
  return `${ruta}?${partes.join("&")}${hash}`
}
