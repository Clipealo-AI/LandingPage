"use client"

import * as React from "react"

import {
  PASO_MOVER_FINO_MIN,
  PASO_MOVER_GRANDE_MIN,
  PASO_MOVER_MIN,
  encerrarDestino,
  type EntradaAgenda,
  type Franja,
} from "@/lib/agenda"
import { diaDe, minutosDelDia, type Dia, type Zona } from "@/lib/fechas"

/** Dónde caería la publicación si se soltara ahora. */
export interface DestinoMover {
  dia: Dia
  /** Minuto del día, ya imantado y dentro de la franja. */
  minutos: number
}

/** El gesto en curso. `null` mientras no se está moviendo nada. */
export interface GestoMover {
  id: string
  /** Con el ratón la tarjeta sigue al dedo; con el teclado salta de casilla. */
  modo: "puntero" | "teclado"
  origen: DestinoMover
  destino: DestinoMover
  /** `true` si el destino topó con el principio o el final de la franja. */
  tope: boolean
}

/**
 * El día es el CIVIL de la cuenta, no el de UTC.
 *
 * Cortar el ISO por el guion parece lo mismo y no lo es: en Lima (GMT-5) una
 * publicación de las 19:00 del sábado lleva fecha UTC del domingo. La columna
 * la pinta `diaDe`, así que el origen tenía que salir de ahí también o el
 * teclado empezaba a contar desde un día que no era el que se veía.
 */
const destinoDe = (e: EntradaAgenda, zona: Zona): DestinoMover => ({
  dia: diaDe(e.programadaPara, zona),
  minutos: minutosDelDia(e.programadaPara, zona),
})

const pasoDe = (e: { shiftKey: boolean; altKey: boolean }) =>
  e.shiftKey ? PASO_MOVER_GRANDE_MIN : e.altKey ? PASO_MOVER_FINO_MIN : PASO_MOVER_MIN

/**
 * Mover una publicación en la rejilla: arrastrándola o con el teclado.
 *
 * Reparto de trabajo, y es lo que hace que no dé tirones: el desplazamiento
 * CRUDO del puntero se escribe en `--mover-dx` / `--mover-dy` directamente sobre
 * el DOM dentro de un `requestAnimationFrame`, sin pasar por React, así que la
 * tarjeta va pegada al dedo fotograma a fotograma. Por React solo viaja el
 * destino IMANTADO —el que se va a guardar—, que es lo que pinta la guía y lo
 * que se valida. Uno es el gesto; el otro, la promesa.
 *
 * El día del destino se busca con la posición REAL del puntero: la corrección
 * del agarre es aritmética de minutos, y meterla también en la búsqueda de
 * columna hacía que, cogiendo la tarjeta por abajo, no se encontrara ninguna.
 *
 * Con «reducir movimiento» esto se ve exactamente igual: no hay transición que
 * quitar, solo la respuesta 1:1 a lo que hace la mano.
 */
export function useMoverPublicacion({
  zona,
  franja,
  dias,
  onDestino,
}: {
  zona: Zona
  franja: Franja
  dias: Dia[]
  /** Se llama con cada destino nuevo: quien lo recibe valida y decide. */
  onDestino?: (destino: DestinoMover | null) => void
}) {
  const [gesto, setGesto] = React.useState<GestoMover | null>(null)
  /**
   * Si el último gesto movió algo, el `click` que viene detrás del `pointerup`
   * no puede abrir la hoja de detalle: quien arrastra no ha pedido abrir nada.
   */
  const movido = React.useRef(false)
  /** Lo que se mide del DOM una sola vez al empezar: no cambia durante el gesto. */
  const arrastre = React.useRef<{
    li: HTMLElement
    agarreY: number
    x0: number
    y0: number
    altoHora: number
    cuadro: number | null
  } | null>(null)

  const avisar = React.useCallback(
    (d: DestinoMover | null) => onDestino?.(d),
    [onDestino]
  )

  /** Quita las variables crudas: la tarjeta vuelve a su sitio del layout. */
  const limpiar = React.useCallback(() => {
    const a = arrastre.current
    if (a) {
      if (a.cuadro !== null) cancelAnimationFrame(a.cuadro)
      a.li.style.removeProperty("--mover-dx")
      a.li.style.removeProperty("--mover-dy")
    }
    arrastre.current = null
  }, [])

  const terminar = React.useCallback(() => {
    limpiar()
    setGesto(null)
    avisar(null)
  }, [avisar, limpiar])

  /**
   * El día de la columna que hay bajo el puntero, o `null` si está fuera.
   *
   * `elementsFromPoint` en plural y saltándose la tarjeta: viaja pegada al
   * puntero y tapa la columna, y además su propio `closest("[data-dia]")` es la
   * columna de ORIGEN. Apagarle los eventos para esquivarla tenía un precio
   * peor —dejaba de recibir los `pointermove` de su captura—, así que se busca
   * en la pila y se descarta lo que cuelga de ella.
   */
  const diaEnPantalla = (x: number, y: number, arrastrada: HTMLElement): Dia | null => {
    for (const el of document.elementsFromPoint(x, y)) {
      // La tarjeta arrastrada se salta entera: viaja pegada al puntero y su
      // columna es la de ORIGEN, así que sin esto el día nunca cambiaba
      if (arrastrada.contains(el)) continue
      const dia = el.closest<HTMLElement>("[data-dia]")?.dataset.dia
      if (dia && dias.includes(dia as Dia)) return dia as Dia
    }
    return null
  }

  /** Empezar a arrastrar. El `<li>` es quien lleva las variables crudas. */
  const cogerConPuntero = (
    e: React.PointerEvent<HTMLElement>,
    entrada: EntradaAgenda
  ) => {
    // Solo el botón principal, y nunca sobre un gesto ya empezado
    if (e.button !== 0 || arrastre.current) return
    const li = e.currentTarget.closest<HTMLElement>(".agenda-entrada")
    const columnas = li?.closest<HTMLElement>(".agenda-columnas")
    if (!li || !columnas) return
    // El alto de hora se MIDE del DOM, no se convierte de rem: cambia con la
    // container query de 96rem y una conversión a mano se quedaría vieja. La
    // rejilla mide exactamente `horas × alto de hora`, así que se despeja
    const horas = Math.max(1, franja.hasta - franja.desde)
    const altoHora = columnas.getBoundingClientRect().height / horas
    if (!altoHora) return

    e.currentTarget.setPointerCapture(e.pointerId)
    movido.current = false
    const caja = li.getBoundingClientRect()
    const origen = destinoDe(entrada, zona)
    arrastre.current = {
      li,
      agarreY: e.clientY - caja.top,
      x0: e.clientX,
      y0: e.clientY,
      altoHora,
      cuadro: null,
    }
    setGesto({ id: entrada.id, modo: "puntero", origen, destino: origen, tope: false })
    avisar(origen)
  }

  const alMoverPuntero = (e: React.PointerEvent<HTMLElement>) => {
    const a = arrastre.current
    if (!a || !gesto) return
    const { clientX, clientY } = e
    // La pintura va por el DOM, fuera del ciclo de React: un `setState` por
    // fotograma repintaría 42 celdas para mover un rectángulo
    if (a.cuadro === null) {
      a.cuadro = requestAnimationFrame(() => {
        a.cuadro = null
        a.li.style.setProperty("--mover-dx", `${clientX - a.x0}px`)
        a.li.style.setProperty("--mover-dy", `${clientY - a.y0}px`)
      })
    }

    const dia = diaEnPantalla(clientX, clientY, a.li) ?? gesto.destino.dia
    const columna = document.querySelector<HTMLElement>(`[data-dia="${dia}"]`)
    if (!columna) return
    const caja = columna.getBoundingClientRect()
    // El agarre es aritmética de minutos: donde cae el BORDE de la tarjeta
    const crudos =
      franja.desde * 60 + ((clientY - a.agarreY - caja.top) / a.altoHora) * 60
    const { minutos, tope } = encerrarDestino(crudos, franja, pasoDe(e))
    if (dia === gesto.destino.dia && minutos === gesto.destino.minutos) return
    const destino = { dia, minutos }
    movido.current = true
    setGesto({ ...gesto, destino, tope })
    avisar(destino)
  }

  /** ¿El clic que viene es el final de un arrastre? Entonces no abre nada. */
  const clicEsDelArrastre = () => {
    const fue = movido.current
    movido.current = false
    return fue
  }

  const soltar = (onMover: (destino: DestinoMover) => void) => {
    const g = gesto
    limpiar()
    setGesto(null)
    avisar(null)
    if (!g) return
    if (g.destino.dia === g.origen.dia && g.destino.minutos === g.origen.minutos) return
    onMover(g.destino)
  }

  /**
   * El teclado: `M` entra en el modo, las flechas mueven, `Enter` confirma y
   * `Escape` devuelve la publicación a su sitio. No se le roba el `Enter` a la
   * tarjeta —que abre su hoja— porque solo se atiende dentro del modo.
   */
  const conTeclado = (
    e: React.KeyboardEvent<HTMLElement>,
    entrada: EntradaAgenda,
    onMover: (destino: DestinoMover) => void
  ) => {
    const enModo = gesto?.id === entrada.id && gesto.modo === "teclado"
    if (!enModo) {
      if (e.key !== "m" && e.key !== "M") return
      e.preventDefault()
      const origen = destinoDe(entrada, zona)
      setGesto({ id: entrada.id, modo: "teclado", origen, destino: origen, tope: false })
      avisar(origen)
      return
    }
    const g = gesto
    const i = dias.indexOf(g.destino.dia)
    const paso = pasoDe(e)
    let dia = g.destino.dia
    let minutos = g.destino.minutos

    switch (e.key) {
      case "Escape":
        e.preventDefault()
        terminar()
        return
      case "Enter":
      case " ":
        e.preventDefault()
        soltar(onMover)
        return
      case "ArrowLeft":
        dia = dias[Math.max(0, i - 1)]
        break
      case "ArrowRight":
        dia = dias[Math.min(dias.length - 1, i + 1)]
        break
      case "ArrowUp":
        minutos -= paso
        break
      case "ArrowDown":
        minutos += paso
        break
      default:
        return
    }
    e.preventDefault()
    const encerrado = encerrarDestino(minutos, franja, paso)
    const destino = { dia, minutos: encerrado.minutos }
    setGesto({ ...g, destino, tope: encerrado.tope })
    avisar(destino)
  }

  // Si la entrada que se está moviendo desaparece (otra pestaña la cambió de
  // día y React la desmonta), el navegador suelta la captura: el gesto muere
  React.useEffect(() => () => limpiar(), [limpiar])

  return {
    gesto,
    cogerConPuntero,
    alMoverPuntero,
    soltar,
    terminar,
    conTeclado,
    clicEsDelArrastre,
  }
}
