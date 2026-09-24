"use client"

import * as React from "react"
import { Check, Clock } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { formatDuration } from "@/lib/format"
import { EASE_BRAND, prefiereMenosMovimiento } from "@/lib/motion"
import { ASPECT_RATIOS } from "@/lib/video-formats"
import { socialList, type SocialId } from "@/lib/social"
import { useMotionGroup } from "@/hooks/use-motion-group"
import { Badge } from "@/components/ui/badge"
import { CropFrame } from "@/components/brand/logo"
import { SocialBadge } from "@/components/brand/social"
import { MediaFrame } from "@/components/video/media-frame"

/** Alto fijo del escenario; la publicación usa el mismo 9:16 en cada red. */
const ALTO = "clamp(16rem, 34vh, 24rem)"

/** La caja del marco siempre representa el único formato de publicación: 9:16. */
const PROPORCION_PUBLICACION = ASPECT_RATIOS["9:16"].ratio

/** Lo que hace el producto con cada red: `marketing.networks.bullets.<id>`. */
const VENTAJAS = ["formats", "limit", "schedule"] as const

/**
 * Tiempo con la misma red elegida (puntero quieto, foco o clic) antes de
 * re-encuadrar: pasar el ratón por la lista no relanza el gesto seis veces.
 */
const ESPERA_REENCUADRE = 120

/** Distancia, en px, desde la que vuelven a cerrarse las esquinas. */
const HUECO_ESQUINAS = 12

/**
 * Re-encuadre sobre el formato nuevo: las esquinas vuelven a cerrarse una tras
 * otra y el patrón destella. Con «reducir movimiento» las esquinas aparecen en
 * su sitio, sin acercarse. Solo opacidad y `translate`, sin relleno hacia
 * delante: al terminar manda el CSS. Devuelve las animaciones para cancelarlas
 * si llega otro cambio.
 */
function reencuadrar(escenario: HTMLElement): Animation[] {
  const reducir = prefiereMenosMovimiento()
  const animaciones: Animation[] = []

  // Si el escenario aún espera a entrar en pantalla, su entrada ya las cerrará
  if (escenario.dataset.motionState !== "idle") {
    for (const esquina of escenario.querySelectorAll<HTMLElement>("[data-crop-corner]")) {
      // Dirección (--cx, --cy) y orden (--c) de cada esquina: app/motion/base.css
      const cs = getComputedStyle(esquina)
      const leer = (variable: string) =>
        Number.parseFloat(cs.getPropertyValue(variable)) || 0
      const [cx, cy, c] = [leer("--cx"), leer("--cy"), leer("--c")]
      animaciones.push(
        esquina.animate(
          reducir
            ? [{ opacity: 0 }, { opacity: 1 }]
            : [
                {
                  opacity: 0,
                  translate: `${cx * HUECO_ESQUINAS}px ${cy * HUECO_ESQUINAS}px`,
                },
                { opacity: 1, translate: "0px 0px" },
              ],
          // `backwards`: mientras espera su turno, la esquina ya está apagada
          { duration: 450, delay: c * 40, easing: EASE_BRAND, fill: "backwards" }
        )
      )
    }
  }

  const patron = escenario.querySelector<HTMLElement>("[data-redes-patron]")
  const base = patron ? Number.parseFloat(getComputedStyle(patron).opacity) : NaN
  if (patron && Number.isFinite(base)) {
    animaciones.push(
      patron.animate([{ opacity: base }, { opacity: base * 2 }, { opacity: base }], {
        duration: 500,
        easing: "ease-in-out",
      })
    )
  }
  return animaciones
}

/**
 * Con «reducir movimiento» el formato cambia al instante (app/motion/redes.css)
 * y lo que se ve es el marco fundiéndose, en el mismo fotograma del cambio.
 * `ease-out` en 300 ms: con --ease-brand el fundido estaba casi hecho en el
 * primer fotograma y no se leía.
 */
function fundirMarco(escenario: HTMLElement) {
  return escenario
    .querySelector<HTMLElement>("[data-redes-marco]")
    ?.animate([{ opacity: 0.5 }, { opacity: 1 }], { duration: 300, easing: "ease-out" })
}

/**
 * «Un corte, seis destinos».
 *
 * La sección enseña que un mismo clip vertical 9:16 puede prepararse para cada
 * destino. Al elegir una red cambian sus límites de duración y su superficie.
 *
 * El marco conserva la proporción 9:16 en todos los destinos. El borde y las
 * esquinas usan el gesto de marca al cambiar de red sin desplazar el layout.
 *
 * Movimiento (AGENTS.md, reglas 5 y 6; CSS en app/motion/redes.css):
 * - Al entrar en pantalla, el titular se corta a 12 fps y el antetítulo y la
 *   entradilla suben (grupo de la columna de texto); las esquinas del escenario
 *   se cierran (grupo del escenario). La lista de redes no se anima.
 * - Al elegir otra red, tras 120 ms las esquinas vuelven a cerrarse y el patrón
 *   destella; el rótulo de destino entra en fundido.
 * - Con «reducir»: fundidos en su sitio y sin desplazamiento de los botones.
 */
export function Redes() {
  const t = useTranslations("marketing.networks")
  const tc = useTranslations("common")
  const [activa, setActiva] = React.useState<SocialId>("tiktok")
  const red = socialList.find((r) => r.id === activa) ?? socialList[0]
  const aspecto = red.aspects[0]
  const ratio = ASPECT_RATIOS[aspecto].ratio

  const texto = React.useRef<HTMLDivElement>(null)
  const escenario = React.useRef<HTMLDivElement>(null)
  useMotionGroup(texto)
  useMotionGroup(escenario)

  /** Red del último cambio atendido y animaciones del re-encuadre en curso. */
  const redPrevia = React.useRef(activa)
  const tanda = React.useRef<Animation[]>([])
  const fundido = React.useRef<Animation | undefined>(undefined)

  // Antes de pintar, para que con «reducir» el fundido cubra el salto de ancho
  React.useLayoutEffect(() => {
    const el = escenario.current
    // Se compara con la red anterior y no con una bandera de «primer montaje»:
    // el doble efecto de StrictMode ve la misma red y tampoco re-encuadra
    if (!el || redPrevia.current === activa) return
    redPrevia.current = activa
    // Desde el primer cambio, cada rótulo nuevo entra en fundido (.m-swap)
    el.dataset.redesCambio = ""

    if (prefiereMenosMovimiento()) {
      fundido.current?.cancel()
      fundido.current = fundirMarco(el)
    }

    const espera = window.setTimeout(() => {
      for (const animacion of tanda.current) animacion.cancel()
      tanda.current = reencuadrar(el)
    }, ESPERA_REENCUADRE)
    return () => window.clearTimeout(espera)
  }, [activa])

  // overflow-x-clip: a 320 px el 16:9 sale por la derecha a propósito; sin recorte, la
  // página hacía scroll lateral
  return (
    <section
      id="redes"
      className="container-page scroll-mt-24 overflow-x-clip py-20 md:py-28"
    >
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,32rem)_1fr] lg:gap-16">
        {/* Texto y selector */}
        <div ref={texto} data-motion-group="client">
          <p className="m-anim m-rise text-sm font-semibold tracking-wide text-brand uppercase">
            {t("eyebrow")}
          </p>
          <h2 className="m-anim m-cut mt-3 display text-[clamp(1.75rem,3.4vw,2.75rem)] [--i:1]">
            {t.rich("title", { br: () => <br /> })}
          </h2>
          <p className="m-anim m-rise mt-5 max-w-md text-lg text-pretty text-muted-foreground [--i:2]">
            {t("lead")}
          </p>

          <ul className="mt-8 grid gap-2 sm:grid-cols-2" aria-label={t("list")}>
            {socialList.map((r) => {
              const activo = r.id === activa
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiva(r.id)}
                    onFocus={() => setActiva(r.id)}
                    onClick={() => setActiva(r.id)}
                    aria-pressed={activo}
                    className={cn(
                      "m-red-boton flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left focus-visible:outline-ring",
                      "transition-[border-color,background-color,box-shadow,translate] duration-200 ease-[var(--ease-brand)]",
                      "hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2",
                      activo
                        ? "border-brand/50 bg-brand-subtle/50 shadow-sm"
                        : "border-border bg-card hover:border-primary/30"
                    )}
                  >
                    <SocialBadge network={r.id} size="sm" tone="marca" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {r.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {tc(`social.surface.${r.id}`)}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                      {r.aspects[0]}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          {/* Dato útil, no adorno: lo que cada red admite */}
          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="brand-subtle" className="gap-1">
              <Clock aria-hidden />{" "}
              {t("sweetSpot", {
                min: formatDuration(red.sweetSpot[0]),
                max: formatDuration(red.sweetSpot[1]),
              })}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {t("sweetSpotNote", {
                network: red.name,
                max: formatDuration(red.maxSeconds),
              })}
            </span>
          </div>

          <ul className="mt-5 space-y-1.5 text-sm text-muted-foreground">
            {VENTAJAS.map((id) => (
              <li key={id} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {t(`bullets.${id}`)}
              </li>
            ))}
          </ul>
        </div>
        {/* Escenario */}
        <div
          ref={escenario}
          data-motion-group="client"
          className="m-crop-corners relative grid place-items-center overflow-hidden rounded-frame bg-stage p-8 [--m-crop-at:200ms]"
          style={{ minHeight: `calc(${ALTO} + 6rem)` }}
        >
          <div
            aria-hidden
            data-redes-patron
            className="absolute inset-0 pattern-isotipos opacity-[0.16]"
          />

          {/* Ancho completo y fijo: el formato se recorta dentro (redes.css) */}
          <div
            className="m-redes-columna relative flex w-full min-w-0 flex-col items-center gap-5"
            style={
              {
                "--redes-alto": ALTO,
                "--redes-proporcion": ratio,
                "--redes-proporcion-max": PROPORCION_PUBLICACION,
              } as React.CSSProperties
            }
          >
            <CropFrame size="md" className="m-redes-encuadre">
              <div
                data-redes-marco
                className="m-redes-marco border-white/15"
                style={{
                  height: ALTO,
                  width: `calc(${ALTO} * ${PROPORCION_PUBLICACION})`,
                }}
              >
                {/* Sobre el escenario oscuro el marco necesita su propio borde.
                    Recortado, lo pintan los medios marcos de .m-redes-marco con
                    el color de `border-white/15`, el mismo que `ring-white/15`. */}
                <MediaFrame
                  aspect={aspecto}
                  className="m-redes-media h-full w-full bg-white/8 ring-white/15"
                />
              </div>
            </CropFrame>

            <p
              aria-live="polite"
              // A lo ancho de la columna: el texto de cada red mide distinto y,
              // ajustado a su contenido y centrado, el `p` se desplazaba (CLS)
              className="w-full text-center text-sm font-medium text-stage-foreground"
            >
              {/* Un nodo por red: el fundido se relanza, pero el `p` que se
                  anuncia es el mismo y cada cambio se lee una sola vez */}
              <span key={activa} className="m-swap block">
                {red.name} · {aspecto}
                <span className="block text-xs opacity-70">
                  {tc(`social.surface.${red.id}`)} · {tc(`video.aspect.${aspecto}.label`)}
                </span>
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
