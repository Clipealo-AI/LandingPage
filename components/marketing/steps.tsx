import * as React from "react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { MediaFrame } from "@/components/video/media-frame"

/**
 * Título y texto: `marketing.steps.<id>.title|body`.
 * `orden`: escalonado de entrada solo en escritorio, donde los tres pasos
 * entran a la vez (clase literal; en móvil cada paso entra al llegar).
 */
const STEPS = [
  { id: "full", n: "01", aspect: "16:9", cropped: false, orden: "md:[--i:0]" },
  { id: "moment", n: "02", aspect: "16:9", cropped: true, orden: "md:[--i:1]" },
  { id: "ready", n: "03", aspect: "9:16", cropped: false, orden: "md:[--i:2]" },
] as const

/**
 * Los numeros 01/02/03 solo aparecen aqui, donde hay una secuencia real.
 *
 * Movimiento (E5 y E12, app/motion/base.css): el titular es su propio grupo y
 * se corta a 12 fps. Cada paso es otro grupo: su marco sube, el número hace
 * «pop» cuando el marco llega (250 ms, con la curva de marca ya ha recorrido
 * el 95 %) y en el paso 02 las esquinas se cierran al terminar la entrada. Con
 * «reducir», todo en fundido en su sitio.
 */
export function Steps() {
  const t = useTranslations("marketing.steps")

  return (
    <section className="bg-secondary py-20 text-secondary-foreground md:py-28">
      <div className="container-page">
        <h2
          data-motion-group=""
          className="m-anim m-cut max-w-lg display text-[clamp(2rem,5vw,3.25rem)]"
        >
          {t.rich("title", { br: () => <br /> })}
        </h2>

        <ol className="mt-14 grid gap-12 md:grid-cols-3 md:gap-8">
          {STEPS.map((step) => (
            <li
              key={step.n}
              data-motion-group=""
              className={cn(
                step.orden,
                // El único gesto de marca de recorte de la sección
                step.cropped && "m-crop-corners [--m-crop-at:600ms]"
              )}
            >
              {/* Alto fijo para que los tres frames compartan linea base pese al ratio */}
              <div className="flex h-56 items-end justify-center sm:h-64">
                <div className="m-anim m-rise w-full max-w-[220px]">
                  <MediaFrame
                    aspect={step.aspect}
                    cropped={step.cropped}
                    className="ring-transparent"
                  />
                </div>
              </div>

              <div className="mt-8 flex items-baseline gap-3">
                <span className="m-anim m-pop display text-3xl text-primary tabular-nums [--m-at:250ms]">
                  {step.n}
                </span>
                <h3 className="text-[19px] font-bold tracking-tight">
                  {t(`${step.id}.title`)}
                </h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed opacity-75">
                {t(`${step.id}.body`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
