"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { clamp } from "@/lib/format"
import { prefiereMenosMovimiento } from "@/lib/motion"
import { useScrollProgress } from "@/hooks/use-scroll-progress"
import { PatternIsotipos } from "@/components/brand/patterns"

/**
 * Planos del montaje con «reducir movimiento»: 16:9, 1:1, 4:5 y 9:16 (los
 * formatos de Multiformato, de más ancho a más estrecho). `app/motion/reframe.css`
 * calcula el recorte de cada plano desde su proporción y divide entre
 * `PLANOS_REFRAME - 1` (3) la selección: si cambia aquí, cambia allí.
 */
export const PLANOS_REFRAME = 4

/** Fundido del marco en cada corte de montaje, en ms. */
export const DURACION_CORTE = 300

/**
 * Plano del montaje (0 a 3) para un progreso de scroll (0 a 1). Usa el mismo
 * tramo útil que `--t` en CSS ([0,12 – 0,72]): cada plano coincide con el punto
 * del recorrido continuo que representa y los dos intermedios duran lo mismo.
 */
export function planoReframe(progreso: number): number {
  if (!Number.isFinite(progreso)) return 0
  const t = clamp((progreso - 0.12) / 0.6, 0, 1)
  return Math.round(t * (PLANOS_REFRAME - 1))
}

/**
 * "De horizontal a vertical" (módulo 06).
 *
 * El scroll comprime el frame 16:9 hasta 9:16 mientras la línea del tiempo
 * marca el fragmento elegido. Es la promesa del producto explicada sin texto.
 *
 * La interpolación la hace CSS (`app/motion/reframe.css`) a partir de la
 * variable `--progress` que el hook escribe en el nodo. Ni un render de React
 * por frame, y sin la dependencia de animación: eran 143 kB de los 964 kB de la
 * landing para este único efecto. El marco se recorta con `clip-path` en vez de
 * cambiar de ancho: así no desplaza el layout (CLS) mientras se hace scroll.
 *
 * Con «reducir movimiento» (sistema o `?movimiento=reducido`) la historia no se
 * congela en el estado final: se monta en cuatro planos ligados al scroll, cada
 * uno con la proporción de su formato. El hook escribe también `--plano` y, al
 * cambiar de plano, el marco funde de 0,35 a 1 como un corte de montaje. Sin JS
 * se ve el estado final (regla 8).
 */
export function Reframe() {
  const t = useTranslations("marketing.reframe")
  const seccion = React.useRef<HTMLElement>(null)
  const marco = React.useRef<HTMLDivElement>(null)
  /** Último plano escrito; `null` hasta la primera medida, que nunca funde. */
  const plano = React.useRef<number | null>(null)
  const corte = React.useRef<Animation | null>(null)

  useScrollProgress(seccion, {
    onProgress: (progreso) => {
      const nuevo = planoReframe(progreso)
      const anterior = plano.current
      if (nuevo === anterior) return
      plano.current = nuevo
      seccion.current?.style.setProperty("--plano", String(nuevo))

      // La geometría por planos la decide el CSS; el fundido del corte, solo
      // con «reducir». Montar (o recargar a mitad de sección) no es un corte.
      // `ease-out` en 300 ms: con --ease-brand el fundido estaba casi hecho en
      // el primer fotograma y el corte no se leía.
      if (anterior === null || !prefiereMenosMovimiento()) return
      corte.current?.cancel()
      corte.current =
        marco.current?.animate([{ opacity: 0.35 }, { opacity: 1 }], {
          duration: DURACION_CORTE,
          easing: "ease-out",
        }) ?? null
    },
  })

  return (
    <section
      id="como-funciona"
      ref={seccion}
      className="reframe-section relative h-[240vh] scroll-mt-0 bg-ink-950"
    >
      <div className="reframe-stage sticky top-0 flex h-svh flex-col items-center justify-center overflow-hidden px-5">
        <PatternIsotipos opacity={0.1} fade="edges" />

        <h2 className="relative max-w-xl text-center display text-[clamp(1.75rem,5vw,3rem)] text-ink-50">
          {t.rich("title", { br: () => <br /> })}
        </h2>

        {/* La caja no cambia de tamaño: el marco de dentro se recorta con
            `clip-path` (reframe.css). El rótulo final va fuera del recorte
            para que en móvil estrecho no se corte. */}
        <div className="reframe-encuadre relative mt-8 h-[42vh] w-full max-w-[56rem] sm:mt-10 sm:h-[46vh]">
          <div
            ref={marco}
            className="reframe-marco absolute inset-0 overflow-hidden rounded-frame border-white/10 bg-white/5"
          >
            <PatternIsotipos opacity={0.22} />

            <span className="reframe-label reframe-original absolute inset-0 grid place-items-center px-4 text-center text-xs text-mist/85 sm:text-sm">
              <span className="rounded-md bg-ink-950/60 px-3 py-1.5 backdrop-blur-sm">
                {t("original")}
              </span>
            </span>
          </div>

          <span className="reframe-label reframe-ready absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-brand-foreground">
            {t("ready")}
          </span>
        </div>

        {/* Línea del tiempo (módulo 05) */}
        <div className="relative mt-8 h-2.5 w-full max-w-2xl overflow-hidden rounded-full bg-white/15 sm:mt-10 sm:h-3">
          <span className="reframe-seleccion absolute inset-0 rounded-full bg-brand" />
        </div>
        <p className="relative mt-4 text-sm text-mist/60">{t("caption")}</p>
      </div>
    </section>
  )
}
