import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  CLAVE_MOVIMIENTO,
  SCRIPT_BANDERA_MOVIMIENTO,
  estadoInicial,
  observeMotionGroup,
} from "@/lib/motion"

const ALTO = 1000

describe("estadoInicial", () => {
  it("un grupo a la vista queda estático: lo que ya se ve no se oculta", () => {
    expect(estadoInicial({ top: 100, bottom: 400 }, ALTO)).toBe("static")
  })

  it("uno que ya pasó por arriba también", () => {
    expect(estadoInicial({ top: -600, bottom: -10 }, ALTO)).toBe("static")
    expect(estadoInicial({ top: -600, bottom: 0 }, ALTO)).toBe("static")
  })

  it("uno por debajo de la pantalla espera", () => {
    expect(estadoInicial({ top: 1400, bottom: 1900 }, ALTO)).toBe("idle")
  })

  it("con un solo píxel a la vista ya es estático, también en el 12 % inferior (ancla o scroll restaurado)", () => {
    expect(estadoInicial({ top: 879, bottom: 1200 }, ALTO)).toBe("static")
    expect(estadoInicial({ top: 950, bottom: 1200 }, ALTO)).toBe("static")
    expect(estadoInicial({ top: 999, bottom: 1200 }, ALTO)).toBe("static")
    expect(estadoInicial({ top: 1000, bottom: 1200 }, ALTO)).toBe("idle")
  })
})

/** IntersectionObserver de mentira: el test decide cuándo «entra» un elemento. */
class ObservadorFalso {
  static instancias: ObservadorFalso[] = []
  observados = new Set<Element>()
  constructor(
    readonly callback: IntersectionObserverCallback,
    readonly opciones?: IntersectionObserverInit
  ) {
    ObservadorFalso.instancias.push(this)
  }
  observe(el: Element) {
    this.observados.add(el)
  }
  unobserve(el: Element) {
    this.observados.delete(el)
  }
  disconnect() {
    this.observados.clear()
  }
  entrar(el: Element) {
    this.callback(
      [{ target: el, isIntersecting: true } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    )
  }
}

const observadorActual = () => ObservadorFalso.instancias.at(-1)

function grupo(
  caja: { top: number; bottom: number },
  atributos: Record<string, string> = {}
) {
  const el = document.createElement("div")
  el.dataset.motionGroup = ""
  for (const [k, v] of Object.entries(atributos)) el.setAttribute(k, v)
  el.getBoundingClientRect = () => ({ ...caja, left: 0, right: 100 }) as DOMRect
  document.body.appendChild(el)
  return el
}

describe("observeMotionGroup", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", ObservadorFalso)
    vi.stubGlobal("innerHeight", ALTO)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ""
  })

  it("sin IntersectionObserver no pone estado: todo se ve terminado", () => {
    vi.stubGlobal("IntersectionObserver", undefined)
    const el = grupo({ top: 2000, bottom: 2400 })
    observeMotionGroup(el)
    expect(el.dataset.motionState).toBeUndefined()
  })

  it("lo que ya se ve al hidratar queda «static» y no avisa", () => {
    const onPlay = vi.fn()
    const el = grupo({ top: 200, bottom: 500 })
    observeMotionGroup(el, onPlay)
    expect(el.dataset.motionState).toBe("static")
    expect(onPlay).not.toHaveBeenCalled()
  })

  it("un decorativo que parte invisible se reproduce aunque ya se vea, tras su espera", () => {
    vi.spyOn(performance, "now").mockReturnValue(600)
    const onPlay = vi.fn()
    const el = grupo(
      { top: 200, bottom: 500 },
      { "data-motion-visible": "play", "data-motion-after": "1400" }
    )
    observeMotionGroup(el, onPlay)
    expect(el.dataset.motionState).toBe("play")
    expect(el.style.getPropertyValue("--m-wait")).toBe("800ms")
    expect(onPlay).toHaveBeenCalledWith(el)
  })

  it("la espera nunca es negativa", () => {
    vi.spyOn(performance, "now").mockReturnValue(5000)
    const el = grupo(
      { top: 200, bottom: 500 },
      { "data-motion-visible": "play", "data-motion-after": "1400" }
    )
    observeMotionGroup(el)
    expect(el.style.getPropertyValue("--m-wait")).toBe("0ms")
  })

  it("lo que está por debajo espera en «idle» y pasa a «play» al entrar, una sola vez", () => {
    const onPlay = vi.fn()
    const el = grupo({ top: 1500, bottom: 1900 })
    const limpiar = observeMotionGroup(el, onPlay)
    const io = observadorActual()!

    expect(el.dataset.motionState).toBe("idle")
    expect(io.opciones?.rootMargin).toBe("0px 0px -12% 0px")
    expect(io.observados.has(el)).toBe(true)

    io.entrar(el)
    expect(el.dataset.motionState).toBe("play")
    expect(el.style.getPropertyValue("--m-wait")).toBe("")
    expect(onPlay).toHaveBeenCalledTimes(1)
    expect(io.observados.has(el)).toBe(false)

    io.entrar(el)
    limpiar()
    expect(onPlay).toHaveBeenCalledTimes(1)
  })

  it("con la caja ya medida no vuelve a medir", () => {
    const el = grupo({ top: 1500, bottom: 1900 })
    const medir = vi.spyOn(el, "getBoundingClientRect")
    const limpiar = observeMotionGroup(el, undefined, { top: 100, bottom: 400 })
    expect(medir).not.toHaveBeenCalled()
    expect(el.dataset.motionState).toBe("static")
    limpiar()
  })

  it("todos los grupos comparten un observador", () => {
    const antes = ObservadorFalso.instancias.length
    const a = grupo({ top: 1500, bottom: 1900 })
    const b = grupo({ top: 2500, bottom: 2900 })
    const limpiarA = observeMotionGroup(a)
    const limpiarB = observeMotionGroup(b)
    expect(ObservadorFalso.instancias.length - antes).toBeLessThanOrEqual(1)
    expect(observadorActual()!.observados).toEqual(new Set([a, b]))
    limpiarA()
    limpiarB()
  })

  it("el foco del teclado deja terminado un grupo que espera: sin animación y sin observar", () => {
    const onPlay = vi.fn()
    const el = grupo({ top: 1500, bottom: 1900 })
    const boton = document.createElement("button")
    el.appendChild(boton)
    observeMotionGroup(el, onPlay)
    const io = observadorActual()!
    boton.focus()
    expect(el.dataset.motionState).toBe("static")
    expect(io.observados.has(el)).toBe(false)
    // Entrar después en pantalla ya no lo anima
    io.entrar(el)
    expect(el.dataset.motionState).toBe("static")
    expect(onPlay).not.toHaveBeenCalled()
  })

  it("el foco que llega mientras el grupo se anima lo termina y quita la espera", () => {
    vi.spyOn(performance, "now").mockReturnValue(600)
    const el = grupo(
      { top: 200, bottom: 500 },
      { "data-motion-visible": "play", "data-motion-after": "1400" }
    )
    const enlace = document.createElement("a")
    enlace.href = "#"
    el.appendChild(enlace)
    observeMotionGroup(el)
    expect(el.dataset.motionState).toBe("play")
    enlace.focus()
    expect(el.dataset.motionState).toBe("static")
    expect(el.style.getPropertyValue("--m-wait")).toBe("")
  })

  it("la limpieza también deja de escuchar el foco", () => {
    const el = grupo({ top: 1500, bottom: 1900 })
    const boton = document.createElement("button")
    el.appendChild(boton)
    const limpiar = observeMotionGroup(el)
    limpiar()
    boton.focus()
    expect(el.dataset.motionState).toBe("idle")
  })

  it("un titular que es su propio grupo y se recorta (m-cut) se observa por su padre", () => {
    // IntersectionObserver aplica el clip-path del propio objetivo: recortado del
    // todo mientras espera, no entraría nunca
    const seccion = document.createElement("div")
    document.body.appendChild(seccion)
    const titular = grupo({ top: 1500, bottom: 1600 })
    titular.classList.add("m-anim", "m-cut")
    seccion.appendChild(titular)
    const otro = grupo({ top: 1700, bottom: 1800 })
    otro.classList.add("m-cut")
    seccion.appendChild(otro)

    const limpiarTitular = observeMotionGroup(titular)
    const limpiarOtro = observeMotionGroup(otro)
    const io = observadorActual()!
    expect(titular.dataset.motionState).toBe("idle")
    expect(io.observados.has(titular)).toBe(false)
    expect(io.observados.has(seccion)).toBe(true)

    // Limpiar uno no deja sin observar al otro que comparte padre
    limpiarOtro()
    expect(io.observados.has(seccion)).toBe(true)
    io.entrar(seccion)
    expect(titular.dataset.motionState).toBe("play")
    expect(otro.dataset.motionState).toBe("idle")
    expect(io.observados.has(seccion)).toBe(false)
    limpiarTitular()
  })

  it("la limpieza deja de observar; volver a llamar (StrictMode) observa de nuevo sin recalcular", () => {
    const el = grupo({ top: 1500, bottom: 1900 })
    const limpiar = observeMotionGroup(el)
    const io = observadorActual()!
    limpiar()
    expect(io.observados.has(el)).toBe(false)
    expect(el.dataset.motionState).toBe("idle")

    // Ahora «se ve», pero ya estaba oculto esperando: no puede quedarse estático
    el.getBoundingClientRect = () => ({ top: 100, bottom: 400 }) as DOMRect
    observeMotionGroup(el)
    expect(el.dataset.motionState).toBe("idle")
    expect(observadorActual()!.observados.has(el)).toBe(true)
    observadorActual()!.entrar(el)
    expect(el.dataset.motionState).toBe("play")
  })

  it("un grupo ya en «static» o «play» no cambia de estado ni se observa", () => {
    const quieto = grupo({ top: 1500, bottom: 1900 }, { "data-motion-state": "static" })
    const hecho = grupo({ top: 1500, bottom: 1900 }, { "data-motion-state": "play" })
    observeMotionGroup(quieto)
    observeMotionGroup(hecho)
    expect(quieto.dataset.motionState).toBe("static")
    expect(hecho.dataset.motionState).toBe("play")
    expect(observadorActual()?.observados.has(quieto) ?? false).toBe(false)
    expect(observadorActual()?.observados.has(hecho) ?? false).toBe(false)
  })
})

describe("prefiereMenosMovimiento", () => {
  afterEach(() => {
    delete document.documentElement.dataset.motion
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  const cargar = async (sistemaReduce: boolean) => {
    vi.resetModules()
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: sistemaReduce && query.includes("reduce"),
      media: query,
    }))
    return (await import("@/lib/motion")).prefiereMenosMovimiento
  }

  // El movimiento completo es el de serie para todo el mundo: quien quiera
  // menos lo elige en Ajustes › Perfil (o con ?movimiento=reducido).
  it("sin elección, el movimiento es completo aunque el sistema pida menos", async () => {
    expect((await cargar(true))()).toBe(false)
    expect((await cargar(false))()).toBe(false)
  })

  it("«Completo» manda sobre un sistema con reduce", async () => {
    const prefiere = await cargar(true)
    document.documentElement.dataset.motion = "full"
    expect(prefiere()).toBe(false)
  })

  it("«Reducido» manda sobre un sistema sin preferencia", async () => {
    const prefiere = await cargar(false)
    document.documentElement.dataset.motion = "reduced"
    expect(prefiere()).toBe(true)
  })
})

describe("bandera ?movimiento= (script de arranque)", () => {
  const arrancar = (url: string) => {
    window.history.replaceState(null, "", url)
    delete document.documentElement.dataset.motion
    new Function(SCRIPT_BANDERA_MOVIMIENTO)()
    return document.documentElement.dataset.motion
  }

  afterEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.motion
    window.history.replaceState(null, "", "/")
  })

  it("completo y reducido ponen el modo y lo guardan", () => {
    expect(arrancar("/?movimiento=completo")).toBe("full")
    expect(localStorage.getItem(CLAVE_MOVIMIENTO)).toBe("completo")
    expect(arrancar("/en?movimiento=reducido")).toBe("reduced")
    expect(localStorage.getItem(CLAVE_MOVIMIENTO)).toBe("reducido")
  })

  it("se mantiene en la siguiente página sin parámetro", () => {
    arrancar("/?movimiento=reducido")
    expect(arrancar("/precios")).toBe("reduced")
  })

  it("sistema borra la elección y vuelve al movimiento completo", () => {
    arrancar("/?movimiento=reducido")
    expect(arrancar("/?movimiento=sistema")).toBe("full")
    expect(localStorage.getItem(CLAVE_MOVIMIENTO)).toBeNull()
    expect(arrancar("/")).toBe("full")
  })

  it("un valor desconocido no cambia la elección guardada", () => {
    expect(arrancar("/?movimiento=turbo")).toBe("full")
    expect(localStorage.getItem(CLAVE_MOVIMIENTO)).toBeNull()
  })

  it("sin almacenamiento, la URL sigue valiendo para esa carga", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado")
    })
    expect(arrancar("/?movimiento=reducido")).toBe("reduced")
    setItem.mockRestore()
  })
})
