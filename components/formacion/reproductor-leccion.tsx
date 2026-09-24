"use client"

import * as React from "react"
import { ArrowRight, Check, Lock, RotateCcw, X } from "lucide-react"
import { useTranslations } from "next-intl"

import { formatDuration } from "@/lib/format"
import { SOCIAL_NETWORKS } from "@/lib/social"
import {
  empezada as fueEmpezada,
  pctLeccion,
  vistaDe,
  type Leccion,
  type ProgresoFormacion,
} from "@/lib/formacion"
import { useFormat } from "@/hooks/use-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { SocialGlyph } from "@/components/brand/social"
import { VideoPlayer } from "@/components/video/video-player"
import { MuroPlan } from "@/components/planes/muro-plan"
import { useNombrePlan } from "@/components/planes/nombre-plan"
import { useTextoClase } from "@/components/formacion/texto-clase"

/** Lo que se gana al mejorar, visto desde una clase con candado. */
const VENTAJAS_PLAN = ["todas", "ruta", "campanas", "calendario"] as const

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">
        {etiqueta}
      </dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  )
}

/**
 * La clase abierta: el reproductor del producto (el mismo del estudio) y, al
 * lado, de qué va, cuánto dura, para qué nivel es y qué se hace al terminarla.
 *
 * Mientras el equipo no haya subido el archivo, `video.url` viene vacío: el
 * reproductor mantiene el encuadre con el título y aquí se dice por qué, en vez
 * de fingir que hay algo que ver.
 */
export function ReproductorLeccion({
  leccion,
  progreso,
  siguiente,
  bloqueada = false,
  onVer,
  onCompletar,
  onReiniciar,
  onAbrir,
  onCerrar,
}: {
  leccion: Leccion
  progreso: ProgresoFormacion
  /** La siguiente de la ruta, si queda alguna. */
  siguiente: Leccion | null
  /** Pide un plan superior: en vez del reproductor va la puerta. */
  bloqueada?: boolean
  onVer: (leccion: Leccion, segundo: number) => void
  onCompletar: (leccion: Leccion) => void
  onReiniciar: (leccion: Leccion) => void
  onAbrir: (leccion: Leccion) => void
  onCerrar: () => void
}) {
  const t = useTranslations("formacion")
  const texto = useTextoClase()
  const titulo = texto(leccion, "titulo")
  const tax = useTranslations("taxonomy")
  const nombrePlan = useNombrePlan()
  const f = useFormat()
  const vista = vistaDe(progreso, leccion.id)
  const pct = pctLeccion(leccion, progreso)

  // El reproductor avisa del cabezal; el dominio decide si eso es avanzar o no
  const alAvanzar = React.useCallback(
    (segundo: number) => onVer(leccion, segundo),
    [leccion, onVer]
  )

  return (
    <section
      aria-labelledby="leccion-titulo"
      className="@container/leccion rounded-xl bg-card p-4 ring-1 ring-border sm:p-5"
    >
      <div className="grid gap-5 @4xl/leccion:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] @4xl/leccion:gap-6">
        <div className="flex min-w-0 flex-col gap-2">
          {/* Con plan corto, la puerta ocupa el sitio del reproductor: enseñar
              unos controles apagados no vendería nada y confundiría con el caso
              de la clase que todavía no tiene archivo */}
          {bloqueada ? (
            <MuroPlan
              icono={Lock}
              titulo={t("bloqueada.titulo", { plan: nombrePlan(leccion.planMinimo) })}
              descripcion={t("bloqueada.descripcion", {
                plan: nombrePlan(leccion.planMinimo),
              })}
              ventajas={VENTAJAS_PLAN.map((v) => t(`bloqueada.ventajas.${v}`))}
              className="max-w-none"
            />
          ) : (
            <VideoPlayer
              src={leccion.video.url}
              poster={leccion.video.portada}
              title={titulo}
              aspect="16:9"
              onTimeChange={alAvanzar}
            />
          )}
          {/* El motivo va bajo el reproductor, no en la columna de al lado:
              quien ve los controles apagados lo tiene que leer ahí mismo */}
          {!bloqueada && !leccion.video.url && (
            <p className="rounded-lg bg-muted px-3 py-2 text-xs text-pretty text-muted-foreground">
              {t("leccion.sinVideo")}
            </p>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary">{t(`niveles.${leccion.nivel}`)}</Badge>
                {vista.completada ? (
                  <Badge className="gap-1 border-transparent bg-success-500 text-ink-950">
                    <Check aria-hidden data-icon="inline-start" strokeWidth={3} />
                    {t("leccion.vista")}
                  </Badge>
                ) : (
                  fueEmpezada(progreso, leccion.id) && (
                    <Badge variant="outline">{t("leccion.enCurso")}</Badge>
                  )
                )}
              </div>
              <h2
                id="leccion-titulo"
                className="text-lg leading-tight font-bold text-balance"
              >
                {titulo}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onCerrar}
              aria-label={t("leccion.cerrar")}
            >
              <X />
            </Button>
          </div>

          <p className="text-sm text-pretty text-muted-foreground">
            {texto(leccion, "descripcion")}
          </p>

          <dl className="grid grid-cols-2 gap-3">
            <Dato etiqueta={t("leccion.duracion")}>
              <span className="tabular-nums">{formatDuration(leccion.duracionSeg)}</span>
            </Dato>
            <Dato etiqueta={t("leccion.nivel")}>{t(`niveles.${leccion.nivel}`)}</Dato>
            <Dato etiqueta={t("leccion.temas")}>
              <span className="flex flex-wrap gap-1">
                {leccion.temas.map((tema) => (
                  <Badge key={tema} variant="outline">
                    {tax(`verticales.${tema}`)}
                  </Badge>
                ))}
              </span>
            </Dato>
            {leccion.redes && leccion.redes.length > 0 && (
              <Dato etiqueta={t("leccion.redes")}>
                <span className="flex flex-wrap gap-1">
                  {leccion.redes.map((red) => (
                    <Badge key={red} variant="outline" className="gap-1">
                      <SocialGlyph network={red} className="size-3.5" aria-hidden />
                      {SOCIAL_NETWORKS[red].name}
                    </Badge>
                  ))}
                </span>
              </Dato>
            )}
          </dl>

          {!vista.completada && pct > 0 && (
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

          {/* Sin `mt-auto`: los botones siguen al contenido en vez de caer al
              fondo de la caja, que dejaba ~300 px de hueco. Y «Siguiente clase»
              va primero, porque al marcar una como vista desaparecía «Marcar» y
              «Siguiente» saltaba justo debajo del cursor */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {siguiente && (
              <Button variant="outline" onClick={() => onAbrir(siguiente)}>
                {t("leccion.siguiente")} <ArrowRight />
              </Button>
            )}
            {!bloqueada && !vista.completada && (
              <Button variant="secondary" onClick={() => onCompletar(leccion)}>
                <Check /> {t("leccion.marcar")}
              </Button>
            )}
            {fueEmpezada(progreso, leccion.id) && (
              <Button variant="ghost" size="sm" onClick={() => onReiniciar(leccion)}>
                <RotateCcw /> {t("leccion.reiniciar")}
              </Button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground">
            {t("leccion.autor")} ·{" "}
            {t("leccion.publicada", { fecha: f.date(leccion.publicadaEn) })}
          </p>
        </div>
      </div>
    </section>
  )
}
