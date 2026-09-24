import { toast as sonner, type ExternalToast } from "sonner"

import { burst, shake } from "@/lib/effects"
import { playSound, type SoundName } from "@/lib/sound"

/**
 * Avisos con sonido.
 *
 * El mismo `toast` de sonner, pero cada variante suena como lo que significa:
 * `success` con un «ding», `error` con un aviso grave y una sacudida, y
 * `celebrate` (nueva) con un arpegio y confeti de esquinas de recorte para los
 * hitos. El `toast(...)` neutro no suena: informa, no premia.
 *
 * `sound` en las opciones cambia el sonido de un aviso concreto (`"remove"`
 * al borrar, `"snip"` al recortar) o lo quita con `false`.
 */

type Mensaje = Parameters<typeof sonner.success>[0]
export type ToastOptions = ExternalToast & { sound?: SoundName | false }
type Mostrar = (mensaje: Mensaje, opciones?: ToastOptions) => string | number

const SELECTOR_AVISO = "[data-sonner-toast]"

/** Tope de espera a que el aviso termine de entrar (sonner tarda 400 ms). */
const ESPERA_ENTRADA_MS = 700

/**
 * Espera a que sonner monte el aviso nuevo y a que termine de deslizarse, y se
 * lo pasa a `hacer`. Se ignoran los que ya estaban en pantalla: con un aviso
 * anterior aún visible, «el de delante» sería el viejo durante un par de
 * fotogramas. Y se espera a la entrada porque, a mitad de ella, el aviso está
 * todavía por debajo del borde: el confeti salía fuera de la pantalla.
 */
function alMontarse(previos: Set<Element>, hacer: (toast: HTMLElement) => void) {
  let intentos = 0
  const buscar = () => {
    const nuevo = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR_AVISO)).find(
      (el) => !previos.has(el) && el.dataset.mounted === "true"
    )
    if (!nuevo) {
      if (++intentos < 30) requestAnimationFrame(buscar)
      return
    }
    // La transición de entrada arranca en el fotograma siguiente al montaje
    requestAnimationFrame(() => {
      const entradas = nuevo.getAnimations().map((a) => a.finished.catch(() => undefined))
      const tope = new Promise((listo) => setTimeout(listo, ESPERA_ENTRADA_MS))
      void Promise.race([Promise.all(entradas), tope]).then(() => {
        if (nuevo.isConnected) hacer(nuevo)
      })
    })
  }
  requestAnimationFrame(buscar)
}

function variante(
  mostrar: (mensaje: Mensaje, opciones?: ExternalToast) => string | number,
  sonidoPorDefecto: SoundName | null,
  efecto?: (toast: HTMLElement, sonido: SoundName | null) => void
): Mostrar {
  return (mensaje, opciones = {}) => {
    const { sound, ...resto } = opciones
    const sonido = sound === undefined ? sonidoPorDefecto : sound || null
    if (sonido) playSound(sonido)
    const previos =
      efecto && typeof document !== "undefined"
        ? new Set<Element>(document.querySelectorAll(SELECTOR_AVISO))
        : null
    const id = mostrar(mensaje, resto)
    if (efecto && previos) alMontarse(previos, (el) => efecto(el, sonido))
    return id
  }
}

const neutro = variante((m, o) => sonner(m, o), null)

export const toast = Object.assign(neutro, sonner, {
  success: variante(sonner.success, "success"),
  info: variante(sonner.info, null),
  // Un aviso no es un fallo: sin sonido, para que «error» siga significando algo
  warning: variante(sonner.warning, null),
  // La sacudida acompaña al sonido de error, no a un borrado con estilo rojo
  error: variante(sonner.error, "error", (el, sonido) => sonido === "error" && shake(el)),
  /** Hitos: arpegio y confeti saliendo del icono del aviso. */
  celebrate: variante(sonner.success, "celebrate", (el) =>
    burst(el.querySelector("[data-icon]") ?? el)
  ),
}) as Omit<typeof sonner, "success" | "info" | "warning" | "error"> &
  Mostrar & {
    success: Mostrar
    info: Mostrar
    warning: Mostrar
    error: Mostrar
    celebrate: Mostrar
  }
