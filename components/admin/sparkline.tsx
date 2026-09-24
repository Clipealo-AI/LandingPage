import { cn } from "@/lib/utils"

/**
 * Línea diminuta sin ejes ni tooltip: solo la forma de la serie. Hereda el
 * color del texto, así que basta con `text-primary` o `text-success`.
 */
export function Sparkline({
  values,
  className,
}: {
  values: number[]
  className?: string
}) {
  const w = 100
  const h = 32
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const step = values.length > 1 ? w / (values.length - 1) : w
  const points = values.map(
    (v, i) =>
      `${(i * step).toFixed(1)},${(h - 3 - ((v - min) / span) * (h - 6)).toFixed(1)}`
  )
  const d = `M${points.join(" L")}`

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={cn("overflow-visible", className)}
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={points.at(-1)?.split(",")[0]}
        cy={points.at(-1)?.split(",")[1]}
        r="2.5"
        fill="currentColor"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
