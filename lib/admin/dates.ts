import type { MonthKey } from "@/lib/admin/types"

/** "2026-09-13T12:20:00.000Z" -> "2026-09". Todo se agrupa por mes UTC. */
export function monthOf(date: string | Date): MonthKey {
  const d = typeof date === "string" ? new Date(date) : date
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}` as MonthKey
}

/** Primer instante del mes. */
export function monthStart(month: MonthKey) {
  return new Date(`${month}-01T00:00:00.000Z`)
}

/** Primer instante del mes siguiente: el limite superior exclusivo. */
export function monthEnd(month: MonthKey) {
  const [y, m] = month.split("-").map(Number)
  return new Date(Date.UTC(y, m, 1))
}

export function addMonths(month: MonthKey, delta: number): MonthKey {
  const [y, m] = month.split("-").map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return monthOf(d)
}

/** Meses consecutivos hasta `last`, incluido. */
export function monthRange(last: MonthKey, count: number): MonthKey[] {
  return Array.from({ length: count }, (_, i) => addMonths(last, i - (count - 1)))
}

export function isInMonth(date: string, month: MonthKey) {
  return monthOf(date) === month
}

export function isBefore(date: string, limit: Date) {
  return new Date(date).getTime() < limit.getTime()
}

export const DAY_MS = 86_400_000

export function daysBetween(a: string | Date, b: string | Date) {
  const ta = typeof a === "string" ? new Date(a).getTime() : a.getTime()
  const tb = typeof b === "string" ? new Date(b).getTime() : b.getTime()
  return (tb - ta) / DAY_MS
}

export function addDays(date: string | Date, days: number) {
  const d = typeof date === "string" ? new Date(date) : new Date(date.getTime())
  return new Date(d.getTime() + days * DAY_MS)
}

/** Fecha ISO sin milisegundos de ruido, estable entre servidor y cliente. */
export function iso(d: Date) {
  return d.toISOString()
}

/** Mediana; null si no hay datos. */
export function median(values: number[]) {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function round(value: number, decimals = 2) {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

/** Variacion porcentual; null cuando la base es 0 (no existe "−100 %" honesto). */
export function pctChange(current: number, previous: number) {
  if (previous === 0) return null
  return round(((current - previous) / previous) * 100, 1)
}
