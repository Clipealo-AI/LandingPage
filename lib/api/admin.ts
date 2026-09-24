import "server-only"

import { CATALOGO_SEMILLA, type Catalogo } from "@/lib/formacion"

import { adminDataset, MES_ACTUAL, MESES } from "@/lib/admin/mock-data"
import {
  computeMercado,
  computeMonthly,
  computeOnboarding,
  computeSeries,
  cuentasPorPlan,
} from "@/lib/admin/metrics"
import {
  computeAffiliateUsers,
  computePaymentRows,
  computeProjectRows,
  computeReferralRows,
  computeSubscriptionRows,
  computeUserRows,
} from "@/lib/admin/rows"
import type {
  AdminDataset,
  MonthKey,
  PublicacionAdmin,
  SocialAccountAdmin,
} from "@/lib/admin/types"
import type { IdiomaAudiencia } from "@/lib/ajustes"
import type { Disputa, Participacion } from "@/lib/participacion"
import type { SocialId } from "@/lib/social"

/**
 * Frontera de datos del backoffice. Para conectar la base real, cambia el
 * cuerpo de `getAdminDataset()` por tus consultas (o por una llamada a tu
 * API) y no toques nada más: las métricas y las filas se calculan aquí, en
 * servidor, a partir de las entidades crudas.
 *
 * Todas las páginas de `/admin` son componentes de servidor: al navegador
 * solo llegan los números que cada vista pinta.
 */
export async function getAdminDataset(): Promise<AdminDataset> {
  return adminDataset
}

/**
 * Memoria de resultados por mes. El dataset del arquetipo no cambia, así que
 * la instantánea se calcula una vez por proceso: el layout y la página la
 * piden en la misma petición y cada navegación no vuelve a recorrer 652
 * usuarios y 1.286 proyectos. Al conectar datos reales, la clave incluye
 * `updatedAt`: basta con que cambie al sincronizar para invalidar todo, o se
 * sustituye por `revalidate`/`unstable_cache` con el TTL que convenga.
 */
const memo = new Map<string, unknown>()

function cached<T>(data: AdminDataset, key: string, compute: () => T): T {
  const k = `${data.updatedAt}|${key}`
  if (!memo.has(k)) memo.set(k, compute())
  return memo.get(k) as T
}

/** Normaliza el `?mes=` de la URL: si no es un mes conocido, el actual. */
export function resolveMonth(mes: string | string[] | undefined): MonthKey {
  const value = Array.isArray(mes) ? mes[0] : mes
  return value && (MESES as string[]).includes(value) ? (value as MonthKey) : MES_ACTUAL
}

/** Meses disponibles en el selector, del más antiguo al actual. */
export async function getAdminMonths(): Promise<{
  months: MonthKey[]
  current: MonthKey
}> {
  return { months: MESES, current: MES_ACTUAL }
}

/** Instantánea completa de un mes: KPIs, colas, funnel, costes, programas. */
export async function getAdminMonth(month: MonthKey = MES_ACTUAL) {
  const data = await getAdminDataset()
  return cached(data, `mes:${month}`, () => computeMonthly(data, month))
}

/** Cuentas por plan al instante de referencia del mes: lo que enseña el catálogo de planes. */
export async function getAdminCuentasPorPlan(month: MonthKey = MES_ACTUAL) {
  const data = await getAdminDataset()
  return cached(data, `cuentas:${month}`, () => cuentasPorPlan(data, month))
}

/** Series mensuales y cohortes para las gráficas (últimos `count` meses). */
export async function getAdminSeries(count = 12, until: MonthKey = MES_ACTUAL) {
  const data = await getAdminDataset()
  const idx = MESES.indexOf(until)
  const months = MESES.slice(Math.max(0, idx + 1 - count), idx + 1)
  return cached(data, `series:${months[0]}:${until}`, () => computeSeries(data, months))
}

export async function getAdminUsers(month: MonthKey = MES_ACTUAL) {
  const data = await getAdminDataset()
  return cached(data, `usuarios:${month}`, () => computeUserRows(data, month))
}

export async function getAdminPayments(month: MonthKey = MES_ACTUAL) {
  const data = await getAdminDataset()
  return cached(data, `pagos:${month}`, () => computePaymentRows(data, month))
}

export async function getAdminProjects(month: MonthKey = MES_ACTUAL) {
  const data = await getAdminDataset()
  return cached(data, `proyectos:${month}`, () => computeProjectRows(data, month))
}

export async function getAdminReferrals(month: MonthKey = MES_ACTUAL) {
  const data = await getAdminDataset()
  return cached(data, `referidos:${month}`, () => computeReferralRows(data, month))
}

export async function getAdminSubscriptions(month: MonthKey = MES_ACTUAL) {
  const data = await getAdminDataset()
  return cached(data, `suscripciones:${month}`, () =>
    computeSubscriptionRows(data, month)
  )
}

export async function getAffiliateUsers(
  affiliateId: string,
  month: MonthKey = MES_ACTUAL
) {
  const data = await getAdminDataset()
  return cached(data, `afiliado:${affiliateId}:${month}`, () =>
    computeAffiliateUsers(data, affiliateId, month)
  )
}

export async function getAdminPlans() {
  return (await getAdminDataset()).plans
}

/**
 * Funnel del onboarding «Tu primer corte» (§7.2). Los datos son simulados con
 * semilla propia hasta conectar la API: las páginas lo dicen en pantalla.
 */
export async function getAdminOnboarding() {
  const data = await getAdminDataset()
  return cached(data, "onboarding", () => computeOnboarding(data.users))
}

/**
 * Mercado por sector (§7.3): oferta de cliperos frente a presupuesto activo,
 * huecos, CPM que llena y creadores con fans y sin campaña. El filtro de idioma
 * y de red entra en la clave de la memoria.
 */
export async function getAdminMercado(
  filtro: { idioma?: IdiomaAudiencia | null; red?: SocialId | null } = {}
) {
  const data = await getAdminDataset()
  const clave = `mercado:${filtro.idioma ?? "*"}:${filtro.red ?? "*"}`
  return cached(data, clave, () => computeMercado(data, data.updatedAt, filtro))
}

/**
 * Lo que Clipealo ha publicado, y las cuentas por las que sale.
 *
 * Frontera de datos: el envío lo hace `lib/api/publicaciones.ts` y hoy lo que
 * queda de él vive en el navegador (`clipealo-agenda-v1` para la agenda,
 * `clipealo-cuentas-v1` para las cuentas), así que el servidor no tiene nada
 * que contar y estas dos funciones devuelven lo SIMULADO de `mock-data.ts`.
 * Las páginas lo dicen en pantalla: mientras no exista la tabla, la cifra no
 * está medida.
 *
 * Al conectar la API, `publicar()` escribe una fila por envío y aquí se
 * consulta esa tabla. Nada más cambia: las métricas ya leen estas formas.
 *
 * Lo que viaja es lo justo para medir —ids, red, estado, intentos y fechas—;
 * ni la URL de lo publicado, ni el handle de la cuenta, ni el token (§7.7).
 */
export async function getAdminPublicaciones(): Promise<PublicacionAdmin[]> {
  return (await getAdminDataset()).publications ?? []
}

/** Las cuentas conectadas, con su estado. Misma frontera que las publicaciones. */
export async function getAdminCuentas(): Promise<SocialAccountAdmin[]> {
  return (await getAdminDataset()).accounts ?? []
}

/**
 * El catálogo de Formación que conoce el servidor: las semillas.
 *
 * Mismo caso que las disputas: en el arquetipo lo que el admin publica vive en
 * su navegador (`hooks/use-catalogo-formacion.ts`), así que aquí solo está lo
 * que hay de fábrica y el cliente pone lo suyo encima. Al conectar la base, esta
 * función devuelve el catálogo de verdad y no cambia nada más.
 */
export async function getAdminFormacion(): Promise<Catalogo> {
  return CATALOGO_SEMILLA
}

/** Lo que el admin necesita para arbitrar, y nada más. */
export interface DisputasAdmin {
  disputas: Disputa[]
  /** Los compromisos de esas disputas: quién, qué plazo y en qué estado. */
  participaciones: Participacion[]
}

/**
 * Cola de disputas para arbitrar (docs/campanas-ciclo-2026-09.md).
 *
 * Frontera de datos: en el arquetipo las disputas nacen y se resuelven en el
 * cliente (`hooks/use-campanas.ts`, el mismo almacén que ve la app), así que el
 * servidor todavía no tiene ninguna que contar y esto devuelve la cola vacía.
 * Al conectar la API real es lo único que cambia: aquí se consultan las
 * disputas con su compromiso y la página las recibe ya resueltas del servidor.
 *
 * Lo que viaja es lo justo para decidir —quién reclama, contra quién, por qué,
 * las fechas y el tope por video de la campaña—; el wallet del clipero no.
 */
export async function getAdminDisputas(): Promise<DisputasAdmin> {
  return { disputas: [], participaciones: [] }
}
