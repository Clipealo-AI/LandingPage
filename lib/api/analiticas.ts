import { hayServidor, pedir } from "@/lib/api/cliente"
import { INDEXADO_EN, metricasEn, type Metricas, type Publicacion } from "@/lib/analytics"

/**
 * FRONTERA DE DATOS: las cifras de lo publicado.
 *
 * Leer métricas no es como pedir un proyecto: cada plataforma limita cuántas
 * veces se le puede preguntar, así que en producción esto no llama a las redes
 * en cada visita. Un proceso del servidor guarda instantáneas por publicación y
 * estas funciones leen esas instantáneas; «Refrescar» pide una lectura nueva
 * cuando la cuota lo permite.
 *
 * Sin `NEXT_PUBLIC_API_URL` se simula con la curva de `lib/analytics.ts`, que
 * es determinista: la misma publicación en el mismo instante da siempre lo
 * mismo en el servidor y en el navegador.
 */

/** Lo que devuelve una lectura: métricas por id de publicación. */
export type LecturaMetricas = Record<string, Metricas>

/**
 * Las cifras de unas publicaciones en un instante.
 *
 * `pubs` solo hace falta mientras no haya servidor: es de donde sale la
 * simulación. Con API real se ignora y manda lo que guarde el backend.
 */
export async function leerMetricas(
  ids: string[],
  pubs: Publicacion[] = [],
  hasta: string = INDEXADO_EN
): Promise<LecturaMetricas> {
  if (hayServidor())
    return pedir<LecturaMetricas>("/analiticas/metricas", {
      method: "POST",
      body: { ids, hasta },
    })
  const out: LecturaMetricas = {}
  for (const id of ids) {
    const pub = pubs.find((p) => p.id === id)
    if (pub) out[id] = metricasEn(pub, hasta)
  }
  return out
}

/**
 * Las vistas de una sola publicación, que es lo que necesita un envío a
 * campaña. Devuelve `undefined` cuando no hay nada que leer: no es cero.
 */
export async function leerVistas(
  id: string,
  pubs: Publicacion[] = [],
  hasta: string = INDEXADO_EN
): Promise<number | undefined> {
  const lectura = await leerMetricas([id], pubs, hasta)
  return lectura[id]?.vistas
}
