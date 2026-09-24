"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { clamp, formatTimecode } from "@/lib/format"

export interface ScrubberProps {
  value: number
  duration: number
  /** Final del buffer, para pintar la parte ya descargada. */
  buffered?: number
  /** Tramo del clip seleccionado: se pinta en naranja sobre la barra. */
  highlight?: { start: number; end: number } | null
  onSeek: (seconds: number) => void
  /** Se dispara en cada movimiento del arrastre (scrubbing en vivo). */
  onScrub?: (seconds: number) => void
  disabled?: boolean
  className?: string
  "aria-label"?: string
}

/**
 * Barra de progreso arrastrable.
 *
 * Implementada a mano en vez de con un slider generico porque necesita pintar
 * tres capas encima del mismo raíl (buffer, tramo del clip y cabezal) y una
 * pista de hover con el timecode. Mantiene el contrato de accesibilidad de un
 * slider: rol, valores y teclado.
 */
export function Scrubber({
  value,
  duration,
  buffered = 0,
  highlight,
  onSeek,
  onScrub,
  disabled,
  className,
  ...aria
}: ScrubberProps) {
  const t = useTranslations("common.video.scrubber")
  const trackRef = React.useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = React.useState(false)
  const [hover, setHover] = React.useState<number | null>(null)

  const pct = (seconds: number) =>
    duration > 0 ? clamp(seconds / duration, 0, 1) * 100 : 0

  const secondsFromEvent = React.useCallback(
    (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect()
      if (!rect || rect.width === 0) return 0
      return clamp((clientX - rect.left) / rect.width, 0, 1) * duration
    },
    [duration]
  )

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || duration <= 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
    const next = secondsFromEvent(event.clientX)
    onScrub?.(next)
    onSeek(next)
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || duration <= 0) return
    const next = secondsFromEvent(event.clientX)
    setHover(next)
    if (!dragging) return
    onScrub?.(next)
    onSeek(next)
  }

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    setDragging(false)
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (disabled || duration <= 0) return
    const step = event.shiftKey ? 10 : 5
    const moves: Record<string, number> = {
      ArrowRight: step,
      ArrowLeft: -step,
      PageUp: 60,
      PageDown: -60,
    }
    if (event.key in moves) {
      event.preventDefault()
      onSeek(clamp(value + moves[event.key], 0, duration))
    } else if (event.key === "Home") {
      event.preventDefault()
      onSeek(0)
    } else if (event.key === "End") {
      event.preventDefault()
      onSeek(duration)
    }
  }

  return (
    <div
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={aria["aria-label"] ?? t("label")}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(value)}
      aria-valuetext={t("valueText", {
        current: formatTimecode(value),
        total: formatTimecode(duration),
      })}
      aria-disabled={disabled || undefined}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={() => setHover(null)}
      className={cn(
        "group/scrubber relative flex h-5 w-full touch-none items-center outline-none select-none",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className
      )}
    >
      {/* Raíl */}
      <div
        ref={trackRef}
        className="relative h-1 w-full overflow-hidden rounded-full bg-white/20 transition-[height] duration-150 group-hover/scrubber:h-1.5 group-focus-visible/scrubber:h-1.5 data-[dragging=true]:h-1.5"
        data-dragging={dragging}
      >
        {/* Buffer */}
        <div
          className="absolute inset-y-0 left-0 bg-white/25"
          style={{ width: `${pct(buffered)}%` }}
        />
        {/* Tramo del clip: el unico naranja de la barra */}
        {highlight && duration > 0 && (
          <div
            className="absolute inset-y-0 bg-brand/70"
            style={{
              left: `${pct(highlight.start)}%`,
              width: `${pct(highlight.end) - pct(highlight.start)}%`,
            }}
          />
        )}
        {/* Reproducido */}
        <div
          className="absolute inset-y-0 left-0 bg-white"
          style={{ width: `${pct(value)}%` }}
        />
      </div>

      {/* Cabezal */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute size-3 -translate-x-1/2 rounded-full bg-white shadow-sm transition-transform duration-150",
          dragging
            ? "scale-125"
            : "scale-0 group-hover/scrubber:scale-100 group-focus-visible/scrubber:scale-100"
        )}
        style={{ left: `${pct(value)}%` }}
      />

      {/* Timecode bajo el cursor */}
      {hover !== null && !disabled && duration > 0 && (
        <span
          aria-hidden
          data-slot="timecode"
          className="pointer-events-none absolute -top-7 -translate-x-1/2 rounded-md bg-stage/90 px-1.5 py-0.5 text-[11px] font-medium text-stage-foreground tabular-nums shadow-md"
          style={{ left: `clamp(1.5rem, ${pct(hover)}%, calc(100% - 1.5rem))` }}
        >
          {formatTimecode(hover)}
        </span>
      )}
    </div>
  )
}
