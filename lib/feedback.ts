import { AHORA_DEMO } from "@/lib/fechas"

/**
 * El casillero: lo que cliperos y agencias le escriben a Clipealo.
 *
 * Dominio puro, como el resto: funciones de (datos, instante). No hay reloj
 * propio —el instante lo pone quien llama— ni frases: los tipos y los estados
 * son ids y se traducen en `messages/<idioma>/feedback.json` y en
 * `admin.feedback`.
 *
 * Es el único sitio del producto donde el texto lo escribe la persona, así que
 * es el único que se limita por longitud y el único que nunca se traduce.
 */

/* ---------------------------------------------------------------------------
   Qué se puede decir
   --------------------------------------------------------------------------- */

/** Etiquetas en `feedback.tipos.<id>`. */
export const TIPOS_FEEDBACK = ["idea", "problema", "precio", "contenido", "otro"] as const
export type TipoFeedback = (typeof TIPOS_FEEDBACK)[number]

/**
 * Quién escribe. Sale del perfil de la cuenta, no se elige: una agencia que
 * escribe como clipero falsearía la cola.
 */
export const AUTORES_FEEDBACK = ["clipero", "agencia"] as const
export type AutorFeedback = (typeof AUTORES_FEEDBACK)[number]

/**
 * Dónde está el mensaje.
 *
 * `nuevo` → sin abrir. `leido` → el equipo lo vio y no hace falta contestar.
 * `respondido` → hay respuesta y la persona puede leerla en Ayuda.
 * `archivado` → fuera de la cola, sin borrarlo: lo que se dijo no se borra.
 */
export const ESTADOS_FEEDBACK = ["nuevo", "leido", "respondido", "archivado"] as const
export type EstadoFeedback = (typeof ESTADOS_FEEDBACK)[number]

/** Los que siguen pidiendo trabajo del equipo. */
export const ABIERTOS: readonly EstadoFeedback[] = ["nuevo", "leido"]

export interface Feedback {
  id: string
  /** Quién lo escribió; el nombre es contenido de usuario y no se traduce. */
  autor: string
  userId: string
  de: AutorFeedback
  tipo: TipoFeedback
  /** Lo que escribió, tal cual. Nunca se traduce ni se reescribe. */
  texto: string
  /**
   * Desde qué pantalla se mandó (ruta interna, sin idioma). Es la mitad del
   * valor de un comentario: «no entiendo esto» dicho en /wallet y dicho en
   * /campanas son dos problemas distintos.
   */
  ruta?: string
  creadoEn: string
  estado: EstadoFeedback
  /** La respuesta del equipo, si la hay. También contenido, no se traduce. */
  respuesta?: string
  respondidoEn?: string
  /** `true` mientras quien escribió no haya abierto la respuesta. */
  sinLeer?: boolean
}

/* ---------------------------------------------------------------------------
   Escribir uno
   --------------------------------------------------------------------------- */

export const LIMITES_FEEDBACK = {
  textoMin: 10,
  textoMax: 1200,
  respuestaMax: 1200,
} as const

export interface BorradorFeedback {
  tipo: TipoFeedback
  texto: string
}

export const FEEDBACK_NUEVO: BorradorFeedback = { tipo: "idea", texto: "" }

export type CodigoAvisoFeedback = "textoCorto" | "textoLargo"

export interface AvisoFeedback {
  code: CodigoAvisoFeedback
  bloquea: boolean
  values?: { min: number; max: number }
}

/**
 * Lo que impide mandar un comentario. Solo el texto: el tipo siempre tiene
 * valor y quién escribe lo pone la cuenta.
 */
export function validarFeedback(b: BorradorFeedback): AvisoFeedback | null {
  const L = LIMITES_FEEDBACK
  const texto = b.texto.trim()
  if (texto.length < L.textoMin)
    return {
      code: "textoCorto",
      bloquea: true,
      values: { min: L.textoMin, max: L.textoMax },
    }
  if (texto.length > L.textoMax)
    return {
      code: "textoLargo",
      bloquea: true,
      values: { min: L.textoMin, max: L.textoMax },
    }
  return null
}

export const nuevoIdFeedback = (semilla: string) => `fb_${semilla}`

export function feedbackDeBorrador(
  b: BorradorFeedback,
  quien: { id: string; autor: string; userId: string; de: AutorFeedback; ruta?: string },
  en: string
): Feedback {
  return {
    id: quien.id,
    autor: quien.autor,
    userId: quien.userId,
    de: quien.de,
    tipo: b.tipo,
    texto: b.texto.trim(),
    ruta: quien.ruta,
    creadoEn: en,
    estado: "nuevo",
  }
}

/* ---------------------------------------------------------------------------
   Lo que hace el equipo con él
   --------------------------------------------------------------------------- */

/** Marcar leído no borra la respuesta que hubiera: solo saca de «nuevo». */
export const marcarLeido = (f: Feedback): Partial<Feedback> =>
  f.estado === "nuevo" ? { estado: "leido" } : {}

/**
 * Responder.
 *
 * Deja `sinLeer` para que la campana lo anuncie una sola vez: es el aviso que
 * cierra el círculo, y el que hace que contestar sirva de algo.
 */
export const responder = (respuesta: string, en: string): Partial<Feedback> => ({
  estado: "respondido",
  respuesta: respuesta.trim(),
  respondidoEn: en,
  sinLeer: true,
})

export const archivar = (): Partial<Feedback> => ({ estado: "archivado" })

/** Al abrir Ayuda › Tus mensajes: deja de estar sin leer. */
export const marcarVisto = (): Partial<Feedback> => ({ sinLeer: false })

/* ---------------------------------------------------------------------------
   Leer la cola
   --------------------------------------------------------------------------- */

export interface ResumenFeedback {
  total: number
  /** Sin abrir. Es el número que se pinta en la barra del backoffice. */
  nuevos: number
  /** Abiertos: piden trabajo del equipo. */
  abiertos: number
  respondidos: number
  porTipo: Record<TipoFeedback, number>
  porAutor: Record<AutorFeedback, number>
  /** Días que lleva esperando el más antiguo sin responder. `null` si no hay. */
  esperaMaxDias: number | null
}

const DIA_MS = 86_400_000

export function resumenFeedback(
  lista: readonly Feedback[],
  ahora: string = AHORA_DEMO
): ResumenFeedback {
  const porTipo = Object.fromEntries(TIPOS_FEEDBACK.map((t) => [t, 0])) as Record<
    TipoFeedback,
    number
  >
  const porAutor = Object.fromEntries(AUTORES_FEEDBACK.map((a) => [a, 0])) as Record<
    AutorFeedback,
    number
  >
  let nuevos = 0
  let abiertos = 0
  let respondidos = 0
  let esperaMaxMs: number | null = null
  const t = Date.parse(ahora)

  for (const f of lista) {
    porTipo[f.tipo] += 1
    porAutor[f.de] += 1
    if (f.estado === "nuevo") nuevos += 1
    if (f.estado === "respondido") respondidos += 1
    if (ABIERTOS.includes(f.estado)) {
      abiertos += 1
      const espera = t - Date.parse(f.creadoEn)
      if (espera > 0 && (esperaMaxMs === null || espera > esperaMaxMs))
        esperaMaxMs = espera
    }
  }

  return {
    total: lista.length,
    nuevos,
    abiertos,
    respondidos,
    porTipo,
    porAutor,
    esperaMaxDias: esperaMaxMs === null ? null : Math.floor(esperaMaxMs / DIA_MS),
  }
}

/** Los míos, del más nuevo al más viejo. */
export const misFeedbacks = (lista: readonly Feedback[], userId: string): Feedback[] =>
  lista
    .filter((f) => f.userId === userId)
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))

/** Respuestas que todavía no ha abierto: es lo que anuncia la campana. */
export const respuestasSinLeer = (
  lista: readonly Feedback[],
  userId: string
): Feedback[] => misFeedbacks(lista, userId).filter((f) => f.sinLeer === true)

/* ---------------------------------------------------------------------------
   Lo guardado: se limpia al leer
   --------------------------------------------------------------------------- */

const esId = <T extends string>(ids: readonly T[], v: unknown): v is T =>
  typeof v === "string" && (ids as readonly string[]).includes(v)

/** Un mensaje guardado con basura dentro no tumba la cola: se descarta. */
export function limpiarFeedback(v: unknown): Feedback | null {
  if (!v || typeof v !== "object") return null
  const f = v as Partial<Feedback>
  if (typeof f.id !== "string" || typeof f.texto !== "string") return null
  if (typeof f.creadoEn !== "string") return null
  return {
    id: f.id,
    autor: typeof f.autor === "string" ? f.autor : "",
    userId: typeof f.userId === "string" ? f.userId : "",
    de: esId(AUTORES_FEEDBACK, f.de) ? f.de : "clipero",
    tipo: esId(TIPOS_FEEDBACK, f.tipo) ? f.tipo : "otro",
    texto: f.texto.slice(0, LIMITES_FEEDBACK.textoMax),
    ruta: typeof f.ruta === "string" ? f.ruta : undefined,
    creadoEn: f.creadoEn,
    estado: esId(ESTADOS_FEEDBACK, f.estado) ? f.estado : "nuevo",
    respuesta:
      typeof f.respuesta === "string"
        ? f.respuesta.slice(0, LIMITES_FEEDBACK.respuestaMax)
        : undefined,
    respondidoEn: typeof f.respondidoEn === "string" ? f.respondidoEn : undefined,
    sinLeer: f.sinLeer === true ? true : undefined,
  }
}

export function limpiarParcheFeedback(p: Partial<Feedback>): Partial<Feedback> {
  const out: Partial<Feedback> = {}
  if (esId(ESTADOS_FEEDBACK, p.estado)) out.estado = p.estado
  if (typeof p.respuesta === "string")
    out.respuesta = p.respuesta.slice(0, LIMITES_FEEDBACK.respuestaMax)
  if (typeof p.respondidoEn === "string") out.respondidoEn = p.respondidoEn
  if (typeof p.sinLeer === "boolean") out.sinLeer = p.sinLeer
  return out
}

/* ---------------------------------------------------------------------------
   Datos de demo
   --------------------------------------------------------------------------- */

/**
 * La cola que hoy tendría el equipo. Determinista a propósito, y escrita como
 * escribiría la gente: sin mayúsculas de más, con la queja concreta delante.
 * Contenido de usuario: no se traduce.
 */
export const feedbackSemilla: readonly Feedback[] = [
  {
    id: "fb_s1",
    autor: "Ana Ruiz",
    userId: "u_ana",
    de: "clipero",
    tipo: "problema",
    texto:
      "Mandé un clip a la campaña de la Liga pegando el enlace y la tabla me dice «cobras US$ 0,00». Entiendo que no podéis leer las vistas de TikTok, pero entonces decidlo antes de que lo mande, no después.",
    ruta: "/campanas",
    creadoEn: "2026-09-10T16:40:00.000Z",
    estado: "nuevo",
  },
  {
    id: "fb_s2",
    autor: "Nebula Studio",
    userId: "u_nebula",
    de: "agencia",
    tipo: "idea",
    texto:
      "Nos vendría muy bien poder exigir un mínimo de seguidores al aceptar cliperos. Ahora miramos el perfil uno a uno y se nos va la mañana.",
    ruta: "/campanas/cmp_arena",
    creadoEn: "2026-09-09T11:15:00.000Z",
    estado: "nuevo",
  },
  {
    id: "fb_s3",
    autor: "Ana Ruiz",
    userId: "u_ana",
    de: "clipero",
    tipo: "precio",
    texto:
      "El salto de Prueba a Creador se me hace grande para lo que clipeo al mes. ¿No hay algo intermedio, o pagar por minutos sueltos?",
    ruta: "/precios",
    creadoEn: "2026-09-05T09:20:00.000Z",
    estado: "respondido",
    respuesta:
      "Gracias por decirlo con números. De momento no hay plan intermedio, pero los minutos sueltos están sobre la mesa y tu mensaje entra en esa discusión. Te escribimos si sale.",
    respondidoEn: "2026-09-06T10:00:00.000Z",
    sinLeer: true,
  },
  {
    id: "fb_s4",
    autor: "Arena Nova",
    userId: "u_arena",
    de: "agencia",
    tipo: "contenido",
    texto:
      "Las clases de Formación están muy bien pero ninguna tiene video todavía. ¿Para cuándo?",
    ruta: "/formacion",
    creadoEn: "2026-09-02T14:05:00.000Z",
    estado: "leido",
  },
]
