import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/** Un AudioContext mínimo que cuenta los nodos que se programan. */
function contextoFalso() {
  const creados = { fuentes: 0 }
  const param = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  })
  const nodo = <T extends object>(extra: T) => ({ connect: (n: unknown) => n, ...extra })

  class Falso {
    state = "running"
    currentTime = 0
    sampleRate = 8000
    destination = {}
    createOscillator() {
      creados.fuentes++
      return nodo({ type: "", frequency: param(), start: vi.fn(), stop: vi.fn() })
    }
    createBufferSource() {
      creados.fuentes++
      return nodo({ buffer: null, start: vi.fn(), stop: vi.fn() })
    }
    createGain() {
      return nodo({ gain: param() })
    }
    createDynamicsCompressor() {
      return nodo({})
    }
    createBiquadFilter() {
      return nodo({ type: "", Q: param(), frequency: param() })
    }
    createBuffer(_canales: number, largo: number) {
      return { getChannelData: () => new Float32Array(largo) }
    }
    resume() {
      return Promise.resolve()
    }
  }

  return { Falso, creados }
}

beforeEach(() => {
  localStorage.clear()
  vi.resetModules()
  window.__clipealoSounds = []
})

afterEach(() => {
  delete (window as { AudioContext?: unknown }).AudioContext
  delete window.__clipealoSounds
  vi.restoreAllMocks()
})

describe("preferencia de sonidos", () => {
  it("están encendidos por defecto", async () => {
    const { soundsEnabled } = await import("@/lib/sound")
    expect(soundsEnabled()).toBe(true)
  })

  it("apagarlos se guarda en el dispositivo y avisa a quien escucha", async () => {
    const { SOUND_PREF_KEY, setSoundsEnabled, soundsEnabled, subscribeSounds } =
      await import("@/lib/sound")
    const aviso = vi.fn()
    const dejar = subscribeSounds(aviso)

    setSoundsEnabled(false)
    expect(localStorage.getItem(SOUND_PREF_KEY)).toBe("off")
    expect(soundsEnabled()).toBe(false)
    expect(aviso).toHaveBeenCalledTimes(1)

    dejar()
    setSoundsEnabled(true)
    expect(soundsEnabled()).toBe(true)
    expect(aviso).toHaveBeenCalledTimes(1)
  })
})

describe("playSound", () => {
  it("sin Web Audio no lanza: la interfaz sigue, en silencio", async () => {
    const { playSound } = await import("@/lib/sound")
    expect(() => playSound("pop")).not.toThrow()
    expect(window.__clipealoSounds).toEqual(["pop"])
  })

  it("con los sonidos apagados no suena nada", async () => {
    const { playSound, setSoundsEnabled } = await import("@/lib/sound")
    setSoundsEnabled(false)
    playSound("celebrate")
    expect(window.__clipealoSounds).toEqual([])
  })

  it("un doble clic no suena como una ráfaga", async () => {
    const reloj = vi.spyOn(performance, "now")
    const { playSound } = await import("@/lib/sound")
    reloj.mockReturnValue(1000)
    playSound("tap")
    reloj.mockReturnValue(1030)
    playSound("tap")
    reloj.mockReturnValue(1200)
    playSound("tap")
    expect(window.__clipealoSounds).toEqual(["tap", "tap"])
  })

  it("un resultado repetido seguido no se apila", async () => {
    const reloj = vi.spyOn(performance, "now")
    const { playSound } = await import("@/lib/sound")
    reloj.mockReturnValue(1000)
    playSound("celebrate")
    reloj.mockReturnValue(1070)
    playSound("celebrate")
    reloj.mockReturnValue(1300)
    playSound("celebrate")
    expect(window.__clipealoSounds).toEqual(["celebrate", "celebrate"])
  })

  it("con el audio interrumpido no encola nada que suene de golpe al volver", async () => {
    const { Falso, creados } = contextoFalso()
    class Interrumpido extends Falso {
      state = "interrupted"
    }
    ;(window as { AudioContext?: unknown }).AudioContext = Interrumpido
    const { playSound } = await import("@/lib/sound")
    playSound("pop")
    playSound("success")
    expect(creados.fuentes).toBe(0)
  })

  it("suspendido, suena si despierta a tiempo y se descarta si tarda", async () => {
    const { Falso, creados } = contextoFalso()
    let despertar: () => void = () => {}
    class Suspendido extends Falso {
      state = "suspended"
      resume() {
        return new Promise<void>((listo) => {
          despertar = listo
        })
      }
    }
    ;(window as { AudioContext?: unknown }).AudioContext = Suspendido
    const reloj = vi.spyOn(performance, "now")
    const { playSound } = await import("@/lib/sound")

    reloj.mockReturnValue(1000)
    playSound("pop")
    reloj.mockReturnValue(1050)
    despertar()
    await Promise.resolve()
    await Promise.resolve()
    expect(creados.fuentes).toBeGreaterThan(0)

    const antes = creados.fuentes
    reloj.mockReturnValue(2000)
    playSound("tap")
    reloj.mockReturnValue(2400)
    despertar()
    await Promise.resolve()
    await Promise.resolve()
    expect(creados.fuentes).toBe(antes)
  })

  it("cada sonido del catálogo programa audio de verdad", async () => {
    const { Falso, creados } = contextoFalso()
    ;(window as { AudioContext?: unknown }).AudioContext = Falso
    const { SOUND_NAMES, playSound } = await import("@/lib/sound")

    for (const nombre of SOUND_NAMES) {
      const antes = creados.fuentes
      playSound(nombre)
      expect(creados.fuentes, nombre).toBeGreaterThan(antes)
    }
  })

  it("reconoce solo nombres del catálogo", async () => {
    const { isSoundName } = await import("@/lib/sound")
    expect(isSoundName("pop")).toBe(true)
    expect(isSoundName("boom")).toBe(false)
    expect(isSoundName(undefined)).toBe(false)
  })
})
