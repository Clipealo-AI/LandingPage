import type { Campana } from "@/lib/campanas"
import { SOCIAL_IDS, type SocialAccount, type SocialId } from "@/lib/social"

/**
 * DERECHOS: un clip en muchas cuentas, con permiso.
 *
 * Que diez cliperos publiquen el mismo clip de una agencia es legítimo si los
 * derechos están claros. El problema nunca fue la huella del video: fue el
 * permiso. Aquí vive lo que la agencia concede con cada campaña —la licencia—
 * y el trámite que la hace efectiva en las plataformas: la lista blanca, que
 * es la agencia diciéndole al Content ID «esta cuenta puede usar mi material».
 *
 * La licencia va en la campaña porque el permiso lo da quien pone el material,
 * campaña a campaña. La lista blanca es una solicitud por cuenta conectada,
 * porque las plataformas la conceden a un canal concreto, no a una persona.
 *
 * Dominio puro: sin React ni reloj. Textos en `campaigns.licencia` y en
 * `app.operaciones.derechos`.
 */

/**
 * Hasta dónde llega el permiso. `campana`: mientras la campaña esté abierta y
 * con sus reglas. `libre`: el clipero puede dejar los clips publicados y volver
 * a publicarlos después, dentro de las mismas redes.
 */
export const ALCANCES_LICENCIA = ["campana", "libre"] as const
export type AlcanceLicencia = (typeof ALCANCES_LICENCIA)[number]

export interface Licencia {
  alcance: AlcanceLicencia
  /** La agencia ofrece dar de alta las cuentas de los cliperos en su Content ID. */
  listaBlanca: boolean
  /** A quién hay que etiquetar o citar. Contenido: en el idioma en que se escriba. */
  atribucion?: string
  /** Condiciones que no caben en las de arriba (música, marcas de terceros…). */
  notas?: string
}

/** Sin licencia escrita vale lo de siempre: dentro de la campaña y sin lista blanca. */
export const LICENCIA_POR_DEFECTO: Licencia = { alcance: "campana", listaBlanca: false }

export const licenciaDe = (c: Pick<Campana, "licencia">): Licencia =>
  c.licencia ?? LICENCIA_POR_DEFECTO

/** Lo que el clipero puede hacer con el clip cuando la campaña cierra. */
export const puedeConservar = (l: Licencia) => l.alcance === "libre"

export const LIMITES_LICENCIA = {
  atribucionMax: 60,
  notasMax: 300,
} as const

/* ---------------------------------------------------------------------------
   Lista blanca
   --------------------------------------------------------------------------- */

export const ESTADOS_LISTA_BLANCA = ["pendiente", "activa", "rechazada"] as const
/** Etiquetas en `app.operaciones.derechos.estado`. */
export type EstadoListaBlanca = (typeof ESTADOS_LISTA_BLANCA)[number]

export interface SolicitudListaBlanca {
  id: string
  campanaId: string
  /** Quién la pide. */
  userId?: string
  creador: string
  /** La cuenta concreta: las plataformas dan de alta canales, no personas. */
  cuentaId: string
  red: SocialId
  handle: string
  estado: EstadoListaBlanca
  pedidaEn: string
  resueltaEn?: string
  /** Solo si se rechaza. Contenido de la agencia. */
  motivo?: string
}

export type CodigoAvisoListaBlanca =
  "sinListaBlanca" | "sinCuenta" | "redFuera" | "yaPedida" | "campanaCerrada"

export interface AvisoListaBlanca {
  code: CodigoAvisoListaBlanca
  bloquea: boolean
}

/**
 * Lo que impide pedir la lista blanca para una cuenta en una campaña.
 * `abierta` lo decide quien llama con `estadoVisible` y el ahora de la demo:
 * aquí no hay reloj.
 */
export function validarSolicitudListaBlanca(datos: {
  campana: Pick<Campana, "id" | "redes" | "licencia">
  cuenta: Pick<SocialAccount, "id" | "network"> | null
  existentes: readonly SolicitudListaBlanca[]
  abierta: boolean
}): AvisoListaBlanca[] {
  const avisos: AvisoListaBlanca[] = []
  if (!licenciaDe(datos.campana).listaBlanca)
    avisos.push({ code: "sinListaBlanca", bloquea: true })
  if (!datos.abierta) avisos.push({ code: "campanaCerrada", bloquea: true })
  if (!datos.cuenta) avisos.push({ code: "sinCuenta", bloquea: true })
  else {
    if (!datos.campana.redes.includes(datos.cuenta.network))
      avisos.push({ code: "redFuera", bloquea: true })
    if (
      datos.existentes.some(
        (s) =>
          s.campanaId === datos.campana.id &&
          s.cuentaId === datos.cuenta!.id &&
          s.estado !== "rechazada"
      )
    )
      avisos.push({ code: "yaPedida", bloquea: true })
  }
  return avisos
}

export const hayBloqueoListaBlanca = (a: AvisoListaBlanca[]) => a.some((x) => x.bloquea)

export function nuevaSolicitudListaBlanca(datos: {
  id: string
  campanaId: string
  userId?: string
  creador: string
  cuenta: Pick<SocialAccount, "id" | "network" | "handle">
  ahora: string
}): SolicitudListaBlanca {
  return {
    id: datos.id,
    campanaId: datos.campanaId,
    userId: datos.userId,
    creador: datos.creador,
    cuentaId: datos.cuenta.id,
    red: datos.cuenta.network,
    handle: datos.cuenta.handle ?? "",
    estado: "pendiente",
    pedidaEn: datos.ahora,
  }
}

/** La agencia decide. Rechazar lleva su motivo. */
export function resolverListaBlanca(
  s: SolicitudListaBlanca,
  aprobada: boolean,
  ahora: string,
  motivo?: string
): SolicitudListaBlanca {
  return {
    ...s,
    estado: aprobada ? "activa" : "rechazada",
    resueltaEn: ahora,
    motivo: aprobada ? undefined : motivo?.trim() || undefined,
  }
}

/**
 * Cómo está la lista blanca de una persona en una campaña, para decirlo en una
 * línea: `no-ofrecida` (la agencia no la da), `disponible` (la da y no se ha
 * pedido), o el estado de la última solicitud.
 */
export type SituacionListaBlanca = "no-ofrecida" | "disponible" | EstadoListaBlanca

export function situacionListaBlanca(
  campana: Pick<Campana, "id" | "licencia">,
  solicitudes: readonly SolicitudListaBlanca[],
  userId: string | undefined
): SituacionListaBlanca {
  if (!licenciaDe(campana).listaBlanca) return "no-ofrecida"
  const mias = solicitudes.filter(
    (s) => s.campanaId === campana.id && s.userId === userId
  )
  if (mias.length === 0) return "disponible"
  if (mias.some((s) => s.estado === "activa")) return "activa"
  if (mias.some((s) => s.estado === "pendiente")) return "pendiente"
  return "rechazada"
}

/** Las solicitudes que esperan a una agencia, en sus campañas. */
export const pendientesDe = (
  solicitudes: readonly SolicitudListaBlanca[],
  campanas: readonly Pick<Campana, "id">[]
) => {
  const ids = new Set(campanas.map((c) => c.id))
  return solicitudes.filter((s) => s.estado === "pendiente" && ids.has(s.campanaId))
}

/* ---------------------------------------------------------------------------
   Lo guardado se limpia al leer
   --------------------------------------------------------------------------- */

const esAlcance = (v: unknown): v is AlcanceLicencia =>
  typeof v === "string" && (ALCANCES_LICENCIA as readonly string[]).includes(v)

const esRed = (v: unknown): v is SocialId =>
  typeof v === "string" && (SOCIAL_IDS as readonly string[]).includes(v)

const esEstado = (v: unknown): v is EstadoListaBlanca =>
  typeof v === "string" && (ESTADOS_LISTA_BLANCA as readonly string[]).includes(v)

/** Una licencia guardada, o nada si no tiene forma de licencia. */
export function licenciaValida(v: unknown): Licencia | undefined {
  if (!v || typeof v !== "object") return undefined
  const l = v as Partial<Licencia>
  if (!esAlcance(l.alcance)) return undefined
  const out: Licencia = { alcance: l.alcance, listaBlanca: l.listaBlanca === true }
  if (typeof l.atribucion === "string" && l.atribucion.trim())
    out.atribucion = l.atribucion.trim().slice(0, LIMITES_LICENCIA.atribucionMax)
  if (typeof l.notas === "string" && l.notas.trim())
    out.notas = l.notas.trim().slice(0, LIMITES_LICENCIA.notasMax)
  return out
}

export function limpiarSolicitudListaBlanca(v: unknown): SolicitudListaBlanca | null {
  if (!v || typeof v !== "object") return null
  const s = v as Partial<SolicitudListaBlanca>
  if (
    typeof s.id !== "string" ||
    typeof s.campanaId !== "string" ||
    typeof s.cuentaId !== "string" ||
    !esRed(s.red) ||
    typeof s.pedidaEn !== "string"
  )
    return null
  return {
    id: s.id,
    campanaId: s.campanaId,
    userId: typeof s.userId === "string" ? s.userId : undefined,
    creador: typeof s.creador === "string" ? s.creador : "",
    cuentaId: s.cuentaId,
    red: s.red,
    handle: typeof s.handle === "string" ? s.handle : "",
    estado: esEstado(s.estado) ? s.estado : "pendiente",
    pedidaEn: s.pedidaEn,
    resueltaEn: typeof s.resueltaEn === "string" ? s.resueltaEn : undefined,
    motivo: typeof s.motivo === "string" && s.motivo.trim() ? s.motivo : undefined,
  }
}
