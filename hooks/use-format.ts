import { useLocale } from "next-intl"

import { getFormat } from "@/lib/format"

/**
 * Formateadores del idioma activo. Sirve en componentes cliente y en componentes
 * de servidor síncronos; en uno `async`, `getFormat(await getLocale())`.
 */
export function useFormat() {
  return getFormat(useLocale())
}
