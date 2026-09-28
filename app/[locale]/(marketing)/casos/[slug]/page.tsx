import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { UseCaseRoutePage } from "@/components/marketing/use-case-route-page"
import { alternates } from "@/i18n/metadata"
import { idiomaDe } from "@/i18n/server"
import { useCaseNavigation } from "@/lib/marketing/navigation"

export function generateStaticParams() {
  return useCaseNavigation.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/casos/[slug]">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const { slug } = await params
  const route = useCaseNavigation.find((item) => item.slug === slug)
  if (!route) return {}

  const t = await getTranslations({ locale, namespace: "marketing.header" })
  const translate = t as unknown as (key: string) => string
  return {
    title: translate(`menuItems.${route.id}.title`),
    description: translate(`menuItems.${route.id}.description`),
    alternates: alternates(`/casos/${slug}`, locale),
  }
}

export default async function CasoDetallePage({
  params,
}: PageProps<"/[locale]/casos/[slug]">) {
  const locale = await idiomaDe(params)
  const { slug } = await params
  if (!useCaseNavigation.some((item) => item.slug === slug)) notFound()
  return <UseCaseRoutePage locale={locale} slug={slug} />
}
