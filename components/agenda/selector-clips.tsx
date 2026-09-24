"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { duracionClip } from "@/lib/agenda"
import { ASPECT_RATIOS, type Clip } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import { MediaFrame } from "@/components/video/media-frame"

/** Alto del poster de cada fila. El ancho sale del ratio, como en `ClipCard`. */
const ALTO_POSTER = "4.5rem"

/**
 * Elegir clips para programarlos.
 *
 * No inventa una vista previa nueva: reutiliza `MediaFrame` —el mismo
 * contenedor de ratio fijo de la biblioteca y del estudio—, que ya reserva el
 * hueco antes de que cargue el poster y pinta la duración como pastilla. Lo
 * único que añade es la casilla y el formato dicho en letra, porque de eso
 * depende que el clip quepa o no en la red que se elija después.
 *
 * Como `ClipsLibrary`, recibe los clips por props: no sabe de dónde salen.
 */
export function SelectorClips({
  clips,
  seleccion,
  onToggle,
  idPrefijo = "clip-agenda",
  className,
}: {
  clips: Clip[]
  /** Ids marcados. */
  seleccion: string[]
  onToggle: (id: string) => void
  /** Para que dos selectores en la misma página no compartan `id`. */
  idPrefijo?: string
  className?: string
}) {
  const t = useTranslations("calendario.compositor")
  const tv = useTranslations("common.video")

  if (clips.length === 0) {
    return (
      <Empty className="rounded-xl py-6 ring-1 ring-border">
        <EmptyHeader>
          <EmptyDescription>{t("proyectoVacio")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    // El contenedor y la rejilla son dos elementos: una consulta de contenedor
    // nunca se aplica al elemento que la declara
    <div className={cn("@container/clips", className)}>
      <ul className="grid gap-2 @xl/clips:grid-cols-2">
        {clips.map((clip) => {
          const id = `${idPrefijo}-${clip.id}`
          const marcado = seleccion.includes(clip.id)
          return (
            <li key={clip.id}>
              <label
                htmlFor={id}
                data-marcado={marcado || undefined}
                className="group/clip flex cursor-pointer items-start gap-3 rounded-xl bg-card p-2 ring-1 ring-border transition-colors hover:bg-surface-hover has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring data-marcado:bg-brand-subtle data-marcado:ring-brand/40"
              >
                <Checkbox
                  id={id}
                  checked={marcado}
                  onCheckedChange={() => onToggle(clip.id)}
                  className="mt-1 shrink-0"
                />
                <span
                  className="shrink-0"
                  style={{
                    width: `calc(${ALTO_POSTER} * ${ASPECT_RATIOS[clip.aspect].ratio})`,
                  }}
                >
                  <MediaFrame
                    aspect={clip.aspect}
                    poster={clip.posterUrl}
                    duration={duracionClip(clip)}
                    alt={clip.title}
                    className="rounded-lg"
                  />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="line-clamp-2 text-sm leading-snug font-medium">
                    {clip.title}
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="tabular">
                      {clip.aspect}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {tv(`aspect.${clip.aspect}.label`)}
                    </span>
                  </span>
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
