import {
  addDays,
  addMonths,
  daysBetween,
  isInMonth,
  median,
  monthEnd,
  monthOf,
  monthStart,
  round,
} from "@/lib/admin/dates"
import {
  PLAN_IDS,
  PROJECT_SOURCES,
  type AcquisitionChannel,
  type AdminDataset,
  type CountryCode,
  type AdminProject,
  type AdminUser,
  type Affiliate,
  type AiProvider,
  type FailureReason,
  type MonthKey,
  type MotivoFalloPublicacion,
  type Payment,
  type PaymentMethod,
  type Plan,
  type PlanId,
  type ProjectSource,
  type PublicacionAdmin,
  type SocialAccountAdmin,
  type Subscription,
  type OnboardingAdmin,
} from "@/lib/admin/types"
import {
  campanasMercado,
  celdas,
  cpmQueLlena,
  esServible,
  fansActivos,
  oportunidades,
  vistasMedianasPorVertical,
  type CeldaMercado,
  type CliperoMercado,
  type CpmQueLlena,
  type Oportunidad,
} from "@/lib/mercado"
import { CREADORES } from "@/lib/creadores"
import { PASOS, type EstadoOnboarding, type PasoId } from "@/lib/onboarding"
import type { IdiomaAudiencia } from "@/lib/ajustes"
import { SECTORES, esId, type Sector, type Vertical } from "@/lib/taxonomia"
import { seArreglaReconectando } from "@/lib/agenda"
import {
  ESTADOS_CUENTA,
  SOCIAL_IDS,
  type EstadoCuenta,
  type SocialId,
} from "@/lib/social"

/**
 * Motor de métricas del backoffice. Funciones puras sobre `AdminDataset`:
 * ni fechas del sistema ni azar, así que el mismo dataset da siempre el mismo
 * resultado en servidor, en cliente y en los tests.
 *
 * Definiciones (escritas una sola vez; las páginas solo las pintan):
 * - CLIENTE DE PAGO: suscripción activa (o en gracia de 7 días tras un cobro
 *   fallido), plan ≠ Interno, importe > 0. Única definición en todo el
 *   backoffice: no hay «18 paying» y «7 activas» como cifras distintas.
 * - MRR: suma del precio mensual normalizado (anual ÷ 12) de los clientes de
 *   pago en el instante de referencia. No es «ingreso del mes × 12».
 * - PUENTE DE MRR: por usuario, MRR al cierre del mes anterior frente al de
 *   ahora: nuevo, expansión, reactivación, contracción y baja.
 * - BAJA: cliente de pago al inicio del mes que ya no lo es. Voluntaria si
 *   canceló; involuntaria si el cobro falló y pasaron 7 días de gracia.
 * - MES EN CURSO («MTD»): las métricas de flujo (cobros, altas, proyectos,
 *   coste) se comparan con los mismos d días del mes anterior, no con el mes
 *   entero. Las de stock (MRR, clientes) se comparan con el cierre anterior.
 * - ACTIVACIÓN: primer proyecto en ≤ 7 días, primer clip listo en ≤ 7 días,
 *   primer pago en ≤ 30 días, por cohorte de alta.
 * - USUARIO ACTIVO: creó un proyecto en la ventana. La «última actividad»
 *   solo sirve para detectar pagantes inactivos.
 */

export const GRACIA_DIAS = 7
export const META_CONV60_PCT = 4
export const META_CONV_ACTIVADOS_PCT = 15

/** Semáforo de un bloque. El mismo vocabulario que `KpiCard`, sin importar de components. */
export type Tono = "neutral" | "ok" | "aviso" | "alerta"

/* Umbrales de la página Usuarios. Viven aquí y no en la página: son
   definiciones del negocio, y la tabla del funnel y los KPI los leen igual. */

/** Pagantes con un proyecto en su ciclo: por debajo, aviso. */
export const UMBRAL_PAGANTES_ACTIVOS_PCT = 70
/** Conversión de activados a pago en 30 días: por debajo, alerta. */
export const UMBRAL_CONV_ACTIVADOS_ALERTA_PCT = 8
/** Señales del funnel: fricción de subida, pipeline y paywall, con los mínimos que las hacen fiables. */
export const UMBRAL_FUNNEL = {
  proyectoPct: 50,
  clipRatio: 0.8,
  pagoPct: 5,
  minRegistrados: 5,
  minConProyecto: 3,
} as const
/** Retención M1 sobre activados: episódico por debajo del 20 %, núcleo desde el 35 %. */
export const RETENCION_M1 = { episodicoPct: 20, nucleoPct: 35 } as const
/** Un canal con al menos tantos usuarios que activa menos de la mitad que el orgánico. */
export const CANAL_MIN_USUARIOS = 10
export const CANAL_RATIO_FLOJO = 0.5
/** Cuántos dormidos se listan; el resto se ve por segmento en la tabla. */
export const DORMIDOS_LISTADOS = 10
/**
 * Envíos que no salieron, sobre los intentados de la semana. Publicar es la
 * promesa del producto: uno de cada veinte fallando ya es un aviso, y uno de
 * cada diez es que algo está roto (casi siempre tokens sin renovar).
 */
export const UMBRAL_FALLOS_PUBLICACION = { avisoPct: 5, alertaPct: 10 } as const
/** Una publicación fallida de un pagante que lleva más de esto sin arreglarse. */
export const HORAS_PUBLICACION_FALLIDA = 4
/** Un minuto regalado vale lo que cuesta en el plan Creador (US$ 29 ÷ 600 min). */
export const VALOR_MINUTO_RECOMPENSA = 29 / 600
/** Comisiones de afiliado liquidadas hasta esta fecha (trimestre cerrado). */
const COMISIONES_LIQUIDADAS_HASTA = "2026-08-01"
const CHURN_MINIMO_PARA_LTV_PCT = 3

// ---------------------------------------------------------------------------
// Tipos de salida
// ---------------------------------------------------------------------------

export type Semaforo = "rojo" | "ambar" | "verde"

// ---------------------------------------------------------------------------
// Códigos de texto. Las métricas no escriben frases: cada motivo, señal o
// acción sale como código con sus valores crudos y la interfaz lo traduce
// (`admin.metrics.*`). Así la instantánea memorizada sirve a los tres idiomas.
// ---------------------------------------------------------------------------

/** Canal de adquisición con su atribución: el código del afiliado o quién invitó. */
export type CanalResuelto =
  | { code: "afiliado"; values: { codigo: string } }
  | { code: "invitadoPor"; values: { nombre: string } }
  | { code: "canal"; values: { canal: AcquisitionChannel } }

/** Motivo de una baja: voluntaria, cobro fallido sin motivo o el que devuelve la pasarela. */
export type MotivoBaja = "voluntaria" | "cobro-fallido" | FailureReason

/** Señales de riesgo de una suscripción de pago. */
export const SENALES = [
  "rechazo-previo",
  "vencida-en-gracia",
  "pago-sin-verificar",
  "ultimo-cobro-rechazado",
  "inactivo-14d",
  "sin-proyectos-ciclo",
  "primera-renovacion",
] as const
export type Senal = (typeof SENALES)[number]

/** Acción que le toca a una fila de cola. */
export type AccionCola =
  | "sin-accion"
  | "verificar-pago"
  | "reintentar-cobro"
  | "enviar-enlace-yape-plin"
  | "contactar-o-prueba"
  | "recordatorio-renovacion"
  | "recordatorio-previo"
  | "mensaje-personal"
  | "reprocesar"
  | "revisar-cola"
  | "otorgar-recompensa"
  | "liquidar"
  | "revisar"
  | "reintentar-publicacion"
  | "pedir-reconexion"

/** Por qué una suscripción está en una cola de cobro o retención. */
export type MotivoVencimiento =
  | { code: "transferenciaSinVerificar"; values: { horas: number } }
  | { code: "cobroRechazado"; values: { razon: FailureReason | null; intentos: number } }
  | { code: "vencidaSinRenovar"; values: { dias: number } }
  | {
      code: "renuevaPronto"
      values: {
        senales: Senal[]
        primeraRenovacion: boolean
        cobroManual: PaymentMethod | null
      }
    }
  | { code: "sinProyectosCiclo" }
  | { code: "sinActividad14d" }

/** Regla que marca un proyecto con coste anómalo. */
export type AnomaliaCoste = "coste-3x-mediana" | "coste-minuto-2x-mediana"

export type MotivoCola =
  | MotivoVencimiento
  | { code: "proyectoError"; values: { horas: number } }
  | { code: "proyectoAtascado"; values: { horas: number } }
  | {
      code: "recompensaPendiente"
      values: { invitado: string; dias: number; minutos: number }
    }
  | { code: "comisionPendiente"; values: { codigo: string; dias: number } }
  | { code: "costeAnomalo"; values: { anomalia: AnomaliaCoste; minutos: number } }
  | {
      code: "publicacionFallida"
      values: {
        motivo: MotivoFalloPublicacion
        intentos: number
        plataforma: SocialId
      }
    }
  | { code: "cuentaCaducada"; values: { plataforma: SocialId; dias: number } }

export type ColaTitulo =
  | "pendiente"
  | "rechazado"
  | "vencida"
  | "proxima"
  | "inactivo"
  | "proyecto-error"
  | "proyecto-atascado"
  | "recompensa-referido"
  | "comision-afiliado"
  | "coste-anomalo"
  | "publicacion-fallida"
  | "cuenta-caducada"

/** Por qué un usuario de Prueba cuenta como PQL. */
export type MotivoPql =
  | { code: "listos14d"; values: { n: number } }
  | { code: "limitePrueba"; values: { minutos: number } }
  | { code: "activoConClips"; values: { clips: number } }

export type AlertaId =
  | "cobros"
  | "renovaciones"
  | "retencion"
  | "pipeline"
  | "revisar"
  | "comisiones"
  | "recompensas"
  | "coste"
  | "publicaciones"

export interface MrrBlock {
  total: number
  previous: number
  /** ARR solo como pie de página: MRR × 12. */
  arr: number
  nuevo: number
  expansion: number
  reactivacion: number
  contraccion: number
  baja: number
  neto: number
  netoMedia3m: number
  enRiesgo: { monto: number; n: number; pct: number; d7Monto: number; d7N: number }
  porPlan: { plan: PlanId; mrr: number; pct: number; clientes: number; arppu: number }[]
  sparkline: { month: MonthKey; mrr: number }[]
}

export interface ClientesBlock {
  n: number
  nInicio: number
  nuevos: number
  bajas: number
  reactivados: number
  churn: {
    pct: number | null
    pct3m: number | null
    voluntarias: number
    involuntarias: number
    involuntarioPct: number | null
    mrrPerdido: number
    motivos: { motivo: MotivoBaja; n: number; mrr: number; voluntaria: boolean }[]
    nominal: {
      userId: string
      userName: string
      plan: PlanId
      mrr: number
      motivo: MotivoBaja
    }[]
  }
  nrr3m: number | null
  pagaronAlgunaVez: number
  perdidaHistoricaPct: number | null
}

export interface CajaBlock {
  neta: number
  netaPrevia: number
  aprobado: number
  reembolsado: number
  ia: number
  comisionesPagadas: number
  recompensas: number
  acumulada: number
  pasivoPendiente: number
  prevision30d: number
  cobrosPrevistos30d: number
  tasaCobroRenovaciones: number | null
}

export interface CobrosBlock {
  aprobado: number
  rechazado: number
  pendiente: number
  reembolsado: number
  neto: number
  netoPrevio: number
  nAprobados: number
  nRechazados: number
  nPendientes: number
  nReembolsos: number
  /** Aprobados ÷ (aprobados + rechazados), en número de intentos. */
  cobroEfectivoPct: number | null
  cobroEfectivoRenovaciones3mPct: number | null
  tasaReembolso30dPct: number | null
  porTipo: {
    kind: Payment["kind"]
    aprobados: number
    rechazados: number
    monto: number
  }[]
  porMetodo: { method: PaymentMethod; amount: number; n: number; rechazados: number }[]
}

export interface ActividadBlock {
  mau: number
  mauPrevio: number
  wau: number
  adherenciaPct: number | null
  mauNuevos: number
  mauRecurrentes: number
  pagantesActivos: number
  pagantesActivosPct: number | null
  freeActivos: number
  wauSerie: { semana: string; wau: number }[]
  /** Aviso si menos del `UMBRAL_PAGANTES_ACTIVOS_PCT` de los pagantes usó el producto en su ciclo. */
  tono: Tono
}

export interface PlanCount {
  plan: PlanId
  n: number
  pct: number
}

/** Cuentas registradas en un plan y cuántas de ellas pagan. Lo lee el catálogo de planes. */
export interface CuentasPlan {
  cuentas: number
  dePago: number
}

/** Un canal con volumen que activa menos de la mitad que el orgánico trae altas que solo consumen IA. */
export type ChannelSenal = "activa-menos-mitad-organico"

export interface ChannelStats {
  channel: AcquisitionChannel
  total: number
  altasMes: number
  activadosD7: number
  activacionPct: number | null
  pagando: number
  conversionPct: number | null
  ingreso: number
  senal: ChannelSenal | null
}

export interface CountryStats {
  code: CountryCode
  total: number
  /** Cuota sobre todos los usuarios registrados. */
  pctTotal: number | null
  altasMes: number
  activos30d: number
  pagando: number
  conversionPct: number | null
  mrr: number
  ingreso: number
}

export interface UsuariosBlock {
  total: number
  totalPrevio: number
  altas: number
  altasPrevias: number
  pagando: number
  free: number
  internos: number
  elegibles: number
  sinActivar: number
  incoherencias: number
  /** Activación D7 del orgánico: la vara de medir de los demás canales. */
  referenciaActivacionPct: number | null
  porPlan: PlanCount[]
  porCanal: ChannelStats[]
  porPais: CountryStats[]
}

export interface CohortConversion {
  cohorte: MonthKey
  registrados: number
  conv30: number | null
  conv60: number | null
  cerrada30: boolean
  cerrada60: boolean
  activadosD7: number
  pagantesD30: number
  convActivados: number | null
  medianaDiasAPago: number | null
}

export interface ConversionBlock {
  pagaronAlgunaVez: number
  pagaronAlgunaVezPct: number
  ultimaCerrada: CohortConversion | null
  media3Anteriores: { conv60: number | null; convActivados: number | null }
  cohortes: CohortConversion[]
  metaConv60: number
  metaConvActivados: number
  /** Alerta si la última cerrada convierte activados por debajo de `UMBRAL_CONV_ACTIVADOS_ALERTA_PCT`; aviso si no llega a la meta. */
  tono: Tono
}

export interface FunnelRow {
  /** Clave de la cohorte: el mes («2026-09») o el día en que empieza la semana («2026-09-06»). */
  etiqueta: string
  desde: string
  hasta: string
  registrados: number
  conProyecto: number
  activados: number
  pagantes: number
  pctProyecto: number | null
  pctActivados: number | null
  pctPagantes: number | null
  enCurso: boolean
  /** Lo que la cohorte señala, con los mínimos de `UMBRAL_FUNNEL` para no gritar con dos personas. */
  senales: FunnelSenal[]
}

export type FunnelSenal =
  "registro-proyecto-bajo" | "proyecto-clip-bajo" | "clip-pago-bajo"

/** Activación D7: la última cohorte mensual con los 7 días cumplidos frente a las tres anteriores. */
export interface ActivacionD7Block {
  ultima: FunnelRow | null
  media3Anteriores: number | null
  cerradas: number
  tono: Tono
}

export type NivelRetencion = "episodico" | "medio" | "nucleo"

/** Retención M1 sobre activados de la última cohorte con el mes +1 cerrado. */
export interface RetencionM1Block {
  cohorte: MonthKey | null
  pct: number | null
  media3Anteriores: number | null
  cerradas: number
  nivel: NivelRetencion | null
}

export interface TtvBlock {
  medianaHoras: number | null
  medianaHorasPrevias: number | null
  p75Horas: number | null
  falloPrimerProyectoPct: number | null
  primerosProyectos: number
}

export interface Bucket {
  /** Días desde la renovación fallida, para leer: «1–3 d». */
  desde: number
  hasta: number
  n: number
  monto: number
}

export interface RenewalItem {
  subscriptionId: string
  userId: string
  userName: string
  userEmail: string
  countryCode: CountryCode
  plan: PlanId
  billing: Subscription["billing"]
  amount: number
  mrr: number
  renewsAt: string
  diasRestantes: number
  status: Subscription["status"]
  method: PaymentMethod
  cola: "pendiente" | "rechazado" | "vencida" | "proxima" | "inactivo"
  senales: Senal[]
  semaforo: Semaforo
  motivo: MotivoVencimiento
  ultimoPago?: {
    createdAt: string
    status: Payment["status"]
    method: PaymentMethod
    amount: number
  }
  intentosFallidos: number
  proyectosCiclo: number
  lastActiveAt: string
  accion: AccionCola
}

export interface VencimientosBlock {
  d7: { n: number; monto: number; conSenal: number }
  d30: { n: number; monto: number; conSenal: number }
  vencidas: { n: number; monto: number; buckets: Bucket[] }
  rechazados: { n: number; monto: number; tasaRecuperacion30dPct: number | null }
  pendientes: { n: number; monto: number; maxHoras: number }
  inactivos: { rojo: number; ambar: number; mrrRojo: number; mrrAmbar: number }
  cobrosPrevistos30d: number
  items: RenewalItem[]
}

export interface ModelCost {
  provider: AiProvider
  model: string
  amount: number
  units: number
  unitKind: "segundos" | "tokens"
  proyectos: number
  /** US$ por minuto de audio (AssemblyAI) o por proyecto (Gemini). */
  unitario: number | null
}

export interface PipelineBlock {
  err24h: { n: number; total: number; pct: number | null }
  err7d: { n: number; total: number; pct: number | null }
  sinResolver: number
  sinResolverDePago: number
  atascados: number
  falloPrimerProyectoPct: number | null
  costeEnErrores7d: { monto: number; pct: number | null }
  porFuente7d: { source: ProjectSource; n: number; errores: number; pct: number | null }[]
}

export interface CostesBlock {
  total: number
  previo: number
  acumulado: number
  porProveedor: { provider: AiProvider; amount: number; pct: number }[]
  porModelo: ModelCost[]
  porProyecto: number | null
  porClip: number | null
  porMinuto: number | null
  porMinutoPrevio: number | null
  porUsuarioActivo: number | null
  deFree: {
    amount: number
    pct: number
    porActivo: number | null
    subsidioPctMrr: number | null
  }
  dePago: { amount: number; pct: number }
  deInternos: { amount: number; pct: number }
  anomalias: {
    projectId: string
    userId: string
    userName: string
    userPlan: PlanId
    cost: number
    minutes: number
    costPorMinuto: number
    motivo: AnomaliaCoste
    createdAt: string
  }[]
  topFree: {
    userId: string
    userName: string
    channel: AcquisitionChannel
    proyectos: number
    minutos: number
    cost: number
  }[]
  pipeline: PipelineBlock
}

export interface MargenBlock {
  ingresos: number
  costes: number
  bruto: number
  pct: number | null
  brutoPrevio: number
  /** (MRR − coste IA de clientes de pago) ÷ MRR. */
  recurrentePct: number | null
  /** (aprobado − reembolsos − IA − comisiones pagadas) ÷ aprobado. */
  cajaPct: number | null
  historicoPct: number | null
}

export interface SourceStats {
  source: ProjectSource
  proyectos: number
  previos: number
  acumulado: number
  exitoPct: number | null
  clipsPorProyecto: number | null
  usuarios: number
  costePorProyecto: number | null
  costePorMinuto: number | null
  conversionPrimeraFuentePct: number | null
  alertaCaida: boolean
}

export interface UsoBlock {
  proyectos: number
  proyectosPrevios: number
  clips: number
  clipsPrevios: number
  minutos: number
  minutosPrevios: number
  clipsPorProyecto: number | null
  errores: number
  tasaError: number | null
  procesando: number
  proyectosAcumulados: number
  clipsAcumulados: number
  porFuente: SourceStats[]
}

/**
 * Lo que sale a las redes. Va al lado de `UsoBlock` porque cuenta la otra
 * mitad del trabajo: `uso` mide lo que Clipealo fabrica y esto lo que de
 * verdad se publica. Todo lo de aquí se puede defender con las entidades que
 * hay; lo que no (alcance, vistas, seguidores ganados) no está.
 */
export interface PublicacionesBlock {
  publicadas: number
  publicadasPrevias: number
  porPlataforma: { network: SocialId; publicadas: number; pct: number | null }[]
  fallidas7d: {
    n: number
    /** Envíos resueltos de la semana: publicadas + fallidas. El denominador honesto. */
    intentadas: number
    pct: number | null
    porMotivo: { motivo: MotivoFalloPublicacion; n: number }[]
    porPlataforma: { network: SocialId; n: number }[]
    /** Aviso y alerta por `UMBRAL_FALLOS_PUBLICACION`. */
    tono: Tono
  }
  exito7dPct: number | null
  /** Cuentas conectadas por estado, siempre los tres de `ESTADOS_CUENTA`. */
  cuentas: { estado: EstadoCuenta; n: number }[]
  usuariosConCuentaViva: number
  /** De los clips de proyectos listos del mes, cuántos acabaron saliendo. */
  clipsPublicadosPct: number | null
  /** De «clip listo» a «publicado», en horas. Es el tiempo que tarda el trabajo en valer. */
  medianaHorasAPublicar: number | null
}

export interface PlanStats {
  plan: PlanId
  priceMonthly: number
  priceYearly?: number
  seatPriceMonthly?: number
  minutesIncluded: number
  internal: boolean
  clientes: number
  mrr: number
  pctMrr: number
  pctClientes: number
  arppu: number | null
  costeIa: number
  contribucion: number
  contribucionPct: number | null
  medianaMinutos: number | null
  usoIncluidoPct: number | null
  conMargenBajo: number
  nuevos90d: number
  bajas90d: number
  churn3mPct: number | null
  usuarios: number
}

export interface LtvBlock {
  arppu: number
  arpu: number | null
  realizado: number | null
  estimado: number | null
  churnUsadoPct: number | null
  vidaMediaMeses: number | null
  cacAfiliados90d: number | null
  cacReferidos90d: number | null
  cacBlended90d: number | null
  ltvCac: number | null
  paybackMeses: number | null
  nuevosClientes90d: number
  segundaCobranza: {
    elegibles: number
    conSegunda: number
    pct: number | null
    nominal: { userId: string; userName: string; plan: PlanId; pagos: number }[]
  }
  /** Tamaño de la muestra y baja mínima con la que se estima el LTV. */
  nota: { n: number; bajaMinimaPct: number }
}

export interface PqlRow {
  userId: string
  userName: string
  userEmail: string
  countryCode: CountryCode
  channel: AcquisitionChannel
  canalResuelto: CanalResuelto
  fuentePrincipal: ProjectSource | null
  proyectosListos30d: number
  minutos30d: number
  costeIa30d: number
  clips: number
  lastActiveAt: string
  diasDesdeAlta: number
  motivo: MotivoPql
}

export interface PqlBlock {
  n: number
  nPrevio: number
  items: PqlRow[]
  /** Aviso si no hay ninguno ni lo había hace una semana: nadie de Prueba se comporta como cliente. */
  tono: Tono
}

export interface DormidoRow {
  userId: string
  userName: string
  countryCode: CountryCode
  plan: PlanId
  exPagante: boolean
  totalPaid: number
  minutos: number
  proyectos: number
  fuentePrincipal: ProjectSource | null
  lastActiveAt: string
}

export interface DormidosBlock {
  n: number
  exPagantes: number
  freeActivados: number
  items: DormidoRow[]
  /** Cuántos van en `items`: `DORMIDOS_LISTADOS` como mucho. */
  listados: number
}

export type ColaTipo =
  "cobro" | "retencion" | "pipeline" | "programa" | "coste" | "publicacion"

export interface ColaItem {
  id: string
  tipo: ColaTipo
  semaforo: "rojo" | "ambar"
  titulo: ColaTitulo
  userId?: string
  userName: string
  countryCode?: CountryCode
  plan?: PlanId
  monto: number
  antiguedadDias: number
  motivo: MotivoCola
  accion: AccionCola
  href: string
}

/** Alerta agregada. Título y detalle se traducen por `id`. */
export interface AlertItem {
  id: AlertaId
  severidad: "alta" | "media" | "baja"
  n: number
  monto?: number
  href: string
}

export interface AffiliateStats {
  affiliate: Affiliate
  altas: number
  altas30d: number
  activadosD7: number
  activacionPct: number | null
  pagando: number
  conversionPct: number | null
  ingresoAtribuido: number
  ingreso30d: number
  comisionDevengada: number
  comisionPagada: number
  comisionPendiente: number
  antiguedadPendienteDias: number | null
  roi: number | null
  ratioComisionPct: number | null
  costeIaNoPagantes: number
  alerta: "liquidar" | "calidad" | "fraude" | null
}

export interface ReferralPendiente {
  referralId: string
  referrerId: string
  referrerName: string
  referredId: string
  referredName: string
  antiguedadDias: number
  rewardMinutes: number
  valor: number
}

export interface ReferralStats {
  total: number
  total90d: number
  registrados: number
  activados: number
  convertidos: number
  atascados: number
  activacionPct: number | null
  activacionOrganicaPct: number | null
  conversionPct: number | null
  conversionOrganicaPct: number | null
  recompensasPendientes: ReferralPendiente[]
  minutosOtorgados: number
  minutosPendientes: number
  valorOtorgado: number
  valorPendiente: number
  ingresoInvitados90d: number
  valor: number | null
  cacReferidos: number | null
  invitadores90d: number
  tasaInvitacionPct: number | null
  aportePct: number | null
  topReferrers: {
    userId: string
    name: string
    plan: PlanId
    invitados: number
    activados: number
    convertidos: number
    ingreso: number
  }[]
}

export interface MonthlySnapshot {
  month: MonthKey
  previousMonth: MonthKey
  updatedAt: string
  timeZone: string
  /** Solo en el mes en curso: día de corte y días del mes. */
  mtd: { dia: number; diasMes: number } | null
  mrr: MrrBlock
  clientes: ClientesBlock
  caja: CajaBlock
  cobros: CobrosBlock
  actividad: ActividadBlock
  usuarios: UsuariosBlock
  conversion: ConversionBlock
  funnel: FunnelRow
  funnelSemanal: FunnelRow[]
  funnelMensual: FunnelRow[]
  activacionD7: ActivacionD7Block
  ttv: TtvBlock
  vencimientos: VencimientosBlock
  costes: CostesBlock
  margen: MargenBlock
  uso: UsoBlock
  publicaciones: PublicacionesBlock
  planes: PlanStats[]
  ltv: LtvBlock
  pql: PqlBlock
  dormidos: DormidosBlock
  colas: ColaItem[]
  alertas: AlertItem[]
  afiliados: AffiliateStats[]
  referidos: ReferralStats
}

export interface SeriesPoint {
  month: MonthKey
  mrr: number
  nuevo: number
  expansion: number
  reactivacion: number
  contraccion: number
  baja: number
  neto: number
  cobros: number
  rechazados: number
  costes: number
  comisiones: number
  cajaNeta: number
  altas: number
  activos: number
  pagando: number
  conversionPct: number
  proyectos: number
  clips: number
  costeFree: number
  costePorMinuto: number | null
  enCurso: boolean
}

export interface CohortRow {
  cohorte: MonthKey
  registrados: number
  activadosD7: number
  /** % de la cohorte con un proyecto en el mes +k (k = 0..5). null si no ha llegado. */
  retencion: (number | null)[]
  /** Mismo numerador sobre los activados D7. */
  retencionActivados: (number | null)[]
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const sum = (xs: number[]) => round(xs.reduce((a, b) => a + b, 0))
const pct = (part: number, whole: number) =>
  whole > 0 ? round((part / whole) * 100, 1) : null
const avg = (xs: number[]) =>
  xs.length ? round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0
const ms = (d: string | Date) =>
  typeof d === "string" ? new Date(d).getTime() : d.getTime()
const inRange = (date: string, from: Date, to: Date) =>
  ms(date) >= from.getTime() && ms(date) < to.getTime()

/** Precio mensual normalizado de una suscripción. */
export function monthlyPrice(sub: Subscription) {
  return sub.billing === "anual" ? sub.amount / 12 : sub.amount
}

/**
 * ¿Estaba la suscripción activa en el instante `t`?
 * Una vencida o pendiente de pago sigue activa durante los 7 días de gracia
 * tras la renovación fallida; después es una baja involuntaria.
 */
export function isActiveAt(sub: Subscription, t: Date) {
  const at = t.getTime()
  if (ms(sub.startedAt) > at) return false
  if (sub.canceledAt && ms(sub.canceledAt) <= at) return false
  if (sub.status === "vencida" || sub.status === "pendiente-pago") {
    if (ms(addDays(sub.renewsAt, GRACIA_DIAS)) <= at) return false
  }
  return true
}

/** Cliente de pago: activa, plan ≠ Interno, importe > 0. */
export function isPayingAt(sub: Subscription, t: Date) {
  return sub.plan !== "interno" && sub.amount > 0 && isActiveAt(sub, t)
}

/** Activación D7: primer clip listo en los 7 días siguientes al alta. Una sola definición. */
export const esActivadoD7 = (u: Pick<AdminUser, "createdAt" | "firstClipAt">) =>
  Boolean(u.firstClipAt && daysBetween(u.createdAt, u.firstClipAt) <= 7)

/** La suscripción más reciente de un usuario, si tiene alguna. */
export function ultimaSuscripcion(
  data: Pick<AdminDataset, "subscriptions">,
  u: Pick<AdminUser, "id">
): Subscription | undefined {
  return data.subscriptions
    .filter((s) => s.userId === u.id)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]
}

/*
 * Tres definiciones que leen a la vez la instantánea y las filas de la tabla.
 * Vivían copiadas en `rows.ts` y ya divergían: el aviso decía «12 con etiqueta
 * que no cuadra» y «Ver la lista» enseñaba otra cifra.
 */

/**
 * Etiqueta de plan de pago sin suscripción de pago detrás. Una vencida o
 * pendiente de pago no cuenta: ya vive en la cola de cobro.
 */
export function esIncoherente(
  u: Pick<AdminUser, "plan">,
  sub: Subscription | undefined,
  paga: boolean
) {
  return (
    u.plan !== "free" &&
    u.plan !== "interno" &&
    !paga &&
    sub?.status !== "vencida" &&
    sub?.status !== "pendiente-pago"
  )
}

/**
 * Por qué un usuario de Prueba se comporta como cliente, o `null`. `ps` son
 * sus proyectos; `tienePagos`, si alguna vez pagó (entonces no es PQL, es otra cosa).
 */
export function motivoPql(
  u: AdminUser,
  ps: AdminProject[],
  ref: Date,
  free: Pick<Plan, "minutesIncluded">,
  tienePagos: boolean
): MotivoPql | null {
  if (u.plan !== "free" || u.status === "suspendido" || tienePagos) return null
  const listos14 = ps.filter(
    (p) => p.status === "listo" && inRange(p.createdAt, addDays(ref, -14), ref)
  ).length
  const ult30 = ps.filter((p) => inRange(p.createdAt, addDays(ref, -30), ref))
  const listos30 = ult30.filter((p) => p.status === "listo").length
  const minutos30 = round(ult30.reduce((n, p) => n + p.minutes, 0))
  const reciente = daysBetween(u.lastActiveAt, ref) <= 3
  if (listos14 >= 2) return { code: "listos14d", values: { n: listos14 } }
  if (minutos30 >= free.minutesIncluded * 0.8)
    return { code: "limitePrueba", values: { minutos: Math.round(minutos30) } }
  if (reciente && listos30 >= 1 && u.clips >= 10)
    return { code: "activoConClips", values: { clips: u.clips } }
  return null
}

/** Activó alguna vez, lleva entre 30 y 180 días sin entrar y hoy no paga. Interno queda fuera. */
export function estadoDormido(
  u: AdminUser,
  ref: Date,
  paga: boolean
): "dormido" | "ex-pagante" | null {
  if (u.plan === "interno" || paga || !u.firstClipAt) return null
  const dias = daysBetween(u.lastActiveAt, ref)
  if (dias < 30 || dias > 180) return null
  return u.totalPaid > 0 ? "ex-pagante" : "dormido"
}

/** El orgánico es la vara de medir: un canal con volumen que activa menos de la mitad. */
export function canalFlojo(
  c: Pick<ChannelStats, "channel" | "total" | "activacionPct">,
  referencia: number | null
) {
  return (
    referencia !== null &&
    c.channel !== "organico" &&
    c.total >= CANAL_MIN_USUARIOS &&
    (c.activacionPct ?? 0) < referencia * CANAL_RATIO_FLOJO
  )
}

/**
 * El plan que de verdad tiene un usuario en el instante `t`: Interno por su
 * etiqueta, el de su suscripción de pago vigente si la hay y, si no, Prueba.
 * La etiqueta `plan` del usuario no manda: es lo que hace que una etiqueta
 * caducada cuente como incoherencia y no como cliente. Una sola definición
 * para «usuarios por plan» y para las cuentas del catálogo.
 */
export function planResueltoAt(
  u: AdminUser,
  subs: Subscription[],
  t: Date
): { plan: PlanId; dePago: boolean } {
  if (u.plan === "interno") return { plan: "interno", dePago: false }
  const s = subs.find((x) => x.userId === u.id && isPayingAt(x, t))
  return s ? { plan: s.plan, dePago: true } : { plan: "free", dePago: false }
}

function payingByUserAt(subs: Subscription[], t: Date) {
  const map = new Map<string, number>()
  for (const s of subs) {
    if (!isPayingAt(s, t)) continue
    map.set(s.userId, (map.get(s.userId) ?? 0) + monthlyPrice(s))
  }
  return map
}

/** Instante de referencia del mes: hoy si es el mes en curso, si no su cierre. */
export function refInstant(month: MonthKey, updatedAt: string) {
  const hoy = new Date(updatedAt)
  return monthOf(hoy) === month ? hoy : monthEnd(month)
}

/** Ventana del mes [inicio, ref) y su comparable del mes anterior. */
function windows(month: MonthKey, updatedAt: string) {
  const ref = refInstant(month, updatedAt)
  const inicio = monthStart(month)
  const prevMonth = addMonths(month, -1)
  const prevInicio = monthStart(prevMonth)
  const mtd = monthOf(new Date(updatedAt)) === month
  const prevFin = mtd
    ? new Date(prevInicio.getTime() + (ref.getTime() - inicio.getTime()))
    : monthEnd(prevMonth)
  return { ref, inicio, prevMonth, prevInicio, prevFin, mtd }
}

function cycleStart(sub: Subscription, ref: Date) {
  if (sub.billing === "anual") return monthStart(monthOf(ref))
  const [y, m, d] = sub.renewsAt.slice(0, 10).split("-").map(Number)
  const start = new Date(Date.UTC(y, m - 2, d, 14))
  return start > ref ? new Date(Date.UTC(y, m - 3, d, 14)) : start
}

function userProjects(data: AdminDataset) {
  const map = new Map<string, AdminProject[]>()
  for (const p of data.projects) {
    const list = map.get(p.userId) ?? []
    list.push(p)
    map.set(p.userId, list)
  }
  return map
}

function mainSource(projects: AdminProject[]): ProjectSource | null {
  if (projects.length === 0) return null
  const c = new Map<ProjectSource, number>()
  for (const p of projects) c.set(p.source, (c.get(p.source) ?? 0) + 1)
  return [...c.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

function resolveChannel(data: AdminDataset, u: AdminUser): CanalResuelto {
  if (u.channel === "afiliado" && u.affiliateId) {
    const a = data.affiliates.find((x) => x.id === u.affiliateId)
    if (a) return { code: "afiliado", values: { codigo: a.code } }
  }
  if (u.channel === "referido" && u.referredBy) {
    const r = data.users.find((x) => x.id === u.referredBy)
    if (r) return { code: "invitadoPor", values: { nombre: r.name } }
  }
  return { code: "canal", values: { canal: u.channel } }
}

// ---------------------------------------------------------------------------
// MRR y clientes
// ---------------------------------------------------------------------------

interface Bridge {
  nuevo: number
  expansion: number
  reactivacion: number
  contraccion: number
  baja: number
  nuevos: number
  reactivados: number
  bajas: Subscription[]
  mrrIni: number
  mrrFin: number
}

function bridge(data: AdminDataset, ini: Date, fin: Date): Bridge {
  const cur = payingByUserAt(data.subscriptions, fin)
  const prev = payingByUserAt(data.subscriptions, ini)
  const b: Bridge = {
    nuevo: 0,
    expansion: 0,
    reactivacion: 0,
    contraccion: 0,
    baja: 0,
    nuevos: 0,
    reactivados: 0,
    bajas: [],
    mrrIni: 0,
    mrrFin: 0,
  }
  for (const uid of new Set([...cur.keys(), ...prev.keys()])) {
    const c = cur.get(uid) ?? 0
    const p = prev.get(uid) ?? 0
    if (p === 0 && c > 0) {
      const tuvoAntes = data.subscriptions.some(
        (s) => s.userId === uid && ms(s.startedAt) < ini.getTime() && !isPayingAt(s, ini)
      )
      if (tuvoAntes) {
        b.reactivacion += c
        b.reactivados += 1
      } else {
        b.nuevo += c
        b.nuevos += 1
      }
    } else if (p > 0 && c === 0) {
      b.baja += p
      b.bajas.push(
        ...data.subscriptions.filter((s) => s.userId === uid && isPayingAt(s, ini))
      )
    } else if (c > p) b.expansion += c - p
    else if (c < p) b.contraccion += p - c
  }
  b.mrrIni = sum([...prev.values()])
  b.mrrFin = sum([...cur.values()])
  for (const k of ["nuevo", "expansion", "reactivacion", "contraccion", "baja"] as const)
    b[k] = round(b[k])
  return b
}

function bridgeOfMonth(data: AdminDataset, month: MonthKey) {
  const ref = refInstant(month, data.updatedAt)
  return bridge(data, monthEnd(addMonths(month, -1)), ref)
}

function riskSignals(
  data: AdminDataset,
  s: Subscription,
  ref: Date,
  projectsByUser: Map<string, AdminProject[]>
) {
  const u = data.users.find((x) => x.id === s.userId)!
  const pagos = data.payments
    .filter((p) => p.subscriptionId === s.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const ultimo = pagos.filter((p) => ms(p.createdAt) <= ref.getTime()).at(-1)
  const rechazado90 = data.payments.some(
    (p) =>
      p.userId === s.userId &&
      p.status === "rechazado" &&
      daysBetween(p.createdAt, ref) <= 90 &&
      daysBetween(p.createdAt, ref) >= 0
  )
  const dias = daysBetween(ref, s.renewsAt)
  const senales: Senal[] = []
  if (dias >= 0 && dias <= 30 && rechazado90) senales.push("rechazo-previo")
  if (dias < 0 && s.status !== "activa") senales.push("vencida-en-gracia")
  if (ultimo && (ultimo.status === "rechazado" || ultimo.status === "pendiente"))
    senales.push(
      ultimo.status === "pendiente" ? "pago-sin-verificar" : "ultimo-cobro-rechazado"
    )
  if (daysBetween(u.lastActiveAt, ref) > 14) senales.push("inactivo-14d")
  const ciclo = cycleStart(s, ref)
  const proyectosCiclo = (projectsByUser.get(s.userId) ?? []).filter(
    (p) => p.status === "listo" && inRange(p.createdAt, ciclo, ref)
  ).length
  if (proyectosCiclo === 0) senales.push("sin-proyectos-ciclo")
  if (!pagos.some((p) => p.status === "aprobado" && p.kind === "renovacion"))
    senales.push("primera-renovacion")
  return {
    senales,
    ultimo,
    proyectosCiclo,
    dias,
    intentos: pagos.filter(
      (p) => p.status === "rechazado" && daysBetween(p.createdAt, ref) <= 30
    ).length,
  }
}

function computeMrr(
  data: AdminDataset,
  month: MonthKey,
  projectsByUser: Map<string, AdminProject[]>
): MrrBlock {
  const { ref } = windows(month, data.updatedAt)
  const b = bridgeOfMonth(data, month)
  const activas = data.subscriptions.filter((s) => isPayingAt(s, ref))
  const total = b.mrrFin

  let riesgo = 0
  let n = 0
  let d7Monto = 0
  let d7N = 0
  for (const s of activas) {
    const r = riskSignals(data, s, ref, projectsByUser)
    const grave = r.senales.filter((x) => x !== "primera-renovacion")
    if (grave.length === 0) continue
    riesgo += monthlyPrice(s)
    n += 1
    if (r.dias <= 7) {
      d7Monto += monthlyPrice(s)
      d7N += 1
    }
  }

  const porPlan = PLAN_IDS.filter((p) => p !== "free" && p !== "interno").map((plan) => {
    const subs = activas.filter((s) => s.plan === plan)
    const mrr = sum(subs.map(monthlyPrice))
    return {
      plan,
      mrr,
      pct: pct(mrr, total) ?? 0,
      clientes: subs.length,
      arppu: subs.length ? round(mrr / subs.length) : 0,
    }
  })

  const netos = [1, 2, 3]
    .map((k) => bridgeOfMonth(data, addMonths(month, -k)))
    .map((x) => x.nuevo + x.expansion + x.reactivacion - x.contraccion - x.baja)
  const sparkline = Array.from({ length: 6 }, (_, i) => addMonths(month, i - 5)).map(
    (m) => ({ month: m, mrr: bridgeOfMonth(data, m).mrrFin })
  )

  return {
    total,
    previous: b.mrrIni,
    arr: round(total * 12),
    nuevo: b.nuevo,
    expansion: b.expansion,
    reactivacion: b.reactivacion,
    contraccion: b.contraccion,
    baja: b.baja,
    neto: round(b.nuevo + b.expansion + b.reactivacion - b.contraccion - b.baja),
    netoMedia3m: avg(netos),
    enRiesgo: {
      monto: round(riesgo),
      n,
      pct: pct(riesgo, total) ?? 0,
      d7Monto: round(d7Monto),
      d7N,
    },
    porPlan,
    sparkline,
  }
}

function computeClientes(data: AdminDataset, month: MonthKey): ClientesBlock {
  const { ref } = windows(month, data.updatedAt)
  const b = bridgeOfMonth(data, month)
  const n = new Set(
    data.subscriptions.filter((s) => isPayingAt(s, ref)).map((s) => s.userId)
  ).size
  const nInicio = new Set(
    data.subscriptions
      .filter((s) => isPayingAt(s, monthEnd(addMonths(month, -1))))
      .map((s) => s.userId)
  ).size

  const motivoDe = (s: Subscription): MotivoBaja =>
    s.canceledAt
      ? "voluntaria"
      : (data.payments
          .filter((p) => p.subscriptionId === s.id && p.status === "rechazado")
          .at(-1)?.failureReason ?? "cobro-fallido")
  const motivos = new Map<MotivoBaja, { n: number; mrr: number; voluntaria: boolean }>()
  for (const s of b.bajas) {
    const motivo = motivoDe(s)
    const m = motivos.get(motivo) ?? { n: 0, mrr: 0, voluntaria: Boolean(s.canceledAt) }
    m.n += 1
    m.mrr += monthlyPrice(s)
    motivos.set(motivo, m)
  }
  const voluntarias = b.bajas.filter((s) => s.canceledAt).length
  const involuntarias = b.bajas.length - voluntarias

  let act3 = 0
  let baj3 = 0
  const nrrs: number[] = []
  for (let k = 0; k < 3; k++) {
    const m = addMonths(month, -k)
    const x = bridgeOfMonth(data, m)
    const ini = new Set(
      data.subscriptions
        .filter((s) => isPayingAt(s, monthEnd(addMonths(m, -1))))
        .map((s) => s.userId)
    ).size
    act3 += ini
    baj3 += x.bajas.length
    if (x.mrrIni > 0)
      nrrs.push(((x.mrrIni + x.expansion - x.contraccion - x.baja) / x.mrrIni) * 100)
  }

  const pagaron = new Set(
    data.payments
      .filter((p) => p.status === "aprobado" && ms(p.createdAt) <= ref.getTime())
      .map((p) => p.userId)
  ).size

  return {
    n,
    nInicio,
    nuevos: b.nuevos,
    bajas: b.bajas.length,
    reactivados: b.reactivados,
    churn: {
      pct: pct(b.bajas.length, nInicio),
      pct3m: pct(baj3, act3),
      voluntarias,
      involuntarias,
      involuntarioPct: pct(involuntarias, b.bajas.length),
      mrrPerdido: b.baja,
      motivos: [...motivos.entries()]
        .map(([motivo, m]) => ({
          motivo,
          n: m.n,
          mrr: round(m.mrr),
          voluntaria: m.voluntaria,
        }))
        .sort((a, b) => b.mrr - a.mrr),
      nominal: b.bajas.map((s) => ({
        userId: s.userId,
        userName: data.users.find((u) => u.id === s.userId)?.name ?? s.userId,
        plan: s.plan,
        mrr: round(monthlyPrice(s)),
        motivo: motivoDe(s),
      })),
    },
    nrr3m: nrrs.length ? round(nrrs.reduce((a, b) => a + b, 0) / nrrs.length, 1) : null,
    pagaronAlgunaVez: pagaron,
    perdidaHistoricaPct: pct(Math.max(0, pagaron - n), pagaron),
  }
}

// ---------------------------------------------------------------------------
// Cobros y caja
// ---------------------------------------------------------------------------

function computeCobros(data: AdminDataset, month: MonthKey): CobrosBlock {
  const { ref, inicio, prevInicio, prevFin } = windows(month, data.updatedAt)
  const del = data.payments.filter((p) => inRange(p.createdAt, inicio, ref))
  const prev = data.payments.filter((p) => inRange(p.createdAt, prevInicio, prevFin))
  const by = (status: Payment["status"], list = del) =>
    list.filter((p) => p.status === status)
  const monto = (list: Payment[]) => sum(list.map((p) => p.amount))

  const aprobado = monto(by("aprobado"))
  const reembolsado = monto(by("reembolsado"))
  const nA = by("aprobado").length
  const nR = by("rechazado").length

  const tipos = (["nueva", "renovacion", "upgrade"] as const).map((kind) => ({
    kind,
    aprobados: del.filter((p) => p.kind === kind && p.status === "aprobado").length,
    rechazados: del.filter((p) => p.kind === kind && p.status === "rechazado").length,
    monto: monto(del.filter((p) => p.kind === kind && p.status === "aprobado")),
  }))

  const metodos = new Map<
    PaymentMethod,
    { amount: number; n: number; rechazados: number }
  >()
  for (const p of del) {
    const m = metodos.get(p.method) ?? { amount: 0, n: 0, rechazados: 0 }
    if (p.status === "aprobado") {
      m.amount += p.amount
      m.n += 1
    }
    if (p.status === "rechazado") m.rechazados += 1
    metodos.set(p.method, m)
  }

  const renov3m = data.payments.filter(
    (p) =>
      p.kind !== "nueva" &&
      daysBetween(p.createdAt, ref) <= 92 &&
      daysBetween(p.createdAt, ref) >= 0
  )
  const renovOk = renov3m.filter((p) => p.status === "aprobado").length
  const renovKo = renov3m.filter((p) => p.status === "rechazado").length
  const ult30 = data.payments.filter(
    (p) => daysBetween(p.createdAt, ref) <= 30 && daysBetween(p.createdAt, ref) >= 0
  )

  return {
    aprobado,
    rechazado: monto(by("rechazado")),
    pendiente: monto(by("pendiente")),
    reembolsado,
    neto: round(aprobado - reembolsado),
    netoPrevio: round(monto(by("aprobado", prev)) - monto(by("reembolsado", prev))),
    nAprobados: nA,
    nRechazados: nR,
    nPendientes: by("pendiente").length,
    nReembolsos: by("reembolsado").length,
    cobroEfectivoPct: pct(nA, nA + nR),
    cobroEfectivoRenovaciones3mPct: pct(renovOk, renovOk + renovKo),
    tasaReembolso30dPct: pct(
      monto(ult30.filter((p) => p.status === "reembolsado")),
      monto(ult30.filter((p) => p.status === "aprobado"))
    ),
    porTipo: tipos,
    porMetodo: [...metodos.entries()]
      .map(([method, m]) => ({
        method,
        amount: round(m.amount),
        n: m.n,
        rechazados: m.rechazados,
      }))
      .sort((a, b) => b.amount - a.amount),
  }
}

function comisionDe(data: AdminDataset, p: Payment) {
  const u = data.users.find((x) => x.id === p.userId)
  const a = u?.affiliateId
    ? data.affiliates.find((x) => x.id === u.affiliateId)
    : undefined
  return a ? (p.amount * a.commissionPct) / 100 : 0
}

function recompensaValor(data: AdminDataset, from: Date, to: Date) {
  // La recompensa se otorga al convertirse el invitado: fecha de su primer pago
  let minutos = 0
  for (const r of data.referrals) {
    if (r.status !== "convertido" || !r.rewardGranted) continue
    const u = data.users.find((x) => x.id === r.referredId)
    if (u?.firstPaidAt && inRange(u.firstPaidAt, from, to)) minutos += r.rewardMinutes
  }
  return round(minutos * VALOR_MINUTO_RECOMPENSA)
}

function cajaNetaEn(data: AdminDataset, from: Date, to: Date) {
  const pagos = data.payments.filter((p) => inRange(p.createdAt, from, to))
  const aprobado = sum(pagos.filter((p) => p.status === "aprobado").map((p) => p.amount))
  const reembolsado = sum(
    pagos.filter((p) => p.status === "reembolsado").map((p) => p.amount)
  )
  const ia = sum(
    data.costs.filter((c) => inRange(c.createdAt, from, to)).map((c) => c.amount)
  )
  // Comisiones pagadas: las devengadas por pagos anteriores a la liquidación
  const comisionesPagadas = sum(
    pagos
      .filter((p) => p.status === "aprobado" && p.createdAt < COMISIONES_LIQUIDADAS_HASTA)
      .map((p) => comisionDe(data, p))
  )
  const recompensas = recompensaValor(data, from, to)
  return {
    aprobado,
    reembolsado,
    ia,
    comisionesPagadas,
    recompensas,
    neta: round(aprobado - reembolsado - ia - comisionesPagadas - recompensas),
  }
}

function computeCaja(
  data: AdminDataset,
  month: MonthKey,
  vencimientos: VencimientosBlock,
  afiliados: AffiliateStats[],
  referidos: ReferralStats
): CajaBlock {
  const { ref, inicio, prevInicio, prevFin } = windows(month, data.updatedAt)
  const actual = cajaNetaEn(data, inicio, ref)
  const previa = cajaNetaEn(data, prevInicio, prevFin)
  const acumulada = cajaNetaEn(data, new Date(0), ref).neta
  const media3 = avg(
    [1, 2, 3].map(
      (k) =>
        cajaNetaEn(data, monthStart(addMonths(month, -k)), monthEnd(addMonths(month, -k)))
          .neta
    )
  )
  const renov = data.payments.filter(
    (p) => p.kind !== "nueva" && ms(p.createdAt) <= ref.getTime()
  )
  const ok = renov.filter((p) => p.status === "aprobado").length
  const ko = renov.filter((p) => p.status === "rechazado").length
  const tasa = ok + ko > 0 ? ok / (ok + ko) : null
  const cobrosPrevistos = round(vencimientos.d30.monto * (tasa ?? 1))
  return {
    ...actual,
    netaPrevia: previa.neta,
    acumulada,
    pasivoPendiente: round(
      sum(afiliados.map((a) => a.comisionPendiente)) + referidos.valorPendiente
    ),
    prevision30d: round(
      media3 + cobrosPrevistos - (actual.ia / Math.max(1, daysBetween(inicio, ref))) * 30
    ),
    cobrosPrevistos30d: cobrosPrevistos,
    tasaCobroRenovaciones: tasa === null ? null : round(tasa * 100, 1),
  }
}

// ---------------------------------------------------------------------------
// Usuarios, actividad, conversión y funnel
// ---------------------------------------------------------------------------

function activeUsersIn(
  data: AdminDataset,
  from: Date,
  to: Date,
  projectsByUser: Map<string, AdminProject[]>
) {
  return data.users.filter(
    (u) =>
      u.plan !== "interno" &&
      (projectsByUser.get(u.id) ?? []).some((p) => inRange(p.createdAt, from, to))
  )
}

function computeActividad(
  data: AdminDataset,
  month: MonthKey,
  projectsByUser: Map<string, AdminProject[]>
): ActividadBlock {
  const { ref } = windows(month, data.updatedAt)
  const mau = activeUsersIn(data, addDays(ref, -30), ref, projectsByUser)
  const mauPrevio = activeUsersIn(
    data,
    addDays(ref, -60),
    addDays(ref, -30),
    projectsByUser
  )
  const wau = activeUsersIn(data, addDays(ref, -7), ref, projectsByUser)
  const mauNuevos = mau.filter((u) => daysBetween(u.createdAt, ref) <= 30)
  const pagantes = data.subscriptions.filter((s) => isPayingAt(s, ref))
  const pagantesActivos = pagantes.filter((s) =>
    (projectsByUser.get(s.userId) ?? []).some((p) =>
      inRange(p.createdAt, cycleStart(s, ref), ref)
    )
  )
  const wauSerie = Array.from({ length: 12 }, (_, i) => {
    const to = addDays(ref, -7 * (11 - i))
    const from = addDays(to, -7)
    return {
      semana: to.toISOString().slice(0, 10),
      wau: activeUsersIn(data, from, to, projectsByUser).length,
    }
  })
  return {
    mau: mau.length,
    mauPrevio: mauPrevio.length,
    wau: wau.length,
    adherenciaPct: pct(wau.length, mau.length),
    mauNuevos: mauNuevos.length,
    mauRecurrentes: mau.length - mauNuevos.length,
    pagantesActivos: pagantesActivos.length,
    pagantesActivosPct: pct(pagantesActivos.length, pagantes.length),
    freeActivos: mau.filter((u) => u.plan === "free").length,
    wauSerie,
    tono:
      pct(pagantesActivos.length, pagantes.length) !== null &&
      pct(pagantesActivos.length, pagantes.length)! < UMBRAL_PAGANTES_ACTIVOS_PCT
        ? "aviso"
        : "neutral",
  }
}

function computeUsuarios(
  data: AdminDataset,
  month: MonthKey,
  clientes: ClientesBlock,
  projectsByUser: Map<string, AdminProject[]>
): UsuariosBlock {
  const { ref, inicio, prevInicio, prevFin, prevMonth } = windows(month, data.updatedAt)
  const before = monthEnd(prevMonth)
  const hasta = data.users.filter((u) => ms(u.createdAt) < ref.getTime())
  const hastaPrev = data.users.filter((u) => ms(u.createdAt) < before.getTime())
  const internos = hasta.filter((u) => u.plan === "interno")
  const elegibles = hasta.length - internos.length
  const pagandoIds = new Set(
    data.subscriptions.filter((s) => isPayingAt(s, ref)).map((s) => s.userId)
  )

  const planOf = (u: AdminUser): PlanId => planResueltoAt(u, data.subscriptions, ref).plan
  const cuenta = new Map<PlanId, number>()
  for (const u of hasta) cuenta.set(planOf(u), (cuenta.get(planOf(u)) ?? 0) + 1)
  const porPlan = PLAN_IDS.map((plan) => ({
    plan,
    n: cuenta.get(plan) ?? 0,
    pct: pct(cuenta.get(plan) ?? 0, hasta.length) ?? 0,
  }))

  const canales = new Map<AcquisitionChannel, ChannelStats>()
  for (const u of hasta) {
    const c = canales.get(u.channel) ?? {
      channel: u.channel,
      total: 0,
      altasMes: 0,
      activadosD7: 0,
      activacionPct: null,
      pagando: 0,
      conversionPct: null,
      ingreso: 0,
      senal: null,
    }
    c.total += 1
    if (inRange(u.createdAt, inicio, ref)) c.altasMes += 1
    if (esActivadoD7(u)) c.activadosD7 += 1
    const pagos = data.payments.filter(
      (p) =>
        p.userId === u.id && p.status === "aprobado" && ms(p.createdAt) <= ref.getTime()
    )
    if (u.plan !== "interno" && pagos.length) c.pagando += 1
    c.ingreso += sum(pagos.map((p) => p.amount))
    canales.set(u.channel, c)
  }
  const conPct = [...canales.values()].map((c) => ({
    ...c,
    ingreso: round(c.ingreso),
    activacionPct: pct(c.activadosD7, c.total),
    conversionPct: pct(c.pagando, c.total),
  }))
  const referenciaActivacionPct =
    conPct.find((c) => c.channel === "organico")?.activacionPct ?? null
  const porCanal: ChannelStats[] = conPct
    .map((c) => ({
      ...c,
      senal: canalFlojo(c, referenciaActivacionPct)
        ? ("activa-menos-mitad-organico" as const)
        : null,
    }))
    .sort((a, b) => b.total - a.total)

  // Por país: la clave es el código ISO; el nombre solo se pinta
  const activos30 = new Set(
    activeUsersIn(data, addDays(ref, -30), ref, projectsByUser).map((u) => u.id)
  )
  const paises = new Map<CountryCode, CountryStats>()
  for (const u of hasta) {
    const c = paises.get(u.countryCode) ?? {
      code: u.countryCode,
      total: 0,
      pctTotal: null,
      altasMes: 0,
      activos30d: 0,
      pagando: 0,
      conversionPct: null,
      mrr: 0,
      ingreso: 0,
    }
    c.total += 1
    if (inRange(u.createdAt, inicio, ref)) c.altasMes += 1
    if (activos30.has(u.id)) c.activos30d += 1
    if (pagandoIds.has(u.id)) {
      c.pagando += 1
      c.mrr += data.subscriptions
        .filter((s) => s.userId === u.id && isPayingAt(s, ref))
        .reduce((n, s) => n + monthlyPrice(s), 0)
    }
    c.ingreso += data.payments
      .filter(
        (p) =>
          p.userId === u.id && p.status === "aprobado" && ms(p.createdAt) <= ref.getTime()
      )
      .reduce((n, p) => n + p.amount, 0)
    paises.set(u.countryCode, c)
  }
  const porPais = [...paises.values()]
    .map((c) => ({
      ...c,
      pctTotal: pct(c.total, hasta.length),
      mrr: round(c.mrr),
      ingreso: round(c.ingreso),
      conversionPct: pct(c.pagando, c.total),
    }))
    .sort((a, b) => b.total - a.total)

  // La misma definición que el segmento «incoherencia» de la tabla: si no, el
  // aviso dice una cifra y «Ver la lista» enseña otra
  const incoherencias = hasta.filter((u) =>
    esIncoherente(u, ultimaSuscripcion(data, u), pagandoIds.has(u.id))
  ).length

  return {
    total: hasta.length,
    totalPrevio: hastaPrev.length,
    altas: data.users.filter((u) => inRange(u.createdAt, inicio, ref)).length,
    altasPrevias: data.users.filter((u) => inRange(u.createdAt, prevInicio, prevFin))
      .length,
    pagando: clientes.n,
    free: hasta.length - internos.length - clientes.n,
    internos: internos.length,
    elegibles,
    sinActivar: hasta.filter((u) => u.flags.includes("sin-activar")).length,
    incoherencias,
    referenciaActivacionPct,
    porPlan,
    porCanal,
    porPais,
  }
}

/**
 * Cuentas registradas hasta el instante de referencia del mes, por plan
 * resuelto, y cuántas de ellas pagan. Cuenta personas, no suscripciones: con
 * datos reales una persona puede tener dos. Misma población que
 * `UsuariosBlock.total` (todos los estados, suspendidas incluidas).
 */
export function cuentasPorPlan(
  data: AdminDataset,
  month: MonthKey
): Record<PlanId, CuentasPlan> {
  const ref = refInstant(month, data.updatedAt)
  const out = Object.fromEntries(
    PLAN_IDS.map((p) => [p, { cuentas: 0, dePago: 0 }])
  ) as Record<PlanId, CuentasPlan>
  for (const u of data.users) {
    if (ms(u.createdAt) >= ref.getTime()) continue
    const { plan, dePago } = planResueltoAt(u, data.subscriptions, ref)
    out[plan].cuentas += 1
    if (dePago) out[plan].dePago += 1
  }
  return out
}

function funnelOf(
  users: AdminUser[],
  from: Date,
  to: Date,
  ref: Date,
  etiqueta: string
): FunnelRow {
  const cohorte = users.filter(
    (u) => u.plan !== "interno" && inRange(u.createdAt, from, to)
  )
  const conProyecto = cohorte.filter(
    (u) => u.firstProjectAt && daysBetween(u.createdAt, u.firstProjectAt) <= 7
  ).length
  const activados = cohorte.filter(esActivadoD7).length
  const pagantes = cohorte.filter(
    (u) => u.firstPaidAt && daysBetween(u.createdAt, u.firstPaidAt) <= 30
  ).length
  const enCurso = ms(addDays(to, 30)) > ref.getTime()
  const pctProyecto = pct(conProyecto, cohorte.length)
  const U = UMBRAL_FUNNEL
  const senales: FunnelSenal[] = []
  if (cohorte.length >= U.minRegistrados && (pctProyecto ?? 0) < U.proyectoPct)
    senales.push("registro-proyecto-bajo")
  if (conProyecto >= U.minConProyecto && activados / conProyecto < U.clipRatio)
    senales.push("proyecto-clip-bajo")
  if (
    !enCurso &&
    activados >= U.minRegistrados &&
    (pagantes / activados) * 100 < U.pagoPct
  )
    senales.push("clip-pago-bajo")
  return {
    etiqueta,
    desde: from.toISOString(),
    hasta: to.toISOString(),
    registrados: cohorte.length,
    conProyecto,
    activados,
    pagantes,
    pctProyecto,
    pctActivados: pct(activados, cohorte.length),
    pctPagantes: pct(pagantes, cohorte.length),
    enCurso,
    senales,
  }
}

/**
 * Activación D7 para el KPI: la última cohorte mensual con los 7 días cumplidos
 * (`hasta` + 7 ≤ ref) frente a la media de las tres anteriores. El tono lo dan
 * sus señales: pipeline es alerta, fricción de subida es aviso.
 */
function computeActivacionD7(funnelMensual: FunnelRow[], ref: Date): ActivacionD7Block {
  const cerradas = funnelMensual.filter((r) => ms(addDays(r.hasta, 7)) <= ref.getTime())
  const ultima = cerradas.at(-1) ?? null
  const anteriores = cerradas
    .slice(-4, -1)
    .map((r) => r.pctActivados)
    .filter((x): x is number => x !== null)
  const tono: Tono = !ultima
    ? "neutral"
    : ultima.senales.includes("proyecto-clip-bajo")
      ? "alerta"
      : ultima.senales.includes("registro-proyecto-bajo")
        ? "aviso"
        : "neutral"
  return {
    ultima,
    media3Anteriores: anteriores.length ? avg(anteriores) : null,
    cerradas: cerradas.length,
    tono,
  }
}

function computeFunnels(data: AdminDataset, month: MonthKey) {
  const { ref, inicio } = windows(month, data.updatedAt)
  const funnel = funnelOf(data.users, inicio, ref, ref, month)
  const funnelSemanal = Array.from({ length: 8 }, (_, i) => {
    const to = addDays(ref, -7 * (7 - i))
    const from = addDays(to, -7)
    return funnelOf(data.users, from, to, ref, from.toISOString().slice(0, 10))
  })
  const funnelMensual = Array.from({ length: 6 }, (_, i) => addMonths(month, i - 5)).map(
    (m) => funnelOf(data.users, monthStart(m), m === month ? ref : monthEnd(m), ref, m)
  )
  return { funnel, funnelSemanal, funnelMensual }
}

function computeTtv(
  data: AdminDataset,
  month: MonthKey,
  projectsByUser: Map<string, AdminProject[]>
): TtvBlock {
  const { ref } = windows(month, data.updatedAt)
  const horas = (from: Date, to: Date) =>
    data.users
      .filter(
        (u) => u.plan !== "interno" && u.firstClipAt && inRange(u.firstClipAt, from, to)
      )
      .map((u) => round(daysBetween(u.createdAt, u.firstClipAt!) * 24, 1))
  const actual = horas(addDays(ref, -30), ref)
  const previas = horas(addDays(ref, -60), addDays(ref, -30))
  const sorted = [...actual].sort((a, b) => a - b)
  const primeros = data.users.filter(
    (u) =>
      u.plan !== "interno" &&
      u.firstProjectAt &&
      inRange(u.firstProjectAt, addDays(ref, -30), ref)
  )
  const fallidos = primeros.filter(
    (u) => (projectsByUser.get(u.id) ?? [])[0]?.status === "error"
  ).length
  return {
    medianaHoras: median(actual),
    medianaHorasPrevias: median(previas),
    p75Horas: sorted.length
      ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.75))]
      : null,
    falloPrimerProyectoPct: pct(fallidos, primeros.length),
    primerosProyectos: primeros.length,
  }
}

function computeConversion(
  data: AdminDataset,
  month: MonthKey,
  clientes: ClientesBlock,
  elegibles: number
): ConversionBlock {
  const { ref } = windows(month, data.updatedAt)
  const cohortes: CohortConversion[] = Array.from({ length: 9 }, (_, i) =>
    addMonths(month, i - 8)
  ).map((m) => {
    const fin = m === month ? ref : monthEnd(m)
    const c = data.users.filter(
      (u) => u.plan !== "interno" && inRange(u.createdAt, monthStart(m), fin)
    )
    const paid = (dias: number) =>
      c.filter((u) => u.firstPaidAt && daysBetween(u.createdAt, u.firstPaidAt) <= dias)
        .length
    const activados = c.filter(esActivadoD7).length
    const pagantes30 = paid(30)
    return {
      cohorte: m,
      registrados: c.length,
      conv30: pct(pagantes30, c.length),
      conv60: pct(paid(60), c.length),
      cerrada30: ms(addDays(fin, 30)) <= ref.getTime(),
      cerrada60: ms(addDays(fin, 60)) <= ref.getTime(),
      activadosD7: activados,
      pagantesD30: pagantes30,
      convActivados: pct(pagantes30, activados),
      medianaDiasAPago: median(
        c
          .filter((u) => u.firstPaidAt)
          .map((u) => round(daysBetween(u.createdAt, u.firstPaidAt!), 1))
      ),
    }
  })
  const cerradas = cohortes.filter((c) => c.cerrada60)
  const ultima = cerradas.at(-1) ?? null
  const anteriores = cerradas.slice(-4, -1)
  const media = (k: "conv60" | "convActivados") => {
    const xs = anteriores.map((c) => c[k]).filter((x): x is number => x !== null)
    return xs.length ? round(xs.reduce((a, b) => a + b, 0) / xs.length, 1) : null
  }
  return {
    pagaronAlgunaVez: clientes.pagaronAlgunaVez,
    pagaronAlgunaVezPct: pct(clientes.pagaronAlgunaVez, elegibles) ?? 0,
    ultimaCerrada: ultima,
    media3Anteriores: { conv60: media("conv60"), convActivados: media("convActivados") },
    cohortes,
    metaConv60: META_CONV60_PCT,
    metaConvActivados: META_CONV_ACTIVADOS_PCT,
    tono: !ultima
      ? "neutral"
      : ultima.convActivados !== null &&
          ultima.convActivados < UMBRAL_CONV_ACTIVADOS_ALERTA_PCT
        ? "alerta"
        : ultima.conv60 !== null && ultima.conv60 < META_CONV60_PCT
          ? "aviso"
          : "neutral",
  }
}

// ---------------------------------------------------------------------------
// Vencimientos y colas de cobro
// ---------------------------------------------------------------------------

function computeVencimientos(
  data: AdminDataset,
  month: MonthKey,
  projectsByUser: Map<string, AdminProject[]>
): VencimientosBlock {
  const { ref } = windows(month, data.updatedAt)
  const items: RenewalItem[] = []

  for (const s of data.subscriptions) {
    if (s.plan === "interno" || s.amount === 0) continue
    const u = data.users.find((x) => x.id === s.userId)!
    const r = riskSignals(data, s, ref, projectsByUser)
    const pendiente = r.ultimo?.status === "pendiente"
    const rechazadoSinRecuperar = r.ultimo?.status === "rechazado" && r.dias > -30
    const vencida =
      (s.status === "vencida" || s.status === "pendiente-pago") &&
      r.dias < 0 &&
      r.dias >= -30 &&
      !s.canceledAt
    const paying = isPayingAt(s, ref)
    const proxima = paying && r.dias >= 0 && r.dias <= 30
    const inactivo =
      paying &&
      (r.senales.includes("inactivo-14d") || r.senales.includes("sin-proyectos-ciclo"))

    let cola: RenewalItem["cola"] | null = null
    if (pendiente) cola = "pendiente"
    else if (rechazadoSinRecuperar && (vencida || s.status === "pendiente-pago"))
      cola = "rechazado"
    else if (vencida) cola = "vencida"
    else if (proxima) cola = "proxima"
    else if (inactivo) cola = "inactivo"
    if (!cola) continue

    const horasPendiente = pendiente ? daysBetween(r.ultimo!.createdAt, ref) * 24 : 0
    const diasVencida = -r.dias
    let semaforo: Semaforo = "verde"
    let motivo: MotivoVencimiento
    let accion: AccionCola = "sin-accion"
    switch (cola) {
      case "pendiente":
        semaforo = horasPendiente > 24 ? "rojo" : horasPendiente > 4 ? "ambar" : "verde"
        motivo = {
          code: "transferenciaSinVerificar",
          values: { horas: Math.round(horasPendiente) },
        }
        accion = "verificar-pago"
        break
      case "rechazado":
        semaforo = r.intentos >= 3 || diasVencida >= 7 ? "rojo" : "ambar"
        motivo = {
          code: "cobroRechazado",
          values: { razon: r.ultimo?.failureReason ?? null, intentos: r.intentos },
        }
        accion =
          s.paymentMethod === "tarjeta" ? "reintentar-cobro" : "enviar-enlace-yape-plin"
        break
      case "vencida":
        semaforo = diasVencida >= 7 ? "rojo" : diasVencida >= 3 ? "ambar" : "verde"
        motivo = { code: "vencidaSinRenovar", values: { dias: Math.round(diasVencida) } }
        accion = diasVencida > 7 ? "contactar-o-prueba" : "recordatorio-renovacion"
        break
      case "proxima": {
        const graves = r.senales.filter((x) => x !== "primera-renovacion")
        semaforo = graves.length
          ? r.dias <= 7
            ? "rojo"
            : "ambar"
          : r.dias <= 7
            ? "ambar"
            : "verde"
        motivo = {
          code: "renuevaPronto",
          values: {
            senales: graves,
            primeraRenovacion: r.senales.includes("primera-renovacion"),
            cobroManual: s.paymentMethod === "tarjeta" ? null : s.paymentMethod,
          },
        }
        accion = graves.length ? "recordatorio-previo" : "sin-accion"
        break
      }
      case "inactivo":
        semaforo = r.proyectosCiclo === 0 && r.dias <= 15 ? "rojo" : "ambar"
        motivo =
          r.proyectosCiclo === 0
            ? { code: "sinProyectosCiclo" }
            : { code: "sinActividad14d" }
        accion = "mensaje-personal"
        break
    }

    items.push({
      subscriptionId: s.id,
      userId: u.id,
      userName: u.name,
      userEmail: u.email,
      countryCode: u.countryCode,
      plan: s.plan,
      billing: s.billing,
      amount: s.amount,
      mrr: round(monthlyPrice(s)),
      renewsAt: s.renewsAt,
      diasRestantes: round(r.dias, 0),
      status: s.status,
      method: s.paymentMethod,
      cola,
      senales: r.senales,
      semaforo,
      motivo,
      ultimoPago: r.ultimo
        ? {
            createdAt: r.ultimo.createdAt,
            status: r.ultimo.status,
            method: r.ultimo.method,
            amount: r.ultimo.amount,
          }
        : undefined,
      intentosFallidos: r.intentos,
      proyectosCiclo: r.proyectosCiclo,
      lastActiveAt: u.lastActiveAt,
      accion,
    })
  }
  const peso = { rojo: 0, ambar: 1, verde: 2 }
  items.sort(
    (a, b) => peso[a.semaforo] - peso[b.semaforo] || a.diasRestantes - b.diasRestantes
  )

  const proximas = items.filter((i) => i.cola === "proxima")
  const d7 = proximas.filter((i) => i.diasRestantes <= 7)
  const conSenal = (xs: RenewalItem[]) => xs.filter((i) => i.semaforo !== "verde").length
  const vencidas = items.filter((i) => i.cola === "vencida" || i.cola === "rechazado")
  const bucket = (desde: number, hasta: number, min: number, max: number): Bucket => {
    const xs = vencidas.filter((i) => -i.diasRestantes >= min && -i.diasRestantes <= max)
    return { desde, hasta, n: xs.length, monto: sum(xs.map((i) => i.amount)) }
  }
  const rechazados = items.filter((i) => i.cola === "rechazado")
  const conRechazo = data.subscriptions.filter((s) =>
    data.payments.some(
      (p) =>
        p.subscriptionId === s.id &&
        p.status === "rechazado" &&
        daysBetween(p.createdAt, ref) <= 30 &&
        daysBetween(p.createdAt, ref) >= 0
    )
  )
  const recuperadas = conRechazo.filter((s) => {
    const primer = data.payments
      .filter((p) => p.subscriptionId === s.id && p.status === "rechazado")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0]
    return data.payments.some(
      (p) =>
        p.subscriptionId === s.id &&
        p.status === "aprobado" &&
        p.createdAt > primer.createdAt
    )
  })
  const pendientes = items.filter((i) => i.cola === "pendiente")
  const inactivos = items.filter((i) => i.cola === "inactivo")
  const renov = data.payments.filter(
    (p) => p.kind !== "nueva" && ms(p.createdAt) <= ref.getTime()
  )
  const ok = renov.filter((p) => p.status === "aprobado").length
  const ko = renov.filter((p) => p.status === "rechazado").length

  return {
    d7: { n: d7.length, monto: sum(d7.map((i) => i.amount)), conSenal: conSenal(d7) },
    d30: {
      n: proximas.length,
      monto: sum(proximas.map((i) => i.amount)),
      conSenal: conSenal(proximas),
    },
    vencidas: {
      n: vencidas.length,
      monto: sum(vencidas.map((i) => i.amount)),
      buckets: [bucket(1, 3, 0, 3), bucket(4, 7, 4, 7), bucket(8, 30, 8, 30)],
    },
    rechazados: {
      n: rechazados.length,
      monto: sum(rechazados.map((i) => i.amount)),
      tasaRecuperacion30dPct: pct(recuperadas.length, conRechazo.length),
    },
    pendientes: {
      n: pendientes.length,
      monto: sum(pendientes.map((i) => i.amount)),
      maxHoras: Math.round(
        Math.max(
          0,
          ...pendientes.map((i) => daysBetween(i.ultimoPago!.createdAt, ref) * 24)
        )
      ),
    },
    inactivos: {
      rojo: inactivos.filter((i) => i.semaforo === "rojo").length,
      ambar: inactivos.filter((i) => i.semaforo === "ambar").length,
      mrrRojo: sum(inactivos.filter((i) => i.semaforo === "rojo").map((i) => i.mrr)),
      mrrAmbar: sum(inactivos.filter((i) => i.semaforo === "ambar").map((i) => i.mrr)),
    },
    cobrosPrevistos30d: round(
      sum(proximas.map((i) => i.amount)) * (ok + ko > 0 ? ok / (ok + ko) : 1)
    ),
    items,
  }
}

// ---------------------------------------------------------------------------
// Uso, fuentes, costes y pipeline
// ---------------------------------------------------------------------------

function computeUso(data: AdminDataset, month: MonthKey): UsoBlock {
  const { ref, inicio, prevInicio, prevFin } = windows(month, data.updatedAt)
  const del = data.projects.filter((p) => inRange(p.createdAt, inicio, ref))
  const prev = data.projects.filter((p) => inRange(p.createdAt, prevInicio, prevFin))
  const hasta = data.projects.filter((p) => ms(p.createdAt) < ref.getTime())
  const listos = del.filter((p) => p.status === "listo")
  const clips = del.reduce((n, p) => n + p.clips, 0)
  const errores = del.filter((p) => p.status === "error").length

  const ult30 = data.projects.filter((p) => inRange(p.createdAt, addDays(ref, -30), ref))
  const prev30 = data.projects.filter((p) =>
    inRange(p.createdAt, addDays(ref, -60), addDays(ref, -30))
  )
  const primeraFuente = new Map<string, ProjectSource>()
  for (const p of [...data.projects].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  )) {
    if (!primeraFuente.has(p.userId)) primeraFuente.set(p.userId, p.source)
  }
  const pagaron = new Set(
    data.payments.filter((p) => p.status === "aprobado").map((p) => p.userId)
  )

  const porFuente: SourceStats[] = PROJECT_SOURCES.map((source) => {
    const s = ult30.filter((p) => p.source === source)
    const sl = s.filter((p) => p.status === "listo")
    const acumulado = hasta.filter((p) => p.source === source).length
    const primeros = [...primeraFuente.entries()].filter(([, f]) => f === source)
    const minutos = sl.reduce((n, p) => n + p.minutes, 0)
    const coste = sum(sl.map((p) => p.cost))
    return {
      source,
      proyectos: s.length,
      previos: prev30.filter((p) => p.source === source).length,
      acumulado,
      exitoPct: pct(sl.length, s.filter((p) => p.status !== "procesando").length),
      clipsPorProyecto: sl.length
        ? round(sl.reduce((n, p) => n + p.clips, 0) / sl.length, 1)
        : null,
      usuarios: new Set(s.map((p) => p.userId)).size,
      costePorProyecto: sl.length ? round(coste / sl.length, 3) : null,
      costePorMinuto: minutos > 0 ? round(coste / minutos, 4) : null,
      conversionPrimeraFuentePct: pct(
        primeros.filter(([uid]) => pagaron.has(uid)).length,
        primeros.length
      ),
      alertaCaida: acumulado > 20 && s.length === 0,
    }
  }).sort((a, b) => b.proyectos - a.proyectos || b.acumulado - a.acumulado)

  return {
    proyectos: del.length,
    proyectosPrevios: prev.length,
    clips,
    clipsPrevios: prev.reduce((n, p) => n + p.clips, 0),
    minutos: round(del.reduce((n, p) => n + p.minutes, 0)),
    minutosPrevios: round(prev.reduce((n, p) => n + p.minutes, 0)),
    clipsPorProyecto: listos.length ? round(clips / listos.length, 2) : null,
    errores,
    tasaError: pct(errores, del.length),
    procesando: del.filter((p) => p.status === "procesando").length,
    proyectosAcumulados: hasta.length,
    clipsAcumulados: hasta.reduce((n, p) => n + p.clips, 0),
    porFuente,
  }
}

/**
 * Cuándo se intentó el envío. Una fallida no tiene `publicadaEn`, así que sin
 * esto no habría forma de decir «falló hace cuatro horas»: se toma la hora
 * elegida si la hubo y, si no, la de creación.
 */
export const instanteEnvio = (p: PublicacionAdmin) =>
  p.publicadaEn ?? p.programadaPara ?? p.creadaEn

/**
 * Lo que salió a las redes en el mes, y la salud de las cuentas que lo llevan.
 *
 * SIMULADO hasta que exista la API: hoy la agenda y las cuentas viven en el
 * navegador de cada persona (`clipealo-agenda-v1`, `clipealo-cuentas-v1`) y el
 * servidor no puede contarlas. Sin `accounts` ni `publications` el bloque sale
 * a cero y la pantalla lo dice, igual que hace Mercado.
 */
export function computePublicaciones(
  data: AdminDataset,
  month: MonthKey
): PublicacionesBlock {
  const { ref, inicio, prevInicio, prevFin } = windows(month, data.updatedAt)
  const pubs = data.publications ?? []
  // Las conectadas hasta el instante del mes. El estado es el de hoy, no el de
  // entonces: no hay historia de conexiones, y decir «en junio había tres
  // caducadas» sería inventárselo
  const cuentas = (data.accounts ?? []).filter((c) => ms(c.connectedAt) < ref.getTime())

  const publicadas = pubs.filter(
    (p) =>
      p.estado === "publicada" && p.publicadaEn && inRange(p.publicadaEn, inicio, ref)
  )
  const previas = pubs.filter(
    (p) =>
      p.estado === "publicada" &&
      p.publicadaEn &&
      inRange(p.publicadaEn, prevInicio, prevFin)
  )

  const porPlataforma = SOCIAL_IDS.map((network) => {
    const n = publicadas.filter((p) => p.network === network).length
    return { network, publicadas: n, pct: pct(n, publicadas.length) }
  })
    .filter((x) => x.publicadas > 0)
    .sort((a, b) => b.publicadas - a.publicadas)

  // Siete días: los fallos se arreglan en horas, y un mes entero escondería la
  // semana en la que se cayó una integración
  const desde7 = addDays(ref, -7)
  const en7 = (p: PublicacionAdmin) => inRange(instanteEnvio(p), desde7, ref)
  const fallidas = pubs.filter((p) => p.estado === "fallida" && en7(p))
  const publicadas7 = pubs.filter((p) => p.estado === "publicada" && en7(p))
  const intentadas = fallidas.length + publicadas7.length
  const falloPct = pct(fallidas.length, intentadas)

  const motivos = new Map<MotivoFalloPublicacion, number>()
  for (const p of fallidas) {
    if (!p.motivoFallo) continue
    motivos.set(p.motivoFallo, (motivos.get(p.motivoFallo) ?? 0) + 1)
  }

  const clipsDelMes = data.projects.filter(
    (p) => p.status === "listo" && inRange(p.createdAt, inicio, ref)
  )
  const idsDelMes = new Set(clipsDelMes.map((p) => p.id))
  const clips = clipsDelMes.reduce((n, p) => n + p.clips, 0)
  const salidos = new Set(
    publicadas.filter((p) => idsDelMes.has(p.projectId)).map((p) => p.clipId)
  ).size

  // De «clip listo» a «publicado». El proyecto es lo más cerca que está el
  // dataset de la hora en que el clip quedó listo: no hay otra fecha
  const creadoDe = new Map(data.projects.map((p) => [p.id, p.createdAt]))
  const horas = publicadas
    .map((p) => {
      const creado = creadoDe.get(p.projectId)
      return creado ? round(daysBetween(creado, p.publicadaEn!) * 24, 1) : null
    })
    .filter((x): x is number => x !== null)

  const U = UMBRAL_FALLOS_PUBLICACION
  return {
    publicadas: publicadas.length,
    publicadasPrevias: previas.length,
    porPlataforma,
    fallidas7d: {
      n: fallidas.length,
      intentadas,
      pct: falloPct,
      porMotivo: [...motivos.entries()]
        .map(([motivo, n]) => ({ motivo, n }))
        .sort((a, b) => b.n - a.n),
      porPlataforma: SOCIAL_IDS.map((network) => ({
        network,
        n: fallidas.filter((p) => p.network === network).length,
      }))
        .filter((x) => x.n > 0)
        .sort((a, b) => b.n - a.n),
      tono:
        falloPct === null
          ? "neutral"
          : falloPct >= U.alertaPct
            ? "alerta"
            : falloPct >= U.avisoPct
              ? "aviso"
              : "neutral",
    },
    exito7dPct: pct(publicadas7.length, intentadas),
    cuentas: ESTADOS_CUENTA.map((estado) => ({
      estado,
      n: cuentas.filter((c) => c.estado === estado).length,
    })),
    usuariosConCuentaViva: new Set(
      cuentas.filter((c) => c.estado === "conectada").map((c) => c.userId)
    ).size,
    clipsPublicadosPct: pct(salidos, clips),
    medianaHorasAPublicar: median(horas),
  }
}

function computePipeline(
  data: AdminDataset,
  ref: Date,
  projectsByUser: Map<string, AdminProject[]>
): PipelineBlock {
  const en = (dias: number) =>
    data.projects.filter((p) => inRange(p.createdAt, addDays(ref, -dias), ref))
  const p24 = en(1)
  const p7 = en(7)
  const e24 = p24.filter((p) => p.status === "error")
  const e7 = p7.filter((p) => p.status === "error")
  const payingIds = new Set(
    data.subscriptions.filter((s) => isPayingAt(s, ref)).map((s) => s.userId)
  )
  const sinResolver = data.projects.filter(
    (p) =>
      p.status === "error" &&
      !data.projects.some(
        (q) =>
          q.userId === p.userId &&
          q.source === p.source &&
          q.createdAt > p.createdAt &&
          q.status === "listo"
      )
  )
  const atascados = data.projects.filter(
    (p) => p.status === "procesando" && daysBetween(p.createdAt, ref) * 24 > 2
  )
  const primeros = data.users.filter(
    (u) =>
      u.plan !== "interno" &&
      u.firstProjectAt &&
      inRange(u.firstProjectAt, addDays(ref, -30), ref)
  )
  const fallidos = primeros.filter(
    (u) => (projectsByUser.get(u.id) ?? [])[0]?.status === "error"
  ).length
  const costeErrores = sum(e7.map((p) => p.cost))
  const coste7 = sum(p7.map((p) => p.cost))
  const porFuente7d = PROJECT_SOURCES.map((source) => {
    const xs = p7.filter((p) => p.source === source)
    const err = xs.filter((p) => p.status === "error").length
    return {
      source,
      n: xs.length,
      errores: err,
      pct: xs.length >= 5 ? pct(err, xs.length) : null,
    }
  }).filter((x) => x.n > 0)
  return {
    err24h: { n: e24.length, total: p24.length, pct: pct(e24.length, p24.length) },
    err7d: { n: e7.length, total: p7.length, pct: pct(e7.length, p7.length) },
    sinResolver: sinResolver.length,
    sinResolverDePago: sinResolver.filter((p) => payingIds.has(p.userId)).length,
    atascados: atascados.length,
    falloPrimerProyectoPct: pct(fallidos, primeros.length),
    costeEnErrores7d: { monto: costeErrores, pct: pct(costeErrores, coste7) },
    porFuente7d,
  }
}

function computeCostes(
  data: AdminDataset,
  month: MonthKey,
  uso: UsoBlock,
  actividad: ActividadBlock,
  mrr: number,
  projectsByUser: Map<string, AdminProject[]>
): CostesBlock {
  const { ref, inicio, prevInicio, prevFin } = windows(month, data.updatedAt)
  const del = data.costs.filter((c) => inRange(c.createdAt, inicio, ref))
  const prev = data.costs.filter((c) => inRange(c.createdAt, prevInicio, prevFin))
  const total = sum(del.map((c) => c.amount))
  const previo = sum(prev.map((c) => c.amount))

  const prov = new Map<AiProvider, number>()
  const mod = new Map<string, ModelCost & { ids: Set<string> }>()
  for (const c of del) {
    prov.set(c.provider, (prov.get(c.provider) ?? 0) + c.amount)
    const key = `${c.provider}/${c.model}`
    const m = mod.get(key) ?? {
      provider: c.provider,
      model: c.model,
      amount: 0,
      units: 0,
      unitKind: c.unitKind,
      proyectos: 0,
      unitario: null,
      ids: new Set<string>(),
    }
    m.amount += c.amount
    m.units += c.units
    m.ids.add(c.projectId)
    mod.set(key, m)
  }
  const porModelo: ModelCost[] = [...mod.values()]
    .map(({ ids, ...m }) => ({
      ...m,
      amount: round(m.amount),
      proyectos: ids.size,
      unitario:
        m.unitKind === "segundos"
          ? m.units > 0
            ? round(m.amount / (m.units / 60), 4)
            : null
          : ids.size > 0
            ? round(m.amount / ids.size, 4)
            : null,
    }))
    .sort((a, b) => b.amount - a.amount)

  const porPlan = (pred: (p: PlanId) => boolean) =>
    sum(del.filter((c) => pred(c.userPlan)).map((c) => c.amount))
  const deFree = porPlan((p) => p === "free")
  const deInternos = porPlan((p) => p === "interno")
  const dePago = round(total - deFree - deInternos)

  const listos = data.projects.filter(
    (p) => inRange(p.createdAt, inicio, ref) && p.status === "listo"
  )
  const minutos = listos.reduce((n, p) => n + p.minutes, 0)
  const prevListos = data.projects.filter(
    (p) => inRange(p.createdAt, prevInicio, prevFin) && p.status === "listo"
  )
  const prevMinutos = prevListos.reduce((n, p) => n + p.minutes, 0)

  const p30 = data.projects.filter(
    (p) => inRange(p.createdAt, addDays(ref, -30), ref) && p.cost > 0
  )
  const med = median(p30.map((p) => p.cost)) ?? 0
  const medMin = median(p30.map((p) => p.cost / Math.max(p.minutes, 1))) ?? 0
  const anomalias = p30
    .map((p) => {
      const porMin = p.cost / Math.max(p.minutes, 1)
      const motivo: AnomaliaCoste | null =
        med > 0 && p.cost > med * 3
          ? "coste-3x-mediana"
          : medMin > 0 && porMin > medMin * 2
            ? "coste-minuto-2x-mediana"
            : null
      return motivo ? { p, porMin, motivo } : null
    })
    .filter(
      (x): x is { p: AdminProject; porMin: number; motivo: AnomaliaCoste } => x !== null
    )
    .sort((a, b) => b.p.cost - a.p.cost)
    .slice(0, 8)
    .map(({ p, porMin, motivo }) => ({
      projectId: p.id,
      userId: p.userId,
      userName: data.users.find((u) => u.id === p.userId)?.name ?? p.userId,
      userPlan: p.userPlan,
      cost: p.cost,
      minutes: p.minutes,
      costPorMinuto: round(porMin, 4),
      motivo,
      createdAt: p.createdAt,
    }))

  const topFree = data.users
    .filter((u) => u.plan === "free" && u.totalPaid === 0)
    .map((u) => {
      const ps = (projectsByUser.get(u.id) ?? []).filter((p) =>
        inRange(p.createdAt, inicio, ref)
      )
      return {
        userId: u.id,
        userName: u.name,
        channel: u.channel,
        proyectos: ps.length,
        minutos: round(ps.reduce((n, p) => n + p.minutes, 0)),
        cost: sum(ps.map((p) => p.cost)),
      }
    })
    .filter((x) => x.cost > 0)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10)

  return {
    total,
    previo,
    acumulado: sum(
      data.costs.filter((c) => ms(c.createdAt) < ref.getTime()).map((c) => c.amount)
    ),
    porProveedor: [...prov.entries()]
      .map(([provider, amount]) => ({
        provider,
        amount: round(amount),
        pct: pct(amount, total) ?? 0,
      }))
      .sort((a, b) => b.amount - a.amount),
    porModelo,
    porProyecto: listos.length ? round(total / listos.length, 3) : null,
    porClip: uso.clips > 0 ? round(total / uso.clips, 4) : null,
    porMinuto: minutos > 0 ? round(total / minutos, 4) : null,
    porMinutoPrevio: prevMinutos > 0 ? round(previo / prevMinutos, 4) : null,
    porUsuarioActivo: actividad.mau > 0 ? round(total / actividad.mau, 3) : null,
    deFree: {
      amount: deFree,
      pct: pct(deFree, total) ?? 0,
      porActivo:
        actividad.freeActivos > 0 ? round(deFree / actividad.freeActivos, 3) : null,
      subsidioPctMrr: pct(deFree, mrr),
    },
    dePago: { amount: dePago, pct: pct(dePago, total) ?? 0 },
    deInternos: { amount: deInternos, pct: pct(deInternos, total) ?? 0 },
    anomalias,
    topFree,
    pipeline: computePipeline(data, ref, projectsByUser),
  }
}

function computePlanes(
  data: AdminDataset,
  month: MonthKey,
  mrr: MrrBlock,
  projectsByUser: Map<string, AdminProject[]>
): PlanStats[] {
  const { ref, inicio } = windows(month, data.updatedAt)
  const activas = data.subscriptions.filter((s) => isPayingAt(s, ref))
  const costes = data.costs.filter((c) => inRange(c.createdAt, inicio, ref))
  const hace90 = addDays(ref, -90)
  return data.plans.map((plan) => {
    const subs = activas.filter((s) => s.plan === plan.id)
    const m = mrr.porPlan.find((x) => x.plan === plan.id)
    const coste = sum(costes.filter((c) => c.userPlan === plan.id).map((c) => c.amount))
    const usuarios = data.users.filter((u) =>
      plan.id === "free" || plan.id === "interno"
        ? u.plan === plan.id
        : subs.some((s) => s.userId === u.id)
    )
    const minutos30 = usuarios.map((u) =>
      (projectsByUser.get(u.id) ?? [])
        .filter((p) => inRange(p.createdAt, addDays(ref, -30), ref))
        .reduce((n, p) => n + p.minutes, 0)
    )
    const mediana = median(minutos30)
    const conMargenBajo = subs.filter((s) => {
      const c = sum(costes.filter((x) => x.userId === s.userId).map((x) => x.amount))
      return monthlyPrice(s) > 0 && 1 - c / monthlyPrice(s) < 0.7
    }).length
    const nuevos90 = data.subscriptions.filter(
      (s) => s.plan === plan.id && inRange(s.startedAt, hace90, ref)
    ).length
    let bajas3 = 0
    let ini3 = 0
    for (let k = 0; k < 3; k++) {
      const mk = addMonths(month, -k)
      const b = bridgeOfMonth(data, mk)
      bajas3 += b.bajas.filter((s) => s.plan === plan.id).length
      ini3 += data.subscriptions.filter(
        (s) => s.plan === plan.id && isPayingAt(s, monthEnd(addMonths(mk, -1)))
      ).length
    }
    const mrrPlan = m?.mrr ?? 0
    return {
      plan: plan.id,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      seatPriceMonthly: plan.seatPriceMonthly,
      minutesIncluded: plan.minutesIncluded,
      internal: plan.internal,
      clientes: subs.length,
      mrr: mrrPlan,
      pctMrr: m?.pct ?? 0,
      pctClientes: pct(subs.length, activas.length) ?? 0,
      arppu: subs.length ? round(mrrPlan / subs.length) : null,
      costeIa: coste,
      contribucion: round(mrrPlan - coste),
      contribucionPct: mrrPlan > 0 ? round(((mrrPlan - coste) / mrrPlan) * 100, 1) : null,
      medianaMinutos: mediana === null ? null : round(mediana),
      usoIncluidoPct:
        mediana === null || plan.minutesIncluded <= 0
          ? null
          : round((mediana / plan.minutesIncluded) * 100, 1),
      conMargenBajo,
      nuevos90d: nuevos90,
      bajas90d: bajas3,
      churn3mPct: pct(bajas3, ini3),
      usuarios: usuarios.length,
    }
  })
}

// ---------------------------------------------------------------------------
// LTV, PQL, dormidos
// ---------------------------------------------------------------------------

function computeLtv(
  data: AdminDataset,
  month: MonthKey,
  mrr: MrrBlock,
  clientes: ClientesBlock,
  margen: MargenBlock,
  actividad: ActividadBlock,
  referidos: ReferralStats
): LtvBlock {
  const { ref } = windows(month, data.updatedAt)
  const pagos = data.payments.filter((p) => ms(p.createdAt) <= ref.getTime())
  const neto =
    sum(pagos.filter((p) => p.status === "aprobado").map((p) => p.amount)) -
    sum(pagos.filter((p) => p.status === "reembolsado").map((p) => p.amount))
  const realizado =
    clientes.pagaronAlgunaVez > 0 ? round(neto / clientes.pagaronAlgunaVez) : null
  const churnUsado =
    clientes.churn.pct3m === null
      ? null
      : Math.max(clientes.churn.pct3m, CHURN_MINIMO_PARA_LTV_PCT)
  const margenRec = (margen.recurrentePct ?? 100) / 100
  const arppu =
    mrr.porPlan.reduce((n, p) => n + p.clientes, 0) > 0
      ? round(mrr.total / mrr.porPlan.reduce((n, p) => n + p.clientes, 0))
      : 0
  const estimado = churnUsado ? round((arppu * margenRec) / (churnUsado / 100)) : null

  const hace90 = addDays(ref, -90)
  const nuevos90 = data.payments.filter(
    (p) =>
      p.status === "aprobado" && p.kind === "nueva" && inRange(p.createdAt, hace90, ref)
  )
  const comisiones90 = sum(
    data.payments
      .filter((p) => p.status === "aprobado" && inRange(p.createdAt, hace90, ref))
      .map((p) => comisionDe(data, p))
  )
  const nuevosAfiliado = nuevos90.filter(
    (p) => data.users.find((u) => u.id === p.userId)?.affiliateId
  ).length
  const recompensas90 = recompensaValor(data, hace90, ref)
  const convertidos90 = data.referrals.filter((r) => {
    const u = data.users.find((x) => x.id === r.referredId)
    return (
      r.status === "convertido" && u?.firstPaidAt && inRange(u.firstPaidAt, hace90, ref)
    )
  }).length
  const cacAf = nuevosAfiliado > 0 ? round(comisiones90 / nuevosAfiliado) : null
  const cacRef = convertidos90 > 0 ? round(recompensas90 / convertidos90) : null
  const cacBlended =
    nuevos90.length > 0 ? round((comisiones90 + recompensas90) / nuevos90.length) : null

  const elegibles = data.users.filter((u) => {
    if (!u.firstPaidAt || u.plan === "interno") return false
    const s = data.subscriptions.find((x) => x.userId === u.id)
    const ciclo = s?.billing === "anual" ? 365 : 30
    return daysBetween(u.firstPaidAt, ref) >= ciclo
  })
  const conSegunda = elegibles.filter((u) =>
    data.payments.some(
      (p) => p.userId === u.id && p.status === "aprobado" && p.kind !== "nueva"
    )
  )
  void referidos

  return {
    arppu,
    arpu: actividad.mau > 0 ? round(mrr.total / actividad.mau, 2) : null,
    realizado,
    estimado,
    churnUsadoPct: churnUsado,
    vidaMediaMeses: churnUsado ? round(100 / churnUsado, 1) : null,
    cacAfiliados90d: cacAf,
    cacReferidos90d: cacRef,
    cacBlended90d: cacBlended,
    ltvCac:
      cacBlended && cacBlended > 0 && realizado ? round(realizado / cacBlended, 1) : null,
    paybackMeses:
      cacBlended && arppu > 0 ? round(cacBlended / (arppu * margenRec), 1) : null,
    nuevosClientes90d: nuevos90.length,
    segundaCobranza: {
      elegibles: elegibles.length,
      conSegunda: conSegunda.length,
      pct: pct(conSegunda.length, elegibles.length),
      nominal: elegibles.map((u) => ({
        userId: u.id,
        userName: u.name,
        plan: u.plan,
        pagos: data.payments.filter((p) => p.userId === u.id && p.status === "aprobado")
          .length,
      })),
    },
    nota: { n: clientes.n, bajaMinimaPct: CHURN_MINIMO_PARA_LTV_PCT },
  }
}

function pqlRows(
  data: AdminDataset,
  ref: Date,
  projectsByUser: Map<string, AdminProject[]>
): PqlRow[] {
  const free = data.plans.find((p) => p.id === "free")!
  const rows: PqlRow[] = []
  for (const u of data.users) {
    const ps = projectsByUser.get(u.id) ?? []
    const tienePagos = data.payments.some(
      (p) => p.userId === u.id && ms(p.createdAt) <= ref.getTime()
    )
    const motivo = motivoPql(u, ps, ref, free, tienePagos)
    if (!motivo) continue
    const ult30 = ps.filter((p) => inRange(p.createdAt, addDays(ref, -30), ref))
    const listos30 = ult30.filter((p) => p.status === "listo")
    const minutos30 = round(ult30.reduce((n, p) => n + p.minutes, 0))
    rows.push({
      userId: u.id,
      userName: u.name,
      userEmail: u.email,
      countryCode: u.countryCode,
      channel: u.channel,
      canalResuelto: resolveChannel(data, u),
      fuentePrincipal: mainSource(ps),
      proyectosListos30d: listos30.length,
      minutos30d: minutos30,
      costeIa30d: sum(ult30.map((p) => p.cost)),
      clips: u.clips,
      lastActiveAt: u.lastActiveAt,
      diasDesdeAlta: Math.round(daysBetween(u.createdAt, ref)),
      motivo,
    })
  }
  return rows.sort(
    (a, b) => b.proyectosListos30d - a.proyectosListos30d || b.minutos30d - a.minutos30d
  )
}

function computePql(
  data: AdminDataset,
  month: MonthKey,
  projectsByUser: Map<string, AdminProject[]>
): PqlBlock {
  const { ref } = windows(month, data.updatedAt)
  const rows = pqlRows(data, ref, projectsByUser)
  const previas = pqlRows(data, addDays(ref, -7), projectsByUser)
  return {
    n: rows.length,
    nPrevio: previas.length,
    items: rows.slice(0, 10),
    tono: rows.length === 0 && previas.length === 0 ? "aviso" : "neutral",
  }
}

function computeDormidos(
  data: AdminDataset,
  month: MonthKey,
  projectsByUser: Map<string, AdminProject[]>
): DormidosBlock {
  const { ref } = windows(month, data.updatedAt)
  const payingIds = new Set(
    data.subscriptions.filter((s) => isPayingAt(s, ref)).map((s) => s.userId)
  )
  const items = data.users
    .filter((u) => estadoDormido(u, ref, payingIds.has(u.id)) !== null)
    .map((u) => ({
      userId: u.id,
      userName: u.name,
      countryCode: u.countryCode,
      plan: u.plan,
      exPagante: u.totalPaid > 0,
      totalPaid: u.totalPaid,
      minutos: u.minutesProcessed,
      proyectos: u.projects,
      fuentePrincipal: mainSource(projectsByUser.get(u.id) ?? []),
      lastActiveAt: u.lastActiveAt,
    }))
    .sort((a, b) => Number(b.exPagante) - Number(a.exPagante) || b.minutos - a.minutos)
  return {
    n: items.length,
    exPagantes: items.filter((i) => i.exPagante).length,
    freeActivados: items.filter((i) => !i.exPagante).length,
    items: items.slice(0, DORMIDOS_LISTADOS),
    listados: Math.min(items.length, DORMIDOS_LISTADOS),
  }
}

// ---------------------------------------------------------------------------
// Afiliados y referidos
// ---------------------------------------------------------------------------

function computeAfiliados(
  data: AdminDataset,
  month: MonthKey,
  projectsByUser: Map<string, AdminProject[]>
): AffiliateStats[] {
  const { ref } = windows(month, data.updatedAt)
  return data.affiliates.map((affiliate) => {
    const traidos = data.users.filter(
      (u) => u.affiliateId === affiliate.id && ms(u.createdAt) <= ref.getTime()
    )
    const ids = new Set(traidos.map((u) => u.id))
    const pagos = data.payments.filter(
      (p) => ids.has(p.userId) && ms(p.createdAt) <= ref.getTime()
    )
    const aprobados = pagos.filter((p) => p.status === "aprobado")
    const reembolsos = sum(
      pagos.filter((p) => p.status === "reembolsado").map((p) => p.amount)
    )
    const ingreso = round(sum(aprobados.map((p) => p.amount)) - reembolsos)
    const devengada = round((ingreso * affiliate.commissionPct) / 100)
    const pagada = round(
      (sum(
        aprobados
          .filter((p) => p.createdAt < COMISIONES_LIQUIDADAS_HASTA)
          .map((p) => p.amount)
      ) *
        affiliate.commissionPct) /
        100
    )
    const pendiente = round(devengada - pagada)
    const noCubierto = aprobados
      .filter((p) => p.createdAt >= COMISIONES_LIQUIDADAS_HASTA)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0]
    const antiguedad =
      pendiente > 0 && noCubierto
        ? Math.round(daysBetween(noCubierto.createdAt, ref))
        : null
    const pagando = new Set(aprobados.map((p) => p.userId)).size
    const activados = traidos.filter(esActivadoD7).length
    const noPagantes = traidos.filter((u) => u.totalPaid === 0)
    const costeIaNoPagantes = sum(
      noPagantes.flatMap((u) => (projectsByUser.get(u.id) ?? []).map((p) => p.cost))
    )
    const ratio = ingreso > 0 ? round((devengada / ingreso) * 100, 1) : null
    let alerta: AffiliateStats["alerta"] = null
    if (pendiente > 0 && antiguedad !== null && antiguedad > 30) alerta = "liquidar"
    else if (
      traidos.length >= 10 &&
      pagando === 0 &&
      daysBetween(affiliate.joinedAt, ref) > 60
    )
      alerta = "fraude"
    else if (ratio !== null && ratio > 50) alerta = "calidad"
    return {
      affiliate,
      altas: traidos.length,
      altas30d: traidos.filter((u) => daysBetween(u.createdAt, ref) <= 30).length,
      activadosD7: activados,
      activacionPct: pct(activados, traidos.length),
      pagando,
      conversionPct: pct(pagando, traidos.length),
      ingresoAtribuido: ingreso,
      ingreso30d: sum(
        aprobados.filter((p) => daysBetween(p.createdAt, ref) <= 30).map((p) => p.amount)
      ),
      comisionDevengada: devengada,
      comisionPagada: pagada,
      comisionPendiente: pendiente,
      antiguedadPendienteDias: antiguedad,
      roi: devengada > 0 ? round(ingreso / devengada, 1) : null,
      ratioComisionPct: ratio,
      costeIaNoPagantes,
      alerta,
    }
  })
}

function computeReferidos(
  data: AdminDataset,
  month: MonthKey,
  actividad: ActividadBlock,
  usuarios: UsuariosBlock
): ReferralStats {
  const { ref } = windows(month, data.updatedAt)
  const hace90 = addDays(ref, -90)
  const hasta = data.referrals.filter((r) => ms(r.createdAt) <= ref.getTime())
  const userOf = (id: string) => data.users.find((u) => u.id === id)
  const by = (s: string) => hasta.filter((r) => r.status === s).length
  const convertidos = by("convertido")
  const pendientes: ReferralPendiente[] = hasta
    .filter((r) => r.status === "convertido" && !r.rewardGranted)
    .map((r) => {
      const invitado = userOf(r.referredId)
      return {
        referralId: r.id,
        referrerId: r.referrerId,
        referrerName: userOf(r.referrerId)?.name ?? r.referrerId,
        referredId: r.referredId,
        referredName: invitado?.name ?? r.referredId,
        antiguedadDias: invitado?.firstPaidAt
          ? Math.round(daysBetween(invitado.firstPaidAt, ref))
          : 0,
        rewardMinutes: r.rewardMinutes,
        valor: round(r.rewardMinutes * VALOR_MINUTO_RECOMPENSA),
      }
    })
    .sort((a, b) => b.antiguedadDias - a.antiguedadDias)
  const atascados = hasta.filter(
    (r) => r.status === "registrado" && daysBetween(r.createdAt, ref) > 14
  ).length

  const r90 = hasta.filter((r) => inRange(r.createdAt, hace90, ref))
  const invitados90 = r90
    .map((r) => userOf(r.referredId))
    .filter((u): u is AdminUser => Boolean(u))
  const activados90 = invitados90.filter(esActivadoD7).length
  const convertidos90 = invitados90.filter((u) => u.firstPaidAt).length
  const organicos90 = data.users.filter(
    (u) => u.channel === "organico" && inRange(u.createdAt, hace90, ref)
  )
  const activadosOrg = organicos90.filter(esActivadoD7).length
  const convertidosOrg = organicos90.filter(
    (u) => u.firstPaidAt && daysBetween(u.createdAt, u.firstPaidAt) <= 60
  ).length
  const ingresoInvitados90 = sum(
    data.payments
      .filter(
        (p) =>
          p.status === "aprobado" &&
          inRange(p.createdAt, hace90, ref) &&
          hasta.some((r) => r.referredId === p.userId)
      )
      .map((p) => p.amount)
  )
  const recompensas90 = recompensaValor(data, hace90, ref)
  const otorgados = hasta
    .filter((r) => r.rewardGranted)
    .reduce((n, r) => n + r.rewardMinutes, 0)
  const pendientesMin = pendientes.reduce((n, r) => n + r.rewardMinutes, 0)

  const porReferrer = new Map<
    string,
    { invitados: number; activados: number; convertidos: number; ingreso: number }
  >()
  for (const r of hasta) {
    const m = porReferrer.get(r.referrerId) ?? {
      invitados: 0,
      activados: 0,
      convertidos: 0,
      ingreso: 0,
    }
    m.invitados += 1
    if (r.status !== "registrado") m.activados += 1
    if (r.status === "convertido") m.convertidos += 1
    m.ingreso += userOf(r.referredId)?.totalPaid ?? 0
    porReferrer.set(r.referrerId, m)
  }
  const invitadores90 = new Set(r90.map((r) => r.referrerId)).size
  const altas90 = data.users.filter((u) => inRange(u.createdAt, hace90, ref)).length

  return {
    total: hasta.length,
    total90d: r90.length,
    registrados: by("registrado"),
    activados: by("activado"),
    convertidos,
    atascados,
    activacionPct: pct(activados90, invitados90.length),
    activacionOrganicaPct: pct(activadosOrg, organicos90.length),
    conversionPct: pct(convertidos90, invitados90.length),
    conversionOrganicaPct: pct(convertidosOrg, organicos90.length),
    recompensasPendientes: pendientes,
    minutosOtorgados: otorgados,
    minutosPendientes: pendientesMin,
    valorOtorgado: round(otorgados * VALOR_MINUTO_RECOMPENSA),
    valorPendiente: round(pendientesMin * VALOR_MINUTO_RECOMPENSA),
    ingresoInvitados90d: ingresoInvitados90,
    valor: recompensas90 > 0 ? round(ingresoInvitados90 / recompensas90, 1) : null,
    cacReferidos: convertidos90 > 0 ? round(recompensas90 / convertidos90) : null,
    invitadores90d: invitadores90,
    tasaInvitacionPct: pct(invitadores90, actividad.mau),
    aportePct: pct(r90.length, altas90),
    topReferrers: [...porReferrer.entries()]
      .map(([userId, m]) => {
        const u = userOf(userId)
        return {
          userId,
          name: u?.name ?? userId,
          plan: u?.plan ?? "free",
          ...m,
          ingreso: round(m.ingreso),
        }
      })
      .sort(
        (a, b) =>
          b.convertidos - a.convertidos ||
          b.activados - a.activados ||
          b.invitados - a.invitados
      )
      .slice(0, 5),
  }
  void usuarios
}

// ---------------------------------------------------------------------------
// Colas del día y alertas agregadas
// ---------------------------------------------------------------------------

function computeColas(
  data: AdminDataset,
  month: MonthKey,
  v: VencimientosBlock,
  costes: CostesBlock,
  afiliados: AffiliateStats[],
  referidos: ReferralStats
): ColaItem[] {
  const { ref, mtd } = windows(month, data.updatedAt)
  if (!mtd) return []
  const colas: ColaItem[] = []

  for (const i of v.items) {
    if (i.semaforo === "verde") continue
    const antiguedad =
      i.cola === "pendiente"
        ? Math.round(daysBetween(i.ultimoPago!.createdAt, ref))
        : i.cola === "proxima"
          ? 0
          : Math.max(0, -i.diasRestantes)
    colas.push({
      id: `v-${i.subscriptionId}`,
      tipo: i.cola === "inactivo" ? "retencion" : "cobro",
      semaforo: i.semaforo,
      titulo: i.cola,
      userId: i.userId,
      userName: i.userName,
      countryCode: i.countryCode,
      plan: i.plan,
      monto: i.cola === "inactivo" ? i.mrr : i.amount,
      antiguedadDias: antiguedad,
      motivo: i.motivo,
      accion: i.accion,
      href: `/admin/vencimientos?cola=${i.cola}`,
    })
  }

  const payingIds = new Set(
    data.subscriptions.filter((s) => isPayingAt(s, ref)).map((s) => s.userId)
  )
  for (const p of data.projects) {
    const horas = daysBetween(p.createdAt, ref) * 24
    const dePago = payingIds.has(p.userId)
    if (p.status === "error" && dePago && horas > 4) {
      const resuelto = data.projects.some(
        (q) => q.userId === p.userId && q.createdAt > p.createdAt && q.status === "listo"
      )
      if (resuelto) continue
      colas.push({
        id: `p-${p.id}`,
        tipo: "pipeline",
        semaforo: "rojo",
        titulo: "proyecto-error",
        userId: p.userId,
        userName: data.users.find((u) => u.id === p.userId)?.name ?? p.userId,
        countryCode: data.users.find((u) => u.id === p.userId)?.countryCode,
        plan: p.userPlan,
        monto: p.cost,
        antiguedadDias: Math.round(daysBetween(p.createdAt, ref)),
        motivo: { code: "proyectoError", values: { horas: Math.round(horas) } },
        accion: "reprocesar",
        href: "/admin/costes#pipeline",
      })
    }
    if (p.status === "procesando" && horas > 2) {
      colas.push({
        id: `p-${p.id}`,
        tipo: "pipeline",
        semaforo: "ambar",
        titulo: "proyecto-atascado",
        userId: p.userId,
        userName: data.users.find((u) => u.id === p.userId)?.name ?? p.userId,
        countryCode: data.users.find((u) => u.id === p.userId)?.countryCode,
        plan: p.userPlan,
        monto: 0,
        antiguedadDias: Math.round(daysBetween(p.createdAt, ref)),
        motivo: { code: "proyectoAtascado", values: { horas: Math.round(horas) } },
        accion: "revisar-cola",
        href: "/admin/costes#pipeline",
      })
    }
  }

  /*
   * Publicaciones que no salieron y cuentas que no van a poder publicar. Es la
   * promesa del producto rota en directo, así que sube a la cola del día con
   * el mismo criterio que un proyecto en error: primero quien paga.
   */
  const cuentaDe = new Map((data.accounts ?? []).map((c) => [c.id, c]))
  const usuarioDe = new Map(data.users.map((u) => [u.id, u]))
  const cuentasAvisadas = new Set<string>()
  for (const pub of data.publications ?? []) {
    const cuenta = cuentaDe.get(pub.cuentaId)
    const u = usuarioDe.get(pub.userId)
    // Un token caducado con algo programado por delante: nada de eso va a
    // salir y nadie se va a enterar hasta que pase la hora. Revocada no entra:
    // esa la quitó la persona a propósito y no hay nada que pedirle
    if (
      cuenta?.estado === "caducada" &&
      pub.estado === "programada" &&
      pub.programadaPara &&
      ms(pub.programadaPara) > ref.getTime() &&
      !cuentasAvisadas.has(cuenta.id)
    ) {
      cuentasAvisadas.add(cuenta.id)
      colas.push({
        id: `cta-${cuenta.id}`,
        tipo: "publicacion",
        semaforo: "rojo",
        titulo: "cuenta-caducada",
        userId: cuenta.userId,
        userName: u?.name ?? cuenta.userId,
        countryCode: u?.countryCode,
        plan: u?.plan,
        monto: 0,
        antiguedadDias: Math.round(
          daysBetween(cuenta.ultimoFalloAt ?? cuenta.connectedAt, ref)
        ),
        motivo: {
          code: "cuentaCaducada",
          values: {
            plataforma: cuenta.network,
            dias: Math.round(
              daysBetween(cuenta.ultimoFalloAt ?? cuenta.connectedAt, ref)
            ),
          },
        },
        accion: "pedir-reconexion",
        href: "/admin/publicaciones",
      })
    }
    if (pub.estado !== "fallida") continue
    const horas = daysBetween(instanteEnvio(pub), ref) * 24
    // Más de una semana caída ya no es trabajo de hoy: es historia, y vive en
    // el bloque de publicaciones. La cola del día tiene que caber en un día
    if (horas > 24 * 7) continue
    const dePago = payingIds.has(pub.userId)
    // Sin pago detrás no es urgente, pero un envío que lleva un día caído
    // sigue siendo un clip que no salió
    const semaforo: "rojo" | "ambar" | null =
      dePago && horas > HORAS_PUBLICACION_FALLIDA ? "rojo" : horas > 24 ? "ambar" : null
    if (!semaforo) continue
    colas.push({
      id: `pub-${pub.id}`,
      tipo: "publicacion",
      semaforo,
      titulo: "publicacion-fallida",
      userId: pub.userId,
      userName: u?.name ?? pub.userId,
      countryCode: u?.countryCode,
      plan: u?.plan,
      monto: 0,
      antiguedadDias: Math.round(daysBetween(instanteEnvio(pub), ref)),
      motivo: {
        code: "publicacionFallida",
        values: {
          motivo: pub.motivoFallo ?? "rechazoRed",
          intentos: pub.intentos,
          plataforma: pub.network,
        },
      },
      // Reconectar o reintentar no es lo mismo, y lo decide el motivo: la
      // misma regla que usa el calendario (`seArreglaReconectando`)
      accion: seArreglaReconectando(pub.motivoFallo)
        ? "pedir-reconexion"
        : "reintentar-publicacion",
      href: "/admin/publicaciones",
    })
  }

  for (const r of referidos.recompensasPendientes) {
    if (r.antiguedadDias * 24 <= 48) continue
    colas.push({
      id: `r-${r.referralId}`,
      tipo: "programa",
      semaforo: "rojo",
      titulo: "recompensa-referido",
      userId: r.referrerId,
      userName: r.referrerName,
      countryCode: data.users.find((u) => u.id === r.referrerId)?.countryCode,
      monto: r.valor,
      antiguedadDias: r.antiguedadDias,
      motivo: {
        code: "recompensaPendiente",
        values: {
          invitado: r.referredName,
          dias: r.antiguedadDias,
          minutos: r.rewardMinutes,
        },
      },
      accion: "otorgar-recompensa",
      href: "/admin/referidos",
    })
  }

  for (const a of afiliados) {
    if (a.comisionPendiente <= 0 || (a.antiguedadPendienteDias ?? 0) <= 30) continue
    colas.push({
      id: `a-${a.affiliate.id}`,
      tipo: "programa",
      semaforo: "ambar",
      titulo: "comision-afiliado",
      userName: a.affiliate.name,
      monto: a.comisionPendiente,
      antiguedadDias: a.antiguedadPendienteDias ?? 0,
      motivo: {
        code: "comisionPendiente",
        values: { codigo: a.affiliate.code, dias: a.antiguedadPendienteDias ?? 0 },
      },
      accion: "liquidar",
      href: "/admin/afiliados",
    })
  }

  for (const an of costes.anomalias.slice(0, 3)) {
    if (daysBetween(an.createdAt, ref) > 7) continue
    colas.push({
      id: `c-${an.projectId}`,
      tipo: "coste",
      semaforo: "ambar",
      titulo: "coste-anomalo",
      userId: an.userId,
      userName: an.userName,
      countryCode: data.users.find((u) => u.id === an.userId)?.countryCode,
      plan: an.userPlan,
      monto: an.cost,
      antiguedadDias: Math.round(daysBetween(an.createdAt, ref)),
      motivo: {
        code: "costeAnomalo",
        values: { anomalia: an.motivo, minutos: Math.round(an.minutes) },
      },
      accion: "revisar",
      href: "/admin/costes#anomalias",
    })
  }

  return colas.sort((a, b) =>
    a.semaforo === b.semaforo ? b.monto - a.monto : a.semaforo === "rojo" ? -1 : 1
  )
}

function computeAlertas(
  data: AdminDataset,
  month: MonthKey,
  colas: ColaItem[],
  costes: CostesBlock,
  referidos: ReferralStats,
  afiliados: AffiliateStats[]
): AlertItem[] {
  const { mtd } = windows(month, data.updatedAt)
  const alertas: AlertItem[] = []
  const de = (pred: (c: ColaItem) => boolean) => colas.filter(pred)
  const push = (
    id: AlertaId,
    severidad: AlertItem["severidad"],
    xs: ColaItem[],
    href: string
  ) => {
    if (xs.length)
      alertas.push({
        id,
        severidad,
        n: xs.length,
        monto: sum(xs.map((c) => c.monto)),
        href,
      })
  }
  if (mtd) {
    push(
      "cobros",
      "alta",
      de((c) => c.tipo === "cobro" && c.titulo !== "proxima"),
      "/admin/vencimientos"
    )
    push(
      "renovaciones",
      "alta",
      de((c) => c.titulo === "proxima"),
      "/admin/vencimientos?cola=proxima"
    )
    push(
      "retencion",
      "media",
      de((c) => c.tipo === "retencion"),
      "/admin/vencimientos?cola=inactivo"
    )
    push(
      "pipeline",
      "media",
      de((c) => c.tipo === "pipeline"),
      "/admin/costes#pipeline"
    )
    // Alta: un clip que no sale es la promesa del producto sin cumplir, y casi
    // siempre se arregla en un minuto pidiendo reconectar la cuenta
    push(
      "publicaciones",
      "alta",
      de((c) => c.tipo === "publicacion"),
      "/admin/publicaciones"
    )
    const revisar = data.users.filter((u) => u.flags.includes("revisar"))
    if (revisar.length)
      alertas.push({
        id: "revisar",
        severidad: "media",
        n: revisar.length,
        href: "/admin/usuarios?segmento=revisar",
      })
  }
  const pendComision = afiliados.filter((a) => a.comisionPendiente > 0)
  if (pendComision.length)
    alertas.push({
      id: "comisiones",
      severidad: "baja",
      n: pendComision.length,
      monto: sum(pendComision.map((a) => a.comisionPendiente)),
      href: "/admin/afiliados",
    })
  if (referidos.recompensasPendientes.length)
    alertas.push({
      id: "recompensas",
      severidad: "baja",
      n: referidos.recompensasPendientes.length,
      monto: referidos.valorPendiente,
      href: "/admin/referidos",
    })
  if (costes.anomalias.length)
    alertas.push({
      id: "coste",
      severidad: "baja",
      n: costes.anomalias.length,
      monto: sum(costes.anomalias.map((a) => a.cost)),
      href: "/admin/costes#anomalias",
    })
  const peso = { alta: 0, media: 1, baja: 2 }
  return alertas.sort((a, b) => peso[a.severidad] - peso[b.severidad])
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

export function computeMonthly(data: AdminDataset, month: MonthKey): MonthlySnapshot {
  const projectsByUser = userProjects(data)
  const { ref, inicio, mtd } = windows(month, data.updatedAt)

  const mrr = computeMrr(data, month, projectsByUser)
  const clientes = computeClientes(data, month)
  const cobros = computeCobros(data, month)
  const actividad = computeActividad(data, month, projectsByUser)
  const usuarios = computeUsuarios(data, month, clientes, projectsByUser)
  const conversion = computeConversion(data, month, clientes, usuarios.elegibles)
  const { funnel, funnelSemanal, funnelMensual } = computeFunnels(data, month)
  const activacionD7 = computeActivacionD7(funnelMensual, ref)
  const ttv = computeTtv(data, month, projectsByUser)
  const vencimientos = computeVencimientos(data, month, projectsByUser)
  const uso = computeUso(data, month)
  const publicaciones = computePublicaciones(data, month)
  const costes = computeCostes(data, month, uso, actividad, mrr.total, projectsByUser)
  const afiliados = computeAfiliados(data, month, projectsByUser)
  const referidos = computeReferidos(data, month, actividad, usuarios)
  const caja = computeCaja(data, month, vencimientos, afiliados, referidos)

  const prevCobros = computeCobros(data, addMonths(month, -1))
  const historico = data.payments.filter((p) => ms(p.createdAt) <= ref.getTime())
  const histAprobado = sum(
    historico.filter((p) => p.status === "aprobado").map((p) => p.amount)
  )
  const margen: MargenBlock = {
    ingresos: cobros.neto,
    costes: costes.total,
    bruto: round(cobros.neto - costes.total),
    pct:
      cobros.neto > 0
        ? round(((cobros.neto - costes.total) / cobros.neto) * 100, 1)
        : null,
    brutoPrevio: round(prevCobros.neto - costes.previo),
    recurrentePct:
      mrr.total > 0
        ? round(((mrr.total - costes.dePago.amount) / mrr.total) * 100, 1)
        : null,
    cajaPct: caja.aprobado > 0 ? round((caja.neta / caja.aprobado) * 100, 1) : null,
    historicoPct:
      histAprobado > 0
        ? round(((histAprobado - costes.acumulado) / histAprobado) * 100, 1)
        : null,
  }
  const planes = computePlanes(data, month, mrr, projectsByUser)
  const ltv = computeLtv(data, month, mrr, clientes, margen, actividad, referidos)
  const pql = computePql(data, month, projectsByUser)
  const dormidos = computeDormidos(data, month, projectsByUser)
  const colas = computeColas(data, month, vencimientos, costes, afiliados, referidos)
  const alertas = computeAlertas(data, month, colas, costes, referidos, afiliados)

  return {
    month,
    previousMonth: addMonths(month, -1),
    updatedAt: data.updatedAt,
    timeZone: data.timeZone,
    mtd: mtd
      ? {
          dia: Math.ceil(daysBetween(inicio, ref)),
          diasMes: Math.round(daysBetween(inicio, monthEnd(month))),
        }
      : null,
    mrr,
    clientes,
    caja,
    cobros,
    actividad,
    usuarios,
    conversion,
    funnel,
    funnelSemanal,
    funnelMensual,
    activacionD7,
    ttv,
    vencimientos,
    costes,
    margen,
    uso,
    publicaciones,
    planes,
    ltv,
    pql,
    dormidos,
    colas,
    alertas,
    afiliados,
    referidos,
  }
}

export function computeSeries(
  data: AdminDataset,
  months: MonthKey[]
): { series: SeriesPoint[]; cohortes: CohortRow[]; retencionM1: RetencionM1Block } {
  const projectsByUser = userProjects(data)
  const series = months.map((month) => {
    const { ref, inicio, mtd } = windows(month, data.updatedAt)
    const b = bridgeOfMonth(data, month)
    const caja = cajaNetaEn(data, inicio, ref)
    const pagos = data.payments.filter((p) => inRange(p.createdAt, inicio, ref))
    const proyectos = data.projects.filter((p) => inRange(p.createdAt, inicio, ref))
    const listos = proyectos.filter((p) => p.status === "listo")
    const minutos = listos.reduce((n, p) => n + p.minutes, 0)
    const costes = data.costs.filter((c) => inRange(c.createdAt, inicio, ref))
    const hasta = data.users.filter((u) => ms(u.createdAt) < ref.getTime())
    const elegibles = hasta.filter((u) => u.plan !== "interno").length
    const pagando = new Set(
      data.subscriptions.filter((s) => isPayingAt(s, ref)).map((s) => s.userId)
    ).size
    return {
      month,
      mrr: b.mrrFin,
      nuevo: b.nuevo,
      expansion: b.expansion,
      reactivacion: b.reactivacion,
      contraccion: b.contraccion,
      baja: b.baja,
      neto: round(b.nuevo + b.expansion + b.reactivacion - b.contraccion - b.baja),
      cobros: round(caja.aprobado - caja.reembolsado),
      rechazados: sum(pagos.filter((p) => p.status === "rechazado").map((p) => p.amount)),
      costes: caja.ia,
      comisiones: caja.comisionesPagadas,
      cajaNeta: caja.neta,
      altas: data.users.filter((u) => inRange(u.createdAt, inicio, ref)).length,
      activos: activeUsersIn(data, inicio, ref, projectsByUser).length,
      pagando,
      conversionPct: pct(pagando, elegibles) ?? 0,
      proyectos: proyectos.length,
      clips: proyectos.reduce((n, p) => n + p.clips, 0),
      costeFree: sum(costes.filter((c) => c.userPlan === "free").map((c) => c.amount)),
      costePorMinuto: minutos > 0 ? round(caja.ia / minutos, 4) : null,
      enCurso: mtd,
    }
  })

  const last = months[months.length - 1]
  const cohortes: CohortRow[] = months.slice(-8).map((cohorte) => {
    const miembros = data.users.filter(
      (u) => isInMonth(u.createdAt, cohorte) && u.plan !== "interno"
    )
    const activados = miembros.filter(esActivadoD7)
    const activosEn = (k: number, base: AdminUser[]) => {
      const m = addMonths(cohorte, k)
      if (m > last) return null
      const n = base.filter((u) =>
        (projectsByUser.get(u.id) ?? []).some((p) => isInMonth(p.createdAt, m))
      ).length
      return pct(n, base.length) ?? 0
    }
    return {
      cohorte,
      registrados: miembros.length,
      activadosD7: activados.length,
      retencion: Array.from({ length: 6 }, (_, k) => activosEn(k, miembros)),
      retencionActivados: Array.from({ length: 6 }, (_, k) => activosEn(k, activados)),
    }
  })

  return { series, cohortes, retencionM1: computeRetencionM1(cohortes, last) }
}

/**
 * Retención M1 sobre activados: la última cohorte con el mes +1 cerrado frente
 * a la media de las tres anteriores, y el nivel que le corresponde por
 * `RETENCION_M1`. Cerrada: su mes +1 es anterior al último mes de la serie.
 */
function computeRetencionM1(cohortes: CohortRow[], last: MonthKey): RetencionM1Block {
  const cerradas = cohortes.filter(
    (c) => addMonths(c.cohorte, 1) < last && c.retencionActivados[1] !== null
  )
  const ultima = cerradas.at(-1) ?? null
  const pct = ultima ? ultima.retencionActivados[1] : null
  const anteriores = cerradas
    .slice(-4, -1)
    .map((c) => c.retencionActivados[1])
    .filter((x): x is number => x !== null)
  return {
    cohorte: ultima?.cohorte ?? null,
    pct,
    media3Anteriores: anteriores.length ? avg(anteriores) : null,
    cerradas: cerradas.length,
    nivel:
      pct === null
        ? null
        : pct < RETENCION_M1.episodicoPct
          ? "episodico"
          : pct >= RETENCION_M1.nucleoPct
            ? "nucleo"
            : "medio",
  }
}

export { resolveChannel, mainSource, userProjects, cycleStart, comisionDe }

/* ---------------------------------------------------------------------------
   Onboarding y mercado (§7 de docs/onboarding-2026-09.md)

   El onboarding vive en el navegador de cada persona; en el backoffice se lee
   una instantánea simulada con semilla propia (lib/admin/mock-onboarding.ts),
   así que estas cifras dicen «datos simulados» en pantalla. Las definiciones
   de mercado (oferta, demanda, cobertura, CPM que llena) están en lib/mercado.ts
   y aquí solo se cruzan con los usuarios del dataset.
   --------------------------------------------------------------------------- */

/**
 * Un usuario del backoffice visto como oferta de mercado.
 *
 * `accounts` es opcional a propósito: sin ellas, «conectado» sigue siendo el
 * proxy del onboarding (haber medido seguidores implicaba haber conectado
 * algo). Con ellas se sabe de verdad, que es lo que decide si una celda del
 * mercado se puede servir hoy.
 */
export function cliperosDeUsuarios(
  users: readonly AdminUser[],
  accounts?: readonly SocialAccountAdmin[]
): CliperoMercado[] {
  const salida: CliperoMercado[] = []
  for (const u of users) {
    const ob = u.onboarding
    if (!ob || ob.tipo !== "clipero") continue
    salida.push({
      id: u.id,
      pais: u.countryCode ?? null,
      idiomas: ob.idiomas,
      redes: ob.redes.filter((r): r is SocialId => esId(SOCIAL_IDS, r)),
      verticales: ob.verticales,
      verticalesInferidas: ob.verticalesInferidas,
      conectado:
        accounts?.some((a) => a.userId === u.id && a.estado === "conectada") ??
        ob.seguidoresMedidos != null,
      confianzaBaja: ob.confianzaBaja,
      ultimoEnvioEn: u.lastSubmissionAt ?? null,
      completadoEn: ob.completadoEn ?? null,
      opuestoEstadisticas: !ob.consiente.estadisticas,
      creadoresFan: ob.creadoresFan,
    })
  }
  return salida
}

export interface TomaFunnel {
  paso: PasoId
  vistos: number
  respondidos: number
  saltados: number
  /** Se quedaron en esta toma sin completar ni posponer. */
  abandono: number
  p50Ms: number | null
}

export interface OnboardingResumen {
  /** Cuentas con onboarding simulado (la cohorte de la instantánea). */
  cuentas: number
  estados: Record<EstadoOnboarding, number>
  iniciados: number
  completados: number
  tasaInicio: number
  tasaFinalizacion: number
  p50Ms: number | null
  p90Ms: number | null
  porFlujo: {
    flujo: "clipero" | "creador" | "agencia"
    cuentas: number
    completados: number
  }[]
  tomas: TomaFunnel[]
  /** Tomas completadas a mano ÷ tomas vistas con animación. */
  aceleracion: number
  saltoIntro: number
  consentimientos: { estadisticas: number; informesSector: number; novedades: number }
  revocaron30d: number
  completitudMedia: number
}

const percentil = (valores: readonly number[], p: number): number | null => {
  if (!valores.length) return null
  const xs = [...valores].sort((a, b) => a - b)
  const i = Math.min(xs.length - 1, Math.max(0, Math.round((xs.length - 1) * p)))
  return Math.round(xs[i])
}

/** Funnel del onboarding (§7.2) sobre los usuarios de la instantánea. */
export function computeOnboarding(users: readonly AdminUser[]): OnboardingResumen {
  const obs = users.map((u) => u.onboarding).filter((x): x is OnboardingAdmin => !!x)
  const estados = {
    "sin-empezar": 0,
    "en-curso": 0,
    pospuesto: 0,
    completado: 0,
  } as Record<EstadoOnboarding, number>
  for (const ob of obs) estados[ob.estado] += 1

  const iniciados = obs.filter((ob) => !!ob.iniciadoEn).length
  const completados = estados.completado
  const tiempos = obs
    .filter((ob) => ob.estado === "completado" && typeof ob.msTotal === "number")
    .map((ob) => ob.msTotal!)

  const flujoDe = (ob: OnboardingAdmin) =>
    ob.tipo === "agencia"
      ? "agencia"
      : ob.objetivo === "mis-videos"
        ? "creador"
        : "clipero"
  const porFlujo = (["clipero", "creador", "agencia"] as const).map((flujo) => {
    const suyos = obs.filter((ob) => flujoDe(ob) === flujo)
    return {
      flujo,
      cuentas: suyos.length,
      completados: suyos.filter((ob) => ob.estado === "completado").length,
    }
  })

  // En el orden del flujo (`PASOS`), no en el de primera aparición: la tabla es
  // un embudo y solo se lee si las tomas van en el orden en que se ven.
  const orden = (paso: PasoId) => (PASOS as readonly PasoId[]).indexOf(paso)
  const pasos = [...new Set(obs.flatMap((ob) => ob.pasosVistos))].sort(
    (a, b) => orden(a) - orden(b)
  )
  const tomas: TomaFunnel[] = pasos.map((paso) => {
    const vistos = obs.filter((ob) => ob.pasosVistos.includes(paso))
    const ms = vistos
      .map((ob) => ob.msPorPaso[paso])
      .filter((x): x is number => typeof x === "number" && x > 0)
    return {
      paso,
      vistos: vistos.length,
      respondidos: vistos.filter((ob) => ob.pasosRespondidos.includes(paso)).length,
      saltados: vistos.filter((ob) => ob.pasosSaltados.includes(paso)).length,
      abandono: vistos.filter(
        (ob) => ob.estado !== "completado" && ob.ultimoPaso === paso
      ).length,
      p50Ms: percentil(ms, 0.5),
    }
  })

  const conAnimacion = obs.filter((ob) => ob.pasosVistos.length > 0)
  const acelerados = conAnimacion.reduce((n, ob) => n + ob.textoAcelerado, 0)
  const vistas = conAnimacion.reduce((n, ob) => n + ob.pasosVistos.length, 0)

  return {
    cuentas: obs.length,
    estados,
    iniciados,
    completados,
    tasaInicio: obs.length ? iniciados / obs.length : 0,
    tasaFinalizacion: iniciados ? completados / iniciados : 0,
    p50Ms: percentil(tiempos, 0.5),
    p90Ms: percentil(tiempos, 0.9),
    porFlujo,
    tomas,
    aceleracion: vistas ? acelerados / vistas : 0,
    saltoIntro: obs.length ? obs.filter((ob) => ob.saltoIntro).length / obs.length : 0,
    consentimientos: {
      estadisticas: obs.filter((ob) => ob.consiente.estadisticas).length,
      informesSector: obs.filter((ob) => ob.consiente.informesSector).length,
      novedades: obs.filter((ob) => ob.consiente.novedades).length,
    },
    revocaron30d: obs.filter((ob) => ob.revocoEn30d).length,
    completitudMedia: obs.length
      ? Math.round(obs.reduce((n, ob) => n + ob.completitud, 0) / obs.length)
      : 0,
  }
}

export interface CalidadDato {
  cliperos: number
  conectados: number
  /** Cliperos con alguna vertical inferida por sus envíos aprobados. */
  inferidos: number
  confianzaBaja: number
  opuestos: number
  creadoresPendientes: number
  comoLlegasteSinNormalizar: number
  /** Cliperos con vertical inferida contenida en la declarada. */
  concordanciaVertical: number
}

export interface MercadoResumen {
  cliperos: number
  celdas: CeldaMercado[]
  huecos: CeldaMercado[]
  excedentes: CeldaMercado[]
  cpm: { sector: Sector; cpm: CpmQueLlena }[]
  oportunidades: Oportunidad[]
  calidad: CalidadDato
  /** Dinero activo que ninguna celda puede servir hoy. */
  enRiesgo: number
}

/** Mercado por sector (§7.3): oferta, demanda, huecos, CPM y oportunidades. */
export function computeMercado(
  data: Pick<AdminDataset, "users" | "campaigns" | "submissions" | "accounts">,
  ref: string,
  filtro: { idioma?: IdiomaAudiencia | null; red?: SocialId | null } = {}
): MercadoResumen {
  const cliperos = cliperosDeUsuarios(data.users, data.accounts)
  const envios = data.submissions ?? []
  const campanas = campanasMercado(data.campaigns ?? [], envios, ref)
  const rejilla = celdas(cliperos, campanas, envios, filtro, ref)

  const huecos = rejilla
    .filter((c) => c.estado === "sin-oferta" || c.estado === "escasez")
    .sort((a, b) => b.D - a.D)
  const excedentes = rejilla
    .filter((c) => c.estado === "excedente")
    .sort((a, b) => b.O - a.O)

  const cpm = SECTORES.map((sector) => ({
    sector,
    cpm: cpmQueLlena(data.campaigns ?? [], envios, { sector, pais: "global", ref }),
  }))

  const vistasMedianas = vistasMedianasPorVertical(data.campaigns ?? [], envios)
  const handles = new Set(
    data.users
      .map((u) => u.onboarding?.enlaceCanal)
      .filter((x): x is NonNullable<typeof x> => !!x)
      .map((x) => `${x.plataforma}:${x.handle.toLowerCase()}`)
  )

  const conInferidas = cliperos.filter((c) => c.verticalesInferidas.length > 0)
  const calidad: CalidadDato = {
    cliperos: cliperos.length,
    conectados: cliperos.filter((c) => c.conectado).length,
    inferidos: conInferidas.length,
    confianzaBaja: cliperos.filter((c) => c.confianzaBaja).length,
    opuestos: cliperos.filter((c) => c.opuestoEstadisticas).length,
    creadoresPendientes: data.users.reduce(
      (n, u) => n + (u.onboarding?.creadoresPendientes ?? 0),
      0
    ),
    comoLlegasteSinNormalizar: data.users.filter(
      (u) => u.onboarding?.comoLlegasteSinNormalizar
    ).length,
    concordanciaVertical: conInferidas.length
      ? Math.round(
          (conInferidas.filter((c) =>
            c.verticalesInferidas.every((v: Vertical) => c.verticales.includes(v))
          ).length /
            conInferidas.length) *
            100
        )
      : 0,
  }

  return {
    cliperos: cliperos.length,
    celdas: rejilla,
    huecos,
    excedentes,
    cpm,
    oportunidades: oportunidades(CREADORES, cliperos, campanas, ref, {
      vistasMedianas,
      handlesUsuarios: handles,
    }),
    calidad,
    enRiesgo: Math.round(
      rejilla.filter((c) => !esServible(c.estado) && c.D > 0).reduce((n, c) => n + c.D, 0)
    ),
  }
}

/** Fans activos por creador, para el bloque «Encaje» de cada campaña. */
export function fansPorCreador(users: readonly AdminUser[], ref: string) {
  return fansActivos(cliperosDeUsuarios(users), ref)
}
