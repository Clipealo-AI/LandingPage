"use client"

import { useTranslations } from "next-intl"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useFormat } from "@/hooks/use-format"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export interface MesGanado {
  mes: string
  ganado: number
  etiqueta: string
}

/**
 * Lo ganado por mes, en barras.
 *
 * Vive en su propio archivo para que recharts no entre en la primera carga de
 * /wallet: la monta `graficas-diferidas.tsx`. Debajo queda la misma tabla de
 * siempre, así que mientras la gráfica llega el dato ya está escrito.
 */
export function WalletMesesChart({ datos }: { datos: readonly MesGanado[] }) {
  const t = useTranslations("campaigns.wallet")
  const f = useFormat()
  const config = {
    ganado: { label: t("chartSeries"), color: "var(--primary)" },
  } satisfies ChartConfig

  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <BarChart data={datos} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="etiqueta"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          className="text-xs"
          stroke="var(--muted-foreground)"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v: number) => f.money(v)}
          className="text-xs tabular-nums"
          stroke="var(--muted-foreground)"
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <ChartTooltipContent
              hideIndicator
              formatter={(value) => (
                <span className="font-semibold text-foreground tabular-nums">
                  {f.money(Number(value), { decimals: 2 })}
                </span>
              )}
            />
          }
        />
        <Bar
          dataKey="ganado"
          fill="var(--color-ganado)"
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
          isAnimationActive={false}
        />
      </BarChart>
    </ChartContainer>
  )
}
