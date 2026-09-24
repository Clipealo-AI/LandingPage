"use client"

import * as React from "react"
import { AudioLines, Captions, Film, Scissors, ZoomIn, ZoomOut } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { clamp, formatTimecode } from "@/lib/format"
import type { TimelineItem, TimelineTrack } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const TRACK_ICON = {
  video: Film,
  audio: AudioLines,
  captions: Captions,
  clips: Scissors,
} as const

/** Intervalos de marca que se leen bien; se elige el primero que quepa. */
const TICK_STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800]

function pickTickStep(duration: number, widthPx: number) {
  const minGap = 72
  const maxTicks = Math.max(2, Math.floor(widthPx / minGap))
  return (
    TICK_STEPS.find((step) => duration / step <= maxTicks) ??
    TICK_STEPS[TICK_STEPS.length - 1]
  )
}

/** Margen a cada lado de la ventana, en fracciones del total. */
const OVERSCAN = 0.35

/** Por debajo de esto virtualizar cuesta mas de lo que ahorra. */
const VIRTUALIZE_FROM = 40

/**
 * Elementos que hay que pintar para una ventana visible dada.
 *
 * Se exporta aparte del componente para poder probarla: la geometria real
 * necesita layout y jsdom no lo tiene.
 *
 * El elemento seleccionado se incluye siempre aunque quede fuera de la ventana;
 * si se desmontara al salir de pantalla, el foco del teclado se perderia.
 */
export function itemsInWindow(
  items: TimelineItem[],
  visible: { from: number; to: number },
  duration: number,
  selectedId?: string | null
): TimelineItem[] {
  if (items.length <= VIRTUALIZE_FROM) return items

  const from = (visible.from - OVERSCAN) * duration
  const to = (visible.to + OVERSCAN) * duration

  return items.filter(
    (item) => item.id === selectedId || (item.end >= from && item.start <= to)
  )
}

// `onSelect` colisiona con el handler DOM del mismo nombre: lo excluimos
export interface TimelineProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  tracks: TimelineTrack[]
  duration: number
  currentTime: number
  selectedId?: string | null
  onSeek?: (seconds: number) => void
  onSelect?: (itemId: string, trackId: string) => void
}

/**
 * Linea de tiempo multipista.
 *
 * El zoom multiplica el ancho del lienzo y deja que el contenedor haga scroll,
 * en vez de recalcular un rango visible: con duraciones de podcast (1–2 h) el
 * navegador sigue pintando bien y el codigo se mantiene legible.
 */
export function Timeline({
  tracks,
  duration,
  currentTime,
  selectedId,
  onSeek,
  onSelect,
  className,
  ...props
}: TimelineProps) {
  const t = useTranslations("common.video.timeline")
  const [zoom, setZoom] = React.useState(1)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState(0)
  /** Tramo de tiempo visible ahora mismo, en fracciones 0–1 del total. */
  const [visible, setVisible] = React.useState({ from: 0, to: 1 })

  React.useEffect(() => {
    const node = canvasRef.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  /**
   * Ventana visible para virtualizar.
   *
   * Se calcula comparando la geometria del lienzo con la del viewport de scroll
   * en lugar de leer `scrollLeft`: la columna de cabeceras es `sticky` y falsea
   * la cuenta. Se guarda como fraccion para que no dependa del zoom.
   */
  React.useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return

    const viewport = root.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')
    if (!viewport) return

    let frame = 0
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const canvasRect = canvas.getBoundingClientRect()
        const viewRect = viewport.getBoundingClientRect()
        if (canvasRect.width === 0) return
        const from = (viewRect.left - canvasRect.left) / canvasRect.width
        const to = (viewRect.right - canvasRect.left) / canvasRect.width
        setVisible((current) =>
          Math.abs(current.from - from) < 0.005 && Math.abs(current.to - to) < 0.005
            ? current
            : { from, to }
        )
      })
    }

    measure()
    viewport.addEventListener("scroll", measure, { passive: true })
    window.addEventListener("resize", measure)
    return () => {
      cancelAnimationFrame(frame)
      viewport.removeEventListener("scroll", measure)
      window.removeEventListener("resize", measure)
    }
  }, [zoom, duration])

  const itemsVisibles = React.useCallback(
    (items: TimelineTrack["items"]) =>
      itemsInWindow(items, visible, duration, selectedId),
    [visible, duration, selectedId]
  )

  const step = pickTickStep(duration, width || 800)
  const ticks = React.useMemo(() => {
    const list: number[] = []
    for (let tick = 0; tick <= duration; tick += step) list.push(tick)
    return list
  }, [duration, step])

  const pct = (seconds: number) => (duration > 0 ? (seconds / duration) * 100 : 0)

  const seekFromEvent = (clientX: number) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect || !onSeek || rect.width === 0) return
    onSeek(clamp((clientX - rect.left) / rect.width, 0, 1) * duration)
  }

  return (
    <div
      ref={rootRef}
      className={cn("rounded-xl bg-card ring-1 ring-border", className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <p className="text-xs font-medium text-muted-foreground">
          {t("title")}
          <span data-slot="timecode" className="ml-2 text-foreground tabular-nums">
            {formatTimecode(currentTime, { forceHours: duration >= 3600 })}
          </span>
        </p>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={t("zoomOut")}
                disabled={zoom <= 1}
                onClick={() => setZoom((z) => clamp(z / 1.75, 1, 24))}
              >
                <ZoomOut />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("zoomOut")}</TooltipContent>
          </Tooltip>
          <span className="w-10 text-center text-[11px] text-muted-foreground tabular-nums">
            {zoom.toFixed(1)}×
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={t("zoomIn")}
                disabled={zoom >= 24}
                onClick={() => setZoom((z) => clamp(z * 1.75, 1, 24))}
              >
                <ZoomIn />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("zoomIn")}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <ScrollArea className="min-h-0 w-full flex-1">
        <div className="flex min-w-full">
          {/* Cabeceras fijas: el nombre de la pista no debe irse con el scroll */}
          <div className="sticky left-0 z-30 w-28 shrink-0 border-r bg-card sm:w-36">
            <div className="h-7 border-b px-3 text-[11px] leading-7 text-muted-foreground">
              {t("tracks")}
            </div>
            {tracks.map((track) => {
              const Icon = TRACK_ICON[track.kind]
              return (
                <div
                  key={track.id}
                  className="flex h-12 items-center gap-2 border-b px-3 text-xs text-muted-foreground last:border-b-0"
                >
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{track.label}</span>
                </div>
              )
            })}
          </div>

          <div style={{ width: `${zoom * 100}%` }} className="relative min-w-0 shrink-0">
            <div ref={canvasRef} className="relative">
              {/* Regla */}
              <div
                className="relative h-7 cursor-pointer border-b"
                onPointerDown={(e) => seekFromEvent(e.clientX)}
              >
                {ticks.map((tick) => (
                  <span
                    key={tick}
                    className="absolute top-0 flex h-full items-center gap-1 border-l pl-1 text-[10px] text-muted-foreground tabular-nums"
                    style={{ left: `${pct(tick)}%` }}
                  >
                    {formatTimecode(tick, { forceHours: duration >= 3600 })}
                  </span>
                ))}
              </div>

              {/* Pistas */}
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="relative h-12 border-b last:border-b-0"
                  onPointerDown={(e) => {
                    if (e.target === e.currentTarget) seekFromEvent(e.clientX)
                  }}
                >
                  {itemsVisibles(track.items).map((item) => {
                    const selected = selectedId ? item.id === selectedId : item.selected
                    const interactive = track.kind === "clips"
                    const width = Math.max(pct(item.end - item.start), 0.25)

                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={!interactive}
                        onClick={() => interactive && onSelect?.(item.id, track.id)}
                        title={item.label}
                        aria-label={
                          item.label
                            ? t("item", {
                                label: item.label,
                                start: formatTimecode(item.start),
                                end: formatTimecode(item.end),
                              })
                            : undefined
                        }
                        className={cn(
                          "absolute inset-y-1.5 overflow-hidden rounded-md px-1.5 text-left text-[11px] font-medium whitespace-nowrap transition-colors",
                          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                          interactive ? "cursor-pointer" : "cursor-default",
                          track.kind === "video" &&
                            "bg-secondary text-secondary-foreground",
                          track.kind === "captions" &&
                            "inset-y-4 rounded-sm bg-muted-foreground/20",
                          track.kind === "clips" &&
                            (selected
                              ? "bg-brand text-brand-foreground ring-2 ring-brand ring-offset-1 ring-offset-[var(--card)] focus-visible:outline-brand-foreground"
                              : "bg-primary/15 text-primary hover:bg-primary/25")
                        )}
                        style={{ left: `${pct(item.start)}%`, width: `${width}%` }}
                      >
                        {track.kind !== "captions" && item.label}
                      </button>
                    )
                  })}
                </div>
              ))}

              {/* Cabezal */}
              <div
                aria-hidden
                className="pointer-events-none absolute top-0 bottom-0 z-20 w-px bg-foreground"
                style={{ left: `${pct(currentTime)}%` }}
              >
                <span className="absolute -top-px -left-[5px] size-2.5 rounded-full bg-foreground" />
              </div>
            </div>
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
