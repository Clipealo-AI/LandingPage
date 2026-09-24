import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { DesignSystemShowcase } from "@/components/design-system/showcase"
import { alternates } from "@/i18n/metadata"
import { idiomaDe } from "@/i18n/server"
import { IntlZone } from "@/i18n/zone"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/design-system">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "designSystem.meta" })
  return {
    title: t("title"),
    description: t("description"),
    alternates: alternates("/design-system", locale),
  }
}

export default async function DesignSystemPage({
  params,
}: PageProps<"/[locale]/design-system">) {
  const locale = await idiomaDe(params)
  // El catálogo pinta componentes de todas las zonas: necesita sus textos
  return (
    <IntlZone locale={locale} zone="designSystem">
      <DesignSystemShowcase />
    </IntlZone>
  )
}
