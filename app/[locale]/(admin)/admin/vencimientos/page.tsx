import type { Metadata } from "next"
import { IntlExtra } from "@/i18n/zone"
import { Suspense } from "react"
import { getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import { getFormat } from "@/lib/format"
import { getAdminMonth, getAdminMonths, resolveMonth } from "@/lib/api/admin"
import { conMes, mesEnEnlaces } from "@/lib/admin/enlaces"
import { AdminPage, AdminSection } from "@/components/admin/admin-page"
import { KpiCard, KpiGrid } from "@/components/admin/kpi-card"
import { MockAction } from "@/components/admin/mock-action"
import { TableSkeleton } from "@/components/admin/table-skeleton"
import { VencimientosBajas } from "@/components/admin/vencimientos-bajas"
import { VencimientosTable } from "@/components/admin/vencimientos-table"
import { idiomaDe } from "@/i18n/server"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/vencimientos">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "admin.vencimientos" })
  return { title: t("title") }
}

const RIESGO_ALERTA_PCT = 25
const RECUPERACION_ALERTA_PCT = 50
const PENDIENTE_AVISO_H = 4
const PENDIENTE_ALERTA_H = 24

/** Espacios duros: «8–30 d: 1 (US$ 29)» no debe partirse por la mitad en una línea de KPI. */
const nbsp = (s: string) => s.replace(/ /g, String.fromCharCode(160))

/**
 * Las cuatro colas de cobro (pendientes de verificar, rechazados sin
 * recuperar, vencidas sin renovar, renovaciones próximas con señal) y los
 * pagantes inactivos, con importe, antigüedad y motivo. Debajo, las bajas
 * del mes con nombre: con diez clientes, cada baja tiene una historia.
 */
export default async function AdminVencimientosPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ mes?: string }>
}) {
  const locale = await idiomaDe(params)
  const [t, tAdmin] = await Promise.all([
    getTranslations({ locale, namespace: "admin.vencimientos" }),
    getTranslations({ locale, namespace: "admin" }),
  ])
  const f = getFormat(locale)
  const suscripciones = (n: number) => tAdmin("units.subscriptions", { n })
  const renovaciones = (n: number) => tAdmin("units.renewals", { n })

  const { mes } = await searchParams
  const month = resolveMonth(mes)
  const [snap, { months, current }] = await Promise.all([
    getAdminMonth(month),
    getAdminMonths(),
  ])
  const { vencimientos: v, mrr, clientes, caja, usuarios } = snap
  const { enRiesgo } = mrr
  const { inactivos, rechazados, pendientes, vencidas } = v

  const bucketDesde = (desde: number) => vencidas.buckets.find((b) => b.desde === desde)
  const vencidasRojas = bucketDesde(8)?.n ?? 0
  const vencidasAmbar = bucketDesde(4)?.n ?? 0
  const toneVencidas =
    pendientes.maxHoras > PENDIENTE_ALERTA_H || vencidasRojas > 0
      ? "alerta"
      : pendientes.maxHoras > PENDIENTE_AVISO_H || vencidasAmbar > 0
        ? "aviso"
        : "neutral"

  const mesEnlace = mesEnEnlaces(month, current)

  return (
    <IntlExtra ns={["admin.vencimientos"]}>
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
        <div className="space-y-3">
          <KpiGrid>
            <KpiCard
              label={t("kpis.atRisk")}
              value={f.money(enRiesgo.monto)}
              tone={enRiesgo.pct > RIESGO_ALERTA_PCT ? "alerta" : "neutral"}
              lines={[
                t("kpis.atRiskShare", {
                  suscripciones: suscripciones(enRiesgo.n),
                  pct: f.percent(enRiesgo.pct, 0),
                  mrr: f.money(mrr.total),
                }),
                enRiesgo.d7N > 0
                  ? t("kpis.renew7d", {
                      monto: f.money(enRiesgo.d7Monto),
                      suscripciones: suscripciones(enRiesgo.d7N),
                    })
                  : t("kpis.noRenew7d"),
                inactivos.rojo + inactivos.ambar > 0
                  ? t("kpis.inactive", {
                      rojos: inactivos.rojo,
                      mrrRojo: f.money(inactivos.mrrRojo),
                      ambar: inactivos.ambar,
                      mrrAmbar: f.money(inactivos.mrrAmbar),
                    })
                  : t("kpis.noInactive"),
              ]}
              footnote={t("kpis.atRiskFootnote", {
                pct: f.percent(RIESGO_ALERTA_PCT, 0),
              })}
            />
            <KpiCard
              label={t("kpis.renewals")}
              value={f.money(v.d30.monto)}
              tone={
                v.d7.conSenal > 0 ? "alerta" : v.d30.conSenal > 0 ? "aviso" : "neutral"
              }
              lines={[
                t("kpis.renewalsFlagged", {
                  renovaciones: renovaciones(v.d30.n),
                  n: v.d30.conSenal,
                }),
                t("kpis.renewals7d", {
                  monto: f.money(v.d7.monto),
                  renovaciones: renovaciones(v.d7.n),
                  n: v.d7.conSenal,
                }),
                caja.tasaCobroRenovaciones === null
                  ? t("kpis.expected", { monto: f.money(caja.cobrosPrevistos30d) })
                  : t("kpis.expectedRate", {
                      monto: f.money(caja.cobrosPrevistos30d),
                      pct: f.percent(caja.tasaCobroRenovaciones, 0),
                    }),
              ]}
              footnote={t("kpis.renewalsFootnote")}
              href={conMes("/admin/vencimientos?cola=proxima", mesEnlace)}
            />
            <KpiCard
              label={t("kpis.declined")}
              value={f.money(rechazados.monto)}
              tone={
                rechazados.tasaRecuperacion30dPct !== null &&
                rechazados.tasaRecuperacion30dPct < RECUPERACION_ALERTA_PCT
                  ? "alerta"
                  : rechazados.n > 0
                    ? "aviso"
                    : "neutral"
              }
              lines={[
                t("kpis.declinedQueue", { suscripciones: suscripciones(rechazados.n) }),
                rechazados.tasaRecuperacion30dPct === null
                  ? t("kpis.recoveryNone")
                  : t("kpis.recovery", {
                      pct: f.percent(rechazados.tasaRecuperacion30dPct, 0),
                    }),
              ]}
              footnote={t("kpis.declinedFootnote", {
                pct: f.percent(RECUPERACION_ALERTA_PCT, 0),
              })}
              href={conMes("/admin/vencimientos?cola=rechazado", mesEnlace)}
            />
            <KpiCard
              label={t("kpis.lapsed")}
              value={f.money(vencidas.monto)}
              tone={toneVencidas}
              lines={[
                `${suscripciones(vencidas.n)} · ${vencidas.buckets
                  .map((b) =>
                    nbsp(
                      b.n > 0
                        ? t("kpis.bucketAmount", {
                            desde: b.desde,
                            hasta: b.hasta,
                            n: b.n,
                            monto: f.money(b.monto),
                          })
                        : t("kpis.bucket", { desde: b.desde, hasta: b.hasta, n: b.n })
                    )
                  )
                  .join(" · ")}`,
                pendientes.n > 0
                  ? t("kpis.pending", {
                      n: pendientes.n,
                      monto: f.money(pendientes.monto),
                      horas: pendientes.maxHoras,
                    })
                  : t("kpis.noPending"),
              ]}
              footnote={t("kpis.lapsedFootnote", {
                aviso: PENDIENTE_AVISO_H,
                alerta: PENDIENTE_ALERTA_H,
              })}
            />
          </KpiGrid>
          <p className="text-xs text-muted-foreground">
            {t.rich("definition", {
              n: clientes.n,
              incoherencias: usuarios.incoherencias,
              b: (chunks) => <strong className="text-foreground">{chunks}</strong>,
              link: (chunks) => (
                <Link
                  href={conMes("/admin/usuarios?segmento=incoherencia", mesEnlace)}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </div>

        <AdminSection
          id="colas"
          title={t("queues.title")}
          description={t("queues.description")}
          aside={
            <>
              {v.d30.conSenal > 0 && (
                <MockAction
                  size="sm"
                  variant="outline"
                  efecto={t("queues.remindersEffect", { n: v.d30.conSenal })}
                >
                  {t("queues.reminders", { n: v.d30.conSenal })}
                </MockAction>
              )}
              {rechazados.n > 0 && (
                <MockAction
                  size="sm"
                  variant="brand"
                  efecto={t("queues.retryEffect", {
                    n: rechazados.n,
                    monto: f.money(rechazados.monto),
                  })}
                >
                  {t("queues.retry", { n: rechazados.n })}
                </MockAction>
              )}
            </>
          }
        >
          <Suspense fallback={<TableSkeleton />}>
            <VencimientosTable
              rows={v.items}
              updatedAt={snap.updatedAt}
              mes={mesEnlace}
            />
          </Suspense>
        </AdminSection>

        <AdminSection
          id="bajas"
          title={t("churn.title")}
          description={t("churn.description")}
        >
          <VencimientosBajas clientes={clientes} mes={mesEnlace} />
        </AdminSection>
      </AdminPage>
    </IntlExtra>
  )
}
