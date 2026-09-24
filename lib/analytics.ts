import { LOCALE_TAG, type Locale } from "@/i18n/routing"
import type { EntradaAgenda } from "@/lib/agenda"
import { seededNoise } from "@/lib/mock-data"
import { SOCIAL_IDS, type SocialId } from "@/lib/social"

/**
 * Analíticas de lo publicado.
 *
 * Cada clip se INDEXA al publicarse en una red: desde ese momento Clipealo puede
 * pedir sus cifras a la red. No hay tiempo real: las cifras son las de la última
 * vez que el usuario pulsó «Refrescar» (`indexadoEn`), y todo lo que se pinta
 * se calcula para ese instante. Así las gráficas no cambian mientras se leen.
 *
 * De dónde salen las publicaciones: de las **semillas** de este archivo (lo que
 * ya estaba indexado antes) y de lo que Clipealo publica, que vive en la agenda
 * (`lib/agenda.ts`). Una entrada `publicada` se convierte en publicación con
 * `publicacionesDeAgenda`, así que lo que sale de la ficha de un clip aparece
 * aquí sin que nadie pegue ningún enlace. Una recién publicada arranca en cero
 * y crece al refrescar, que es exactamente lo que hace una de verdad.
 *
 * Las métricas de una publicación son acumuladas y nunca bajan: siguen una curva
 * de crecimiento (rápido los primeros días, cola larga después), así que se
 * pueden pedir en cualquier instante sin guardar histórico. Con la API real,
 * `metricasEn` se sustituye por la lectura de las instantáneas guardadas.
 */

/** Última actualización del arquetipo: el mismo «hoy» que el resto del producto. */
export const INDEXADO_EN = "2026-09-13T12:20:00.000Z"

export const PERIODOS = [7, 30, 90] as const
export type Periodo = (typeof PERIODOS)[number]

/**
 * Las redes de las analíticas son TODAS las del producto: desde que Clipealo
 * publica, una publicación puede salir en X o en Facebook, y una gráfica que no
 * las conociera dejaría fuera lo que el usuario acaba de mandar.
 */
export const REDES_ANALITICA = SOCIAL_IDS
export type RedAnalitica = SocialId

/** El color sigue a la red, nunca a su posición: filtrar no repinta a las demás. */
export const COLOR_RED: Record<RedAnalitica, string> = {
  tiktok: "var(--chart-1)",
  instagram: "var(--chart-2)",
  youtube: "var(--chart-3)",
  linkedin: "var(--chart-4)",
  x: "var(--chart-5)",
  facebook: "var(--chart-6)",
}

export interface Metricas {
  vistas: number
  likes: number
  comentarios: number
  compartidos: number
}

export interface Publicacion {
  id: string
  /** Clip de la biblioteca, si sigue en ella. */
  clipId?: string
  /** Proyecto del que salió: permite agrupar y filtrar por podcast. */
  proyectoId?: string
  /** Cuenta por la que salió. Con dos cuentas de TikTok, es lo que las separa. */
  cuentaId?: string
  titulo: string
  red: RedAnalitica
  publicadoEn: string
  url: string
  /** Lo que devuelve la plataforma; con él se leerán las métricas de verdad. */
  postId?: string
  /** Porcentaje medio del clip que se ve. */
  retencion: number
  /** Vistas acumuladas en `INDEXADO_EN`: calibra la curva. */
  vistasHoy: number
  /** Días hasta estabilizarse: pocos en TikTok, más en YouTube. */
  tau: number
  tasas: { likes: number; comentarios: number; compartidos: number }
}

const DIA = 86_400_000
/** Peso de la cola larga frente al pico inicial. */
const COLA = 0.12

function forma(dias: number, tau: number) {
  if (dias <= 0) return 0
  return 1 - Math.exp(-dias / tau) + COLA * Math.log1p(dias / 7)
}

/** Métricas acumuladas de una publicación en un instante. 0 antes de publicarse. */
export function metricasEn(p: Publicacion, instante: string | Date): Metricas {
  const t = new Date(instante).getTime()
  const dias = (t - new Date(p.publicadoEn).getTime()) / DIA
  const calibre = forma(
    (new Date(INDEXADO_EN).getTime() - new Date(p.publicadoEn).getTime()) / DIA,
    p.tau
  )
  const vistas = Math.max(
    0,
    Math.round((p.vistasHoy * forma(dias, p.tau)) / (calibre || 1))
  )
  return {
    vistas,
    likes: Math.round(vistas * p.tasas.likes),
    comentarios: Math.round(vistas * p.tasas.comentarios),
    compartidos: Math.round(vistas * p.tasas.compartidos),
  }
}

const TIPO_URL: Partial<Record<RedAnalitica, string>> = {
  tiktok: "https://www.tiktok.com/@clipealo/video/",
  instagram: "https://www.instagram.com/reel/",
  youtube: "https://youtube.com/shorts/",
  linkedin: "https://www.linkedin.com/feed/update/",
}

const TAU: Record<RedAnalitica, number> = {
  tiktok: 2.2,
  instagram: 3.5,
  youtube: 8,
  linkedin: 4,
  x: 1.6,
  facebook: 3,
}
const TASAS: Record<RedAnalitica, Publicacion["tasas"]> = {
  tiktok: { likes: 0.071, comentarios: 0.006, compartidos: 0.014 },
  instagram: { likes: 0.058, comentarios: 0.004, compartidos: 0.011 },
  youtube: { likes: 0.042, comentarios: 0.003, compartidos: 0.004 },
  linkedin: { likes: 0.031, comentarios: 0.005, compartidos: 0.009 },
  x: { likes: 0.024, comentarios: 0.003, compartidos: 0.008 },
  facebook: { likes: 0.036, comentarios: 0.005, compartidos: 0.007 },
}

/**
 * Qué se publicó, dónde y cuándo. Los tres clips publicados de la biblioteca
 * reparten sus vistas totales (`lib/mock-data.ts`) entre las redes; el resto son
 * clips de proyectos anteriores que ya no están en la biblioteca.
 */
const SEMILLAS: [
  titulo: string,
  clipId: string | undefined,
  fecha: string,
  reparto: Partial<Record<RedAnalitica, number>>,
  retencion: number,
][] = [
  [
    "El error de contratar por zona horaria",
    "clip_01",
    "2026-09-06T17:00:00.000Z",
    { tiktok: 81_200, instagram: 32_600, youtube: 14_600 },
    71,
  ],
  [
    "La regla de las tres reuniones",
    "clip_02",
    "2026-09-07T16:30:00.000Z",
    { tiktok: 24_100, instagram: 11_900, linkedin: 6_300 },
    64,
  ],
  [
    "Documentar es un acto de respeto",
    "clip_03",
    "2026-09-08T15:00:00.000Z",
    { linkedin: 9_800, instagram: 9_100 },
    58,
  ],
  [
    "Por qué despedimos a nuestro mejor vendedor",
    undefined,
    "2026-08-27T18:00:00.000Z",
    { tiktok: 212_400, youtube: 48_300 },
    76,
  ],
  [
    "El correo que nos ahorró veinte horas",
    undefined,
    "2026-08-19T14:00:00.000Z",
    { instagram: 27_800, linkedin: 15_400 },
    62,
  ],
  [
    "Contratar lento, despedir rápido",
    undefined,
    "2026-08-02T17:30:00.000Z",
    { tiktok: 96_700, instagram: 41_200, youtube: 22_900 },
    68,
  ],
  [
    "Cómo convencimos al primer inversor",
    undefined,
    "2026-07-15T16:00:00.000Z",
    { youtube: 61_800, linkedin: 12_700 },
    73,
  ],
  [
    "Nadie lee tu documentación (y es culpa tuya)",
    undefined,
    "2026-06-24T15:30:00.000Z",
    { tiktok: 54_300, instagram: 18_600 },
    59,
  ],
]

const rnd = seededNoise(314)
export const publicaciones: Publicacion[] = SEMILLAS.flatMap(
  ([titulo, clipId, fecha, reparto, retencion], i) =>
    REDES_ANALITICA.filter((red) => reparto[red]).map((red, j) => {
      // Cada red recibe el clip con unas horas de diferencia
      const publicadoEn = new Date(
        new Date(fecha).getTime() + j * 3 * 3_600_000
      ).toISOString()
      const id = `pub_${String(i + 1).padStart(2, "0")}_${red}`
      return {
        id,
        clipId,
        proyectoId: clipId ? "src_01" : undefined,
        titulo,
        red,
        publicadoEn,
        url: `${TIPO_URL[red] ?? ""}${7_300_000_000 + Math.round(rnd() * 99_999_999)}`,
        retencion: Math.round(retencion + (rnd() - 0.5) * 8),
        vistasHoy: reparto[red]!,
        tau: TAU[red] * (0.8 + rnd() * 0.4),
        tasas: TASAS[red],
      }
    })
)

/* ---------------------------------------------------------------------------
   Lo que Clipealo publica entra aquí solo
   --------------------------------------------------------------------------- */

/**
 * Las entradas de agenda que salen de estas mismas semillas
 * (`entradasDePublicaciones`, `lib/agenda.ts`): si se volvieran a leer como
 * publicaciones, cada una contaría dos veces y las vistas se doblarían.
 */
const DERIVADAS = new Set(publicaciones.map((p) => `age_${p.id}`))

/** Un número estable a partir de un id: la misma publicación, la misma curva. */
function semillaDe(id: string) {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h
}

/**
 * Lo publicado desde Clipealo, como publicaciones de Analíticas.
 *
 * La curva se calibra con un número sembrado del id, no con el azar: la misma
 * publicación enseña siempre las mismas cifras en el servidor y en el
 * navegador. Una recién salida arranca en cero —`forma(0)` es cero— y crece al
 * refrescar, que es lo que hace una de verdad. Con la API real esto se sustituye
 * por la lectura de las instantáneas (`lib/api/analiticas.ts`).
 */
export function publicacionesDeAgenda(entradas: EntradaAgenda[]): Publicacion[] {
  const out: Publicacion[] = []
  for (const e of entradas) {
    if (e.estado !== "publicada" || !e.url || DERIVADAS.has(e.id)) continue
    const rnd = seededNoise(semillaDe(e.id))
    out.push({
      id: e.id,
      clipId: e.clipId,
      proyectoId: e.proyectoId,
      cuentaId: e.cuentaId,
      titulo: e.titulo,
      red: e.red,
      publicadoEn: e.publicadaEn ?? e.programadaPara,
      url: e.url,
      postId: e.postId,
      retencion: 45 + Math.round(rnd() * 30),
      vistasHoy: 1_200 + Math.round(rnd() * 14_000),
      tau: TAU[e.red] * (0.8 + rnd() * 0.4),
      tasas: TASAS[e.red],
    })
  }
  return out
}

/** Las semillas más lo publicado desde Clipealo, en orden de publicación. */
export const todasLasPublicaciones = (entradas: EntradaAgenda[]): Publicacion[] =>
  [...publicaciones, ...publicacionesDeAgenda(entradas)].sort((a, b) =>
    b.publicadoEn.localeCompare(a.publicadoEn)
  )

/* ---------------------------------------------------------------------------
   Lo que el plan deja ver
   --------------------------------------------------------------------------- */

/** Lo que un plan deja medir. `clips: null` es todos. */
export interface LimiteAnaliticas {
  redes: readonly RedAnalitica[]
  clips: number | null
}

export const hayLimiteAnaliticas = (l: LimiteAnaliticas) =>
  l.clips !== null || l.redes.length < REDES_ANALITICA.length

/**
 * Las publicaciones que el plan deja ver: las de sus redes y, si tiene tope,
 * las de sus últimos clips.
 *
 * El tope se cuenta por CLIP y no por publicación: el mismo clip en TikTok y en
 * YouTube es un clip, y contarlo dos veces dejaría al plan Prueba viendo dos
 * momentos y medio. Una publicación sin clip vivo cuenta como el suyo propio,
 * porque para quien mira también es un video que sacó.
 *
 * Nada se recorta a escondidas: quien llama enseña cuántos hay fuera
 * (`ocultasPorPlan`) y por qué. Función pura, sin reloj: el orden lo da la
 * fecha de publicación, que ya está guardada.
 */
export function limitarAnaliticas(
  pubs: Publicacion[],
  limite: LimiteAnaliticas
): Publicacion[] {
  const deSusRedes = pubs.filter((p) => limite.redes.includes(p.red))
  if (limite.clips === null) return deSusRedes

  // Cada clip, con la fecha de su publicación más reciente
  const ultima = new Map<string, string>()
  for (const p of deSusRedes) {
    const clave = p.clipId ?? p.id
    const previa = ultima.get(clave)
    if (!previa || p.publicadoEn > previa) ultima.set(clave, p.publicadoEn)
  }
  const visibles = new Set(
    [...ultima.entries()]
      .sort((a, b) => b[1].localeCompare(a[1]) || a[0].localeCompare(b[0]))
      .slice(0, limite.clips)
      .map(([clave]) => clave)
  )
  return deSusRedes.filter((p) => visibles.has(p.clipId ?? p.id))
}

/** Cuántas publicaciones deja fuera el plan. Se dice, no se esconde. */
export const ocultasPorPlan = (pubs: Publicacion[], limite: LimiteAnaliticas) =>
  pubs.length - limitarAnaliticas(pubs, limite).length

/* ---------------------------------------------------------------------------
   Fechas de las gráficas y del sello de actualización, en el idioma activo
   --------------------------------------------------------------------------- */

export interface FechasAnalitica {
  /** «13 sept» · «Sep 13» · «13 de set.»: ejes y filas de la tabla. */
  dia: Intl.DateTimeFormat
  /** «13 sept, 14:20»: la última actualización en tooltips y en el detalle. */
  diaHora: Intl.DateTimeFormat
  /** «13 de septiembre, 14:20»: el sello «Actualizado el…». */
  cuando: Intl.DateTimeFormat
}

const fechas = new Map<Locale, FechasAnalitica>()

/** Formateadores de fecha de las analíticas, creados una vez por idioma. */
export function fechasAnalitica(locale: Locale): FechasAnalitica {
  let f = fechas.get(locale)
  if (!f) {
    const tag = LOCALE_TAG[locale]
    // En inglés, «2:20 PM»; en español y portugués, «14:20»
    const hour = locale === "en" ? "numeric" : "2-digit"
    f = {
      dia: new Intl.DateTimeFormat(tag, { day: "numeric", month: "short" }),
      diaHora: new Intl.DateTimeFormat(tag, {
        day: "numeric",
        month: "short",
        hour,
        minute: "2-digit",
      }),
      cuando: new Intl.DateTimeFormat(tag, {
        day: "numeric",
        month: "long",
        hour,
        minute: "2-digit",
      }),
    }
    fechas.set(locale, f)
  }
  return f
}

/* ---------------------------------------------------------------------------
   Cálculos. Funciones puras sobre (publicaciones, instante): nada de `Date.now()`
   --------------------------------------------------------------------------- */

const suma = (a: Metricas, b: Metricas): Metricas => ({
  vistas: a.vistas + b.vistas,
  likes: a.likes + b.likes,
  comentarios: a.comentarios + b.comentarios,
  compartidos: a.compartidos + b.compartidos,
})
const resta = (a: Metricas, b: Metricas): Metricas => ({
  vistas: a.vistas - b.vistas,
  likes: a.likes - b.likes,
  comentarios: a.comentarios - b.comentarios,
  compartidos: a.compartidos - b.compartidos,
})
const CERO: Metricas = { vistas: 0, likes: 0, comentarios: 0, compartidos: 0 }

/** Lo ganado entre dos instantes, sumando publicaciones. */
export function ganado(pubs: Publicacion[], desde: Date, hasta: Date): Metricas {
  return pubs.reduce(
    (acc, p) => suma(acc, resta(metricasEn(p, hasta), metricasEn(p, desde))),
    CERO
  )
}

export function inicioPeriodo(hasta: Date, dias: number) {
  return new Date(hasta.getTime() - dias * DIA)
}

export interface Resumen {
  actual: Metricas
  anterior: Metricas
  /** Retención media ponderada por las vistas ganadas en el período. */
  retencion: number | null
  retencionAnterior: number | null
  /** Vistas ganadas por día: la tendencia de la tarjeta, del más antiguo al último. */
  tendencia: number[]
  publicadasEnPeriodo: number
}

function retencionPonderada(pubs: Publicacion[], desde: Date, hasta: Date) {
  let peso = 0
  let total = 0
  for (const p of pubs) {
    const v = metricasEn(p, hasta).vistas - metricasEn(p, desde).vistas
    peso += v
    total += v * p.retencion
  }
  return peso > 0 ? total / peso : null
}

export function resumen(pubs: Publicacion[], hasta: Date, dias: Periodo): Resumen {
  const desde = inicioPeriodo(hasta, dias)
  const antes = inicioPeriodo(desde, dias)
  const puntos = Math.min(dias, 14)
  const paso = (hasta.getTime() - desde.getTime()) / puntos
  const tendencia = Array.from({ length: puntos }, (_, i) => {
    const a = new Date(desde.getTime() + paso * i)
    const b = new Date(desde.getTime() + paso * (i + 1))
    return ganado(pubs, a, b).vistas
  })
  return {
    actual: ganado(pubs, desde, hasta),
    anterior: ganado(pubs, antes, desde),
    retencion: retencionPonderada(pubs, desde, hasta),
    retencionAnterior: retencionPonderada(pubs, antes, desde),
    tendencia,
    publicadasEnPeriodo: pubs.filter(
      (p) => new Date(p.publicadoEn) > desde && new Date(p.publicadoEn) <= hasta
    ).length,
  }
}

/** Variación porcentual; `null` si no hay base con la que comparar. */
export function variacionPct(actual: number, anterior: number) {
  return anterior > 0 ? ((actual - anterior) / anterior) * 100 : null
}

export type FilaSerie = { instante: string } & Partial<Record<RedAnalitica, number>>

/**
 * Vistas ganadas desde el inicio del período, por red, un punto al cierre de
 * cada día y el último en el instante de la actualización.
 */
export function serieCrecimiento(
  pubs: Publicacion[],
  hasta: Date,
  dias: Periodo
): FilaSerie[] {
  const desde = inicioPeriodo(hasta, dias)
  const redes = REDES_ANALITICA.filter((r) => pubs.some((p) => p.red === r))
  const puntos = Array.from(
    { length: dias },
    (_, i) => new Date(desde.getTime() + DIA * (i + 1))
  )
  puntos[puntos.length - 1] = hasta
  return [desde, ...puntos].map((t) => {
    const fila: FilaSerie = { instante: t.toISOString() }
    for (const r of redes)
      fila[r] = ganado(
        pubs.filter((p) => p.red === r),
        desde,
        t
      ).vistas
    return fila
  })
}

export interface TotalRed {
  red: RedAnalitica
  vistas: number
  /** (me gusta + comentarios + compartidos) ÷ vistas, en el período. */
  interaccionPct: number | null
  publicaciones: number
}

export function porRed(pubs: Publicacion[], hasta: Date, dias: Periodo): TotalRed[] {
  const desde = inicioPeriodo(hasta, dias)
  return REDES_ANALITICA.map((red) => {
    const propias = pubs.filter((p) => p.red === red && new Date(p.publicadoEn) <= hasta)
    const g = ganado(propias, desde, hasta)
    return {
      red,
      vistas: g.vistas,
      interaccionPct:
        g.vistas > 0
          ? ((g.likes + g.comentarios + g.compartidos) / g.vistas) * 100
          : null,
      publicaciones: propias.length,
    }
  })
    .filter((t) => t.publicaciones > 0)
    .sort((a, b) => b.vistas - a.vistas)
}

export interface FilaPublicacion {
  pub: Publicacion
  total: Metricas
  enPeriodo: Metricas
  /** Vistas ganadas desde la actualización anterior; `null` en la primera. */
  desdeAnterior: number | null
  /** Vistas ganadas por día en los últimos 14 días. */
  tendencia: number[]
  /** Publicada después de la actualización anterior: es nueva en el índice. */
  nueva: boolean
}

export function filasPublicaciones(
  pubs: Publicacion[],
  hasta: Date,
  dias: Periodo,
  anterior: Date | null
): FilaPublicacion[] {
  const desde = inicioPeriodo(hasta, dias)
  return pubs
    .filter((p) => new Date(p.publicadoEn) <= hasta)
    .map((pub) => {
      const total = metricasEn(pub, hasta)
      const tendencia = Array.from({ length: 14 }, (_, i) => {
        const a = new Date(hasta.getTime() - DIA * (14 - i))
        const b = new Date(hasta.getTime() - DIA * (13 - i))
        return metricasEn(pub, b).vistas - metricasEn(pub, a).vistas
      })
      return {
        pub,
        total,
        enPeriodo: resta(total, metricasEn(pub, desde)),
        desdeAnterior: anterior ? total.vistas - metricasEn(pub, anterior).vistas : null,
        tendencia,
        nueva: anterior !== null && new Date(pub.publicadoEn) > anterior,
      }
    })
    .sort(
      (a, b) => b.enPeriodo.vistas - a.enPeriodo.vistas || b.total.vistas - a.total.vistas
    )
}

/** Vistas acumuladas de una publicación por día, desde que se publicó. */
export function curvaPublicacion(pub: Publicacion, hasta: Date) {
  const inicio = new Date(pub.publicadoEn).getTime()
  const dias = Math.max(1, Math.ceil((hasta.getTime() - inicio) / DIA))
  return Array.from({ length: dias + 1 }, (_, i) => {
    const t = i === dias ? hasta : new Date(inicio + DIA * i)
    return { instante: t.toISOString(), vistas: metricasEn(pub, t).vistas }
  })
}
