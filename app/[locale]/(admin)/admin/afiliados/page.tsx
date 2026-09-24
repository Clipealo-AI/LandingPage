import type { Metadata } from "next"
import { IntlExtra } from "@/i18n/zone"
import { Suspense } from "react"
import { getTranslations } from "next-intl/server"

import { getFormat } from "@/lib/format"
import {
  getAdminMonth,
  getAdminMonths,
  getAffiliateUsers,
  resolveMonth,
} from "@/lib/api/admin"
import type { AffiliateStats } from "@/lib/admin/metrics"
import { AdminPage, AdminSection } from "@/components/admin/admin-page"
import { AfiliadosCanales } from "@/components/admin/afiliados-canales"
import { AfiliadosDetalle } from "@/components/admin/afiliados-detalle"
import { AfiliadosTable } from "@/components/admin/afiliados-table"
import { deltaOf, KpiCard, KpiGrid } from "@/components/admin/kpi-card"
import { MockAction } from "@/components/admin/mock-action"
import { TableSkeleton } from "@/components/admin/table-skeleton"
import { INTL_TAG } from "@/components/admin/textos"
import { idiomaDe } from "@/i18n/server"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/afiliados">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "admin.afiliados" })
  return { title: t("title") }
}

const sum = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) * 100) / 100

/**
 * Afiliados: quién trae creadores que activan y pagan y quién solo altas que
 * consumen IA, cuánto se le debe a cada uno y desde cuándo, y cuánto se puede
 * pagar por un cliente (CAC frente a LTV). Las cifras salen de la instantánea
 * del mes; la lista de usuarios atribuidos, de `getAffiliateUsers`.
 */
export default async function AdminAfiliadosPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ mes?: string }>
}) {
  const locale = await idiomaDe(params)
  const [t, tAdmin] = await Promise.all([
    getTranslations({ locale, namespace: "admin.afiliados" }),
    getTranslations({ locale, namespace: "admin" }),
  ])
  const f = getFormat(locale)
  const guion = "—"
  const decimal = new Intl.NumberFormat(INTL_TAG[locale], {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    useGrouping: false,
  })
  const ratio = (v: number | null) => (v === null ? guion : `${decimal.format(v)}×`)
  const puntos = (d: number) =>
    tAdmin("units.points", {
      valor: `${d >= 0 ? "+" : "−"}${decimal.format(Math.abs(d))}`,
    })

  const { mes } = await searchParams
  const month = resolveMonth(mes)
  const [snap, { months, current }] = await Promise.all([
    getAdminMonth(month),
    getAdminMonths(),
  ])
  const [previo, usuariosPorAfiliado] = await Promise.all([
    getAdminMonth(snap.previousMonth),
    Promise.all(snap.afiliados.map((a) => getAffiliateUsers(a.affiliate.id, month))),
  ])

  const { ltv } = snap
  // Orden de trabajo: primero a quien se le debe, después el ROI más bajo.
  const afiliados: AffiliateStats[] = [...snap.afiliados].sort(
    (a, b) =>
      b.comisionPendiente - a.comisionPendiente ||
      (a.roi ?? Number.POSITIVE_INFINITY) - (b.roi ?? Number.POSITIVE_INFINITY)
  )
  const usuariosPorId = new Map(
    snap.afiliados.map((a, i) => [a.affiliate.id, usuariosPorAfiliado[i]])
  )

  // Comisiones
  const conPendiente = afiliados.filter((a) => a.comisionPendiente > 0)
  const pendienteTotal = sum(conPendiente.map((a) => a.comisionPendiente))
  const pendientePrevio = sum(previo.afiliados.map((a) => a.comisionPendiente))
  const masAntiguo = conPendiente.reduce<AffiliateStats | null>(
    (m, a) =>
      (a.antiguedadPendienteDias ?? 0) > (m?.antiguedadPendienteDias ?? -1) ? a : m,
    null
  )
  const antiguedadMax = masAntiguo?.antiguedadPendienteDias ?? null
  const devengadaTotal = sum(afiliados.map((a) => a.comisionDevengada))
  const pagadaTotal = sum(afiliados.map((a) => a.comisionPagada))

  // Canal afiliado frente al orgánico (acumulado hasta hoy)
  const canalAfiliado = snap.usuarios.porCanal.find((c) => c.channel === "afiliado")
  const canalOrganico = snap.usuarios.porCanal.find((c) => c.channel === "organico")
  const pagantesAtribuidos =
    canalAfiliado?.pagando ?? sum(afiliados.map((a) => a.pagando))
  const altasCanal = canalAfiliado?.total ?? sum(afiliados.map((a) => a.altas))
  const altas30d = sum(afiliados.map((a) => a.altas30d))
  const convAfiliado = canalAfiliado?.conversionPct ?? null
  const convOrganico = canalOrganico?.conversionPct ?? null
  const actAfiliado = canalAfiliado?.activacionPct ?? null
  const actOrganico = canalOrganico?.activacionPct ?? null
  const activacionBaja =
    actAfiliado !== null && actOrganico !== null && actAfiliado < actOrganico / 2

  // Ingreso atribuido en 30 d, neto de la comisión de cada afiliado
  const ingreso30Bruto = sum(afiliados.map((a) => a.ingreso30d))
  const comision30 = sum(
    afiliados.map((a) => (a.ingreso30d * a.affiliate.commissionPct) / 100)
  )
  const ingreso30Neto = Math.round((ingreso30Bruto - comision30) * 100) / 100
  const ingresoAtribuido = sum(afiliados.map((a) => a.ingresoAtribuido))
  const roiMedio =
    devengadaTotal > 0 ? Math.round((ingresoAtribuido / devengadaTotal) * 10) / 10 : null

  // CAC y LTV
  const ltvCacAfiliados =
    ltv.cacAfiliados90d && ltv.realizado
      ? Math.round((ltv.realizado / ltv.cacAfiliados90d) * 10) / 10
      : null
  const ltvCacBajo = (ltvCacAfiliados ?? ltv.ltvCac ?? Number.POSITIVE_INFINITY) < 1
  const paybackLargo = ltv.paybackMeses !== null && ltv.paybackMeses > 6
  const nota = tAdmin("kpis.ltvNote", {
    n: ltv.nota.n,
    pct: f.percent(ltv.nota.bajaMinimaPct, 0),
  })

  return (
    <IntlExtra ns={["admin.afiliados"]}>
      <AdminPage
        crumbs={[{ label: t("title") }]}
        title={t("title")}
        description={t("description")}
        month={month}
        months={months}
        current={current}
        updatedAt={snap.updatedAt}
        timeZone={snap.timeZone}
        mtd={snap.mtd}
        actions={
          pendienteTotal > 0 ? (
            <MockAction
              variant="brand"
              size="sm"
              efecto={t("payoutEffect", {
                monto: f.money(pendienteTotal),
                n: conPendiente.length,
              })}
            >
              {t("payout", { monto: f.money(pendienteTotal) })}
            </MockAction>
          ) : undefined
        }
      >
        <KpiGrid>
          <KpiCard
            label={t("kpis.pending")}
            value={f.money(pendienteTotal)}
            tone={antiguedadMax !== null && antiguedadMax > 30 ? "alerta" : "neutral"}
            delta={deltaOf(
              pendienteTotal,
              pendientePrevio,
              (d) => f.money(d, { signed: true }),
              tAdmin("compare.prevClose"),
              { invert: true }
            )}
            lines={[
              conPendiente.length === 0
                ? t("kpis.pendingNone")
                : t("kpis.pendingOldest", {
                    n: conPendiente.length,
                    dias: antiguedadMax ?? 0,
                    codigo: masAntiguo?.affiliate.code ?? "",
                  }),
              t("kpis.accrued", {
                devengada: f.money(devengadaTotal),
                pagada: f.money(pagadaTotal),
              }),
            ]}
            footnote={t("kpis.pendingFootnote")}
          />
          <KpiCard
            label={t("kpis.cac")}
            value={ltv.cacAfiliados90d === null ? guion : f.money(ltv.cacAfiliados90d)}
            tone={ltvCacBajo ? "alerta" : paybackLargo ? "aviso" : "neutral"}
            lines={[
              ltvCacAfiliados === null
                ? t("kpis.ltvCacNone")
                : t("kpis.ltvCac", {
                    ratio: ratio(ltvCacAfiliados),
                    ltv: f.money(ltv.realizado ?? 0),
                  }),
              t("kpis.blended", {
                blended: ltv.cacBlended90d === null ? guion : f.money(ltv.cacBlended90d),
                ratio: ratio(ltv.ltvCac),
                payback:
                  ltv.paybackMeses === null
                    ? guion
                    : t("kpis.paybackMonths", { n: f.number(ltv.paybackMeses) }),
              }),
            ]}
            footnote={t("kpis.cacFootnote", { nota })}
          />
          <KpiCard
            label={t("kpis.payers")}
            value={f.number(pagantesAtribuidos)}
            tone={activacionBaja ? "aviso" : "neutral"}
            delta={
              convAfiliado !== null && convOrganico !== null
                ? deltaOf(convAfiliado, convOrganico, puntos, tAdmin("compare.organic"))
                : undefined
            }
            lines={[
              t("kpis.conversion", {
                conv: convAfiliado === null ? guion : f.percent(convAfiliado, 1),
                altas: f.number(altasCanal),
                organico: convOrganico === null ? guion : f.percent(convOrganico, 1),
              }),
              t("kpis.activation", {
                act: actAfiliado === null ? guion : f.percent(actAfiliado, 0),
                organico: actOrganico === null ? guion : f.percent(actOrganico, 0),
                altas30: altas30d,
              }),
            ]}
            footnote={t("kpis.payersFootnote")}
          />
          <KpiCard
            label={t("kpis.revenue")}
            value={f.money(ingreso30Neto)}
            lines={[
              t("kpis.gross", {
                bruto: f.money(ingreso30Bruto),
                comision: f.money(comision30),
              }),
              t("kpis.accumulated", {
                monto: f.money(ingresoAtribuido),
                roi: ratio(roiMedio),
              }),
            ]}
            footnote={t("kpis.revenueFootnote")}
          />
        </KpiGrid>

        <AdminSection
          id="afiliados"
          title={t("codes.title")}
          description={t("codes.description")}
        >
          <Suspense fallback={<TableSkeleton rows={4} />}>
            <AfiliadosTable
              rows={afiliados}
              organico={{ activacionPct: actOrganico, conversionPct: convOrganico }}
            />
          </Suspense>
        </AdminSection>

        <AdminSection
          id="detalle"
          title={t("detail.title")}
          description={t("detail.description")}
        >
          <AfiliadosDetalle
            items={afiliados.map((a) => ({
              stats: a,
              usuarios: usuariosPorId.get(a.affiliate.id) ?? [],
            }))}
            hoy={snap.updatedAt}
          />
        </AdminSection>

        <AdminSection
          id="canales"
          title={t("channels.title")}
          description={t("channels.description")}
          className="max-w-4xl space-y-4"
        >
          <AfiliadosCanales canales={snap.usuarios.porCanal} />
        </AdminSection>
      </AdminPage>
    </IntlExtra>
  )
}
