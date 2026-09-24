"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts"

import {
  COLOR_RED,
  REDES_ANALITICA,
  fechasAnalitica,
  type FilaSerie,
  type RedAnalitica,
} from "@/lib/analytics"
import { SOCIAL_NETWORKS } from "@/lib/social"
import { useFormat } from "@/hooks/use-format"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

/**
 * Vistas ganadas desde el inicio del período, una línea por red.
 *
 * Líneas de 2 px y no áreas apiladas: se comparan redes, y apilar escondería
 * cuál crece. Con una sola red la línea lleva su lavado al 10 %. El color sigue
 * a la red (`COLOR_RED`): filtrar no repinta a las demás. La leyenda nombra cada
 * red con su total, así que la identidad nunca depende solo del color; debajo
 * va la misma serie como tabla.
 */
export function AnalyticsGrowthChart({ data }: { data: FilaSerie[] }) {
  const t = useTranslations("analytics.growth")
  const f = useFormat()
  const { dia, diaHora } = fechasAnalitica(f.locale)
  const redes = REDES_ANALITICA.filter((r) => data.some((f) => f[r] !== undefined))
  const ultima = data[data.length - 1]
  const config = Object.fromEntries(
    redes.map((r) => [r, { label: SOCIAL_NETWORKS[r].name, color: COLOR_RED[r] }])
  ) satisfies ChartConfig
  const sola = redes.length === 1

  return (
    <figure className="space-y-4">
      {/* Leyenda con el total de cada red: línea como la marca, nombre y cifra en tinta */}
      <figcaption>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {redes.map((r) => (
            <li key={r} className="flex items-center gap-2 text-sm">
              <span
                aria-hidden
                className="h-0.5 w-4 rounded-full"
                style={{ background: COLOR_RED[r] }}
              />
              <span className="text-muted-foreground">{SOCIAL_NETWORKS[r].name}</span>
              <span className="font-semibold">+{f.compact(ultima?.[r] ?? 0)}</span>
            </li>
          ))}
        </ul>
      </figcaption>

      <ChartContainer
        config={config}
        className="aspect-auto h-72 w-full @7xl/analitica:h-80"
      >
        <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="instante"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={28}
            tickFormatter={(v: string) => dia.format(new Date(v))}
            className="text-xs"
            stroke="var(--muted-foreground)"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v: number) => f.compact(v)}
            className="text-xs tabular-nums"
            stroke="var(--muted-foreground)"
          />
          <ChartTooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
            content={
              <ChartTooltipContent
                indicator="line"
                labelFormatter={(v) => {
                  const fecha = new Date(String(v))
                  return String(v) === ultima?.instante
                    ? t("lastUpdate", { date: diaHora.format(fecha) })
                    : dia.format(fecha)
                }}
                formatter={(value, name) => (
                  <span className="flex w-full items-baseline justify-between gap-4">
                    <span className="text-muted-foreground">
                      {config[name as RedAnalitica]?.label}
                    </span>
                    <span className="font-semibold text-foreground tabular-nums">
                      +{f.number(Number(value))}
                    </span>
                  </span>
                )}
              />
            }
          />
          {redes.map((r) =>
            sola ? (
              <Area
                key={r}
                dataKey={r}
                type="monotone"
                stroke={`var(--color-${r})`}
                strokeWidth={2}
                fill={`var(--color-${r})`}
                fillOpacity={0.1}
                isAnimationActive={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
              />
            ) : (
              <Line
                key={r}
                dataKey={r}
                type="monotone"
                stroke={`var(--color-${r})`}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
              />
            )
          )}
        </ComposedChart>
      </ChartContainer>

      <details className="text-sm">
        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
          {t("showTable")}
        </summary>
        <div className="mt-2 max-h-72 overflow-auto">
          <table className="w-full text-xs">
            <caption className="sr-only">{t("tableCaption")}</caption>
            <thead className="sticky top-0 bg-card">
              <tr className="text-left text-muted-foreground">
                <th scope="col" className="py-1 font-medium">
                  {t("day")}
                </th>
                {redes.map((r) => (
                  <th key={r} scope="col" className="py-1 text-right font-medium">
                    {SOCIAL_NETWORKS[r].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {data.map((fila) => (
                <tr key={fila.instante} className="border-t">
                  <th scope="row" className="py-1 text-left font-normal">
                    {dia.format(new Date(fila.instante))}
                  </th>
                  {redes.map((r) => (
                    <td key={r} className="py-1 text-right">
                      {f.number(fila[r] ?? 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  )
}
