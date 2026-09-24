"use client"

import { useSyncExternalStore } from "react"
import { climateCrisis, dmSans } from "@/app/fuentes"

import "./globals.css"

/**
 * Textos propios: aquí no hay provider de next-intl ni mensajes cargados, y un
 * `import` de los JSON metería los tres idiomas enteros en este archivo.
 */
const TEXTOS = {
  es: {
    lang: "es",
    oops: "Vaya.",
    title: "La aplicación no ha podido arrancar",
    description: "Es un fallo nuestro, no tuyo. Vuelve a intentarlo en unos segundos.",
    reference: "Referencia:",
    retry: "Reintentar",
  },
  en: {
    lang: "en",
    oops: "Oops.",
    title: "The app couldn’t start",
    description: "It’s our fault, not yours. Try again in a few seconds.",
    reference: "Reference:",
    retry: "Try again",
  },
  pt: {
    lang: "pt-BR",
    oops: "Opa.",
    title: "O aplicativo não conseguiu iniciar",
    description: "A falha é nossa, não sua. Tente de novo em alguns segundos.",
    reference: "Referência:",
    retry: "Tentar de novo",
  },
} as const

type Idioma = keyof typeof TEXTOS

/** Idioma según el prefijo de la dirección (`/en/…`, `/pt/…`); sin prefijo, español. */
function idiomaDeLaRuta(): Idioma {
  const segmento = window.location.pathname.split("/")[1]
  return segmento === "en" || segmento === "pt" ? segmento : "es"
}

const sinSuscripcion = () => () => {}

/**
 * Ultimo recurso: solo salta si falla el layout raiz, asi que reemplaza todo el
 * documento y no puede apoyarse en ningun provider ni en el layout.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // En el servidor no hay `window`: español, y al hidratar pasa al de la dirección
  const idioma = useSyncExternalStore(sinSuscripcion, idiomaDeLaRuta, () => "es" as const)
  const t = TEXTOS[idioma]

  return (
    <html lang={t.lang} className={`${climateCrisis.variable} ${dmSans.variable}`}>
      <body className="grid min-h-svh place-content-center gap-6 bg-background px-6 text-center text-foreground antialiased">
        <p className="display text-5xl text-brand">{t.oops}</p>
        <h1 className="text-xl font-bold tracking-tight">{t.title}</h1>
        <p className="mx-auto max-w-md text-sm text-pretty text-muted-foreground">
          {t.description}
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-muted-foreground">
            {t.reference} {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mx-auto rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground"
        >
          {t.retry}
        </button>
      </body>
    </html>
  )
}
