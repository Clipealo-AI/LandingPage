"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { useTranslations } from "next-intl"

import type { SeriesPoint } from "@/lib/admin/metrics"
import { useFormat } from "@/hooks/use-format"
import { SerieChart } from "@/components/admin/mrr-chart"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

/** US$ por minuto procesado por mes. Envuelve `SerieChart` porque el formato es una función y no puede cruzar la frontera de servidor. */
export function CostePorMinutoChart({ series }: { series: SeriesPoint[] }) {
  const t = useTranslations("admin.costes.serie.chart")
  const f = useFormat()
  const data = series.map((p) => ({
    label: f.monthShort(p.month),
    costePorMinuto: p.costePorMinuto,
    enCurso: p.enCurso,
  }))
  return (
    <SerieChart
      data={data}
      dataKey="costePorMinuto"
      label={t("perMinute")}
      format={(v) => f.money(v, { decimals: 4 })}
      color="var(--chart-1)"
    />
  )
}

/**
 * Coste de IA total y coste de servir a Prueba por mes. Dos líneas en el mismo
 * eje: la distancia entre ellas es lo que cuesta atender a clientes y equipo;
 * si la de Prueba se acerca a la total, el subsidio se come el margen.
 */
export function CostesSerieChart({ series }: { series: SeriesPoint[] }) {
  const t = useTranslations("admin.costes.serie.chart")
  const tCharts = useTranslations("admin.charts")
  const f = useFormat()
  const config = React.useMemo(
    () =>
      ({
        costes: { label: t("costes"), color: "var(--chart-1)" },
        costeFree: { label: t("costeFree"), color: "var(--chart-4)" },
      }) satisfies ChartConfig,
    [t]
  )
  const data = series.map((p) => ({
    label: f.monthShort(p.month),
    costes: p.costes,
    costeFree: p.costeFree,
    enCurso: p.enCurso,
    pctFree: p.costes > 0 ? (p.costeFree / p.costes) * 100 : null,
  }))

  return (
    <figure className="space-y-3">
      <ChartContainer config={config} className="h-48 w-full">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-xs capitalize"
            stroke="var(--muted-foreground)"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(v: number) => f.money(v)}
            className="text-xs"
            stroke="var(--muted-foreground)"
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => {
                  const p = payload?.[0]?.payload as (typeof data)[number] | undefined
                  if (!p) return ""
                  const mes = p.enCurso ? tCharts("toDate", { mes: p.label }) : p.label
                  return p.pctFree !== null
                    ? t("tooltipShare", { mes, pct: f.percent(p.pctFree, 0) })
                    : mes
                }}
                formatter={(value, name) => (
                  <span className="flex w-full items-baseline justify-between gap-3">
                    <span>{config[name as keyof typeof config]?.label ?? name}</span>
                    <span className="tabular-nums">
                      {f.money(Number(value), { decimals: 2 })}
                    </span>
                  </span>
                )}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            type="monotone"
            dataKey="costes"
            stroke="var(--color-costes)"
            strokeWidth={2}
            dot={{ r: 2.5 }}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="costeFree"
            stroke="var(--color-costeFree)"
            strokeWidth={2}
            dot={{ r: 2.5 }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ChartContainer>

      <details className="text-sm">
        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
          {tCharts("viewTable")}
        </summary>
        <table className="mt-2 w-full text-xs tabular-nums">
          <caption className="sr-only">{t("caption")}</caption>
          <thead>
            <tr className="text-left text-muted-foreground">
              <th scope="col" className="py-1 font-medium">
                {tCharts("month")}
              </th>
              <th scope="col" className="py-1 text-right font-medium">
                {t("costes")}
              </th>
              <th scope="col" className="py-1 text-right font-medium">
                {t("costeFree")}
              </th>
              <th scope="col" className="py-1 text-right font-medium">
                {t("trialShare")}
              </th>
              <th scope="col" className="py-1 text-right font-medium">
                {t("perMinute")}
              </th>
            </tr>
          </thead>
          <tbody>
            {series.map((p, i) => (
              <tr key={p.month} className="border-t">
                <th scope="row" className="py-1 text-left font-normal capitalize">
                  {p.enCurso
                    ? tCharts("toDateRow", { mes: data[i].label })
                    : data[i].label}
                </th>
                <td className="py-1 text-right font-medium">
                  {f.money(p.costes, { decimals: 2 })}
                </td>
                <td className="py-1 text-right">
                  {f.money(p.costeFree, { decimals: 2 })}
                </td>
                <td className="py-1 text-right">
                  {data[i].pctFree === null ? "—" : f.percent(data[i].pctFree, 0)}
                </td>
                <td className="py-1 text-right">
                  {p.costePorMinuto === null
                    ? "—"
                    : f.money(p.costePorMinuto, { decimals: 4 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
