/**
 * Sonidos de la interfaz.
 *
 * Sintetizados con Web Audio en el momento: sin archivos, sin peticiones y sin
 * nada que cargar antes de la primera pulsación. Cada sonido son dos o tres
 * osciladores con una envolvente corta, en el registro agudo y a poco volumen,
 * para que acompañen sin cansar.
 *
 * Solo suenan las pulsaciones que lo merecen (ver `components/shared/
 * interaction-feedback.tsx` y `lib/toast.ts`):
 * - `pop`: la acción principal de la vista (botón `brand`).
 * - `tap`: elegir una opción (formato, radio).
 * - `snip`: recortar (confirmar un recorte).
 * - `toggle-on` / `toggle-off`: interruptores.
 * - `success`: una tarea terminada bien.
 * - `celebrate`: un hito (publicar, subir, conectar una red).
 * - `error`: algo no se pudo hacer.
 * - `remove`: borrar.
 *
 * El usuario los apaga en Ajustes o en su menú; la preferencia vive en
 * localStorage porque es del dispositivo, no de la cuenta.
 */

export const SOUND_NAMES = [
  "tap",
  "pop",
  "snip",
  "toggle-on",
  "toggle-off",
  "success",
  "celebrate",
  "error",
  "remove",
] as const

export type SoundName = (typeof SOUND_NAMES)[number]

export function isSoundName(value: unknown): value is SoundName {
  return typeof value === "string" && (SOUND_NAMES as readonly string[]).includes(value)
}

declare global {
  interface Window {
    /** Enganche de pruebas: si existe, cada sonido reproducido deja aquí su nombre. */
    __clipealoSounds?: string[]
    webkitAudioContext?: typeof AudioContext
  }
}

/* ---------------------------------------------------------------------------
   Preferencia
   --------------------------------------------------------------------------- */

export const SOUND_PREF_KEY = "clipealo-sonidos"
const EVENTO_PREF = "clipealo:sonidos"

/** Encendidos por defecto: el usuario los pidió. Solo `"off"` los apaga. */
export function soundsEnabled(): boolean {
  try {
    return window.localStorage.getItem(SOUND_PREF_KEY) !== "off"
  } catch {
    return true
  }
}

export function setSoundsEnabled(on: boolean) {
  try {
    window.localStorage.setItem(SOUND_PREF_KEY, on ? "on" : "off")
  } catch {
    // Almacenamiento bloqueado: la preferencia dura lo que la pestaña
  }
  window.dispatchEvent(new Event(EVENTO_PREF))
}

/** Suscripción para `useSyncExternalStore`, también entre pestañas. */
export function subscribeSounds(callback: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === SOUND_PREF_KEY) callback()
  }
  window.addEventListener(EVENTO_PREF, callback)
  window.addEventListener("storage", onStorage)
  return () => {
    window.removeEventListener(EVENTO_PREF, callback)
    window.removeEventListener("storage", onStorage)
  }
}

/* ---------------------------------------------------------------------------
   Motor
   --------------------------------------------------------------------------- */

/**
 * Volumen general. Sin compresor a propósito: con el de serie, los sonidos
 * cortos perdían hasta 10 dB y el ataque pasaba de 4 a 10 ms, justo lo que
 * hace que una pulsación suene blanda. Medido (OfflineAudioContext, 14 sep
 * 2026): el pico de seis sonidos a la vez queda por debajo de -6 dBFS, así
 * que no hace falta limitar.
 */
const VOLUMEN = 0.7

let contexto: AudioContext | null = null
let salida: AudioNode | null = null
let ruidoBlanco: AudioBuffer | null = null

function audio() {
  const Ctor = window.AudioContext ?? window.webkitAudioContext
  if (!Ctor) return null
  if (!contexto) {
    contexto = new Ctor()
    const master = contexto.createGain()
    master.gain.value = VOLUMEN
    master.connect(contexto.destination)
    salida = master
  }
  return contexto
}

interface Tono {
  freq: number
  /** Frecuencia final, para barridos. */
  to?: number
  dur: number
  type?: OscillatorType
  gain?: number
  attack?: number
}

function tono(c: AudioContext, out: AudioNode, t: number, o: Tono) {
  const osc = c.createOscillator()
  const env = c.createGain()
  osc.type = o.type ?? "sine"
  osc.frequency.setValueAtTime(o.freq, t)
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + o.dur * 0.8)
  env.gain.setValueAtTime(0.0001, t)
  env.gain.exponentialRampToValueAtTime(o.gain ?? 0.08, t + (o.attack ?? 0.004))
  env.gain.exponentialRampToValueAtTime(0.0001, t + o.dur)
  osc.connect(env)
  env.connect(out)
  osc.start(t)
  osc.stop(t + o.dur + 0.02)
}

interface Ruido {
  dur: number
  freq: number
  to?: number
  q?: number
  gain?: number
}

function ruido(c: AudioContext, out: AudioNode, t: number, o: Ruido) {
  if (!ruidoBlanco) {
    ruidoBlanco = c.createBuffer(1, Math.floor(c.sampleRate * 0.5), c.sampleRate)
    const datos = ruidoBlanco.getChannelData(0)
    for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1
  }
  const fuente = c.createBufferSource()
  fuente.buffer = ruidoBlanco
  const filtro = c.createBiquadFilter()
  filtro.type = "bandpass"
  filtro.Q.value = o.q ?? 1
  filtro.frequency.setValueAtTime(o.freq, t)
  if (o.to) filtro.frequency.exponentialRampToValueAtTime(o.to, t + o.dur)
  const env = c.createGain()
  env.gain.setValueAtTime(0.0001, t)
  env.gain.exponentialRampToValueAtTime(o.gain ?? 0.15, t + 0.003)
  env.gain.exponentialRampToValueAtTime(0.0001, t + o.dur)
  fuente.connect(filtro)
  filtro.connect(env)
  env.connect(out)
  fuente.start(t)
  fuente.stop(t + o.dur + 0.02)
}

type Sinte = (c: AudioContext, out: AudioNode, t: number) => void

const SINTES: Record<SoundName, Sinte> = {
  tap: (c, o, t) =>
    tono(c, o, t, { freq: 1400, to: 900, dur: 0.06, type: "triangle", gain: 0.09 }),
  pop: (c, o, t) => {
    tono(c, o, t, { freq: 380, to: 920, dur: 0.09, gain: 0.18 })
    tono(c, o, t + 0.01, { freq: 1840, dur: 0.04, gain: 0.03 })
  },
  // Dos cortes de tijera: la marca es recortar
  snip: (c, o, t) => {
    ruido(c, o, t, { dur: 0.025, freq: 4200, q: 3, gain: 0.48 })
    ruido(c, o, t + 0.055, { dur: 0.03, freq: 3600, q: 3, gain: 0.43 })
  },
  "toggle-on": (c, o, t) => {
    tono(c, o, t, { freq: 660, dur: 0.05, type: "triangle", gain: 0.15 })
    tono(c, o, t + 0.055, { freq: 990, dur: 0.07, type: "triangle", gain: 0.15 })
  },
  "toggle-off": (c, o, t) => {
    tono(c, o, t, { freq: 990, dur: 0.05, type: "triangle", gain: 0.14 })
    tono(c, o, t + 0.055, { freq: 660, dur: 0.07, type: "triangle", gain: 0.14 })
  },
  success: (c, o, t) => {
    tono(c, o, t, { freq: 880, dur: 0.22, gain: 0.12 })
    tono(c, o, t + 0.09, { freq: 1318.5, dur: 0.32, gain: 0.11 })
    tono(c, o, t + 0.09, { freq: 2637, dur: 0.12, type: "triangle", gain: 0.016 })
  },
  // Arpegio mayor ascendente (do-mi-sol-do)
  celebrate: (c, o, t) => {
    ;[1046.5, 1318.5, 1568, 2093].forEach((freq, i) => {
      tono(c, o, t + i * 0.07, { freq, dur: 0.3, gain: 0.075 })
      tono(c, o, t + i * 0.07, {
        freq: freq * 2,
        dur: 0.12,
        type: "triangle",
        gain: 0.011,
      })
    })
  },
  error: (c, o, t) => {
    tono(c, o, t, { freq: 311, dur: 0.14, type: "triangle", gain: 0.17 })
    tono(c, o, t + 0.11, { freq: 233, dur: 0.22, type: "triangle", gain: 0.17 })
  },
  remove: (c, o, t) => {
    ruido(c, o, t, { dur: 0.24, freq: 2400, to: 260, q: 0.8, gain: 0.26 })
    tono(c, o, t, { freq: 420, to: 140, dur: 0.2, gain: 0.08 })
  },
}

/** Sonidos de pulsación: los de resultado esperan a que terminen. */
const PULSACION = new Set<SoundName>(["tap", "pop", "snip", "toggle-on", "toggle-off"])
const HUECO_TRAS_PULSACION = 0.11

/**
 * Intervalo mínimo entre dos veces el mismo sonido. Un resultado repetido
 * (pulsar «Probar» tres veces seguidas) se apilaba hasta +7 dB.
 */
const INTERVALO_PULSACION_MS = 60
const INTERVALO_RESULTADO_MS = 250
/** Si el audio tarda más en despertar, el sonido ya no acompaña al gesto. */
const ESPERA_MAXIMA_MS = 150

const ultimaVez = new Map<SoundName, number>()
let finPulsacion = 0

function programar(c: AudioContext, name: SoundName) {
  if (!salida) return
  let t = c.currentTime + 0.005
  if (PULSACION.has(name)) {
    finPulsacion = t + HUECO_TRAS_PULSACION
  } else {
    // «pop» y luego «ding», no los dos a la vez
    t = Math.max(t, finPulsacion)
  }
  SINTES[name](c, salida, t)
}

/**
 * Reproduce un sonido si están activados. Nunca lanza: sin Web Audio (o con
 * el audio bloqueado) la interfaz sigue igual, en silencio.
 */
export function playSound(name: SoundName) {
  if (typeof window === "undefined" || !soundsEnabled()) return

  // Un doble clic no puede sonar como una ráfaga
  const ahora = performance.now()
  const intervalo = PULSACION.has(name) ? INTERVALO_PULSACION_MS : INTERVALO_RESULTADO_MS
  if (ahora - (ultimaVez.get(name) ?? -Infinity) < intervalo) return
  ultimaVez.set(name, ahora)
  window.__clipealoSounds?.push(name)

  try {
    const c = audio()
    if (!c) return
    if (c.state === "running") return programar(c, name)
    // Suspendido: se despierta desde este gesto y suena solo si llega a tiempo.
    // Interrumpido (llamada, otra app con el audio) o cerrado: no se encola
    // nada, o al volver sonaría todo de golpe.
    if (c.state === "suspended") {
      c.resume().then(
        () => {
          if (performance.now() - ahora <= ESPERA_MAXIMA_MS) programar(c, name)
        },
        () => {}
      )
    }
  } catch {
    // Audio no disponible: la acción ya tiene su respuesta visual
  }
}
