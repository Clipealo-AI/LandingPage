import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { ComingSoon } from "@/components/shared/coming-soon"
import { alternates } from "@/i18n/metadata"
import { idiomaDe } from "@/i18n/server"

/**
 * Slugs de las páginas legales: la ruta interna, en español (se traducen en
 * `i18n/routing.ts`). Título, entradilla y resumen: `marketing.legal.pages.<slug>`.
 */
const PAGINAS = ["privacidad", "terminos", "cookies"] as const

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

  return (
    <div className="container-page py-32 [--container-page:52rem]">
      {/* Cada página necesita su propio h1: `ComingSoon` es el cuerpo, no la cabecera */}
      <header className="space-y-3">
        <p className="text-sm font-semibold tracking-wide text-brand uppercase">
          {t("legal.eyebrow")}
        </p>
        <h1 className="display text-[clamp(2rem,5vw,3rem)]">
          {t(`legal.pages.${slug}.title`)}
        </h1>
        <p className="text-lg text-pretty text-muted-foreground">
          {t(`legal.pages.${slug}.lead`)}
        </p>
      </header>

      <ComingSoon
        title={t("legal.underReview")}
        description={t(`legal.pages.${slug}.description`)}
        backHref="/"
        backLabel={t("actions.backHome")}
      />
    </div>
  )
}
