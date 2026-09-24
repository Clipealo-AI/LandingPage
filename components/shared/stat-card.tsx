import * as React from "react"
import { TrendingDown, TrendingUp } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { useFormat } from "@/hooks/use-format"
import { Sparkline } from "@/components/shared/sparkline"

export interface StatCardProps extends React.ComponentProps<"div"> {
  label: string
  value: React.ReactNode
  /** Variacion respecto al periodo anterior, en puntos porcentuales. */
  delta?: number
  /** Texto de la variacion ya formateado («+12,4 %», «+3 pts»); el color sigue al signo de `delta`. */
  deltaLabel?: string
  /** Serie corta (≈12 puntos) para la minigrafica de tendencia bajo la cifra. */
  trend?: number[]
  hint?: string
  icon?: React.ComponentType<{ className?: string }>
  /** Destaca la metrica principal del panel. Como maximo una por vista. */
  featured?: boolean
}

export function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  trend,
  hint,
  icon: Icon,
  featured = false,
  className,
  ...props
}: StatCardProps) {
  const t = useTranslations("common.statCard")
  const f = useFormat()
  const up = (delta ?? 0) >= 0
  const Trend = up ? TrendingUp : TrendingDown

  return (
    <div
      className={cn(
        "relative flex flex-col gap-1 rounded-xl p-4 ring-1 ring-border",
        featured ? "bg-brand-subtle ring-brand/25" : "bg-card",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon && <Icon className="size-4 text-muted-foreground" />}
      </div>

      <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>

      <div className="flex items-center gap-1.5 text-xs">
        {delta !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium tabular-nums",
              up ? "text-success" : "text-destructive"
            )}
          >
            <Trend className="size-3" aria-hidden />
            {deltaLabel ?? f.delta(delta)}
            <span className="sr-only">{t("vsPrevious")}</span>
          </span>
        )}
        {hint && <span className="truncate text-muted-foreground">{hint}</span>}
      </div>

      {trend && <Sparkline values={trend} className="mt-2" />}
    </div>
  )
}
