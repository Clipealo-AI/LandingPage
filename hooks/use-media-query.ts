"use client"

import * as React from "react"

/**
 * Media query segura en servidor.
 *
 * `useSyncExternalStore` permite declarar por separado lo que ve el servidor
 * (`getServerSnapshot`) y lo que ve el navegador. React usa el primero al
 * hidratar y vuelve a renderizar despues si difieren, sin el aviso de
 * "hydration mismatch" que provoca leer `matchMedia` directamente en el render.
 */
export function useMediaQuery(query: string, serverValue = false) {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    },
    [query]
  )

  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue
  )
}

/**
 * @deprecated Usa `prefiereMenosMovimiento()` de `@/lib/motion`: conoce la
 * bandera `?movimiento=` y, al leerse en efectos y manejadores, no rompe la
 * hidratacion. Ya no lo usa nadie en el proyecto.
 *
 * Version segura de `useReducedMotion` de Motion.
 *
 * La de Motion lee la media query durante el render, asi que en una pagina
 * renderizada en servidor devuelve `false` en el servidor y el valor real en el
 * cliente: cualquier `initial` o `style` que dependa de ella rompe la
 * hidratacion en cuanto el usuario tiene el ajuste activado.
 */
export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)")
}
