import { render, type RenderOptions } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"

import type { Locale } from "@/i18n/routing"
import es from "@/messages/es"
import en from "@/messages/en"
import pt from "@/messages/pt"

const MENSAJES = { es, en, pt } as const

/** `render` con los textos del idioma: cualquier componente con `useTranslations` lo necesita. */
export function renderConIdioma(
  ui: React.ReactElement,
  { locale = "es", ...options }: RenderOptions & { locale?: Locale } = {}
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <NextIntlClientProvider locale={locale} messages={MENSAJES[locale]}>
        {children}
      </NextIntlClientProvider>
    ),
    ...options,
  })
}
