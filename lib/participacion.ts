/**
 * Participación en una campaña: el compromiso entre un clipero y quien paga
 * (docs/campanas-ciclo-2026-09.md).
 *
 * La regla del director: una campaña decide con quién trabaja. El clipero
 * **solicita**, la agencia **ve su perfil** y acepta o rechaza, y desde que
 * acepta hay un compromiso con plazo. La agencia no puede cerrar la campaña
 * dejando trabajo pendiente: como mucho cierra las inscripciones y termina con
 * los que ya están dentro, o abre una disputa y decide el admin.
 *
 * Todo aquí es puro: funciones de (datos, instante) a datos. La hora nunca se
 * lee dentro (nada de `Date.now()`), se pasa; así los estados son los mismos en
 * el servidor, en el cliente y en los tests.
 */

import { sinMedir, vistasDe, type Envio, type EstadoEnvio } from "@/lib/campanas"
import type { CountryCode } from "@/lib/countries"
import type { Cuenta } from "@/lib/onboarding"
import type { IdiomaAudiencia } from "@/lib/ajustes"
import { puedeParticipar, type PlanRef } from "@/lib/pricing"
import { SOCIAL_IDS, type SocialId } from "@/lib/social"
import {
  esId,
  tramoSeguidoresDe,
  type Disponibilidad,
  type Experiencia,
  type TramoSeguidores,
  type Vertical,
} from "@/lib/taxonomia"
import { AHORA_DEMO } from "@/lib/fechas"

/* ---------------------------------------------------------------------------
   Catálogos
   --------------------------------------------------------------------------- */

/** Cómo se entra en una campaña. Lo elige la agencia al crearla. */
export const MODOS_PARTICIPACION = ["con-solicitud", "abierta"] as const
export type ModoParticipacion = (typeof MODOS_PARTICIPACION)[number]

/** Lo que traen las campañas nuevas: la agencia decide con quién trabaja. */
export const MODO_POR_DEFECTO: ModoParticipacion = "con-solicitud"

/** Días para entregar desde que la agencia acepta. */
export const PLAZO_ENTREGA_DIAS = 7

/** Días hábiles sin decisión tras los que el clipero puede reclamar. */
export const DIAS_SIN_REVISAR = 3

/** Lo que el clipero puede escribir al solicitar. */
export const NOTA_MAX = 280

export const ESTADOS_PARTICIPACION = [
  "solicitada",
  "aceptada",
  "entregada",
  "cumplida",
  "rechazada",
  "retirada",
  "caducada",
  "en-disputa",
] as const
export type EstadoParticipacion = (typeof ESTADOS_PARTICIPACION)[number]

/** Por qué no entra, o por qué se cae. Códigos, nunca frases. */
export const MOTIVOS_DECISION = [
  "no-encaja-publico",
  "no-encaja-tema",
  "sin-historial",
  "plazas-llenas",
  "inscripciones-cerradas",
  "otro",
] as const
export type MotivoDecision = (typeof MOTIVOS_DECISION)[number]

export const MOTIVOS_DISPUTA = [
  "no-entrego",
  "no-revisa",
  "rechazo-injusto",
  "no-paga",
  "contenido",
] as const
export type MotivoDisputa = (typeof MOTIVOS_DISPUTA)[number]

export const ESTADOS_DISPUTA = ["abierta", "en-revision", "resuelta"] as const
export type EstadoDisputa = (typeof ESTADOS_DISPUTA)[number]

export const LAUDOS = [
  "liberar-plaza",
  "dar-prorroga",
  "pagar-clipero",
  "sin-pago",
] as const
export type Laudo = (typeof LAUDOS)[number]

/* ---------------------------------------------------------------------------
   Tipos
   --------------------------------------------------------------------------- */

export interface Participacion {
  id: string
  campanaId: string
  userId: string
  /** Nombre visible del clipero, como en `Envio.creador`. */
  clipero: string
  estado: EstadoParticipacion
  solicitadaEn: string
  decididaEn?: string
  /** Fin del plazo de entrega; solo desde que la aceptan. */
  venceEn?: string
  /** El clip entregado. */
  envioId?: string
  motivo?: MotivoDecision
  /** Lo que escribió el clipero al solicitar. */
  nota?: string
  /** Disputa abierta sobre este compromiso. */
  disputaId?: string
}

export interface Disputa {
  id: string
  participacionId: string
  campanaId: string
  /** Quién reclama. */
  abrePor: "clipero" | "agencia"
  motivo: MotivoDisputa
  detalle?: string
  estado: EstadoDisputa
  abiertaEn: string
  /** Lo que decide el admin. */
  laudo?: Laudo
  notaAdmin?: string
  resueltaEn?: string
}

/** Lo mínimo de la campaña que necesitan estas reglas. */
export interface CampanaParticipable {
  id: string
  fin: string
  modoParticipacion?: ModoParticipacion
  plazoEntregaDias?: number
  plazas?: number
  inscripcionesAbiertas?: boolean
}

export const modoDe = (c: Pick<CampanaParticipable, "modoParticipacion">) =>
  c.modoParticipacion ?? MODO_POR_DEFECTO

export const plazoDe = (c: Pick<CampanaParticipable, "plazoEntregaDias">) =>
  c.plazoEntregaDias ?? PLAZO_ENTREGA_DIAS

export const inscripcionesAbiertas = (
  c: Pick<CampanaParticipable, "inscripcionesAbiertas">
) => c.inscripcionesAbiertas !== false

const DIA_MS = 86_400_000

/** Suma días a un instante ISO. Las horas civiles no importan aquí: es un plazo. */
export const sumarDias = (iso: string, dias: number) =>
  new Date(Date.parse(iso) + dias * DIA_MS).toISOString()

/** Días que faltan (negativo si ya pasó); `null` si no hay fecha. */
export function diasHasta(iso: string | undefined, ahora: string): number | null {
  if (!iso) return null
  const d = Date.parse(iso)
  const h = Date.parse(ahora)
  if (!Number.isFinite(d) || !Number.isFinite(h)) return null
  return Math.ceil((d - h) / DIA_MS)
}

/* ---------------------------------------------------------------------------
   Estado de un compromiso
   --------------------------------------------------------------------------- */

/**
 * Estado que se enseña. `aceptada` con el plazo vencido se lee «caducada» sin
 * necesidad de que nadie la toque: el reloj decide, como en `estadoVisible`.
 */
export function estadoParticipacion(
  p: Participacion,
  ahora: string
): EstadoParticipacion {
  if (p.estado !== "aceptada") return p.estado
  const dias = diasHasta(p.venceEn, ahora)
  return dias !== null && dias < 0 ? "caducada" : "aceptada"
}

/** Bloquea cerrar la campaña: hay trabajo vivo o dinero en el aire. */
export const bloqueaCierre = (p: Participacion, ahora: string) => {
  const e = estadoParticipacion(p, ahora)
  return e === "aceptada" || e === "entregada" || e === "en-disputa"
}

export interface Pendientes {
  /** Aceptadas con plazo por delante: el clipero está trabajando. */
  aceptadas: Participacion[]
  /** Entregadas sin revisar: la deuda es de la agencia. */
  sinRevisar: Participacion[]
  /** En manos del admin. */
  enDisputa: Participacion[]
  total: number
}

/** Lo que impide finalizar una campaña, separado por de quién es la pelota. */
export function pendientesDe(
  campanaId: string,
  participaciones: readonly Participacion[],
  ahora: string
): Pendientes {
  const mias = participaciones.filter((p) => p.campanaId === campanaId)
  const aceptadas = mias.filter((p) => estadoParticipacion(p, ahora) === "aceptada")
  const sinRevisar = mias.filter((p) => estadoParticipacion(p, ahora) === "entregada")
  const enDisputa = mias.filter((p) => estadoParticipacion(p, ahora) === "en-disputa")
  return {
    aceptadas,
    sinRevisar,
    enDisputa,
    total: aceptadas.length + sinRevisar.length + enDisputa.length,
  }
}

/** Sin nada pendiente, la campaña puede cerrarse. */
export const puedeFinalizar = (p: Pendientes) => p.total === 0

/** Plazas libres; `null` cuando la campaña no pone cupo. */
export function plazasLibres(
  c: CampanaParticipable,
  participaciones: readonly Participacion[],
  ahora: string
): number | null {
  if (c.plazas == null) return null
  const ocupadas = participaciones.filter((p) => {
    if (p.campanaId !== c.id) return false
    const e = estadoParticipacion(p, ahora)
    return e === "aceptada" || e === "entregada" || e === "cumplida" || e === "en-disputa"
  }).length
  return Math.max(0, c.plazas - ocupadas)
}

/** La participación viva de un clipero en una campaña, si la tiene. */
export const participacionDe = (
  participaciones: readonly Participacion[],
  campanaId: string,
  userId: string
) =>
  participaciones.find(
    (p) =>
      p.campanaId === campanaId &&
      p.userId === userId &&
      p.estado !== "retirada" &&
      p.estado !== "rechazada"
  ) ?? null

/** Puede entregar su clip: está dentro y en plazo, o la campaña es abierta. */
export function puedeEntregar(
  c: CampanaParticipable,
  participacion: Participacion | null,
  ahora: string
): boolean {
  if (modoDe(c) === "abierta") return true
  if (!participacion) return false
  return estadoParticipacion(participacion, ahora) === "aceptada"
}

/* ---------------------------------------------------------------------------
   Validación de la solicitud (códigos, nunca frases)
   --------------------------------------------------------------------------- */

export const CODIGOS_SOLICITUD = [
  "yaDentro",
  "inscripcionesCerradas",
  "campanaVencida",
  "sinPlazas",
  "notaLarga",
  "sinRedes",
  "sinPais",
  "planInsuficiente",
] as const
export type CodigoSolicitud = (typeof CODIGOS_SOLICITUD)[number]

export interface ErrorSolicitud {
  code: CodigoSolicitud
  bloquea: boolean
  values?: Record<string, number>
}

/** Lo que impide (o desaconseja) solicitar. */
export function validarSolicitud(
  c: CampanaParticipable,
  datos: {
    participacion: Participacion | null
    participaciones: readonly Participacion[]
    nota?: string
    redes: readonly string[]
    pais: string | null
    /** Plan de quien solicita: entrar en una campaña es del plan Creador en adelante. */
    plan: PlanRef
  },
  ahora: string
): ErrorSolicitud[] {
  const errores: ErrorSolicitud[] = []
  if (datos.participacion) errores.push({ code: "yaDentro", bloquea: true })
  if (!inscripcionesAbiertas(c))
    errores.push({ code: "inscripcionesCerradas", bloquea: true })
  if (Date.parse(c.fin) < Date.parse(ahora))
    errores.push({ code: "campanaVencida", bloquea: true })
  const libres = plazasLibres(c, datos.participaciones, ahora)
  if (libres === 0) errores.push({ code: "sinPlazas", bloquea: true })
  if ((datos.nota?.length ?? 0) > NOTA_MAX)
    errores.push({ code: "notaLarga", bloquea: true, values: { max: NOTA_MAX } })
  if (!datos.redes.length) errores.push({ code: "sinRedes", bloquea: true })
  if (!datos.pais) errores.push({ code: "sinPais", bloquea: true })
  // El plan, el último de la lista a propósito: primero se cuenta lo que no se
  // arregla pagando, para no vender una mejora que no desbloquearía nada
  if (!puedeParticipar(datos.plan))
    errores.push({ code: "planInsuficiente", bloquea: true })
  return errores
}

/* ---------------------------------------------------------------------------
   Transiciones: cada una devuelve una participación nueva
   --------------------------------------------------------------------------- */

export function solicitar(datos: {
  id: string
  campanaId: string
  userId: string
  clipero: string
  nota?: string
  en: string
}): Participacion {
  return {
    id: datos.id,
    campanaId: datos.campanaId,
    userId: datos.userId,
    clipero: datos.clipero,
    estado: "solicitada",
    solicitadaEn: datos.en,
    nota: datos.nota?.slice(0, NOTA_MAX) || undefined,
  }
}

/** La agencia acepta: empieza a correr el plazo. */
export const aceptar = (
  p: Participacion,
  c: CampanaParticipable,
  en: string
): Participacion => ({
  ...p,
  estado: "aceptada",
  decididaEn: en,
  venceEn: minimo(sumarDias(en, plazoDe(c)), c.fin),
})

/** El plazo nunca se sale de la campaña: si la campaña acaba antes, manda ella. */
const minimo = (a: string, b: string) => (Date.parse(a) <= Date.parse(b) ? a : b)

export const rechazar = (
  p: Participacion,
  motivo: MotivoDecision,
  en: string
): Participacion => ({ ...p, estado: "rechazada", motivo, decididaEn: en })

/** El clipero entrega su clip: la pelota pasa a la agencia. */
export const entregar = (p: Participacion, envioId: string): Participacion => ({
  ...p,
  estado: "entregada",
  envioId,
})

/**
 * Qué compromiso deja un clip entregado, según cómo se entre en la campaña.
 *
 * Con solicitud, hay que tener uno aceptado: se marca entregado y la pelota
 * pasa a la agencia. En una campaña abierta no hay solicitud previa —entregar
 * ES el compromiso— y nace ya entregado (§2.1 del ciclo).
 *
 * Devolver la decisión en vez de tomarla dentro del hook es lo que permite que
 * el almacén sepa si tiene que PARCHEAR uno que ya existe o AÑADIR uno nuevo:
 * son dos escrituras distintas y confundirlas dejaba el compromiso sin tocar.
 */
export type CompromisoAlEntregar =
  | { tipo: "marcar"; participacion: Participacion }
  | { tipo: "crear"; participacion: Participacion }
  | { tipo: "ninguno" }

export function compromisoAlEntregar(datos: {
  participacion: Participacion | null
  campana: Pick<CampanaParticipable, "modoParticipacion">
  envioId: string
  /** Para la campaña abierta, que crea el compromiso en el momento. */
  nuevo: { id: string; campanaId: string; userId: string; clipero: string; en: string }
}): CompromisoAlEntregar {
  const { participacion, campana, envioId, nuevo } = datos
  if (participacion && participacion.estado === "aceptada")
    return { tipo: "marcar", participacion: entregar(participacion, envioId) }
  if (participacion) return { tipo: "ninguno" }
  if (modoDe(campana) !== "abierta") return { tipo: "ninguno" }
  return {
    tipo: "crear",
    participacion: {
      id: nuevo.id,
      campanaId: nuevo.campanaId,
      userId: nuevo.userId,
      clipero: nuevo.clipero,
      estado: "entregada",
      solicitadaEn: nuevo.en,
      decididaEn: nuevo.en,
      envioId,
    },
  }
}

/** Clip aprobado: el compromiso queda cumplido. */
export const cumplir = (p: Participacion): Participacion => ({ ...p, estado: "cumplida" })

/** El clipero se baja antes de entregar. Sin penalización: libera la plaza. */
export const retirar = (p: Participacion, en: string): Participacion => ({
  ...p,
  estado: "retirada",
  decididaEn: en,
})

/** Venció el plazo sin entrega: se escribe lo que el reloj ya decía. */
export const caducar = (p: Participacion, en: string): Participacion => ({
  ...p,
  estado: "caducada",
  motivo: "otro",
  decididaEn: en,
})

/* ---------------------------------------------------------------------------
   Disputas
   --------------------------------------------------------------------------- */

/** Quién puede reclamar y por qué, ahora mismo. */
export function disputasPosibles(
  p: Participacion,
  envio: Pick<Envio, "estado"> | null,
  quien: "clipero" | "agencia",
  ahora: string
): MotivoDisputa[] {
  if (p.disputaId) return []
  const estado = estadoParticipacion(p, ahora)
  if (quien === "agencia") {
    const motivos: MotivoDisputa[] = []
    if (estado === "caducada") motivos.push("no-entrego")
    if (estado === "entregada" || estado === "cumplida") motivos.push("contenido")
    return motivos
  }
  const motivos: MotivoDisputa[] = []
  if (estado === "entregada") {
    const dias = diasHasta(p.venceEn, ahora)
    if (dias === null || -dias >= DIAS_SIN_REVISAR || sinRevisarDesde(p, ahora))
      motivos.push("no-revisa")
  }
  if (estado === "rechazada") motivos.push("rechazo-injusto")
  if (envio?.estado === "aprobado") motivos.push("no-paga")
  return motivos
}

/** Días desde que entregó sin que nadie decida. */
function sinRevisarDesde(p: Participacion, ahora: string): boolean {
  const dias = diasHasta(p.solicitadaEn, ahora)
  return dias !== null && -dias >= DIAS_SIN_REVISAR
}

export function abrirDisputa(datos: {
  id: string
  participacion: Participacion
  abrePor: "clipero" | "agencia"
  motivo: MotivoDisputa
  detalle?: string
  en: string
}): { disputa: Disputa; participacion: Participacion } {
  const disputa: Disputa = {
    id: datos.id,
    participacionId: datos.participacion.id,
    campanaId: datos.participacion.campanaId,
    abrePor: datos.abrePor,
    motivo: datos.motivo,
    detalle: datos.detalle,
    estado: "abierta",
    abiertaEn: datos.en,
  }
  return {
    disputa,
    participacion: {
      ...datos.participacion,
      estado: "en-disputa",
      disputaId: datos.id,
    },
  }
}

/**
 * El admin dicta. Es lo único que desbloquea una participación en disputa, y
 * cada laudo la deja en el estado que corresponde:
 * - `liberar-plaza` y `sin-pago` la cierran (caducada / rechazada).
 * - `dar-prorroga` la devuelve a aceptada con plazo nuevo.
 * - `pagar-clipero` la da por cumplida.
 */
/**
 * Qué laudos se le pueden ofrecer al admin en esta disputa.
 *
 * «Pagar al clipero» solo si hay clip entregado: el dinero lo reparte
 * `liquidar` entre los ENVÍOS aprobados, así que sin envío ese laudo no puede
 * pagar nada por mucho que lo prometa su descripción.
 */
export const laudosPosibles = (p: Pick<Participacion, "envioId">): Laudo[] =>
  LAUDOS.filter((l) => l !== "pagar-clipero" || Boolean(p.envioId))

/** Lo que el laudo le hace al clip entregado, si lo hay. */
export interface CambioEnvio {
  id: string
  estado: EstadoEnvio
}

export function resolverDisputa(
  d: Disputa,
  p: Participacion,
  laudo: Laudo,
  datos: { notaAdmin?: string; en: string; prorrogaDias?: number }
): { disputa: Disputa; participacion: Participacion; envio?: CambioEnvio } {
  const disputa: Disputa = {
    ...d,
    estado: "resuelta",
    laudo,
    notaAdmin: datos.notaAdmin,
    resueltaEn: datos.en,
  }
  const base: Participacion = { ...p, disputaId: undefined }
  switch (laudo) {
    case "liberar-plaza":
      return {
        disputa,
        participacion: { ...base, estado: "caducada", decididaEn: datos.en },
      }
    case "dar-prorroga":
      return {
        disputa,
        participacion: {
          ...base,
          estado: "aceptada",
          venceEn: sumarDias(datos.en, datos.prorrogaDias ?? PLAZO_ENTREGA_DIAS),
        },
      }
    /**
     * El laudo que paga tiene que TOCAR EL ENVÍO. Dejar la participación en
     * «cumplida» no movía un céntimo: quien reparte el presupuesto es
     * `liquidar`, y solo mira los envíos aprobados. El texto del laudo decía
     * «el clip entra en la liquidación de la campaña» y no entraba.
     */
    case "pagar-clipero":
      return {
        disputa,
        participacion: { ...base, estado: "cumplida" },
        envio: p.envioId ? { id: p.envioId, estado: "aprobado" } : undefined,
      }
    case "sin-pago":
      return {
        disputa,
        participacion: {
          ...base,
          estado: "rechazada",
          motivo: "otro",
          decididaEn: datos.en,
        },
        envio: p.envioId ? { id: p.envioId, estado: "rechazado" } : undefined,
      }
  }
}

/* ---------------------------------------------------------------------------
   El perfil que viaja con la solicitud (§2.1.b)
   --------------------------------------------------------------------------- */

export interface RedDelPerfil {
  red: SocialId
  handle?: string
  /** Tramo, nunca la cifra exacta de una cuenta ajena. */
  tramo?: TramoSeguidores
}

export interface PerfilParaAgencia {
  nombre: string
  pais: CountryCode | "otro" | null
  idiomas: IdiomaAudiencia[]
  redes: RedDelPerfil[]
  temas: Vertical[]
  experiencia?: Experiencia
  disponibilidad?: Disponibilidad
  /** Historial dentro de Clipealo: lo único verificable por nosotros. */
  historial: {
    aprobados: number
    enviados: number
    /** 0 a 100; `null` sin envíos. */
    tasaAprobacion: number | null
    /** Mediana de vistas de sus clips aprobados; `null` sin datos. */
    vistasMedianas: number | null
  }
  nota?: string
}

/**
 * Lo que la agencia ve para decidir, y solo eso: ni correo, ni wallet, ni a qué
 * otras campañas se presentó, ni su fandom uno por uno. Función pura.
 */
export function perfilParaAgencia(
  cuenta: Pick<Cuenta, "nombre" | "pais" | "idiomas" | "clipero">,
  envios: readonly Envio[],
  nota?: string
): PerfilParaAgencia {
  const cl = cuenta.clipero
  const cuentas = cl.cuentas ?? []
  const redes: RedDelPerfil[] = (cl.redes ?? [])
    .filter((r): r is SocialId => esId(SOCIAL_IDS, r))
    .map((red) => {
      const c = cuentas.find((x) => x.red === red)
      return {
        red,
        handle: c?.handle,
        tramo:
          c?.seguidoresMedidos != null
            ? tramoSeguidoresDe(c.seguidoresMedidos)
            : c?.tramoDeclarado,
      }
    })

  const aprobados = envios.filter((e) => e.estado === "aprobado")
  // Solo los medidos: la mediana de vistas de quien envió por enlace no existe,
  // y meter ceros la falsearía hacia abajo
  const vistas = aprobados
    .filter((e) => !sinMedir(e))
    .map(vistasDe)
    .sort((a, b) => a - b)
  return {
    nombre: cuenta.nombre,
    pais: cuenta.pais ?? null,
    idiomas: [...cuenta.idiomas],
    redes,
    temas: Array.isArray(cl.verticales) ? [...cl.verticales] : [],
    experiencia: cl.experiencia,
    disponibilidad: cl.disponibilidad,
    historial: {
      aprobados: aprobados.length,
      enviados: envios.length,
      tasaAprobacion: envios.length
        ? Math.round((aprobados.length / envios.length) * 100)
        : null,
      vistasMedianas: vistas.length ? mediana(vistas) : null,
    },
    nota: nota?.slice(0, NOTA_MAX) || undefined,
  }
}

const mediana = (ordenadas: number[]) => {
  const m = Math.floor(ordenadas.length / 2)
  return ordenadas.length % 2
    ? ordenadas[m]
    : Math.round((ordenadas[m - 1] + ordenadas[m]) / 2)
}

/* ---------------------------------------------------------------------------
   Semillas de la demo
   --------------------------------------------------------------------------- */

/** El «hoy» de la demo de campañas (`HOY_CAMPANAS`), copiado para no importarlo. */
const HOY = AHORA_DEMO

/**
 * Lo que la demo enseña desde el primer momento, sin azar y anclado al «hoy» de
 * las campañas: una solicitud esperando decisión de la agencia, un compromiso
 * de la cuenta demo con el plazo corriendo, otro que ya entregó y está sin
 * revisar (la deuda es de la agencia) y uno caducado que da pie a la disputa.
 */
export const participacionesSemilla: readonly Participacion[] = [
  {
    id: "par_dem_01",
    campanaId: "cmp_liga",
    userId: "u_ana",
    clipero: "Ana Ruiz",
    estado: "aceptada",
    solicitadaEn: sumarDias(HOY, -2),
    decididaEn: sumarDias(HOY, -1),
    venceEn: sumarDias(HOY, 6),
    nota: "Llevo dos años clipeando fútbol; publico en TikTok y YouTube el mismo día.",
  },
  {
    id: "par_dem_02",
    campanaId: "cmp_bingo",
    userId: "u_ana",
    clipero: "Ana Ruiz",
    // Su envío («env_ana_01») está aprobado, así que el compromiso está cumplido:
    // con «entregada» la misma pantalla decía «en revisión» arriba y «Aprobado ·
    // US$ 80,00» dos bloques más abajo
    estado: "cumplida",
    solicitadaEn: sumarDias(HOY, -9),
    decididaEn: sumarDias(HOY, -8),
    venceEn: sumarDias(HOY, -1),
    envioId: "env_ana_01",
  },
  {
    // Ana tiene un clip aprobado en «Casi Casi» (env_ana_00c): sin esta
    // participación, la campaña le pedía entrar mientras el ranking la enseñaba
    // cobrando
    id: "par_dem_08",
    campanaId: "cmp_casi",
    userId: "u_ana",
    clipero: "Ana Ruiz",
    estado: "cumplida",
    solicitadaEn: sumarDias(HOY, -36),
    decididaEn: sumarDias(HOY, -35),
    venceEn: sumarDias(HOY, -28),
    envioId: "env_ana_00c",
  },
  /* Las de «Ámbar: Tra Tra Tra», la campaña de la cuenta demo: es lo que ve
     cuando se pone el perfil de agencia. Dos por decidir, una trabajando y una
     entregada sin revisar, que es lo que impide cerrar la campaña. */
  {
    id: "par_dem_03",
    campanaId: "cmp_anmi",
    userId: "u_bruno",
    clipero: "Bruno Salas",
    estado: "solicitada",
    solicitadaEn: sumarDias(HOY, -1),
    nota: "Hago ediciones de baile en vertical, sin música con derechos encima.",
  },
  {
    id: "par_dem_04",
    campanaId: "cmp_anmi",
    userId: "u_lucia",
    clipero: "Lucía Peña",
    estado: "solicitada",
    solicitadaEn: HOY,
  },
  {
    id: "par_dem_05",
    campanaId: "cmp_anmi",
    userId: "u_kai",
    clipero: "Kai Moreno",
    estado: "aceptada",
    solicitadaEn: sumarDias(HOY, -5),
    decididaEn: sumarDias(HOY, -4),
    // Le quedan tres días: mientras corra, la campaña no puede cerrarse
    venceEn: sumarDias(HOY, 3),
  },
  {
    id: "par_dem_06",
    campanaId: "cmp_anmi",
    userId: "u_nora",
    clipero: "Nora Vidal",
    estado: "entregada",
    solicitadaEn: sumarDias(HOY, -9),
    decididaEn: sumarDias(HOY, -8),
    venceEn: sumarDias(HOY, -1),
    envioId: "env_nora_01",
  },
  {
    id: "par_dem_07",
    campanaId: "cmp_liga",
    userId: "u_kai",
    clipero: "Kai Moreno",
    estado: "aceptada",
    solicitadaEn: sumarDias(HOY, -12),
    decididaEn: sumarDias(HOY, -11),
    // Venció hace cuatro días sin entregar: aquí es donde la agencia reclama
    venceEn: sumarDias(HOY, -4),
  },
  /* Las dos que ya están en manos del admin. No son de la cuenta demo: el
     backoffice arbitra para toda la plataforma, y sin ellas la cola nacía vacía
     y nunca enseñaba que ordena por quién lleva más esperando. */
  {
    id: "par_dem_09",
    campanaId: "cmp_liga",
    userId: "u_nora",
    clipero: "Nora Vidal",
    estado: "en-disputa",
    solicitadaEn: sumarDias(HOY, -20),
    decididaEn: sumarDias(HOY, -19),
    venceEn: sumarDias(HOY, -12),
    disputaId: "dis_dem_01",
  },
  {
    id: "par_dem_10",
    campanaId: "cmp_arena",
    userId: "u_lucia",
    clipero: "Lucía Peña",
    estado: "en-disputa",
    solicitadaEn: sumarDias(HOY, -4),
    decididaEn: sumarDias(HOY, -3),
    motivo: "no-encaja-tema",
    nota: "Cliperoeo torneos de Arena Nova desde la temporada pasada.",
    disputaId: "dis_dem_02",
  },
]

/**
 * Lo que el admin se encuentra al entrar en la cola. Una lleva ocho días
 * esperando y la otra dos: el orden de la cola y el KPI «la que más espera» solo
 * significan algo si hay antigüedades distintas.
 */
export const disputasSemilla: readonly Disputa[] = [
  {
    id: "dis_dem_01",
    participacionId: "par_dem_09",
    campanaId: "cmp_liga",
    abrePor: "agencia",
    motivo: "no-entrego",
    detalle: "Aceptamos su solicitud y el plazo venció sin clip ni respuesta.",
    estado: "abierta",
    abiertaEn: sumarDias(HOY, -8),
  },
  {
    id: "dis_dem_02",
    participacionId: "par_dem_10",
    campanaId: "cmp_arena",
    abrePor: "clipero",
    motivo: "rechazo-injusto",
    detalle: "Clipeo Arena Nova desde hace meses y me rechazan por tema.",
    estado: "abierta",
    abiertaEn: sumarDias(HOY, -2),
  },
]

/**
 * Las respuestas del onboarding solo existen para la cuenta de esta demo, así
 * que los cliperos que piden entrar en «Ámbar» traen su ficha escrita aquí: sin
 * ella, la agencia tendría que decidir mirando una tarjeta vacía, que es
 * justamente lo que el producto quiere evitar. Con la API real esto lo devuelve
 * el servidor.
 */
export const PERFILES_DEMO: Record<
  string,
  Pick<Cuenta, "pais" | "idiomas"> & { clipero: Cuenta["clipero"] }
> = {
  u_bruno: {
    pais: "PE",
    idiomas: ["es"],
    clipero: {
      verticales: ["musica", "humor"],
      redes: ["tiktok", "instagram"],
      cuentas: [
        { red: "tiktok", handle: "@brunoedita", tramoDeclarado: "10k-100k" },
        { red: "instagram", handle: "@brunoedita", tramoDeclarado: "1k-10k" },
      ],
      experiencia: "clientes",
      disponibilidad: "10-20",
    } as Cuenta["clipero"],
  },
  u_lucia: {
    pais: "ES",
    idiomas: ["es", "en"],
    clipero: {
      verticales: ["musica", "gaming"],
      redes: ["tiktok", "youtube"],
      cuentas: [{ red: "tiktok", handle: "@lupenia", seguidoresMedidos: 4200 }],
      experiencia: "regular",
      disponibilidad: "3-10",
    } as Cuenta["clipero"],
  },
  u_kai: {
    pais: "MX",
    idiomas: ["es"],
    clipero: {
      verticales: ["musica"],
      redes: ["tiktok"],
      cuentas: [{ red: "tiktok", handle: "@kaimoreno", tramoDeclarado: "100k-1m" }],
      experiencia: "clientes",
      disponibilidad: "20-plus",
    } as Cuenta["clipero"],
  },
  u_nora: {
    pais: "CO",
    idiomas: ["es"],
    clipero: {
      verticales: ["musica", "moda-belleza"],
      redes: ["instagram", "tiktok"],
      cuentas: [{ red: "instagram", handle: "@noravidal", tramoDeclarado: "10k-100k" }],
      experiencia: "diversion",
      disponibilidad: "lt-3",
    } as Cuenta["clipero"],
  },
}
