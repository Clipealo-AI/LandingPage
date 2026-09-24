import type { Metadata } from "next"
import { IntlExtra } from "@/i18n/zone"
import { Suspense } from "react"
import { Download } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { getFormat } from "@/lib/format"
import {
  getAdminMonth,
  getAdminMonths,
  getAdminProjects,
  getAdminSeries,
  resolveMonth,
} from "@/lib/api/admin"
import type { ProjectRow } from "@/lib/admin/rows"
import { conMes, mesEnEnlaces } from "@/lib/admin/enlaces"
import { AdminPage, AdminSection } from "@/components/admin/admin-page"
import { CostesAnomalias } from "@/components/admin/costes-anomalias"
import { CostesFuentes } from "@/components/admin/costes-fuentes"
import { CostesModelos } from "@/components/admin/costes-modelos"
import { CostesPipeline } from "@/components/admin/costes-pipeline"
import { CostesPublicaciones } from "@/components/admin/costes-publicaciones"
import {
  CostePorMinutoChart,
  CostesSerieChart,
} from "@/components/admin/graficas-diferidas"
import { CostesTable } from "@/components/admin/costes-table"
import { CostesTopFree } from "@/components/admin/costes-top-free"
import { deltaOf, KpiCard, KpiGrid } from "@/components/admin/kpi-card"
import { MockAction } from "@/components/admin/mock-action"
import { TableSkeleton } from "@/components/admin/table-skeleton"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { idiomaDe } from "@/i18n/server"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/costes">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "admin.costes" })
  return { title: t("title") }
}

/** Mediana; null si no hay datos. */
function mediana(values: number[]) {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/** Sin resolver y anómalos primero; dentro de cada grupo, por coste. */
function prioridad(r: ProjectRow) {
  return r.sinResolver ? 0 : r.anomalia ? 1 : 2
}

/** `deltaOf` redondea la diferencia a céntimos; el coste por minuto se compara en diezmilésimas. */
const DIEZMIL = 10_000

/**
 * Costes de IA: el coste del mes convertido en unidad de precio (US$ por
 * minuto, proyecto y clip), cuánto se gasta en Prueba e Interno frente a
 * clientes, el margen que queda y el dinero quemado en errores. La
 * contabilidad por proveedor y modelo vive aquí, no en el panel.
 */
export default async function AdminCostesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ mes?: string }>
}) {
  const locale = await idiomaDe(params)
  const [t, tAdmin] = await Promise.all([
    getTranslations({ locale, namespace: "admin.costes" }),
    getTranslations({ locale, namespace: "admin" }),
  ])
  const f = getFormat(locale)
  const { mes } = await searchParams
  const month = resolveMonth(mes)
  const [snap, { months, current }, { series }, proyectos] = await Promise.all([
    getAdminMonth(month),
    getAdminMonths(),
    getAdminSeries(6, month),
    getAdminProjects(month),
  ])
  const { costes, uso, margen, publicaciones } = snap
  const { pipeline, deFree, dePago, deInternos } = costes
  // Las caducadas mandan en la única acción naranja de la página: reconectar es
  // lo que desatasca los envíos que esperan
  const cuentasCaducadas =
    publicaciones.cuentas.find((c) => c.estado === "caducada")?.n ?? 0
  const comparable = snap.mtd
    ? tAdmin("compare.sameDays", { dia: snap.mtd.dia })
    : tAdmin("compare.prevMonth")
  const guion = "—"

  /** Importe con signo para un delta: el espacio de «US$ 3,73» no debe partir la línea. */
  const deltaMoney = (decimals: number) => (d: number) =>
    f.money(d, { signed: true, decimals }).replace(" ", String.fromCharCode(160))

  // Tabla: proyectos del mes más lo que sigue roto o atascado, venga del mes que venga
  const filas = proyectos
    .filter(
      (p) => p.createdAt.startsWith(month) || p.sinResolver || p.horasEnCola !== null
    )
    .sort((a, b) => prioridad(a) - prioridad(b) || b.cost - a.cost)

  // Umbrales de la especificación
  const subsidioRojo =
    (deFree.subsidioPctMrr !== null && deFree.subsidioPctMrr > 20) || deInternos.pct > 20
  const toneCoste = subsidioRojo ? "alerta" : deFree.pct > 60 ? "aviso" : "neutral"
  const medianaFuentes = mediana(
    uso.porFuente.map((f) => f.costePorMinuto).filter((v): v is number => v !== null)
  )
  const fuenteCara = uso.porFuente.find(
    (f) =>
      f.costePorMinuto !== null &&
      medianaFuentes !== null &&
      f.costePorMinuto > medianaFuentes * 2
  )
  const margenRojo =
    (margen.recurrentePct !== null && margen.recurrentePct < 80) ||
    (margen.cajaPct !== null && margen.cajaPct < 80)
  const pipelineRojo =
    (pipeline.err24h.pct !== null && pipeline.err24h.pct > 5) ||
    pipeline.err24h.n >= 3 ||
    (pipeline.costeEnErrores7d.pct !== null && pipeline.costeEnErrores7d.pct > 5)
  const pipelineAmbar = pipeline.atascados > 0 || pipeline.sinResolver > 0

  const mesEnlace = mesEnEnlaces(month, current)

  return (
    <IntlExtra ns={["admin.costes"]}>
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
            label={snap.mtd ? t("kpis.costLabelMtd") : t("kpis.costLabelMonth")}
            value={f.money(costes.total, { decimals: 2 })}
            tone={toneCoste}
            sparkline={series.map((p) => p.costes)}
            delta={deltaOf(costes.total, costes.previo, deltaMoney(2), comparable, {
              invert: true,
            })}
            lines={[
              t("kpis.split", {
                prueba: f.percent(deFree.pct, 0),
                pago: f.percent(dePago.pct, 0),
                interno: f.percent(deInternos.pct, 0),
              }),
              [
                [
                  t("kpis.trial", { monto: f.money(deFree.amount, { decimals: 2 }) }),
                  deFree.subsidioPctMrr !== null &&
                    t("kpis.trialMrr", { pct: f.percent(deFree.subsidioPctMrr, 1) }),
                ]
                  .filter(Boolean)
                  .join(" "),
                deFree.porActivo !== null &&
                  t("kpis.trialPerActive", {
                    monto: f.money(deFree.porActivo, { decimals: 3 }),
                  }),
              ]
                .filter(Boolean)
                .join(" · "),
            ]}
            footnote={t("kpis.costFootnote", {
              acumulado: f.money(costes.acumulado, { decimals: 2 }),
            })}
            href="#top-free"
          />
          <KpiCard
            label={t("kpis.perMinute")}
            value={
              costes.porMinuto === null
                ? guion
                : f.money(costes.porMinuto, { decimals: 4 })
            }
            tone={fuenteCara ? "aviso" : "neutral"}
            delta={
              costes.porMinuto !== null && costes.porMinutoPrevio !== null
                ? deltaOf(
                    costes.porMinuto * DIEZMIL,
                    costes.porMinutoPrevio * DIEZMIL,
                    (d) => deltaMoney(4)(d / DIEZMIL),
                    comparable,
                    { invert: true }
                  )
                : undefined
            }
            lines={[
              t("kpis.perProject", {
                proyecto:
                  costes.porProyecto === null
                    ? guion
                    : f.money(costes.porProyecto, { decimals: 3 }),
                clip:
                  costes.porClip === null
                    ? guion
                    : f.money(costes.porClip, { decimals: 4 }),
              }),
              [
                t("kpis.volume", {
                  minutos: f.number(Math.round(uso.minutos)),
                  proyectos: f.number(uso.proyectos),
                  clips: f.number(uso.clips),
                }),
                costes.porUsuarioActivo !== null &&
                  t("kpis.perActiveUser", {
                    monto: f.money(costes.porUsuarioActivo, { decimals: 3 }),
                  }),
              ]
                .filter(Boolean)
                .join(" · "),
            ]}
            footnote={
              fuenteCara
                ? t("kpis.perMinuteWarning", {
                    monto:
                      fuenteCara.costePorMinuto === null
                        ? ""
                        : f.money(fuenteCara.costePorMinuto, { decimals: 4 }),
                  })
                : t("kpis.perMinuteFootnote")
            }
            href="#fuentes"
          />
          <KpiCard
            label={t("kpis.margin")}
            value={
              margen.recurrentePct === null ? guion : f.percent(margen.recurrentePct, 0)
            }
            tone={margenRojo ? "alerta" : "neutral"}
            delta={deltaOf(margen.bruto, margen.brutoPrevio, deltaMoney(2), comparable)}
            lines={[
              t("kpis.marginVersions", {
                caja: margen.cajaPct === null ? guion : f.percent(margen.cajaPct, 0),
                historico:
                  margen.historicoPct === null
                    ? guion
                    : f.percent(margen.historicoPct, 0),
              }),
              t("kpis.marginGross", {
                bruto: f.money(margen.bruto),
                ingresos: f.money(margen.ingresos),
                ia: f.money(dePago.amount, { decimals: 2 }),
              }),
            ]}
            footnote={t("kpis.marginFootnote")}
            href={conMes("/admin/planes", mesEnlace)}
          />
          <KpiCard
            label={t("kpis.errors")}
            value={pipeline.err7d.pct === null ? guion : f.percent(pipeline.err7d.pct, 1)}
            tone={pipelineRojo ? "alerta" : pipelineAmbar ? "aviso" : "neutral"}
            lines={[
              pipeline.err24h.pct !== null
                ? t("kpis.errorsCountPct", {
                    n: pipeline.err7d.n,
                    total: pipeline.err7d.total,
                    n24: pipeline.err24h.n,
                    total24: pipeline.err24h.total,
                    pct: f.percent(pipeline.err24h.pct, 0),
                  })
                : t("kpis.errorsCount", {
                    n: pipeline.err7d.n,
                    total: pipeline.err7d.total,
                    n24: pipeline.err24h.n,
                    total24: pipeline.err24h.total,
                  }),
              t("kpis.errorsUnresolved", {
                sinResolver: pipeline.sinResolver,
                dePago: pipeline.sinResolverDePago,
                atascados: pipeline.atascados,
              }),
            ]}
            footnote={
              pipeline.costeEnErrores7d.pct !== null
                ? t("kpis.errorsFootnotePct", {
                    monto: f.money(pipeline.costeEnErrores7d.monto, { decimals: 2 }),
                    pct: f.percent(pipeline.costeEnErrores7d.pct, 1),
                  })
                : t("kpis.errorsFootnote", {
                    monto: f.money(pipeline.costeEnErrores7d.monto, { decimals: 2 }),
                  })
            }
            href="#pipeline"
          />
        </KpiGrid>

        <AdminSection
          id="proyectos"
          title={t("proyectos.title")}
          description={t("proyectos.description")}
          aside={
            <MockAction
              size="sm"
              variant="outline"
              efecto={t("proyectos.exportEffect", { mes: month })}
            >
              <Download /> {t("proyectos.export")}
            </MockAction>
          }
        >
          <Suspense fallback={<TableSkeleton />}>
            <CostesTable rows={filas} mes={mesEnlace} />
          </Suspense>
        </AdminSection>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <AdminSection
            id="pipeline"
            title={t("pipeline.title")}
            description={t("pipeline.description")}
            aside={
              <>
                <MockAction
                  size="sm"
                  variant="ghost"
                  efecto={t("pipeline.cancelStuckEffect", { n: pipeline.atascados })}
                  disabled={pipeline.atascados === 0}
                >
                  {t("pipeline.cancelStuck")}
                </MockAction>
                <MockAction
                  size="sm"
                  variant="outline"
                  efecto={t("pipeline.reprocessEffect", {
                    n: pipeline.sinResolver,
                    monto: f.money(pipeline.costeEnErrores7d.monto, { decimals: 2 }),
                  })}
                  disabled={pipeline.sinResolver === 0}
                >
                  {t("pipeline.reprocess")}
                </MockAction>
              </>
            }
          >
            <CostesPipeline pipeline={pipeline} />
          </AdminSection>

          <AdminSection
            id="anomalias"
            title={t("anomalias.title")}
            description={t("anomalias.description")}
          >
            <CostesAnomalias items={costes.anomalias} mes={mesEnlace} />
          </AdminSection>
        </div>

        {/* Detrás del pipeline a propósito: es el mismo trabajo una milla más
            allá. Arriba, por qué un clip no se fabricó; aquí, por qué no salió. */}
        <AdminSection
          id="publicaciones"
          title={t("publicaciones.title")}
          description={t("publicaciones.description")}
          aside={
            <MockAction
              size="sm"
              variant="brand"
              efecto={t("publicaciones.reconnectEffect", { n: cuentasCaducadas })}
              disabled={cuentasCaducadas === 0}
            >
              {t("publicaciones.reconnect", { n: cuentasCaducadas })}
            </MockAction>
          }
        >
          <CostesPublicaciones publicaciones={publicaciones} comparable={comparable} />
        </AdminSection>

        <AdminSection
          id="fuentes"
          title={t("fuentes.title")}
          description={t("fuentes.description")}
        >
          <CostesFuentes fuentes={uso.porFuente} />
        </AdminSection>

        <div className="grid gap-6 xl:grid-cols-2">
          <AdminSection
            id="modelos"
            title={t("modelos.title")}
            description={t("modelos.description")}
            aside={
              <MockAction size="sm" variant="ghost" efecto={t("modelos.restrictEffect")}>
                {t("modelos.restrict")}
              </MockAction>
            }
          >
            <CostesModelos costes={costes} />
          </AdminSection>

          <AdminSection
            id="top-free"
            title={t("topFree.title")}
            description={t("topFree.description")}
            aside={
              <MockAction size="sm" variant="outline" efecto={t("topFree.capEffect")}>
                {t("topFree.cap")}
              </MockAction>
            }
          >
            <CostesTopFree items={costes.topFree} deFree={deFree} mes={mesEnlace} />
          </AdminSection>
        </div>

        <AdminSection
          id="serie"
          title={t("serie.title")}
          description={t("serie.description")}
        >
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("serie.chartTitle")}</CardTitle>
                <CardDescription>
                  {deFree.subsidioPctMrr !== null
                    ? t("serie.chartDescriptionMrr", {
                        pct: f.percent(deFree.pct, 0),
                        mrr: f.percent(deFree.subsidioPctMrr, 1),
                      })
                    : t("serie.chartDescription", { pct: f.percent(deFree.pct, 0) })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CostesSerieChart series={series} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("serie.perMinuteTitle")}</CardTitle>
                <CardDescription>{t("serie.perMinuteDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <CostePorMinutoChart series={series} />
              </CardContent>
            </Card>
          </div>
        </AdminSection>
      </AdminPage>
    </IntlExtra>
  )
}
