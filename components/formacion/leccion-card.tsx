"use client"

import * as React from "react"
import { Check, Lock, Play } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { formatDuration } from "@/lib/format"
import {
  empezada as fueEmpezada,
  pctLeccion,
  vistaDe,
  type Leccion,
  type ProgresoFormacion,
  type Razon,
} from "@/lib/formacion"
import { useFormat } from "@/hooks/use-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { MediaFrame } from "@/components/video/media-frame"
import { useNombrePlan } from "@/components/planes/nombre-plan"
import { useTextoClase } from "@/components/formacion/texto-clase"

/** Hasta dos temas por tarjeta; el resto se resume en «+2». */
const TEMAS_VISIBLES = 2

/**
 * Una clase en la rejilla: portada con su duración, nivel, temas y en qué punto
 * la dejó. El motivo por el que se le propone va escrito («Por tus temas»): el
 * orden no se explica solo.
 */
export function LeccionCard({
  leccion,
  progreso,
  razon,
  bloqueada = false,
  activa = false,
  onAbrir,
}: {
  leccion: Leccion
  progreso: ProgresoFormacion
  razon: Razon | null
  /** Pide un plan superior: se ve igual, con candado y con lo que sí se ve. */
  bloqueada?: boolean
  /** La que está abierta en el reproductor: se encuadra con la marca de recorte. */
  activa?: boolean
  onAbrir: () => void
}) {
  const t = useTranslations("formacion")
  const texto = useTextoClase()
  const titulo = texto(leccion, "titulo")
  const tax = useTranslations("taxonomy")
  const nombrePlan = useNombrePlan()
  const f = useFormat()
  const vista = vistaDe(progreso, leccion.id)
  const pct = pctLeccion(leccion, progreso)
  const empezada = fueEmpezada(progreso, leccion.id)
  const titleId = `lec-${leccion.id}`
  const extra = leccion.temas.length - TEMAS_VISIBLES

  return (
    <article
      className={cn(
        // `h-full`: sin ella el artículo no se estira a la altura de su fila y
        // el `mt-auto` del pie no tiene sitio que empujar, así que las tarjetas
        // de una misma fila acababan a alturas distintas
        "flex h-full flex-col gap-3 rounded-xl bg-card p-3 ring-1 ring-border",
        activa && "ring-2 ring-brand/40"
      )}
      aria-labelledby={titleId}
    >
      <button
        type="button"
        onClick={onAbrir}
        aria-label={
          bloqueada
            ? t("bloqueada.abrir", { titulo: titulo })
            : t("leccion.abrir", { titulo: titulo })
        }
        className="group/portada relative block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <MediaFrame
          aspect="16:9"
          duration={leccion.duracionSeg}
          poster={leccion.video.portada}
          cropped={activa}
          alt=""
        >
          <span
            aria-hidden
            className="absolute inset-0 grid place-items-center transition-[scale] duration-200 ease-[var(--ease-brand)] group-hover/portada:scale-105"
          >
            <span className="grid size-11 place-items-center rounded-full bg-stage/80 text-stage-foreground backdrop-blur-sm">
              {bloqueada ? (
                <Lock className="size-5" />
              ) : (
                <Play className="ml-0.5 size-5 fill-current" />
              )}
            </span>
          </span>

          <span className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
            <Badge className="border-transparent bg-white text-ink-900 shadow-sm">
              {t(`niveles.${leccion.nivel}`)}
            </Badge>
            {vista.completada && (
              <Badge className="gap-1 border-transparent bg-success-500 text-ink-950 shadow-sm">
                <Check aria-hidden data-icon="inline-start" strokeWidth={3} />
                {t("leccion.vista")}
              </Badge>
            )}
          </span>
        </MediaFrame>
      </button>

      <div className="flex min-w-0 flex-col gap-1.5">
        <h3 id={titleId} className="text-sm leading-snug font-bold text-balance">
          {titulo}
        </h3>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {texto(leccion, "descripcion")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {/* El candado va en la fila de etiquetas, no encima de la portada: ahí
            ya están el nivel y «Vista», y tres insignias apiladas no se leen */}
        {bloqueada && (
          <Badge variant="secondary" className="gap-1">
            <Lock aria-hidden data-icon="inline-start" />
            {t("bloqueada.insignia", { plan: nombrePlan(leccion.planMinimo) })}
          </Badge>
        )}
        {razon && <Badge variant="brand-subtle">{t(`razones.${razon}`)}</Badge>}
        {leccion.temas.slice(0, TEMAS_VISIBLES).map((tema) => (
          <Badge key={tema} variant="outline">
            {tax(`verticales.${tema}`)}
          </Badge>
        ))}
        {extra > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">+{extra}</span>
        )}
      </div>

      {empezada && !vista.completada && (
        <div className="space-y-1">
          <Progress
            value={pct}
            aria-label={t("leccion.progresoAria", { titulo: titulo })}
          />
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {t("leccion.progreso", { pct: f.percent(pct) })}
          </p>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatDuration(leccion.duracionSeg)}
        </span>
        <Button variant={activa ? "secondary" : "outline"} size="sm" onClick={onAbrir}>
          {bloqueada
            ? t("bloqueada.boton")
            : vista.completada
              ? t("leccion.revisar")
              : empezada
                ? t("leccion.seguir")
                : t("leccion.ver")}
        </Button>
      </div>
    </article>
  )
}
