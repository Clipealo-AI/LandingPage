import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { UseCaseDirectory } from "@/components/marketing/route-directories"
import { alternates } from "@/i18n/metadata"
import { idiomaDe } from "@/i18n/server"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/casos">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "routes" })
  return {
    title: t("shared.caseIndexTitle"),
    description: t("shared.caseIndexLead"),
    alternates: alternates("/casos", locale),
  }
}

export default async function CasosPage({ params }: PageProps<"/[locale]/casos">) {
  const locale = await idiomaDe(params)
  return <UseCaseDirectory locale={locale} />
}
