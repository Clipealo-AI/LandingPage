import type { AspectRatioKey } from "@/lib/types"
import { planPermite, type Capacidad, type PlanRef } from "@/lib/pricing"

/**
 * OPERACIONES: la suite de herramientas del clipero sobre sus videos, sin
 * pasar por el análisis. Recortar un tramo, reducir el tamaño y sacar
 * variantes son trabajos que el pipeline procesa como uno más
 * (`lib/api/jobs.ts`), con su cola, su progreso y su reintento ya hechos.
 * Publicación (`lib/publicacion.ts`) y Derechos (`lib/derechos.ts`) no tocan
 * el archivo: preparan lo de alrededor.
 *
 * Dominio puro: qué herramientas hay, qué parámetros lleva cada una y qué
 * impide encargarla. Los textos viven en `app.operaciones` y en
 * `common.video.operacion`. Las validaciones devuelven códigos.
 *
 * Lo que NO hay aquí, a propósito: ninguna operación que altere un video para
 * que una plataforma no lo reconozca. Eso sirve para una sola cosa —esquivar
 * el Content ID y la detección de duplicados— y pone en riesgo las cuentas de
 * quien lo usa. «Diez identidades para el mismo video» no es una herramienta:
 * es lo que las plataformas persiguen. Lo que sí resuelve la necesidad son las
 * variantes (contenido distinto de verdad), la licencia y la lista blanca de la
 * agencia (el permiso), y los metadatos de publicación (lo de alrededor).
 */

/* ---------------------------------------------------------------------------
   La suite
   --------------------------------------------------------------------------- */

/** Cada herramienta es su página: `/operaciones/<id>`. Textos en `app.operaciones.herramientas`. */
export const HERRAMIENTAS = [
  "recortar",
  "reducir",
  "variantes",
  "publicacion",
  "derechos",
] as const
export type HerramientaId = (typeof HERRAMIENTAS)[number]

/** La capacidad del plan que abre cada herramienta. Sin ella, es de todos los planes. */
export const HERRAMIENTA_CAPACIDAD: Partial<Record<HerramientaId, Capacidad>> = {
  recortar: "operaciones",
  reducir: "operaciones",
  variantes: "operaciones",
}

export function puedeUsarHerramienta(plan: PlanRef, h: HerramientaId) {
  const capacidad = HERRAMIENTA_CAPACIDAD[h]
  return capacidad ? planPermite(plan, capacidad) : true
}

/** Las operaciones que son un trabajo del pipeline. Etiquetas en `common.video.operacion.<id>`. */
export const OPERACIONES = ["recortar", "reducir"] as const
export type OperacionId = (typeof OPERACIONES)[number]

/** Calidades de salida al reducir: lo que se sacrifica, dicho en tamaño. */
export const CALIDADES = ["ligera", "equilibrada", "maxima"] as const
export type Calidad = (typeof CALIDADES)[number]

/**
 * Cuánto pesa de menos cada calidad, aproximado y solo para decirlo antes de
 * encargarlo: la cifra real la da el procesado.
 */
export const REDUCCION_APROX: Record<Calidad, number> = {
  ligera: 0.7,
  equilibrada: 0.5,
  maxima: 0.25,
}

export interface Recorte {
  /** Segundos desde el inicio. */
  inicio: number
  fin: number
}

/* ---------------------------------------------------------------------------
   Variantes: de un clip, varias versiones que son contenido distinto
   --------------------------------------------------------------------------- */

/** Etiquetas en `common.video.subtitulos.<id>`. */
export const ESTILOS_SUBTITULO = ["sin", "limpio", "karaoke", "caja"] as const
export type EstiloSubtitulo = (typeof ESTILOS_SUBTITULO)[number]

/** Los idiomas del producto: los que el pipeline sabe subtitular hoy. */
export const IDIOMAS_SUBTITULO = ["es", "en", "pt"] as const
export type IdiomaSubtitulo = (typeof IDIOMAS_SUBTITULO)[number]

export const DURACIONES_VARIANTE = [15, 30, 45, 60] as const
export const FORMATOS_VARIANTE: readonly AspectRatioKey[] = ["9:16", "1:1", "4:5", "16:9"]

export interface Variante {
  /** Segundo del video en el que empieza. */
  gancho: number
  /** Segundos que dura desde el gancho, o hasta el final si el video se acaba antes. */
  duracion: number
  formato: AspectRatioKey
  subtitulos: EstiloSubtitulo
  idioma: IdiomaSubtitulo
  /** Segundo del fotograma de portada. */
  portada: number
}

/** Lo que se elige; las variantes salen del producto cartesiano. */
export interface PlanVariantes {
  ganchos: number[]
  duraciones: number[]
  formatos: AspectRatioKey[]
  subtitulos: EstiloSubtitulo[]
  idioma: IdiomaSubtitulo
  /** La portada de cada versión es el fotograma de su gancho; si no, el inicio del video. */
  portadaEnGancho: boolean
}

export const LIMITES_VARIANTES = {
  /** Más de doce trabajos de golpe no es probar ganchos: es inundar la cola. */
  max: 12,
  ganchosMax: 4,
  /** Una versión más corta que esto no es un clip. */
  duracionMin: 5,
} as const

/** Ganchos repartidos por el video (10 %, 40 %, 70 %…), enteros y sin repetir. */
export function ganchosPropuestos(duracionSeg: number, n = 3): number[] {
  const fracciones = [0.1, 0.4, 0.7, 0.85].slice(0, Math.max(0, Math.min(n, 4)))
  return [...new Set(fracciones.map((f) => Math.floor(duracionSeg * f)))]
}

export const PLAN_VARIANTES_NUEVO = (duracionSeg: number): PlanVariantes => ({
  ganchos: ganchosPropuestos(duracionSeg, 3),
  duraciones: [30],
  formatos: ["9:16"],
  subtitulos: ["limpio"],
  idioma: "es",
  portadaEnGancho: true,
})

/**
 * Las variantes que salen de un plan, en orden: gancho, duración, formato,
 * subtítulos. Una combinación a la que no le quedan `duracionMin` segundos de
 * video se descarta: no es un clip.
 */
export function combinarVariantes(p: PlanVariantes, duracionSeg: number): Variante[] {
  const out: Variante[] = []
  for (const gancho of p.ganchos)
    for (const duracion of p.duraciones)
      for (const formato of p.formatos)
        for (const subtitulos of p.subtitulos) {
          if (
            duracionVariante({ gancho, duracion }, duracionSeg) <
            LIMITES_VARIANTES.duracionMin
          )
            continue
          out.push({
            gancho,
            duracion,
            formato,
            subtitulos,
            idioma: p.idioma,
            portada: p.portadaEnGancho ? gancho : 0,
          })
        }
  return out
}

/** Segundos que dura de verdad: hasta el final del video si se acaba antes. */
export const duracionVariante = (
  v: Pick<Variante, "gancho" | "duracion">,
  duracionSeg: number
) => Math.max(0, Math.min(v.duracion, duracionSeg - v.gancho))

export type CodigoAvisoVariantes =
  "sinVideo" | "sinVariantes" | "demasiadasVariantes" | "ganchoFuera" | "duracionCorta"

export interface AvisoVariantes {
  code: CodigoAvisoVariantes
  bloquea: boolean
  values?: { min: number; max: number }
}

/** Lo que impide encargar las variantes. `duracionSeg` es la del video elegido; `null` sin ninguno. */
export function validarVariantes(
  p: PlanVariantes,
  duracionSeg: number | null
): AvisoVariantes[] {
  if (duracionSeg === null) return [{ code: "sinVideo", bloquea: true }]
  const avisos: AvisoVariantes[] = []
  if (p.ganchos.some((g) => g < 0 || g >= duracionSeg))
    avisos.push({
      code: "ganchoFuera",
      bloquea: true,
      values: { min: 0, max: Math.max(0, Math.floor(duracionSeg) - 1) },
    })
  const total = combinarVariantes(p, duracionSeg).length
  if (total === 0) {
    // Un gancho al que no le queda video es la causa más común, y se dice
    const cortas = p.ganchos.some((g) => duracionSeg - g < LIMITES_VARIANTES.duracionMin)
    avisos.push(
      cortas
        ? {
            code: "duracionCorta",
            bloquea: true,
            values: { min: LIMITES_VARIANTES.duracionMin, max: Math.floor(duracionSeg) },
          }
        : { code: "sinVariantes", bloquea: true }
    )
  }
  if (total > LIMITES_VARIANTES.max)
    avisos.push({
      code: "demasiadasVariantes",
      bloquea: true,
      values: { min: 1, max: LIMITES_VARIANTES.max },
    })
  return avisos
}

export const hayBloqueoVariantes = (a: AvisoVariantes[]) => a.some((x) => x.bloquea)

export type ParametrosOperacion =
  | { operacion: "recortar"; recorte: Recorte }
  | { operacion: "reducir"; calidad: Calidad }
  | { operacion: "variante"; variante: Variante; indice: number; total: number }

export const LIMITES_OPERACION = {
  /** Un recorte más corto que esto no es un clip: es un fotograma. */
  recorteMinSeg: 1,
} as const

export type CodigoAvisoOperacion =
  "sinVideo" | "recorteInvertido" | "recorteCorto" | "recorteFuera"

export interface AvisoOperacion {
  code: CodigoAvisoOperacion
  bloquea: boolean
  values?: { min: number; max: number }
}

/**
 * Lo que impide encargar la operación. `duracionSeg` es la del video elegido;
 * `null` mientras no haya ninguno.
 */
export function validarOperacion(
  p: ParametrosOperacion,
  duracionSeg: number | null
): AvisoOperacion[] {
  const avisos: AvisoOperacion[] = []
  if (duracionSeg === null) return [{ code: "sinVideo", bloquea: true }]
  if (p.operacion === "recortar") {
    const { inicio, fin } = p.recorte
    if (fin <= inicio) avisos.push({ code: "recorteInvertido", bloquea: true })
    else if (fin - inicio < LIMITES_OPERACION.recorteMinSeg)
      avisos.push({
        code: "recorteCorto",
        bloquea: true,
        values: { min: LIMITES_OPERACION.recorteMinSeg, max: duracionSeg },
      })
    if (inicio < 0 || fin > duracionSeg)
      avisos.push({
        code: "recorteFuera",
        bloquea: true,
        values: { min: 0, max: duracionSeg },
      })
  }
  return avisos
}

export const hayBloqueoOperacion = (a: AvisoOperacion[]) => a.some((x) => x.bloquea)

/** Segundos que quedan tras recortar. */
export const duracionRecortada = (r: Recorte) => Math.max(0, r.fin - r.inicio)

/** Bytes aproximados tras reducir. Solo para decirlo antes; el procesado manda. */
export const tamanoAprox = (bytes: number, calidad: Calidad) =>
  Math.round(bytes * REDUCCION_APROX[calidad])

/** Título del trabajo que sale de una operación: el del video y qué se le hizo. */
export const tituloOperado = (titulo: string, p: ParametrosOperacion) => {
  if (p.operacion === "recortar")
    return `${titulo} · ${formatoSeg(p.recorte.inicio)}–${formatoSeg(p.recorte.fin)}`
  if (p.operacion === "reducir") return `${titulo} · ${p.calidad}`
  const v = p.variante
  return `${titulo} · V${p.indice + 1}/${p.total} · ${formatoSeg(v.gancho)} · ${v.duracion} s · ${v.formato}`
}

/** mm:ss, sin depender de `lib/format` para no arrastrarlo al dominio. */
function formatoSeg(seg: number) {
  const m = Math.floor(seg / 60)
  const s = Math.floor(seg % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}
