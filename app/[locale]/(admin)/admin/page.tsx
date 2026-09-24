import type { Metadata } from "next"
import { IntlExtra } from "@/i18n/zone"
import { AlertTriangle, ArrowRight } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import { getFormat } from "@/lib/format"
import {
  getAdminMonth,
  getAdminOnboarding,
  getAdminMonths,
  getAdminSeries,
  resolveMonth,
} from "@/lib/api/admin"
import type { CanalResuelto } from "@/lib/admin/metrics"
import { conMes, mesEnEnlaces } from "@/lib/admin/enlaces"
import { AdminPage, AdminSection } from "@/components/admin/admin-page"
import { OnboardingPanel } from "@/components/admin/onboarding-panel"
import { ColaList } from "@/components/admin/cola-list"
import { CountryFlag } from "@/components/shared/country-flag"
import { FunnelTable } from "@/components/admin/funnel-table"
import { deltaOf, KpiCard, KpiGrid } from "@/components/admin/kpi-card"
import { CajaChart, MrrBridgeChart } from "@/components/admin/graficas-diferidas"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { idiomaDe } from "@/i18n/server"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "admin.panel" })
  return { title: t("title") }
}

/**
 * Las filas y la alerta de publicación salen de las métricas con destino
 * `/admin/publicaciones`, una pantalla que todavía no existe: la salud de
 * publicación vive en Costes, al lado del pipeline. El destino se reescribe
 * aquí, en el panel, porque mandar a alguien a un 404 desde la cola del día es
 * peor que no enseñar la fila.
 */
const DESTINO_PUBLICACIONES = "/admin/costes#publicaciones"

/**
 * El panel responde en una pantalla a cuatro preguntas: cuánto ingreso
 * recurrente hay y cuánto peligra, cuánto queda en caja, si se ganan o pierden
 * clientes y si hay uso real. Debajo, lo que hay que cobrar o arreglar hoy.
 */
export default async function AdminPanelPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ mes?: string }>
}) {
  const locale = await idiomaDe(params)
  const [t, tAdmin] = await Promise.all([
    getTranslations({ locale, namespace: "admin.panel" }),
    getTranslations({ locale, namespace: "admin" }),
  ])
  const f = getFormat(locale)
  const { mes } = await searchParams
  const month = resolveMonth(mes)
  const [snap, { months, current }, { series }, onboarding] = await Promise.all([
    getAdminMonth(month),
    getAdminMonths(),
    getAdminSeries(6, month),
    getAdminOnboarding(),
  ])
  const {
    mrr,
    caja,
    clientes,
    actividad,
    colas,
    funnelSemanal,
    ttv,
    pql,
    costes,
    publicaciones,
  } = snap
  const hoy = new Date(snap.updatedAt)
  const colasDelDia = colas.map((c) =>
    c.tipo === "publicacion" ? { ...c, href: DESTINO_PUBLICACIONES } : c
  )
  const alertaPublicaciones = snap.alertas.find((a) => a.id === "publicaciones")
  const comparable = snap.mtd
    ? tAdmin("compare.sameDays", { dia: snap.mtd.dia })
    : tAdmin("compare.prevMonth")
  const guion = "—"
  const canal = (c: CanalResuelto) =>
    c.code === "canal"
      ? tAdmin(`labels.channel.${c.values.canal}`)
      : tAdmin(`metrics.resolvedChannel.${c.code}`, c.values)

  const mesEnlace = mesEnEnlaces(month, current)

  return (
    <IntlExtra ns={["admin.funnel", "admin.queues", "admin.costes"]}>
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
            delta={deltaOf(
              mrr.total,
              mrr.previous,
              (d) => f.money(d, { signed: true }),
              tAdmin("compare.prevClose")
            )}
            lines={[
              mrr.enRiesgo.n > 0
                ? tAdmin("kpis.mrr.atRisk", {
                    monto: f.money(mrr.enRiesgo.monto),
                    n: mrr.enRiesgo.n,
                    pct: f.percent(mrr.enRiesgo.pct, 0),
                  })
                : tAdmin("kpis.mrr.noRisk"),
              tAdmin("kpis.mrr.net", {
                neto: f.money(mrr.neto, { signed: true }),
                media: f.money(mrr.netoMedia3m, { signed: true }),
              }),
            ]}
            footnote={tAdmin("kpis.mrr.footnote", { arr: f.money(mrr.arr) })}
            href={conMes("/admin/ingresos", mesEnlace)}
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
            delta={deltaOf(
              caja.neta,
              caja.netaPrevia,
              (d) => f.money(d, { signed: true }),
              comparable
            )}
            lines={[
              t("caja.lines", {
                cobros: f.money(caja.aprobado - caja.reembolsado),
                ia: f.money(caja.ia),
                comisiones: f.money(caja.comisionesPagadas),
              }),
              t("caja.forecast", {
                prevision: f.money(caja.prevision30d),
                pendiente: f.money(caja.pasivoPendiente),
              }),
            ]}
            footnote={t("caja.footnote")}
            href={conMes("/admin/ingresos", mesEnlace)}
          />
          <KpiCard
            label={t("clientes.label")}
            value={f.number(clientes.n)}
            tone={
              clientes.bajas >= clientes.nuevos + clientes.reactivados &&
              clientes.bajas > 0
                ? "alerta"
                : "neutral"
            }
            delta={deltaOf(
              clientes.n,
              clientes.nInicio,
              (d) =>
                tAdmin("units.clientsDelta", {
                  signo: d >= 0 ? "+" : "−",
                  n: Math.abs(d),
                }),
              tAdmin("compare.prevClose")
            )}
            lines={[
              t("clientes.flow", {
                nuevos: clientes.nuevos,
                bajas: clientes.bajas,
                reactivados: clientes.reactivados,
              }),
              clientes.churn.pct3m === null
                ? t("clientes.churnNoData")
                : clientes.churn.involuntarioPct !== null
                  ? t("clientes.churnInvoluntary", {
                      pct: f.percent(clientes.churn.pct3m, 1),
                      involuntario: f.percent(clientes.churn.involuntarioPct, 0),
                    })
                  : t("clientes.churn", { pct: f.percent(clientes.churn.pct3m, 1) }),
            ]}
            footnote={t("clientes.footnote", {
              nrr: clientes.nrr3m === null ? guion : f.percent(clientes.nrr3m, 0),
              pagaron: clientes.pagaronAlgunaVez,
              perdida: f.percent(clientes.perdidaHistoricaPct ?? 0, 0),
            })}
            href={conMes("/admin/vencimientos", mesEnlace)}
          />
          <KpiCard
            label={tAdmin("kpis.activos.label")}
            value={f.number(actividad.mau)}
            tone={
              actividad.pagantesActivosPct !== null && actividad.pagantesActivosPct < 70
                ? "aviso"
                : "neutral"
            }
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
            footnote={tAdmin("kpis.activos.payers", {
              activos: actividad.pagantesActivos,
              total: clientes.n,
              pct:
                actividad.pagantesActivosPct === null
                  ? guion
                  : f.percent(actividad.pagantesActivosPct, 0),
            })}
            href={conMes("/admin/usuarios", mesEnlace)}
          />
        </KpiGrid>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <AdminSection
            id="hoy"
            title={t("hoy.title")}
            description={t("hoy.description")}
            aside={
              <Button variant="ghost" size="sm" asChild>
                <Link href={conMes("/admin/vencimientos", mesEnlace)}>
                  {tAdmin("nav.items.vencimientos")} <ArrowRight />
                </Link>
              </Button>
            }
          >
            {/* Encima de la cola y no entre sus filas: publicar es lo que promete
                el producto, y un clip que no salió se arregla pidiendo reconectar
                la cuenta, casi siempre en un minuto */}
            {alertaPublicaciones && (
              <Alert variant="destructive">
                <AlertTriangle />
                <AlertTitle>{t("publicaciones.alertTitle")}</AlertTitle>
                <AlertDescription>
                  <p>
                    {t("publicaciones.alertDescription", { n: alertaPublicaciones.n })}
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={conMes(DESTINO_PUBLICACIONES, mesEnlace)}>
                      {t("publicaciones.alertLink")} <ArrowRight />
                    </Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            <ColaList items={colasDelDia} limit={8} mes={mesEnlace} />
          </AdminSection>

          <AdminSection
            id="activacion"
            title={t("activacion.title")}
            description={t("activacion.description")}
          >
            <FunnelTable
              rows={funnelSemanal}
              cohorteLabel={t("activacion.cohort")}
              caption={t("activacion.caption")}
            />
            <p className="text-xs text-muted-foreground tabular-nums">
              {t("activacion.ttv")}{" "}
              <strong className="text-foreground">
                {ttv.medianaHoras === null
                  ? guion
                  : tAdmin("units.days", { n: Math.round(ttv.medianaHoras / 24) })}
              </strong>
              {ttv.medianaHorasPrevias !== null && ttv.medianaHoras !== null && (
                <>
                  {" "}
                  ·{" "}
                  {t("activacion.before", {
                    n: Math.round(ttv.medianaHorasPrevias / 24),
                  })}
                </>
              )}
              {" · "}
              {t("activacion.firstFail")}{" "}
              <strong
                className={
                  ttv.falloPrimerProyectoPct !== null && ttv.falloPrimerProyectoPct > 10
                    ? "text-destructive"
                    : "text-foreground"
                }
              >
                {ttv.falloPrimerProyectoPct === null
                  ? guion
                  : f.percent(ttv.falloPrimerProyectoPct, 1)}
              </strong>
            </p>
            {/* El primer clip listo ya no es el final del embudo: el momento de
                valor es el clip publicado. Va debajo del tiempo hasta el primer
                clip porque es la misma cuenta atrás una parada más allá. Y dice
                que es simulado: la agenda vive hoy en el navegador. */}
            <p className="text-xs text-muted-foreground tabular-nums">
              {t("publicaciones.published")}{" "}
              <strong className="text-foreground">
                {publicaciones.clipsPublicadosPct === null
                  ? guion
                  : f.percent(publicaciones.clipsPublicadosPct, 0)}
              </strong>
              {" · "}
              {t("publicaciones.toPublish")}{" "}
              <strong className="text-foreground">
                {publicaciones.medianaHorasAPublicar === null
                  ? guion
                  : t("publicaciones.hours", {
                      n: Math.round(publicaciones.medianaHorasAPublicar * 10) / 10,
                    })}
              </strong>
              {" · "}
              {t("publicaciones.count", { n: publicaciones.publicadas })}
              {" · "}
              <span className="text-muted-foreground/80">
                {t("publicaciones.simulated")}
              </span>
            </p>
          </AdminSection>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("puente.title")}</CardTitle>
                <CardDescription>{t("puente.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <MrrBridgeChart series={series} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("cajaChart.title")}</CardTitle>
                <CardDescription>
                  {t.rich("cajaChart.description", {
                    b: (chunks) => <strong className="text-foreground">{chunks}</strong>,
                    margen:
                      snap.margen.cajaPct === null
                        ? guion
                        : f.percent(snap.margen.cajaPct, 0),
                    porMinuto:
                      costes.porMinuto === null
                        ? guion
                        : f.money(costes.porMinuto, { decimals: 4 }),
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CajaChart series={series} />
              </CardContent>
            </Card>
          </div>

          <AdminSection
            id="pql"
            title={t("pql.title")}
            description={t("pql.description", { n: pql.n, previo: pql.nPrevio })}
            aside={
              <Button variant="ghost" size="sm" asChild>
                <Link href={conMes("/admin/usuarios?segmento=pql", mesEnlace)}>
                  {t("pql.viewAll")} <ArrowRight />
                </Link>
              </Button>
            }
          >
            <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
              <Table>
                <caption className="sr-only">{t("pql.caption")}</caption>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("pql.user")}</TableHead>
                    <TableHead className="text-right">{t("pql.ready30d")}</TableHead>
                    <TableHead className="text-right">{t("pql.min30d")}</TableHead>
                    <TableHead className="text-right max-lg:hidden">
                      {t("pql.ai30d")}
                    </TableHead>
                    <TableHead className="max-md:hidden">
                      {t("pql.lastActivity")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="tabular-nums">
                  {pql.items.map((row) => (
                    <TableRow key={row.userId}>
                      <TableCell className="max-w-56">
                        <Link
                          href={conMes(
                            `/admin/usuarios?q=${encodeURIComponent(row.userName)}`,
                            mesEnlace
                          )}
                          className="flex items-center gap-1.5 truncate font-medium underline-offset-4 hover:text-primary hover:underline"
                        >
                          <CountryFlag code={row.countryCode} decorative={false} />
                          <span className="truncate">{row.userName}</span>
                        </Link>
                        <span className="block truncate text-xs text-muted-foreground">
                          {canal(row.canalResuelto)}
                          {row.fuentePrincipal &&
                            ` · ${tAdmin(`labels.source.${row.fuentePrincipal}`)}`}
                          {` · ${t("pql.tenure", { n: row.diasDesdeAlta })}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {row.proyectosListos30d}
                      </TableCell>
                      <TableCell className="text-right">
                        {Math.round(row.minutos30d)}
                      </TableCell>
                      <TableCell className="text-right max-lg:hidden">
                        {f.money(row.costeIa30d, { decimals: 2 })}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground max-md:hidden">
                        {f.relative(row.lastActiveAt, hoy)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("pql.criteria", {
                coste: f.money(costes.deFree.amount),
                pct: f.percent(costes.deFree.pct, 0),
              })}
            </p>
          </AdminSection>

          {/* Bienvenida: de dónde salen los datos de nicho, país e idioma del mercado.
              Ocupa las dos columnas: es el bloque más largo y, en una sola, dejaba
              vacía toda la celda de la derecha. */}
          <div className="min-w-0 xl:col-span-2">
            <OnboardingPanel locale={locale} resumen={onboarding} />
          </div>
        </div>
      </AdminPage>
    </IntlExtra>
  )
}
