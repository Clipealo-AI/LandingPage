import { hasLocale } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"

import { routing, type Locale } from "@/i18n/routing"

/**
 * Primera línea de cada página y layout: fija el idioma de la petición para que
 * la ruta siga siendo estática y devuelve el idioma ya tipado.
 */
export async function idiomaDe(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  return locale
}
