import {
  liquidar,
  pagoPorVideo,
  redondear,
  vistasDe,
  type Campana,
  type Envio,
} from "@/lib/campanas"
import type { CountryCode } from "@/lib/countries"

/**
 * Wallet del creador: lo que gana con sus clips en campañas y lo que retira.
 *
 * - GANADO: la suma de lo que cobran sus clips aprobados, con la misma regla
 *   que reparte cada campaña (`liquidar`): vistas al CPM hasta el tope.
 * - PENDIENTE: lo que cobrarían sus clips en revisión con las vistas de hoy.
 *   No se puede retirar hasta que se aprueben.
 * - DISPONIBLE: ganado − retiros pagados − retiros en curso. Es lo retirable.
 */

export const METODOS_RETIRO = ["paypal", "transferencia", "yape"] as const
/**
 * Nombre, destino, ayuda y plazo de cada método en
 * `campaigns.withdrawal.method.<id>` de los mensajes.
 */
export type MetodoRetiro = (typeof METODOS_RETIRO)[number]

/**
 * Métodos de cobro de cada país, en el orden en que se ofrecen. Yape solo
 * existe en Perú. Brasil, de momento, sin Pix (se abre tras medir 4-6 semanas).
 */
export const METODOS_POR_PAIS: Record<CountryCode, readonly MetodoRetiro[]> = {
  PE: ["paypal", "transferencia", "yape"],
  MX: ["paypal", "transferencia"],
  CO: ["paypal", "transferencia"],
  CL: ["paypal", "transferencia"],
  AR: ["paypal", "transferencia"],
  ES: ["paypal", "transferencia"],
  EC: ["paypal", "transferencia"],
  BR: ["paypal", "transferencia"],
  US: ["paypal", "transferencia"],
}

/** Métodos para un país; con «Otro país» o sin país, los que valen en todas partes. */
export const metodosDe = (pais: CountryCode | "otro" | null | undefined) =>
  pais && pais !== "otro" ? METODOS_POR_PAIS[pais] : METODOS_POR_PAIS.US

/** Por debajo de esto la comisión de la pasarela se come el retiro. */
export const RETIRO_MINIMO = 10

export const ESTADOS_RETIRO = ["solicitado", "pagado", "rechazado"] as const
/** Etiquetas en `campaigns.withdrawal.status`. */
export type EstadoRetiro = (typeof ESTADOS_RETIRO)[number]

export interface Retiro {
  id: string
  userId: string
  nombre: string
  importe: number
  metodo: MetodoRetiro
  destino: string
  estado: EstadoRetiro
  solicitadoEn: string
  resueltoEn?: string
  motivo?: string
}

export const retirosSemilla: Retiro[] = [
  {
    id: "ret_ana_01",
    userId: "u_ana",
    nombre: "Ana Ruiz",
    importe: 60,
    metodo: "paypal",
    destino: "ana@estudio.co",
    estado: "pagado",
    solicitadoEn: "2026-08-20T15:00:00.000Z",
    resueltoEn: "2026-08-21T10:00:00.000Z",
  },
  {
    id: "ret_valeria_01",
    userId: "u_valeria",
    nombre: "Valeria Q.",
    importe: 145.5,
    metodo: "yape",
    destino: "987654321",
    estado: "solicitado",
    solicitadoEn: "2026-09-12T22:10:00.000Z",
  },
  {
    id: "ret_mateo_01",
    userId: "u_mateo",
    nombre: "Mateo F.",
    importe: 38,
    metodo: "paypal",
    destino: "mateo.f@gmail.com",
    estado: "solicitado",
    solicitadoEn: "2026-09-13T08:40:00.000Z",
  },
]

/**
 * Qué falla en un retiro. El texto está en `campaigns.withdraw.errors.<code>`;
 * `min` va sin formato y el diálogo lo pinta en el idioma.
 */
export type ErrorRetiro =
  | {
      code:
        | "invalidEmail"
        | "invalidPhone"
        | "invalidAccount"
        | "amountRequired"
        | "aboveAvailable"
    }
  | { code: "belowMinimum"; values: { min: number } }

export function validarDestino(
  metodo: MetodoRetiro,
  destino: string
): ErrorRetiro | null {
  const d = destino.trim()
  if (metodo === "paypal")
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d) ? null : { code: "invalidEmail" }
  if (metodo === "yape")
    return /^9\d{8}$/.test(d.replace(/\s/g, "")) ? null : { code: "invalidPhone" }
  const limpio = d.replace(/[\s-]/g, "").toUpperCase()
  return /^\d{20}$/.test(limpio) || /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(limpio)
    ? null
    : { code: "invalidAccount" }
}

export function validarRetiro(importe: number, disponible: number): ErrorRetiro | null {
  if (!Number.isFinite(importe) || importe <= 0) return { code: "amountRequired" }
  if (importe < RETIRO_MINIMO)
    return { code: "belowMinimum", values: { min: RETIRO_MINIMO } }
  if (redondear(importe) > redondear(disponible)) return { code: "aboveAvailable" }
  return null
}

export type TipoMovimiento = "ingreso" | "pendiente" | "retiro"

interface MovimientoBase {
  id: string
  fecha: string
  /** Título del clip; en un retiro, el destino enmascarado o el motivo del rechazo. */
  detalle: string
  /** Con signo: los retiros restan. */
  importe: number
}

/**
 * Un clip que cobra (o cobrará) en una campaña, o un retiro. La interfaz pinta
 * el concepto: el título de la campaña o «Retiro a …» con el método.
 */
export type Movimiento = MovimientoBase &
  (
    | {
        tipo: Exclude<TipoMovimiento, "retiro">
        /** Título de la campaña. */
        concepto: string
        estado: "cobrado" | "en-revision"
        campanaId: string
      }
    | { tipo: "retiro"; metodo: MetodoRetiro; estado: EstadoRetiro }
  )

export interface ResumenWallet {
  ganado: number
  pendiente: number
  retirado: number
  enCurso: number
  disponible: number
  movimientos: Movimiento[]
  /** Ganado por mes, del más antiguo al último, con los meses vacíos incluidos. */
  porMes: { mes: string; ganado: number }[]
}

export function resumenWallet(
  userId: string,
  campanas: Campana[],
  envios: Envio[],
  retiros: Retiro[],
  hasta: Date,
  meses = 6
): ResumenWallet {
  const movimientos: Movimiento[] = []
  let ganado = 0
  let pendiente = 0

  for (const c of campanas) {
    const propios = envios.filter((e) => e.campanaId === c.id && e.userId === userId)
    if (propios.length === 0) continue
    const l = liquidar(c, envios)
    for (const e of propios) {
      if (e.estado === "aprobado") {
        const pago = l.pagos.get(e.id)?.pago ?? 0
        if (pago <= 0) continue
        ganado += pago
        movimientos.push({
          id: e.id,
          tipo: "ingreso",
          fecha: e.enviadoEn,
          concepto: c.titulo,
          detalle: e.titulo,
          importe: pago,
          estado: "cobrado",
          campanaId: c.id,
        })
      } else if (e.estado === "en-revision") {
        const estimado = pagoPorVideo(c, vistasDe(e), l.restante).pago
        pendiente += estimado
        movimientos.push({
          id: e.id,
          tipo: "pendiente",
          fecha: e.enviadoEn,
          concepto: c.titulo,
          detalle: e.titulo,
          importe: estimado,
          estado: "en-revision",
          campanaId: c.id,
        })
      }
    }
  }

  const propios = retiros.filter((r) => r.userId === userId)
  const retirado = propios
    .filter((r) => r.estado === "pagado")
    .reduce((n, r) => n + r.importe, 0)
  const enCurso = propios
    .filter((r) => r.estado === "solicitado")
    .reduce((n, r) => n + r.importe, 0)
  for (const r of propios) {
    movimientos.push({
      id: r.id,
      tipo: "retiro",
      fecha: r.solicitadoEn,
      metodo: r.metodo,
      detalle:
        r.estado === "rechazado" && r.motivo ? r.motivo : enmascarar(r.metodo, r.destino),
      importe: -r.importe,
      estado: r.estado,
    })
  }

  const porMes = Array.from({ length: meses }, (_, i) => {
    const d = new Date(
      Date.UTC(hasta.getUTCFullYear(), hasta.getUTCMonth() - (meses - 1 - i), 1)
    )
    const mes = d.toISOString().slice(0, 7)
    const total = movimientos
      .filter((m) => m.tipo === "ingreso" && m.fecha.startsWith(mes))
      .reduce((n, m) => n + m.importe, 0)
    return { mes, ganado: redondear(total) }
  })

  return {
    ganado: redondear(ganado),
    pendiente: redondear(pendiente),
    retirado: redondear(retirado),
    enCurso: redondear(enCurso),
    disponible: redondear(ganado - retirado - enCurso),
    movimientos: movimientos.sort((a, b) => b.fecha.localeCompare(a.fecha)),
    porMes,
  }
}

/** «a***@estudio.co», «•••• 4321»: el destino se reconoce sin exponerse. */
export function enmascarar(metodo: MetodoRetiro, destino: string) {
  const d = destino.trim()
  if (metodo === "paypal") {
    const [usuario, dominio] = d.split("@")
    return dominio ? `${usuario.slice(0, 1)}***@${dominio}` : d
  }
  const digitos = d.replace(/\s/g, "")
  return `•••• ${digitos.slice(-4)}`
}
