import type { Metadata, Viewport } from "next"
import { notFound } from "next/navigation"
import { hasLocale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { climateCrisis, dmSans, geistMono } from "@/app/fuentes"
import { Providers } from "@/components/providers"
import { IntlZone } from "@/i18n/zone"
import { LOCALE_TAG, routing } from "@/i18n/routing"
import { SCRIPT_BANDERA_MOVIMIENTO } from "@/lib/motion"
import { siteConfig } from "@/lib/site"

import "../globals.css"

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}
  const t = await getTranslations({ locale, namespace: "common.meta" })
  const titulo = `${siteConfig.name} — ${t("tagline")}`

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: titulo,
      template: `%s — ${siteConfig.name}`,
    },
    description: t("description"),
    applicationName: siteConfig.name,
    keywords: t("keywords")
      .split(",")
      .map((k) => k.trim()),
    openGraph: {
      type: "website",
      locale: t("ogLocale"),
      url: siteConfig.url,
      siteName: siteConfig.name,
      title: titulo,
      description: t("description"),
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: t("description"),
    },
    // El icono lo resuelve Next desde `app/icon.svg`; no hace falta declararlo.
  }
}

export const viewport: Viewport = {
  // La app arranca en claro aunque el sistema este en oscuro, asi que la barra
  // del navegador usa `paper`: si siguiera a `prefers-color-scheme` quedaria
  // oscura sobre una pagina clara en el caso mas comun.
  themeColor: "#f8fbfe",
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  // El editor usa gestos de pinch sobre la linea de tiempo; no bloqueamos el zoom
  // de pagina porque romperia WCAG 1.4.4.
  maximumScale: 5,
}

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "common" })

  return (
    <html
      lang={LOCALE_TAG[locale]}
      suppressHydrationWarning
      className={`${climateCrisis.variable} ${dmSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col antialiased">
        {/* Marca que hay JavaScript antes del primer pintado. Las animaciones de
            aparicion se ocultan solo detras de esta clase, asi que sin JS (o si
            falla) el contenido se ve igualmente. Despues, la bandera de revision
            `?movimiento=completo|reducido|sistema` (lib/motion.ts): pone
            `data-motion` en <html> para la sesion, sin interfaz visible. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add("js");${SCRIPT_BANDERA_MOVIMIENTO}`,
          }}
        />
        <a
          href="#contenido"
          className="sr-only rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100 focus:ring-ring"
        >
          {t("skipToContent")}
        </a>
        <IntlZone locale={locale} zone="base">
          <Providers>{children}</Providers>
        </IntlZone>
      </body>
    </html>
  )
}
