import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { PRICING_FAQ } from "@/lib/pricing"
import { Cta } from "@/components/marketing/cta"
import { Faq } from "@/components/marketing/faq"
import { PricingPage } from "@/components/marketing/pricing-page"
import { alternates } from "@/i18n/metadata"
import { idiomaDe } from "@/i18n/server"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/precios">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "marketing.pricingPage.meta" })
  return {
    title: t("title"),
    description: t("description"),
    alternates: alternates("/precios", locale),
  }
}

/**
 * Página dedicada de precios: los cuatro planes, la comparativa, las redes,
 * la propuesta Empresarial, las recargas y las preguntas de facturación.
 */
export default async function PreciosPage({ params }: PageProps<"/[locale]/precios">) {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "marketing.pricingPage" })
  const tp = await getTranslations({ locale, namespace: "pricing.faq" })

  return (
    <>
      <PricingPage />
      <Faq
        items={PRICING_FAQ.map((id) => ({ q: tp(`${id}.q`), a: tp(`${id}.a`) }))}
        title={t.rich("faqTitle", { br: () => <br /> })}
      />
      <Cta />
    </>
  )
}
