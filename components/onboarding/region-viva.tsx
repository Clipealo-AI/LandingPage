"use client"

import * as React from "react"

type Anunciar = (texto: string, opciones?: { espera?: number }) => void

const AnunciarContext = React.createContext<Anunciar>(() => {})

/** Espera tras el último cambio antes de anunciar (§5.10): no se lee cada clic. */
export const ESPERA_ANUNCIO_MS = 600

/**
 * Región viva única de `/bienvenida` (`role="status"`), montada en el layout
 * desde el primer pintado. Solo anuncia resultados («12 campañas encajan
 * contigo», «Ya tienes 5…»), 600 ms después del último cambio: un anuncio
 * nuevo cancela el pendiente. Las preguntas no pasan por aquí: están en el
 * `legend` de cada toma.
 */
export function RegionVivaProvider({ children }: { children: React.ReactNode }) {
  const [texto, setTexto] = React.useState("")
  const temporizador = React.useRef<number | undefined>(undefined)
  const cuadro = React.useRef<number | undefined>(undefined)

  const anunciar = React.useCallback<Anunciar>((siguiente, opciones = {}) => {
    window.clearTimeout(temporizador.current)
    window.cancelAnimationFrame(cuadro.current ?? 0)
    temporizador.current = window.setTimeout(() => {
      // Vaciar y volver a escribir: el mismo texto dos veces seguidas también se lee
      setTexto("")
      cuadro.current = window.requestAnimationFrame(() => setTexto(siguiente))
    }, opciones.espera ?? ESPERA_ANUNCIO_MS)
  }, [])

  React.useEffect(
    () => () => {
      window.clearTimeout(temporizador.current)
      window.cancelAnimationFrame(cuadro.current ?? 0)
    },
    []
  )

  return (
    <AnunciarContext.Provider value={anunciar}>
      {children}
      <div
        id="onboarding-estado"
        data-slot="region-viva"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {texto}
      </div>
    </AnunciarContext.Provider>
  )
}

/** Anuncia un resultado en la región viva del layout. */
export const useAnunciar = () => React.useContext(AnunciarContext)
