"use client"

import * as React from "react"

import { clamp } from "@/lib/format"

export interface UseScrollProgressOptions {
  /** Nombre de la variable CSS que se escribe en el elemento. */
  property?: string
  /** Si es `true`, no se engancha al scroll. */
  disabled?: boolean
  /**
   * Se llama con el progreso (0-1) en el mismo frame en que se escribe la
   * variable, también al montar. Para efectos que dependen de cruzar un umbral
   * (los planos del reencuadre con «reducir movimiento»): escribe en el DOM, no
   * en estado de React. Puede cambiar entre renders sin volver a engancharse.
   */
  onProgress?: (progreso: number) => void
}

/**
 * Progreso de scroll de un elemento alto, escrito como variable CSS.
 *
 * Va de 0 cuando el borde superior del elemento llega al alto de la ventana a 1
 * cuando llega el inferior — el mismo tramo que `["start start", "end end"]`.
 *
 * **No provoca ningún render de React.** Escribe directamente en el estilo del
 * nodo, así que la interpolación la hace CSS con `calc()`. Sustituye a
 * `useScroll` + `useTransform` de Motion: mismo efecto, ~1 kB en vez de 143 kB,
 * y sin depender de que la librería soporte cada navegador.
 */
export function useScrollProgress(
  ref: React.RefObject<HTMLElement | null>,
  { property = "--progress", disabled = false, onProgress }: UseScrollProgressOptions = {}
) {
  const alProgresar = React.useEffectEvent((progreso: number) => onProgress?.(progreso))

  React.useEffect(() => {
    const node = ref.current
    if (!node || disabled) return

    let frame = 0

    const update = () => {
      frame = 0
      const rect = node.getBoundingClientRect()
      const recorrido = rect.height - window.innerHeight
      const progreso = recorrido <= 0 ? 0 : clamp(-rect.top / recorrido, 0, 1)
      node.style.setProperty(property, String(progreso))
      alProgresar(progreso)
    }

    // El scroll dispara muchas veces por frame: se agrupa en uno solo
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [ref, property, disabled])
}
