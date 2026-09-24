import { ACCIONES, ENDPOINTS } from "@/lib/wiki"
import { AREA_INFO } from "@/lib/wiki/areas"
import { hrefAccion, hrefEndpoint } from "@/lib/wiki/rutas"
import { SECCIONES_MARCA } from "@/lib/wiki/marca"
import { AREAS, type Area } from "@/lib/wiki/tipos"

/** Una línea del buscador: lo justo para encontrar y saltar. */
export interface EntradaIndice {
  tipo: "accion" | "endpoint" | "marca" | "area"
  id: string
  titulo: string
  detalle: string
  area?: Area
  href: string
  /** Texto extra que también encuentra la búsqueda (ruta, método, reglas). */
  claves: string
}

/**
 * El índice del buscador, calculado en el servidor.
 *
 * Solo viajan los campos que se ven en la paleta: con el catálogo entero en el
 * navegador, cada página de la wiki cargaría todas las demás.
 */
export function indiceWiki(): EntradaIndice[] {
  return [
    ...AREAS.map((a) => ({
      tipo: "area" as const,
      id: a,
      titulo: AREA_INFO[a].titulo,
      detalle: AREA_INFO[a].descripcion,
      area: a,
      href: `/docs/acciones#${a}`,
      claves: a,
    })),
    ...ACCIONES.map((a) => ({
      tipo: "accion" as const,
      id: a.id,
      titulo: a.titulo,
      detalle: a.resumen,
      area: a.area,
      href: hrefAccion(a.id),
      claves: [a.id, ...a.donde.map((d) => d.ruta), ...a.endpoints].join(" "),
    })),
    ...ENDPOINTS.map((e) => ({
      tipo: "endpoint" as const,
      id: e.id,
      titulo: `${e.metodo} ${e.ruta}`,
      detalle: e.resumen,
      area: e.area,
      href: hrefEndpoint(e.id),
      claves: [e.id, e.respuesta.tipo, e.cuerpo?.tipo ?? ""].join(" "),
    })),
    ...SECCIONES_MARCA.map((s) => ({
      tipo: "marca" as const,
      id: s.id,
      titulo: s.titulo,
      detalle: s.resumen,
      href: `/docs/marca#${s.id}`,
      claves: (s.tokens ?? []).map((t) => t.variable).join(" "),
    })),
  ]
}
