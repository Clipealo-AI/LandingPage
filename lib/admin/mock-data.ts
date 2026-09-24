import { seededNoise } from "@/lib/mock-data"
import {
  addDays,
  addMonths,
  daysBetween,
  iso,
  monthEnd,
  monthOf,
  monthRange,
  monthStart,
  round,
} from "@/lib/admin/dates"
import {
  CUENTAS_POR_PLAN,
  MINUTOS_INCLUIDOS,
  NETWORKS_BY_PLAN,
  PLANS,
  type PricingPlanId,
} from "@/lib/pricing"
import { simularOnboarding } from "@/lib/admin/mock-onboarding"
import type { SocialId } from "@/lib/social"
import {
  type AcquisitionChannel,
  type AdminDataset,
  type CountryCode,
  type AdminProject,
  type AdminUser,
  type Affiliate,
  type AiCostEntry,
  type FailureReason,
  type MonthKey,
  type ModoPublicacion,
  type MotivoFalloPublicacion,
  type Payment,
  type PaymentMethod,
  type Plan,
  type PlanId,
  type ProjectSource,
  type PublicacionAdmin,
  type PublicacionEstado,
  type Referral,
  type SocialAccountAdmin,
  type Subscription,
  type UserFlag,
} from "@/lib/admin/types"
import { AHORA_DEMO } from "@/lib/fechas"

/**
 * Datos simulados del backoffice. Deterministas: misma semilla, mismo
 * resultado en servidor y cliente, y las cifras se parecen a las del negocio
 * real (≈650 registrados, una docena de pago, ≈1.300 proyectos, costes de IA
 * de centavos por proyecto) para que las métricas se lean como verdaderas.
 *
 * Sustituye `getAdminDataset()` en `lib/api/admin.ts` por tus consultas
 * reales: todo lo demás depende solo de `lib/admin/types.ts`.
 */

/** «Hoy» del arquetipo: 13 de septiembre de 2026, 07:20 en Lima. */
export const HOY = AHORA_DEMO
export const MES_ACTUAL: MonthKey = "2026-09"
export const MESES: MonthKey[] = monthRange(MES_ACTUAL, 12)

/**
 * Los planes salen del catálogo de la web: precio y minutos son los de
 * `lib/pricing.ts`, así que cambiar un precio allí lo cambia también aquí. El
 * anual se cobra de una vez: doce meses al precio mensual con descuento. El
 * nombre no viaja con el dato: la interfaz lo traduce.
 */
export const plans: Plan[] = [
  ...PLANS.map((p): Plan => ({
    id: p.id,
    priceMonthly: p.monthly,
    priceYearly: p.yearly > 0 ? round(p.yearly * 12) : undefined,
    seatPriceMonthly: p.asiento,
    minutesIncluded: MINUTOS_INCLUIDOS[p.id],
    internal: false,
    active: true,
  })),
  {
    id: "interno",
    priceMonthly: 0,
    minutesIncluded: 100_000,
    internal: true,
    active: true,
  },
]

const PLAN_PRICE: Record<PlanId, number> = Object.fromEntries(
  plans.map((p) => [p.id, p.priceMonthly])
) as Record<PlanId, number>

// ---------------------------------------------------------------------------
// Usuarios
// ---------------------------------------------------------------------------

/** Altas por mes, de octubre de 2025 a septiembre de 2026. Suman 652. */
const ALTAS_POR_MES = [20, 26, 33, 42, 50, 61, 68, 76, 92, 99, 48, 37]

const NOMBRES = [
  "Valeria",
  "Diego",
  "Camila",
  "Sebastián",
  "Lucía",
  "Mateo",
  "Fernanda",
  "Joaquín",
  "Ariana",
  "Nicolás",
  "Daniela",
  "Gabriel",
  "Renata",
  "Adrián",
  "Antonella",
  "Rodrigo",
  "Micaela",
  "Santiago",
  "Alessandra",
  "Fabián",
  "Xiomara",
  "Piero",
  "Brenda",
  "Álvaro",
  "Milagros",
  "Gonzalo",
  "Andrea",
  "Franco",
  "Ximena",
  "Bruno",
  "Paola",
  "Luis",
  "Rocío",
  "Jorge",
  "Claudia",
  "Ricardo",
  "Karla",
  "Óscar",
  "Estefanía",
  "Hugo",
]
const APELLIDOS = [
  "Quispe",
  "Flores",
  "Huamán",
  "García",
  "Rodríguez",
  "Chávez",
  "Mamani",
  "Torres",
  "Vargas",
  "Castillo",
  "Rojas",
  "Sánchez",
  "Ramos",
  "Espinoza",
  "Cruz",
  "Gutiérrez",
  "Mendoza",
  "Díaz",
  "Paredes",
  "Salazar",
  "Cárdenas",
  "Vásquez",
  "Ríos",
  "Ortiz",
  "Delgado",
  "Herrera",
  "Medina",
  "Aguilar",
  "Cabrera",
  "Reyes",
  "Silva",
  "Núñez",
  "Campos",
  "Ponce",
  "Zapata",
  "Arias",
  "León",
  "Peña",
  "Guerrero",
  "Carrasco",
]
const DOMINIOS = [
  "gmail.com",
  "gmail.com",
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
]
/** Reparto por país: el negocio nace en Perú y crece por el resto de LATAM y España. */
const PAISES: [CountryCode, number][] = [
  ["PE", 0.72],
  ["MX", 0.07],
  ["CO", 0.06],
  ["CL", 0.04],
  ["AR", 0.04],
  ["ES", 0.03],
  ["EC", 0.02],
  ["US", 0.02],
]
const CANALES: [AcquisitionChannel, number][] = [
  ["organico", 0.55],
  ["directo", 0.2],
  ["afiliado", 0.12],
  ["referido", 0.1],
  ["ads", 0.03],
]
const FUENTES: [ProjectSource, number][] = [
  ["youtube", 0.72],
  ["directo", 0.156],
  ["kick", 0.089],
  ["twitch", 0.019],
  ["drive", 0.009],
  ["facebook", 0.005],
  ["zoom", 0.002],
]

function pickWeighted<T>(table: [T, number][], r: number): T {
  let acc = 0
  for (const [value, weight] of table) {
    acc += weight
    if (r < acc) return value
  }
  return table[table.length - 1][0]
}

function quitarTildes(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

const rndUsers = seededNoise(2026)

interface UserSeed {
  id: string
  name: string
  email: string
  countryCode: CountryCode
  createdAt: string
  channel: AcquisitionChannel
  affiliateId?: string
  referredBy?: string
}

const userSeeds: UserSeed[] = []
MESES.forEach((mes, mi) => {
  const inicio = monthStart(mes)
  const dias = daysBetween(inicio, monthEnd(mes))
  for (let i = 0; i < ALTAS_POR_MES[mi]; i++) {
    const n = userSeeds.length
    const nombre = NOMBRES[Math.floor(rndUsers() * NOMBRES.length)]
    const apellido = APELLIDOS[Math.floor(rndUsers() * APELLIDOS.length)]
    // En septiembre nadie se registra después de hoy
    const tope = mes === MES_ACTUAL ? 12.5 : dias
    const dia = rndUsers() * tope
    const createdAt = iso(addDays(inicio, dia))
    const channel = pickWeighted(CANALES, rndUsers())
    const countryCode = pickWeighted(PAISES, rndUsers())
    userSeeds.push({
      id: `u_${String(n + 1).padStart(4, "0")}`,
      name: `${nombre} ${apellido}`,
      email: `${quitarTildes(nombre)}.${quitarTildes(apellido)}${n % 7 === 0 ? "" : n % 100}@${DOMINIOS[n % DOMINIOS.length]}`,
      countryCode,
      createdAt,
      channel,
    })
  }
})

// ---------------------------------------------------------------------------
// Afiliados y suscripciones (definidos a mano: son pocos y cuentan una historia)
// ---------------------------------------------------------------------------

export const affiliates: Affiliate[] = [
  {
    id: "af_01",
    name: "Creadores Perú",
    code: "CREADORESPE",
    commissionPct: 25,
    status: "activo",
    joinedAt: "2025-11-04T00:00:00.000Z",
    channel: "Comunidad de Discord",
  },
  {
    id: "af_02",
    name: "Podcast Lima",
    code: "PODLIMA",
    commissionPct: 20,
    status: "activo",
    joinedAt: "2026-01-20T00:00:00.000Z",
    channel: "Newsletter semanal",
  },
  {
    id: "af_03",
    name: "Streamers LATAM",
    code: "STREAMLATAM",
    commissionPct: 30,
    status: "pausado",
    joinedAt: "2026-03-08T00:00:00.000Z",
    channel: "Canal de YouTube",
  },
  {
    id: "af_04",
    name: "Agencia Nébula",
    code: "NEBULA",
    commissionPct: 20,
    status: "activo",
    joinedAt: "2026-05-15T00:00:00.000Z",
    channel: "Clientes de agencia",
  },
]

// Los afiliados solo traen usuarios desde que se unieron
const rndAf = seededNoise(77)
for (const u of userSeeds) {
  if (u.channel !== "afiliado") continue
  const elegibles = affiliates.filter((a) => a.joinedAt < u.createdAt)
  if (elegibles.length === 0) {
    u.channel = "organico"
    continue
  }
  u.affiliateId = elegibles[Math.floor(rndAf() * elegibles.length)].id
}

interface SubSeed {
  id: string
  userIndex: number
  plan: PlanId
  billing: "mensual" | "anual"
  status: Subscription["status"]
  startedAt: string
  /** Número de cobros aprobados (mensual: uno por mes desde el inicio). */
  approved: number
  /** Intentos rechazados: fecha y motivo. */
  rejected?: { at: string; reason: FailureReason }[]
  pending?: { at: string }
  refunded?: { at: string }
  canceledAt?: string
  method: PaymentMethod
  channelOverride?: {
    channel: AcquisitionChannel
    affiliateId?: string
    referredBy?: number
  }
}

const SUB_SEEDS: SubSeed[] = [
  {
    id: "sub_01",
    userIndex: 240,
    plan: "business",
    billing: "mensual",
    status: "activa",
    startedAt: "2026-05-03",
    approved: 5,
    method: "tarjeta",
  },
  {
    id: "sub_02",
    userIndex: 480,
    plan: "business",
    billing: "mensual",
    status: "activa",
    startedAt: "2026-08-20",
    approved: 1,
    method: "yape",
    channelOverride: { channel: "afiliado", affiliateId: "af_01" },
  },
  {
    id: "sub_03",
    userIndex: 310,
    plan: "creator",
    billing: "mensual",
    status: "activa",
    startedAt: "2026-06-08",
    approved: 4,
    method: "tarjeta",
  },
  {
    id: "sub_04",
    userIndex: 390,
    plan: "creator",
    billing: "mensual",
    status: "activa",
    startedAt: "2026-07-22",
    approved: 3,
    method: "plin",
    channelOverride: { channel: "afiliado", affiliateId: "af_02" },
  },
  {
    id: "sub_05",
    userIndex: 570,
    plan: "creator",
    billing: "mensual",
    status: "activa",
    startedAt: "2026-08-30",
    approved: 1,
    method: "yape",
  },
  {
    id: "sub_06",
    userIndex: 130,
    plan: "business",
    billing: "mensual",
    status: "activa",
    startedAt: "2026-03-12",
    approved: 7,
    method: "tarjeta",
  },
  {
    id: "sub_07",
    userIndex: 590,
    plan: "creator",
    billing: "mensual",
    status: "activa",
    startedAt: "2026-09-05",
    approved: 1,
    method: "yape",
    channelOverride: { channel: "referido", referredBy: 240 },
  },
  {
    id: "sub_08",
    userIndex: 50,
    plan: "creator",
    billing: "mensual",
    status: "vencida",
    startedAt: "2026-01-14",
    approved: 3,
    rejected: [{ at: "2026-04-14", reason: "fondos-insuficientes" }],
    method: "tarjeta",
  },
  {
    id: "sub_09",
    userIndex: 5,
    plan: "creator",
    billing: "mensual",
    status: "cancelada",
    startedAt: "2025-12-03",
    approved: 3,
    canceledAt: "2026-03-01",
    method: "tarjeta",
  },
  {
    id: "sub_10",
    userIndex: 180,
    plan: "business",
    billing: "mensual",
    status: "vencida",
    startedAt: "2026-04-18",
    approved: 3,
    rejected: [
      { at: "2026-07-18", reason: "tarjeta-vencida" },
      { at: "2026-07-21", reason: "tarjeta-vencida" },
    ],
    method: "tarjeta",
    channelOverride: { channel: "afiliado", affiliateId: "af_03" },
  },
  {
    id: "sub_11",
    userIndex: 400,
    plan: "creator",
    billing: "mensual",
    status: "vencida",
    startedAt: "2026-06-25",
    approved: 2,
    rejected: [{ at: "2026-08-25", reason: "rechazada-emisor" }],
    method: "tarjeta",
  },
  {
    id: "sub_12",
    userIndex: 25,
    plan: "business",
    billing: "mensual",
    status: "cancelada",
    startedAt: "2026-01-05",
    approved: 5,
    canceledAt: "2026-06-05",
    refunded: { at: "2026-06-06" },
    method: "tarjeta",
  },
  {
    id: "sub_13",
    userIndex: 500,
    plan: "business",
    billing: "mensual",
    status: "pendiente-pago",
    startedAt: "2026-08-02",
    approved: 1,
    rejected: [{ at: "2026-09-02", reason: "yape-tiempo-agotado" }],
    pending: { at: "2026-09-09" },
    method: "yape",
  },
  {
    id: "sub_14",
    userIndex: 620,
    plan: "business",
    billing: "mensual",
    status: "activa",
    startedAt: "2026-09-10",
    approved: 1,
    method: "tarjeta",
    channelOverride: { channel: "referido", referredBy: 310 },
  },
  {
    id: "sub_15",
    userIndex: 90,
    plan: "creator",
    billing: "anual",
    status: "activa",
    startedAt: "2026-02-01",
    approved: 1,
    method: "transferencia",
  },
]

/** Usuarios con el plan Interno: equipo y creadores invitados. */
const INTERNOS_INDEX = [0, 1, 2, 300, 470]

for (const s of SUB_SEEDS) {
  const u = userSeeds[s.userIndex]
  if (s.channelOverride) {
    u.channel = s.channelOverride.channel
    u.affiliateId = s.channelOverride.affiliateId
    if (s.channelOverride.referredBy !== undefined)
      u.referredBy = userSeeds[s.channelOverride.referredBy].id
  }
}

function subAmount(plan: PlanId, billing: "mensual" | "anual") {
  const p = plans.find((x) => x.id === plan)!
  return billing === "anual" ? (p.priceYearly ?? p.priceMonthly * 12) : p.priceMonthly
}

export const subscriptions: Subscription[] = SUB_SEEDS.map((s) => {
  const startedAt = `${s.startedAt}T14:00:00.000Z`
  const cycles = s.billing === "anual" ? 12 : 1
  const start = monthOf(startedAt)
  const day = s.startedAt.slice(8)
  // Próxima renovación: un ciclo después del último cobro aprobado
  const renewMonth = addMonths(start, s.approved * cycles)
  const renewsAt = `${renewMonth}-${day}T14:00:00.000Z`
  return {
    id: s.id,
    userId: userSeeds[s.userIndex].id,
    plan: s.plan,
    status: s.status,
    billing: s.billing,
    amount: subAmount(s.plan, s.billing),
    startedAt,
    renewsAt,
    canceledAt: s.canceledAt ? `${s.canceledAt}T10:00:00.000Z` : undefined,
    paymentMethod: s.method,
  }
})

export const payments: Payment[] = []
for (const s of SUB_SEEDS) {
  const sub = subscriptions.find((x) => x.id === s.id)!
  const day = s.startedAt.slice(8)
  const cycles = s.billing === "anual" ? 12 : 1
  for (let i = 0; i < s.approved; i++) {
    const mes = addMonths(monthOf(sub.startedAt), i * cycles)
    payments.push({
      id: `pay_${s.id.slice(4)}_${i + 1}`,
      userId: sub.userId,
      subscriptionId: sub.id,
      plan: sub.plan,
      amount: sub.amount,
      status: "aprobado",
      method: sub.paymentMethod,
      kind: i === 0 ? "nueva" : "renovacion",
      createdAt: `${mes}-${day}T14:05:00.000Z`,
    })
  }
  s.rejected?.forEach((r, i) => {
    payments.push({
      id: `pay_${s.id.slice(4)}_r${i + 1}`,
      userId: sub.userId,
      subscriptionId: sub.id,
      plan: sub.plan,
      amount: sub.amount,
      status: "rechazado",
      method: sub.paymentMethod,
      kind: "renovacion",
      createdAt: `${r.at}T14:05:00.000Z`,
      failureReason: r.reason,
    })
  })
  if (s.pending) {
    payments.push({
      id: `pay_${s.id.slice(4)}_p1`,
      userId: sub.userId,
      subscriptionId: sub.id,
      plan: sub.plan,
      amount: sub.amount,
      status: "pendiente",
      method: "transferencia",
      kind: "renovacion",
      createdAt: `${s.pending.at}T18:30:00.000Z`,
    })
  }
  if (s.refunded) {
    payments.push({
      id: `pay_${s.id.slice(4)}_rf`,
      userId: sub.userId,
      subscriptionId: sub.id,
      plan: sub.plan,
      amount: sub.amount,
      status: "reembolsado",
      method: sub.paymentMethod,
      kind: "renovacion",
      createdAt: `${s.refunded.at}T09:15:00.000Z`,
    })
  }
}
payments.sort((a, b) => a.createdAt.localeCompare(b.createdAt))

// ---------------------------------------------------------------------------
// Proyectos y costes de IA
// ---------------------------------------------------------------------------

/** Proyectos por mes. Suman 1.286; septiembre va a medio mes. */
const PROYECTOS_POR_MES = [30, 45, 60, 80, 95, 110, 125, 140, 165, 204, 146, 86]

/** Tarifas en dólares por minuto de audio (AssemblyAI) y por mil tokens (Gemini). */
const TARIFA_ASSEMBLY: Record<string, number> = {
  "universal-2": 0.0025,
  "universal-3": 0.0015,
}
const TARIFA_GEMINI: Record<string, number> = {
  "gemini-2.5-flash": 0.0003,
  "gemini-3.1-flash": 0.00024,
  "gemini-3.5-flash": 0.00019,
  "multi-window": 0.00048,
}

function modeloAssembly(mes: MonthKey) {
  return mes < "2026-06" ? "universal-2" : "universal-3"
}
function modeloGemini(mes: MonthKey, r: number) {
  if (r < 0.05) return "multi-window"
  if (mes < "2026-05") return "gemini-2.5-flash"
  if (mes < "2026-09") return "gemini-3.1-flash"
  return "gemini-3.5-flash"
}

const rndProj = seededNoise(4242)
const paidIndex = new Set([...SUB_SEEDS.map((s) => s.userIndex), ...INTERNOS_INDEX])

export const projects: AdminProject[] = []
export const costs: AiCostEntry[] = []

const planAt = (userIndex: number, date: string): PlanId => {
  if (INTERNOS_INDEX.includes(userIndex)) return "interno"
  const uid = userSeeds[userIndex].id
  const sub = subscriptions.find(
    (s) =>
      s.userId === uid && s.startedAt <= date && (!s.canceledAt || s.canceledAt > date)
  )
  return sub ? sub.plan : "free"
}

MESES.forEach((mes, mi) => {
  const inicio = monthStart(mes)
  const tope = mes === MES_ACTUAL ? 12.5 : daysBetween(inicio, monthEnd(mes))
  for (let i = 0; i < PROYECTOS_POR_MES[mi]; i++) {
    const createdAt = iso(addDays(inicio, rndProj() * tope))
    // Un tercio de la actividad la generan los usuarios de pago y el equipo.
    // Si aún no hay nadie registrado (primeros días), el proyecto es del equipo.
    const registrados = userSeeds
      .map((u, idx) => idx)
      .filter((idx) => userSeeds[idx].createdAt <= createdAt)
    const elegibles = registrados.length > 0 ? registrados : [0]
    const dePago = elegibles.filter((idx) => paidIndex.has(idx))
    const pool = rndProj() < 0.34 && dePago.length > 0 ? dePago : elegibles
    // Sesgo hacia usuarios recientes: la mayoría prueba la herramienta al registrarse
    const t = rndProj()
    const userIndex =
      pool === elegibles
        ? (pool[Math.floor(pool.length * (1 - t * t))] ?? pool[pool.length - 1])
        : pool[Math.floor(rndProj() * pool.length)]
    const user = userSeeds[userIndex]
    const source = pickWeighted(FUENTES, rndProj())
    const minutes = round(5 + rndProj() * 35, 1)
    const r = rndProj()
    const status: AdminProject["status"] =
      mes === MES_ACTUAL && r > 0.97 ? "procesando" : r > 0.955 ? "error" : "listo"
    const clips =
      status === "listo"
        ? Math.round(4 + rndProj() * 8 + (mes >= "2026-08" ? 1.5 : 0))
        : 0
    const id = `prj_${String(projects.length + 1).padStart(4, "0")}`
    const userPlan = planAt(userIndex, createdAt)

    const mAssembly = modeloAssembly(mes)
    const segundos = Math.round(minutes * 60)
    const costeAssembly =
      status === "procesando" ? 0 : round(minutes * TARIFA_ASSEMBLY[mAssembly], 5)
    const mGemini = modeloGemini(mes, rndProj())
    const tokens = Math.round(minutes * (2_200 + rndProj() * 900))
    const costeGemini =
      status === "procesando" ? 0 : round((tokens / 1000) * TARIFA_GEMINI[mGemini], 5)

    projects.push({
      id,
      userId: user.id,
      userPlan,
      source,
      status,
      createdAt,
      clips,
      minutes,
      cost: round(costeAssembly + costeGemini, 5),
    })
    if (costeAssembly > 0) {
      costs.push({
        id: `cost_${id.slice(4)}_a`,
        provider: "assemblyai",
        model: mAssembly,
        amount: costeAssembly,
        units: segundos,
        unitKind: "segundos",
        projectId: id,
        userId: user.id,
        userPlan,
        createdAt,
      })
    }
    if (costeGemini > 0) {
      costs.push({
        id: `cost_${id.slice(4)}_g`,
        provider: "gemini",
        model: mGemini,
        amount: costeGemini,
        units: tokens,
        unitKind: "tokens",
        projectId: id,
        userId: user.id,
        userPlan,
        createdAt,
      })
    }
  }
})
projects.sort((a, b) => a.createdAt.localeCompare(b.createdAt))

// ---------------------------------------------------------------------------
// Usuarios completos: agregados, plan actual y avisos
// ---------------------------------------------------------------------------

const SUSPENDIDOS = new Set([333, 512])
const REVISAR = new Set([500, 333, 512, 447, 598])

export const users: AdminUser[] = userSeeds.map((seed, idx) => {
  const propios = projects.filter((p) => p.userId === seed.id)
  const listos = propios.filter((p) => p.status === "listo")
  const pagosOk = payments.filter((p) => p.userId === seed.id && p.status === "aprobado")
  const sub = subscriptions.find((s) => s.userId === seed.id)

  const plan: PlanId = INTERNOS_INDEX.includes(idx)
    ? "interno"
    : sub && sub.status !== "cancelada"
      ? sub.plan
      : "free"

  const ultimaActividad = [
    seed.createdAt,
    ...propios.map((p) => p.createdAt),
    ...pagosOk.map((p) => p.createdAt),
  ]
    .sort()
    .at(-1)!
  // Los usuarios de pago activos suelen haber entrado esta semana; sub_06 y sub_15 no
  const lastActiveAt =
    sub?.status === "activa" && !["sub_06", "sub_15"].includes(sub.id)
      ? iso(addDays(HOY, -(1 + (idx % 5))))
      : ultimaActividad

  const flags: UserFlag[] = []
  const ultimoPago = payments.filter((p) => p.userId === seed.id).at(-1)
  if (ultimoPago && ultimoPago.status !== "aprobado" && sub?.status !== "cancelada")
    flags.push("cobro-fallido")
  if (propios.length === 0 && daysBetween(seed.createdAt, HOY) > 7)
    flags.push("sin-activar")
  if (sub?.status === "activa" && daysBetween(lastActiveAt, HOY) > 14)
    flags.push("riesgo-churn")
  if (REVISAR.has(idx)) flags.push("revisar")

  return {
    id: seed.id,
    name: seed.name,
    email: seed.email,
    countryCode: seed.countryCode,
    plan,
    status: SUSPENDIDOS.has(idx)
      ? "suspendido"
      : daysBetween(lastActiveAt, HOY) > 60
        ? "inactivo"
        : "activo",
    createdAt: seed.createdAt,
    lastActiveAt,
    channel: seed.channel,
    affiliateId: seed.affiliateId,
    referredBy: seed.referredBy,
    firstProjectAt: propios[0]?.createdAt,
    firstClipAt: listos[0]?.createdAt,
    firstPaidAt: pagosOk[0]?.createdAt,
    projects: propios.length,
    clips: propios.reduce((n, p) => n + p.clips, 0),
    minutesProcessed: round(
      propios.reduce((n, p) => n + p.minutes, 0),
      1
    ),
    totalPaid: round(pagosOk.reduce((n, p) => n + p.amount, 0)),
    flags,
  }
})

// ---------------------------------------------------------------------------
// Referidos: uno por usuario que llegó por invitación
// ---------------------------------------------------------------------------

const rndRef = seededNoise(99)
export const referrals: Referral[] = users
  .filter((u) => u.channel === "referido")
  .map((u, i) => {
    // Quien invita es alguien registrado antes; los de pago invitan más
    const anteriores = users.filter((x) => x.createdAt < u.createdAt)
    const referrer = u.referredBy
      ? users.find((x) => x.id === u.referredBy)!
      : (anteriores[Math.floor(rndRef() * anteriores.length)] ?? users[0])
    const status =
      u.totalPaid > 0 ? "convertido" : u.projects > 0 ? "activado" : "registrado"
    return {
      id: `ref_${String(i + 1).padStart(3, "0")}`,
      referrerId: referrer.id,
      referredId: u.id,
      status,
      createdAt: u.createdAt,
      rewardMinutes: 60,
      // La recompensa del último convertido (sub_07) sigue sin otorgar: acción pendiente
      rewardGranted: status === "convertido" ? u.id !== userSeeds[590].id : false,
    }
  })

for (const r of referrals) {
  const u = users.find((x) => x.id === r.referredId)!
  u.referredBy = r.referrerId
}

/**
 * Onboarding, campañas y envíos simulados (lib/admin/mock-onboarding.ts): añade
 * a cada usuario su rama y sus respuestas, y devuelve la demanda con la que el
 * panel de mercado compara la oferta. Semilla propia: los 652 usuarios, sus
 * países y sus canales no cambian.
 */
const mercadoSimulado = simularOnboarding(users, HOY)

// ---------------------------------------------------------------------------
// Cuentas conectadas y publicaciones
// ---------------------------------------------------------------------------

/**
 * Lo que Clipealo publica, simulado.
 *
 * Va después del onboarding porque necesita saber quién es agencia
 * (`accountType`), y con semillas propias para no mover ni un usuario ni un
 * proyecto de los que ya estaban.
 *
 * Frontera de datos: la agenda y las cuentas viven hoy en el navegador
 * (`clipealo-agenda-v1`, `clipealo-cuentas-v1`), así que el servidor no puede
 * contarlas. Esto es un arquetipo con la forma que tendrá la tabla real, y las
 * páginas que lo pintan dicen que la cifra es simulada.
 */

const msDe = (fecha: string) => new Date(fecha).getTime()
const MS_HOY = msDe(HOY)
const HORA_MS = 3_600_000

/** El escalón del que salen redes y cupo. Interno mide como Empresa: sin límite práctico. */
const escalonDe = (plan: PlanId): PricingPlanId =>
  plan === "interno" ? "business" : (plan as PricingPlanId)

/**
 * Reparto por red, el que se ve en el producto: TikTok manda, Instagram le
 * sigue de lejos y el resto son minoría. Vale para elegir cuenta y para elegir
 * a dónde va cada envío, así que está escrito una vez.
 */
const REDES_PESO: [SocialId, number][] = [
  ["tiktok", 0.55],
  ["instagram", 0.25],
  ["youtube", 0.15],
  ["x", 0.02],
  ["facebook", 0.02],
  ["linkedin", 0.01],
]

/** Como `pickWeighted`, pero normalizando: las tablas filtradas no suman 1. */
function elegirPeso<T>(tabla: [T, number][], r: number): T {
  const total = tabla.reduce((n, [, w]) => n + w, 0)
  let acc = 0
  for (const [valor, peso] of tabla) {
    acc += peso
    if (r * total < acc) return valor
  }
  return tabla[tabla.length - 1][0]
}

const rndCuentas = seededNoise(8181)

/** Quien paga conecta: no se paga un plan por seis cuentas y no se usa ninguna. El equipo también. */
const CONECTAN_SEGURO = new Set(
  [...SUB_SEEDS.map((s) => s.userIndex), ...INTERNOS_INDEX].map((i) => userSeeds[i].id)
)

export const accounts: SocialAccountAdmin[] = []
for (const u of users) {
  const agencia = u.accountType === "agencia"
  // ≈30 % del total: una agencia llega a Clipealo con sus cuentas ya montadas,
  // un clipero suele probar antes de conectar nada
  const conecta = CONECTAN_SEGURO.has(u.id) || rndCuentas() < (agencia ? 0.45 : 0.28)
  if (!conecta) continue
  const escalon = escalonDe(u.plan)
  const redes = NETWORKS_BY_PLAN[escalon]
  const tabla = REDES_PESO.filter(([red]) => redes.includes(red))
  // La agencia publica en varias a la vez; el clipero empieza por una y añade
  // más si su plan se las vende. El cupo manda: en Prueba es una sola cuenta,
  // y de TikTok, así que el reparto por red sale escorado a TikTok a
  // propósito: casi todo el mundo está en Prueba (`NETWORKS_BY_PLAN`)
  const cuantas = Math.min(
    CUENTAS_POR_PLAN[escalon],
    agencia ? 2 + Math.floor(rndCuentas() * 2) : 2 + Math.floor(rndCuentas() * 3)
  )
  const desde = msDe(u.createdAt)
  // Quien conecta varias las reparte entre redes distintas: el clip es el
  // mismo y lo que se busca es otro público, no otra cuenta en la misma red
  const disponibles = [...tabla]
  for (let i = 0; i < cuantas; i++) {
    const red = elegirPeso(disponibles.length ? disponibles : tabla, rndCuentas())
    const fuera = disponibles.findIndex(([x]) => x === red)
    if (fuera >= 0) disponibles.splice(fuera, 1)
    // Se conecta pronto, no a mitad de la vida de la cuenta: `t²` acerca al alta
    const t = rndCuentas()
    const connectedAt = iso(new Date(desde + t * t * (MS_HOY - desde)))
    const r = rndCuentas()
    // Los tokens caducan solos; revocar es un acto de la persona y es más raro
    const estado = r < 0.06 ? "caducada" : r < 0.08 ? "revocada" : "conectada"
    accounts.push({
      id: `cta_${String(accounts.length + 1).padStart(4, "0")}`,
      userId: u.id,
      network: red,
      estado,
      dueno: agencia ? "agencia" : "clipero",
      connectedAt,
      ultimoFalloAt:
        estado === "caducada" ? iso(addDays(HOY, -(1 + rndCuentas() * 29))) : undefined,
    })
  }
}

const cuentasDeUsuario = new Map<string, SocialAccountAdmin[]>()
for (const c of accounts) {
  const lista = cuentasDeUsuario.get(c.userId) ?? []
  lista.push(c)
  cuentasDeUsuario.set(c.userId, lista)
}

/**
 * Desde cuándo hay envíos: Clipealo publica desde junio de 2026. Antes de esa
 * fecha los clips se bajaban y se subían a mano, y contarlos como publicados
 * sería inventarse el momento de valor de media docena de cohortes.
 */
const DESDE_PUBLICACIONES = "2026-06-01T00:00:00.000Z"
/** De cada diez clips listos de quien tiene cuenta, cuatro acaban saliendo. */
const SE_PUBLICA = 0.4
/** Fallos de envío, sin contar los de una cuenta que ya estaba rota. */
const FALLA = 0.03
/** Motivos cuando la cuenta estaba sana: el token caducado sigue siendo el primero. */
const MOTIVOS_PESO: [MotivoFalloPublicacion, number][] = [
  ["cuentaCaducada", 0.45],
  ["rechazoRed", 0.2],
  ["limiteApi", 0.15],
  ["permisoDenegado", 0.12],
  ["sinRed", 0.08],
]

const rndPubs = seededNoise(9191)

export const publications: PublicacionAdmin[] = []
for (const p of projects) {
  if (p.status !== "listo" || p.createdAt < DESDE_PUBLICACIONES) continue
  const cuentas = cuentasDeUsuario.get(p.userId)
  if (!cuentas || cuentas.length === 0) continue
  const tabla = cuentas.map(
    (c) =>
      [c, REDES_PESO.find(([red]) => red === c.network)?.[1] ?? 0.01] as [
        SocialAccountAdmin,
        number,
      ]
  )
  // Se publica en los dos días siguientes a tener el clip, nunca antes de hoy
  const margen = Math.min(48 * HORA_MS, MS_HOY - msDe(p.createdAt))
  if (margen <= 0) continue
  for (let k = 0; k < p.clips; k++) {
    if (rndPubs() >= SE_PUBLICA) continue
    const cuenta = elegirPeso(tabla, rndPubs())
    const creada = msDe(p.createdAt) + rndPubs() * margen
    const modo: ModoPublicacion = rndPubs() < 0.7 ? "ahora" : "programada"
    // Programar es elegir hora: de dos horas a cinco días vista
    const programada = creada + (2 + rndPubs() * 118) * HORA_MS
    const envio = modo === "programada" ? programada : creada + 60_000
    // Una cuenta caducada se lleva por delante todo lo que salga después
    const rota =
      cuenta.estado !== "conectada" &&
      cuenta.ultimoFalloAt !== undefined &&
      envio >= msDe(cuenta.ultimoFalloAt)
    const r = rndPubs()
    let estado: PublicacionEstado = "publicada"
    let motivoFallo: MotivoFalloPublicacion | undefined
    let intentos = 1
    let publicadaEn: string | undefined
    if (envio > MS_HOY) {
      estado = "programada"
      intentos = 0
    } else if (MS_HOY - envio < 2 * HORA_MS && r < 0.3) {
      // La cola está trabajando: hay envíos a medias a cualquier hora
      estado = "enviando"
    } else if (rota ? r < 0.6 : r < FALLA) {
      estado = "fallida"
      motivoFallo = rota ? "cuentaCaducada" : elegirPeso(MOTIVOS_PESO, rndPubs())
      intentos = 1 + Math.floor(rndPubs() * 3)
    } else if (r < FALLA + 0.008) {
      estado = "cancelada"
      intentos = 0
    } else {
      publicadaEn = iso(new Date(envio))
    }
    publications.push({
      id: `pub_${String(publications.length + 1).padStart(5, "0")}`,
      userId: p.userId,
      projectId: p.id,
      clipId: `${p.id}_c${String(k + 1).padStart(2, "0")}`,
      network: cuenta.network,
      cuentaId: cuenta.id,
      modo,
      programadaPara: modo === "programada" ? iso(new Date(programada)) : undefined,
      estado,
      motivoFallo,
      intentos,
      publicadaEn,
      creadaEn: iso(new Date(creada)),
    })
  }
}

/*
 * Una historia que hace falta contar: una cuenta que caducó después de su
 * último envío y con algo programado por delante. Es justo el caso que la cola
 * del día existe para cazar —no va a salir y nadie se entera hasta que pase la
 * hora—, y con doce caducadas entre doscientas cuentas podía no salir ninguno.
 * No se inventa ningún envío: se marca la primera cuenta que ya tenía uno
 * esperando, y el fallo se fecha justo después de lo último que sí publicó.
 */
const conFuturo = publications.find(
  (p) => p.estado === "programada" && p.programadaPara && msDe(p.programadaPara) > MS_HOY
)
const cuentaQueCaduca = conFuturo
  ? accounts.find((c) => c.id === conFuturo.cuentaId)
  : undefined
if (cuentaQueCaduca?.estado === "conectada") {
  const ultimo = publications
    .filter((p) => p.cuentaId === cuentaQueCaduca.id && p.publicadaEn)
    .map((p) => msDe(p.publicadaEn!))
    .sort((a, b) => b - a)[0]
  cuentaQueCaduca.estado = "caducada"
  cuentaQueCaduca.ultimoFalloAt = iso(
    new Date(Math.min(MS_HOY, (ultimo ?? MS_HOY) + HORA_MS))
  )
}

// El momento de valor: el primer clip que salió de verdad a una red
for (const p of publications) {
  if (p.estado !== "publicada" || !p.publicadaEn) continue
  const u = users.find((x) => x.id === p.userId)
  if (!u) continue
  if (!u.firstPublishedAt || p.publicadaEn < u.firstPublishedAt)
    u.firstPublishedAt = p.publicadaEn
}

export const adminDataset: AdminDataset = {
  updatedAt: HOY,
  timeZone: "America/Lima",
  currency: "USD",
  plans,
  users,
  subscriptions,
  payments,
  costs,
  projects,
  affiliates,
  referrals,
  campaigns: mercadoSimulado.campaigns,
  submissions: mercadoSimulado.submissions,
  accounts,
  publications,
}

export { PLAN_PRICE }
