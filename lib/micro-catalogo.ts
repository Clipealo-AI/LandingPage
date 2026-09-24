import {
  LUGARES_MICRO,
  LUGAR_MICRO,
  MICRO_IDS,
  REGLAS_MICRO,
  type LugarMicro,
} from "@/lib/micro-preguntas"

/**
 * QUÉ SE PREGUNTA Y CUÁNDO, como dato.
 *
 * Las nueve micropreguntas de siempre estaban escritas en constantes: cambiar
 * una era tocar código. El mercado cambia más deprisa que el despliegue, así
 * que el catálogo sale del código y pasa a ser algo que el admin edita —y algo
 * a lo que puede añadir preguntas nuevas cuando haga falta recoger otra cosa.
 *
 * Dos clases de pregunta, y la diferencia importa:
 *
 * - **Semilla**: las nueve de siempre. Su texto, sus opciones y el campo de la
 *   cuenta donde escriben están tipados y traducidos en los tres idiomas. De
 *   ellas el admin cambia SI se preguntan, DÓNDE y en qué ORDEN; el texto no,
 *   porque vive en `messages/` y no en la base de datos.
 * - **Creada**: la escribe el admin, con su título, su ayuda y sus opciones. No
 *   tiene sitio tipado en la cuenta —no lo puede tener, nadie sabía que iba a
 *   existir— así que su respuesta cae en `Cuenta.respuestasLibres`. Y va en el
 *   idioma en que la escriba: es contenido, como el título de una clase o de
 *   una campaña, y por eso no se traduce.
 *
 * Aquí no hay React ni reloj: funciones de (datos, instante), como el resto.
 */

/* ---------------------------------------------------------------------------
   Qué es una pregunta
   --------------------------------------------------------------------------- */

export const TIPOS_RESPUESTA = ["unica", "multiple"] as const
export type TipoRespuesta = (typeof TIPOS_RESPUESTA)[number]

export interface PreguntaCatalogo {
  id: string
  /** `semilla`: una de las nueve tipadas. `creada`: la escribió el admin. */
  origen: "semilla" | "creada"
  /** Apagada deja de preguntarse, pero no se borra: lo respondido sigue ahí. */
  activa: boolean
  lugar: LugarMicro
  /** Dentro de su lugar, de menor a mayor. La primera disponible es la que sale. */
  orden: number

  /* --- Solo las creadas: lo que la semilla tiene en `messages/` --- */
  /** Contenido: va en el idioma en que se escriba y no se traduce. */
  titulo?: string
  /** Para qué se pregunta. Se enseña debajo: nadie responde a ciegas. */
  ayuda?: string
  tipo?: TipoRespuesta
  opciones?: string[]
  /** Cuántas se pueden marcar en una de varias respuestas. */
  max?: number
  /**
   * A partir de cuántos días desde el alta se pregunta. Es la única regla que
   * puede tener una pregunta nueva: las de las semillas dependen de datos
   * (envíos aprobados, temas elegidos) que solo ellas saben mirar.
   */
  desdeAltaDias?: number
}

export interface CatalogoMicro {
  preguntas: PreguntaCatalogo[]
  /** Cada cuánto se puede preguntar, y los umbrales de las semillas. */
  reglas: ReglasMicro
}

export type ReglasMicro = { -readonly [K in keyof typeof REGLAS_MICRO]: number }

/** Los límites de cada regla: fuera de aquí, la demo deja de tener sentido. */
export const LIMITES_REGLAS: Record<keyof ReglasMicro, { min: number; max: number }> = {
  diasEntre: { min: 0, max: 60 },
  diasPospuesta: { min: 1, max: 90 },
  diasMotivaciones: { min: 1, max: 180 },
  diasHerramientas: { min: 1, max: 180 },
  diasSinEnvios: { min: 1, max: 90 },
  diasRevalidar: { min: 30, max: 730 },
  enviosDisponibilidad: { min: 1, max: 50 },
  maxSubverticales: { min: 1, max: 10 },
}

/** El catálogo de fábrica: las nueve, activas, donde y como estaban. */
export const CATALOGO_MICRO_SEMILLA: CatalogoMicro = {
  preguntas: MICRO_IDS.map((id, i) => ({
    id,
    origen: "semilla" as const,
    activa: true,
    lugar: LUGAR_MICRO[id],
    orden: i,
  })),
  reglas: { ...REGLAS_MICRO },
}

/* ---------------------------------------------------------------------------
   Lo que se guarda: semillas + parches
   --------------------------------------------------------------------------- */

export const CATALOGO_MICRO_VERSION = 1

export interface CatalogoMicroGuardado {
  version: number
  /** Las que escribió el admin. */
  creadas: PreguntaCatalogo[]
  /** id → lo que cambió de una semilla (activa, lugar, orden). */
  cambios: Record<string, Partial<PreguntaCatalogo>>
  /** Solo lo que se haya tocado: lo demás sigue el valor de fábrica. */
  reglas: Partial<ReglasMicro>
}

export const CATALOGO_MICRO_VACIO: CatalogoMicroGuardado = {
  version: CATALOGO_MICRO_VERSION,
  creadas: [],
  cambios: {},
  reglas: {},
}

export function aplicarCatalogoMicro(
  g: CatalogoMicroGuardado,
  base: CatalogoMicro = CATALOGO_MICRO_SEMILLA
): CatalogoMicro {
  const preguntas = [...base.preguntas, ...g.creadas]
    .map((p) => (g.cambios[p.id] ? { ...p, ...g.cambios[p.id] } : p))
    .sort((a, b) => a.orden - b.orden || a.id.localeCompare(b.id))
  return { preguntas, reglas: { ...base.reglas, ...g.reglas } }
}

/** El parche mínimo de una semilla: nunca se copia la pregunta entera. */
export function parchePregunta(
  base: PreguntaCatalogo,
  siguiente: PreguntaCatalogo
): Partial<PreguntaCatalogo> {
  const p: Partial<PreguntaCatalogo> = {}
  if (siguiente.activa !== base.activa) p.activa = siguiente.activa
  if (siguiente.lugar !== base.lugar) p.lugar = siguiente.lugar
  if (siguiente.orden !== base.orden) p.orden = siguiente.orden
  return p
}

/* ---------------------------------------------------------------------------
   Escribir una pregunta nueva
   --------------------------------------------------------------------------- */

export const LIMITES_PREGUNTA = {
  tituloMin: 8,
  tituloMax: 120,
  ayudaMin: 10,
  ayudaMax: 200,
  opcionMin: 1,
  opcionMax: 60,
  opcionesMin: 2,
  opcionesMax: 8,
} as const

export interface BorradorPregunta {
  /** Sin `id` = pregunta nueva. */
  id?: string
  titulo: string
  ayuda: string
  lugar: LugarMicro
  tipo: TipoRespuesta
  opciones: string[]
  max: number
  desdeAltaDias: number
  activa: boolean
}

export const PREGUNTA_NUEVA: BorradorPregunta = {
  titulo: "",
  ayuda: "",
  lugar: "panel",
  tipo: "unica",
  opciones: ["", ""],
  max: 3,
  desdeAltaDias: 7,
  activa: true,
}

export type CodigoAvisoPregunta =
  "tituloCorto" | "ayudaCorta" | "pocasOpciones" | "opcionVacia" | "opcionRepetida"

export interface AvisoPregunta {
  code: CodigoAvisoPregunta
  bloquea: boolean
  values?: { min: number; max: number }
}

export type AvisosPregunta = Partial<Record<keyof BorradorPregunta, AvisoPregunta>>

/**
 * Lo que impide guardar una pregunta.
 *
 * La ayuda es obligatoria a propósito: una pregunta sin «para qué» se responde
 * peor y se abandona antes, y es la mitad del trato que el onboarding hace con
 * quien contesta (§6.6: se dice siempre para qué se pregunta).
 */
export function validarPregunta(b: BorradorPregunta): AvisosPregunta {
  const a: AvisosPregunta = {}
  const L = LIMITES_PREGUNTA
  if (b.titulo.trim().length < L.tituloMin)
    a.titulo = {
      code: "tituloCorto",
      bloquea: true,
      values: { min: L.tituloMin, max: L.tituloMax },
    }
  if (b.ayuda.trim().length < L.ayudaMin)
    a.ayuda = {
      code: "ayudaCorta",
      bloquea: true,
      values: { min: L.ayudaMin, max: L.ayudaMax },
    }

  const limpias = b.opciones.map((o) => o.trim())
  if (limpias.filter(Boolean).length < L.opcionesMin)
    a.opciones = {
      code: "pocasOpciones",
      bloquea: true,
      values: { min: L.opcionesMin, max: L.opcionesMax },
    }
  else if (limpias.some((o, i) => !o && i < limpias.length))
    a.opciones = { code: "opcionVacia", bloquea: true }
  else if (new Set(limpias).size !== limpias.length)
    a.opciones = { code: "opcionRepetida", bloquea: true }

  return a
}

export const hayBloqueoPregunta = (a: AvisosPregunta) =>
  Object.values(a).some((x) => x?.bloquea === true)

export const nuevoIdPregunta = (semilla: string) => `micro_${semilla}`

export function borradorDePregunta(p: PreguntaCatalogo): BorradorPregunta {
  return {
    id: p.id,
    titulo: p.titulo ?? "",
    ayuda: p.ayuda ?? "",
    lugar: p.lugar,
    tipo: p.tipo ?? "unica",
    opciones: p.opciones?.length ? [...p.opciones] : ["", ""],
    max: p.max ?? 3,
    desdeAltaDias: p.desdeAltaDias ?? 7,
    activa: p.activa,
  }
}

export function preguntaDeBorrador(
  b: BorradorPregunta,
  id: string,
  orden: number
): PreguntaCatalogo {
  return {
    id,
    origen: "creada",
    activa: b.activa,
    lugar: b.lugar,
    orden,
    titulo: b.titulo.trim(),
    ayuda: b.ayuda.trim(),
    tipo: b.tipo,
    opciones: b.opciones.map((o) => o.trim()).filter(Boolean),
    max: b.tipo === "multiple" ? b.max : undefined,
    desdeAltaDias: b.desdeAltaDias,
  }
}

/** Mover una pregunta dentro de su lugar. La misma referencia si no hay sitio. */
export function moverPregunta(
  preguntas: readonly PreguntaCatalogo[],
  id: string,
  delta: -1 | 1
): PreguntaCatalogo[] {
  const lista = [...preguntas]
  const p = lista.find((x) => x.id === id)
  if (!p) return lista
  // Solo se compite con las de su mismo lugar: el orden es por lugar
  const suyas = lista.filter((x) => x.lugar === p.lugar).sort((a, b) => a.orden - b.orden)
  const i = suyas.findIndex((x) => x.id === id)
  const j = i + delta
  if (i === -1 || j < 0 || j >= suyas.length) return lista
  const orden = suyas[i].orden
  suyas[i].orden = suyas[j].orden
  suyas[j].orden = orden
  return lista
}

/* ---------------------------------------------------------------------------
   Lo guardado se limpia al leer
   --------------------------------------------------------------------------- */

const enRango = (
  v: unknown,
  { min, max }: { min: number; max: number },
  porDefecto: number
) =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.min(max, Math.max(min, Math.round(v)))
    : porDefecto

const esLugar = (v: unknown): v is LugarMicro =>
  typeof v === "string" && (LUGARES_MICRO as readonly string[]).includes(v)

function limpiarPregunta(v: unknown): PreguntaCatalogo | null {
  if (!v || typeof v !== "object") return null
  const p = v as Partial<PreguntaCatalogo>
  if (typeof p.id !== "string" || !p.titulo) return null
  const opciones = (Array.isArray(p.opciones) ? p.opciones : [])
    .filter((o): o is string => typeof o === "string")
    .map((o) => o.trim().slice(0, LIMITES_PREGUNTA.opcionMax))
    .filter(Boolean)
  if (opciones.length < LIMITES_PREGUNTA.opcionesMin) return null
  return {
    id: p.id,
    origen: "creada",
    activa: p.activa !== false,
    lugar: esLugar(p.lugar) ? p.lugar : "panel",
    orden: typeof p.orden === "number" ? p.orden : 100,
    titulo: String(p.titulo).slice(0, LIMITES_PREGUNTA.tituloMax),
    ayuda: typeof p.ayuda === "string" ? p.ayuda.slice(0, LIMITES_PREGUNTA.ayudaMax) : "",
    tipo: p.tipo === "multiple" ? "multiple" : "unica",
    opciones: opciones.slice(0, LIMITES_PREGUNTA.opcionesMax),
    max: p.tipo === "multiple" ? enRango(p.max, { min: 1, max: 8 }, 3) : undefined,
    desdeAltaDias: enRango(p.desdeAltaDias, { min: 0, max: 365 }, 7),
  }
}

function limpiarParche(p: Partial<PreguntaCatalogo>): Partial<PreguntaCatalogo> {
  const out: Partial<PreguntaCatalogo> = {}
  if (typeof p.activa === "boolean") out.activa = p.activa
  if (esLugar(p.lugar)) out.lugar = p.lugar
  if (typeof p.orden === "number" && Number.isFinite(p.orden)) out.orden = p.orden
  return out
}

export function migrarCatalogoMicro(guardado: unknown): CatalogoMicroGuardado {
  if (!guardado || typeof guardado !== "object") return CATALOGO_MICRO_VACIO
  const g = guardado as Partial<CatalogoMicroGuardado>
  const creadas = (Array.isArray(g.creadas) ? g.creadas : [])
    .map(limpiarPregunta)
    .filter((p): p is PreguntaCatalogo => p !== null)

  const ids = new Set([
    ...CATALOGO_MICRO_SEMILLA.preguntas.map((p) => p.id),
    ...creadas.map((p) => p.id),
  ])
  const cambios: Record<string, Partial<PreguntaCatalogo>> = {}
  for (const [id, parche] of Object.entries(g.cambios ?? {})) {
    if (!ids.has(id) || !parche || typeof parche !== "object") continue
    cambios[id] = limpiarParche(parche)
  }

  const reglas: Partial<ReglasMicro> = {}
  for (const [clave, limite] of Object.entries(LIMITES_REGLAS)) {
    const k = clave as keyof ReglasMicro
    const v = (g.reglas ?? {})[k]
    // Una regla fuera de rango se descarta: vale la de fábrica
    if (typeof v === "number" && Number.isFinite(v))
      reglas[k] = Math.min(limite.max, Math.max(limite.min, Math.round(v)))
  }

  return { version: CATALOGO_MICRO_VERSION, creadas, cambios, reglas }
}

/* ---------------------------------------------------------------------------
   Leerlo
   --------------------------------------------------------------------------- */

export const preguntaPorId = (
  id: string,
  catalogo: CatalogoMicro = CATALOGO_MICRO_SEMILLA
): PreguntaCatalogo | undefined => catalogo.preguntas.find((p) => p.id === id)

/** Las que se preguntan hoy en ese lugar, en su orden. */
export const activasEn = (
  lugar: LugarMicro,
  catalogo: CatalogoMicro = CATALOGO_MICRO_SEMILLA
): PreguntaCatalogo[] =>
  catalogo.preguntas
    .filter((p) => p.activa && p.lugar === lugar)
    .sort((a, b) => a.orden - b.orden)

export interface ResumenCatalogoMicro {
  total: number
  activas: number
  creadas: number
  porLugar: Record<LugarMicro, number>
}

export function resumenCatalogoMicro(
  catalogo: CatalogoMicro = CATALOGO_MICRO_SEMILLA
): ResumenCatalogoMicro {
  const porLugar = Object.fromEntries(LUGARES_MICRO.map((l) => [l, 0])) as Record<
    LugarMicro,
    number
  >
  let activas = 0
  let creadas = 0
  for (const p of catalogo.preguntas) {
    if (p.activa) {
      activas += 1
      porLugar[p.lugar] += 1
    }
    if (p.origen === "creada") creadas += 1
  }
  return { total: catalogo.preguntas.length, activas, creadas, porLugar }
}
