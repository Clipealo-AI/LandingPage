/**
 * Modelo de dominio del backoffice (negocio), separado del de producto
 * (`lib/types.ts`). Es el contrato entre las páginas de `/admin` y la API real:
 * `lib/api/admin.ts` devuelve exactamente estas formas y `lib/admin/metrics.ts`
 * calcula todo lo demás a partir de ellas.
 *
 * Moneda: dólares estadounidenses (USD), la de los precios de la web
 * (`lib/pricing.ts`). Los importes van en dólares con decimales como número,
 * nunca en centavos. Los costes de IA llegan ya convertidos.
 */

/** Clave de mes "AAAA-MM". Todo el backoffice agrupa por mes de calendario. */
export type MonthKey = `${number}-${string}`

/**
 * Los tres planes de la web (mismos ids que `lib/pricing.ts`) y uno interno
 * que no se vende: equipo y creadores invitados, fuera del funnel y del MRR.
 */
export const PLAN_IDS = ["free", "creator", "business", "interno"] as const
export type PlanId = (typeof PLAN_IDS)[number]

/**
 * Plan tal y como lo lee el backoffice. Sin nombre ni textos: el nombre se
 * traduce en la interfaz (`pricing.plans.<id>.name`, e `admin.plans.interno`
 * para el plan que no se vende).
 */
export interface Plan {
  id: PlanId
  /** Precio mensual en dólares. 0 en Prueba y en Interno (cortesía). */
  priceMonthly: number
  /** Importe del año completo en dólares, si el plan se vende anual. */
  priceYearly?: number
  /** US$ al mes por miembro adicional; solo los planes con equipo. */
  seatPriceMonthly?: number
  minutesIncluded: number
  /** Interno (equipo, creadores invitados): fuera del funnel. */
  internal: boolean
  active: boolean
}

export const ACQUISITION_CHANNELS = [
  "organico",
  "afiliado",
  "referido",
  "directo",
  "ads",
] as const
export type AcquisitionChannel = (typeof ACQUISITION_CHANNELS)[number]

import type { Locale } from "@/i18n/routing"
import { FALLOS_PUBLICACION, type FalloPublicacion } from "@/lib/agenda"
import type { IdiomaAudiencia, PlataformaDirecto } from "@/lib/ajustes"
import type { TipoCuenta } from "@/lib/auth"
import type { Campana, Envio } from "@/lib/campanas"
import type { CountryCode } from "@/lib/countries"
import type { CreadorId } from "@/lib/creadores"
import type { EstadoOnboarding, ModoOnboarding, PasoId } from "@/lib/onboarding"
import type { DuenoCuenta, EstadoCuenta, SocialId } from "@/lib/social"
import type {
  ComoNosConociste,
  DuracionDirecto,
  FrecuenciaDirecto,
  InteresCampanaPropia,
  JuegoId,
  MotivoRechazo,
  ObjetivoUso,
  PlataformaDirectoOnboarding,
  RedPublicacion,
  Sector,
  TipoOrganizacion,
  TramoPresupuesto,
  TramoSeguidores,
  Vertical,
} from "@/lib/taxonomia"

/** Los países viven en `lib/countries.ts`: también los usa el perfil de Ajustes. */
export { COUNTRY_CODES, type CountryCode } from "@/lib/countries"

export const USER_FLAGS = [
  "cobro-fallido",
  "sin-activar",
  "riesgo-churn",
  "revisar",
] as const
export type UserFlag = (typeof USER_FLAGS)[number]

export interface AdminUser {
  id: string
  name: string
  email: string
  /** País del alta. El nombre se pinta en el idioma de la interfaz. */
  countryCode: CountryCode
  plan: PlanId
  status: "activo" | "inactivo" | "suspendido"
  createdAt: string
  lastActiveAt: string
  channel: AcquisitionChannel
  affiliateId?: string
  referredBy?: string
  /** Fecha del primer proyecto: mide la activación. */
  firstProjectAt?: string
  /** Fecha del primer clip listo. */
  firstClipAt?: string
  /**
   * Fecha del primer clip que salió de verdad a una red. Es el momento de
   * valor: un clip listo es una promesa, uno publicado es el trabajo hecho.
   */
  firstPublishedAt?: string
  /** Fecha del primer pago aprobado. */
  firstPaidAt?: string
  projects: number
  clips: number
  minutesProcessed: number
  /** Suma de pagos aprobados, en dólares. */
  totalPaid: number
  flags: UserFlag[]
  /**
   * Tipo de cuenta del registro. Opcional: las cuentas anteriores al
   * onboarding (y los fixtures de los tests) no lo tienen.
   */
  accountType?: TipoCuenta
  /** Lo que respondió en «Tu primer corte» (§8.2). Sin él, la cuenta no pasó por el onboarding. */
  onboarding?: OnboardingAdmin
  /** Primer envío a una campaña: activa al clipero de campañas. */
  firstSubmissionAt?: string
  /** Último envío a una campaña: mide la actividad de la oferta. */
  lastSubmissionAt?: string
}

/** Momento del flujo en que respondió el dispositivo: móvil por debajo de 64 rem al empezar. */
export type ClaseDispositivo = "movil" | "escritorio"

/** Estado de la solicitud de perfil de agencia en el backoffice. */
export interface SolicitudAgenciaAdmin {
  enviadaEn: string
  estado: "pendiente" | "aprobada" | "rechazada"
  resueltaEn?: string
  motivo?: MotivoRechazo
  /** Primera campaña publicada tras la aprobación: activa a la agencia. */
  primeraCampanaEn?: string
  /** US$ gastados en campañas a los 60 días de la aprobación. */
  gastado60d?: number
}

/**
 * Resumen del onboarding de una cuenta, tal y como lo lee el backoffice. Solo
 * ids, recuentos y fechas (§7.7): nunca el texto libre ni lo que gana.
 */
export interface OnboardingAdmin {
  tipo: TipoCuenta
  objetivo?: ObjetivoUso
  modo: ModoOnboarding
  estado: EstadoOnboarding
  iniciadoEn?: string
  completadoEn?: string
  pospuestoEn?: string
  pasosVistos: PasoId[]
  pasosRespondidos: PasoId[]
  pasosSaltados: PasoId[]
  /** Último paso visto. */
  ultimoPaso?: PasoId
  /** Toma en la que pospuso. */
  pasoAbandono?: PasoId
  /** Solo con la pestaña visible. */
  msPorPaso: Partial<Record<PasoId, number>>
  msTotal?: number
  /** Tomas completadas a mano. */
  textoAcelerado: number
  /** Pulsó «Saltar intro» en la primera toma. */
  saltoIntro: boolean
  dispositivo: ClaseDispositivo
  /** Idioma de la interfaz al empezar. */
  locale: Locale
  /** Declaradas (vacío con «Aún no lo sé»). */
  verticales: Vertical[]
  aunNoSe: boolean
  /** Dos o más envíos aprobados en esa vertical. */
  verticalesInferidas: Vertical[]
  juegos: JuegoId[]
  creadoresFan: CreadorId[]
  /** Creadores que añadió sin estar en el catálogo (cola `#pendientes`). */
  creadoresPendientes: number
  plataformasQueVe: PlataformaDirecto[]
  /** Rama «mis videos». */
  plataformasDirecto: PlataformaDirectoOnboarding[]
  frecuencia?: FrecuenciaDirecto
  duracion?: DuracionDirecto
  verticalesCanal: Vertical[]
  enlaceCanal?: { plataforma: PlataformaDirecto; handle: string }
  interesCampanaPropia?: InteresCampanaPropia
  /** Incluye «Otra red» y «Aún no tengo cuenta». */
  redes: RedPublicacion[]
  idiomas: IdiomaAudiencia[]
  tramoDeclarado?: TramoSeguidores
  seguidoresMedidos?: number
  /** País mayoritario del público medido al conectar la cuenta. */
  paisPublicoMedido?: CountryCode
  confianzaBaja: boolean
  /** Categoría de «¿Cómo llegaste?» (el texto libre no viaja). */
  comoNosConociste?: ComoNosConociste
  /** Escribió texto libre que aún no se ha normalizado a una categoría. */
  comoLlegasteSinNormalizar?: boolean
  // Agencia
  tipoOrganizacion?: TipoOrganizacion
  sector?: Sector
  verticalesMaterial?: Vertical[]
  creadorId?: CreadorId
  dominioCoincide?: boolean
  webValida?: boolean
  redesObjetivo?: SocialId[]
  paisesObjetivo?: CountryCode[]
  idiomasObjetivo?: IdiomaAudiencia[]
  tramoPresupuesto?: TramoPresupuesto
  solicitud?: SolicitudAgenciaAdmin
  /** Campañas que salieron en «Para ti» al terminar. */
  paraTi: string[]
  consiente: { estadisticas: boolean; informesSector: boolean; novedades: boolean }
  /** Revocó alguna finalidad en los 30 días siguientes al alta. */
  revocoEn30d: boolean
  /** 0–100 (§6.7). */
  completitud: number
}

export const SUBSCRIPTION_STATUSES = [
  "activa",
  "vencida",
  "cancelada",
  "pendiente-pago",
] as const
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]

export interface Subscription {
  id: string
  userId: string
  plan: PlanId
  status: SubscriptionStatus
  billing: "mensual" | "anual"
  /** Importe cobrado por ciclo, en dólares. */
  amount: number
  startedAt: string
  /** Próxima renovación. En vencidas/canceladas es la que no se cobró. */
  renewsAt: string
  canceledAt?: string
  paymentMethod: PaymentMethod
}

export const PAYMENT_METHODS = ["tarjeta", "yape", "plin", "transferencia"] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_STATUSES = [
  "aprobado",
  "rechazado",
  "pendiente",
  "reembolsado",
] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const PAYMENT_KINDS = ["nueva", "renovacion", "upgrade"] as const
export type PaymentKind = (typeof PAYMENT_KINDS)[number]

/**
 * Códigos de rechazo que devuelve la pasarela. Se guardan como código y la
 * interfaz los traduce: la frase no es un dato.
 */
export const FAILURE_REASONS = [
  "fondos-insuficientes",
  "tarjeta-vencida",
  "rechazada-emisor",
  "yape-tiempo-agotado",
] as const
export type FailureReason = (typeof FAILURE_REASONS)[number]

export interface Payment {
  id: string
  userId: string
  subscriptionId: string
  plan: PlanId
  amount: number
  status: PaymentStatus
  method: PaymentMethod
  kind: PaymentKind
  createdAt: string
  /** Motivo del rechazo, si lo hubo (lo devuelve la pasarela). */
  failureReason?: FailureReason
}

export const AI_PROVIDERS = ["assemblyai", "gemini"] as const
export type AiProvider = (typeof AI_PROVIDERS)[number]

export interface AiCostEntry {
  id: string
  provider: AiProvider
  model: string
  /** Coste en dólares, ya convertido. */
  amount: number
  /** Unidad facturada: segundos de audio o tokens. */
  units: number
  unitKind: "segundos" | "tokens"
  projectId: string
  userId: string
  /** Plan del usuario en el momento del gasto: separa el coste de servir a Prueba. */
  userPlan: PlanId
  createdAt: string
}

export const PROJECT_SOURCES = [
  "youtube",
  "directo",
  "kick",
  "twitch",
  "drive",
  "facebook",
  "zoom",
] as const
export type ProjectSource = (typeof PROJECT_SOURCES)[number]

export interface AdminProject {
  id: string
  userId: string
  userPlan: PlanId
  source: ProjectSource
  status: "listo" | "procesando" | "error"
  createdAt: string
  clips: number
  minutes: number
  /** Coste total de IA del proyecto, en dólares. */
  cost: number
}

/* ---------------------------------------------------------------------------
   Cuentas conectadas y publicaciones

   Clipealo publica desde el 20 de septiembre de 2026, así que el backoffice
   necesita saber en qué cuentas se publica y qué pasó con cada envío. De la
   cuenta viaja lo justo para medir la salud de la integración: id, red, estado
   y fechas. NUNCA el handle, el token ni la URL de lo publicado (§7.7): con el
   handle se identifica a una persona fuera de Clipealo, y para contar fallos
   por token caducado no hace ninguna falta.
   --------------------------------------------------------------------------- */

/** Una cuenta conectada, vista desde el backoffice. Sin identidad: solo su salud. */
export interface SocialAccountAdmin {
  id: string
  userId: string
  network: SocialId
  /** `ESTADOS_CUENTA` de `lib/social.ts`: conectada, caducada o revocada. */
  estado: EstadoCuenta
  /** Clipero o agencia: las de la agencia no gastan el cupo del clipero. */
  dueno: DuenoCuenta
  connectedAt: string
  /** Último envío que falló por esta cuenta: con él se ordena la cola de reconexión. */
  ultimoFalloAt?: string
}

/**
 * Los mismos códigos de fallo que guarda la agenda (`FALLOS_PUBLICACION` en
 * `lib/agenda.ts`). Se importan en vez de repetirse: si mañana la cola de
 * envío aprende un motivo nuevo, el backoffice lo sabe el mismo día.
 */
export const MOTIVOS_FALLO_PUBLICACION = FALLOS_PUBLICACION
export type MotivoFalloPublicacion = FalloPublicacion

/**
 * Los estados que puede tener un envío. Son los cinco de la agenda con otro
 * nombre para dos: aquí `programada`/`enviando` en vez de
 * `planificada`/`publicando`, porque el backoffice cuenta envíos y no casillas
 * de calendario. Etiquetas en `admin.metrics.*`, nunca aquí.
 */
export const PUBLICACION_ESTADOS = [
  "programada",
  "enviando",
  "publicada",
  "fallida",
  "cancelada",
] as const
export type PublicacionEstado = (typeof PUBLICACION_ESTADOS)[number]

/** Salir ahora o a una hora elegida. Programar es de Creador en adelante. */
export const MODOS_PUBLICACION = ["ahora", "programada"] as const
export type ModoPublicacion = (typeof MODOS_PUBLICACION)[number]

/** Un envío de un clip a una cuenta. Sin URL ni `postId`: eso no se mide aquí. */
export interface PublicacionAdmin {
  id: string
  userId: string
  projectId: string
  clipId: string
  network: SocialId
  cuentaId: string
  modo: ModoPublicacion
  /** Solo en modo `programada`: el instante UTC elegido. */
  programadaPara?: string
  estado: PublicacionEstado
  /** Solo con estado `fallida`. Código, nunca la frase de la plataforma. */
  motivoFallo?: MotivoFalloPublicacion
  intentos: number
  publicadaEn?: string
  creadaEn: string
}

export interface Affiliate {
  id: string
  name: string
  code: string
  /** Porcentaje de comisión sobre cada pago aprobado atribuido. */
  commissionPct: number
  status: "activo" | "pausado"
  joinedAt: string
  /** Enlace o canal por el que trae usuarios. */
  channel: string
}

export const REFERRAL_STATUSES = ["registrado", "activado", "convertido"] as const
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number]

export interface Referral {
  id: string
  referrerId: string
  referredId: string
  status: ReferralStatus
  createdAt: string
  /** Minutos de regalo que gana quien invita al convertirse el invitado. */
  rewardMinutes: number
  rewardGranted: boolean
}

/** Todo lo que necesita el backoffice, en crudo. */
export interface AdminDataset {
  /** Instante de la última sincronización. Fijo en el arquetipo. */
  updatedAt: string
  timeZone: string
  currency: "USD"
  plans: Plan[]
  users: AdminUser[]
  subscriptions: Subscription[]
  payments: Payment[]
  costs: AiCostEntry[]
  projects: AdminProject[]
  affiliates: Affiliate[]
  referrals: Referral[]
  /**
   * Campañas de clipping (semillas y simuladas). Opcional: sin ellas, el
   * mercado no tiene demanda y los paneles lo dicen.
   */
  campaigns?: Campana[]
  /** Envíos a campañas, con `userId` cuando son de un usuario del dataset. */
  submissions?: Envio[]
  /**
   * Cuentas conectadas. Opcional como `campaigns`: hoy viven en el navegador
   * (`clipealo-cuentas-v1`), así que un dataset sin ellas es legítimo y las
   * páginas lo dicen en vez de pintar un cero que parecería medido.
   */
  accounts?: SocialAccountAdmin[]
  /** Envíos de clips a esas cuentas. Opcional por lo mismo. */
  publications?: PublicacionAdmin[]
}

/** Proveedores de IA: marcas, iguales en todos los idiomas. Las etiquetas traducibles viven en admin.json. */
export const PROVIDER_LABEL: Record<AiProvider, string> = {
  assemblyai: "AssemblyAI",
  gemini: "Gemini",
}
