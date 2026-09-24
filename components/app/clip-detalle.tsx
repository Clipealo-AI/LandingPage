"use client"

import * as React from "react"
import { Download, Pencil, Send, Sparkles } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link, hrefDinamico } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { formatTimecode } from "@/lib/format"
import { toast } from "@/lib/toast"
import { duracionClip } from "@/lib/agenda"
import { speakers } from "@/lib/mock-data"
import {
  ASPECT_RATIOS,
  type Clip,
  type SourceVideo,
  type TranscriptCue,
} from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CopiaClip } from "@/components/app/copia-clip"
import { DondeHaSalido, PublicarDialog } from "@/components/app/publicar-dialog"
import { ScoreBadge } from "@/components/video/score-badge"
import { TranscriptPanel } from "@/components/video/transcript-panel"
import { VideoPlayer } from "@/components/video/video-player"

const ESTADO_VARIANTE = {
  borrador: "outline",
  listo: "secondary",
  publicado: "success",
} as const

/**
 * La ficha de un clip: lo que la IA recortó, por qué, y qué hacer con ello.
 *
 * Todo lo que hace falta para publicarlo cabe en una pantalla: a la izquierda
 * el clip, a su derecha por qué está cortado ahí, sus datos y el texto con el
 * que sale, y en la columna de la derecha las tres acciones. Debajo, la
 * transcripción, que es lo único que se lee con calma.
 *
 * El reproductor va AL LADO y no encima: un 9:16 a ancho de columna dejaba
 * media pantalla vacía a los lados y empujaba todo lo demás por debajo del
 * pliegue. Y el texto por red va pegado a él y no al final de la página,
 * porque es lo que se toca justo antes de pulsar «Publicar»; abajo dejaba un
 * agujero de medio metro entre los datos del clip y lo siguiente. Con formato
 * horizontal no hay hueco que aprovechar y todo vuelve a apilarse.
 */
export function ClipDetalle({
  clip,
  video,
  cues,
}: {
  clip: Clip
  video: SourceVideo
  cues: TranscriptCue[]
}) {
  const t = useTranslations("app.clip")
  const tv = useTranslations("common.video")
  const [tiempo, setTiempo] = React.useState(clip.range.start)
  const duracion = duracionClip(clip)
  /** Vertical y cuadrado caben en una columna estrecha; 16:9 no. */
  const estrecho = ASPECT_RATIOS[clip.aspect].ratio <= 1

  const datos = [
    { id: "formato", valor: `${clip.aspect} · ${tv(`aspect.${clip.aspect}.label`)}` },
    { id: "duracion", valor: formatTimecode(duracion) },
    {
      id: "tramo",
      valor: `${formatTimecode(clip.range.start)}–${formatTimecode(clip.range.end)}`,
    },
    {
      id: "subtitulos",
      valor: clip.hasCaptions
        ? tv("clipCard.captionsIncluded")
        : tv("clipCard.withoutCaptions"),
    },
  ] as const

  return (
    <div className="@container/clip grid gap-6 xl:grid-cols-[minmax(0,1fr)_clamp(18rem,22vw,21rem)]">
      <div className="min-w-0 space-y-6">
        {/* Verlo, entenderlo y prepararlo, de una vez */}
        <div
          className={cn(
            "grid gap-6",
            estrecho && "@2xl/clip:grid-cols-[clamp(13rem,24%,17rem)_minmax(0,1fr)]"
          )}
        >
          <div className={cn("w-full", estrecho ? "max-w-68" : "max-w-2xl")}>
            <VideoPlayer
              aspect={clip.aspect}
              title={clip.title}
              clipRange={clip.range}
              onTimeChange={setTiempo}
            />
          </div>

          <div className="min-w-0 space-y-5">
            <section className="space-y-2" aria-labelledby="clip-razon">
              <h2
                id="clip-razon"
                className="flex items-center gap-2 text-sm font-semibold"
              >
                <Sparkles className="size-4 text-primary" aria-hidden />
                {t("razon")}
              </h2>
              <blockquote className="border-l-2 border-primary/40 pl-4 text-base text-pretty">
                {clip.hook}
              </blockquote>
            </section>

            {/* Los datos en una línea que se parte, no en una rejilla de dos
                columnas: son cuatro cifras cortas y en rejilla dejaban cuatro
                huecos de aire entre ellas y lo siguiente */}
            <dl
              aria-label={t("datos")}
              className="flex flex-wrap items-baseline gap-x-5 gap-y-1.5 border-y py-2.5 text-sm"
            >
              {datos.map((d) => (
                <div key={d.id} className="flex items-baseline gap-1.5">
                  <dt className="text-xs text-muted-foreground">{t(d.id)}</dt>
                  <dd className="font-medium tabular-nums">{d.valor}</dd>
                </div>
              ))}
              <div className="flex flex-wrap items-baseline gap-1.5">
                <dt className="text-xs text-muted-foreground">{t("etiquetas")}</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {clip.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </dd>
              </div>
            </dl>

            {/* Prepararlo, pegado al clip: es lo último que se toca antes de
                pulsar «Publicar», y al final de la página quedaba lejos */}
            <CopiaClip clip={clip} />
          </div>
        </div>

        <section className="space-y-3" aria-labelledby="clip-transcripcion">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="clip-transcripcion" className="text-sm font-semibold">
              {t("transcripcion")}
            </h2>
            <p className="text-xs text-muted-foreground tabular-nums">
              {t("transcripcionDe", {
                titulo: video.title,
                desde: formatTimecode(clip.range.start),
                hasta: formatTimecode(clip.range.end),
              })}
            </p>
          </div>
          {/* Sin seguimiento automático: aquí la transcripción vive dentro de la
              página, y `scrollIntoView` arrastraba la página entera hasta ella
              dejando el título del clip por encima del pliegue */}
          {cues.length > 0 ? (
            <TranscriptPanel
              cues={cues}
              speakers={speakers}
              currentTime={tiempo}
              onSeek={setTiempo}
              autoScroll={false}
              className="max-h-80 overflow-hidden rounded-xl ring-1 ring-border"
            />
          ) : (
            <p className="text-sm text-muted-foreground">{t("sinTranscripcion")}</p>
          )}
        </section>
      </div>

      {/* Sacarlo. Corta a propósito: tres acciones y dónde ha salido */}
      <aside className="space-y-4 xl:sticky xl:top-[calc(var(--spacing-topbar)+1rem)] xl:self-start">
        <div className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-border">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={ESTADO_VARIANTE[clip.status]}>
              {tv(`clipStatus.${clip.status}`)}
            </Badge>
            <ScoreBadge score={clip.score} size="sm" />
          </div>

          <PublicarDialog clip={clip}>
            <Button variant="brand" size="lg" className="w-full">
              <Send /> {t("publicar")}
            </Button>
          </PublicarDialog>

          <Button variant="outline" size="lg" className="w-full" asChild>
            <Link
              href={hrefDinamico(
                "/studio/[id]",
                { id: clip.sourceId },
                { clip: clip.id }
              )}
            >
              <Pencil /> {t("editar")}
            </Link>
          </Button>

          {/* El archivo todavía no existe: se apaga con el motivo escrito */}
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="lg"
              className="w-full"
              disabled
              aria-describedby="clip-descargar-motivo"
              onClick={() => toast(t("descargando"), { sound: "tap" })}
            >
              <Download /> {tv("clipCard.download", { aspect: clip.aspect })}
            </Button>
            <p id="clip-descargar-motivo" className="text-xs text-muted-foreground">
              {tv("clipCard.needsRender")}
            </p>
          </div>
        </div>

        <section
          className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-border"
          aria-labelledby="clip-salidas"
        >
          <h2 id="clip-salidas" className="text-sm font-semibold">
            {t("dondeHaSalido")}
          </h2>
          <DondeHaSalido clipId={clip.id} />
          <p className="text-xs text-pretty text-muted-foreground">
            {t("dondeHaSalidoAyuda")}
          </p>
        </section>
      </aside>
    </div>
  )
}
