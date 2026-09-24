import * as React from "react"
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { Sparkline } from "@/components/admin/sparkline"

export type KpiTone = "neutral" | "ok" | "aviso" | "alerta"

export interface KpiCardProps extends Omit<React.ComponentProps<"div">, "title"> {
  label: string
  value: React.ReactNode
  /** Líneas secundarias, en orden. Cada una es una frase corta. */
  lines?: React.ReactNode[]
  /**
   * Variación ABSOLUTA respecto al comparable, ya formateada («+US$ 20»,
   * «−2 clientes»). Nunca un porcentaje sobre bases de dos dígitos.
   */
  delta?: { text: string; positive: boolean; label?: string }
  /** Nota al pie en gris: la definición o el comparable. */
  footnote?: React.ReactNode
  /** Semáforo del KPI: ámbar y rojo cambian el borde, no el fondo. */
  tone?: KpiTone
  /** Destaca la métrica principal. Como máximo una por vista. */
  featured?: boolean
  href?: string
  sparkline?: number[]
  icon?: React.ComponentType<{ className?: string }>
}

const TONE_RING: Record<KpiTone, string> = {
  neutral: "ring-border",
  ok: "ring-success/40",
  aviso: "ring-warning/50",
  alerta: "ring-destructive/50",
}

/**
 * Tarjeta de KPI del backoffice. Se diferencia de `StatCard` en que la
 * variación es absoluta (US$ o unidades) y en que admite líneas de contexto:
 * en un negocio de diez clientes, «−22,9 %» no dice nada y «−2 clientes» sí.
 */
export function KpiCard({
  label,
  value,
  lines = [],
  delta,
  footnote,
  tone = "neutral",
  featured = false,
  href,
  sparkline,
  icon: Icon,
  className,
  ...props
}: KpiCardProps) {
  const Trend = delta?.positive ? TrendingUp : TrendingDown
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <Icon className="size-4 shrink-0 text-muted-foreground" />
        ) : href ? (
          <ArrowRight
            className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/kpi:opacity-100"
            aria-hidden
          />
        ) : null}
      </div>

      <div className="flex items-end justify-between gap-3">
        <p className="text-2xl font-bold tracking-tight tabular-nums sm:text-[1.65rem]">
          {value}
        </p>
        {sparkline && sparkline.length > 1 && (
          <Sparkline values={sparkline} className="h-8 w-20 shrink-0 text-primary" />
        )}
      </div>

      {(delta || lines.length > 0) && (
        <div className="space-y-0.5 text-xs">
          {delta && (
            <p className="flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-medium tabular-nums",
                  delta.positive ? "text-success" : "text-destructive"
                )}
              >
                <Trend className="size-3" aria-hidden />
                {delta.text}
              </span>
              {delta.label && (
                <span className="text-muted-foreground">{delta.label}</span>
              )}
            </p>
          )}
          {lines.map((line, i) => (
            <p key={i} className="text-muted-foreground tabular-nums">
              {line}
            </p>
          ))}
        </div>
      )}

      {/* Sin `/70`: a 11 px esa nota se quedaba en 2,8:1 sobre la tarjeta
          destacada, y es la que explica qué cuenta la cifra */}
      {footnote && (
        <p className="mt-auto pt-1 text-[11px] leading-snug text-muted-foreground">
          {footnote}
        </p>
      )}
    </>
  )

  // Sin variación ni líneas de contexto la tarjeta no tiene con qué llenar el
  // alto de las demás y deja una franja vacía entre la cifra y la nota al pie.
  const classes = cn(
    "group/kpi relative flex flex-col gap-2 rounded-xl p-4 ring-1",
    delta || lines.length > 0 ? "min-h-36" : "min-h-28",
    featured ? "bg-brand-subtle ring-brand/25" : "bg-card ring-border",
    // El tono manda tambien en las destacadas: «Por arbitrar» se pintaba igual
    // con dos disputas que con ninguna
    tone !== "neutral" && TONE_RING[tone],
    href && "transition-shadow hover:shadow-sm hover:ring-primary/40",
    className
  )

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={label}>
        {content}
      </Link>
    )
  }
  return (
    <div className={classes} {...props}>
      {content}
    </div>
  )
}

/**
 * Variación absoluta lista para `KpiCard.delta`. `format` pinta la diferencia
 * (con signo) y `label` nombra el comparable.
 */
export function deltaOf(
  current: number,
  previous: number,
  format: (diff: number) => string,
  label: string,
  opts?: { invert?: boolean }
): KpiCardProps["delta"] {
  const diff = Math.round((current - previous) * 100) / 100
  const positive = opts?.invert ? diff <= 0 : diff >= 0
  return { text: format(diff), positive, label }
}

/** Rejilla de KPIs: cuatro por fila en escritorio, apilados en móvil. */
export function KpiGrid({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const t = useTranslations("admin.kpi")
  return (
    <section
      aria-label={t("grid")}
      className={cn(
        "grid [grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))] gap-3",
        className
      )}
    >
      {children}
    </section>
  )
}
