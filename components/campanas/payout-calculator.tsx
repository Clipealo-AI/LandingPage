"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { pagoPorVideo, vistasHastaTope, type Campana } from "@/lib/campanas"
import { useFormat } from "@/hooks/use-format"
import { Slider } from "@/components/ui/slider"

type Reglas = Pick<Campana, "presupuesto" | "cpm" | "topePorVideoPct" | "minimoVistas">

/** Escala logarítmica: de 1.000 a 5 millones de vistas en un recorrido cómodo. */
const MIN_LOG = Math.log10(1_000)
const MAX_LOG = Math.log10(5_000_000)
const aVistas = (paso: number) =>
  Math.round(10 ** (MIN_LOG + (paso / 100) * (MAX_LOG - MIN_LOG)) / 100) * 100
const aPaso = (vistas: number) =>
  ((Math.log10(Math.max(vistas, 1_000)) - MIN_LOG) / (MAX_LOG - MIN_LOG)) * 100

// Qué regla decide el pago, explicada: `campaigns.calculator.explanation.<limitadoPor>`

/**
 * Cuánto cobra un clip según sus vistas. La barra es el tope por video: se
 * llena con el pago y, a la derecha, lo que las vistas valdrían sin tope queda
 * como exceso rayado. Así se ve el juego: un viral no se come la campaña.
 */
export function PayoutCalculator({
  reglas,
  restante,
  vistasIniciales,
  className,
}: {
  reglas: Reglas
  /** Lo que queda de presupuesto; por defecto, todo. */
  restante?: number
  vistasIniciales?: number
  className?: string
}) {
  const t = useTranslations("campaigns.calculator")
  const f = useFormat()
  const hastaTope = vistasHastaTope(reglas)
  const [paso, setPaso] = React.useState(() =>
    aPaso(vistasIniciales ?? Math.round(hastaTope * 0.6))
  )
  const vistas = aVistas(paso)
  const r = pagoPorVideo(reglas, vistas, restante ?? reglas.presupuesto)
  const llenado = r.tope > 0 ? Math.min(100, (r.pago / r.tope) * 100) : 0
  const exceso = r.limitadoPor === "tope" && r.bruto > r.tope

  return (
    <div className={cn("space-y-5", className)}>
      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="vistas-calculadora" className="text-sm font-medium">
            {t("ifViews")}
          </label>
          <span className="text-2xl font-bold">
            {t("views", { n: vistas, views: f.grouped(vistas) })}
          </span>
        </div>
        <Slider
          id="vistas-calculadora"
          aria-label={t("sliderLabel")}
          aria-valuetext={t("views", { n: vistas, views: f.grouped(vistas) })}
          value={[paso]}
          min={0}
          max={100}
          step={0.5}
          onValueChange={([v]) => setPaso(v)}
        />
        <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>{f.compact(1_000)}</span>
          <span>{f.compact(5_000_000)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-muted-foreground">{t("earn")}</span>
          <span className="text-3xl font-bold" aria-live="polite">
            {f.money(r.pago, { decimals: 2 })}
          </span>
        </div>
        {/* Pista del mismo azul en un paso más claro: el tope es el ancho entero */}
        <div
          className="relative h-3 overflow-hidden rounded-full bg-primary/15"
          role="img"
          aria-label={t("barAria", {
            paid: f.money(r.pago, { decimals: 2 }),
            cap: f.money(r.tope),
          })}
        >
          <div
            className="h-full rounded-r-[4px] bg-primary"
            style={{ width: `${llenado}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>{f.money(0)}</span>
          <span>{t("capLabel", { amount: f.money(r.tope) })}</span>
        </div>
      </div>

      <dl className="grid gap-2 rounded-lg bg-muted/60 p-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">
            {t("gross", {
              views: f.grouped(vistas),
              cpm: f.money(reglas.cpm, { decimals: 2 }),
            })}
          </dt>
          <dd
            className={cn(
              "shrink-0 whitespace-nowrap tabular-nums",
              exceso && "text-muted-foreground line-through"
            )}
          >
            {f.money(r.bruto, { decimals: 2 })}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">
            {t("capRow", { pct: f.percent(reglas.topePorVideoPct) })}
          </dt>
          <dd className="shrink-0 whitespace-nowrap tabular-nums">{f.money(r.tope)}</dd>
        </div>
        <div className="flex justify-between gap-3 border-t pt-2 font-semibold">
          <dt>{t("payment")}</dt>
          <dd className="shrink-0 whitespace-nowrap tabular-nums">
            {f.money(r.pago, { decimals: 2 })}
          </dd>
        </div>
      </dl>

      <p className="text-sm text-pretty">
        {t(`explanation.${r.limitadoPor}`)}{" "}
        <span className="text-muted-foreground">
          {reglas.minimoVistas > 0
            ? t("capAtFrom", {
                views: f.grouped(hastaTope),
                min: f.grouped(reglas.minimoVistas),
              })
            : t("capAt", { views: f.grouped(hastaTope) })}
        </span>
      </p>
    </div>
  )
}
