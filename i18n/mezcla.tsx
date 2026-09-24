"use client"

import * as React from "react"
import { NextIntlClientProvider, useLocale, useMessages } from "next-intl"
import type { AbstractIntlMessages } from "next-intl"

/**
 * Une dos juegos de mensajes rama a rama.
 *
 * Tiene que ser en profundidad: el backoffice manda `admin` partido —el tronco
 * en el layout y la sección en la página—, y una copia superficial dejaba el
 * `admin` de la página encima del del layout, así que la pantalla se quedaba
 * sin `admin.table` y sin el resto del tronco.
 */
function unir(base: AbstractIntlMessages, extra: AbstractIntlMessages) {
  const salida: Record<string, unknown> = { ...base }
  for (const [clave, valor] of Object.entries(extra)) {
    const previo = salida[clave]
    salida[clave] =
      esRama(previo) && esRama(valor)
        ? unir(previo as AbstractIntlMessages, valor as AbstractIntlMessages)
        : valor
  }
  return salida as AbstractIntlMessages
}

const esRama = (x: unknown) => !!x && typeof x === "object" && !Array.isArray(x)

/**
 * Añade los textos de una página a los que ya trae su layout.
 *
 * El proveedor de next-intl SUSTITUYE los mensajes del padre en vez de
 * mezclarlos, así que una página que necesite un espacio de nombres más
 * tendría que reenviar también todo el suelo del layout —y el suelo es lo
 * único que el router se guarda entre navegaciones—. Aquí se unen en el
 * navegador: del servidor solo viaja lo que la página añade.
 *
 * El `useMemo` importa: sin él la identidad cambia en cada render y el
 * proveedor rehace sus formateadores.
 */
export function MezclaMensajes({
  extra,
  children,
}: {
  extra: AbstractIntlMessages
  children: React.ReactNode
}) {
  const base = useMessages()
  const locale = useLocale()
  const messages = React.useMemo(() => unir(base, extra), [base, extra])
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
