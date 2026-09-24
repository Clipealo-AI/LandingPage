import { useLocale } from "next-intl"

import { getFechasZona, getFormat } from "@/lib/format"

/**
 * Formateadores del idioma activo. Sirve en componentes cliente y en componentes
 * de servidor síncronos; en uno `async`, `getFormat(await getLocale())`.
 */
export function useFormat() {
  return getFormat(useLocale())
}

/**
 * Formateadores de fecha atados a una zona horaria: los del Calendario. La zona
 * viene de los ajustes de la cuenta; quien la pinte tiene que decirla en
 * pantalla, porque no es la del navegador de quien mira.
 */
export function useFechasZona(zona: string) {
  return getFechasZona(useLocale(), zona)
}
