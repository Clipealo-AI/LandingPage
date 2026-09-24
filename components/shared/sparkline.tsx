import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Minigráfica de tendencia para tarjetas y filas. Una sola línea en el gris de
 * contexto y el último punto en el color de acento: se lee «cómo va» sin ejes.
 * Es decorativa (`aria-hidden`): la cifra que acompaña ya dice el valor.
 *
 * La línea se estira con la caja (`preserveAspectRatio="none"` y trazo que no
 * escala); el punto final va en HTML para que no se deforme en óvalo.
 */
export function Sparkline({
  values,
  className,
  color = "var(--primary)",
}: {
  values: number[]
  className?: string
  /** Color del último punto. */
  color?: string
}) {
  if (values.length < 2) return null
  const max = Math.max(...values)
  const min = Math.min(...values)
  const rango = max - min || 1
  // Margen vertical para que el punto y el trazo no se corten en los extremos
  const y = (v: number) => 4 + (1 - (v - min) / rango) * 24
  const x = (i: number) => (i / (values.length - 1)) * 100
  const puntos = values.map((v, i) => `${x(i)},${y(v)}`).join(" ")
  const ultimo = values[values.length - 1]

  return (
    <span aria-hidden className={cn("relative block h-8 w-full", className)}>
      <svg
        viewBox="0 0 100 32"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible"
      >
        <polyline
          points={puntos}
          fill="none"
          stroke="var(--muted-foreground)"
          strokeOpacity={0.55}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        className="absolute size-2 -translate-1/2 rounded-full ring-2 ring-card"
        style={{ left: "100%", top: `${(y(ultimo) / 32) * 100}%`, background: color }}
      />
    </span>
  )
}
