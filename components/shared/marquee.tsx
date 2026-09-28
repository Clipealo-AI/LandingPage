"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface MarqueeProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** Velocidad en píxeles por segundo. Es la misma en cualquier ancho de pantalla. */
  speed?: number
  /** Por defecto avanza de derecha a izquierda; `reverse` la hace ir de izquierda a derecha. */
  reverse?: boolean
  /**
   * Separación entre elementos, como longitud CSS (`"1rem"`). Es una variable y
   * no una clase de Tailwind a propósito: la costura entre copias necesita el
   * mismo valor como padding, y una clase construida en tiempo de ejecución no
   * llega al CSS compilado.
   */
  gap?: string
  /** Nombre accesible de la lista visible; las copias quedan ocultas al lector. */
  label: string
  children: React.ReactNode
}

/**
 * Mitades que se pintan antes de medir. Con dos, una fila de 2 000 px ya cubre
 * 4 000 px de pantalla mientras la página hidrata.
 */
const MITADES_INICIALES = 2

/** Posición horizontal actual de la pista, en píxeles. */
function posicionX(el: HTMLElement) {
  return new DOMMatrixReadOnly(getComputedStyle(el).transform).m41
}

/**
 * Carrusel continuo. Avanza de derecha a izquierda, o al revés con `reverse`.
 *
 * La pista lleva el contenido repetido en dos mitades idénticas y se desplaza
 * un 50 %: al terminar, la segunda mitad está exactamente donde empezó la
 * primera y la vuelta no se nota. Cada copia lleva como padding final la misma
 * separación que hay entre elementos, así que la costura no se distingue.
 *
 * Para que nunca asome un hueco, cada mitad tiene que ser al menos tan ancha
 * como el contenedor (o la pantalla, para que al maximizar la ventana no se
 * pinte un fotograma vacío). Se mide con ResizeObserver, se repite el
 * contenido las veces necesarias y la duración sale de la distancia, así que
 * la velocidad no depende del monitor.
 *
 * Cambiar la duración de una animación CSS en marcha reescala su progreso y
 * la fila saltaría (al hidratar, al redimensionar o al cambiar el tamaño de
 * letra raíz). Por eso, antes de cada cambio de medida se guarda la posición
 * visible y después se recoloca la animación en ese mismo punto.
 *
 * Se mueve siempre, también con «reducir movimiento» activado en el sistema:
 * es una decisión de producto (13 sep 2026). Al pasar el ratón la fila se
 * detiene, para poder leerla.
 */
export function Marquee({
  speed = 40,
  reverse = false,
  gap = "2.5rem",
  label,
  className,
  style,
  children,
  ...props
}: MarqueeProps) {
  const raiz = React.useRef<HTMLDivElement>(null)
  const pista = React.useRef<HTMLDivElement>(null)
  const copia = React.useRef<HTMLUListElement>(null)
  const [medida, setMedida] = React.useState({ mitades: MITADES_INICIALES, ancho: 0 })
  /** Última medida aplicada, para decidir en el observador si algo cambió. */
  const aplicada = React.useRef(medida)
  /** Posición visible justo antes del cambio de medida pendiente. */
  const xPrevia = React.useRef<number | null>(null)

  React.useEffect(() => {
    const contenedor = raiz.current
    const track = pista.current
    const grupo = copia.current
    if (!contenedor || !track || !grupo || typeof ResizeObserver === "undefined") return

    // El observador entrega una primera notificación al empezar a observar:
    // esa es la medida inicial.
    const observador = new ResizeObserver(() => {
      const ancho = grupo.getBoundingClientRect().width
      if (!ancho) return
      const disponible = Math.max(contenedor.clientWidth, window.screen?.width ?? 0)
      const mitades = Math.max(1, Math.ceil(disponible / ancho))
      const prev = aplicada.current
      if (prev.mitades === mitades && Math.abs(prev.ancho - ancho) < 0.5) return
      xPrevia.current = posicionX(track)
      setMedida({ mitades, ancho })
    })
    observador.observe(contenedor)
    observador.observe(grupo)
    return () => observador.disconnect()
  }, [])

  /**
   * Fuera de pantalla, quieto.
   *
   * La animación es infinita, así que en la portada seguía corriendo cuando el
   * carrusel llevaba media página fuera de la vista: componer sus fotogramas
   * cuesta ~1,5 ms de hilo principal por fotograma en un móvil de gama media,
   * y no se ve nada a cambio. Con 200 px de margen vuelve a andar antes de
   * asomar, así que nunca se entra a una pista parada.
   *
   * Observador propio y no el compartido de `lib/motion.ts`: aquel descarta
   * las salidas de pantalla (es de un solo disparo) y usa otro margen.
   */
  React.useEffect(() => {
    const contenedor = raiz.current
    if (!contenedor || typeof IntersectionObserver === "undefined") return
    const observador = new IntersectionObserver(
      ([entrada]) => {
        contenedor.toggleAttribute("data-fuera", !entrada.isIntersecting)
      },
      { rootMargin: "200px" }
    )
    observador.observe(contenedor)
    return () => observador.disconnect()
  }, [])

  // Recoloca la animación donde estaba antes de cambiar duración o copias.
  React.useLayoutEffect(() => {
    aplicada.current = medida
    const track = pista.current
    const x = xPrevia.current
    xPrevia.current = null
    if (!track || x === null || !medida.ancho) return

    const anim = track.getAnimations()[0]
    if (!anim) return
    // El contenido se repite cada `ancho` píxeles: basta con conservar la
    // posición dentro de una copia.
    const desplazamiento = ((-x % medida.ancho) + medida.ancho) % medida.ancho
    const distancia = medida.mitades * medida.ancho
    const recorrido = reverse ? distancia - desplazamiento : desplazamiento
    anim.currentTime = (recorrido / speed) * 1000
  }, [medida, reverse, speed])

  // Distancia de una vuelta = una mitad de la pista.
  const segundos = medida.ancho ? (medida.mitades * medida.ancho) / speed : 60
  const copias = medida.mitades * 2

  return (
    <div
      ref={raiz}
      data-marquee
      className={cn(
        // `clip` y no `hidden`: un contenedor oculto aún se puede desplazar por
        // programa (scrollIntoView) y dejaría ver el final de la pista.
        // `py-1`: el anillo de los avatares no se recorta arriba.
        "group/marquee relative overflow-clip py-1",
        "[mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]",
        "sm:[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
        className
      )}
      style={style}
      {...props}
    >
      <div
        ref={pista}
        data-marquee-track
        className="flex w-max animate-marquee will-change-transform group-hover/marquee:[animation-play-state:paused]"
        style={
          {
            "--marquee-duration": `${segundos}s`,
            "--marquee-gap": gap,
            animationDuration: "var(--marquee-duration)",
            animationDirection: reverse ? "reverse" : undefined,
          } as React.CSSProperties
        }
      >
        {Array.from({ length: copias }, (_, i) => (
          <ul
            key={i}
            ref={i === 0 ? copia : undefined}
            role={i === 0 ? "list" : "presentation"}
            aria-label={i === 0 ? label : undefined}
            aria-hidden={i === 0 ? undefined : true}
            className="flex shrink-0 items-center gap-(--marquee-gap) pr-(--marquee-gap)"
          >
            {children}
          </ul>
        ))}
      </div>
    </div>
  )
}
