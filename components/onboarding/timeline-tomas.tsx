"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { esRender, type PasoId } from "@/lib/onboarding"
import { EASE_BRAND, prefiereMenosMovimiento } from "@/lib/preferencia-movimiento"
import { EVENTO_TOMA, type DetalleEventoToma } from "@/components/onboarding/contexto"

export type EstadoSegmento = "actual" | "respondida" | "saltada" | "pendiente"

export function estadoSegmento(
  paso: PasoId,
  actual: PasoId,
  respondidos: readonly PasoId[],
  saltados: readonly PasoId[]
): EstadoSegmento {
  if (paso === actual) return "actual"
  if (saltados.includes(paso)) return "saltada"
  if (respondidos.includes(paso)) return "respondida"
  return "pendiente"
}

/* ---------------------------------------------------------------------------
   Clip que viaja al timeline (§5.3, §5.11)
   --------------------------------------------------------------------------- */

/** Vuelo del clip desde la opción elegida hasta su segmento. */
export const VIAJE_CLIP_MS = 420
/** Con «reducir movimiento»: el clip aparece en su segmento con un anillo. */
export const ANILLO_CLIP_MS = 600

const CAPA_ID = "clipealo-montaje"

/** Capa fija encima de la página, como la de `lib/effects.ts`, sin tocar el layout. */
function capa() {
  let el = document.getElementById(CAPA_ID)
  if (!el) {
    el = document.createElement("div")
    el.id = CAPA_ID
    el.setAttribute("aria-hidden", "true")
    Object.assign(el.style, {
      position: "fixed",
      inset: "0",
      pointerEvents: "none",
      zIndex: "2147482000",
      overflow: "hidden",
    })
    document.body.appendChild(el)
  }
  return el
}

function animarYQuitar(
  nodo: HTMLElement,
  fotogramas: Keyframe[],
  opciones: KeyframeAnimationOptions,
  despues?: () => void
) {
  const quitar = () => {
    nodo.remove()
    despues?.()
  }
  try {
    nodo.animate(fotogramas, opciones).finished.then(quitar, () => nodo.remove())
  } catch {
    nodo.remove()
  }
}

function caja(r: DOMRect, margen: number): Partial<CSSStyleDeclaration> {
  return {
    position: "absolute",
    left: `${r.left - margen}px`,
    top: `${r.top - margen}px`,
    width: `${r.width + margen * 2}px`,
    height: `${r.height + margen * 2}px`,
  }
}

const enPantalla = (r: DOMRect) =>
  r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight

/** De dónde sale el clip: la opción elegida de la toma, su campo o su título. */
function origenDelClip(paso: PasoId) {
  const toma = document.querySelector(`[data-toma="${paso}"]`)
  if (!toma) return null
  return (
    toma.querySelector('[data-atajos] :is([data-state="checked"], [data-state="on"])') ??
    toma.querySelector('[data-opcion]:is([data-state="checked"], [data-state="on"])') ??
    toma.querySelector("[data-toma-foco]") ??
    toma.querySelector("#toma-titulo")
  )
}

/** A dónde llega: el segmento del timeline de la Mesa o, si no se ve, el de la tarjeta mini. */
function destinoDelClip(nav: HTMLElement | null, paso: PasoId) {
  const candidatos = [
    nav?.querySelector(`[data-segmento="${paso}"] [data-barra]`),
    document.querySelector(`[data-tarjeta-mini] [data-segmento="${paso}"]`),
  ]
  for (const c of candidatos) {
    if (c && enPantalla(c.getBoundingClientRect())) return c
  }
  return null
}

/** Al llegar, la marca de recorte encuadra el segmento un instante (`crop-in`). */
function encuadrar(r: DOMRect) {
  const marco = document.createElement("div")
  Object.assign(marco.style, caja(r, 5))
  const lado = "7px"
  const esquinas: Partial<CSSStyleDeclaration>[] = [
    { top: "0", left: "0", borderRight: "0", borderBottom: "0" },
    { top: "0", right: "0", borderLeft: "0", borderBottom: "0" },
    { bottom: "0", left: "0", borderRight: "0", borderTop: "0" },
    { bottom: "0", right: "0", borderLeft: "0", borderTop: "0" },
  ]
  for (const estilo of esquinas) {
    const e = document.createElement("span")
    Object.assign(e.style, {
      position: "absolute",
      width: lado,
      height: lado,
      border: "2px solid var(--crop-color)",
      borderRadius: "2px",
      ...estilo,
    })
    marco.appendChild(e)
  }
  capa().appendChild(marco)
  animarYQuitar(
    marco,
    [
      { opacity: 0, transform: "scale(1.35)", easing: EASE_BRAND },
      { opacity: 1, transform: "scale(1)", offset: 0.35 },
      { opacity: 1, transform: "scale(1)", offset: 0.7, easing: "ease-in" },
      { opacity: 0, transform: "scale(1)" },
    ],
    { duration: 700, easing: "linear" }
  )
}

/**
 * Con «reducir movimiento» el clip no vuela: aparece en su segmento con un
 * fundido y un anillo `--primary` de 600 ms. Solo opacidad.
 */
function anillo(r: DOMRect) {
  const halo = document.createElement("span")
  Object.assign(halo.style, {
    ...caja(r, 2),
    borderRadius: "9999px",
    background: "var(--primary)",
    boxShadow: "0 0 0 3px color-mix(in oklab, var(--primary) 45%, transparent)",
  })
  capa().appendChild(halo)
  animarYQuitar(
    halo,
    [
      { opacity: 0, easing: "ease-out" },
      { opacity: 1, offset: 0.25 },
      { opacity: 1, offset: 0.6, easing: "ease-in" },
      { opacity: 0 },
    ],
    { duration: ANILLO_CLIP_MS, easing: "linear" }
  )
}

/** WAAPI FLIP: una pastilla `primary` con la caja de la opción vuela hasta la barra. */
function viajar(desde: DOMRect, destino: Element) {
  const hasta = destino.getBoundingClientRect()
  if (prefiereMenosMovimiento()) return anillo(hasta)

  const clip = document.createElement("span")
  Object.assign(clip.style, {
    ...caja(desde, 0),
    borderRadius: "9999px",
    background: "var(--primary)",
    transformOrigin: "0 0",
  })
  capa().appendChild(clip)
  const sx = Math.max(hasta.width, 1) / Math.max(desde.width, 1)
  const sy = Math.max(hasta.height, 1) / Math.max(desde.height, 1)
  const dx = hasta.left - desde.left
  const dy = hasta.top - desde.top
  animarYQuitar(
    clip,
    [
      { transform: "translate(0px, 0px) scale(1, 1)", opacity: 0.35 },
      { opacity: 0.9, offset: 0.3 },
      { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: 1 },
    ],
    { duration: VIAJE_CLIP_MS, easing: EASE_BRAND },
    () => encuadrar(destino.getBoundingClientRect())
  )
}

/**
 * Timeline de tomas en la Mesa (§5.10): un `<ol>` con un segmento por toma,
 * `aria-current="step"` en la de ahora y, en cada una, su estado dicho
 * («Respondida», «Saltada», «Pendiente») y «Editar» si ya se puede abrir.
 * La saltada lleva borde discontinuo y, en lugar del nombre del paso, la
 * palabra «Saltada» a la vista (el nombre sigue en el `sr-only`). Cuando se
 * puede editar, el botón es el segmento entero: barra y etiqueta.
 *
 * Montaje: al responder una toma (`EVENTO_TOMA` con `respondida`), un clip
 * vuela desde la opción elegida hasta su segmento (WAAPI, 420 ms) y la marca de
 * recorte lo encuadra al llegar; con «reducir movimiento», el segmento se
 * enciende con un anillo en su sitio. La barra de la toma en curso se enciende
 * en color al llegar a ella (`[data-estado="actual"] [data-barra]`).
 */
export function TimelineTomas({
  pasos,
  actual,
  respondidos,
  saltados,
  puedeEditar,
  onEditar,
  className,
}: {
  pasos: readonly PasoId[]
  actual: PasoId
  respondidos: readonly PasoId[]
  saltados: readonly PasoId[]
  puedeEditar: (paso: PasoId) => boolean
  onEditar: (paso: PasoId) => void
  className?: string
}) {
  const t = useTranslations("onboarding.chrome")
  const tomas = pasos.filter((p) => !esRender(p))
  const ref = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    const alCambiar = (evento: Event) => {
      const d = (evento as CustomEvent<DetalleEventoToma>).detail
      if (!d || d.tipo !== "respondida" || !d.siguiente || esRender(d.siguiente)) return
      const origen = origenDelClip(d.paso)
      if (!origen || typeof HTMLElement.prototype.animate !== "function") return
      // El evento llega antes del cambio: la caja de origen se mide ya; el
      // destino, un fotograma después (el foco puede desplazar la página)
      const desde = origen.getBoundingClientRect()
      if (!enPantalla(desde)) return
      requestAnimationFrame(() => {
        const destino = destinoDelClip(ref.current, d.paso)
        if (destino) viajar(desde, destino)
      })
    }
    window.addEventListener(EVENTO_TOMA, alCambiar)
    return () => window.removeEventListener(EVENTO_TOMA, alCambiar)
  }, [])

  return (
    <nav ref={ref} aria-label={t("timeline.label")} className={className}>
      <ol className="flex gap-1.5 @3xl/bienvenida:gap-2">
        {tomas.map((p, i) => {
          const estado = estadoSegmento(p, actual, respondidos, saltados)
          const numero = String(i + 1).padStart(2, "0")
          const editable = estado !== "actual" && puedeEditar(p)
          // La barra y su etiqueta van juntas: quien puede editar la toma pulsa
          // el segmento entero, no solo el número (objetivo táctil de §5.9)
          const segmento = (
            <>
              <span
                aria-hidden
                data-barra=""
                className={cn(
                  "block h-1.5 rounded-full transition-[background-color,box-shadow,border-color] duration-(--duration-base)",
                  estado === "respondida" && "bg-primary",
                  estado === "actual" && "bg-primary/35 ring-1 ring-primary",
                  estado === "saltada" && "border border-dashed border-muted-foreground",
                  estado === "pendiente" && "bg-muted"
                )}
              />
              <span className="mt-1.5 flex max-w-full items-center gap-1.5 text-xs">
                <span className="tabular text-muted-foreground" aria-hidden>
                  {numero}
                </span>
                {estado === "saltada" ? (
                  // La saltada enseña su estado en lugar del nombre: los dos
                  // truncados en el mismo hueco se leían «Tus creado… Salta…».
                  // El nombre del paso sigue en el `sr-only` de abajo.
                  <span className="truncate text-muted-foreground" aria-hidden>
                    {t("timeline.estado.saltada")}
                  </span>
                ) : (
                  <span
                    className={cn(
                      "hidden truncate @3xl/bienvenida:inline",
                      estado === "actual"
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {t(`pasos.${p}`)}
                  </span>
                )}
                <span className="sr-only">
                  {t("timeline.item", {
                    n: i + 1,
                    paso: t(`pasos.${p}`),
                    estado: t(`timeline.estado.${estado}`),
                  })}
                </span>
              </span>
            </>
          )
          return (
            <li
              key={p}
              data-segmento={p}
              data-estado={estado}
              aria-current={estado === "actual" ? "step" : undefined}
              // `flex-auto`: cada segmento se queda con el ancho que pide su
              // nombre y reparte el sobrante; a partes iguales se cortaba en
              // inglés y en portugués
              className="min-w-0 flex-auto"
            >
              {editable ? (
                <button
                  type="button"
                  onClick={() => onEditar(p)}
                  className="flex min-h-11 w-full flex-col rounded-sm text-left underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {segmento}
                  <span className="sr-only">{t("actions.edit")}</span>
                </button>
              ) : (
                <span className="flex min-h-11 w-full flex-col">{segmento}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
