/** Clave de la preferencia de movimiento leída durante la entrada de página. */
export const CLAVE_MOVIMIENTO = "clipealo-movimiento"

/** Curva de marca para la Web Animations API: la misma que `--ease-brand`. */
export const EASE_BRAND = "cubic-bezier(0.22, 1, 0.36, 1)"

/** El usuario puede reducir animaciones desde `?movimiento=reducido`. */
export function prefiereMenosMovimiento(): boolean {
  if (typeof window === "undefined") return false
  return document.documentElement.dataset.motion === "reduced"
}
