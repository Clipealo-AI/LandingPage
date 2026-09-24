import { SOCIAL_IDS, type SocialId } from "@/lib/social"

/**
 * EL TEXTO CON EL QUE SALE CADA CLIP, no los metadatos del archivo.
 *
 * Título, descripción y hashtags distintos por red y por CLIP: es lo que
 * Clipealo manda a cada cuenta al publicar (`lib/api/publicaciones.ts`) y, de
 * paso, lo que se copia si alguien prefiere subirlo a mano. Nada de aquí toca
 * el fichero de video ni sus metadatos: eso sería disfrazarlo, y queda dicho
 * en `lib/operaciones.ts` por qué no.
 *
 * Dos niveles, porque así se trabaja de verdad: el PROYECTO tiene una
 * plantilla por red —la firma, los hashtags de siempre, el aviso legal— y cada
 * CLIP puede apartarse de ella. Sin texto propio, el clip sale con la
 * plantilla de su proyecto; en cuanto se escribe algo, manda lo suyo.
 *
 * Los límites son de dos clases y hay que distinguirlas: pasarse de caracteres
 * hace que la red RECHACE la publicación, así que bloquea; pasarse de hashtags
 * solo pierde alcance, así que se avisa y ya. Antes ninguno bloqueaba porque
 * nadie enviaba nada.
 *
 * Dominio puro: sin React ni reloj. Textos en `app.operaciones.publicacion`.
 */

export interface LimitesRed {
  /** Solo las redes que tienen título aparte del texto. */
  titulo?: number
  /** Caracteres del texto principal (caption, descripción, post). */
  texto: number
  /** Hashtags que la red recomienda como máximo; por encima pierde alcance. */
  hashtags: number
}

/** Cifras públicas de cada red (septiembre de 2026). */
export const LIMITES_PUBLICACION: Record<SocialId, LimitesRed> = {
  tiktok: { texto: 2200, hashtags: 5 },
  instagram: { texto: 2200, hashtags: 5 },
  youtube: { titulo: 100, texto: 5000, hashtags: 15 },
  x: { texto: 280, hashtags: 2 },
  linkedin: { texto: 3000, hashtags: 5 },
  facebook: { texto: 63_206, hashtags: 5 },
}

export interface CopiaPublicacion {
  titulo: string
  texto: string
  hashtags: string[]
}

export const COPIA_VACIA: CopiaPublicacion = { titulo: "", texto: "", hashtags: [] }

/** El texto propio de un clip en una red. */
export const claveCopia = (clipId: string, red: SocialId) => `${clipId}:${red}`

/** La plantilla de un proyecto en una red: lo que heredan sus clips. */
export const clavePlantilla = (proyectoId: string, red: SocialId) =>
  `${proyectoId}:${red}`

export const PUBLICACION_VERSION = 2

export interface PublicacionGuardada {
  version: number
  /** Por clip y red. */
  copias: Record<string, CopiaPublicacion>
  /** Por proyecto y red. */
  plantillas: Record<string, CopiaPublicacion>
}

export const PUBLICACION_VACIA: PublicacionGuardada = {
  version: PUBLICACION_VERSION,
  copias: {},
  plantillas: {},
}

/** «#Clips», «clips» y « #clips » son el mismo hashtag. */
export const normalizarHashtag = (s: string) =>
  `#${s.trim().replace(/^#+/, "").replace(/\s+/g, "")}`

/** Letras, números y guion bajo en cualquier alfabeto: lo que aceptan las redes. */
const HASHTAG_VALIDO = /^#[\p{L}\p{N}_]+$/u

export const hashtagValido = (h: string) => HASHTAG_VALIDO.test(h)

/** De lo que se escribe en el campo («#uno, dos #tres») a la lista, sin repetidos. */
export function hashtagsDe(texto: string): string[] {
  const vistos = new Set<string>()
  const out: string[] = []
  for (const trozo of texto.split(/[\s,]+/)) {
    if (!trozo.replace(/^#+/, "")) continue
    const h = normalizarHashtag(trozo)
    const clave = h.toLowerCase()
    if (vistos.has(clave)) continue
    vistos.add(clave)
    out.push(h)
  }
  return out
}

export type CodigoAvisoPublicacion =
  "tituloLargo" | "textoLargo" | "demasiadosHashtags" | "hashtagInvalido" | "vacia"

/**
 * Cuáles impiden ENVIAR. Los de longitud sí: la red devuelve un error y la
 * publicación no sale, así que dejarla salir sería tirar el intento. Los de
 * hashtags no: son alcance, no reglas.
 */
export const BLOQUEA_PUBLICACION: Record<CodigoAvisoPublicacion, boolean> = {
  tituloLargo: true,
  textoLargo: true,
  demasiadosHashtags: false,
  hashtagInvalido: false,
  vacia: true,
}

export interface AvisoPublicacion {
  code: CodigoAvisoPublicacion
  /** Impide enviar. Copiar solo lo impide `vacia`: no hay nada que pegar. */
  bloquea: boolean
  values?: { max: number; n: number }
}

const avisoPub = (
  code: CodigoAvisoPublicacion,
  values?: { max: number; n: number }
): AvisoPublicacion => ({ code, bloquea: BLOQUEA_PUBLICACION[code], values })

/** Lo que la red hará con esta copia, en orden: primero lo que impide enviar. */
export function validarCopia(copia: CopiaPublicacion, red: SocialId): AvisoPublicacion[] {
  const L = LIMITES_PUBLICACION[red]
  const avisos: AvisoPublicacion[] = []
  if (L.titulo !== undefined && copia.titulo.length > L.titulo)
    avisos.push(avisoPub("tituloLargo", { max: L.titulo, n: copia.titulo.length }))
  if (copia.texto.length > L.texto)
    avisos.push(avisoPub("textoLargo", { max: L.texto, n: copia.texto.length }))
  if (copia.hashtags.length > L.hashtags)
    avisos.push(
      avisoPub("demasiadosHashtags", { max: L.hashtags, n: copia.hashtags.length })
    )
  if (copia.hashtags.some((h) => !hashtagValido(h)))
    avisos.push(avisoPub("hashtagInvalido"))
  if (!copia.titulo.trim() && !copia.texto.trim() && copia.hashtags.length === 0)
    avisos.push(avisoPub("vacia"))
  return avisos
}

/** ¿Hay algo que impida enviarla? */
export const hayBloqueoPublicacion = (a: AvisoPublicacion[]) => a.some((x) => x.bloquea)

/** Copiar al portapapeles solo lo impide que no haya nada escrito. */
export const impideCopiar = (a: AvisoPublicacion[]) => a.some((x) => x.code === "vacia")

/** ¿Tiene algo escrito? Es lo que enseña el punto en la pestaña de la red. */
export const copiaConTexto = (c: CopiaPublicacion | undefined) =>
  Boolean(c && (c.titulo.trim() || c.texto.trim() || c.hashtags.length))

/**
 * Lo que se manda a la red: título (si la red lo tiene aparte, va en su campo
 * y NO aquí), texto y los hashtags al final en una línea. Es también lo que
 * copia el botón de copiar, para que lo pegado y lo enviado sean lo mismo.
 */
export function textoParaEnviar(copia: CopiaPublicacion, red: SocialId): string {
  const partes: string[] = []
  // Donde no hay campo de título, el título abre el texto
  if (LIMITES_PUBLICACION[red].titulo === undefined && copia.titulo.trim())
    partes.push(copia.titulo.trim())
  if (copia.texto.trim()) partes.push(copia.texto.trim())
  if (copia.hashtags.length) partes.push(copia.hashtags.join(" "))
  return partes.join("\n\n")
}

/** El título que va en su propio campo, solo donde la red lo tiene. */
export const tituloParaEnviar = (copia: CopiaPublicacion, red: SocialId) =>
  LIMITES_PUBLICACION[red].titulo === undefined ? undefined : copia.titulo.trim()

/* ---------------------------------------------------------------------------
   Del clip y su proyecto a la copia que sale
   --------------------------------------------------------------------------- */

/** Lo mínimo que hay que saber del clip para resolver su texto. */
export interface ClipDePublicacion {
  id: string
  sourceId: string
}

/**
 * El texto con el que sale este clip en esta red: el suyo si escribió algo, y
 * si no la plantilla de su proyecto. Nunca mezcla los dos: un clip que se
 * aparta de la plantilla se aparta entero, o no se sabría qué campo manda.
 */
export function copiaEfectiva(
  g: PublicacionGuardada,
  clip: ClipDePublicacion,
  red: SocialId
): CopiaPublicacion {
  const propia = g.copias[claveCopia(clip.id, red)]
  if (copiaConTexto(propia)) return propia
  return g.plantillas[clavePlantilla(clip.sourceId, red)] ?? COPIA_VACIA
}

/** ¿Sale con lo suyo o con lo del proyecto? Es lo que dice la ficha del clip. */
export const copiaHeredada = (
  g: PublicacionGuardada,
  clip: ClipDePublicacion,
  red: SocialId
) => !copiaConTexto(g.copias[claveCopia(clip.id, red)])

/** Las redes con algo escrito para un clip, en el orden del producto. */
export const redesConCopia = (
  g: PublicacionGuardada,
  clip: ClipDePublicacion
): SocialId[] => SOCIAL_IDS.filter((red) => copiaConTexto(copiaEfectiva(g, clip, red)))

/** Las redes con plantilla en un proyecto. */
export const redesConPlantilla = (
  g: PublicacionGuardada,
  proyectoId: string
): SocialId[] =>
  SOCIAL_IDS.filter((red) => copiaConTexto(g.plantillas[clavePlantilla(proyectoId, red)]))

/* ---------------------------------------------------------------------------
   Lo guardado se limpia al leer
   --------------------------------------------------------------------------- */

const esRed = (v: unknown): v is SocialId =>
  typeof v === "string" && (SOCIAL_IDS as readonly string[]).includes(v)

function limpiarCopia(v: unknown): CopiaPublicacion | null {
  if (!v || typeof v !== "object") return null
  const c = v as Partial<CopiaPublicacion>
  const copia: CopiaPublicacion = {
    titulo: typeof c.titulo === "string" ? c.titulo : "",
    texto: typeof c.texto === "string" ? c.texto : "",
    hashtags: Array.isArray(c.hashtags)
      ? hashtagsDe(c.hashtags.filter((h): h is string => typeof h === "string").join(" "))
      : [],
  }
  return copiaConTexto(copia) ? copia : null
}

function limpiarMapa(v: unknown): Record<string, CopiaPublicacion> {
  const out: Record<string, CopiaPublicacion> = {}
  if (!v || typeof v !== "object") return out
  for (const [clave, valor] of Object.entries(v as Record<string, unknown>)) {
    const [id, red] = clave.split(":")
    if (!id || !esRed(red)) continue
    const copia = limpiarCopia(valor)
    if (copia) out[clave] = copia
  }
  return out
}

/**
 * Lo guardado por una versión anterior. La v1 guardaba una copia por PROYECTO
 * y red: eso es exactamente una plantilla, así que pasa a serlo. Nadie pierde
 * lo que escribió y todos sus clips lo heredan.
 */
export function migrarPublicacion(guardado: unknown): PublicacionGuardada {
  if (!guardado || typeof guardado !== "object") return PUBLICACION_VACIA
  const g = guardado as Partial<PublicacionGuardada>
  const version = typeof g.version === "number" ? g.version : 1
  if (version < 2)
    return {
      version: PUBLICACION_VERSION,
      copias: {},
      plantillas: limpiarMapa(g.copias),
    }
  return {
    version: PUBLICACION_VERSION,
    copias: limpiarMapa(g.copias),
    plantillas: limpiarMapa(g.plantillas),
  }
}
