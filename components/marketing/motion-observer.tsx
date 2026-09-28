"use client"

import * as React from "react"

import { observeMotionGroup } from "@/lib/motion"

const GRUPOS_DE_SERVIDOR = 'main [data-motion-group]:not([data-motion-group="client"])'

/**
 * Observa los grupos de movimiento de las secciones de servidor de la landing
 * (`data-motion-group` sin valor). Los de componentes cliente se observan solos
 * con `useMotionGroup`.
 *
 * Va como último hijo de la página: su efecto corre después de hidratar, así
 * que lo que ya se ve queda «static» sin haberse ocultado nunca. Donde no se
 * monta (/precios, el design system) no hay estado y todo se ve terminado.
 */
export function MotionObserver() {
  React.useEffect(() => {
    const grupos = Array.from(document.querySelectorAll<HTMLElement>(GRUPOS_DE_SERVIDOR))
    // Primero todas las medidas y después los atributos: un solo cálculo de layout
    const cajas = grupos.map((el) => el.getBoundingClientRect())
    const limpiezas = grupos.map((el, i) => observeMotionGroup(el, undefined, cajas[i]))
    return () => limpiezas.forEach((limpiar) => limpiar())
  }, [])

  return null
}
