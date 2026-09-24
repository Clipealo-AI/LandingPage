import type { Locale } from "@/i18n/routing"
import type { TipoCuenta } from "@/lib/auth"
import {
  PLATAFORMAS_DIRECTO,
  type IdiomaAudiencia,
  type PerfilCanal,
  type PlataformaDirecto,
  type PublicoCanal,
} from "@/lib/ajustes"
import {
  LIMITES,
  topePorVideo,
  videosAlTope,
  vistasCompradas,
  vistasHastaTope,
  type BorradorCampana,
  type Perfil,
} from "@/lib/campanas"
import type { CountryCode } from "@/lib/countries"
import type { Creador, CreadorId } from "@/lib/creadores"
import {
  UMBRAL_PUBLICO,
  vigente,
  type Finalidad,
  type OrigenConsentimiento,
  type RegistroConsentimiento,
} from "@/lib/privacidad"
import { SOCIAL_IDS, type SocialId } from "@/lib/social"
import {
  AUN_NO_SE,
  NO_TRANSMITO,
  SIN_CUENTA,
  TAXONOMIA_VERSION,
  VERTICALES,
  cpmMedioReferencia,
  tieneVarianteCanal,
  tramoPresupuestoDe,
  type ComoNosConociste,
  type Disponibilidad,
  type DuracionDirecto,
  type EtiquetaSeguridad,
  type Experiencia,
  type FormatoDirecto,
  type FrecuenciaDirecto,
  type GeneroMusica,
  type Herramienta,
  type InteresCampanaPropia,
  type JuegoId,
  type LigaId,
  type Motivacion,
  type MotivoPausa,
  type ObjetivoUso,
  type PlataformaDirectoOnboarding,
  type RedPublicacion,
  type Rol,
  type Sector,
  type TipoCuentaPublicacion,
  type TipoOrganizacion,
  type TramoEspectadores,
  type TramoPresupuesto,
  type TramoSeguidores,
  type Vertical,
} from "@/lib/taxonomia"

/**
 * Onboarding «Tu primer corte»: modelo de datos y reglas puras.
 *
 * Nada de aquí lee la hora, `window` ni `localStorage`, ni devuelve frases: las
 * fechas llegan de los manejadores, las validaciones devuelven códigos
 * (`onboarding.errors.<code>`) y las etiquetas de los catálogos están en
 * `taxonomy.json`. El estado vive en `hooks/use-cuenta.ts`, que reexporta estos
 * tipos. La recomendación está en `lib/recomendacion.ts`.
 */

export const ONBOARDING_VERSION = 1

/* ---------------------------------------------------------------------------
   Tipos (§3.7)
   --------------------------------------------------------------------------- */

export type Fuente = "declarado" | "medido" | "inferido"
export interface MetaDato {
  fuente: Fuente
  /** ISO, leído en el manejador. */
  en: string
  confianza?: "baja"
}

export const PASOS_CLIPERO = [
  "cuenta",
  "objetivo",
  "nichos",
  "fandom",
  "redes",
  "basicos",
  "directo",
  "canal",
  "render",
] as const
export type PasoClipero = (typeof PASOS_CLIPERO)[number]

export const PASOS_AGENCIA = [
  "cuenta",
  "tipo-org",
  "org",
  "promocion",
  "alcance",
  "render-agencia",
] as const
export type PasoAgencia = (typeof PASOS_AGENCIA)[number]

export type PasoId = PasoClipero | PasoAgencia

/** Todos los pasos, sin repetir: para `parseAsStringLiteral(PASOS)` de `?paso=`. */
export const PASOS = [
  "cuenta",
  "objetivo",
  "nichos",
  "fandom",
  "redes",
  "basicos",
  "directo",
  "canal",
  "render",
  "tipo-org",
  "org",
  "promocion",
  "alcance",
  "render-agencia",
] as const satisfies readonly PasoId[]

/** Tomas que se pueden saltar («Saltar esta toma»). */
export const PASOS_OPCIONALES = ["fandom"] as const satisfies readonly PasoId[]
/** El final de cada flujo: no cuenta como toma. */
export const PASOS_RENDER = [
  "render",
  "render-agencia",
] as const satisfies readonly PasoId[]

export const esPasoOpcional = (p: PasoId) =>
  (PASOS_OPCIONALES as readonly PasoId[]).includes(p)
export const esRender = (p: PasoId) => (PASOS_RENDER as readonly PasoId[]).includes(p)

export const ESTADOS_ONBOARDING = [
  "sin-empezar",
  "en-curso",
  "pospuesto",
  "completado",
] as const
export type EstadoOnboarding = (typeof ESTADOS_ONBOARDING)[number]

export type PaisResidencia = CountryCode | "otro"

export const FLUJOS_ONBOARDING = [
  "clipero",
  "agencia",
] as const satisfies readonly TipoCuenta[]
export type FlujoOnboarding = (typeof FLUJOS_ONBOARDING)[number]

export const MODOS_ONBOARDING = ["normal", "expres"] as const
export type ModoOnboarding = (typeof MODOS_ONBOARDING)[number]

/** Un creador que no está en el catálogo: queda en la cola `#pendientes` del admin. */
export interface CreadorPendiente {
  pendiente: true
  texto: string
  plataforma?: PlataformaDirecto
  handle?: string
  url?: string
}

export interface CuentaPublicacion {
  red: SocialId
  handle: string
  tipoCuenta?: TipoCuentaPublicacion
  /** Solo si no conecta la cuenta; se borra al medir. */
  tramoDeclarado?: TramoSeguidores
  seguidoresMedidos?: number
}

export interface RespuestasClipero {
  objetivo: ObjetivoUso
  verticales: Vertical[] | typeof AUN_NO_SE
  juegos: JuegoId[]
  subverticales: {
    ligas?: LigaId[]
    generos?: GeneroMusica[]
    formatos?: FormatoDirecto[]
  }
  creadoresFan: (CreadorId | CreadorPendiente)[]
  /** Derivado del fandom (`dimensionesDe`): nunca se pregunta. */
  plataformasQueVe: PlataformaDirecto[]
  redes: RedPublicacion[]
  cuentas: CuentaPublicacion[]
  experiencia: Experiencia
  disponibilidad: Disponibilidad
  motivaciones: Motivacion[]
  tolerancia: EtiquetaSeguridad[]
  herramientas: Herramienta[]
  motivoPausa: MotivoPausa
  comoNosConociste: { texto?: string; chips: ComoNosConociste[] }
}

export interface RespuestasCreador {
  plataformasDirecto: PlataformaDirectoOnboarding[]
  frecuencia: FrecuenciaDirecto
  duracion: DuracionDirecto
  verticalesCanal: Vertical[]
  enlaceCanal: { plataforma: PlataformaDirecto; handle: string; verificado: boolean }
  espectadores: TramoEspectadores
  interesCampanaPropia: InteresCampanaPropia
}

export interface RespuestasAgencia {
  tipoOrganizacion: TipoOrganizacion
  organizacion: string
  web: string
  dominioCoincide: boolean
  rol: Rol
  pais: PaisResidencia
  sector: Sector
  verticalesMaterial: Vertical[]
  creadorId?: CreadorId
  canal?: { plataforma: PlataformaDirecto; handle: string }
  redesObjetivo: SocialId[]
  paisesObjetivo: CountryCode[]
  idiomasObjetivo: IdiomaAudiencia[]
  contactoComercial: boolean
  comoNosConociste: { texto?: string; chips: ComoNosConociste[] }
  solicitudEnviadaEn?: string
}

/** Clave de `Cuenta.meta`: de dónde sale cada dato y cuándo se respondió. */
export type CampoId =
  | "tipo"
  | "mayorDeEdad"
  | "pais"
  | "idiomas"
  | `clipero.${keyof RespuestasClipero}`
  | `creador.${keyof RespuestasCreador}`
  | `agencia.${keyof RespuestasAgencia}`

export interface ProgresoOnboarding {
  version: number
  taxonomia: number
  flujo: FlujoOnboarding | null
  modo: ModoOnboarding
  estado: EstadoOnboarding
  pasoActual: PasoId | null
  pasosVistos: PasoId[]
  pasosRespondidos: PasoId[]
  pasosSaltados: PasoId[]
  /** Solo con la pestaña visible. */
  msPorPaso: Partial<Record<PasoId, number>>
  /** Tomas completadas a mano (métrica de «aprende la prisa»). */
  textoAcelerado: number
  animacionVista: boolean
  iniciadoEn: string | null
  completadoEn: string | null
  pospuestoEn: string | null
  pasoAbandono: PasoId | null
  celebrado: boolean
  celebradoAprobacion: boolean
}

/** Progreso de una cuenta nueva que aún no ha empezado. */
export const PROGRESO_VACIO: ProgresoOnboarding = {
  version: ONBOARDING_VERSION,
  taxonomia: TAXONOMIA_VERSION,
  flujo: null,
  modo: "normal",
  estado: "sin-empezar",
  pasoActual: null,
  pasosVistos: [],
  pasosRespondidos: [],
  pasosSaltados: [],
  msPorPaso: {},
  textoAcelerado: 0,
  animacionVista: false,
  iniciadoEn: null,
  completadoEn: null,
  pospuestoEn: null,
  pasoAbandono: null,
  celebrado: false,
  celebradoAprobacion: false,
}

export interface MicroPreguntas {
  ultimaEn: string | null
  /** id → ISO a partir del que puede volver a salir. */
  pospuestas: Record<string, string>
  descartadas: string[]
}

/** Estado de la cuenta de la demo (`hooks/use-cuenta.ts`, clave "clipealo-cuenta-v1"). */
export interface Cuenta {
  nombre: string
  correo: string
  tipo: TipoCuenta | null
  creadaEn: string | null
  mayorDeEdad: boolean
  verificado: boolean
  pais: PaisResidencia | null
  idiomas: IdiomaAudiencia[]
  /** Ajustes › Perfil lee y escribe aquí. */
  perfilCanal: PerfilCanal
  /** Ajustes › Público lee y escribe aquí. */
  publico: PublicoCanal
  clipero: Partial<RespuestasClipero>
  creador: Partial<RespuestasCreador>
  agencia: Partial<RespuestasAgencia>
  meta: Partial<Record<CampoId, MetaDato>>
  onboarding: ProgresoOnboarding
  consentimientos: RegistroConsentimiento[]
  microPreguntas: MicroPreguntas
  /**
   * Respuestas a las preguntas que el admin escribió desde el backoffice.
   *
   * id de la pregunta → opciones marcadas, tal cual las escribió quien las
   * creó. Va aparte y sin tipar porque no puede estar tipado: nadie sabía que
   * esas preguntas iban a existir. Lo tipado —las nueve de siempre— sigue
   * escribiendo en `clipero`, `creador` y `agencia`, que es donde lo leen
   * Ajustes, las campañas y la recomendación.
   */
  respuestasLibres: Record<string, string[]>
  borradorCampana: Partial<BorradorCampana> | null
}

/** Lo que viaja a la cola de agencias del admin (`hooks/use-campanas.ts`). */
export interface SolicitudAgenciaDatos extends Pick<
  RespuestasAgencia,
  | "tipoOrganizacion"
  | "organizacion"
  | "web"
  | "dominioCoincide"
  | "pais"
  | "sector"
  | "verticalesMaterial"
  | "creadorId"
  | "redesObjetivo"
  | "paisesObjetivo"
  | "idiomasObjetivo"
> {
  /**
   * Quién escribe, si lo dijo: el equipo comercial habla con una persona, no
   * con un dominio. Opcional, igual que la pregunta.
   */
  rol?: Rol
  nombre: string
  correo: string
  tramoPresupuesto: TramoPresupuesto
  enviadaEn: string
}

/** Eventos del onboarding (§7.7): solo ids y recuentos. */
export type EventoOnboarding =
  | {
      tipo: "onboarding_iniciado"
      flujo: FlujoOnboarding
      modo: ModoOnboarding
      origen: "registro" | "oauth" | "retomar" | "gate" | "invitacion"
      locale: Locale
    }
  | { tipo: "paso_visto"; paso: PasoId; ms_desde_inicio: number }
  | {
      tipo: "paso_respondido"
      paso: PasoId
      n_opciones: number
      ms_en_paso: number
      texto_acelerado: boolean
    }
  | { tipo: "paso_saltado"; paso: PasoId }
  | { tipo: "onboarding_pospuesto"; paso: PasoId }
  | { tipo: "onboarding_completado"; ms_total: number; saltados: PasoId[] }
  | {
      tipo: "consentimiento_cambiado"
      finalidad: Finalidad
      valor: boolean
      origen: OrigenConsentimiento
    }
  | {
      tipo: "solicitud_agencia"
      estado: "pendiente" | "aprobada" | "rechazada"
      regulado: boolean
      tramo: TramoPresupuesto
    }

/* ---------------------------------------------------------------------------
   Límites de las tomas
   --------------------------------------------------------------------------- */

export const LIMITES_ONBOARDING = {
  nichos: 5,
  juegos: 5,
  creadores: 5,
  idiomas: 3,
  temasCanal: 3,
  verticalesMaterial: 3,
  motivaciones: 2,
  objetivosCampana: 2,
  orgMin: 2,
  orgMax: 60,
  comoNosConocisteMax: 120,
} as const

/* ---------------------------------------------------------------------------
   Pasos
   --------------------------------------------------------------------------- */

export type CuentaParaPasos = Pick<Cuenta, "tipo" | "mayorDeEdad"> & {
  consentimientos: readonly RegistroConsentimiento[]
  onboarding?: Pick<ProgresoOnboarding, "pasosVistos">
}

/** La toma `cuenta` sale si falta el tipo, la mayoría de edad o los términos (OAuth). */
export const necesitaPasoCuenta = (c: CuentaParaPasos) =>
  !c.tipo || !c.mayorDeEdad || !vigente(c.consentimientos, "terminos")

/**
 * Pasos del flujo, con el render al final.
 *
 * - Agencia: tipo-org · org · promocion · alcance · render-agencia.
 * - Clipero exprés (invitación): redes · basicos · render.
 * - Clipero: objetivo y, según el objetivo, nichos · fandom (campañas, ambos o
 *   aún sin responder) o directo · canal (mis videos); luego redes · basicos · render.
 * - `cuenta` va delante si hace falta, o si ya se vio (así el número de toma no
 *   cambia al completarla).
 * - Sin flujo ni tipo se asume clipero: el total se recalcula al elegir.
 */
export function pasosDe(
  flujo: FlujoOnboarding | null | undefined,
  objetivo: ObjetivoUso | null | undefined,
  modo: ModoOnboarding,
  cuenta: CuentaParaPasos
): PasoId[] {
  const pasos: PasoId[] =
    necesitaPasoCuenta(cuenta) || cuenta.onboarding?.pasosVistos.includes("cuenta")
      ? ["cuenta"]
      : []
  const f = flujo ?? cuenta.tipo ?? "clipero"
  if (f === "agencia")
    return [...pasos, "tipo-org", "org", "promocion", "alcance", "render-agencia"]
  // El exprés son dos tomas por diseño: la de la cuenta solo entra si de verdad
  // falta algo, nunca por haberla visto ya en otro momento
  if (modo === "expres")
    return [
      ...(necesitaPasoCuenta(cuenta) ? (["cuenta"] as PasoId[]) : []),
      "redes",
      "basicos",
      "render",
    ]
  const rama: PasoId[] =
    objetivo === "mis-videos" ? ["directo", "canal"] : ["nichos", "fandom"]
  return [...pasos, "objetivo", ...rama, "redes", "basicos", "render"]
}

export function siguientePaso(pasos: readonly PasoId[], actual: PasoId): PasoId | null {
  const i = pasos.indexOf(actual)
  return i >= 0 && i < pasos.length - 1 ? pasos[i + 1] : null
}

export function pasoAnterior(pasos: readonly PasoId[], actual: PasoId): PasoId | null {
  const i = pasos.indexOf(actual)
  return i > 0 ? pasos[i - 1] : null
}

/** Número de toma (1…) de un paso; el render no es toma y devuelve `null`. */
export function numeroToma(pasos: readonly PasoId[], paso: PasoId): number | null {
  if (esRender(paso)) return null
  const i = pasos.filter((p) => !esRender(p)).indexOf(paso)
  return i >= 0 ? i + 1 : null
}

export const totalTomas = (pasos: readonly PasoId[]) =>
  pasos.filter((p) => !esRender(p)).length

/**
 * Se puede abrir `?paso=` si está en el flujo y todas las tomas obligatorias
 * anteriores son válidas (las opcionales no bloquean).
 */
export function pasoPermitido(
  paso: PasoId,
  pasos: readonly PasoId[],
  respuestas: RespuestasToma
): boolean {
  const i = pasos.indexOf(paso)
  if (i < 0) return false
  return pasos.slice(0, i).every((p) => esPasoOpcional(p) || tomaValida(p, respuestas))
}

/** Destino de cada rama al terminar o posponer (§2.9). `next` seguro manda: lo decide el flujo. */
export function destinoDeRama(
  flujo: FlujoOnboarding | null | undefined,
  objetivo: ObjetivoUso | null | undefined
): { pathname: "/campanas" | "/subir" | "/dashboard"; query?: { orden: "para-ti" } } {
  if (flujo === "agencia") return { pathname: "/campanas" }
  if (objetivo === "campanas")
    return { pathname: "/campanas", query: { orden: "para-ti" } }
  if (objetivo === "mis-videos") return { pathname: "/subir" }
  return { pathname: "/dashboard" }
}

/* ---------------------------------------------------------------------------
   Validación (§5.13): códigos, nunca frases
   --------------------------------------------------------------------------- */

/** Códigos de `validarToma`. Texto en `onboarding.errors.<code>`. */
export const CODIGOS_ERROR_TOMA = [
  "sinTipo",
  "sinMayorEdad",
  "sinTerminos",
  "sinObjetivo",
  "sinNichos",
  "sinRedes",
  "sinPais",
  "sinIdiomas",
  "maxIdiomas",
  "sinPlataformas",
  "sinFrecuencia",
  "sinTemaCanal",
  "enlaceNoReconocido",
  "sinTipoOrg",
  "orgCorto",
  "orgLargo",
  "webNoValida",
  "sinSector",
  "sinCanal",
  "sinPaises",
  "limiteElegidos",
] as const
export type CodigoErrorToma = (typeof CODIGOS_ERROR_TOMA)[number]

/** Todos los errores del onboarding: los de las tomas y los que decide la interfaz. */
export const CODIGOS_ERROR_ONBOARDING = [
  ...CODIGOS_ERROR_TOMA,
  "guardadoFallido",
  "solicitudFallida",
  "sugerenciasFallidas",
] as const
export type CodigoErrorOnboarding = (typeof CODIGOS_ERROR_ONBOARDING)[number]

/** Campo al que llevar el foco. */
export type CampoToma =
  | "tipo"
  | "mayorDeEdad"
  | "terminos"
  | "objetivo"
  | "verticales"
  | "juegos"
  | "creadoresFan"
  | "redes"
  | "pais"
  | "idiomas"
  | "plataformasDirecto"
  | "frecuencia"
  | "verticalesCanal"
  | "enlaceCanal"
  | "tipoOrganizacion"
  | "organizacion"
  | "web"
  /** Opcional: no bloquea, pero el campo existe para su etiqueta y su foco. */
  | "rol"
  | "sector"
  | "verticalesMaterial"
  | "canal"
  | "redesObjetivo"
  | "paisesObjetivo"
  | "idiomasObjetivo"

export type ErrorToma =
  | {
      code: "orgCorto" | "orgLargo"
      campo: CampoToma
      values: { min: number; max: number }
      bloquea: true
    }
  | {
      /** Informativos: se anuncian en la región viva y no impiden continuar. */
      code: "limiteElegidos" | "maxIdiomas"
      campo: CampoToma
      values: { max: number }
      bloquea: false
    }
  | {
      code: Exclude<
        CodigoErrorToma,
        "orgCorto" | "orgLargo" | "limiteElegidos" | "maxIdiomas"
      >
      campo: CampoToma
      values?: undefined
      bloquea: true
    }

/**
 * Lo que valida una toma. Una `Cuenta` completa vale; en un borrador, pasa los
 * consentimientos que se van a registrar (`registrar(...)`) para la toma `cuenta`.
 */
export type RespuestasToma = Partial<
  Pick<Cuenta, "tipo" | "mayorDeEdad" | "pais" | "idiomas">
> & {
  consentimientos?: readonly RegistroConsentimiento[]
  clipero?: Partial<RespuestasClipero>
  creador?: Partial<RespuestasCreador>
  agencia?: Partial<RespuestasAgencia>
}

/** Texto crudo de los campos de enlace, antes de reconocerlo. */
export interface TextosToma {
  /** Toma `canal` del creador (opcional). */
  enlaceCanal?: string
  /** Variante streamer de `promocion` (obligatorio). */
  canal?: string
}

export function validarToma(
  paso: PasoId,
  r: RespuestasToma,
  textos: TextosToma = {}
): ErrorToma[] {
  const e: ErrorToma[] = []
  const falta = (
    code: Exclude<
      CodigoErrorToma,
      "orgCorto" | "orgLargo" | "limiteElegidos" | "maxIdiomas"
    >,
    campo: CampoToma
  ) => e.push({ code, campo, bloquea: true })
  const limite = (n: number, max: number, campo: CampoToma) => {
    if (n > max)
      e.push({ code: "limiteElegidos", campo, values: { max }, bloquea: false })
  }
  const c = r.clipero ?? {}
  const cr = r.creador ?? {}
  const a = r.agencia ?? {}
  const L = LIMITES_ONBOARDING

  switch (paso) {
    case "cuenta":
      if (!r.tipo) falta("sinTipo", "tipo")
      if (!r.mayorDeEdad) falta("sinMayorEdad", "mayorDeEdad")
      if (!vigente(r.consentimientos ?? [], "terminos")) falta("sinTerminos", "terminos")
      break
    case "objetivo":
      if (!c.objetivo) falta("sinObjetivo", "objetivo")
      break
    case "nichos":
      if (c.verticales !== AUN_NO_SE && !c.verticales?.length)
        falta("sinNichos", "verticales")
      if (Array.isArray(c.verticales)) limite(c.verticales.length, L.nichos, "verticales")
      limite(c.juegos?.length ?? 0, L.juegos, "juegos")
      break
    case "fandom":
      limite(c.creadoresFan?.length ?? 0, L.creadores, "creadoresFan")
      break
    case "redes":
      if (!c.redes?.length) falta("sinRedes", "redes")
      break
    case "basicos":
      if (!r.pais) falta("sinPais", "pais")
      if (!r.idiomas?.length) falta("sinIdiomas", "idiomas")
      else if (r.idiomas.length > L.idiomas)
        e.push({
          code: "maxIdiomas",
          campo: "idiomas",
          values: { max: L.idiomas },
          bloquea: false,
        })
      break
    case "directo": {
      const plataformas = cr.plataformasDirecto ?? []
      if (!plataformas.length) falta("sinPlataformas", "plataformasDirecto")
      if (plataformas.some((p) => p !== NO_TRANSMITO) && !cr.frecuencia)
        falta("sinFrecuencia", "frecuencia")
      break
    }
    case "canal":
      if (!cr.verticalesCanal?.length) falta("sinTemaCanal", "verticalesCanal")
      limite(cr.verticalesCanal?.length ?? 0, L.temasCanal, "verticalesCanal")
      if (textos.enlaceCanal?.trim() && !analizarEnlaceCanal(textos.enlaceCanal))
        falta("enlaceNoReconocido", "enlaceCanal")
      break
    case "tipo-org":
      if (!a.tipoOrganizacion) falta("sinTipoOrg", "tipoOrganizacion")
      break
    case "org": {
      const nombre = a.organizacion?.trim() ?? ""
      const values = { min: L.orgMin, max: L.orgMax }
      if (nombre.length < L.orgMin)
        e.push({ code: "orgCorto", campo: "organizacion", values, bloquea: true })
      else if (nombre.length > L.orgMax)
        e.push({ code: "orgLargo", campo: "organizacion", values, bloquea: true })
      if (!normalizarWeb(a.web ?? "")) falta("webNoValida", "web")
      if (!a.pais) falta("sinPais", "pais")
      break
    }
    case "promocion":
      if (tieneVarianteCanal(a.tipoOrganizacion)) {
        const texto = textos.canal?.trim()
        if (texto) {
          if (!analizarEnlaceCanal(texto)) falta("enlaceNoReconocido", "canal")
        } else if (!a.canal) falta("sinCanal", "canal")
      }
      if (!a.sector) falta("sinSector", "sector")
      if (!a.verticalesMaterial?.length) falta("sinTemaCanal", "verticalesMaterial")
      limite(
        a.verticalesMaterial?.length ?? 0,
        L.verticalesMaterial,
        "verticalesMaterial"
      )
      break
    case "alcance":
      if (!a.redesObjetivo?.length) falta("sinRedes", "redesObjetivo")
      if (!a.paisesObjetivo?.length) falta("sinPaises", "paisesObjetivo")
      if (!a.idiomasObjetivo?.length) falta("sinIdiomas", "idiomasObjetivo")
      break
    case "render":
    case "render-agencia":
      break
  }
  return e
}

/** Sin errores que bloqueen. */
export const tomaValida = (paso: PasoId, r: RespuestasToma, textos?: TextosToma) =>
  !validarToma(paso, r, textos).some((x) => x.bloquea)

/** Primer error al que llevar el foco: el primero que bloquea o, si no hay, el primero. */
export const primerError = (errores: readonly ErrorToma[]) =>
  errores.find((x) => x.bloquea) ?? errores[0] ?? null

/**
 * Marca o desmarca una opción de un grupo de chips con máximo y opciones
 * excluyentes («Aún no lo sé», «Aún no tengo cuenta», «No hago directos»).
 * `lleno`: no se añadió porque ya hay `max` (la región viva lo dice, sin sonido).
 */
export function alternarEleccion<T extends string>(
  seleccion: readonly T[],
  id: T,
  opciones: { max?: number; excluyentes?: readonly T[] } = {}
): { seleccion: T[]; cambio: "marcado" | "desmarcado" | "lleno" } {
  const { max = Infinity, excluyentes = [] } = opciones
  if (seleccion.includes(id))
    return { seleccion: seleccion.filter((x) => x !== id), cambio: "desmarcado" }
  if (excluyentes.includes(id)) return { seleccion: [id], cambio: "marcado" }
  const sinExcluyentes = seleccion.filter((x) => !excluyentes.includes(x))
  if (sinExcluyentes.length >= max) return { seleccion: [...seleccion], cambio: "lleno" }
  return { seleccion: [...sinExcluyentes, id], cambio: "marcado" }
}

/** De la selección de chips de `nichos` al valor guardado, y al revés. */
export const nichosDesdeSeleccion = (
  sel: readonly (Vertical | typeof AUN_NO_SE)[]
): Vertical[] | typeof AUN_NO_SE =>
  sel.includes(AUN_NO_SE) ? AUN_NO_SE : sel.filter((v): v is Vertical => v !== AUN_NO_SE)

export const seleccionDesdeNichos = (
  v: Vertical[] | typeof AUN_NO_SE | undefined
): (Vertical | typeof AUN_NO_SE)[] => (v === AUN_NO_SE ? [AUN_NO_SE] : [...(v ?? [])])

/* ---------------------------------------------------------------------------
   Web y dominio (toma `org`)
   --------------------------------------------------------------------------- */

/**
 * «tumarca.com», «https://tumarca.com/», «instagram.com/tumarca» → URL con
 * protocolo; `null` si no parece una dirección válida.
 */
export function normalizarWeb(texto: string): string | null {
  const t = texto.trim()
  if (!t || /\s/.test(t)) return null
  let url: URL
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : `https://${t}`)
  } catch {
    return null
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null
  if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(url.hostname)) return null
  return url.href
}

/** El dominio del correo es el de la web (o un subdominio suyo). Señal para revisar más rápido. */
export function dominioCoincide(correo: string, web: string): boolean {
  const dominio = correo.trim().toLowerCase().split("@")[1]
  const href = normalizarWeb(web)
  if (!dominio || !href) return false
  const host = new URL(href).hostname.toLowerCase().replace(/^www\./, "")
  return dominio === host || dominio.endsWith(`.${host}`) || host.endsWith(`.${dominio}`)
}

/* ---------------------------------------------------------------------------
   Enlaces de canal (§4.1)
   --------------------------------------------------------------------------- */

export interface EnlaceCanal {
  plataforma: PlataformaDirecto
  /** En minúsculas y sin arroba. */
  handle: string
  /** Dirección canónica. */
  url: string
}

const RESERVADOS: Partial<Record<PlataformaDirecto, readonly string[]>> = {
  twitch: [
    "directory",
    "videos",
    "settings",
    "search",
    "p",
    "downloads",
    "jobs",
    "turbo",
  ],
  kick: ["categories", "browse", "following", "search", "video", "clips"],
}

/**
 * Reconoce el enlace de un canal: `twitch.tv/x`, `kick.com/x`, `youtube.com/@x`
 * y `tiktok.com/@x`, con o sin protocolo, `www.` o `m.`. `null` si no lo es.
 */
export function analizarEnlaceCanal(texto: string): EnlaceCanal | null {
  const t = texto.trim()
  if (!t || /\s/.test(t)) return null
  let url: URL
  try {
    url = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`)
  } catch {
    return null
  }
  const host = url.hostname.toLowerCase().replace(/^(www|m|mobile)\./, "")
  let primero = ""
  try {
    primero = decodeURIComponent(url.pathname.split("/").filter(Boolean)[0] ?? "")
  } catch {
    return null
  }
  const conArroba = (patron: RegExp) =>
    primero.startsWith("@") && patron.test(primero.slice(1)) ? primero.slice(1) : null
  const directo = (plataforma: PlataformaDirecto, patron: RegExp) =>
    patron.test(primero) && !RESERVADOS[plataforma]?.includes(primero.toLowerCase())
      ? primero
      : null

  let plataforma: PlataformaDirecto
  let handle: string | null
  if (host === "twitch.tv") {
    plataforma = "twitch"
    handle = directo("twitch", /^[a-z0-9_]{3,25}$/i)
  } else if (host === "kick.com") {
    plataforma = "kick"
    handle = directo("kick", /^[a-z0-9_-]{3,25}$/i)
  } else if (host === "youtube.com") {
    plataforma = "youtube"
    handle = conArroba(/^[a-z0-9._-]{3,30}$/i)
  } else if (host === "tiktok.com") {
    plataforma = "tiktok"
    handle = conArroba(/^[a-z0-9._]{2,24}$/i)
  } else return null
  if (!handle) return null

  const h = handle.toLowerCase()
  const canonica: Record<"twitch" | "kick" | "youtube" | "tiktok", string> = {
    twitch: `https://twitch.tv/${h}`,
    kick: `https://kick.com/${h}`,
    youtube: `https://youtube.com/@${h}`,
    tiktok: `https://tiktok.com/@${h}`,
  }
  return { plataforma, handle: h, url: canonica[plataforma as keyof typeof canonica] }
}

/** Parece una dirección (aunque no la reconozcamos): para decir «No reconocemos ese enlace». */
export function pareceEnlace(texto: string): boolean {
  const t = texto.trim()
  return (
    !/\s/.test(t) &&
    (/^(https?:\/\/|www\.)/i.test(t) || /^([a-z0-9-]+\.)+[a-z]{2,}\//i.test(t))
  )
}

/* ---------------------------------------------------------------------------
   Ritmo del texto que se escribe solo (§5.3)
   --------------------------------------------------------------------------- */

export interface Ritmo {
  /** Antes de la primera palabra. */
  pausa: number
  porPalabra: number
  trasComa: number
  trasPunto: number
  /** Máximo de la frase, sin contar la pausa. */
  tope: number
}

export const RITMO: Ritmo = {
  pausa: 300,
  porPalabra: 55,
  trasComa: 120,
  trasPunto: 200,
  tope: 900,
}

/** Medio ciclo del parpadeo final del cursor (encendido 530 ms, apagado 530 ms). */
export const PARPADEO_CURSOR = 530

/** Tope de dos frases seguidas (saludo y pregunta de la primera toma). */
export const TOPE_FRASES = 1500

export interface PalabraRetardo {
  palabra: string
  /** ms desde que se monta la toma: `--retardo`. */
  retardo: number
  /** ms que el cursor se queda en la palabra: `--dura`. */
  dura: number
}

const CIERRE = `["»”’)\\]]*$`
const TRAS_COMA = new RegExp(`[,:;]${CIERRE}`)
const TRAS_PUNTO = new RegExp(`[.?!…]${CIERRE}`)

/**
 * Espacios que separan palabras. Los duros (U+00A0, U+202F) no: «12,4 %» o
 * «US$ 500», tal como los formatea `Intl`, se escriben como una sola palabra.
 */
const SEPARADOR = /[^\S  ]+/

/** Retardos sin escalar de cada palabra y fin de la frase, relativos a `pausa`. */
function medir(texto: string, r: Ritmo) {
  const palabras = texto.split(SEPARADOR).filter(Boolean)
  let t = r.pausa
  const crudos = palabras.map((p) => {
    const retardo = t
    t += r.porPalabra
    if (TRAS_COMA.test(p)) t += r.trasComa
    if (TRAS_PUNTO.test(p)) t += r.trasPunto
    return retardo
  })
  const span = t - r.pausa
  const escala = span > r.tope ? r.tope / span : 1
  return {
    palabras,
    retardos: crudos.map((x) => Math.round((x - r.pausa) * escala + r.pausa)),
    fin: r.pausa + Math.round(span * escala),
  }
}

const conDuraciones = (palabras: string[], retardos: number[]): PalabraRetardo[] =>
  palabras.map((palabra, i) => ({
    palabra,
    retardo: retardos[i],
    dura: i < palabras.length - 1 ? retardos[i + 1] - retardos[i] : 3 * PARPADEO_CURSOR,
  }))

/**
 * Retardo y duración de cada palabra. Función pura: da lo mismo en servidor y
 * cliente, sin temporizadores. Enteros; si la frase pasa de `tope`, se
 * comprime entera. Para la reacción: `retardosDe(texto, { pausa: 0, tope: 500 })`.
 */
export function retardosDe(texto: string, r: Partial<Ritmo> = RITMO): PalabraRetardo[] {
  const { palabras, retardos } = medir(texto, { ...RITMO, ...r })
  return conDuraciones(palabras, retardos)
}

/**
 * Varias frases seguidas (saludo y pregunta): cada una con su tope y, todas
 * juntas, como mucho `topeTotal` desde la pausa. El cursor pasa de una a otra.
 */
export function retardosDeFrases(
  frases: readonly string[],
  r: Partial<Ritmo> = RITMO,
  topeTotal = TOPE_FRASES
): PalabraRetardo[][] {
  const ritmo = { ...RITMO, ...r }
  let inicio = ritmo.pausa
  const partes = frases.map((frase) => {
    const m = medir(frase, { ...ritmo, pausa: inicio })
    inicio = m.fin
    return m
  })
  const total = inicio - ritmo.pausa
  const escala = total > topeTotal ? topeTotal / total : 1
  const planos = partes.flatMap((m) =>
    m.retardos.map((x) => Math.round((x - ritmo.pausa) * escala + ritmo.pausa))
  )
  const todas = conDuraciones(
    partes.flatMap((m) => m.palabras),
    planos
  )
  let desde = 0
  return partes.map((m) => {
    const trozo = todas.slice(desde, desde + m.palabras.length)
    desde += m.palabras.length
    return trozo
  })
}

/* ---------------------------------------------------------------------------
   Completitud y precisión (§6.7)
   --------------------------------------------------------------------------- */

export type RamaPerfil = "clipero" | "creador" | "agencia"

export const PESOS_COMPLETITUD = {
  clipero: {
    nichos: 20,
    redes: 15,
    cuentaConectada: 20,
    fandom: 15,
    paisIdiomas: 10,
    tamano: 10,
    experiencia: 10,
  },
  creador: {
    plataformasFrecuencia: 25,
    temaCanal: 20,
    enlace: 15,
    redes: 15,
    paisIdiomas: 10,
    cuentaConectada: 15,
  },
  // La especificación no pesa la agencia: sus datos obligatorios y el envío, a partes iguales
  agencia: {
    tipoOrganizacion: 10,
    organizacion: 10,
    web: 10,
    pais: 10,
    sector: 10,
    verticalesMaterial: 10,
    redesObjetivo: 10,
    paisesObjetivo: 10,
    idiomasObjetivo: 10,
    solicitud: 10,
  },
} as const satisfies Record<RamaPerfil, Record<string, number>>

export type CuentaCompletitud = Pick<Cuenta, "tipo" | "pais" | "idiomas" | "clipero"> &
  Partial<Pick<Cuenta, "creador" | "agencia">>

/** Rama que puntúa: agencia por tipo; creador si el objetivo es «mis videos»; si no, clipero. */
export function ramaDe(c: Pick<Cuenta, "tipo" | "clipero">): RamaPerfil {
  if (c.tipo === "agencia") return "agencia"
  return c.clipero.objetivo === "mis-videos" ? "creador" : "clipero"
}

/**
 * Las cuentas conectadas de verdad, en la forma que entiende el perfil.
 *
 * Conectar una red escribe en su propio almacén (`clipealo-cuentas-v1`), no en
 * la cuenta, así que el perfil no se enteraba: los veinte puntos de «cuenta
 * conectada» eran inalcanzables y la pantalla final invitaba a conseguirlos.
 * En vez de copiar el dato a dos sitios —que es lo que lo desincroniza—, se
 * pasa al calcular.
 */
export const cuentasDelPerfil = (
  cuentas: readonly { network: SocialId; handle?: string; followers?: number }[]
): CuentaPublicacion[] =>
  cuentas
    .filter((c) => c.handle)
    .map((c) => ({
      red: c.network,
      handle: c.handle!,
      seguidoresMedidos: c.followers,
    }))

/**
 * Qué partes del perfil están cubiertas y cuánto suman (0–100).
 *
 * `conectadas` son las cuentas vivas de quien mira (`cuentasDelPerfil`). Sin
 * ellas se cuenta solo lo declarado, que es lo que hace el backoffice con su
 * dataset: ahí nadie ha conectado nada en este navegador.
 */
export function completitudDetalle(
  c: CuentaCompletitud,
  conectadas: readonly CuentaPublicacion[] = []
) {
  const rama = ramaDe(c)
  const cl = c.clipero
  const cr = c.creador ?? {}
  const ag = c.agencia ?? {}
  const plataformas = cr.plataformasDirecto ?? []
  const redes = (cl.redes ?? []).some((x) => x !== SIN_CUENTA)
  const paisIdiomas = !!c.pais && c.idiomas.length > 0
  // Una cuenta conectada de verdad cuenta aunque todavía no sepamos sus
  // seguidores; medirlos es lo que puntúa aparte, en `tamano`
  const conectada =
    conectadas.length > 0 || (cl.cuentas ?? []).some((x) => x.seguidoresMedidos != null)

  const partes: Record<string, boolean> =
    rama === "clipero"
      ? {
          nichos: Array.isArray(cl.verticales) && cl.verticales.length > 0,
          redes,
          cuentaConectada: conectada,
          fandom: (cl.creadoresFan ?? []).length > 0,
          paisIdiomas,
          tamano: [...(cl.cuentas ?? []), ...conectadas].some(
            (x) => x.seguidoresMedidos != null || !!x.tramoDeclarado
          ),
          experiencia: !!cl.experiencia,
        }
      : rama === "creador"
        ? {
            plataformasFrecuencia:
              plataformas.length > 0 &&
              (plataformas.every((p) => p === NO_TRANSMITO) || !!cr.frecuencia),
            temaCanal: (cr.verticalesCanal ?? []).length > 0,
            enlace: !!cr.enlaceCanal,
            redes,
            paisIdiomas,
            cuentaConectada: conectada,
          }
        : {
            tipoOrganizacion: !!ag.tipoOrganizacion,
            organizacion:
              (ag.organizacion?.trim().length ?? 0) >= LIMITES_ONBOARDING.orgMin,
            web: !!normalizarWeb(ag.web ?? ""),
            pais: !!ag.pais,
            sector: !!ag.sector,
            verticalesMaterial: (ag.verticalesMaterial ?? []).length > 0,
            redesObjetivo: (ag.redesObjetivo ?? []).length > 0,
            paisesObjetivo: (ag.paisesObjetivo ?? []).length > 0,
            idiomasObjetivo: (ag.idiomasObjetivo ?? []).length > 0,
            solicitud: !!ag.solicitudEnviadaEn,
          }
  const pesos = PESOS_COMPLETITUD[rama] as Record<string, number>
  const total = Object.entries(partes).reduce((n, [k, ok]) => n + (ok ? pesos[k] : 0), 0)
  return {
    rama,
    total,
    partes,
    pendientes: Object.keys(partes).filter((k) => !partes[k]),
  }
}

/** 0–100. */
export const completitud = (
  c: CuentaCompletitud,
  conectadas: readonly CuentaPublicacion[] = []
) => completitudDetalle(c, conectadas).total

export type NivelPrecision = "baja" | "media" | "alta"

/** «baja» por debajo de 40, «media» de 40 a 69, «alta» desde 70. Etiqueta en `taxonomy.precision`. */
export function precision(pct: number): NivelPrecision {
  if (pct >= 70) return "alta"
  if (pct >= 40) return "media"
  return "baja"
}

/**
 * Respuesta de baja confianza (§4.6): marcó las 5 verticales y todas las redes,
 * o declara `1m-plus` sin conectar la cuenta.
 */
export function confianzaBaja(c: Partial<RespuestasClipero>): boolean {
  const todo =
    Array.isArray(c.verticales) &&
    c.verticales.length >= LIMITES_ONBOARDING.nichos &&
    SOCIAL_IDS.every((red) => c.redes?.includes(red))
  const inflado = (c.cuentas ?? []).some(
    (x) => x.tramoDeclarado === "1m-plus" && x.seguidoresMedidos == null
  )
  return todo || inflado
}

/* ---------------------------------------------------------------------------
   Directos → minutos previstos (§4.5)
   --------------------------------------------------------------------------- */

export const DIRECTOS_SEMANA: Record<FrecuenciaDirecto, number> = {
  "casi-diario": 6,
  "3-6-semana": 4.5,
  "1-2-semana": 1.5,
  "algunas-mes": 0.6,
  ocasional: 0.25,
}

export const HORAS_DIRECTO: Record<DuracionDirecto, number> = {
  "lt-1h": 0.5,
  "1-3h": 2,
  "3-6h": 4.5,
  "6h-plus": 7,
}

/** Horas por directo cuando no responde la duración. */
export const HORAS_DIRECTO_POR_DEFECTO = 2
/** Parte de lo emitido que se sube (calibrable). */
export const PORCENTAJE_SUBIDO = 0.3
const SEMANAS_MES = 4.3

/** Minutos de directo al mes. 0 sin frecuencia. */
export function minutosDirectoAlMes(
  frecuencia: FrecuenciaDirecto | null | undefined,
  duracion?: DuracionDirecto | null
): number {
  if (!frecuencia) return 0
  const horas = duracion ? HORAS_DIRECTO[duracion] : HORAS_DIRECTO_POR_DEFECTO
  return DIRECTOS_SEMANA[frecuencia] * horas * 60 * SEMANAS_MES
}

/** Minutos que subiría al mes: `round(minutosMes × 0,30)`. */
export const minutosPrevistos = (
  frecuencia: FrecuenciaDirecto | null | undefined,
  duracion?: DuracionDirecto | null
) => Math.round(minutosDirectoAlMes(frecuencia, duracion) * PORCENTAJE_SUBIDO)

/** Señal PQL: 3 a 6 veces por semana o más y directos de 1 h o más. */
export const directoIntensivo = (
  frecuencia: FrecuenciaDirecto | null | undefined,
  duracion: DuracionDirecto | null | undefined
) =>
  (frecuencia === "casi-diario" || frecuencia === "3-6-semana") &&
  (duracion === "1-3h" || duracion === "3-6h" || duracion === "6h-plus")

/* ---------------------------------------------------------------------------
   Perfil, umbrales y fandom
   --------------------------------------------------------------------------- */

/**
 * Único punto de mapeo entre el tipo de cuenta del registro y el perfil de
 * campañas. Quien se registra como agencia sigue siendo usuario (clipero)
 * hasta que el admin concede el perfil.
 */
export function perfilDesdeTipo(
  tipo: TipoCuenta | null | undefined,
  agenciaAprobada = false
): Exclude<Perfil, "admin"> {
  return tipo === "agencia" && agenciaAprobada ? "agencia" : "usuario"
}

export const UMBRALES_PUBLICOS = [
  "mas-de-50",
  "mas-de-200",
  "mas-de-1000",
  "mas-de-5000",
] as const
export type UmbralPublico = (typeof UMBRALES_PUBLICOS)[number]
export const VALOR_UMBRAL: Record<UmbralPublico, number> = {
  "mas-de-50": UMBRAL_PUBLICO,
  "mas-de-200": 200,
  "mas-de-1000": 1000,
  "mas-de-5000": 5000,
}

/**
 * Recuento redondeado para enseñarlo fuera del admin: por debajo de 50 no se
 * muestra (`null`); después, «más de 50 / 200 / 1.000 / 5.000».
 */
export function umbralPublico(n: number): UmbralPublico | null {
  if (!Number.isFinite(n) || n < UMBRAL_PUBLICO) return null
  if (n >= 5000) return "mas-de-5000"
  if (n >= 1000) return "mas-de-1000"
  if (n >= 200) return "mas-de-200"
  return "mas-de-50"
}

/** El número del umbral para `{umbral, number}`; `null` por debajo de 50. */
export const umbralPublicoValor = (n: number) => {
  const u = umbralPublico(n)
  return u ? VALOR_UMBRAL[u] : null
}

export interface DimensionesFandom {
  /** Inferidas de sus creadores, de más a menos repetida. */
  verticales: Vertical[]
  /** Plataformas donde ve a sus creadores (`plataformasQueVe`). */
  plataformas: PlataformaDirecto[]
  formatos: FormatoDirecto[]
  juegos: JuegoId[]
  /** Creadores del fandom con campaña (activa, si se pasa `campanaActiva`). */
  conCampana: CreadorId[]
}

const porFrecuencia = <T extends string>(valores: T[], orden: readonly string[]): T[] => {
  const cuenta = new Map<T, number>()
  for (const v of valores) cuenta.set(v, (cuenta.get(v) ?? 0) + 1)
  return [...cuenta.keys()].sort(
    (a, b) => cuenta.get(b)! - cuenta.get(a)! || orden.indexOf(a) - orden.indexOf(b)
  )
}

/**
 * Lo que se deduce del fandom sin preguntar. Los creadores `sugerible: false`
 * no cuentan (no entran en ningún agregado); de un pendiente solo cuenta su
 * plataforma.
 */
export function dimensionesDe(
  creadoresFan: readonly (CreadorId | CreadorPendiente)[],
  catalogo: readonly Creador[],
  campanaActiva?: (campanaId: string) => boolean
): DimensionesFandom {
  const verticales: Vertical[] = []
  const plataformas: PlataformaDirecto[] = []
  const formatos: FormatoDirecto[] = []
  const juegos: JuegoId[] = []
  const conCampana: CreadorId[] = []
  const directo = PLATAFORMAS_DIRECTO as readonly string[]
  for (const fan of creadoresFan) {
    if (typeof fan !== "string") {
      if (fan.plataforma) plataformas.push(fan.plataforma)
      continue
    }
    const c = catalogo.find((x) => x.id === fan)
    if (!c || !c.sugerible) continue
    verticales.push(...c.verticales)
    for (const cuenta of c.cuentas)
      if (directo.includes(cuenta.plataforma))
        plataformas.push(cuenta.plataforma as PlataformaDirecto)
    formatos.push(...(c.formatos ?? []))
    juegos.push(...(c.juegos ?? []))
    if (c.campanaId && (!campanaActiva || campanaActiva(c.campanaId)))
      conCampana.push(c.id)
  }
  return {
    verticales: porFrecuencia(verticales, VERTICALES),
    plataformas: porFrecuencia(plataformas, PLATAFORMAS_DIRECTO),
    formatos: [...new Set(formatos)],
    juegos: [...new Set(juegos)],
    conCampana,
  }
}

/* ---------------------------------------------------------------------------
   Orden determinista (sin Math.random)
   --------------------------------------------------------------------------- */

/** FNV-1a de 32 bits: el mismo número en servidor y cliente. */
export function hashEstable(texto: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/** Baraja siempre igual para la misma semilla (p. ej. el correo): chips de «¿Cómo llegaste?». */
export function barajarEstable<T>(
  items: readonly T[],
  semilla: string,
  clave: (item: T) => string = String
): T[] {
  return items
    .map((item, i) => ({ item, i, h: hashEstable(`${semilla}:${clave(item)}`) }))
    .sort((a, b) => a.h - b.h || a.i - b.i)
    .map((x) => x.item)
}

/* ---------------------------------------------------------------------------
   Simulador del render de agencia (§6.3)
   --------------------------------------------------------------------------- */

export const SIMULADOR_AGENCIA = {
  presupuesto: 500,
  topePorVideoPct: 10,
  minimoVistas: 1000,
  /** Sectores sin CPM de referencia (política y causas). */
  cpmSinReferencia: 1,
} as const

/**
 * Borrador del simulador: CPM a mitad del rango de referencia del sector, tope
 * del 10 % y mínimo de 1.000 vistas, con las cifras de `lib/campanas.ts`.
 */
export function simularBorrador(
  sector: Sector | null | undefined,
  presupuesto: number = SIMULADOR_AGENCIA.presupuesto,
  ajustes: Partial<{ cpm: number; topePorVideoPct: number; minimoVistas: number }> = {}
) {
  const cpmBase =
    ajustes.cpm ??
    (sector ? cpmMedioReferencia(sector) : null) ??
    SIMULADOR_AGENCIA.cpmSinReferencia
  const c = {
    presupuesto,
    cpm: Math.min(Math.max(cpmBase, LIMITES.cpmMin), LIMITES.cpmMax),
    topePorVideoPct: ajustes.topePorVideoPct ?? SIMULADOR_AGENCIA.topePorVideoPct,
    minimoVistas: ajustes.minimoVistas ?? SIMULADOR_AGENCIA.minimoVistas,
  }
  return {
    ...c,
    tope: topePorVideo(c),
    vistas: vistasCompradas(c),
    videos: videosAlTope(c),
    vistasHastaTope: vistasHastaTope(c),
    tramo: tramoPresupuestoDe(presupuesto),
  }
}
