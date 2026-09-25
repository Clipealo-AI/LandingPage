import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { renderHook } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  DURACION_CORTE,
  PLANOS_REFRAME,
  Reframe,
  planoReframe,
} from "@/components/marketing/reframe"
import { useScrollProgress } from "@/hooks/use-scroll-progress"
import es from "@/messages/es"
import { renderConIdioma } from "@/tests/intl"

describe("planoReframe", () => {
  it("son cuatro planos: 16:9, 1:1, 4:5 y 9:16", () => {
    expect(PLANOS_REFRAME).toBe(4)
  })

  // Valores centrales de cada plano, lejos de los bordes del redondeo
  // (0,22 · 0,42 · 0,62), para no depender de los flotantes
  it("da el plano de cada tramo del recorrido", () => {
    expect(planoReframe(0)).toBe(0)
    expect(planoReframe(0.1)).toBe(0)
    expect(planoReframe(0.32)).toBe(1)
    expect(planoReframe(0.52)).toBe(2)
    expect(planoReframe(0.85)).toBe(3)
    expect(planoReframe(1)).toBe(3)
  })

  it("fuera de rango se queda en los extremos", () => {
    expect(planoReframe(-0.4)).toBe(0)
    expect(planoReframe(1.6)).toBe(3)
    expect(planoReframe(Number.NaN)).toBe(0)
  })

  it("es monótona, nunca se salta un plano y pasa por los cuatro", () => {
    const vistos: number[] = []
    let anterior = planoReframe(0)
    for (let i = 0; i <= 1000; i++) {
      const plano = planoReframe(i / 1000)
      expect(plano - anterior).toBeGreaterThanOrEqual(0)
      expect(plano - anterior).toBeLessThanOrEqual(1)
      if (!vistos.includes(plano)) vistos.push(plano)
      anterior = plano
    }
    expect(vistos).toEqual([0, 1, 2, 3])
  })

  it("los dos planos intermedios duran lo mismo: ninguno parece atascado", () => {
    const tramo = (plano: number) => {
      let n = 0
      for (let i = 0; i <= 10000; i++) if (planoReframe(i / 10000) === plano) n++
      return n / 10000
    }
    expect(tramo(1)).toBeCloseTo(0.2, 2)
    expect(tramo(2)).toBeCloseTo(0.2, 2)
    // El primero y el último incluyen la entrada y la salida de la sección
    expect(tramo(0)).toBeCloseTo(0.22, 2)
    expect(tramo(3)).toBeCloseTo(0.38, 2)
  })
})

/** Sección de 2000 px en una ventana de 768 (jsdom): recorrido de 1232 px. */
const ALTO_SECCION = 2000
const recorrido = () => ALTO_SECCION - window.innerHeight
let arriba = 0

function caja(top: number, height: number): DOMRect {
  return {
    top,
    bottom: top + height,
    height,
    left: 0,
    right: 0,
    width: 0,
    x: 0,
    y: top,
    toJSON: () => ({}),
  }
}

/** Frames pendientes: el test decide cuándo se pinta el siguiente. */
let frames: FrameRequestCallback[] = []

/** Desplaza la sección a un progreso, lanza el evento de scroll y pinta un frame. */
function desplazarA(progreso: number) {
  arriba = -progreso * recorrido()
  window.dispatchEvent(new Event("scroll"))
  const pendientes = frames
  frames = []
  for (const cb of pendientes) cb(0)
}

beforeEach(() => {
  arriba = 0
  frames = []
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
    this: HTMLElement
  ) {
    return this.id === "como-funciona" || this.dataset.seccion
      ? caja(arriba, ALTO_SECCION)
      : caja(0, 0)
  })
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb))
  vi.stubGlobal("cancelAnimationFrame", () => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  delete document.documentElement.dataset.motion
})

describe("useScrollProgress · onProgress", () => {
  function montar(onProgress: (p: number) => void) {
    const el = document.createElement("section")
    el.dataset.seccion = "1"
    document.body.append(el)
    const ref = { current: el }
    const hook = renderHook(({ cb }) => useScrollProgress(ref, { onProgress: cb }), {
      initialProps: { cb: onProgress },
    })
    return { el, hook }
  }

  it("avisa al montar y en cada scroll con el mismo valor que escribe en la variable", () => {
    const vistos: number[] = []
    const { el } = montar((p) => vistos.push(p))
    expect(vistos).toEqual([0])
    expect(el.style.getPropertyValue("--progress")).toBe("0")

    desplazarA(0.5)
    expect(vistos.at(-1)).toBeCloseTo(0.5)
    expect(Number(el.style.getPropertyValue("--progress"))).toBeCloseTo(0.5)

    // Fuera de la sección se recorta a 0-1
    desplazarA(3)
    expect(vistos.at(-1)).toBe(1)
    el.remove()
  })

  it("usa siempre el último callback sin volver a engancharse", () => {
    const primero = vi.fn()
    const segundo = vi.fn()
    const alta = vi.spyOn(window, "addEventListener")
    const { el, hook } = montar(primero)
    const enganches = alta.mock.calls.filter(([tipo]) => tipo === "scroll").length

    hook.rerender({ cb: segundo })
    desplazarA(0.25)

    expect(segundo).toHaveBeenCalledWith(0.25)
    expect(primero).toHaveBeenCalledTimes(1)
    expect(alta.mock.calls.filter(([tipo]) => tipo === "scroll").length).toBe(enganches)
    el.remove()
  })
})

describe("Reframe · cortes de montaje", () => {
  let animar: ReturnType<typeof vi.fn>

  beforeEach(() => {
    animar = vi.fn(() => ({ cancel: vi.fn() }))
    Object.defineProperty(Element.prototype, "animate", {
      configurable: true,
      writable: true,
      value: animar,
    })
  })

  afterEach(() => {
    delete (Element.prototype as { animate?: unknown }).animate
  })

  const montarReframe = () => {
    const vista = renderConIdioma(React.createElement(Reframe))
    const seccion = vista.container.querySelector<HTMLElement>("#como-funciona")!
    const marco = vista.container.querySelector<HTMLElement>(".reframe-marco")!
    return { vista, seccion, marco }
  }

  it("escribe el plano en la sección y, con «reducir», funde el marco en cada corte", () => {
    document.documentElement.dataset.motion = "reduced"
    const { seccion, marco } = montarReframe()

    // La primera medida no es un corte
    expect(seccion.style.getPropertyValue("--plano")).toBe("0")
    expect(animar).not.toHaveBeenCalled()

    desplazarA(0.32)
    expect(seccion.style.getPropertyValue("--plano")).toBe("1")
    expect(animar).toHaveBeenCalledTimes(1)
    expect(animar.mock.contexts[0]).toBe(marco)
    const [fotogramas, opciones] = animar.mock.calls[0] as [
      Keyframe[],
      KeyframeAnimationOptions,
    ]
    expect(fotogramas).toEqual([{ opacity: 0.35 }, { opacity: 1 }])
    // Un fundido que se lee: 300 ms con `ease-out`, no la curva de marca, que
    // lo dejaba casi hecho en el primer fotograma
    expect(DURACION_CORTE).toBe(300)
    expect(opciones).toMatchObject({ duration: DURACION_CORTE, easing: "ease-out" })
    // Solo opacidad: con «reducir» nada se desplaza
    for (const f of fotogramas) {
      expect(Object.keys(f)).toEqual(["opacity"])
    }

    // Dentro del mismo plano no hay otro corte
    desplazarA(0.38)
    expect(animar).toHaveBeenCalledTimes(1)

    desplazarA(0.52)
    desplazarA(0.85)
    expect(seccion.style.getPropertyValue("--plano")).toBe("3")
    expect(animar).toHaveBeenCalledTimes(3)
  })

  it("sin preferencia el plano se escribe pero no hay fundido: el marco sigue al scroll", () => {
    document.documentElement.dataset.motion = "full"
    const { seccion } = montarReframe()
    desplazarA(0.52)
    expect(seccion.style.getPropertyValue("--plano")).toBe("2")
    expect(animar).not.toHaveBeenCalled()
  })

  it("al montar a mitad de sección (recarga) salta al plano sin corte", () => {
    document.documentElement.dataset.motion = "reduced"
    arriba = -0.85 * recorrido()
    const { seccion } = montarReframe()
    expect(seccion.style.getPropertyValue("--plano")).toBe("3")
    expect(animar).not.toHaveBeenCalled()
  })

  it("el HTML del servidor no fija el progreso ni el plano: los pone el CSS (0 con JS, final sin JS)", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        NextIntlClientProvider,
        { locale: "es", messages: es } as React.ComponentProps<
          typeof NextIntlClientProvider
        >,
        React.createElement(Reframe)
      )
    )
    const apertura = html.match(/<section[^>]*id="como-funciona"[^>]*>/)?.[0]
    expect(apertura).toBeDefined()
    expect(apertura).not.toContain("style=")
    expect(html).not.toContain("--progress")
    expect(html).not.toContain("--plano")
  })

  it("el rótulo final queda fuera del recorte del marco", () => {
    const { marco, vista } = montarReframe()
    const listo = vista.getByText(es.marketing.reframe.ready)
    expect(marco.contains(listo)).toBe(false)
    expect(marco.contains(vista.getByText(es.marketing.reframe.original))).toBe(true)
  })
})
