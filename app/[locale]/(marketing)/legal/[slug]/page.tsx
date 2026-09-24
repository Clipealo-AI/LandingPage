import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { LegalDocument } from "@/components/marketing/legal-document"
import { alternates } from "@/i18n/metadata"
import { idiomaDe } from "@/i18n/server"
import { loadLegalDocument } from "@/lib/legal-documents"

/**
 * Slugs de las páginas legales: la ruta interna, en español (se traducen en
 * `i18n/routing.ts`). Título, entradilla y resumen: `marketing.legal.pages.<slug>`.
 */
const PAGINAS = ["privacidad", "terminos"] as const

type Slug = (typeof PAGINAS)[number]

function esSlug(slug: string): slug is Slug {
  return (PAGINAS as readonly string[]).includes(slug)
}

export function generateStaticParams() {
  return PAGINAS.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/legal/[slug]">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const { slug } = await params
  const t = await getTranslations({ locale, namespace: "marketing.legal" })
  if (!esSlug(slug)) return { title: t("eyebrow") }
  return {
    title: t(`pages.${slug}.title`),
    description: t(`pages.${slug}.lead`),
    alternates: alternates(`/legal/${slug}`, locale),
  }
}

export default async function LegalPage({ params }: PageProps<"/[locale]/legal/[slug]">) {
  const locale = await idiomaDe(params)
  const { slug } = await params
  if (!esSlug(slug)) notFound()
  const t = await getTranslations({ locale, namespace: "marketing" })

  const document = await loadLegalDocument(locale, slug === "privacidad" ? "privacy" : "terms")

  return (
    <LegalDocument
      document={document}
      eyebrow={t("legal.eyebrow")}
      lead={t(`legal.pages.${slug}.lead`)}
      backLabel={t("actions.backHome")}
    />
  )
}
