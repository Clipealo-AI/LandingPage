import * as React from "react"
import Image from "next/image"
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
              {/* Un mismo fotograma en los tres pasos: el cambio de formato se
                  entiende sin inventar tres capturas distintas del producto. */}
              <div className="flex h-56 items-end justify-center sm:h-64">
                <div
                  className={cn(
                    "m-anim m-rise w-full",
                    step.id === "ready"
                      ? "max-w-[145px] sm:max-w-[155px]"
                      : "max-w-[290px]"
                  )}
                >
                  <MediaFrame
                    aspect={step.aspect}
                    cropped={step.cropped}
                    className="shadow-lg ring-white/15"
                  >
                    <Image
                      src="/media/podcast-source.webp"
                      alt=""
                      fill
                      sizes={
                        step.id === "ready" ? "155px" : "(max-width: 640px) 290px, 26vw"
                      }
                      className={cn(
                        "object-cover",
                        step.id === "ready" && "object-[76%_center]"
                      )}
                    />
                    {step.id === "moment" && (
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-ink-950/45 via-transparent to-ink-950/15"
                        aria-hidden
                      />
                    )}
                    {step.id === "ready" && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/90 to-transparent px-2.5 pt-14 pb-4 text-center text-xs leading-tight font-semibold text-white">
                        {t("previewCaption")}
                      </div>
                    )}
                  </MediaFrame>
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
