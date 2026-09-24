import type { Metadata } from "next"
import { IntlExtra } from "@/i18n/zone"
import { Suspense } from "react"
import { Download, Plus } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { getFormat } from "@/lib/format"
import { mesEnEnlaces } from "@/lib/admin/enlaces"
import {
  getAdminMonth,
  getAdminMonths,
  getAdminPayments,
  getAdminSeries,
  resolveMonth,
} from "@/lib/api/admin"
import { AdminPage, AdminSection } from "@/components/admin/admin-page"
import { IngresosAnalisis } from "@/components/admin/ingresos-analisis"
import { IngresosPagosTable } from "@/components/admin/ingresos-pagos-table"
import { deltaOf, KpiCard, KpiGrid } from "@/components/admin/kpi-card"
import { MockAction } from "@/components/admin/mock-action"
import { TableSkeleton } from "@/components/admin/table-skeleton"
import { idiomaDe } from "@/i18n/server"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/ingresos">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "admin.ingresos" })
  return { title: t("title") }
}

/**
 * Ingresos responde a cuatro preguntas: cuánto ingreso recurrente hay y hacia
 * dónde va (puente), cuánto se cobra de lo que se intenta cobrar, cuánta caja
 * queda y cuánto vale un cliente. Debajo, cada pago con su estado y la acción
 * que le toca; al final, el desglose por plan, método y tipo.
 */
export default async function AdminIngresosPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ mes?: string }>
}) {
  const locale = await idiomaDe(params)
  const [t, tAdmin] = await Promise.all([
    getTranslations({ locale, namespace: "admin.ingresos" }),
    getTranslations({ locale, namespace: "admin" }),
  ])
  const f = getFormat(locale)
  const { mes } = await searchParams
  const month = resolveMonth(mes)
  const [snap, { months, current }, { series }, pagos] = await Promise.all([
    getAdminMonth(month),
    getAdminMonths(),
    getAdminSeries(6, month),
    getAdminPayments(month),
  ])
  const { mrr, caja, cobros, ltv, clientes } = snap
  const comparable = snap.mtd
    ? tAdmin("compare.sameDays", { dia: snap.mtd.dia })
    : tAdmin("compare.prevMonth")
  const guion = "—"

  /** «0,2 meses» · «7 meses». Decimal solo cuando aporta. */
  const meses = (n: number) => tAdmin("units.months", { n: Math.round(n * 10) / 10 })
  /** Variación en dólares que no se parte entre «US$» y la cifra. */
  const importe = (d: number) =>
    f.money(d, { signed: true }).replace(" ", String.fromCharCode(160))

  const movimientos = [
    mrr.nuevo > 0 && t("mrr.moves.nuevo", { monto: f.money(mrr.nuevo) }),
    mrr.expansion > 0 && t("mrr.moves.expansion", { monto: f.money(mrr.expansion) }),
    mrr.reactivacion > 0 &&
      t("mrr.moves.reactivacion", { monto: f.money(mrr.reactivacion) }),
    mrr.contraccion > 0 &&
      t("mrr.moves.contraccion", { monto: f.money(mrr.contraccion) }),
    mrr.baja > 0 && t("mrr.moves.baja", { monto: f.money(mrr.baja) }),
  ].filter(Boolean)

  const renov3m = cobros.cobroEfectivoRenovaciones3mPct
  const reembolso30 = cobros.tasaReembolso30dPct
  const cobroAlerta =
    (renov3m !== null && renov3m < 80) || (reembolso30 !== null && reembolso30 > 5)

  const ltvDivergen =
    ltv.realizado !== null &&
    ltv.estimado !== null &&
    ltv.realizado > 0 &&
    ltv.estimado / ltv.realizado > 2
  const nota = tAdmin("kpis.ltvNote", {
    n: ltv.nota.n,
    pct: f.percent(ltv.nota.bajaMinimaPct, 0),
  })

  const mesEnlace = mesEnEnlaces(month, current)

  return (
    <IntlExtra ns={["admin.ingresos", "admin.costes"]}>
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
      >
        <KpiGrid>
          <KpiCard
            featured
            label={tAdmin("kpis.mrr.label")}
            value={f.money(mrr.total)}
            sparkline={mrr.sparkline.map((p) => p.mrr)}
            delta={deltaOf(mrr.total, mrr.previous, importe, tAdmin("compare.prevClose"))}
            lines={[
              tAdmin("kpis.mrr.net", {
                neto: f.money(mrr.neto, { signed: true }),
                media: f.money(mrr.netoMedia3m, { signed: true }),
              }),
              movimientos.length > 0 ? movimientos.join(" · ") : t("mrr.noMoves"),
            ]}
            footnote={t("mrr.footnote", {
              arr: f.money(mrr.arr),
              riesgo: f.money(mrr.enRiesgo.monto),
              pct: f.percent(mrr.enRiesgo.pct, 0),
              clientes: clientes.n,
            })}
          />
          <KpiCard
            label={t("cobro.label")}
            value={renov3m === null ? guion : f.percent(renov3m, 0)}
            tone={cobroAlerta ? "alerta" : "neutral"}
            lines={[
              reembolso30 === null
                ? t("cobro.refundsNone")
                : cobros.nReembolsos > 0
                  ? t("cobro.refundsMonth", {
                      pct: f.percent(reembolso30, 1),
                      n: cobros.nReembolsos,
                    })
                  : t("cobro.refunds", { pct: f.percent(reembolso30, 1) }),
              t("cobro.month", {
                aprobados: cobros.nAprobados,
                rechazados: cobros.nRechazados,
                pendientes: cobros.nPendientes,
                monto: f.money(cobros.pendiente),
              }),
            ]}
            footnote={t("cobro.footnote")}
          />
          <KpiCard
            label={
              snap.mtd ? tAdmin("kpis.caja.labelMtd") : tAdmin("kpis.caja.labelMonth")
            }
            value={f.money(caja.neta)}
            tone={
              caja.neta < 0
                ? "alerta"
                : caja.pasivoPendiente > caja.neta
                  ? "aviso"
                  : "neutral"
            }
            delta={deltaOf(caja.neta, caja.netaPrevia, importe, comparable)}
            lines={[
              t("caja.accumulated", { monto: f.money(caja.acumulada) }),
              t("caja.forecast", {
                prevision: f.money(caja.prevision30d),
                cobros: f.money(caja.cobrosPrevistos30d),
              }),
            ]}
            footnote={t("caja.footnote", {
              cobros: f.money(caja.aprobado - caja.reembolsado),
              ia: f.money(caja.ia),
              comisiones: f.money(caja.comisionesPagadas),
              recompensas: f.money(caja.recompensas),
              pendiente: f.money(caja.pasivoPendiente),
            })}
          />
          <KpiCard
            label={t("ltv.label")}
            value={ltv.realizado === null ? guion : f.money(ltv.realizado)}
            tone={ltvDivergen ? "aviso" : "neutral"}
            lines={[
              ltv.estimado === null
                ? t("ltv.estimatedNone")
                : [
                    t("ltv.estimated", { monto: f.money(ltv.estimado) }),
                    ltv.vidaMediaMeses !== null &&
                      t("ltv.lifetime", { meses: meses(ltv.vidaMediaMeses) }),
                  ]
                    .filter(Boolean)
                    .join(" · "),
              [
                t("ltv.arppu", { monto: f.money(ltv.arppu) }),
                ltv.ltvCac !== null && t("ltv.ltvCac", { ratio: f.number(ltv.ltvCac) }),
                ltv.paybackMeses !== null &&
                  t("ltv.payback", { meses: meses(ltv.paybackMeses) }),
              ]
                .filter(Boolean)
                .join(" · "),
            ]}
            footnote={[
              t("ltv.footnote", { nota, n: clientes.pagaronAlgunaVez }),
              ltvDivergen && t("ltv.diverge"),
            ]
              .filter(Boolean)
              .join(" · ")}
          />
        </KpiGrid>

        <AdminSection
          id="pagos"
          title={t("pagos.title")}
          description={t("pagos.description")}
          aside={
            <>
              <MockAction size="sm" variant="outline" efecto={t("pagos.manualEffect")}>
                <Plus /> {t("pagos.manual")}
              </MockAction>
              <MockAction size="sm" variant="ghost" efecto={t("pagos.exportEffect")}>
                <Download /> {t("pagos.export")}
              </MockAction>
            </>
          }
        >
          <Suspense fallback={<TableSkeleton />}>
            <IngresosPagosTable rows={pagos} mes={mesEnlace} />
          </Suspense>
        </AdminSection>

        <AdminSection
          id="analisis"
          title={t("analisis.title")}
          description={t("analisis.description")}
        >
          <IngresosAnalisis
            mes={mesEnlace}
            mrr={mrr}
            ltv={ltv}
            cobros={cobros}
            series={series}
            clientesN={clientes.n}
            margenCajaPct={snap.margen.cajaPct}
          />
        </AdminSection>
      </AdminPage>
    </IntlExtra>
  )
}
