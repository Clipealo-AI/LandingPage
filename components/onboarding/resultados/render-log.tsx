"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import type { PasoId } from "@/lib/onboarding"
import { Button } from "@/components/ui/button"
import { TypeLine } from "@/components/onboarding/type-line"

/** Lo que tarda cada línea del registro (§5.3): 4 líneas, 1,8 s. */
export const PASO_RENDER_MS = 450
/** Ningún render dura más (§1): con más líneas, cada una va más deprisa. */
export const TOPE_RENDER_MS = 2400

/** Ritmo de la línea que se escribe: entra entera antes de que acabe su paso. */
const RITMO_LINEA = { pausa: 0, porPalabra: 40, trasComa: 40, trasPunto: 40, tope: 220 }

export interface LineaRender {
  id: string
  /** «T01»: código de la línea, no se traduce. */
  codigo: string
  texto: string
  /** Lo que se escribe al terminar la línea («listo», «12 encajan»). */
  resultado: string
  /** La toma de la que sale el dato: la línea enlaza a ella. */
  paso?: PasoId
}

type EstadoLinea = "pendiente" | "activa" | "hecha"

/**
 * Registro del render (§6.1): una línea por dato real con su resultado y un
 * enlace a su toma, y una barra de progreso. Avanza una línea cada 450 ms (sin
 * pasar de 2,4 s en total) y al acabar llama a `onTerminado` una vez; «Ver
 * resultado ya» lo adelanta. Con `listo` sale terminado desde el principio
 * (render ya visto o prisa aprendida).
 *
 * Montaje (`app/motion/onboarding.css`):
 * - completo: la línea en curso se escribe palabra a palabra, la ✓ salta (`pop`)
 *   y el resultado funde; las pendientes esperan invisibles (ocupan su sitio);
 * - con «reducir movimiento»: todas las líneas funden escalonadas 80 ms desde
 *   el principio, la ✓ funde (`fade-soft`) y la línea en curso se enciende;
 * - la barra crece con `scale` en los dos modos: es un indicador.
 *
 * Mientras avanza, el contenedor lleva `aria-busy`; el anuncio único y la
 * celebración los hace quien lo usa en `onTerminado`. Enganches:
 * `data-render-log` (con `data-completo`), `data-render-linea` (con
 * `data-estado` y `data-listo`), `data-render-check`, `data-render-resultado` y
 * `data-render-barra`.
 */
export function RenderLog({
  lineas,
  listo,
  onTerminado,
  onEditar,
  puedeEditar,
  className,
}: {
  lineas: readonly LineaRender[]
  listo: boolean
  onTerminado: () => void
  onEditar?: (paso: PasoId) => void
  puedeEditar?: (paso: PasoId) => boolean
  className?: string
}) {
  const t = useTranslations("onboarding.render")
  const tc = useTranslations("onboarding.chrome")
  const total = lineas.length
  const paso = total ? Math.min(PASO_RENDER_MS, Math.floor(TOPE_RENDER_MS / total)) : 0
  const [hechas, setHechas] = React.useState(listo ? total : 0)
  // Sin animación: ya visto al montar o adelantado con «Ver resultado ya»
  const [completo, setCompleto] = React.useState(listo)
  const terminado = hechas >= total

  const avisar = React.useEffectEvent(() => onTerminado())

  React.useEffect(() => {
    if (hechas >= total) return
    const id = window.setTimeout(() => {
      setHechas(hechas + 1)
      if (hechas + 1 >= total) avisar()
    }, paso)
    return () => window.clearTimeout(id)
  }, [hechas, total, paso])

  const saltar = () => {
    if (terminado) return
    setCompleto(true)
    setHechas(total)
    onTerminado()
  }

  return (
    <div
      data-render-log=""
      data-completo={completo ? "" : undefined}
      className={cn("space-y-4", className)}
      aria-busy={!terminado || undefined}
      style={{ "--render-total": `${paso * total}ms` } as React.CSSProperties}
    >
      <ol className="space-y-2.5">
        {lineas.map((l, i) => {
          const estado: EstadoLinea =
            i < hechas ? "hecha" : i === hechas ? "activa" : "pendiente"
          const hecha = estado === "hecha"
          return (
            <li
              key={l.id}
              data-render-linea=""
              data-estado={estado}
              data-listo={hecha || undefined}
              style={{ "--i": i } as React.CSSProperties}
              className={cn(
                "flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm transition-colors @3xl/bienvenida:text-base",
                estado === "pendiente" && "text-muted-foreground"
              )}
            >
              <span className="tabular shrink-0 text-muted-foreground">{l.codigo}</span>
              <span className="min-w-0 flex-1 text-pretty">
                {estado === "pendiente" ? (
                  l.texto
                ) : (
                  <TypeLine
                    texto={l.texto}
                    ritmo={RITMO_LINEA}
                    completo={completo || hecha}
                    cursor="no"
                  />
                )}
              </span>
              <span
                className={cn(
                  "flex shrink-0 items-center gap-1.5 font-semibold",
                  hecha ? "text-foreground" : "text-muted-foreground/60"
                )}
              >
                <Check
                  data-render-check=""
                  aria-hidden
                  className={cn("size-4", hecha ? "text-success" : "opacity-30")}
                />
                {/* Con sitio de sobra, el resultado ocupa siempre lo mismo: la ✓
                    cae en la misma vertical diga «listo» o «3 encajan» */}
                <span
                  data-render-resultado=""
                  className={cn("@3xl/bienvenida:min-w-[10ch]", !hecha && "invisible")}
                >
                  {l.resultado}
                </span>
              </span>
              {l.paso && onEditar && puedeEditar?.(l.paso) && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto shrink-0 p-0"
                  onClick={() => onEditar(l.paso!)}
                >
                  {tc("actions.edit")}
                  <span className="sr-only">{tc(`pasos.${l.paso}`)}</span>
                </Button>
              )}
            </li>
          )
        })}
      </ol>
      <div className="flex items-center gap-4">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div
            data-render-barra=""
            className="h-full origin-left rounded-full bg-primary"
          />
        </div>
        {!terminado && (
          <Button type="button" variant="ghost" size="sm" onClick={saltar}>
            {t("skip")}
          </Button>
        )}
      </div>
    </div>
  )
}
