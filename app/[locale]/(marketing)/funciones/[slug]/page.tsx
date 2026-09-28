import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { FeatureRoutePage } from "@/components/marketing/feature-route-page"
import { alternates } from "@/i18n/metadata"
import { idiomaDe } from "@/i18n/server"
import { featureNavigation } from "@/lib/marketing/navigation"

export function generateStaticParams() {
  return featureNavigation.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/funciones/[slug]">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const { slug } = await params
  const route = featureNavigation.find((item) => item.slug === slug)
  if (!route) return {}

  const t = await getTranslations({ locale, namespace: "marketing.header" })
  const translate = t as unknown as (key: string) => string
  return {
    title: translate(`menuItems.${route.id}.title`),
    description: translate(`menuItems.${route.id}.description`),
    alternates: alternates(`/funciones/${slug}`, locale),
  }
}

export default async function FuncionDetallePage({
  params,
}: PageProps<"/[locale]/funciones/[slug]">) {
  const locale = await idiomaDe(params)
  const { slug } = await params
  if (!featureNavigation.some((item) => item.slug === slug)) notFound()
  return <FeatureRoutePage locale={locale} slug={slug} />
}
