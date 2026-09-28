import { NextIntlClientProvider } from "next-intl"
import { getMessages, setRequestLocale } from "next-intl/server"

import { NAMESPACES_CLIENTE, pickMessages } from "@/i18n/messages"
import type { Locale } from "@/i18n/routing"

/**
 * Textos de una zona para los componentes cliente. Cada layout de grupo lo
 * pone alrededor de su contenido con los espacios de nombres que usa.
 */
export async function IntlZone({
  locale,
  zone,
  children,
}: {
  locale: Locale
  zone: keyof typeof NAMESPACES_CLIENTE
  children: React.ReactNode
}) {
  setRequestLocale(locale)
  const messages = await getMessages()
  return (
    <NextIntlClientProvider messages={pickMessages(messages, NAMESPACES_CLIENTE[zone])}>
      {children}
    </NextIntlClientProvider>
  )
}
