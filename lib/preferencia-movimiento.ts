/**
 * Preferencia de movimiento para el JS de efectos, sin nada de la landing.
 *
 * Aparte de `lib/motion.ts` a propósito: `lib/effects.ts` (la pulsación y los
 * avisos de toda la aplicación) solo necesita esto, y así el código de los
 * grupos «al entrar en pantalla» no viaja a las páginas que no lo usan.
 * `lib/motion.ts` lo reexporta: el contrato sigue siendo `@/lib/motion`.
 */

/** Curva de marca para la Web Animations API: la misma que `--ease-brand`. */
export const EASE_BRAND = "cubic-bezier(0.22, 1, 0.36, 1)"

/** Clave de `localStorage` de la preferencia de movimiento. */
export const CLAVE_MOVIMIENTO = "clipealo-movimiento"

/** Valores de la preferencia guardada (Ajustes › Perfil y `?movimiento=`). */
export const MOVIMIENTOS = ["completo", "reducido"] as const
export type Movimiento = (typeof MOVIMIENTOS)[number]

/** El de por defecto: se anima del todo aunque el sistema pida menos movimiento. */
export const MOVIMIENTO_POR_DEFECTO: Movimiento = "completo"

/**
 * ¿Hay que reducir el movimiento? Manda la preferencia guardada del usuario,
 * que el script de arranque deja en `data-motion` antes del primer pintado
 * (`reduced` solo si la eligió). La del sistema ya no decide: desde el 15 sep
 * 2026 el movimiento completo es el de por defecto y quien quiera menos lo
 * baja en Ajustes › Perfil. Para el JS de efectos; el CSS usa `@variant reduced`.
 */
export function prefiereMenosMovimiento(): boolean {
  if (typeof window === "undefined") return false
  return document.documentElement.dataset.motion === "reduced"
}

/** Preferencia guardada; sin nada guardado, la de por defecto. */
export function leerMovimiento(): Movimiento {
  if (typeof window === "undefined") return MOVIMIENTO_POR_DEFECTO
  try {
    const v = window.localStorage.getItem(CLAVE_MOVIMIENTO)
    return v === "reducido" || v === "completo" ? v : MOVIMIENTO_POR_DEFECTO
  } catch {
    return MOVIMIENTO_POR_DEFECTO
  }
}

/**
 * Guarda la preferencia y la aplica al momento (sin recargar). Devuelve si se
 * pudo guardar: en un navegador sin almacenamiento el cambio vale para la
 * pestaña, pero no se recuerda.
 */
export function guardarMovimiento(valor: Movimiento): boolean {
  if (typeof window === "undefined") return false
  aplicarMovimiento(valor)
  window.dispatchEvent(new Event(EVENTO_MOVIMIENTO))
  try {
    window.localStorage.setItem(CLAVE_MOVIMIENTO, valor)
    return true
  } catch {
    return false
  }
}

/**
 * Deja la preferencia en `<html data-motion>`, de donde cuelgan el CSS
 * (`:root[data-motion="reduced"]`, `@variant reduced`) y `prefiereMenosMovimiento()`.
 *
 * Es una función aparte porque también hay que llamarla cuando el cambio llega
 * de OTRA pestaña: el evento `storage` despertaba al lector y el radio de
 * Ajustes cambiaba, pero nadie tocaba el atributo, así que en esa pestaña el
 * movimiento seguía como estaba.
 */
export function aplicarMovimiento(valor: Movimiento) {
  document.documentElement.dataset.motion = valor === "reducido" ? "reduced" : "full"
}

/** Cambio de preferencia en esta pestaña (el de otras llega por `storage`). */
export const EVENTO_MOVIMIENTO = "clipealo:movimiento"
