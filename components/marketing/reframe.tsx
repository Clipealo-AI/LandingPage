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

/** El encuadre acompaña a quien tiene la palabra en el clip de diez segundos. */
export function protagonistaEn(tiempo: number): "man" | "woman" {
  return tiempo >= 3.62 && tiempo < 7.91 ? "woman" : "man"
}

/**
 * Plano del montaje reducido (0 a 3) para un progreso de scroll (0 a 1).
 * Las pausas 1:1 y 9:16 duran lo mismo (75,6vh de recorrido), un 50 % más que
 * antes. La curva completa está definida en CSS; aquí se usan las mismas
 * proporciones para el montaje con movimiento reducido.
 */
export function planoReframe(progreso: number): number {
  if (!Number.isFinite(progreso)) return 0
  const t = clamp(progreso, 0, 1)
  if (t < 0.113872) return 0
  if (t < 0.505176) return 1
  if (t < 0.608696) return 2
  return 3
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
  const video = React.useRef<HTMLVideoElement>(null)
  const videoFlujo = React.useRef<HTMLVideoElement>(null)
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

  React.useEffect(() => {
    const media = video.current
    const frame = marco.current
    if (!media || !frame) return

    let visible = false
    let cargado = false
    let callback = 0
    const enfocar = (tiempo: number) => {
      const persona = protagonistaEn(tiempo)
      if (frame.dataset.speaker !== persona) frame.dataset.speaker = persona
    }
    const alActualizarTiempo = () => enfocar(media.currentTime)
    const alFotograma: VideoFrameRequestCallback = (_ahora, datos) => {
      enfocar(datos.mediaTime)
      callback = media.requestVideoFrameCallback(alFotograma)
    }

    // El recurso se solicita una sola vez, al acercarse a la sección. El
    // fotograma de portada ya ocupa exactamente la caja reservada.
    const sincronizar = () => {
      if (!visible || prefiereMenosMovimiento()) {
        media.pause()
        return
      }
      if (!cargado) {
        media.src = "/media/podcast-loop.mp4"
        media.load()
        cargado = true
      }
      void Promise.resolve(media.play()).catch(() => {
        // Si el navegador bloquea la reproducción, permanece la portada.
      })
    }

    media.addEventListener("timeupdate", alActualizarTiempo)
    media.addEventListener("seeked", alActualizarTiempo)
    if ("requestVideoFrameCallback" in media) {
      callback = media.requestVideoFrameCallback(alFotograma)
    }

    const observador =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entradas) => {
              visible = entradas[0]?.isIntersecting ?? false
              sincronizar()
            },
            { rootMargin: "200px 0px" }
          )
    if (observador) observador.observe(media)
    else {
      visible = true
      sincronizar()
    }

    const preferencia = new MutationObserver(sincronizar)
    preferencia.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-motion"],
    })

    return () => {
      observador?.disconnect()
      preferencia.disconnect()
      media.removeEventListener("timeupdate", alActualizarTiempo)
      media.removeEventListener("seeked", alActualizarTiempo)
      if (callback) media.cancelVideoFrameCallback(callback)
      media.pause()
    }
  }, [])

  React.useEffect(() => {
    const media = videoFlujo.current
    if (!media) return

    let cargado = false
    const reproducir = () => {
      if (!cargado) {
        media.src = "/media/workflow-social-clips-720p.mp4"
        media.load()
        cargado = true
      }
      void media.play().catch(() => {
        // El póster queda visible si el navegador o el dispositivo bloquea autoplay.
      })
    }
    const pausar = () => media.pause()
    const observador =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            ([entrada]) => {
              if (entrada?.isIntersecting) reproducir()
              else pausar()
            },
            { rootMargin: "180px 0px" }
          )

    if (observador) observador.observe(media)
    else reproducir()

    return () => {
      observador?.disconnect()
      media.pause()
      if (cargado) {
        media.removeAttribute("src")
        media.load()
      }
    }
  }, [])

  return (
    <>
      <section
        id="como-funciona"
        ref={seccion}
        className="reframe-section relative h-[340.8vh] scroll-mt-0 bg-ink-950"
      >
        <div className="reframe-stage sticky top-0 flex h-svh flex-col items-center justify-center overflow-hidden px-5">
          <PatternIsotipos opacity={0.08} fade="edges" />

          <h2 className="relative mx-auto max-w-3xl text-center display text-[clamp(1.75rem,4.4vw,3rem)] text-ink-50">
            {t.rich("title", { br: () => <br /> })}
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-mist/75 sm:text-base">
            {t("lead")}
          </p>

          {/* Caja 16:9 fija; el recorte y el foco cambian sin mover el layout. */}
          <div className="reframe-encuadre relative mx-auto mt-7 aspect-video w-[min(100%,56rem,calc(52svh*16/9))] sm:mt-9">
            <div
              ref={marco}
              data-speaker="man"
              className="reframe-marco absolute inset-0 overflow-hidden rounded-frame border-white/20 bg-ink-900"
            >
              <video
                ref={video}
                className="reframe-foto absolute inset-0 h-full w-full object-cover"
                poster="/media/podcast-loop-poster.avif"
                preload="none"
                autoPlay
                muted
                loop
                playsInline
                disablePictureInPicture
                disableRemotePlayback
                aria-label={t("sourceAlt")}
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-ink-950/60 via-transparent to-transparent"
                aria-hidden
              />
              <span className="reframe-label reframe-original absolute bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-ink-950/80 px-3 py-1.5 text-xs whitespace-nowrap text-mist backdrop-blur-sm sm:text-sm">
                {t("original")}
              </span>
            </div>

            <span className="reframe-label reframe-square absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-brand-foreground">
              {t("square")}
            </span>
            <span className="reframe-label reframe-ready absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-brand-foreground">
              {t("ready")}
            </span>
          </div>

          <div className="relative mx-auto mt-7 h-2.5 w-full max-w-2xl overflow-hidden rounded-full bg-white/15 sm:mt-9 sm:h-3">
            <span className="reframe-seleccion absolute inset-0 rounded-full bg-brand" />
          </div>
          <p className="relative mx-auto mt-4 text-center text-sm text-mist/70">
            {t("caption")}
          </p>
        </div>
      </section>

      <section
        className="relative overflow-hidden bg-ink-950 py-20 text-ink-50 [--cut-color:var(--color-brand-500)] md:py-28"
        aria-labelledby="reframe-video-title"
      >
        <div
          data-motion-group=""
          className="container-page grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16"
        >
          <div className="max-w-xl">
            <p className="m-anim m-rise text-sm font-semibold tracking-wide text-brand uppercase">
              {t("videoEyebrow")}
            </p>
            <h3
              id="reframe-video-title"
              className="m-anim m-cut mt-4 display text-[clamp(2rem,3vw,3rem)] leading-[1.1] [--i:1]"
            >
              {t("videoTitle")}
            </h3>
            <p className="m-anim m-rise mt-6 max-w-md text-base leading-relaxed text-mist/75 [--i:2] sm:text-lg">
              {t("videoLead")}
            </p>
          </div>
          <div className="m-anim m-rise overflow-hidden rounded-frame border border-white/15 bg-ink-900 shadow-xl [--i:3]">
            <video
              ref={videoFlujo}
              className="block aspect-video w-full bg-ink-900 object-cover"
              poster="/media/workflow-social-clips-poster-frame-000.avif"
              preload="none"
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              disableRemotePlayback
              aria-label={t("videoLabel")}
            >
              {t("videoFallback")}
            </video>
          </div>
        </div>
      </section>
    </>
  )
}
