"use client"

import * as React from "react"

import { cropSnap } from "@/lib/effects"
import { isSoundName, playSound } from "@/lib/sound"

const OBJETIVOS = '[data-sound], [data-effect], [role="switch"], [role="radio"]'

/**
 * Respuesta sonora y visual a las pulsaciones, delegada en un solo listener.
 *
 * Así los botones siguen siendo componentes de servidor: declaran lo que
 * merecen con atributos (`data-sound`, `data-effect`, que `Button` pone solo en
 * la variante `brand`) y aquí se ejecuta. Además, sin tocar los primitivos:
 * - un interruptor (`role="switch"`) suena al encenderse y al apagarse;
 * - elegir una opción nueva de un grupo (`role="radio"`) hace «tap».
 *
 * Escucha `click` en captura: llega antes que el manejador del componente, así
 * que el estado que se lee (`aria-checked`) es el anterior al cambio, y cubre
 * teclado (Enter, Espacio) y las etiquetas asociadas, que también emiten click.
 */
export function InteractionFeedback() {
  React.useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const origen = event.target
      if (!(origen instanceof Element)) return
      const el = origen.closest<HTMLElement>(OBJETIVOS)
      if (!el) return
      if (el.matches(':disabled, [aria-disabled="true"], [data-disabled]')) return

      const { sound, effect } = el.dataset
      if (sound) {
        if (isSoundName(sound)) playSound(sound)
      } else if (el.getAttribute("role") === "switch") {
        playSound(el.getAttribute("aria-checked") === "true" ? "toggle-off" : "toggle-on")
      } else if (
        el.getAttribute("role") === "radio" &&
        el.getAttribute("aria-checked") !== "true"
      ) {
        playSound("tap")
      }

      if (effect === "crop") cropSnap(el)
    }

    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [])

  return null
}
