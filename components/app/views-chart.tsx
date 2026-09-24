"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { weeklyViews } from "@/lib/mock-data"
import { useFormat } from "@/hooks/use-format"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

/**
 * Reproducciones por dia.
 *
 * Barras y no area: siete dias son categorias discretas, no una señal continua.
 * Una sola serie, asi que no lleva leyenda —el titulo de la tarjeta la nombra— y
 * el numero de clips viaja en el tooltip, nunca en un segundo eje.
 */
export function ViewsChart() {
  const t = useTranslations("app.viewsChart")
  const f = useFormat()
  const total = weeklyViews.reduce((sum, d) => sum + d.views, 0)

  const config = React.useMemo(
    () =>
      ({
        views: { label: t("series"), color: "var(--chart-2)" },
      }) satisfies ChartConfig,
    [t]
  )
  // El eje y la tabla muestran la abreviatura del día en el idioma activo
  const data = React.useMemo(
    () => weeklyViews.map((row) => ({ ...row, label: t(`days.${row.day}`) })),
    [t]
  )

  return (
    <figure className="space-y-3">
      <figcaption className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight tabular-nums">
          {f.compact(total)}
        </span>
        <span className="text-xs text-muted-foreground">{t("total")}</span>
      </figcaption>

      <ChartContainer config={config} className="h-52 w-full">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
          {/* Rejilla recesiva: solo horizontales, sin verticales que compitan */}
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-xs"
            stroke="var(--muted-foreground)"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            // 64 y no 46: con 46 el carril recorta por la izquierda y «60 mil»
            // pierde la panza del 6 y se lee «50 mil»
            width={64}
            tickFormatter={(v: number) => f.compact(v)}
            className="text-xs"
            stroke="var(--muted-foreground)"
          />
          <ChartTooltip
            cursor={{ fill: "var(--muted)" }}
            content={
              <ChartTooltipContent
                formatter={(value, _name, item) => (
                  <span className="flex w-full items-baseline justify-between gap-3">
                    <span>
                      {t("tooltipViews", {
                        count: Number(value),
                        views: f.number(Number(value)),
                      })}
                    </span>
                    <span className="text-muted-foreground">
                      {t("tooltipClips", { count: Number(item?.payload?.clips ?? 0) })}
                    </span>
                  </span>
                )}
              />
            }
          />
          {/* Extremo de dato redondeado 4 px, anclado a la linea base */}
          <Bar
            dataKey="views"
            fill="var(--color-views)"
            radius={[4, 4, 0, 0]}
            maxBarSize={44}
          />
        </BarChart>
      </ChartContainer>

      {/* Vista de tabla: la lectura no depende del color ni del hover */}
      <details className="text-sm">
        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
          {t("showTable")}
        </summary>
        <table className="mt-2 w-full text-xs">
          <caption className="sr-only">{t("caption")}</caption>
          <thead>
            <tr className="text-left text-muted-foreground">
              <th scope="col" className="py-1 font-medium">
                {t("columns.day")}
              </th>
              <th scope="col" className="py-1 text-right font-medium">
                {t("columns.views")}
              </th>
              <th scope="col" className="py-1 text-right font-medium">
                {t("columns.clips")}
              </th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {data.map((row) => (
              <tr key={row.day} className="border-t">
                <th scope="row" className="py-1 text-left font-normal">
                  {row.label}
                </th>
                <td className="py-1 text-right">{f.number(row.views)}</td>
                <td className="py-1 text-right">{row.clips}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
