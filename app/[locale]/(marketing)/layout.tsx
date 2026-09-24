import { idiomaDe } from "@/i18n/server"
import { IntlZone } from "@/i18n/zone"
import { SiteHeader } from "@/components/marketing/site-header"
import { SiteFooter } from "@/components/marketing/cta"

export default async function MarketingLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const locale = await idiomaDe(params)
  return (
    <IntlZone locale={locale} zone="marketing">
      {/* data-marketing acota los pre-encuadres de los botones (app/motion/acciones.css) */}
      <div data-marketing className="flex min-h-svh flex-col">
        <SiteHeader />
        <main id="contenido" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </div>
    </IntlZone>
  )
}
