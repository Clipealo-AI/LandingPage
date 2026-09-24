import { idiomaDe } from "@/i18n/server"
import { IntlZone } from "@/i18n/zone"
import { RegionVivaProvider } from "@/components/onboarding/region-viva"

/**
 * «Tu primer corte» (`/bienvenida`): fuera de `(app)` para no cargar la barra
 * lateral. Zona de mensajes `onboarding` (con `taxonomy` y `campaigns`) y la
 * región viva única (`role="status"`), montada desde el primer pintado.
 */
export default async function OnboardingLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const locale = await idiomaDe(params)
  return (
    <IntlZone locale={locale} zone="onboarding">
      <RegionVivaProvider>{children}</RegionVivaProvider>
    </IntlZone>
  )
}
