import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { FeatureDirectory } from "@/components/marketing/route-directories"
import { alternates } from "@/i18n/metadata"
import { idiomaDe } from "@/i18n/server"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/funciones">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "routes" })
  return {
    title: t("shared.featureIndexTitle"),
    description: t("shared.featureIndexLead"),
    alternates: alternates("/funciones", locale),
  }
}

export default async function FuncionesPage({
  params,
}: PageProps<"/[locale]/funciones">) {
  const locale = await idiomaDe(params)
  return <FeatureDirectory locale={locale} />
}
