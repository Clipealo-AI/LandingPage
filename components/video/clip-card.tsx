"use client"

import * as React from "react"
import {
  CalendarClock,
  Captions,
  CaptionsOff,
  Copy,
  Download,
  Eye,
  Heart,
  MoreHorizontal,
  Pencil,
  Play,
  Send,
  Share2,
  Trash2,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { Link, hrefDinamico } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"
import { formatTimecode } from "@/lib/format"
import { ASPECT_RATIOS, type Clip } from "@/lib/types"
import { useFormat } from "@/hooks/use-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { MediaFrame } from "@/components/video/media-frame"
import { ScoreBadge } from "@/components/video/score-badge"

const STATUS_VARIANT = {
  borrador: "outline",
  listo: "secondary",
  publicado: "success",
} as const

// `onPlay` colisiona con el handler DOM del mismo nombre: lo excluimos
export interface ClipCardProps extends Omit<React.ComponentProps<"article">, "onPlay"> {
  clip: Clip
  href?: string
  /** Compacta la tarjeta para listas laterales del editor. */
  dense?: boolean
  onPlay?: (clip: Clip) => void
  onDelete?: (clip: Clip) => void
}

/**
 * Tarjeta de clip.
 *
 * El titulo es el unico enlace de la tarjeta (no se envuelve todo en un `<a>`)
 * para que el menu de acciones y el boton de reproducir sigan siendo alcanzables
 * con el teclado. El `::after` del enlace amplia el area clicable a la tarjeta.
 */
export function ClipCard({
  clip,
  href,
  dense = false,
  onPlay,
  onDelete,
  className,
  ...props
}: ClipCardProps) {
  const t = useTranslations("common.video")
  const f = useFormat()
  const duration = clip.range.end - clip.range.start
  /** Para copiar exactamente el enlace que se está pintando, idioma incluido. */
  const enlaceRef = React.useRef<HTMLAnchorElement>(null)
  // `hrefDinamico` y no una plantilla a mano: es lo que traduce la ruta al
  // idioma activo, y escrita a pelo se quedaba siempre en español
  const target =
    href ??
    hrefDinamico("/proyectos/[id]/clips/[clipId]", {
      id: clip.sourceId,
      clipId: clip.id,
    })
  /** El editor es otro sitio: la ficha enseña el clip, el estudio lo cambia. */
  const estudio = hrefDinamico("/studio/[id]", { id: clip.sourceId }, { clip: clip.id })

  /**
   * El poster nunca pasa de MEDIA_MAX de alto. Un 9:16 a ancho completo mide
   * casi el doble que la tarjeta y rompe la rejilla, asi que el ancho se deriva
   * del ratio y el frame se centra.
   */
  const mediaMax = dense ? "4.5rem" : "18rem"
  const mediaWidth = `calc(${mediaMax} * ${ASPECT_RATIOS[clip.aspect].ratio})`

  return (
    <article
      className={cn(
        "group/clip relative rounded-2xl bg-card p-3 ring-1 ring-border transition-shadow duration-200 focus-within:shadow-md hover:shadow-md",
        dense ? "flex items-start gap-3" : "flex flex-col gap-3",
        className
      )}
      {...props}
    >
      <div
        className={cn("relative", dense ? "shrink-0" : "mx-auto w-full")}
        style={dense ? { width: mediaWidth } : { maxWidth: mediaWidth }}
      >
        <MediaFrame
          aspect={clip.aspect}
          poster={clip.posterUrl}
          duration={dense ? undefined : duration}
          alt={clip.title}
          className={dense ? "rounded-lg" : undefined}
        >
          {/* Reproducir: aparece al pasar el puntero, siempre visible en tactil */}
          <button
            type="button"
            onClick={() => onPlay?.(clip)}
            aria-label={t("clipCard.play", { title: clip.title })}
            className="absolute inset-0 z-10 grid place-items-center focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ring"
          >
            <span
              className={cn(
                "grid place-items-center rounded-full bg-stage/70 text-white backdrop-blur-sm transition-all duration-200",
                dense
                  ? "size-7 opacity-0 group-focus-within/clip:opacity-100 group-hover/clip:opacity-100"
                  : "size-11 opacity-0 group-focus-within/clip:opacity-100 group-hover/clip:opacity-100 max-sm:opacity-100"
              )}
            >
              <Play className={cn("ml-0.5 fill-current", dense ? "size-3" : "size-5")} />
            </span>
          </button>

          {/* En denso el poster mide 4.5 rem: no cabe nada superpuesto */}
          {!dense && (
            <>
              <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5">
                <ScoreBadge score={clip.score} size="sm" onMedia />
              </div>
              <span className="absolute top-2 right-2 z-20 rounded-md bg-stage/85 px-1.5 py-0.5 text-[10px] font-semibold text-stage-foreground backdrop-blur-sm">
                {clip.aspect}
              </span>
            </>
          )}
        </MediaFrame>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 text-sm leading-snug font-semibold tracking-tight">
            <Link
              ref={enlaceRef}
              href={target}
              className="after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:outline-none"
            >
              {clip.title}
            </Link>
          </h3>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={t("clipCard.actions", { title: clip.title })}
                className="relative z-20 -mt-0.5 shrink-0 opacity-0 group-hover/clip:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 max-sm:opacity-100"
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild>
                <Link href={estudio}>
                  <Pencil /> {t("clipCard.edit")}
                </Link>
              </DropdownMenuItem>
              {/* Descargar y duplicar necesitan el archivo renderizado, que
                  todavía no existe: se apagan con el motivo escrito, que es la
                  regla de la casa, en vez de quedarse mudos y pulsables */}
              <DropdownMenuItem disabled>
                <Download /> {t("clipCard.download", { aspect: clip.aspect })}
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Copy /> {t("clipCard.duplicate")}
              </DropdownMenuItem>
              <DropdownMenuLabel className="text-xs font-normal text-pretty text-muted-foreground">
                {t("clipCard.needsRender")}
              </DropdownMenuLabel>
              {/* Copiar el enlace sí se puede hacer entero aquí */}
              <DropdownMenuItem
                onSelect={async () => {
                  try {
                    // El enlace que se copia es el que ve el navegador ahora
                    // mismo, con su idioma: `location.origin` + la ruta pintada
                    const enlace = enlaceRef.current?.href
                    if (!enlace) throw new Error("sin enlace")
                    await navigator.clipboard.writeText(enlace)
                    toast.success(t("clipCard.linkCopied"))
                  } catch {
                    // Sin permiso de portapapeles (o sin HTTPS) no se finge que sí
                    toast.error(t("clipCard.linkFailed"))
                  }
                }}
              >
                <Share2 /> {t("clipCard.copyLink")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Publicar es elegir cuentas, y eso vive en la ficha del clip;
                  programar sigue siendo el Calendario con este clip dentro */}
              <DropdownMenuItem asChild>
                <Link href={target}>
                  <Send /> {t("clipCard.publish")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={{
                    pathname: "/calendario",
                    query: { crear: "1", clips: clip.id },
                  }}
                >
                  <CalendarClock /> {t("clipCard.schedule")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onDelete?.(clip)}>
                <Trash2 /> {t("clipCard.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {!dense && (
          <p className="line-clamp-2 text-xs leading-relaxed text-balance text-muted-foreground">
            {clip.hook}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
          {dense && <ScoreBadge score={clip.score} size="sm" />}
          <Badge variant={STATUS_VARIANT[clip.status]}>
            {t(`clipStatus.${clip.status}`)}
          </Badge>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="relative z-20 inline-flex items-center text-muted-foreground">
                {clip.hasCaptions ? (
                  <Captions className="size-3.5" />
                ) : (
                  <CaptionsOff className="size-3.5 opacity-50" />
                )}
                <span className="sr-only">
                  {clip.hasCaptions
                    ? t("clipCard.withCaptions")
                    : t("clipCard.withoutCaptions")}
                </span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {clip.hasCaptions
                ? t("clipCard.captionsIncluded")
                : t("clipCard.withoutCaptions")}
            </TooltipContent>
          </Tooltip>

          <span
            data-slot="timecode"
            className="ml-auto text-[11px] text-muted-foreground tabular-nums"
          >
            {formatTimecode(clip.range.start)}–{formatTimecode(clip.range.end)}
          </span>
        </div>

        {clip.metrics && !dense && (
          <dl className="mt-1 flex items-center gap-3 border-t pt-2 text-[11px] text-muted-foreground tabular-nums">
            <div className="flex items-center gap-1">
              <dt className="sr-only">{t("clipCard.views")}</dt>
              <Eye className="size-3" aria-hidden />
              <dd>{f.compact(clip.metrics.views)}</dd>
            </div>
            <div className="flex items-center gap-1">
              <dt className="sr-only">{t("clipCard.likes")}</dt>
              <Heart className="size-3" aria-hidden />
              <dd>{f.compact(clip.metrics.likes)}</dd>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <dt>{t("clipCard.retention")}</dt>
              <dd className="font-semibold text-foreground">
                {f.percent(clip.metrics.retention)}
              </dd>
            </div>
          </dl>
        )}
      </div>

      <span className="sr-only">
        {t("clipCard.format", { destination: t(`aspect.${clip.aspect}.destination`) })}
      </span>
    </article>
  )
}
