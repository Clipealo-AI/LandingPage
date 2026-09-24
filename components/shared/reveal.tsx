"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface RevealProps extends React.ComponentProps<"div"> {
  /** Retardo en segundos, para escalonar varios elementos de una fila. */
  delay?: number
  /** Margen del observador: negativo dispara mas tarde, cuando ya se ve. */
  rootMargin?: string
}

/**
 * Aparicion al entrar en pantalla.
 *
 * El estado oculto lo aplica CSS (`[data-reveal="pending"]`), no un estilo en
 * linea calculado en React: el HTML del servidor y el del cliente son identicos
 * y no hay forma de romper la hidratacion. La regla que oculta vive detras de
 * `.js`, la clase que pone el script de arranque, asi que sin JavaScript el
 * contenido se ve igualmente.
 *
 * El retardo se mantiene hasta que termina la propia transicion de entrada
 * (`asentado`): quitarlo al revelar lo anulaba, porque la transicion usa el
 * retardo del estilo nuevo. Despues vale 0 y no frena nada mas.
 *
 * Recibir el foco del teclado lo revela al momento: Tab nunca cae en un bloque
 * invisible.
 *
 * Con «reducir movimiento» la subida vale 0 (`--motion-distance`) y se queda en
 * fundido: reducir movimiento no es quitar la respuesta.
 */
export function Reveal({
  delay = 0,
  rootMargin = "-80px",
  className,
  style,
  children,
  onTransitionEnd,
  onFocusCapture,
  ...props
}: RevealProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = React.useState(false)
  const [asentado, setAsentado] = React.useState(false)

  React.useEffect(() => {
    const node = ref.current
    if (!node || revealed) return

    // Navegador sin IntersectionObserver: se muestra en el siguiente frame en
    // lugar de quedarse oculto para siempre.
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setRevealed(true))
      return () => cancelAnimationFrame(frame)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setRevealed(true)
        observer.disconnect()
      },
      { rootMargin }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [rootMargin, revealed])

  return (
    <div
      ref={ref}
      data-reveal={revealed ? "done" : "pending"}
      className={cn("reveal", className)}
      style={{ transitionDelay: asentado ? "0s" : `${delay}s`, ...style }}
      onTransitionEnd={(event) => {
        // Solo su propia transición: las de los hijos también llegan aquí
        if (revealed && event.target === event.currentTarget) setAsentado(true)
        onTransitionEnd?.(event)
      }}
      onFocusCapture={(event) => {
        setRevealed(true)
        onFocusCapture?.(event)
      }}
      {...props}
    >
      {children}
    </div>
  )
}
