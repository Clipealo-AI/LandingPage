"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { clamp } from "@/lib/format"

export interface WaveformProps extends React.ComponentProps<"div"> {
  /** Amplitudes normalizadas 0–1, una por barra. */
  peaks: number[]
  /** Posicion del cabezal 0–1. Las barras ya reproducidas se pintan solidas. */
  progress?: number
  /** Tramo seleccionado 0–1: se resalta en naranja. */
  selection?: { start: number; end: number } | null
  height?: number
  onSeek?: (position: number) => void
}

/**
 * Forma de onda como barras.
 *
 * Se dibuja con divs y no con canvas a proposito: son ~120 nodos, heredan los
 * tokens de color, funcionan en modo oscuro sin repintar y se pueden animar con
 * CSS. Un canvas solo compensa por encima de ~2000 barras.
 */
export function Waveform({
  peaks,
  progress = 0,
  selection,
  height = 48,
  onSeek,
  className,
  ...props
}: WaveformProps) {
  const ref = React.useRef<HTMLDivElement>(null)

  const handleSeek = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect || !onSeek) return
    onSeek(clamp((clientX - rect.left) / rect.width, 0, 1))
  }

  return (
    <div
      ref={ref}
      onPointerDown={(e) => handleSeek(e.clientX)}
      className={cn(
        "relative flex w-full items-center gap-px",
        onSeek && "cursor-pointer",
        className
      )}
      style={{ height }}
      aria-hidden
      {...props}
    >
      {peaks.map((peak, i) => {
        const position = i / (peaks.length - 1 || 1)
        const played = position <= progress
        const inSelection =
          selection && position >= selection.start && position <= selection.end

        return (
          <span
            key={i}
            className={cn(
              "min-w-px flex-1 rounded-full transition-colors duration-150",
              inSelection
                ? played
                  ? "bg-brand"
                  : "bg-brand/45"
                : played
                  ? "bg-primary"
                  : "bg-muted-foreground/25"
            )}
            // Precision fija: un flotante en crudo puede serializarse distinto
            // en servidor y en cliente y romper la hidratacion
            style={{ height: `${Math.max(6, peak * 100).toFixed(2)}%` }}
          />
        )
      })}
    </div>
  )
}
