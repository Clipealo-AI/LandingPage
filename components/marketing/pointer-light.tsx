"use client"

import * as React from "react"

/**
 * Luz bajo el puntero (E11): un foco suave que sigue al ratón dentro de las
 * tarjetas con `data-light` («claro» o «tinta»). El aspecto está en
 * `app/motion/base.css`; aquí solo se marca la tarjeta (`data-lit`) y se
 * escribe la posición (`--mx`, `--my`).
 *
 * Fuera de React a propósito: tres listeners delegados y pasivos en el
 * documento, un `requestAnimationFrame` por movimiento y sin estado, así que
 * mover el ratón no vuelve a pintar ningún componente. La caja de la tarjeta se
 * mide al entrar y se invalida con el scroll y el cambio de tamaño.
 *
 * Solo con ratón (`hover: hover` y `pointer: fine`): en táctil no hay puntero
 * que seguir. La luz no suena ni se reduce: es luz, no movimiento.
 */
export function PointerLight() {
  React.useEffect(() => {
    if (!window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) return

    let actual: HTMLElement | null = null
    let caja: DOMRect | null = null
    let x = 0
    let y = 0
    let frame = 0

    const pintar = () => {
      frame = 0
      if (!actual) return
      caja ??= actual.getBoundingClientRect()
      actual.style.setProperty("--mx", `${Math.round(x - caja.left)}px`)
      actual.style.setProperty("--my", `${Math.round(y - caja.top)}px`)
    }
    const programar = () => {
      if (!frame) frame = requestAnimationFrame(pintar)
    }
    const apagar = () => {
      if (actual) delete actual.dataset.lit
      actual = null
      caja = null
    }

    const onOver = (event: PointerEvent) => {
      if (event.pointerType === "touch") return
      const destino = event.target instanceof Element ? event.target : null
      const tarjeta = destino?.closest<HTMLElement>("[data-light]") ?? null
      if (tarjeta === actual) return
      apagar()
      if (!tarjeta) return
      actual = tarjeta
      x = event.clientX
      y = event.clientY
      // La posición antes que la luz: si no, el foco nace en el centro y viaja
      pintar()
      tarjeta.dataset.lit = ""
    }
    const onMove = (event: PointerEvent) => {
      if (!actual || event.pointerType === "touch") return
      x = event.clientX
      y = event.clientY
      programar()
    }
    const onLeave = () => apagar()
    const invalidar = () => {
      caja = null
      if (actual) programar()
    }

    const pasivo = { passive: true } as const
    document.addEventListener("pointerover", onOver, pasivo)
    document.addEventListener("pointermove", onMove, pasivo)
    document.documentElement.addEventListener("pointerleave", onLeave, pasivo)
    window.addEventListener("scroll", invalidar, pasivo)
    window.addEventListener("resize", invalidar, pasivo)

    return () => {
      document.removeEventListener("pointerover", onOver)
      document.removeEventListener("pointermove", onMove)
      document.documentElement.removeEventListener("pointerleave", onLeave)
      window.removeEventListener("scroll", invalidar)
      window.removeEventListener("resize", invalidar)
      if (frame) cancelAnimationFrame(frame)
      apagar()
    }
  }, [])

  return null
}
