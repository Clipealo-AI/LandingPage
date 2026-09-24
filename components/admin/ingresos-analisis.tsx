import type { ReactNode } from "react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import type { CobrosBlock, LtvBlock, MrrBlock, SeriesPoint } from "@/lib/admin/metrics"
import { conMes } from "@/lib/admin/enlaces"
import { useFormat } from "@/hooks/use-format"
import { CajaChart, MrrBridgeChart } from "@/components/admin/graficas-diferidas"
import { PlanBadge } from "@/components/admin/plan-badge"
import { SemaforoDot } from "@/components/admin/semaforo"
import { usePlanName } from "@/components/admin/textos"
import { Badge } from "@/components/ui/badge"
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/** Tres planes de pago: un solo azul con tres intensidades basta para la mezcla. */
const MEZCLA = ["bg-primary", "bg-primary/60", "bg-primary/30"] as const

export interface IngresosAnalisisProps {
  mrr: MrrBlock
  ltv: LtvBlock
  cobros: CobrosBlock
  series: SeriesPoint[]
  clientesN: number
  margenCajaPct: number | null
  /** El mes elegido en el backoffice, para que los enlaces no lo pierdan. */
  mes?: string | null
}

/**
 * Pestañas de análisis de /admin/ingresos: el puente de MRR con la caja,
 * la mezcla por plan, la segunda cobranza y el cobro por método y tipo.
 * Todo llega calculado del servidor; aquí solo se ordena en pestañas.
 */
export function IngresosAnalisis({
  mrr,
  ltv,
  cobros,
  series,
  clientesN,
  margenCajaPct,
  mes,
}: IngresosAnalisisProps) {
  const t = useTranslations("admin.ingresos.analisis")
  // Solo las ramas que toca: pedir `admin` entero obliga a mandar sus 90 KB
  const tLabels = useTranslations("admin.labels")
  const tPanel = useTranslations("admin.panel")
  const f = useFormat()
  const planName = usePlanName()
  const guion = "—"

  /** Aprobados ÷ (aprobados + rechazados); «—» si no hubo intentos. */
  const cobroEfectivo = (ok: number, ko: number) =>
    ok + ko > 0 ? f.percent((ok / (ok + ko)) * 100, 0) : guion
  const strong = (chunks: ReactNode) => (
    <strong className="text-foreground tabular-nums">{chunks}</strong>
  )

  const ultimos = series.slice(-2)
  const netoNegativoDosMeses = ultimos.length === 2 && ultimos.every((p) => p.neto < 0)
  const sinNuevo = mrr.nuevo === 0
  const puenteSemaforo = netoNegativoDosMeses ? "rojo" : sinNuevo ? "ambar" : "verde"
  const puenteMotivo = netoNegativoDosMeses
    ? t("bridge.negativeTwice")
    : sinNuevo
      ? t("bridge.noNew")
      : t("bridge.positive")

  const totalClientesPlan = mrr.porPlan.reduce((n, p) => n + p.clientes, 0)
  const segunda = ltv.segundaCobranza
  const segundaSemaforo =
    segunda.pct === null ? "ambar" : segunda.pct < 50 ? "rojo" : "verde"

  return (
    <Tabs defaultValue="puente" className="gap-4">
      <div className="overflow-x-auto">
        <TabsList aria-label={t("tabs.label")}>
          <TabsTrigger value="puente" className="px-3">
            {t("tabs.puente")}
          </TabsTrigger>
          <TabsTrigger value="planes" className="px-3">
            {t("tabs.planes")}
          </TabsTrigger>
          <TabsTrigger value="segunda" className="px-3">
            {t("tabs.segunda")}
          </TabsTrigger>
          <TabsTrigger value="cobros" className="px-3">
            {t("tabs.cobros")}
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="puente">
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{tPanel("puente.title")}</CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <SemaforoDot
                  value={puenteSemaforo}
                  label={puenteMotivo}
                  className="text-foreground"
                />
                <span aria-hidden>·</span>
                <span className="tabular-nums">
                  {t("bridge.net", {
                    neto: f.money(mrr.neto, { signed: true }),
                    media: f.money(mrr.netoMedia3m, { signed: true }),
                  })}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MrrBridgeChart series={series} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{tPanel("cajaChart.title")}</CardTitle>
              <CardDescription>
                {t.rich("cash.description", {
                  b: strong,
                  margen: margenCajaPct === null ? guion : f.percent(margenCajaPct, 0),
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CajaChart series={series} />
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="planes">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
            <Table>
              <caption className="sr-only">{t("plans.caption")}</caption>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("plans.plan")}</TableHead>
                  <TableHead className="text-right">{t("plans.customers")}</TableHead>
                  <TableHead className="text-right max-md:hidden">
                    {t("plans.customersPct")}
                  </TableHead>
                  <TableHead className="text-right">{t("plans.mrr")}</TableHead>
                  <TableHead className="text-right">{t("plans.mrrPct")}</TableHead>
                  <TableHead className="text-right">{t("plans.arppu")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="tabular-nums">
                {mrr.porPlan.map((p, i) => (
                  <TableRow key={p.plan}>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <span
                          className={`size-2 shrink-0 rounded-full ${MEZCLA[i % MEZCLA.length]}`}
                          aria-hidden
                        />
                        <PlanBadge plan={p.plan} />
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{p.clientes}</TableCell>
                    <TableCell className="text-right max-md:hidden">
                      {totalClientesPlan > 0
                        ? f.percent((p.clientes / totalClientesPlan) * 100, 0)
                        : guion}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {f.money(p.mrr)}
                    </TableCell>
                    <TableCell className="text-right">{f.percent(p.pct, 0)}</TableCell>
                    <TableCell className="text-right">{f.money(p.arppu)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter className="tabular-nums">
                <TableRow>
                  <TableCell>{t("plans.total")}</TableCell>
                  <TableCell className="text-right">{totalClientesPlan}</TableCell>
                  <TableCell className="text-right max-md:hidden">
                    {f.percent(100, 0)}
                  </TableCell>
                  <TableCell className="text-right">{f.money(mrr.total)}</TableCell>
                  <TableCell className="text-right">{f.percent(100, 0)}</TableCell>
                  <TableCell className="text-right">{f.money(ltv.arppu)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          <div className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-border">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {t("plans.arppu")}
                </p>
                <p className="text-2xl font-bold tracking-tight tabular-nums">
                  {f.money(ltv.arppu)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("plans.arppuHint", { n: clientesN })}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {t("plans.arpu")}
                </p>
                <p className="text-2xl font-bold tracking-tight tabular-nums">
                  {ltv.arpu === null ? guion : f.money(ltv.arpu, { decimals: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">{t("plans.arpuHint")}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                {t("plans.mix")}
              </p>
              <div
                className="flex h-2 overflow-hidden rounded-full bg-muted"
                role="img"
                aria-label={mrr.porPlan
                  .map((p) => `${planName(p.plan)} ${f.percent(p.pct, 0)}`)
                  .join(", ")}
              >
                {mrr.porPlan.map((p, i) => (
                  <span
                    key={p.plan}
                    className={MEZCLA[i % MEZCLA.length]}
                    style={{ width: `${p.pct}%` }}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground tabular-nums">
                {mrr.porPlan
                  .map((p) =>
                    t("plans.mixItem", {
                      pct: f.percent(p.pct, 0),
                      plan: planName(p.plan),
                    })
                  )
                  .join(" · ")}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {t.rich("plans.list", {
                n: clientesN,
                link: (chunks) => (
                  <Link
                    href={conMes("/admin/planes", mes)}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="segunda">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-border">
            <p className="text-xs font-medium text-muted-foreground">
              {t("second.title")}
            </p>
            <p className="text-3xl font-bold tracking-tight tabular-nums">
              {segunda.pct === null ? guion : f.percent(segunda.pct, 0)}
            </p>
            <p className="text-sm tabular-nums">
              {t.rich("second.summary", {
                b: (chunks) => <strong>{chunks}</strong>,
                con: segunda.conSegunda,
                elegibles: segunda.elegibles,
              })}
            </p>
            <SemaforoDot
              value={segundaSemaforo}
              label={
                segunda.pct === null
                  ? t("second.noEligible")
                  : segunda.pct < 50
                    ? t("second.oneOff")
                    : t("second.repeats")
              }
              className="text-foreground"
            />
            <p className="text-xs leading-snug text-muted-foreground">
              {t("second.note")}
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
            <Table>
              <caption className="sr-only">{t("second.caption")}</caption>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("second.user")}</TableHead>
                  <TableHead className="max-sm:hidden">
                    {t("second.currentPlan")}
                  </TableHead>
                  <TableHead className="text-right">{t("second.approved")}</TableHead>
                  <TableHead className="text-right">{t("second.second")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="tabular-nums">
                {segunda.nominal.map((u) => (
                  <TableRow key={u.userId}>
                    <TableCell className="max-w-56">
                      <Link
                        href={conMes(
                          `/admin/usuarios?q=${encodeURIComponent(u.userName)}`,
                          mes
                        )}
                        className="block truncate font-medium underline-offset-4 hover:text-primary hover:underline"
                      >
                        {u.userName}
                      </Link>
                    </TableCell>
                    <TableCell className="max-sm:hidden">
                      <PlanBadge plan={u.plan} />
                    </TableCell>
                    <TableCell className="text-right">{u.pagos}</TableCell>
                    <TableCell className="text-right">
                      {u.pagos >= 2 ? (
                        <Badge variant="success">{t("second.repeat")}</Badge>
                      ) : (
                        <Badge variant="outline">{t("second.single")}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="cobros">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">{t("charges.byMethod")}</h3>
            <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
              <Table>
                <caption className="sr-only">{t("charges.byMethodCaption")}</caption>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("charges.method")}</TableHead>
                    <TableHead className="text-right">{t("charges.approved")}</TableHead>
                    <TableHead className="text-right">{t("charges.amount")}</TableHead>
                    <TableHead className="text-right">{t("charges.declined")}</TableHead>
                    <TableHead className="text-right">{t("charges.rate")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="tabular-nums">
                  {cobros.porMetodo.map((m) => (
                    <TableRow key={m.method}>
                      <TableCell className="font-medium">
                        {tLabels(`paymentMethod.${m.method}`)}
                      </TableCell>
                      <TableCell className="text-right">{f.number(m.n)}</TableCell>
                      <TableCell className="text-right">{f.money(m.amount)}</TableCell>
                      <TableCell
                        className={
                          m.rechazados > 0 ? "text-right text-destructive" : "text-right"
                        }
                      >
                        {f.number(m.rechazados)}
                      </TableCell>
                      <TableCell className="text-right">
                        {cobroEfectivo(m.n, m.rechazados)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">{t("charges.byKind")}</h3>
            <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
              <Table>
                <caption className="sr-only">{t("charges.byKindCaption")}</caption>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("charges.kind")}</TableHead>
                    <TableHead className="text-right">{t("charges.approved")}</TableHead>
                    <TableHead className="text-right">{t("charges.amount")}</TableHead>
                    <TableHead className="text-right">{t("charges.declined")}</TableHead>
                    <TableHead className="text-right">{t("charges.rate")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="tabular-nums">
                  {cobros.porTipo.map((tipo) => (
                    <TableRow key={tipo.kind}>
                      <TableCell className="font-medium">
                        {tLabels(`paymentKind.${tipo.kind}`)}
                      </TableCell>
                      <TableCell className="text-right">
                        {f.number(tipo.aprobados)}
                      </TableCell>
                      <TableCell className="text-right">{f.money(tipo.monto)}</TableCell>
                      <TableCell
                        className={
                          tipo.rechazados > 0
                            ? "text-right text-destructive"
                            : "text-right"
                        }
                      >
                        {f.number(tipo.rechazados)}
                      </TableCell>
                      <TableCell className="text-right">
                        {cobroEfectivo(tipo.aprobados, tipo.rechazados)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground tabular-nums">
          {t.rich("charges.footer", {
            b: (chunks) => <strong className="text-foreground">{chunks}</strong>,
            mes:
              cobros.cobroEfectivoPct === null
                ? guion
                : f.percent(cobros.cobroEfectivoPct, 0),
            renovaciones:
              cobros.cobroEfectivoRenovaciones3mPct === null
                ? guion
                : f.percent(cobros.cobroEfectivoRenovaciones3mPct, 0),
          })}
        </p>
      </TabsContent>
    </Tabs>
  )
}
