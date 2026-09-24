"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Check, Lock, Play, Route, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatDuration } from "@/lib/format"
import type { PlanRef } from "@/lib/pricing"
import {
  alAlcance,
  leccionesDe,
  planQueDesbloquea,
  siguienteBloqueada,
  progresoRuta,
  siguienteLeccion,
  vistaDe,
  type Catalogo,
  type Leccion,
  type ProgresoFormacion,
  type Ruta,
} from "@/lib/formacion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useNombrePlan } from "@/components/planes/nombre-plan"
import { useTextoClase, useTextoRuta } from "@/components/formacion/texto-clase"

/**
 * La ruta que le toca, arriba del todo: qué es, por dónde va y cuál es la clase
 * siguiente. Es la única acción naranja de la vista; el resto de la página se
 * apaña con secundarias.
 */
export function RutaPanel({
  ruta,
  otra,
  catalogo,
  plan,
  progreso,
  leccionActiva,
  onAbrir,
  onOtra,
  onOcultar,
}: {
  ruta: Ruta
  /** La que tocaría ahora, si no es la que se está enseñando. */
  otra: Ruta | null
  catalogo: Catalogo
  plan: PlanRef
  progreso: ProgresoFormacion
  leccionActiva: string | null
  onAbrir: (leccion: Leccion) => void
  onOtra: () => void
  /** «Ya me lo sé»: aparta la tarjeta sin tocar el avance. */
  onOcultar: () => void
}) {
  const t = useTranslations("formacion")
  const nombrePlan = useNombrePlan()
  const texto = useTextoClase()
  const textoRuta = useTextoRuta()
  const tituloRuta = textoRuta(ruta, "titulo")
  const lecciones = leccionesDe(ruta, catalogo)
  const avance = progresoRuta(ruta, progreso, { catalogo, plan })
  const siguiente = siguienteLeccion(ruta, progreso, { catalogo, plan })
  /**
   * Lo que queda cuando ya no queda nada al alcance.
   *
   * `siguienteLeccion` devuelve `null` tanto si la ruta está terminada como si
   * lo que falta pide plan, y el destino caía en `lecciones[0]`: el botón decía
   * «Seguir con la ruta» y abría el muro de pago de una clase con candado. Con
   * esto se sabe cuál es, y se puede decir qué plan la abre.
   */
  const bloqueada = siguiente
    ? null
    : siguienteBloqueada(ruta, progreso, { catalogo, plan })
  const planQueFalta = planQueDesbloquea(ruta, progreso, { catalogo, plan })
  const destino = siguiente ?? bloqueada ?? lecciones[0]

  return (
    <section
      aria-labelledby="ruta-titulo"
      className="@container/ruta rounded-xl bg-card p-4 ring-1 ring-border sm:p-5"
    >
      {/* `grid-cols-1` de base: sin ella la pista implícita es `auto` y se
            dimensiona al min-content de los títulos con `truncate`, que no
            pueden encoger; a 390 px la página se iba a 435 y desbordaba */}
      <div className="grid grid-cols-1 gap-5 @3xl/ruta:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] @3xl/ruta:gap-8">
        {/* `max-w-2xl`: a 2560 px esta columna medía 1.695 px y estiraba la barra
            de progreso de lado a lado, con sus dos cifras a 1.600 px la una de
            la otra. La lista de la derecha se lleva el sitio que sobra */}
        <div className="flex max-w-2xl min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Route aria-hidden data-icon="inline-start" />
              {t("ruta.etiqueta")}
            </Badge>
            {avance.terminada && (
              <Badge className="gap-1 border-transparent bg-success-500 text-ink-950">
                <Check aria-hidden data-icon="inline-start" strokeWidth={3} />
                {t("ruta.terminada")}
              </Badge>
            )}
          </div>

          <div className="space-y-1">
            <h2 id="ruta-titulo" className="text-xl leading-tight font-bold text-balance">
              {tituloRuta}
            </h2>
            <p className="text-sm text-pretty text-muted-foreground">
              {textoRuta(ruta, "descripcion")}
            </p>
          </div>

          <div className="space-y-1.5">
            <Progress
              value={avance.pct}
              aria-label={t("ruta.aria", { titulo: tituloRuta })}
            />
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="tabular-nums">
                {t("ruta.progreso", { hechas: avance.completadas, total: avance.total })}
                {/* Lo que falta por plan se dice aquí y no con un candado suelto:
                    es lo que explica por qué la barra no llega al final */}
                {avance.bloqueadas > 0 && planQueFalta && (
                  <>
                    {" · "}
                    {/* El plan que DESBLOQUEA lo que falta, no el más alto de
                        la ruta: con una clase de Empresa dentro, a quien solo
                        le faltaban dos de Creador se le pedía Empresa */}
                    {t("ruta.bloqueadas", {
                      n: avance.bloqueadas,
                      plan: nombrePlan(planQueFalta),
                    })}
                  </>
                )}
              </span>
              <span className="tabular-nums">
                {avance.terminada
                  ? t("ruta.duracion", { tiempo: formatDuration(avance.duracionSeg) })
                  : t("ruta.restante", { tiempo: formatDuration(avance.restanteSeg) })}
              </span>
            </div>
          </div>

          {destino && (
            <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-1">
              {/* Si lo que sigue tiene candado, el botón lo dice: llevaba a
                  abrir el reproductor y encontrarse el muro de pago */}
              <Button variant="brand" size="lg" onClick={() => onAbrir(destino)}>
                {bloqueada ? <Lock /> : <Play className="fill-current" />}
                {bloqueada
                  ? t("ruta.desbloquear")
                  : avance.terminada
                    ? t("ruta.repasar")
                    : avance.completadas > 0
                      ? t("ruta.continuar")
                      : t("ruta.empezar")}
              </Button>
              {otra && (
                <Button variant="outline" size="lg" onClick={onOtra}>
                  {t("ruta.otra", { titulo: textoRuta(otra, "titulo") })}
                </Button>
              )}
              {/* Mucha gente ya sabe editar y esta tarjeta les ocupa lo alto
                  de la pantalla cada vez que entran. Se aparta, no se borra:
                  las clases siguen abajo y se puede volver a enseñar */}
              <Button variant="ghost" size="lg" onClick={onOcultar}>
                <X /> {t("ruta.ocultar")}
              </Button>
              <p className="min-w-0 text-xs text-muted-foreground">
                {/* Terminada, «Siguiente: …» mentía: no queda ninguna, se
                    vuelve a empezar por la primera */}
                {bloqueada && planQueFalta
                  ? t("ruta.siguienteConPlan", {
                      titulo: texto(destino, "titulo"),
                      plan: nombrePlan(planQueFalta),
                    })
                  : avance.terminada
                    ? t("ruta.repasarDesde", { titulo: texto(destino, "titulo") })
                    : t("ruta.siguiente", { titulo: texto(destino, "titulo") })}
              </p>
            </div>
          )}
        </div>

        {/* Las clases en orden: se ve de un vistazo qué queda y se salta a cualquiera */}
        <ol className="flex flex-col gap-1">
          {lecciones.map((leccion, i) => {
            const hecha = vistaDe(progreso, leccion.id).completada
            const cerrada = !alAlcance(leccion, plan)
            const activa = leccion.id === leccionActiva
            return (
              <li key={leccion.id}>
                <button
                  type="button"
                  onClick={() => onAbrir(leccion)}
                  aria-current={activa ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    activa && "bg-muted"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold tabular-nums",
                      hecha
                        ? "bg-success-500 text-ink-950"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {hecha ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {texto(leccion, "titulo")}
                  </span>
                  {hecha && <span className="sr-only">{t("leccion.vista")}</span>}
                  {cerrada && (
                    <>
                      <Lock
                        className="size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <span className="sr-only">
                        {t("bloqueada.insignia", {
                          plan: nombrePlan(leccion.planMinimo),
                        })}
                      </span>
                    </>
                  )}
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {formatDuration(leccion.duracionSeg)}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
