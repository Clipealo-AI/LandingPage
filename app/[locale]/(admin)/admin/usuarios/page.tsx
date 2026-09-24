import type { Metadata } from "next"
import { IntlExtra } from "@/i18n/zone"
import { Suspense, type ReactNode } from "react"
import { AlertTriangle, ArrowRight } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import { getFormat } from "@/lib/format"
import { conMes, mesEnEnlaces } from "@/lib/admin/enlaces"
import {
  getAdminMonth,
  getAdminMonths,
  getAdminSeries,
  getAdminUsers,
  resolveMonth,
} from "@/lib/api/admin"
import { AdminPage, AdminSection } from "@/components/admin/admin-page"
import { CohortTable } from "@/components/admin/cohort-table"
import { FunnelTable } from "@/components/admin/funnel-table"
import { deltaOf, KpiCard, KpiGrid } from "@/components/admin/kpi-card"
import { MockAction } from "@/components/admin/mock-action"
import { TableSkeleton } from "@/components/admin/table-skeleton"
import { INTL_TAG } from "@/components/admin/textos"
import { UsuariosCanales } from "@/components/admin/usuarios-canales"
import { UsuariosDormidos } from "@/components/admin/usuarios-dormidos"
import { UsuariosPaises } from "@/components/admin/usuarios-paises"
import { UsuariosTable } from "@/components/admin/usuarios-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { idiomaDe } from "@/i18n/server"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/usuarios">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "admin.usuarios" })
  return { title: t("title") }
}

/**
 * Las personas detrás de los números: quién se activa, quién convierte,
 * quién vuelve, quién usa el producto sin pagar (PQL), quién está dormido y
 * qué etiquetas de plan no cuadran con la suscripción real.
 *
 * Solo lee y pinta: las cohortes cerradas, las medias, los semáforos y los
 * umbrales viven en `lib/admin/metrics.ts`, como en el resto del backoffice.
 */
export default async function AdminUsuariosPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ mes?: string }>
}) {
  const locale = await idiomaDe(params)
  const [t, tAdmin] = await Promise.all([
    getTranslations({ locale, namespace: "admin.usuarios" }),
    getTranslations({ locale, namespace: "admin" }),
  ])
  const f = getFormat(locale)
  const guion = "—"
  const decimal = new Intl.NumberFormat(INTL_TAG[locale], {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    useGrouping: false,
  })
  /** Variación en puntos porcentuales, con signo: «+2,3 puntos». */
  const puntos = (d: number) =>
    tAdmin("units.pointsNbsp", {
      valor: `${d >= 0 ? "+" : "−"}${decimal.format(Math.abs(d))}`,
    })

  const { mes } = await searchParams
  const month = resolveMonth(mes)
  const [snap, { months, current }, { cohortes, retencionM1 }, rows] = await Promise.all([
    getAdminMonth(month),
    getAdminMonths(),
    getAdminSeries(8, month),
    getAdminUsers(month),
  ])
  const {
    actividad,
    clientes,
    usuarios,
    conversion,
    funnelMensual,
    activacionD7,
    pql,
    dormidos,
    costes,
  } = snap
  const ultimaD7 = activacionD7.ultima
  const uc = conversion.ultimaCerrada
  // El nivel se escribe junto a la cifra; el color solo lo acompaña
  const nivelM1 = retencionM1.nivel ?? "medio"
  const strongM1 = (chunks: ReactNode) => (
    <strong
      className={
        nivelM1 === "episodico"
          ? "text-destructive"
          : nivelM1 === "nucleo"
            ? "text-success"
            : "text-foreground"
      }
    >
      {chunks}
    </strong>
  )

  const mesEnlace = mesEnEnlaces(month, current)

  return (
    <IntlExtra ns={["admin.usuarios", "admin.cohorts", "admin.funnel"]}>
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
            label={tAdmin("kpis.activos.label")}
            value={f.number(actividad.mau)}
            tone={actividad.tono}
            sparkline={actividad.wauSerie.map((p) => p.wau)}
            delta={deltaOf(
              actividad.mau,
              actividad.mauPrevio,
              (d) => `${d >= 0 ? "+" : "−"}${Math.abs(d)}`,
              tAdmin("compare.prev30d")
            )}
            lines={[
              tAdmin("kpis.activos.week", {
                wau: actividad.wau,
                pct:
                  actividad.adherenciaPct === null
                    ? guion
                    : f.percent(actividad.adherenciaPct, 0),
              }),
              tAdmin("kpis.activos.mix", {
                nuevos: actividad.mauNuevos,
                recurrentes: actividad.mauRecurrentes,
                prueba: actividad.freeActivos,
              }),
            ]}
            footnote={t("kpis.activeFootnote", {
              activos: actividad.pagantesActivos,
              total: clientes.n,
              pct:
                actividad.pagantesActivosPct === null
                  ? guion
                  : f.percent(actividad.pagantesActivosPct, 0),
            })}
            href={conMes("/admin/usuarios?actividad=30", mesEnlace)}
          />
          <KpiCard
            label={
              ultimaD7
                ? t("kpis.d7Cohort", { mes: f.month(ultimaD7.etiqueta) })
                : t("kpis.d7")
            }
            value={
              ultimaD7?.pctActivados === null || !ultimaD7
                ? guion
                : f.percent(ultimaD7.pctActivados, 0)
            }
            tone={activacionD7.tono}
            delta={
              ultimaD7 &&
              ultimaD7.pctActivados !== null &&
              activacionD7.media3Anteriores !== null
                ? deltaOf(
                    ultimaD7.pctActivados,
                    activacionD7.media3Anteriores,
                    puntos,
                    tAdmin("compare.cohortAvg")
                  )
                : undefined
            }
            lines={
              ultimaD7
                ? [
                    t("kpis.d7Line", {
                      activados: ultimaD7.activados,
                      registrados: ultimaD7.registrados,
                      pct:
                        ultimaD7.pctProyecto === null
                          ? guion
                          : f.percent(ultimaD7.pctProyecto, 0),
                    }),
                    t("kpis.d7Avg", {
                      media:
                        activacionD7.media3Anteriores === null
                          ? guion
                          : f.percent(activacionD7.media3Anteriores, 0),
                      pagaron:
                        ultimaD7.pctPagantes === null
                          ? guion
                          : f.percent(ultimaD7.pctPagantes, 1),
                    }),
                  ]
                : [t("kpis.d7None")]
            }
            footnote={t("kpis.d7Footnote")}
            href="#cohortes"
          />
          <KpiCard
            label={
              uc ? t("kpis.convCohort", { mes: f.month(uc.cohorte) }) : t("kpis.conv")
            }
            value={!uc || uc.conv60 === null ? guion : f.percent(uc.conv60, 1)}
            tone={conversion.tono}
            delta={
              uc && uc.conv60 !== null && conversion.media3Anteriores.conv60 !== null
                ? deltaOf(
                    uc.conv60,
                    conversion.media3Anteriores.conv60,
                    puntos,
                    tAdmin("compare.cohortAvg")
                  )
                : undefined
            }
            lines={
              uc
                ? [
                    t("kpis.convLine", {
                      registrados: uc.registrados,
                      conv30: uc.conv30 === null ? guion : f.percent(uc.conv30, 1),
                      pagaron: uc.pagantesD30,
                    }),
                    t("kpis.convActivated", {
                      pct:
                        uc.convActivados === null
                          ? guion
                          : f.percent(uc.convActivados, 1),
                      meta: f.percent(conversion.metaConvActivados, 0),
                      mediana:
                        uc.medianaDiasAPago === null
                          ? guion
                          : tAdmin("units.days", { n: Math.round(uc.medianaDiasAPago) }),
                    }),
                  ]
                : [t("kpis.convNone")]
            }
            footnote={t("kpis.convFootnote", {
              pagaron: f.number(conversion.pagaronAlgunaVez),
              elegibles: f.number(usuarios.elegibles),
              pct: f.percent(conversion.pagaronAlgunaVezPct, 1),
              meta: f.percent(conversion.metaConv60, 0),
            })}
            href={conMes("/admin/usuarios?suscripcion=cliente-de-pago", mesEnlace)}
          />
          <KpiCard
            label={t("kpis.pql")}
            value={f.number(pql.n)}
            tone={pql.tono}
            delta={deltaOf(
              pql.n,
              pql.nPrevio,
              (d) => `${d >= 0 ? "+" : "−"}${Math.abs(d)}`,
              tAdmin("compare.weekAgo")
            )}
            lines={[
              t("kpis.pqlCost", {
                monto: f.money(costes.deFree.amount),
                pct: f.percent(costes.deFree.pct, 0),
              }),
              t("kpis.pqlSegments", {
                sinActivar: usuarios.sinActivar,
                exPagantes: dormidos.exPagantes,
              }),
            ]}
            footnote={t("kpis.pqlFootnote")}
            href={conMes("/admin/usuarios?segmento=pql", mesEnlace)}
          />
        </KpiGrid>

        <AdminSection
          id="usuarios"
          title={t("all.title")}
          description={t("all.description", {
            total: f.number(usuarios.total),
            altas: usuarios.altas,
            previas: usuarios.altasPrevias,
            pagando: usuarios.pagando,
            prueba: f.number(usuarios.free),
            internos: usuarios.internos,
          })}
        >
          <Suspense fallback={<TableSkeleton />}>
            <UsuariosTable rows={rows} hoy={snap.updatedAt} />
          </Suspense>
        </AdminSection>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <AdminSection
            id="cohortes"
            title={t("cohorts.title")}
            description={t("cohorts.description")}
          >
            <Tabs defaultValue="funnel">
              <TabsList>
                <TabsTrigger value="funnel">{t("cohorts.tabs.funnel")}</TabsTrigger>
                <TabsTrigger value="retencion">{t("cohorts.tabs.retention")}</TabsTrigger>
                <TabsTrigger value="dormidos">{t("cohorts.tabs.dormant")}</TabsTrigger>
              </TabsList>

              <TabsContent value="funnel" className="space-y-3 pt-3">
                <FunnelTable
                  rows={funnelMensual}
                  cohorteLabel={t("cohorts.month")}
                  caption={t("cohorts.funnelCaption")}
                />
                <p className="text-xs text-muted-foreground">{t("cohorts.funnelNote")}</p>
              </TabsContent>

              <TabsContent value="retencion" className="space-y-4 pt-3">
                <p className="text-xs text-muted-foreground tabular-nums">
                  {retencionM1.cohorte && retencionM1.pct !== null
                    ? retencionM1.media3Anteriores !== null
                      ? t.rich("cohorts.retentionAvg", {
                          b: strongM1,
                          mes: f.month(retencionM1.cohorte),
                          pct: f.percent(retencionM1.pct, 0),
                          media: f.percent(retencionM1.media3Anteriores, 0),
                          nivel: t(`cohorts.level.${nivelM1}`),
                        })
                      : t.rich("cohorts.retention", {
                          b: strongM1,
                          mes: f.month(retencionM1.cohorte),
                          pct: f.percent(retencionM1.pct, 0),
                          nivel: t(`cohorts.level.${nivelM1}`),
                        })
                    : t("cohorts.retentionNone")}
                </p>
                <div className="grid gap-4 2xl:grid-cols-2">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">{t("cohorts.overSignups")}</h3>
                    <CohortTable rows={cohortes} base="registrados" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">
                      {t("cohorts.overActivated")}
                    </h3>
                    <CohortTable rows={cohortes} base="activados" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="dormidos" className="pt-3">
                <UsuariosDormidos block={dormidos} hoy={snap.updatedAt} mes={mesEnlace} />
              </TabsContent>
            </Tabs>
          </AdminSection>

          <div className="min-w-0 space-y-6">
            <AdminSection
              id="paises"
              title={t("countries.title")}
              description={t("countries.description")}
            >
              <UsuariosPaises paises={usuarios.porPais} mes={mesEnlace} />
            </AdminSection>

            <AdminSection
              id="canales"
              title={t("channels.title")}
              description={t("channels.description")}
              aside={
                <Button variant="ghost" size="sm" asChild>
                  <Link href={conMes("/admin/afiliados", mesEnlace)}>
                    {tAdmin("nav.items.afiliados")} <ArrowRight />
                  </Link>
                </Button>
              }
            >
              <UsuariosCanales canales={usuarios.porCanal} mes={mesEnlace} />
              <p className="text-xs text-muted-foreground">{t("channels.note")}</p>
            </AdminSection>

            {usuarios.incoherencias > 0 && (
              <Alert>
                <AlertTriangle />
                <AlertTitle>
                  {t("mismatch.title", { n: usuarios.incoherencias })}
                </AlertTitle>
                <AlertDescription>
                  <p>{t("mismatch.description")}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={conMes("/admin/usuarios?segmento=incoherencia", mesEnlace)}
                      >
                        {t("mismatch.viewList")}
                      </Link>
                    </Button>
                    <MockAction
                      size="sm"
                      variant="ghost"
                      efecto={t("mismatch.reconcileEffect", {
                        n: usuarios.incoherencias,
                      })}
                    >
                      {t("mismatch.reconcile")}
                    </MockAction>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </AdminPage>
    </IntlExtra>
  )
}
