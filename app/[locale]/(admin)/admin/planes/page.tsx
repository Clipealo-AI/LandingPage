import type { Metadata } from "next"
import { IntlExtra } from "@/i18n/zone"
import { ArrowRight } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import { getFormat } from "@/lib/format"
import {
  getAdminCuentasPorPlan,
  getAdminMonth,
  getAdminMonths,
  getAdminSubscriptions,
  resolveMonth,
} from "@/lib/api/admin"
import { GRACIA_DIAS } from "@/lib/admin/metrics"
import type { PlanId } from "@/lib/admin/types"
import { conMes, mesEnEnlaces } from "@/lib/admin/enlaces"
import { AdminPage, AdminSection } from "@/components/admin/admin-page"
import { CatalogoPlanes } from "@/components/admin/catalogo-planes"
import { deltaOf, KpiCard, KpiGrid } from "@/components/admin/kpi-card"
import { MockAction } from "@/components/admin/mock-action"
import { PlanesMezcla } from "@/components/admin/planes-mezcla"
import {
  esClienteDePago,
  PlanesSuscripciones,
} from "@/components/admin/planes-suscripciones"
import { esDePago, PlanesTable } from "@/components/admin/planes-table"
import { Button } from "@/components/ui/button"
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
}: PageProps<"/[locale]/admin/planes">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "admin.planes" })
  return { title: t("title") }
}

const signo = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n)}`

/**
 * Planes: qué plan concentra el ingreso, cuánto cuesta servirlo y si cada
 * suscriptor se paga a sí mismo. Aquí vive la tabla de precios y, al pie, la
 * lista nominal que hay detrás de cada cifra: con siete clientes, el ARPPU se
 * mueve con un solo nombre.
 *
 * Y el catálogo, editable: los tres de la web y los que se creen aquí
 * (`lib/planes.ts`). Las cifras del negocio son de la simulación y solo
 * conocen los tres de la web; el catálogo lo dice al pie.
 */
export default async function AdminPlanesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ mes?: string }>
}) {
  const locale = await idiomaDe(params)
  const [t, tAdmin, tPricing] = await Promise.all([
    getTranslations({ locale, namespace: "admin.planes" }),
    getTranslations({ locale, namespace: "admin" }),
    getTranslations({ locale, namespace: "pricing.plans" }),
  ])
  const f = getFormat(locale)
  const planName = (plan: PlanId) =>
    plan === "interno" ? tAdmin("plans.interno.name") : tPricing(`${plan}.name`)
  const guion = "—"
  const { mes } = await searchParams
  const month = resolveMonth(mes)
  const [snap, { months, current }, suscripciones, cuentas] = await Promise.all([
    getAdminMonth(month),
    getAdminMonths(),
    getAdminSubscriptions(month),
    getAdminCuentasPorPlan(month),
  ])
  const { planes, mrr, ltv, clientes, usuarios } = snap
  const hoy = new Date(snap.updatedAt)

  // Planes que venden, del más caro al más barato para las líneas de mezcla.
  const pago = planes.filter(esDePago).sort((a, b) => b.priceMonthly - a.priceMonthly)
  const masBarato = pago.at(-1)
  const free = planes.find((p) => p.plan === "free")
  const interno = planes.find((p) => p.plan === "interno")

  const mrrPago = pago.reduce((n, p) => n + p.mrr, 0)
  const contribucion = pago.reduce((n, p) => n + p.contribucion, 0)
  const costePago = pago.reduce((n, p) => n + p.costeIa, 0)
  const contribucionPct = mrrPago > 0 ? (contribucion / mrrPago) * 100 : null
  const conMargenBajo = pago.reduce((n, p) => n + p.conMargenBajo, 0)

  const nuevos90 = pago.reduce((n, p) => n + p.nuevos90d, 0)
  const bajas90 = pago.reduce((n, p) => n + p.bajas90d, 0)
  const netos90 = nuevos90 - bajas90

  // ARPPU al cierre anterior: MRR al cierre ÷ clientes al cierre (mismos bloques que el panel).
  const arppuPrevio = clientes.nInicio > 0 ? mrr.previous / clientes.nInicio : null
  // Ámbar si todas las altas de pago de 90 d entran por el plan más barato.
  const todoPorElBarato =
    nuevos90 > 0 && masBarato !== undefined && masBarato.nuevos90d === nuevos90

  // Conciliación de la lista nominal con la definición de cliente de pago.
  const activas = suscripciones.filter((s) => s.activa)
  const enGracia = activas.filter((s) => s.status !== "activa").length
  const cortesia = activas.filter((s) => s.plan === "interno").length
  const importeCero = activas.filter((s) => s.plan !== "interno" && s.amount <= 0).length
  const clientesDePago = suscripciones.filter(esClienteDePago).length

  const mesEnlace = mesEnEnlaces(month, current)

  return (
    <IntlExtra ns={["admin.planes"]}>
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
            label={t("kpis.mrr")}
            value={f.money(mrr.total)}
            delta={deltaOf(
              mrr.total,
              mrr.previous,
              (d) => f.money(d, { signed: true }),
              tAdmin("compare.prevClose")
            )}
            lines={pago.map((p) =>
              t("kpis.mrrLine", {
                plan: planName(p.plan),
                clientes: f.percent(p.pctClientes, 0),
                mrr: f.percent(p.pctMrr, 0),
              })
            )}
            footnote={t("kpis.mrrFootnote")}
            href="#mezcla"
          />
          <KpiCard
            label={t("kpis.arppu")}
            value={f.money(ltv.arppu)}
            tone={todoPorElBarato ? "aviso" : "neutral"}
            delta={
              arppuPrevio === null
                ? undefined
                : deltaOf(
                    ltv.arppu,
                    arppuPrevio,
                    (d) => f.money(d, { signed: true }),
                    tAdmin("compare.prevClose")
                  )
            }
            lines={[
              pago
                .map((p) =>
                  t("kpis.arppuPlan", {
                    plan: planName(p.plan),
                    monto: p.arppu === null ? guion : f.money(p.arppu),
                  })
                )
                .join(" · "),
              t("kpis.arpu", {
                monto: ltv.arpu === null ? guion : f.money(ltv.arpu),
                n: clientes.n,
              }),
            ]}
            footnote={
              todoPorElBarato && masBarato
                ? t("kpis.arppuWarning", { n: nuevos90, plan: planName(masBarato.plan) })
                : t("kpis.arppuFootnote")
            }
            href="#suscripciones"
          />
          <KpiCard
            label={t("kpis.contribution")}
            value={f.money(contribucion)}
            tone={
              contribucionPct !== null && contribucionPct < 80
                ? "alerta"
                : conMargenBajo > 0
                  ? "aviso"
                  : "neutral"
            }
            lines={[
              t("kpis.contributionShare", {
                pct: contribucionPct === null ? guion : f.percent(contribucionPct, 0),
                monto: f.money(costePago, { decimals: 2 }),
              }),
              t("kpis.contributionCosts", {
                prueba: f.money(free?.costeIa ?? 0, { decimals: 2 }),
                interno: f.money(interno?.costeIa ?? 0, { decimals: 2 }),
                n: conMargenBajo,
              }),
            ]}
            footnote={t("kpis.contributionFootnote")}
            href={conMes("/admin/costes", mesEnlace)}
          />
          <KpiCard
            label={t("kpis.flow")}
            value={signo(netos90)}
            tone={bajas90 >= nuevos90 && bajas90 > 0 ? "alerta" : "neutral"}
            lines={[
              t("kpis.flowCount", { n: nuevos90, bajas: bajas90 }),
              t("kpis.flowBridge", {
                expansion: f.money(mrr.expansion, { signed: true }),
                contraccion: f.money(-mrr.contraccion),
              }),
            ]}
            footnote={t("kpis.flowFootnote", {
              pct:
                clientes.churn.pct3m === null
                  ? guion
                  : f.percent(clientes.churn.pct3m, 1),
            })}
            href={conMes("/admin/vencimientos", mesEnlace)}
          />
        </KpiGrid>

        <CatalogoPlanes cuentas={cuentas} />

        <AdminSection
          id="planes"
          title={t("rows.title")}
          description={t("rows.description")}
          aside={
            <MockAction size="sm" variant="outline" efecto={t("rows.simulateEffect")}>
              {t("rows.simulate")}
            </MockAction>
          }
        >
          <PlanesTable
            planes={planes}
            churn3mPct={clientes.churn.pct3m}
            mes={mesEnlace}
          />
          <p className="text-xs text-muted-foreground">{t("rows.note")}</p>
        </AdminSection>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Card id="mezcla">
            <CardHeader>
              <CardTitle className="text-base">{t("mix.title")}</CardTitle>
              <CardDescription>{t("mix.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <PlanesMezcla planes={planes} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("definition.title")}</CardTitle>
              <CardDescription>
                {t("definition.description", { dias: GRACIA_DIAS })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 text-sm tabular-nums">
                <dt className="text-muted-foreground">{t("definition.registered")}</dt>
                <dd className="text-right">{suscripciones.length}</dd>
                <dt className="text-muted-foreground">{t("definition.activeOrGrace")}</dt>
                <dd className="text-right">
                  {activas.length}
                  {enGracia > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {" "}
                      {t("definition.inGrace", { n: enGracia })}
                    </span>
                  )}
                </dd>
                <dt className="text-muted-foreground">{t("definition.courtesy")}</dt>
                <dd className="text-right">{cortesia}</dd>
                <dt className="text-muted-foreground">{t("definition.zeroAmount")}</dt>
                <dd className="text-right">{importeCero}</dd>
                <dt className="border-t pt-1 font-semibold">{t("definition.paying")}</dt>
                <dd className="border-t pt-1 text-right font-semibold">
                  {clientes.n}
                  {clientesDePago !== clientes.n && (
                    <span className="text-xs font-normal text-muted-foreground">
                      {" "}
                      {t("definition.subscriptions", { n: clientesDePago })}
                    </span>
                  )}
                </dd>
              </dl>
              <p className="text-xs text-muted-foreground">
                {usuarios.incoherencias === 0
                  ? t("definition.labelNoteNone")
                  : t("definition.labelNote", { n: usuarios.incoherencias })}
              </p>
              <Button variant="ghost" size="sm" asChild>
                <Link href={conMes("/admin/usuarios?segmento=incoherencia", mesEnlace)}>
                  {t("definition.viewMismatches")} <ArrowRight />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <AdminSection
          id="suscripciones"
          title={t("subscriptions.title")}
          description={t("subscriptions.description", { n: suscripciones.length })}
        >
          <PlanesSuscripciones rows={suscripciones} hoy={hoy} mes={mesEnlace} />
        </AdminSection>
      </AdminPage>
    </IntlExtra>
  )
}
