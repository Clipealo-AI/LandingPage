import {
  PLAN_IDS,
  alMenos,
  planPermite,
  type PlanRef,
  type PricingPlanId,
} from "@/lib/pricing"
import { SOCIAL_IDS, type SocialId } from "@/lib/social"
import {
  EXPERIENCIA,
  VERTICALES,
  esId,
  idsValidos,
  type Experiencia,
  type Vertical,
} from "@/lib/taxonomia"

/**
 * Formación: las clases que sube el admin de la plataforma y las ve el clipero
 * (§6 de `docs/campanas-ciclo-2026-09.md`).
 *
 * Aquí solo hay dominio puro: el catálogo de clases y rutas, cómo se recomienda
 * una clase por lo que el clipero clipea y por lo que ya ha editado, y cómo se
 * lleva la cuenta de lo visto. Nada de React, nada de reloj propio: el instante
 * lo pone quien llama (`HOY_CAMPANAS` al pintar, `Date.now()` solo en un
 * manejador), igual que en `lib/campanas.ts` y `lib/participacion.ts`.
 *
 * Los títulos y las descripciones de las clases **de fábrica** sí se traducen:
 * las escribe el equipo de Clipealo, así que son producto y no contenido de
 * nadie. Viven en `messages/<idioma>/formacion.json` bajo `clases.<id>` y
 * `rutas.<id>`; los literales de este archivo son el español de referencia, lo
 * que arranca el formulario del backoffice y el respaldo si falta una clave.
 * En cuanto el admin reescribe un título, manda el suyo en los tres idiomas:
 * eso ya es contenido suyo (`textoDeClase`).
 */

/* ---------------------------------------------------------------------------
   Catálogo
   --------------------------------------------------------------------------- */

/** Etiquetas en `formacion.niveles.<id>`. */
export const NIVELES = ["inicio", "medio", "avanzado"] as const
export type Nivel = (typeof NIVELES)[number]

/**
 * En qué punto está una clase. Solo `publicada` existe para el alumno: un
 * borrador todavía no se enseña y una despublicada se retiró, pero ninguna de
 * las dos se borra, porque el id es lo que enlazan las rutas y el progreso.
 * Etiquetas en `admin.formacion.estados.<id>`.
 */
export const ESTADOS_CLASE = ["borrador", "publicada", "despublicada"] as const
export type EstadoClase = (typeof ESTADOS_CLASE)[number]

export interface Leccion {
  id: string
  /** Contenido de demo: en español, no se traduce. */
  titulo: string
  descripcion: string
  duracionSeg: number
  nivel: Nivel
  /** Para recomendarla por lo que clipea el usuario. */
  temas: readonly Vertical[]
  /** Solo si la clase habla de una red concreta. */
  redes?: readonly SocialId[]
  /**
   * La demo no tiene archivos: sin `url` el reproductor mantiene el encuadre y
   * pinta el título, que es exactamente lo que hará mientras el admin no suba
   * el video. Cuando exista la API, los dos campos llegan llenos.
   */
  video: { url?: string; portada?: string }
  /**
   * Plan mínimo para verla entera. Con `free` la ve todo el mundo; las demás
   * salen igual en el catálogo, con candado y con lo que se puede ver sin pagar
   * —portada, título, duración y de qué va—, porque el catálogo es la superficie
   * de venta y esconderlas no vende nada (decisión del director, 17 sep 2026).
   */
  planMinimo: PricingPlanId
  /** Despublicar no borra: el id sigue vivo, y el avance del alumno también. */
  estado: EstadoClase
  /** Cuándo se publicó por primera vez. En un borrador, cuándo se creó. */
  publicadaEn: string
  /** La última vez que el admin la tocó. Vacío en las semillas. */
  editadaEn?: string
  autor: "clipealo"
}

export interface Ruta {
  id: string
  /** Contenido de demo: en español, no se traduce. */
  titulo: string
  descripcion: string
  /** Ids de `LECCIONES`, en el orden en que se ven. */
  lecciones: readonly string[]
  /**
   * A quién se le propone primero. El onboarding NO pregunta la experiencia
   * —es una micropregunta, y se hace al enviar un clip—, así que hasta que la
   * conteste manda lo medido: quien ya ha enviado clips va a la ruta de
   * «regular» y quien no, a la de «nunca» (`rutaRecomendada`).
   */
  para: readonly Experiencia[]
}

/** El catálogo que hoy tendría publicado el admin. Determinista a propósito. */
export const LECCIONES: readonly Leccion[] = [
  {
    id: "lec_que_funciona",
    titulo: "Qué hace que un clip funcione",
    descripcion:
      "Los tres ingredientes que repiten los clips que se ven enteros: una idea, un conflicto y un final que no se explica.",
    duracionSeg: 125,
    nivel: "inicio",
    temas: ["podcast", "directos-irl", "gaming", "humor"],
    video: {},
    planMinimo: "free",
    estado: "publicada",
    publicadaEn: "2026-07-02T09:00:00.000Z",
    autor: "clipealo",
  },
  {
    id: "lec_primer_corte",
    titulo: "Tu primer corte, paso a paso",
    descripcion:
      "Subes un video largo, Clipealo propone los momentos y tú decides: dónde empieza, dónde acaba y por qué.",
    duracionSeg: 210,
    nivel: "inicio",
    temas: ["podcast", "directos-irl", "educacion", "negocios"],
    video: {},
    planMinimo: "free",
    estado: "publicada",
    publicadaEn: "2026-07-09T09:00:00.000Z",
    autor: "clipealo",
  },
  {
    id: "lec_subtitulos",
    titulo: "Subtítulos que se leen sin sonido",
    descripcion:
      "Tamaño, ritmo y dónde colocarlos para que el clip funcione con el móvil en silencio, que es como se ve casi todo.",
    duracionSeg: 180,
    nivel: "inicio",
    temas: ["podcast", "educacion", "humor", "salud-fitness"],
    redes: ["tiktok", "instagram"],
    video: {},
    planMinimo: "free",
    estado: "publicada",
    publicadaEn: "2026-07-16T09:00:00.000Z",
    autor: "clipealo",
  },
  {
    id: "lec_vertical",
    titulo: "Vertical sin cortar cabezas",
    descripcion:
      "Cómo reencuadrar un 16:9 a 9:16 cuando hay dos personas en pantalla, un chat al lado o un marcador que no se puede perder.",
    duracionSeg: 240,
    nivel: "inicio",
    temas: ["gaming", "deportes", "directos-irl", "musica"],
    redes: ["tiktok", "instagram", "youtube"],
    video: {},
    planMinimo: "free",
    estado: "publicada",
    publicadaEn: "2026-07-23T09:00:00.000Z",
    autor: "clipealo",
  },
  {
    id: "lec_gancho",
    titulo: "El gancho: los tres primeros segundos",
    descripcion:
      "Cuatro formas de abrir un clip y cómo elegir la que encaja con el momento que has cortado, sin prometer lo que no hay.",
    duracionSeg: 300,
    nivel: "medio",
    temas: ["podcast", "humor", "negocios", "finanzas", "tecnologia"],
    video: {},
    planMinimo: "creator",
    estado: "publicada",
    publicadaEn: "2026-08-06T09:00:00.000Z",
    autor: "clipealo",
  },
  {
    id: "lec_publicar",
    titulo: "Publicar en TikTok, Reels y Shorts",
    descripcion:
      "El mismo corte, tres salidas: qué cambia en cada red y qué no merece la pena rehacer.",
    duracionSeg: 330,
    nivel: "medio",
    temas: ["gaming", "musica", "estilo", "comida"],
    redes: ["tiktok", "instagram", "youtube"],
    video: {},
    planMinimo: "creator",
    estado: "publicada",
    publicadaEn: "2026-08-13T09:00:00.000Z",
    autor: "clipealo",
  },
  {
    id: "lec_campanas",
    titulo: "Entra en una campaña sin que te rechacen el clip",
    descripcion:
      "Qué mira una agencia al revisar: requisitos, marca visible, duración y el plazo que aceptaste al entrar.",
    duracionSeg: 285,
    nivel: "medio",
    temas: ["gaming", "deportes", "negocios", "actualidad"],
    video: {},
    planMinimo: "free",
    estado: "publicada",
    publicadaEn: "2026-08-27T09:00:00.000Z",
    autor: "clipealo",
  },
  {
    id: "lec_analiticas",
    titulo: "Lee tus analíticas y repite lo que funcionó",
    descripcion:
      "Retención, vistas y guardados: qué mirar de verdad para decidir el siguiente corte en lugar de adivinar.",
    duracionSeg: 420,
    nivel: "avanzado",
    temas: ["negocios", "finanzas", "tecnologia", "educacion"],
    video: {},
    planMinimo: "creator",
    estado: "publicada",
    publicadaEn: "2026-09-03T09:00:00.000Z",
    autor: "clipealo",
  },
]

/** Las rutas publicadas, en el orden en que se enseñan. */
export const RUTAS: readonly Ruta[] = [
  {
    id: "ruta_primera_semana",
    titulo: "Tu primera semana",
    descripcion:
      "De no haber editado nunca a tener tu primer clip publicado, en cinco clases seguidas.",
    lecciones: [
      "lec_que_funciona",
      "lec_primer_corte",
      "lec_subtitulos",
      "lec_vertical",
      "lec_campanas",
    ],
    para: ["nunca", "diversion"],
  },
  {
    id: "ruta_mas_vistas",
    titulo: "Sube tus vistas",
    descripcion:
      "Ya publicas: ahora el gancho, la salida a cada red y los números que dicen qué repetir.",
    lecciones: ["lec_gancho", "lec_publicar", "lec_campanas", "lec_analiticas"],
    para: ["regular", "clientes"],
  },
]

/** Qué nivel le toca a cada respuesta de «¿cuánto has editado antes?». */
export const NIVEL_POR_EXPERIENCIA: Record<Experiencia, readonly Nivel[]> = {
  nunca: ["inicio"],
  diversion: ["inicio", "medio"],
  regular: ["medio", "avanzado"],
  clientes: ["medio", "avanzado"],
}

/* ---------------------------------------------------------------------------
   El catálogo como dato: semillas + lo que el admin haya cambiado
   --------------------------------------------------------------------------- */

export interface Catalogo {
  lecciones: readonly Leccion[]
  rutas: readonly Ruta[]
}

/** Lo que hay publicado de fábrica. Es la base sobre la que se aplica todo parche. */
export const CATALOGO_SEMILLA: Catalogo = { lecciones: LECCIONES, rutas: RUTAS }

/** Sube cuando cambia la forma de lo que guarda el admin. */
export const CATALOGO_VERSION = 1

/**
 * Lo que el admin ha tocado. Nunca la clase entera: altas nuevas y parches.
 * Copiar la lección al editarla la congelaría, y una descripción mejor o una
 * portada nueva en la semilla no llegaría jamás a quien la editó una vez.
 */
export interface CatalogoGuardado {
  version: number
  creadas: Leccion[]
  cambios: Record<string, Partial<Leccion>>
  rutasCreadas: Ruta[]
  cambiosRuta: Record<string, Partial<Ruta>>
}

export const CATALOGO_VACIO: CatalogoGuardado = {
  version: CATALOGO_VERSION,
  creadas: [],
  cambios: {},
  rutasCreadas: [],
  cambiosRuta: {},
}

/** Las semillas con lo del admin encima. El cliente manda, como en las disputas. */
export function aplicarCatalogo(
  guardado: CatalogoGuardado,
  base: Catalogo = CATALOGO_SEMILLA
): Catalogo {
  const lecciones = [...base.lecciones, ...guardado.creadas].map((l) =>
    guardado.cambios[l.id] ? { ...l, ...guardado.cambios[l.id] } : l
  )
  const rutas = [...base.rutas, ...guardado.rutasCreadas].map((r) =>
    guardado.cambiosRuta[r.id] ? { ...r, ...guardado.cambiosRuta[r.id] } : r
  )
  return { lecciones, rutas }
}

/** Los campos que el admin puede cambiar de una clase. */
const CAMPOS_CLASE = [
  "titulo",
  "descripcion",
  "duracionSeg",
  "nivel",
  "temas",
  "redes",
  "video",
  "planMinimo",
  "estado",
  "publicadaEn",
  "editadaEn",
] as const

const igual = (a: unknown, b: unknown) =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

/** Solo lo que cambia respecto a la base: guardar la clase entera la congelaría. */
export function parcheLeccion(base: Leccion, siguiente: Leccion): Partial<Leccion> {
  const p: Record<string, unknown> = {}
  for (const c of CAMPOS_CLASE) if (!igual(base[c], siguiente[c])) p[c] = siguiente[c]
  return p as Partial<Leccion>
}

/** Los campos que el admin puede cambiar de una ruta. */
const CAMPOS_RUTA = ["titulo", "descripcion", "lecciones", "para"] as const

/** Igual que en las clases: solo lo que cambia respecto a la semilla. */
export function parcheRuta(base: Ruta, siguiente: Ruta): Partial<Ruta> {
  const p: Record<string, unknown> = {}
  for (const c of CAMPOS_RUTA) if (!igual(base[c], siguiente[c])) p[c] = siguiente[c]
  return p as Partial<Ruta>
}

/* ---------------------------------------------------------------------------
   Lecturas. Todas aceptan un catálogo; sin él, las semillas
   --------------------------------------------------------------------------- */

/** La clase con ese id, publicada o no: la usan el progreso y el panel del admin. */
export const leccionPorId = (
  id: string,
  catalogo: Catalogo = CATALOGO_SEMILLA
): Leccion | undefined => catalogo.lecciones.find((l) => l.id === id)

/** La ruta con ese id, o `undefined`. */
export const rutaPorId = (
  id: string,
  catalogo: Catalogo = CATALOGO_SEMILLA
): Ruta | undefined => catalogo.rutas.find((r) => r.id === id)

/**
 * Lo único que ve el alumno. Un borrador todavía no existe para él y una
 * despublicada dejó de existir, pero las dos conservan su id y su avance.
 */
export const publicadas = (catalogo: Catalogo = CATALOGO_SEMILLA): Leccion[] =>
  catalogo.lecciones.filter((l) => l.estado === "publicada")

/** Las clases de la ruta, en orden y sin las que no estén publicadas. */
export function leccionesDe(
  ruta: Ruta,
  catalogo: Catalogo = CATALOGO_SEMILLA
): Leccion[] {
  const vivas = publicadas(catalogo)
  return ruta.lecciones
    .map((id) => vivas.find((l) => l.id === id))
    .filter((l): l is Leccion => l !== undefined)
}

/** Lo que dura la ruta entera, en segundos. */
export function duracionRuta(ruta: Ruta, catalogo?: Catalogo): number {
  return leccionesDe(ruta, catalogo).reduce((total, l) => total + l.duracionSeg, 0)
}

/* ---------------------------------------------------------------------------
   El plan: qué se ve entero y qué se ve con candado
   --------------------------------------------------------------------------- */

/**
 * `true` si ese plan la puede ver entera. Sin plan —en el servidor, en los
 * tests— no hay muro: el muro es cosa de la interfaz, no del dominio.
 *
 * Una clase de pago pide dos cosas: que el plan desbloquee las clases de pago
 * (la fila «Formación» de la comparativa) y que llegue al escalón de la clase.
 * Para los tres planes de la web es lo mismo; para uno creado «como Creador
 * pero sin Formación» es lo que hace que la puerta diga la verdad.
 */
export const alAlcance = (leccion: Leccion, plan?: PlanRef): boolean =>
  plan === undefined ||
  leccion.planMinimo === "free" ||
  (planPermite(plan, "clasesDePago") && alMenos(plan, leccion.planMinimo))

/**
 * El plan que hace falta para la ruta entera: el más alto de sus clases
 * publicadas. No se guarda en `Ruta` a propósito —una ruta es un orden de
 * clases, no algo que se venda aparte— y un campo propio se desincronizaría al
 * primer cambio de plan de una clase.
 */
export function planMinimoRuta(
  ruta: Ruta,
  catalogo: Catalogo = CATALOGO_SEMILLA
): PricingPlanId {
  return leccionesDe(ruta, catalogo).reduce<PricingPlanId>(
    (alto, l) => (alMenos(l.planMinimo, alto) ? l.planMinimo : alto),
    "free"
  )
}

/* ---------------------------------------------------------------------------
   Progreso (lo que guarda el navegador)
   --------------------------------------------------------------------------- */

/** Sube cuando cambia la forma de lo guardado, para que `migrarProgreso` lo sepa. */
export const FORMACION_VERSION = 1

/** Desde qué parte vista una clase cuenta como terminada: los créditos no hacen falta. */
export const UMBRAL_COMPLETADA = 0.9

export interface VistaLeccion {
  /** El punto más lejano al que llegó, en segundos. */
  segundoVisto: number
  completada: boolean
  /** ISO de la última vez que la abrió o avanzó. */
  vistaEn?: string
}

export interface ProgresoFormacion {
  version: number
  /** Por id de clase. Solo las empezadas. */
  vistas: Record<string, VistaLeccion>
  /**
   * Rutas que la persona ha apartado con «ya me lo sé». No es lo mismo que
   * terminarlas: se esconde la tarjeta de arriba y las clases siguen en su
   * sitio, por si un día hacen falta. Se puede deshacer.
   */
  ocultas?: readonly string[]
}

const VISTA_VACIA: VistaLeccion = { segundoVisto: 0, completada: false }

export const PROGRESO_VACIO: ProgresoFormacion = {
  version: FORMACION_VERSION,
  vistas: {},
  ocultas: [],
}

/** ¿La apartó? Sin lista guardada, no. */
export const rutaOculta = (p: ProgresoFormacion, rutaId: string) =>
  (p.ocultas ?? []).includes(rutaId)

/** Aparta una ruta o la devuelve. Mismo camino en los dos sentidos. */
export function ocultarRuta(
  p: ProgresoFormacion,
  rutaId: string,
  oculta: boolean
): ProgresoFormacion {
  const actuales = p.ocultas ?? []
  if (oculta === actuales.includes(rutaId)) return p
  return {
    ...p,
    ocultas: oculta ? [...actuales, rutaId] : actuales.filter((id) => id !== rutaId),
  }
}

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max)

/** Lo visto de una clase; nunca `undefined`, para no repetir el caso vacío. */
export function vistaDe(progreso: ProgresoFormacion, id: string): VistaLeccion {
  return progreso.vistas[id] ?? VISTA_VACIA
}

/** `true` si la abrió alguna vez. */
export const empezada = (progreso: ProgresoFormacion, id: string): boolean => {
  const v = vistaDe(progreso, id)
  return v.completada || v.segundoVisto > 0
}

/** Cuánto lleva vista, de 0 a 100. Una clase terminada es 100 aunque saltara el final. */
export function pctLeccion(leccion: Leccion, progreso: ProgresoFormacion): number {
  const v = vistaDe(progreso, leccion.id)
  if (v.completada) return 100
  if (leccion.duracionSeg <= 0) return 0
  return clamp(Math.round((v.segundoVisto / leccion.duracionSeg) * 100), 0, 100)
}

/**
 * Avanza el punto visto. Nunca retrocede: volver atrás para repasar no borra lo
 * que ya vio. Al pasar de `UMBRAL_COMPLETADA` la clase queda terminada.
 */
export function verSegundo(
  progreso: ProgresoFormacion,
  leccion: Leccion,
  segundo: number,
  ahora: string
): ProgresoFormacion {
  const v = vistaDe(progreso, leccion.id)
  const segundoVisto = clamp(
    Math.max(v.segundoVisto, Math.floor(segundo)),
    0,
    leccion.duracionSeg
  )
  const completada =
    v.completada ||
    (leccion.duracionSeg > 0 && segundoVisto >= leccion.duracionSeg * UMBRAL_COMPLETADA)
  if (segundoVisto === v.segundoVisto && completada === v.completada) return progreso
  return {
    ...progreso,
    vistas: {
      ...progreso.vistas,
      [leccion.id]: { segundoVisto, completada, vistaEn: ahora },
    },
  }
}

/** «La he visto»: la da por terminada sin exigir que corra el video. */
export function completar(
  progreso: ProgresoFormacion,
  leccion: Leccion,
  ahora: string
): ProgresoFormacion {
  const v = vistaDe(progreso, leccion.id)
  if (v.completada) return progreso
  return {
    ...progreso,
    vistas: {
      ...progreso.vistas,
      [leccion.id]: {
        segundoVisto: leccion.duracionSeg,
        completada: true,
        vistaEn: ahora,
      },
    },
  }
}

/** Deshace lo visto de una clase: vuelve al principio. */
export function reiniciar(
  progreso: ProgresoFormacion,
  leccion: Leccion
): ProgresoFormacion {
  if (!(leccion.id in progreso.vistas)) return progreso
  const vistas = { ...progreso.vistas }
  delete vistas[leccion.id]
  return { ...progreso, vistas }
}

export interface ProgresoRuta {
  total: number
  completadas: number
  /** Por clases terminadas, no por segundos: es lo que se enseña («3 de 5»). */
  pct: number
  /** Lo que queda por ver, en segundos. */
  restanteSeg: number
  duracionSeg: number
  terminada: boolean
  /** De las que faltan, cuántas piden un plan superior. 0 si no hay muro. */
  bloqueadas: number
}

/** Opciones de lectura: con qué catálogo y con qué plan se está mirando. */
export interface VistaCatalogo {
  catalogo?: Catalogo
  plan?: PlanRef
}

/**
 * El avance de una ruta entera.
 *
 * Las bloqueadas CUENTAN en el total: si no, una ruta con dos clases de pago
 * diría «3 de 3» faltando dos. Y lo ya completado sigue contando aunque la clase
 * pase a ser de pago: el muro impide volver a verla, no borra un logro.
 */
export function progresoRuta(
  ruta: Ruta,
  progreso: ProgresoFormacion,
  { catalogo, plan }: VistaCatalogo = {}
): ProgresoRuta {
  const lecciones = leccionesDe(ruta, catalogo)
  const hechas = lecciones.filter((l) => vistaDe(progreso, l.id).completada)
  const faltan = lecciones.filter((l) => !vistaDe(progreso, l.id).completada)
  const total = lecciones.length
  return {
    total,
    completadas: hechas.length,
    pct: total === 0 ? 0 : Math.round((hechas.length / total) * 100),
    restanteSeg: faltan.reduce((s, l) => s + l.duracionSeg, 0),
    duracionSeg: lecciones.reduce((s, l) => s + l.duracionSeg, 0),
    terminada: total > 0 && hechas.length === total,
    bloqueadas: faltan.filter((l) => !alAlcance(l, plan)).length,
  }
}

/**
 * Por dónde sigue la ruta: la primera clase sin terminar **a su alcance**,
 * empezada o no. `null` cuando ya están todas vistas o lo que queda pide plan.
 */
export function siguienteLeccion(
  ruta: Ruta,
  progreso: ProgresoFormacion,
  { catalogo, plan }: VistaCatalogo = {}
): Leccion | null {
  return (
    leccionesDe(ruta, catalogo).find(
      (l) => !vistaDe(progreso, l.id).completada && alAlcance(l, plan)
    ) ?? null
  )
}

/**
 * La primera que le falta y pide plan: el momento en que /precios se gana el
 * clic, porque es la única vez que se puede decir exactamente qué se desbloquea.
 */
/**
 * El plan MÁS BAJO que abre algo de lo que falta.
 *
 * No es el plan de la ruta (`planMinimoRuta`, que es el más alto de todas sus
 * clases): a quien le faltan dos clases de Creador en una ruta que además tiene
 * una de Empresa, decirle «2 clases piden el plan Empresa» le está pidiendo de
 * más. `null` si no falta nada por plan.
 */
export function planQueDesbloquea(
  ruta: Ruta,
  progreso: ProgresoFormacion,
  { catalogo, plan }: VistaCatalogo = {}
): PricingPlanId | null {
  const pendientes = leccionesDe(ruta, catalogo).filter(
    (l) => !vistaDe(progreso, l.id).completada && !alAlcance(l, plan)
  )
  if (pendientes.length === 0) return null
  return pendientes.reduce<PricingPlanId>(
    (menor, l) => (alMenos(menor, l.planMinimo) ? l.planMinimo : menor),
    "business"
  )
}

export function siguienteBloqueada(
  ruta: Ruta,
  progreso: ProgresoFormacion,
  { catalogo, plan }: VistaCatalogo = {}
): Leccion | null {
  return (
    leccionesDe(ruta, catalogo).find(
      (l) => !vistaDe(progreso, l.id).completada && !alAlcance(l, plan)
    ) ?? null
  )
}

/* ---------------------------------------------------------------------------
   Recomendación
   --------------------------------------------------------------------------- */

/**
 * Lo que se sabe del clipero y sirve para recomendar. Sale de su cuenta
 * (`useCuenta().cuenta.clipero`), pero el dominio no depende de ella: así se
 * puede probar y reutilizar desde el admin.
 */
export interface PerfilFormacion {
  temas?: readonly Vertical[]
  experiencia?: Experiencia
  redes?: readonly SocialId[]
}

/** Por qué se le propone una clase. Etiquetas en `formacion.razones.<id>`. */
export const RAZONES = ["tema", "red", "nivel"] as const
export type Razon = (typeof RAZONES)[number]

const PUNTOS = {
  tema: 3,
  red: 1,
  nivel: 2,
  completada: -20,
  empezada: 1,
  /* A igualdad de interés, primero lo que puede ver hoy. Baja, no desaparece:
     esconder lo de pago es justo lo que el director descartó. */
  bloqueada: -4,
} as const
const TOPE_TEMAS = 2
const TOPE_REDES = 2

const comunes = <T>(a: readonly T[] | undefined, b: readonly T[] | undefined): number => {
  if (!a?.length || !b?.length) return 0
  return a.filter((x) => b.includes(x)).length
}

/** Cuántos puntos suma una clase para este perfil. Sin el perfil, cero: manda la fecha. */
function puntuar(
  leccion: Leccion,
  perfil: PerfilFormacion,
  progreso: ProgresoFormacion,
  plan?: PlanRef
): number {
  const v = vistaDe(progreso, leccion.id)
  let puntos = 0
  puntos += Math.min(comunes(perfil.temas, leccion.temas), TOPE_TEMAS) * PUNTOS.tema
  puntos += Math.min(comunes(perfil.redes, leccion.redes), TOPE_REDES) * PUNTOS.red
  if (
    perfil.experiencia &&
    NIVEL_POR_EXPERIENCIA[perfil.experiencia].includes(leccion.nivel)
  )
    puntos += PUNTOS.nivel
  // Lo empezado y sin terminar sube: es la deuda más cercana
  if (v.completada) puntos += PUNTOS.completada
  else if (v.segundoVisto > 0) puntos += PUNTOS.empezada
  if (!alAlcance(leccion, plan)) puntos += PUNTOS.bloqueada
  return puntos
}

/**
 * El catálogo ordenado para este clipero: primero lo que encaja con sus temas,
 * su nivel y sus redes; lo ya visto se va al final. A igualdad de puntos manda
 * la más reciente, y a igualdad de fecha el id: el orden no baila entre el
 * servidor y el cliente.
 */
export function recomendadas(
  perfil: PerfilFormacion,
  opciones: {
    progreso?: ProgresoFormacion
    limite?: number
    catalogo?: Catalogo
    plan?: PlanRef
  } = {}
): Leccion[] {
  const progreso = opciones.progreso ?? PROGRESO_VACIO
  // Solo lo publicado: un borrador del admin no puede colarse en la rejilla
  const orden = publicadas(opciones.catalogo)
    .map((leccion) => ({
      leccion,
      puntos: puntuar(leccion, perfil, progreso, opciones.plan),
    }))
    .sort(
      (a, b) =>
        b.puntos - a.puntos ||
        Date.parse(b.leccion.publicadaEn) - Date.parse(a.leccion.publicadaEn) ||
        a.leccion.id.localeCompare(b.leccion.id)
    )
    .map((x) => x.leccion)
  return opciones.limite === undefined ? orden : orden.slice(0, opciones.limite)
}

/**
 * Por qué se le propone, para escribirlo en la tarjeta. `null` cuando no hay
 * motivo que enseñar: entonces la tarjeta no promete nada.
 */
export function razonRecomendacion(
  leccion: Leccion,
  perfil: PerfilFormacion
): Razon | null {
  if (comunes(perfil.temas, leccion.temas) > 0) return "tema"
  if (comunes(perfil.redes, leccion.redes) > 0) return "red"
  if (
    perfil.experiencia &&
    NIVEL_POR_EXPERIENCIA[perfil.experiencia].includes(leccion.nivel)
  )
    return "nivel"
  return null
}

/**
 * La ruta que se enseña arriba: la que tenga empezada (y sin terminar) manda
 * sobre la que le tocaría por experiencia, porque volver es más útil que
 * empezar otra. Siempre devuelve una: el catálogo nunca está vacío.
 *
 * Sin experiencia contestada manda lo medido (`senales.yaPublica`): la
 * experiencia es una micropregunta que se hace al enviar un clip, así que
 * recién salido del onboarding nadie la tiene, y la ruta salía siendo la
 * primera del catálogo para todo el mundo —«Tu primera semana» a quien lleva
 * cien clips publicados—. Quien ya publica empieza por la suya. Es la regla 5
 * de las micropreguntas: lo que se puede medir no se pregunta.
 */
export function rutaRecomendada(
  perfil: PerfilFormacion,
  progreso: ProgresoFormacion = PROGRESO_VACIO,
  catalogo: Catalogo = CATALOGO_SEMILLA,
  senales: { yaPublica?: boolean } = {}
): Ruta | null {
  // Solo las que tienen algo publicado: si el admin despublicó sus clases, la
  // ruta existe pero no lleva a ninguna parte
  const rutas = catalogo.rutas.filter((r) => leccionesDe(r, catalogo).length > 0)
  const empezadaSinTerminar = rutas.find((r) => {
    const p = progresoRuta(r, progreso, { catalogo })
    return p.completadas > 0 && !p.terminada
  })
  if (empezadaSinTerminar) return empezadaSinTerminar
  const experiencia = perfil.experiencia ?? (senales.yaPublica ? "regular" : "nunca")
  return rutas.find((r) => r.para.includes(experiencia)) ?? rutas[0] ?? null
}

/* ---------------------------------------------------------------------------
   Migración de lo guardado
   --------------------------------------------------------------------------- */

/** Tope de cordura de lo visto: doce horas. Ninguna clase dura eso. */
const TOPE_SEGUNDOS_VISTOS = 12 * 60 * 60

/**
 * Limpia lo que venga del navegador: segundos fuera de rango o basura de otra
 * versión. Devuelve siempre algo usable.
 */
export function migrarProgreso(guardado: unknown): ProgresoFormacion {
  if (!guardado || typeof guardado !== "object") return PROGRESO_VACIO
  // Lo que se apartó sobrevive aunque el resto del progreso esté roto: es una
  // decisión de la persona, no un avance que se pueda recalcular
  const guardadas = (guardado as { ocultas?: unknown }).ocultas
  const ocultas = Array.isArray(guardadas)
    ? guardadas.filter((id): id is string => typeof id === "string")
    : []
  const crudo = (guardado as { vistas?: unknown }).vistas
  if (!crudo || typeof crudo !== "object") return { ...PROGRESO_VACIO, ocultas }
  const vistas: Record<string, VistaLeccion> = {}
  for (const [id, valor] of Object.entries(crudo as Record<string, unknown>)) {
    if (!valor || typeof valor !== "object") continue
    const v = valor as Partial<VistaLeccion>
    /**
     * Un id que no está en las semillas ya NO se tira: el admin puede
     * despublicar una clase una semana y volver a publicarla, y el avance tiene
     * que volver intacto. Lo huérfano se queda en reserva con un tope de
     * cordura y no suma en ningún sitio, porque todo lo que se cuenta recorre el
     * catálogo (`publicadas`, `leccionesDe`) y nunca este mapa.
     *
     * Tampoco se recorta por la duración de la clase: si el admin la acorta y
     * luego la vuelve a alargar, recortar aquí perdería el avance real para
     * siempre, y `pctLeccion` y `verSegundo` ya lo encierran al pintarlo.
     */
    const segundoVisto =
      typeof v.segundoVisto === "number" && Number.isFinite(v.segundoVisto)
        ? clamp(Math.floor(v.segundoVisto), 0, TOPE_SEGUNDOS_VISTOS)
        : 0
    const completada = v.completada === true
    if (!completada && segundoVisto === 0) continue
    vistas[id] = {
      segundoVisto,
      completada,
      ...(typeof v.vistaEn === "string" ? { vistaEn: v.vistaEn } : {}),
    }
  }
  return { version: FORMACION_VERSION, vistas, ocultas }
}

/* ---------------------------------------------------------------------------
   Puentes con el resto del producto
   --------------------------------------------------------------------------- */

/**
 * Traduce lo que respondió el clipero en el onboarding al perfil que entiende la
 * recomendación. Acepta lo que hay guardado tal cual (parcial y con `aun-no-se`).
 */
export function perfilDesdeClipero(clipero: {
  verticales?: unknown
  experiencia?: unknown
  redes?: unknown
}): PerfilFormacion {
  const experiencia = clipero.experiencia
  return {
    temas: idsValidos(VERTICALES, clipero.verticales),
    redes: idsValidos(SOCIAL_IDS, clipero.redes),
    ...(esId(EXPERIENCIA, experiencia) ? { experiencia } : {}),
  }
}

/** Minutos de catálogo publicados, para el resumen de la página. */
export const minutosPublicados = (catalogo?: Catalogo): number =>
  Math.round(publicadas(catalogo).reduce((s, l) => s + l.duracionSeg, 0) / 60)

/* ---------------------------------------------------------------------------
   Lo que el admin edita: borrador, validación por códigos y resumen del panel
   --------------------------------------------------------------------------- */

export const LIMITES_CLASE = {
  tituloMin: 6,
  descripcionMin: 20,
  duracionMin: 30,
  duracionMax: 3600,
  temasMax: 6,
} as const

/** Lo que el formulario tiene en la mano. Sin `id` = alta nueva. */
export interface BorradorClase {
  id?: string
  titulo: string
  descripcion: string
  duracionSeg: number
  nivel: Nivel
  temas: Vertical[]
  redes: SocialId[]
  videoUrl: string
  portadaUrl: string
  planMinimo: PricingPlanId
  estado: EstadoClase
}

export const CLASE_NUEVA: BorradorClase = {
  titulo: "",
  descripcion: "",
  duracionSeg: 180,
  nivel: "inicio",
  temas: [],
  redes: [],
  videoUrl: "",
  portadaUrl: "",
  planMinimo: "free",
  estado: "borrador",
}

/** Qué falla. El texto vive en `admin.formacion.form.errors.<code>`. */
export type CodigoAvisoClase =
  | "tituloCorto"
  | "descripcionCorta"
  | "duracionRango"
  | "temasRequeridos"
  | "temasDemasiados"
  | "videoUrl"
  | "portadaUrl"
  | "publicadaSinVideo"

export interface AvisoClase {
  code: CodigoAvisoClase
  /** `false`: se guarda igual y el motivo se escribe al lado. */
  bloquea: boolean
  values?: { min: number; max: number }
}

export type AvisosClase = Partial<Record<keyof BorradorClase, AvisoClase>>

const ENLACE_CLASE = /^https?:\/\/\S+\.\S+/

/**
 * Lo que impide (o desaconseja) guardar. Códigos, nunca frases: las frases son
 * del componente, como en `validarBorrador` de campañas.
 *
 * Publicar sin video NO bloquea: las ocho semillas están así y el catálogo
 * funciona —se ve de qué va la clase—, así que es un aviso, y el panel lo cuenta
 * como trabajo pendiente en vez de impedir el trabajo.
 */
export function validarClase(b: BorradorClase): AvisosClase {
  const a: AvisosClase = {}
  const L = LIMITES_CLASE
  if (b.titulo.trim().length < L.tituloMin)
    a.titulo = {
      code: "tituloCorto",
      bloquea: true,
      values: { min: L.tituloMin, max: 0 },
    }
  if (b.descripcion.trim().length < L.descripcionMin)
    a.descripcion = {
      code: "descripcionCorta",
      bloquea: true,
      values: { min: L.descripcionMin, max: 0 },
    }
  if (
    !Number.isFinite(b.duracionSeg) ||
    b.duracionSeg < L.duracionMin ||
    b.duracionSeg > L.duracionMax
  )
    a.duracionSeg = {
      code: "duracionRango",
      bloquea: true,
      values: { min: L.duracionMin, max: L.duracionMax },
    }
  if (b.temas.length === 0) a.temas = { code: "temasRequeridos", bloquea: true }
  else if (b.temas.length > L.temasMax)
    a.temas = {
      code: "temasDemasiados",
      bloquea: true,
      values: { min: 0, max: L.temasMax },
    }
  if (b.videoUrl.trim() && !ENLACE_CLASE.test(b.videoUrl.trim()))
    a.videoUrl = { code: "videoUrl", bloquea: true }
  else if (b.estado === "publicada" && !b.videoUrl.trim())
    a.videoUrl = { code: "publicadaSinVideo", bloquea: false }
  if (b.portadaUrl.trim() && !ENLACE_CLASE.test(b.portadaUrl.trim()))
    a.portadaUrl = { code: "portadaUrl", bloquea: true }
  return a
}

export const hayBloqueoClase = (a: AvisosClase) =>
  Object.values(a).some((x) => x?.bloquea === true)

/** El borrador de una clase que ya existe, para poder editarla. */
export function borradorDeClase(l: Leccion): BorradorClase {
  return {
    id: l.id,
    titulo: l.titulo,
    descripcion: l.descripcion,
    duracionSeg: l.duracionSeg,
    nivel: l.nivel,
    temas: [...l.temas],
    redes: [...(l.redes ?? [])],
    videoUrl: l.video.url ?? "",
    portadaUrl: l.video.portada ?? "",
    planMinimo: l.planMinimo,
    estado: l.estado,
  }
}

/**
 * La clase que se va a guardar. `publicadaEn` se fija la primera vez que se
 * publica y no se vuelve a tocar: es la fecha que el alumno ve, y moverla cada
 * vez que se corrige una errata mentiría sobre cuándo salió.
 */
export function claseDeBorrador(
  b: BorradorClase,
  base: Leccion | null,
  ahora: string,
  id: string
): Leccion {
  const seEstrena = b.estado === "publicada" && base?.estado !== "publicada"
  return {
    id,
    titulo: b.titulo.trim(),
    descripcion: b.descripcion.trim(),
    duracionSeg: Math.round(b.duracionSeg),
    nivel: b.nivel,
    temas: [...b.temas],
    ...(b.redes.length > 0 ? { redes: [...b.redes] } : {}),
    video: {
      ...(b.videoUrl.trim() ? { url: b.videoUrl.trim() } : {}),
      ...(b.portadaUrl.trim() ? { portada: b.portadaUrl.trim() } : {}),
    },
    planMinimo: b.planMinimo,
    estado: b.estado,
    publicadaEn: seEstrena || !base ? ahora : base.publicadaEn,
    editadaEn: ahora,
    autor: "clipealo",
  }
}

/** Ids de clase nuevos. Como `nuevoId` de campañas: solo dentro de un manejador. */
export const nuevoIdClase = () =>
  `lec_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export interface ResumenCatalogo {
  publicadas: number
  borradores: number
  despublicadas: number
  minutos: number
  /** Publicadas sin video: se ven en el catálogo, pero no hay nada que reproducir. */
  sinVideo: number
  porPlan: Record<PricingPlanId, number>
  porNivel: Record<Nivel, number>
  rutasConClases: number
}

/**
 * Lo que el panel del admin puede decir SIN INVENTAR nada.
 *
 * No hay vistas ni terminadas a propósito: el avance de cada alumno vive en su
 * navegador y no llega al servidor, así que contarlas aquí sería inventarse una
 * cifra. El panel lo dice con todas las letras en vez de enseñar un cero.
 */
export function resumenCatalogo(catalogo: Catalogo = CATALOGO_SEMILLA): ResumenCatalogo {
  const vivas = publicadas(catalogo)
  const porPlan = { free: 0, creator: 0, business: 0 } as Record<PricingPlanId, number>
  const porNivel = { inicio: 0, medio: 0, avanzado: 0 } as Record<Nivel, number>
  for (const l of vivas) {
    porPlan[l.planMinimo] += 1
    porNivel[l.nivel] += 1
  }
  return {
    publicadas: vivas.length,
    borradores: catalogo.lecciones.filter((l) => l.estado === "borrador").length,
    despublicadas: catalogo.lecciones.filter((l) => l.estado === "despublicada").length,
    minutos: minutosPublicados(catalogo),
    sinVideo: vivas.filter((l) => !l.video.url).length,
    porPlan,
    porNivel,
    rutasConClases: catalogo.rutas.filter((r) => leccionesDe(r, catalogo).length > 0)
      .length,
  }
}

const duracionValida = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v)
    ? clamp(Math.round(v), LIMITES_CLASE.duracionMin, LIMITES_CLASE.duracionMax)
    : LIMITES_CLASE.duracionMin

function limpiarParche(p: Partial<Leccion>): Partial<Leccion> {
  const out: Partial<Leccion> = {}
  if (typeof p.titulo === "string") out.titulo = p.titulo
  if (typeof p.descripcion === "string") out.descripcion = p.descripcion
  if (p.duracionSeg !== undefined) out.duracionSeg = duracionValida(p.duracionSeg)
  if (esId(NIVELES, p.nivel)) out.nivel = p.nivel
  if (p.temas !== undefined) out.temas = idsValidos(VERTICALES, p.temas)
  if (p.redes !== undefined) out.redes = idsValidos(SOCIAL_IDS, p.redes)
  if (p.video && typeof p.video === "object") out.video = { ...p.video }
  if (esId(PLAN_IDS, p.planMinimo)) out.planMinimo = p.planMinimo
  if (esId(ESTADOS_CLASE, p.estado)) out.estado = p.estado
  if (typeof p.publicadaEn === "string") out.publicadaEn = p.publicadaEn
  if (typeof p.editadaEn === "string") out.editadaEn = p.editadaEn
  return out
}

function limpiarClase(l: Leccion): Leccion {
  return {
    id: l.id,
    titulo: typeof l.titulo === "string" ? l.titulo : "",
    descripcion: typeof l.descripcion === "string" ? l.descripcion : "",
    duracionSeg: duracionValida(l.duracionSeg),
    nivel: esId(NIVELES, l.nivel) ? l.nivel : "inicio",
    temas: idsValidos(VERTICALES, l.temas),
    ...(l.redes ? { redes: idsValidos(SOCIAL_IDS, l.redes) } : {}),
    video: l.video && typeof l.video === "object" ? { ...l.video } : {},
    planMinimo: esId(PLAN_IDS, l.planMinimo) ? l.planMinimo : "free",
    estado: esId(ESTADOS_CLASE, l.estado) ? l.estado : "borrador",
    publicadaEn: typeof l.publicadaEn === "string" ? l.publicadaEn : "",
    ...(typeof l.editadaEn === "string" ? { editadaEn: l.editadaEn } : {}),
    autor: "clipealo",
  }
}

/**
 * Limpia lo que el admin tenga guardado: estados y planes que ya no existen,
 * temas y redes fuera de taxonomía, duraciones absurdas y parches a clases que
 * no están ni en las semillas ni en las creadas. Devuelve siempre algo usable.
 */
export function migrarCatalogo(
  guardado: unknown,
  base: Catalogo = CATALOGO_SEMILLA
): CatalogoGuardado {
  if (!guardado || typeof guardado !== "object") return CATALOGO_VACIO
  const g = guardado as Partial<CatalogoGuardado>
  const creadas = (Array.isArray(g.creadas) ? g.creadas : [])
    .filter((l): l is Leccion => Boolean(l && typeof l.id === "string"))
    .map(limpiarClase)
  const ids = new Set([...base.lecciones.map((l) => l.id), ...creadas.map((l) => l.id)])
  const cambios: Record<string, Partial<Leccion>> = {}
  for (const [id, parche] of Object.entries(g.cambios ?? {})) {
    if (!ids.has(id) || !parche || typeof parche !== "object") continue
    cambios[id] = limpiarParche(parche)
  }

  const rutasCreadas = (Array.isArray(g.rutasCreadas) ? g.rutasCreadas : [])
    .filter((r): r is Ruta => Boolean(r && typeof r.id === "string"))
    .map((r) => limpiarRuta(r, ids))
  const idsRuta = new Set([
    ...base.rutas.map((r) => r.id),
    ...rutasCreadas.map((r) => r.id),
  ])
  const cambiosRuta: Record<string, Partial<Ruta>> = {}
  for (const [id, parche] of Object.entries(g.cambiosRuta ?? {})) {
    if (!idsRuta.has(id) || !parche || typeof parche !== "object") continue
    cambiosRuta[id] = limpiarParcheRuta(parche, ids)
  }

  return { version: CATALOGO_VERSION, creadas, cambios, rutasCreadas, cambiosRuta }
}

/* ---------------------------------------------------------------------------
   Las rutas, también como dato: qué clases llevan y en qué orden
   --------------------------------------------------------------------------- */

export const LIMITES_RUTA = { tituloMin: 6, descripcionMin: 20 } as const

export interface BorradorRuta {
  /** Sin `id` = ruta nueva. */
  id?: string
  titulo: string
  descripcion: string
  /** Ids de clase, en el orden en que se ven. */
  lecciones: string[]
  para: Experiencia[]
}

export const RUTA_NUEVA: BorradorRuta = {
  titulo: "",
  descripcion: "",
  lecciones: [],
  para: [],
}

export type CodigoAvisoRuta =
  "tituloCorto" | "descripcionCorta" | "sinClases" | "sinPara" | "sinPublicadas"

export interface AvisoRuta {
  code: CodigoAvisoRuta
  bloquea: boolean
  values?: { min: number; max: number }
}

export type AvisosRuta = Partial<Record<keyof BorradorRuta, AvisoRuta>>

/**
 * Lo que impide (o desaconseja) guardar una ruta. Una ruta sin clases
 * publicadas no bloquea: el admin puede montarla con borradores y publicarlos
 * después, y hasta entonces el alumno simplemente no la ve.
 */
export function validarRuta(b: BorradorRuta, catalogo?: Catalogo): AvisosRuta {
  const a: AvisosRuta = {}
  const L = LIMITES_RUTA
  if (b.titulo.trim().length < L.tituloMin)
    a.titulo = {
      code: "tituloCorto",
      bloquea: true,
      values: { min: L.tituloMin, max: 0 },
    }
  if (b.descripcion.trim().length < L.descripcionMin)
    a.descripcion = {
      code: "descripcionCorta",
      bloquea: true,
      values: { min: L.descripcionMin, max: 0 },
    }
  // Avisa, no bloquea: las clases de una ruta se ordenan en su tarjeta, no en
  // este diálogo, así que exigirlas aquí dejaba «Nueva ruta» sin salida —no
  // había dónde añadirlas y guardar no hacía nada—. Vacía tampoco hace daño:
  // `leccionesDe` solo devuelve publicadas y `rutaRecomendada` descarta las que
  // se quedan sin ninguna, así que el clipero no la ve hasta que lleve algo.
  if (b.lecciones.length === 0) a.lecciones = { code: "sinClases", bloquea: false }
  else if (b.lecciones.every((id) => leccionPorId(id, catalogo)?.estado !== "publicada"))
    a.lecciones = { code: "sinPublicadas", bloquea: false }
  if (b.para.length === 0) a.para = { code: "sinPara", bloquea: true }
  return a
}

export const hayBloqueoRuta = (a: AvisosRuta) =>
  Object.values(a).some((x) => x?.bloquea === true)

export function borradorDeRuta(r: Ruta): BorradorRuta {
  return {
    id: r.id,
    titulo: r.titulo,
    descripcion: r.descripcion,
    lecciones: [...r.lecciones],
    para: [...r.para],
  }
}

export function rutaDeBorrador(b: BorradorRuta, id: string): Ruta {
  return {
    id,
    titulo: b.titulo.trim(),
    descripcion: b.descripcion.trim(),
    lecciones: [...b.lecciones],
    para: [...b.para],
  }
}

export const nuevoIdRuta = () =>
  `ruta_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

/**
 * Mueve una clase dentro de la ruta. Devuelve la misma referencia si no hay
 * sitio adonde moverla: así quien lo llama sabe que no ha pasado nada.
 */
export function moverEnRuta(ruta: Ruta, leccionId: string, delta: -1 | 1): Ruta {
  const i = ruta.lecciones.indexOf(leccionId)
  const j = i + delta
  if (i === -1 || j < 0 || j >= ruta.lecciones.length) return ruta
  const lecciones = [...ruta.lecciones]
  ;[lecciones[i], lecciones[j]] = [lecciones[j], lecciones[i]]
  return { ...ruta, lecciones }
}

const limpiarRuta = (r: Ruta, idsClase: Set<string>): Ruta => ({
  id: r.id,
  titulo: typeof r.titulo === "string" ? r.titulo : "",
  descripcion: typeof r.descripcion === "string" ? r.descripcion : "",
  // Una ruta no puede apuntar a una clase que no existe: el alumno se quedaría
  // con un paso que no lleva a ninguna parte
  lecciones: Array.isArray(r.lecciones)
    ? r.lecciones.filter((id) => typeof id === "string" && idsClase.has(id))
    : [],
  para: idsValidos(EXPERIENCIA, r.para),
})

function limpiarParcheRuta(p: Partial<Ruta>, idsClase: Set<string>): Partial<Ruta> {
  const out: Partial<Ruta> = {}
  if (typeof p.titulo === "string") out.titulo = p.titulo
  if (typeof p.descripcion === "string") out.descripcion = p.descripcion
  if (Array.isArray(p.lecciones))
    out.lecciones = p.lecciones.filter((id) => typeof id === "string" && idsClase.has(id))
  if (p.para !== undefined) out.para = idsValidos(EXPERIENCIA, p.para)
  return out
}
