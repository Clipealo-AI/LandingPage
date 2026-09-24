"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"
import { useTranslations } from "next-intl"

import type { SeriesPoint } from "@/lib/admin/metrics"
import { useFormat } from "@/hooks/use-format"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

/**
 * Puente de MRR por mes: lo que entra (nuevo, expansión, reactivación) hacia
 * arriba y lo que sale (contracción, baja) hacia abajo, con el MRR de cierre
 * como línea. El mes en curso va con menos opacidad: es «hasta hoy».
 */
const PUENTE = ["nuevo", "expansion", "reactivacion", "contraccion", "baja"] as const
const COLOR_PUENTE: Record<(typeof PUENTE)[number], string> = {
  nuevo: "var(--chart-2)",
  expansion: "var(--chart-5)",
  reactivacion: "var(--chart-4)",
  contraccion: "var(--chart-3)",
  baja: "var(--chart-1)",
}

export function MrrBridgeChart({ series }: { series: SeriesPoint[] }) {
  const t = useTranslations("admin.charts")
  const f = useFormat()
  const configPuente = React.useMemo(
    () =>
      Object.fromEntries(
        PUENTE.map((key) => [
          key,
          { label: t(`bridge.${key}`), color: COLOR_PUENTE[key] },
        ])
      ) as Record<
        (typeof PUENTE)[number],
        { label: string; color: string }
      > satisfies ChartConfig,
    [t]
  )
  const data = series.map((p) => ({
    ...p,
    label: f.monthShort(p.month),
    contraccion: -p.contraccion,
    baja: -p.baja,
  }))

  return (
    <figure className="space-y-3">
      <ChartContainer config={configPuente} className="h-56 w-full">
        <BarChart
          data={data}
          stackOffset="sign"
          margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
        >
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
          <ReferenceLine y={0} stroke="var(--border)" />
          <ChartTooltip
            cursor={{ fill: "var(--muted)" }}
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => {
                  const p = payload?.[0]?.payload as (typeof data)[number] | undefined
                  return p
                    ? t("bridge.tooltip", {
                        mes: p.enCurso ? t("toDate", { mes: p.label }) : p.label,
                        mrr: f.money(p.mrr),
                        neto: f.money(p.neto, { signed: true }),
                      })
                    : ""
                }}
                formatter={(value, name) => (
                  <span className="flex w-full items-baseline justify-between gap-3">
                    <span>
                      {configPuente[name as keyof typeof configPuente]?.label ?? name}
                    </span>
                    <span className="tabular-nums">
                      {f.money(Math.abs(Number(value)))}
                    </span>
                  </span>
                )}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          {PUENTE.map((key) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="puente"
              fill={`var(--color-${key})`}
              maxBarSize={36}
              radius={2}
              fillOpacity={1}
            >
              {/* El mes en curso se atenúa: es una lectura parcial */}
            </Bar>
          ))}
        </BarChart>
      </ChartContainer>

      <details className="text-sm">
        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
          {t("viewTable")}
        </summary>
        <table className="mt-2 w-full text-xs tabular-nums">
          <caption className="sr-only">{t("bridge.caption")}</caption>
          <thead>
            <tr className="text-left text-muted-foreground">
              <th scope="col" className="py-1 font-medium">
                {t("month")}
              </th>
              <th scope="col" className="py-1 text-right font-medium">
                {t("bridge.nuevo")}
              </th>
              <th scope="col" className="py-1 text-right font-medium">
                {t("bridge.expansion")}
              </th>
              <th scope="col" className="py-1 text-right font-medium">
                {t("bridge.reactivacion")}
              </th>
              <th scope="col" className="py-1 text-right font-medium">
                {t("bridge.contraccion")}
              </th>
              <th scope="col" className="py-1 text-right font-medium">
                {t("bridge.baja")}
              </th>
              <th scope="col" className="py-1 text-right font-medium">
                {t("bridge.neto")}
              </th>
              <th scope="col" className="py-1 text-right font-medium">
                {t("bridge.mrrClose")}
              </th>
            </tr>
          </thead>
          <tbody>
            {series.map((p) => (
              <tr key={p.month} className="border-t">
                <th scope="row" className="py-1 text-left font-normal capitalize">
                  {p.enCurso
                    ? t("toDateRow", { mes: f.monthShort(p.month) })
                    : f.monthShort(p.month)}
                </th>
                <td className="py-1 text-right">{f.money(p.nuevo)}</td>
                <td className="py-1 text-right">{f.money(p.expansion)}</td>
                <td className="py-1 text-right">{f.money(p.reactivacion)}</td>
                <td className="py-1 text-right">{f.money(-p.contraccion)}</td>
                <td className="py-1 text-right">{f.money(-p.baja)}</td>
                <td className="py-1 text-right font-medium">
                  {f.money(p.neto, { signed: true })}
                </td>
                <td className="py-1 text-right font-medium">{f.money(p.mrr)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}

/**
 * Caja neta por mes: cobros netos en positivo; IA y comisiones en negativo;
 * la línea es la caja neta que queda.
 */
export function CajaChart({ series }: { series: SeriesPoint[] }) {
  const t = useTranslations("admin.charts")
  const f = useFormat()
  const configCaja = React.useMemo(
    () =>
      ({
        cobros: { label: t("cash.cobros"), color: "var(--chart-2)" },
        costes: { label: t("cash.costes"), color: "var(--chart-1)" },
        comisiones: { label: t("cash.comisiones"), color: "var(--chart-3)" },
      }) satisfies ChartConfig,
    [t]
  )
  const data = series.map((p) => ({
    ...p,
    label: f.monthShort(p.month),
    costes: -p.costes,
    comisiones: -p.comisiones,
  }))
  return (
    <ChartContainer config={configCaja} className="h-48 w-full">
      <BarChart
        data={data}
        stackOffset="sign"
        margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
      >
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
        <ReferenceLine y={0} stroke="var(--border)" />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const p = payload?.[0]?.payload as (typeof data)[number] | undefined
                return p
                  ? t("cash.tooltip", {
                      mes: p.enCurso ? t("toDate", { mes: p.label }) : p.label,
                      caja: f.money(p.cajaNeta, { signed: true }),
                    })
                  : ""
              }}
              formatter={(value, name) => (
                <span className="flex w-full items-baseline justify-between gap-3">
                  <span>
                    {configCaja[name as keyof typeof configCaja]?.label ?? name}
                  </span>
                  <span className="tabular-nums">{f.money(Math.abs(Number(value)))}</span>
                </span>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="cobros"
          stackId="caja"
          fill="var(--color-cobros)"
          maxBarSize={36}
          radius={2}
        />
        <Bar
          dataKey="costes"
          stackId="caja"
          fill="var(--color-costes)"
          maxBarSize={36}
          radius={2}
        />
        <Bar
          dataKey="comisiones"
          stackId="caja"
          fill="var(--color-comisiones)"
          maxBarSize={36}
          radius={2}
        />
      </BarChart>
    </ChartContainer>
  )
}

/** Serie simple de una métrica (WAU, conversión, coste por minuto…). */
export function SerieChart({
  data,
  dataKey,
  label,
  format = (v) => String(v),
  color = "var(--chart-2)",
  className,
}: {
  data: { label: string; [k: string]: number | string | null | boolean }[]
  dataKey: string
  label: string
  format?: (v: number) => string
  color?: string
  className?: string
}) {
  const config = React.useMemo(
    () => ({ [dataKey]: { label, color } }) satisfies ChartConfig,
    [dataKey, label, color]
  )
  return (
    <ChartContainer config={config} className={className ?? "h-40 w-full"}>
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
          width={48}
          tickFormatter={(v: number) => format(v)}
          className="text-xs"
          stroke="var(--muted-foreground)"
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => (
                <span className="tabular-nums">{format(Number(value))}</span>
              )}
            />
          }
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={`var(--color-${dataKey})`}
          strokeWidth={2}
          dot={{ r: 2.5 }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  )
}
