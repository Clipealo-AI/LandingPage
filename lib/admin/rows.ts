import type { TipoOrganizacion } from "@/lib/taxonomia"
import { addDays, daysBetween, monthOf, round } from "@/lib/admin/dates"
import {
  comisionDe,
  esActivadoD7,
  esIncoherente,
  estadoDormido,
  isActiveAt,
  isPayingAt,
  motivoPql,
  refInstant,
  resolveChannel,
  ultimaSuscripcion,
  userProjects,
  VALOR_MINUTO_RECOMPENSA,
  type AnomaliaCoste,
  type CanalResuelto,
} from "@/lib/admin/metrics"
import type {
  AcquisitionChannel,
  AdminDataset,
  AdminProject,
  AiProvider,
  CountryCode,
  MonthKey,
  Payment,
  PaymentMethod,
  PlanId,
  Subscription,
} from "@/lib/admin/types"

/**
 * Filas de las tablas del backoffice: una fila por entidad, ya enriquecida
 * con lo que el operador necesita leer sin abrir otra pantalla (segmento,
 * atribución, señales). Se calculan en servidor y llegan serializadas. Como
 * las métricas, guardan códigos y no frases: la tabla traduce.
 */

export type SuscripcionEstado =
  "cliente-de-pago" | "vencida" | "cancelada" | "pendiente-pago" | "ninguna"
export type Segmento =
  | "pql"
  | "pagante-inactivo"
  | "dormido"
  | "ex-pagante"
  | "incoherencia"
  | "pendiente-verificacion"
  | "cobro-fallido"
  | "revisar"
  | "sin-activar"
  | "activo"

export interface UserRow {
  /** Solo las agencias: qué clase de organización es (universidad, marca…). */
  tipoOrganizacion?: TipoOrganizacion
  /**
   * Solo lo que la tabla pinta, filtra u ordena. Cada campo de más viaja 652
   * veces al navegador en el payload de /admin/usuarios, así que lo que no se
   * lee no se emite.
   */
  id: string
  name: string
  email: string
  countryCode: CountryCode
  plan: PlanId
  suscripcion: SuscripcionEstado
  channel: AcquisitionChannel
  canalResuelto: CanalResuelto
  createdAt: string
  cohorte: MonthKey
  lastActiveAt: string
  diasInactivo: number
  proyectos30d: number
  proyectosListos: number
  minutos30d: number
  costeIa30d: number
  pagosAprobados: number
  totalPaid: number
  pagosPendientes: number
  pagosRechazados: number
  /** Cuándo creó su último proyecto; `null` si nunca. «Activo en N d» es tener uno en la ventana, como el KPI. */
  ultimoProyectoAt: string | null
  segmentos: Segmento[]
  /** Orden por defecto de la tabla: segmento prioritario y, dentro, minutos en 30 d. */
  prioridad: number
}

/**
 * Peso de cada segmento en el orden por defecto: primero lo que tiene importe
 * detrás (un pagante que no usa, uno de Prueba que ya se comporta como cliente),
 * luego lo que hay que arreglar y al final lo que solo hay que mirar.
 */
export const PESO_SEGMENTO: Record<Segmento, number> = {
  pql: 6,
  "pagante-inactivo": 6,
  "cobro-fallido": 5,
  "pendiente-verificacion": 5,
  incoherencia: 4,
  revisar: 4,
  "ex-pagante": 3,
  dormido: 2,
  "sin-activar": 1,
  activo: 0,
}

export const SEGMENTOS_POR_PESO = (Object.keys(PESO_SEGMENTO) as Segmento[]).sort(
  (a, b) => PESO_SEGMENTO[b] - PESO_SEGMENTO[a]
)

/** Numérico para que la columna se pueda invertir. */
export const prioridadDe = (segmentos: readonly Segmento[], minutos30d: number) =>
  segmentos.reduce((m, s) => Math.max(m, PESO_SEGMENTO[s]), 0) * 100_000 + minutos30d

export interface ResumenFilas {
  dePago: number
  pql: number
  pagantesInactivos: number
  minutos30d: number
}

/** El pie de la tabla sobre la lista filtrada. Corre en el cliente, pero es una función y tiene test. */
export function resumenFilas(rows: readonly UserRow[]): ResumenFilas {
  return {
    dePago: rows.filter((r) => r.suscripcion === "cliente-de-pago").length,
    pql: rows.filter((r) => r.segmentos.includes("pql")).length,
    pagantesInactivos: rows.filter((r) => r.segmentos.includes("pagante-inactivo"))
      .length,
    minutos30d: round(rows.reduce((n, r) => n + r.minutos30d, 0)),
  }
}

export function computeUserRows(data: AdminDataset, month: MonthKey): UserRow[] {
  const ref = refInstant(month, data.updatedAt)
  const projectsByUser = userProjects(data)
  const hace30 = addDays(ref, -30)
  const free = data.plans.find((p) => p.id === "free")!

  return data.users
    .filter((u) => new Date(u.createdAt) <= ref)
    .map((u) => {
      const ps = (projectsByUser.get(u.id) ?? []).filter(
        (p) => new Date(p.createdAt) <= ref
      )
      const ult30 = ps.filter((p) => new Date(p.createdAt) >= hace30)
      const pagos = data.payments.filter(
        (p) => p.userId === u.id && new Date(p.createdAt) <= ref
      )
      const sub = ultimaSuscripcion(data, u)
      const paying = sub ? isPayingAt(sub, ref) : false
      // Para los segmentos cuenta cualquier suscripción de pago vigente, como en la instantánea
      const paga = data.subscriptions.some((s) => s.userId === u.id && isPayingAt(s, ref))
      const suscripcion: SuscripcionEstado = !sub
        ? "ninguna"
        : paying
          ? "cliente-de-pago"
          : sub.status === "cancelada"
            ? "cancelada"
            : sub.status === "pendiente-pago"
              ? "pendiente-pago"
              : "vencida"
      const diasInactivo = Math.round(daysBetween(u.lastActiveAt, ref))
      const minutos30 = round(ult30.reduce((n, p) => n + p.minutes, 0))
      const aprobados = pagos.filter((p) => p.status === "aprobado")

      const segmentos: Segmento[] = []
      const ultimo = pagos.at(-1)
      if (ultimo?.status === "pendiente") segmentos.push("pendiente-verificacion")
      if (u.flags.includes("cobro-fallido")) segmentos.push("cobro-fallido")
      if (paying && diasInactivo >= 14) segmentos.push("pagante-inactivo")
      // Las tres definiciones compartidas con la instantánea (`lib/admin/metrics.ts`)
      if (esIncoherente(u, sub, paga)) segmentos.push("incoherencia")
      if (motivoPql(u, ps, ref, free, pagos.length > 0)) segmentos.push("pql")
      const dormido = estadoDormido(u, ref, paga)
      if (dormido) segmentos.push(dormido)
      if (u.flags.includes("revisar")) segmentos.push("revisar")
      if (u.flags.includes("sin-activar")) segmentos.push("sin-activar")
      if (segmentos.length === 0 && ult30.length > 0) segmentos.push("activo")

      const ordenados = [...ps].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        countryCode: u.countryCode,
        plan: u.plan,
        // Solo cuando la hay: asignarla siempre cruzaba 652 «$undefined»
        ...(u.onboarding?.tipoOrganizacion
          ? { tipoOrganizacion: u.onboarding.tipoOrganizacion }
          : {}),
        suscripcion,
        channel: u.channel,
        canalResuelto: resolveChannel(data, u),
        createdAt: u.createdAt,
        cohorte: monthOf(u.createdAt),
        lastActiveAt: u.lastActiveAt,
        diasInactivo,
        proyectos30d: ult30.length,
        proyectosListos: ps.filter((p) => p.status === "listo").length,
        minutos30d: minutos30,
        costeIa30d: round(ult30.reduce((n, p) => n + p.cost, 0)),
        pagosAprobados: aprobados.length,
        totalPaid: u.totalPaid,
        pagosPendientes: pagos.filter((p) => p.status === "pendiente").length,
        pagosRechazados: pagos.filter((p) => p.status === "rechazado").length,
        ultimoProyectoAt: ordenados[ordenados.length - 1]?.createdAt ?? null,
        segmentos,
        prioridad: prioridadDe(segmentos, minutos30),
      }
    })
}

/** Causa probable de un reembolso. */
export type CausaReembolso = "pipeline" | "duplicado" | "otro"

export interface PaymentRow extends Payment {
  userName: string
  userEmail: string
  billing: Subscription["billing"]
  atribucion: CanalResuelto
  comision: number
  recompensa: number
  causaReembolso: CausaReembolso | null
}

export function computePaymentRows(data: AdminDataset, month: MonthKey): PaymentRow[] {
  const ref = refInstant(month, data.updatedAt)
  return data.payments
    .filter((p) => new Date(p.createdAt) <= ref)
    .map((p) => {
      const u = data.users.find((x) => x.id === p.userId)!
      const sub = data.subscriptions.find((s) => s.id === p.subscriptionId)!
      const ref_ = data.referrals.find(
        (r) => r.referredId === p.userId && r.status === "convertido"
      )
      let causa: CausaReembolso | null = null
      if (p.status === "reembolsado") {
        const errorReciente = data.projects.some(
          (q) =>
            q.userId === p.userId &&
            q.status === "error" &&
            daysBetween(q.createdAt, p.createdAt) >= 0 &&
            daysBetween(q.createdAt, p.createdAt) <= 7
        )
        const duplicado = data.payments.some(
          (q) =>
            q.id !== p.id &&
            q.userId === p.userId &&
            q.status === "aprobado" &&
            q.amount === p.amount &&
            Math.abs(daysBetween(q.createdAt, p.createdAt)) < 1
        )
        causa = errorReciente ? "pipeline" : duplicado ? "duplicado" : "otro"
      }
      return {
        ...p,
        userName: u.name,
        userEmail: u.email,
        billing: sub.billing,
        atribucion: resolveChannel(data, u),
        comision: p.status === "aprobado" ? round(comisionDe(data, p)) : 0,
        recompensa:
          p.status === "aprobado" && p.kind === "nueva" && ref_
            ? round(ref_.rewardMinutes * VALOR_MINUTO_RECOMPENSA)
            : 0,
        causaReembolso: causa,
      }
    })
    .sort((a, b) => {
      const peso = (x: Payment) =>
        x.status === "pendiente" ? 0 : x.status === "rechazado" ? 1 : 2
      return peso(a) - peso(b) || b.createdAt.localeCompare(a.createdAt)
    })
}

export interface ProjectRow extends AdminProject {
  userName: string
  costePorMinuto: number
  desglose: { provider: AiProvider; model: string; amount: number }[]
  anomalia: AnomaliaCoste | null
  horasEnCola: number | null
  sinResolver: boolean
}

export function computeProjectRows(data: AdminDataset, month: MonthKey): ProjectRow[] {
  const ref = refInstant(month, data.updatedAt)
  const p30 = data.projects.filter(
    (p) =>
      new Date(p.createdAt) <= ref &&
      new Date(p.createdAt) >= addDays(ref, -30) &&
      p.cost > 0
  )
  const sorted = [...p30.map((p) => p.cost)].sort((a, b) => a - b)
  const med = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0
  const sortedMin = [...p30.map((p) => p.cost / Math.max(p.minutes, 1))].sort(
    (a, b) => a - b
  )
  const medMin = sortedMin.length ? sortedMin[Math.floor(sortedMin.length / 2)] : 0
  const costsByProject = new Map<string, ProjectRow["desglose"]>()
  for (const c of data.costs) {
    const list = costsByProject.get(c.projectId) ?? []
    list.push({ provider: c.provider, model: c.model, amount: c.amount })
    costsByProject.set(c.projectId, list)
  }
  return data.projects
    .filter((p) => new Date(p.createdAt) <= ref)
    .map((p) => {
      const porMin = p.cost / Math.max(p.minutes, 1)
      const anomalia: AnomaliaCoste | null =
        med > 0 && p.cost > med * 3
          ? "coste-3x-mediana"
          : medMin > 0 && porMin > medMin * 2
            ? "coste-minuto-2x-mediana"
            : null
      return {
        ...p,
        userName: data.users.find((u) => u.id === p.userId)?.name ?? p.userId,
        costePorMinuto: round(porMin, 4),
        desglose: costsByProject.get(p.id) ?? [],
        anomalia,
        horasEnCola:
          p.status === "procesando"
            ? Math.round(daysBetween(p.createdAt, ref) * 24)
            : null,
        sinResolver:
          p.status === "error" &&
          !data.projects.some(
            (q) =>
              q.userId === p.userId &&
              q.source === p.source &&
              q.createdAt > p.createdAt &&
              q.status === "listo"
          ),
      }
    })
    .sort((a, b) => {
      const peso = (x: ProjectRow) => (x.sinResolver ? 0 : x.anomalia ? 1 : 2)
      return peso(a) - peso(b) || b.createdAt.localeCompare(a.createdAt)
    })
}

export interface ReferralRow {
  id: string
  referrerId: string
  referrerName: string
  referrerPlan: PlanId
  referredId: string
  referredName: string
  referredEmail: string
  referredCountry: CountryCode
  createdAt: string
  status: "registrado" | "activado" | "convertido"
  activadoAt?: string
  convertidoAt?: string
  rewardMinutes: number
  rewardValor: number
  rewardEstado: "pendiente" | "otorgada" | "no-procede"
  antiguedadPendienteDias: number | null
  atascado: boolean
  ingresoInvitado: number
}

export function computeReferralRows(data: AdminDataset, month: MonthKey): ReferralRow[] {
  const ref = refInstant(month, data.updatedAt)
  return data.referrals
    .filter((r) => new Date(r.createdAt) <= ref)
    .map((r) => {
      const invitador = data.users.find((u) => u.id === r.referrerId)
      const invitado = data.users.find((u) => u.id === r.referredId)!
      const pendiente = r.status === "convertido" && !r.rewardGranted
      const rewardEstado: ReferralRow["rewardEstado"] = r.rewardGranted
        ? "otorgada"
        : pendiente
          ? "pendiente"
          : "no-procede"
      return {
        id: r.id,
        referrerId: r.referrerId,
        referrerName: invitador?.name ?? r.referrerId,
        referrerPlan: invitador?.plan ?? "free",
        referredId: r.referredId,
        referredName: invitado.name,
        referredEmail: invitado.email,
        referredCountry: invitado.countryCode,
        createdAt: r.createdAt,
        status: r.status,
        activadoAt: invitado.firstClipAt,
        convertidoAt: invitado.firstPaidAt,
        rewardMinutes: r.rewardMinutes,
        // `VALOR_MINUTO_RECOMPENSA`, no un precio suelto: con 19/180 la tabla
        // pintaba US$ 6,33 por los mismos 60 minutos que el KPI de al lado
        // valoraba en US$ 2,90, y el pie escribía «un minuto vale US$ 0,048»
        rewardValor: round(r.rewardMinutes * VALOR_MINUTO_RECOMPENSA),
        rewardEstado,
        antiguedadPendienteDias:
          pendiente && invitado.firstPaidAt
            ? Math.round(daysBetween(invitado.firstPaidAt, ref))
            : null,
        atascado: r.status === "registrado" && daysBetween(r.createdAt, ref) > 14,
        ingresoInvitado: invitado.totalPaid,
      }
    })
    .sort((a, b) => {
      const peso = (x: ReferralRow) =>
        x.rewardEstado === "pendiente" ? 0 : x.atascado ? 1 : 2
      return (
        peso(a) - peso(b) ||
        (b.antiguedadPendienteDias ?? 0) - (a.antiguedadPendienteDias ?? 0) ||
        b.createdAt.localeCompare(a.createdAt)
      )
    })
}

export interface AffiliateUserRow {
  id: string
  name: string
  email: string
  countryCode: CountryCode
  createdAt: string
  plan: PlanId
  activadoD7: boolean
  proyectos: number
  totalPaid: number
  comision: number
  costeIa: number
  method?: PaymentMethod
}

export function computeAffiliateUsers(
  data: AdminDataset,
  affiliateId: string,
  month: MonthKey
): AffiliateUserRow[] {
  const ref = refInstant(month, data.updatedAt)
  const a = data.affiliates.find((x) => x.id === affiliateId)
  if (!a) return []
  const projectsByUser = userProjects(data)
  return data.users
    .filter((u) => u.affiliateId === affiliateId && new Date(u.createdAt) <= ref)
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      countryCode: u.countryCode,
      createdAt: u.createdAt,
      plan: u.plan,
      activadoD7: esActivadoD7(u),
      proyectos: u.projects,
      totalPaid: u.totalPaid,
      comision: round((u.totalPaid * a.commissionPct) / 100),
      costeIa: round((projectsByUser.get(u.id) ?? []).reduce((n, p) => n + p.cost, 0)),
      method: data.subscriptions.find((s) => s.userId === u.id)?.paymentMethod,
    }))
    .sort((a, b) => b.totalPaid - a.totalPaid || b.proyectos - a.proyectos)
}

export interface SubscriptionRow extends Subscription {
  userName: string
  userEmail: string
  activa: boolean
  mrr: number
}

export function computeSubscriptionRows(
  data: AdminDataset,
  month: MonthKey
): SubscriptionRow[] {
  const ref = refInstant(month, data.updatedAt)
  return data.subscriptions
    .filter((s) => new Date(s.startedAt) <= ref)
    .map((s) => {
      const u = data.users.find((x) => x.id === s.userId)!
      return {
        ...s,
        userName: u.name,
        userEmail: u.email,
        activa: isActiveAt(s, ref),
        mrr: round(s.billing === "anual" ? s.amount / 12 : s.amount),
      }
    })
    .sort((a, b) => Number(b.activa) - Number(a.activa) || b.mrr - a.mrr)
}
