"use client"

import * as React from "react"

import { observeMotionGroup } from "@/lib/motion"

/**
 * Grupo de movimiento «al entrar en pantalla» dentro de un componente cliente.
 *
 * El elemento lleva `data-motion-group="client"` (así `<MotionObserver />` no lo
 * observa dos veces) y sus hijos animados, las clases de `app/motion/base.css`
 * (`m-anim m-rise`…). El estado lo escribe `lib/motion.ts` en
 * `data-motion-state` después de hidratar: no hay avisos de hidratación y un
 * nuevo render no lo borra.
 *
 * `onPlay` se llama una vez, cuando el grupo empieza a animarse (nunca si ya se
 * veía al hidratar). Puede cambiar entre renders sin volver a observar.
 */
export function useMotionGroup<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  { onPlay }: { onPlay?: (el: T) => void } = {}
) {
  const alReproducir = React.useEffectEvent((el: T) => onPlay?.(el))

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    return observeMotionGroup(el, () => alReproducir(el))
  }, [ref])
}
