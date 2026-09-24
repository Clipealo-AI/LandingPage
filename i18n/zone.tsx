import { NextIntlClientProvider } from "next-intl"
import { getMessages, setRequestLocale } from "next-intl/server"

import { NAMESPACES_CLIENTE, pickMessages, type ClaveMensajes } from "@/i18n/messages"
import { MezclaMensajes } from "@/i18n/mezcla"
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

/**
 * Los textos que una página necesita ADEMÁS de los de su zona.
 *
 * El suelo de la zona (`IntlZone`) lleva lo que se pinta en todas partes; lo
 * que solo usa una pantalla —las analíticas, el calendario, la formación— se
 * añade aquí, y así el resto de rutas no lo descarga. Lo que hace falta en
 * cada una no se adivina: lo comprueba `tests/unit/zonas-i18n.test.ts`
 * siguiendo los imports de verdad.
 */
export async function IntlExtra({
  ns,
  children,
}: {
  ns: readonly ClaveMensajes[]
  children: React.ReactNode
}) {
  const messages = await getMessages()
  return <MezclaMensajes extra={pickMessages(messages, ns)}>{children}</MezclaMensajes>
}
