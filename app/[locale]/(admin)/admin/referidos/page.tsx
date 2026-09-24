import { Suspense } from "react"
import { IntlExtra } from "@/i18n/zone"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { getFormat } from "@/lib/format"
import {
  getAdminMonth,
  getAdminMonths,
  getAdminReferrals,
  resolveMonth,
} from "@/lib/api/admin"
import { VALOR_MINUTO_RECOMPENSA } from "@/lib/admin/metrics"
import { conMes, mesEnEnlaces } from "@/lib/admin/enlaces"
import { AdminPage, AdminSection } from "@/components/admin/admin-page"
import { deltaOf, KpiCard, KpiGrid } from "@/components/admin/kpi-card"
import { MockAction } from "@/components/admin/mock-action"
import { ReferidosInvitadores } from "@/components/admin/referidos-invitadores"
import { ReferidosPrograma } from "@/components/admin/referidos-programa"
import { ReferidosTable } from "@/components/admin/referidos-table"
import { TableSkeleton } from "@/components/admin/table-skeleton"
import { INTL_TAG } from "@/components/admin/textos"
import { idiomaDe } from "@/i18n/server"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/referidos">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "admin.referidos" })
  return { title: t("title") }
}

/** Una recompensa pendiente más de 48 h es un fallo al invitador: rojo. */
const SLA_RECOMPENSA_DIAS = 2

const porDebajo = (a: number | null, b: number | null) =>
  a !== null && b !== null && a < b

/**
 * Referidos responde a dos preguntas: ¿compensa el programa? (los invitados
 * activan y pagan al menos como el orgánico y la recompensa cuesta menos de
 * lo que pagan) y ¿fallamos a algún invitador? (ninguna recompensa de un
 * convertido queda sin otorgar). Arriba las cuatro cifras; debajo, la tabla
 * de trabajo con las pendientes primero y quién invita.
 */
export default async function AdminReferidosPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ mes?: string }>
}) {
  const locale = await idiomaDe(params)
  const [t, tAdmin] = await Promise.all([
    getTranslations({ locale, namespace: "admin.referidos" }),
    getTranslations({ locale, namespace: "admin" }),
  ])
  const f = getFormat(locale)
  const pct = (v: number | null, decimals = 0) =>
    v === null ? "—" : f.percent(v, decimals)
  const decimal = new Intl.NumberFormat(INTL_TAG[locale], {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    useGrouping: false,
  })
  /** Diferencia entre dos porcentajes, en puntos: «+3,2 puntos». */
  const puntos = (d: number) =>
    tAdmin("units.points", {
      valor: `${d >= 0 ? "+" : "−"}${decimal.format(Math.abs(d))}`,
    })

  const { mes } = await searchParams
  const month = resolveMonth(mes)
  const [snap, { months, current }, rows] = await Promise.all([
    getAdminMonth(month),
    getAdminMonths(),
    getAdminReferrals(month),
  ])
  const { referidos, actividad } = snap
  const pendientes = referidos.recompensasPendientes
  const antiguedadMaxima = pendientes.reduce(
    (max, r) => Math.max(max, r.antiguedadDias),
    0
  )
  const mesEnlace = mesEnEnlaces(month, current)
  const enlaceTabla = (params: Record<string, string>) =>
    conMes(
      `/admin/referidos?${new URLSearchParams(params).toString()}#referidos`,
      mesEnlace
    )

  return (
    <IntlExtra ns={["admin.referidos"]}>
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
          <>
            <MockAction variant="outline" size="sm" efecto={t("editRewardEffect")}>
              {t("editReward")}
            </MockAction>
            <MockAction variant="ghost" size="sm" efecto={t("pauseProgramEffect")}>
              {t("pauseProgram")}
            </MockAction>
          </>
        }
      >
        <KpiGrid>
          <KpiCard
            label={t("kpis.pending")}
            value={f.number(pendientes.length)}
            tone={
              antiguedadMaxima > SLA_RECOMPENSA_DIAS
                ? "alerta"
                : pendientes.length > 0
                  ? "aviso"
                  : "neutral"
            }
            lines={[
              pendientes.length > 0
                ? t("kpis.pendingValue", {
                    monto: f.money(referidos.valorPendiente, { decimals: 2 }),
                    minutos: f.number(referidos.minutosPendientes),
                  })
                : t("kpis.pendingNone"),
              pendientes.length > 0
                ? antiguedadMaxima > SLA_RECOMPENSA_DIAS
                  ? t("kpis.oldestLate", { dias: antiguedadMaxima })
                  : t("kpis.oldest", { dias: antiguedadMaxima })
                : t("kpis.granted", { monto: f.money(referidos.valorOtorgado) }),
            ]}
            footnote={t("kpis.pendingFootnote")}
            href={enlaceTabla({ recompensa: "pendiente" })}
          />
          <KpiCard
            label={t("kpis.activation")}
            value={pct(referidos.activacionPct)}
            tone={
              porDebajo(referidos.activacionPct, referidos.activacionOrganicaPct)
                ? "aviso"
                : "neutral"
            }
            delta={
              referidos.activacionPct !== null && referidos.activacionOrganicaPct !== null
                ? deltaOf(
                    referidos.activacionPct,
                    referidos.activacionOrganicaPct,
                    puntos,
                    tAdmin("compare.organic")
                  )
                : undefined
            }
            lines={[
              t("kpis.activationOrganic", { pct: pct(referidos.activacionOrganicaPct) }),
              t("kpis.invitees", {
                total: referidos.total90d,
                atascados: referidos.atascados,
              }),
            ]}
            footnote={t("kpis.activationFootnote")}
            href={enlaceTabla({ atascados: "si" })}
          />
          <KpiCard
            label={t("kpis.conversion")}
            value={pct(referidos.conversionPct)}
            tone={
              porDebajo(referidos.conversionPct, referidos.conversionOrganicaPct)
                ? "aviso"
                : "neutral"
            }
            delta={
              referidos.conversionPct !== null && referidos.conversionOrganicaPct !== null
                ? deltaOf(
                    referidos.conversionPct,
                    referidos.conversionOrganicaPct,
                    puntos,
                    tAdmin("compare.organic")
                  )
                : undefined
            }
            lines={[
              t("kpis.conversionOrganic", { pct: pct(referidos.conversionOrganicaPct) }),
              t("kpis.converted", {
                convertidos: referidos.convertidos,
                activados: referidos.activados,
              }),
            ]}
            footnote={t("kpis.conversionFootnote")}
            href={enlaceTabla({ estado: "convertido" })}
          />
          <KpiCard
            label={t("kpis.value")}
            value={
              referidos.valor === null
                ? "—"
                : t("kpis.valueRatio", { n: f.number(referidos.valor) })
            }
            tone={referidos.valor !== null && referidos.valor < 1 ? "alerta" : "neutral"}
            lines={[
              t("kpis.inviteeRevenue", { monto: f.money(referidos.ingresoInvitados90d) }),
              t("kpis.cac", {
                monto:
                  referidos.cacReferidos === null ? "—" : f.money(referidos.cacReferidos),
              }),
            ]}
            footnote={t("kpis.valueFootnote", {
              monto: f.money(VALOR_MINUTO_RECOMPENSA, { decimals: 3 }),
            })}
          />
        </KpiGrid>

        <AdminSection
          id="referidos"
          title={t("all.title")}
          description={t("all.description")}
          aside={
            pendientes.length > 0 && (
              <MockAction
                variant="brand"
                size="sm"
                efecto={t("all.grantEffect", {
                  minutos: f.number(referidos.minutosPendientes),
                  n: pendientes.length,
                })}
              >
                {t("all.grant", { n: pendientes.length })}
              </MockAction>
            )
          }
        >
          <Suspense fallback={<TableSkeleton />}>
            <ReferidosTable
              mes={mesEnlace}
              rows={rows}
              hoy={snap.updatedAt}
              slaDias={SLA_RECOMPENSA_DIAS}
            />
          </Suspense>
        </AdminSection>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <AdminSection
            id="invitadores"
            title={t("referrers.title")}
            description={t("referrers.description")}
          >
            <ReferidosInvitadores items={referidos.topReferrers} mes={mesEnlace} />
          </AdminSection>

          <AdminSection
            id="programa"
            title={t("program.title")}
            description={t("program.description")}
          >
            <ReferidosPrograma referidos={referidos} mau={actividad.mau} />
          </AdminSection>
        </div>
      </AdminPage>
    </IntlExtra>
  )
}
