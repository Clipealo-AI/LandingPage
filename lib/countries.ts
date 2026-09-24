import type { Locale } from "@/i18n/routing"

/**
 * Países con presencia. Código ISO 3166-1 alfa-2: es la clave de segmentación
 * del backoffice, el país del perfil en Ajustes y lo que pinta la bandera
 * (`components/shared/country-flag.tsx`). Añadir un país es añadirlo aquí y
 * dibujar su bandera.
 */
export const COUNTRY_CODES = [
  "PE",
  "MX",
  "CO",
  "CL",
  "AR",
  "ES",
  "EC",
  "BR",
  "US",
] as const
export type CountryCode = (typeof COUNTRY_CODES)[number]

/** Configuración regional de `Intl` de cada idioma, la misma que `lib/format.ts`. */
const INTL: Record<Locale, string> = {
  es: "es-ES",
  en: "en-US",
  pt: "pt-BR",
}

const nombres = new Map<Locale, Intl.DisplayNames>()

/**
 * Nombre del país en el idioma de la interfaz: «Perú» · «Peru» · «Peru»,
 * «España» · «Spain» · «Espanha». Sale de `Intl.DisplayNames` (CLDR), así que
 * no hay etiquetas a mano que traducir. En un componente, `useCountryName()`
 * de `components/shared/country-flag.tsx`.
 */
const etiquetas = new Map<string, string>()

export function countryName(code: CountryCode, locale: Locale): string {
  // `of()` cuesta ~1,4 µs y la tabla de usuarios lo llama por fila en cada
  // tecla del buscador y por cada comparación al ordenar. El resultado es fijo:
  // con 9 países y 3 idiomas, el mapa entero son 27 entradas
  const clave = `${locale}|${code}`
  const guardado = etiquetas.get(clave)
  if (guardado !== undefined) return guardado

  let formato = nombres.get(locale)
  if (!formato) {
    formato = new Intl.DisplayNames([INTL[locale]], { type: "region" })
    nombres.set(locale, formato)
  }
  const nombre = formato.of(code) ?? code
  etiquetas.set(clave, nombre)
  return nombre
}

/**
 * Nombres en español.
 * @deprecated Solo para datos sin idioma (mocks). En la interfaz,
 * `countryName(code, locale)` o `useCountryName()`.
 */
export const COUNTRY_LABEL = Object.fromEntries(
  COUNTRY_CODES.map((code) => [code, countryName(code, "es")])
) as Record<CountryCode, string>
