"use client"

import * as React from "react"
import {
  Captions,
  CaptionsOff,
  Loader2,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  TriangleAlert,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { formatTimecode } from "@/lib/format"
import { ASPECT_RATIOS, type AspectRatioKey, type ClipRange } from "@/lib/types"
import {
  useHlsSource,
  usePlayerShortcuts,
  useVideoPlayer,
} from "@/hooks/use-video-player"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Scrubber } from "@/components/video/scrubber"

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2]

/**
 * Errores con texto propio. `useVideoPlayer` guarda hoy la frase; cuando guarde
 * el código («load», «blocked»), el reproductor la pinta en el idioma activo.
 */
const PLAYER_ERRORS = ["load", "blocked"] as const
type PlayerError = (typeof PLAYER_ERRORS)[number]

function isPlayerError(value: string): value is PlayerError {
  return (PLAYER_ERRORS as readonly string[]).includes(value)
}

export interface VideoPlayerProps extends React.ComponentProps<"div"> {
  src?: string
  poster?: string
  /** Ratio del contenedor. El video se ajusta con object-contain, nunca recorta. */
  aspect?: AspectRatioKey
  title?: string
  /** Pista WebVTT de subtitulos. */
  captionsSrc?: string
  /** Tramo destacado en la barra: el clip que se esta editando. */
  clipRange?: ClipRange | null
  /** Limita la reproduccion al tramo del clip (preview de recorte). */
  loopRange?: boolean
  autoPlay?: boolean
  muted?: boolean
  onTimeChange?: (seconds: number) => void
}

function IconAction({
  label,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          className="text-stage-foreground hover:bg-white/12 hover:text-white"
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent sideOffset={8}>{label}</TooltipContent>
    </Tooltip>
  )
}

/**
 * Reproductor del producto.
 *
 * Controles propios en vez de los nativos porque la plataforma necesita pintar
 * el tramo del clip sobre la barra y compartir el mismo lenguaje visual en el
 * editor, la biblioteca y la landing.
 */
export function VideoPlayer({
  src,
  poster,
  aspect = "16:9",
  title,
  captionsSrc,
  clipRange,
  loopRange = false,
  autoPlay = false,
  muted = false,
  onTimeChange,
  className,
  style,
  ...props
}: VideoPlayerProps) {
  const t = useTranslations("common.video.player")
  const tc = useTranslations("common")
  const containerRef = React.useRef<HTMLDivElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [state, actions] = useVideoPlayer(videoRef, containerRef)
  const [captionsOn, setCaptionsOn] = React.useState(true)
  const [controlsVisible, setControlsVisible] = React.useState(true)
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  useHlsSource(videoRef, src)
  usePlayerShortcuts(containerRef, actions, state)

  // Sin fuente no hay cabezal real: informar 0 pisaria el tiempo del editor
  React.useEffect(() => {
    if (!src) return
    onTimeChange?.(state.currentTime)
  }, [src, state.currentTime, onTimeChange])

  // Preview de recorte: vuelve al inicio del tramo al llegar al final
  React.useEffect(() => {
    if (!loopRange || !clipRange || !state.playing) return
    if (state.currentTime >= clipRange.end) actions.seek(clipRange.start)
  }, [loopRange, clipRange, state.currentTime, state.playing, actions])

  const revealControls = React.useCallback(() => {
    setControlsVisible(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setControlsVisible(false), 2600)
  }, [])

  // En pausa los controles ya estan visibles, asi que al arrancar solo hay que
  // programar el ocultado; nada de setState sincrono aqui.
  React.useEffect(() => {
    if (!state.playing) return
    const timer = setTimeout(() => setControlsVisible(false), 2600)
    return () => clearTimeout(timer)
  }, [state.playing])

  React.useEffect(() => {
    // Sincronizar la pista de texto es exactamente para lo que sirve un efecto:
    // se escribe en el DOM, no en estado de React.
    const track = videoRef.current?.textTracks?.[0]
    // eslint-disable-next-line react-hooks/immutability -- mutacion del DOM, no de estado
    if (track) track.mode = captionsOn ? "showing" : "hidden"
  }, [captionsOn, state.ready])

  const showOverlay = !state.playing || state.ended
  const chrome = controlsVisible || !state.playing

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label={title ? t("region", { title }) : t("regionDefault")}
      onPointerMove={revealControls}
      onPointerLeave={() => state.playing && setControlsVisible(false)}
      className={cn(
        "group/player relative isolate w-full overflow-hidden rounded-frame bg-stage ring-1 ring-stage-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        !chrome && "cursor-none",
        className
      )}
      // El estilo de fuera se funde, no sustituye: quien coloca el reproductor
      // decide su tamaño, pero el ratio lo sigue mandando el formato.
      style={{ aspectRatio: ASPECT_RATIOS[aspect].css, ...style }}
      {...props}
    >
      {src ? (
        <video
          ref={videoRef}
          poster={poster}
          playsInline
          autoPlay={autoPlay}
          muted={muted}
          preload="metadata"
          onClick={actions.toggle}
          className="absolute inset-0 size-full object-contain"
        >
          {captionsSrc && (
            <track
              kind="captions"
              src={captionsSrc}
              srcLang="es"
              label="Español"
              default
            />
          )}
        </video>
      ) : (
        /* Sin fuente: mantenemos el encuadre para que el layout no salte al cargar */
        <div className="absolute inset-0 grid place-items-center">
          <div className="absolute inset-0 pattern-isotipos opacity-[0.09]" aria-hidden />
          {poster && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={poster}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
          )}
          <span className="relative text-xs text-stage-muted">
            {title ?? t("preview")}
          </span>
        </div>
      )}

      {/* Cargando */}
      {state.waiting && (
        <div className="absolute inset-0 grid place-items-center" aria-live="polite">
          <Loader2 className="size-8 animate-spin text-stage-foreground" />
          <span className="sr-only">{t("loading")}</span>
        </div>
      )}

      {/* Error */}
      {state.error && (
        <div
          role="alert"
          className="absolute inset-0 grid place-content-center gap-3 bg-stage/90 p-6 text-center"
        >
          <TriangleAlert className="mx-auto size-7 text-warning" />
          <p className="text-sm text-stage-foreground">
            {isPlayerError(state.error) ? t(`error.${state.error}`) : state.error}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => videoRef.current?.load()}
            className="mx-auto border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            <RotateCcw /> {tc("actions.retry")}
          </Button>
        </div>
      )}

      {/* Play central */}
      {showOverlay && !state.error && src && (
        <button
          type="button"
          onClick={
            state.ended
              ? () => {
                  actions.seek(0)
                  actions.play()
                }
              : actions.toggle
          }
          aria-label={state.ended ? t("replay") : t("play")}
          className="absolute inset-0 grid place-items-center focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ring"
        >
          <span className="grid size-16 place-items-center rounded-full bg-brand text-brand-foreground shadow-brand shadow-lg transition-transform duration-200 ease-[var(--ease-brand)] group-hover/player:scale-105 sm:size-20">
            {state.ended ? (
              <RotateCcw className="size-7 sm:size-8" />
            ) : (
              <Play className="ml-1 size-7 fill-current sm:size-8" />
            )}
          </span>
        </button>
      )}

      {/* Barra de controles */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pt-10 pb-2.5 transition-opacity duration-300 sm:px-4 sm:pb-3",
          chrome ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <Scrubber
          value={state.currentTime}
          duration={state.duration}
          buffered={state.buffered}
          highlight={clipRange}
          onSeek={actions.seek}
          disabled={!src || state.duration === 0}
        />

        <div className="mt-1 flex items-center gap-1">
          <IconAction
            label={state.playing ? t("pauseKey") : t("playKey")}
            onClick={actions.toggle}
            disabled={!src}
          >
            {state.playing ? (
              <Pause className="fill-current" />
            ) : (
              <Play className="fill-current" />
            )}
          </IconAction>

          <div className="group/vol flex items-center gap-1">
            <IconAction
              label={state.muted ? t("unmute") : t("mute")}
              onClick={actions.toggleMute}
              disabled={!src}
            >
              {state.muted || state.volume === 0 ? <VolumeX /> : <Volume2 />}
            </IconAction>
            {/* En movil el volumen lo controla el sistema: no lo duplicamos.
                El envoltorio recorta el pulgar cuando la barra esta plegada; el
                relleno vertical deja sitio a su halo de foco. */}
            <div className="-my-2 hidden w-0 overflow-hidden py-2 transition-[width] duration-200 group-focus-within/vol:w-24 group-hover/vol:w-24 sm:block">
              <Slider
                value={[state.muted ? 0 : state.volume * 100]}
                onValueChange={([v]) => actions.setVolume(v / 100)}
                aria-label={t("volume")}
                className="w-20 px-1 [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-thumb]]:border-0 [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-track]]:bg-white/25"
              />
            </div>
          </div>

          <p
            data-slot="timecode"
            className="ml-1 text-xs font-medium text-stage-foreground tabular-nums"
          >
            {formatTimecode(state.currentTime)}
            <span className="text-stage-muted"> / {formatTimecode(state.duration)}</span>
          </p>

          <div className="ml-auto flex items-center gap-1">
            {captionsSrc && (
              <IconAction
                label={captionsOn ? t("hideCaptions") : t("showCaptions")}
                onClick={() => setCaptionsOn((v) => !v)}
                aria-pressed={captionsOn}
              >
                {captionsOn ? <Captions /> : <CaptionsOff />}
              </IconAction>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t("speed")}
                  // Como reproducir y silenciar: sin archivo no hay velocidad
                  // que cambiar ni pantalla que llenar
                  disabled={!src}
                  className="hidden text-stage-foreground tabular-nums hover:bg-white/12 hover:text-white sm:inline-flex"
                >
                  {state.rate}×
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-28">
                <DropdownMenuRadioGroup
                  value={String(state.rate)}
                  onValueChange={(v) => actions.setRate(Number(v))}
                >
                  {RATES.map((rate) => (
                    <DropdownMenuRadioItem key={rate} value={String(rate)}>
                      {rate}× {rate === 1 && t("normalSpeed")}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <IconAction
              label={state.fullscreen ? t("exitFullscreen") : t("fullscreen")}
              onClick={actions.toggleFullscreen}
              disabled={!src}
            >
              {state.fullscreen ? <Minimize /> : <Maximize />}
            </IconAction>
          </div>
        </div>
      </div>
    </div>
  )
}
