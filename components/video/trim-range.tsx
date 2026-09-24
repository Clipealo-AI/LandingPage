"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { clamp, formatTimecode } from "@/lib/format"
import type { ClipRange } from "@/lib/types"

export interface TrimRangeProps {
  value: ClipRange
  duration: number
  /** Duracion minima del clip en segundos. */
  minLength?: number
  /** Duracion maxima; util para respetar el limite de la plataforma destino. */
  maxLength?: number
  /**
   * Ventana visible. Recortar 50 s dentro de un podcast de 80 min a escala
   * completa deja una franja de un pixel, asi que el editor trabaja sobre un
   * entorno del clip. Por defecto, el video entero.
   */
  view?: { start: number; end: number }
  onChange: (range: ClipRange) => void
  /** Se llama al soltar: momento para pedir el re-render del preview. */
  onCommit?: (range: ClipRange) => void
  children?: React.ReactNode
  className?: string
}

type DragMode = "start" | "end" | "move"

/**
 * Recorte de dos manijas.
 *
 * Las manijas son la marca de recorte del manual convertida en control: por eso
 * son brackets naranja y no pastillas grises. El area central se puede arrastrar
 * para mover el clip entero sin cambiar su duracion.
 */
export function TrimRange({
  value,
  duration,
  minLength = 3,
  maxLength,
  view,
  onChange,
  onCommit,
  children,
  className,
}: TrimRangeProps) {
  const t = useTranslations("common.video.trim")
  const from = view?.start ?? 0
  const to = view?.end ?? duration
  const span = Math.max(to - from, 1)
  const trackRef = React.useRef<HTMLDivElement>(null)
  const drag = React.useRef<{ mode: DragMode; offset: number } | null>(null)
  const [active, setActive] = React.useState<DragMode | null>(null)

  const pct = (seconds: number) => ((seconds - from) / span) * 100
  const length = value.end - value.start

  const secondsFrom = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return 0
    return from + clamp((clientX - rect.left) / rect.width, 0, 1) * span
  }

  const applyStart = (seconds: number) => {
    const max = maxLength ? Math.max(0, value.end - minLength) : value.end - minLength
    const min = maxLength ? Math.max(0, value.end - maxLength) : 0
    onChange({ start: clamp(seconds, min, max), end: value.end })
  }

  const applyEnd = (seconds: number) => {
    const min = value.start + minLength
    const max = maxLength ? Math.min(duration, value.start + maxLength) : duration
    onChange({ start: value.start, end: clamp(seconds, min, max) })
  }

  const applyMove = (startSeconds: number) => {
    const start = clamp(startSeconds, 0, duration - length)
    onChange({ start, end: start + length })
  }

  const beginDrag = (mode: DragMode, event: React.PointerEvent) => {
    event.preventDefault()
    event.stopPropagation()
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    drag.current = { mode, offset: secondsFrom(event.clientX) - value.start }
    setActive(mode)
  }

  const onPointerMove = (event: React.PointerEvent) => {
    if (!drag.current) return
    const seconds = secondsFrom(event.clientX)
    if (drag.current.mode === "start") applyStart(seconds)
    else if (drag.current.mode === "end") applyEnd(seconds)
    else applyMove(seconds - drag.current.offset)
  }

  const endDrag = (event: React.PointerEvent) => {
    if (!drag.current) return
    ;(event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId)
    drag.current = null
    setActive(null)
    onCommit?.(value)
  }

  const handleKey = (mode: "start" | "end") => (event: React.KeyboardEvent) => {
    const step = event.shiftKey ? 5 : event.altKey ? 1 / 30 : 1
    const moves: Record<string, number> = { ArrowRight: step, ArrowLeft: -step }
    const delta = moves[event.key]
    if (delta === undefined) return
    event.preventDefault()
    if (mode === "start") applyStart(value.start + delta)
    else applyEnd(value.end + delta)
    onCommit?.(value)
  }

  const handleClass =
    "absolute inset-y-0 z-20 flex w-4 -translate-x-1/2 cursor-ew-resize touch-none items-center justify-center outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"

  return (
    <div className={cn("relative select-none", className)}>
      <div
        ref={trackRef}
        className="relative h-full min-h-14 w-full overflow-hidden rounded-lg bg-muted ring-1 ring-border"
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {children}

        {/* Fuera del recorte: se apaga en vez de taparse, sigue leyendose */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 bg-background/70 backdrop-grayscale"
          style={{ width: `${Math.max(pct(value.start), 0)}%` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 bg-background/70 backdrop-grayscale"
          style={{ width: `${100 - pct(value.end)}%` }}
        />

        {/* Tramo seleccionado */}
        <div
          onPointerDown={(event) => beginDrag("move", event)}
          className={cn(
            "absolute inset-y-0 z-10 cursor-grab touch-none border-y-2 border-brand",
            active === "move" && "cursor-grabbing"
          )}
          style={{ left: `${pct(value.start)}%`, width: `${(length / span) * 100}%` }}
        />

        {/* Manija de entrada */}
        <div
          role="slider"
          tabIndex={0}
          aria-label={t("start")}
          aria-valuemin={0}
          aria-valuemax={Math.round(value.end - minLength)}
          aria-valuenow={Math.round(value.start)}
          aria-valuetext={formatTimecode(value.start)}
          onKeyDown={handleKey("start")}
          onPointerDown={(event) => beginDrag("start", event)}
          className={handleClass}
          style={{ left: `${pct(value.start)}%` }}
        >
          <span className="h-full w-1.5 rounded-l-sm bg-brand" />
          <span className="absolute h-6 w-1 rounded-full bg-brand" />
        </div>

        {/* Manija de salida */}
        <div
          role="slider"
          tabIndex={0}
          aria-label={t("end")}
          aria-valuemin={Math.round(value.start + minLength)}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(value.end)}
          aria-valuetext={formatTimecode(value.end)}
          onKeyDown={handleKey("end")}
          onPointerDown={(event) => beginDrag("end", event)}
          className={handleClass}
          style={{ left: `${pct(value.end)}%` }}
        >
          <span className="h-full w-1.5 rounded-r-sm bg-brand" />
          <span className="absolute h-6 w-1 rounded-full bg-brand" />
        </div>
      </div>

      <div
        data-slot="timecode"
        className="mt-2 flex items-center justify-between text-xs text-muted-foreground tabular-nums"
      >
        <span>{formatTimecode(value.start, { millis: true })}</span>
        <span className="font-semibold text-foreground">
          {formatTimecode(length, { millis: true })}
        </span>
        <span>{formatTimecode(value.end, { millis: true })}</span>
      </div>
    </div>
  )
}
